// Unit tests for scripts/ci/new-vitest-failures.mjs. Run with:
//   node --test scripts/ci/
// (Named test_*.mjs, not *.test.mjs, so vitest's default include does not
// collect this node:test file.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  parseChanges, importSpecifiers, resolveImport, affectedTests, chunk,
  parseVitestReport, chunkResults, compareRuns, FILE_ERROR, INCOMPLETE, UNHANDLED, sideChunks, runAll, main,
} from './new-vitest-failures.mjs';

// ---------------------------------------------------------------- affected files

const z = (...entries) => entries.flat().join('\0') + '\0';

test('parseChanges: statuses, renames and deletions from --name-status -z', () => {
  const c = parseChanges(z(['M', 'src/a.ts'], ['A', 'src/new.ts'], ['D', 'src/gone.ts'], ['R087', 'src/old.ts', 'src/moved.ts']));
  assert.deepEqual(c, [
    { status: 'M', oldPath: 'src/a.ts', path: 'src/a.ts' },
    { status: 'A', oldPath: null, path: 'src/new.ts' },
    { status: 'D', oldPath: 'src/gone.ts', path: 'src/gone.ts' },
    { status: 'R', oldPath: 'src/old.ts', path: 'src/moved.ts' },
  ]);
});

test('importSpecifiers: import/export/require/dynamic import/vi.mock; query stripped', () => {
  const src = `import a from '@/lib/a';\nimport { b } from "./b";\nexport * from '../c';\nimport './side.css';
const d = await import('@/d'); const e = require('./e'); vi.mock('@/api/f', () => ({}));
import raw from './g.svg?raw';`;
  assert.deepEqual(importSpecifiers(src), ['@/lib/a', './b', '../c', './side.css', '@/d', './e', '@/api/f', './g.svg']);
});

test('resolveImport: @/ alias, relative, extensionless and index; packages ignored', () => {
  const known = new Set(['src/lib/a.ts', 'src/ui/Button.tsx', 'src/ui/index.ts', 'src/data/x.json']);
  assert.equal(resolveImport('@/lib/a', 'src/tests/t.test.ts', known), 'src/lib/a.ts');
  assert.equal(resolveImport('./Button', 'src/ui/Other.tsx', known), 'src/ui/Button.tsx');
  assert.equal(resolveImport('../ui', 'src/lib/a.ts', known), 'src/ui/index.ts');
  assert.equal(resolveImport('@/data/x.json', 'src/a.ts', known), 'src/data/x.json');
  assert.equal(resolveImport('react', 'src/a.ts', known), null);
  assert.equal(resolveImport('@/missing', 'src/a.ts', known), null);
});

// util <- hook <- Page <- Page.test ; util <- util.test ; other.test unrelated
const SOURCES = {
  'src/utils/util.ts': 'export const u = 1;',
  'src/hooks/useThing.ts': "import { u } from '@/utils/util';",
  'src/app/Page.tsx': "import useThing from '../hooks/useThing';",
  'src/tests/unit/Page.test.tsx': "import Page from '@/app/Page';",
  'src/tests/unit/util.test.ts': "import { u } from '@/utils/util';",
  'src/tests/unit/other.test.ts': "import x from '@/other';",
  'src/other.ts': '',
  'src/tests/e2e/flow.spec.ts': "import { u } from '@/utils/util';",
};
const TRACKED = Object.keys(SOURCES);
const read = (f) => SOURCES[f] ?? '';

test('affected: transitive importers of a changed file, nearest first; e2e specs excluded', () => {
  const a = affectedTests(parseChanges(z(['M', 'src/utils/util.ts'])), TRACKED, read);
  assert.deepEqual(a.run, ['src/tests/unit/util.test.ts', 'src/tests/unit/Page.test.tsx']);
  assert.deepEqual([a.notRun, a.narrowed, a.globalInputs], [[], false, []]);
});

test('affected: a changed test file runs itself', () => {
  assert.deepEqual(affectedTests(parseChanges(z(['M', 'src/tests/unit/other.test.ts'])), TRACKED, read).run,
    ['src/tests/unit/other.test.ts']);
});

test('affected: importers of a deleted or renamed-away file are affected', () => {
  const tracked = TRACKED.filter((f) => f !== 'src/utils/util.ts');
  assert.deepEqual(affectedTests(parseChanges(z(['D', 'src/utils/util.ts'])), tracked, read).run,
    ['src/tests/unit/util.test.ts', 'src/tests/unit/Page.test.tsx']);
  assert.deepEqual(affectedTests(parseChanges(z(['R100', 'src/utils/util.ts', 'src/utils/u2.ts'])), [...tracked, 'src/utils/u2.ts'], read).run,
    ['src/tests/unit/util.test.ts', 'src/tests/unit/Page.test.tsx']);
});

test('affected: over the cap narrows to direct importers, then truncates and reports the rest', () => {
  const changes = parseChanges(z(['M', 'src/utils/util.ts'], ['M', 'src/tests/unit/other.test.ts']));
  const narrowed = affectedTests(changes, TRACKED, read, 2);
  assert.deepEqual(narrowed.run, ['src/tests/unit/other.test.ts', 'src/tests/unit/util.test.ts']);
  // Page.test reaches util.ts only indirectly: narrowed out, so it is listed as NOT RUN.
  assert.deepEqual([narrowed.notRun, narrowed.narrowed], [['src/tests/unit/Page.test.tsx'], true]);
  const cut = affectedTests(changes, TRACKED, read, 1);
  assert.deepEqual([cut.run, cut.notRun], [['src/tests/unit/other.test.ts'], ['src/tests/unit/util.test.ts', 'src/tests/unit/Page.test.tsx']]);
  const wide = affectedTests(changes, TRACKED, read, 3); // not over the cap: nothing narrowed out
  assert.deepEqual([wide.notRun, wide.narrowed], [[], false]);
});

test('affected: within a depth, a test named after a changed file is kept first under the cap', () => {
  const sources = { 'src/lib/mapper.ts': '', 'src/tests/a/aaa.test.ts': "import '@/lib/mapper';", 'src/tests/z/mapper.test.ts': "import '@/lib/mapper';" };
  const a = affectedTests(parseChanges(z(['M', 'src/lib/mapper.ts'])), Object.keys(sources), (f) => sources[f], 1);
  assert.deepEqual([a.run, a.notRun], [['src/tests/z/mapper.test.ts'], ['src/tests/a/aaa.test.ts']]);
});

test('affected: a changed file the vitest setup imports (transitively) is a global input', () => {
  const sources = { ...SOURCES, 'vitest.setup.ts': "const { handlers } = await import('./src/tests/shared/handlers');",
    'src/tests/shared/handlers.ts': "import { u } from '@/utils/util';", 'src/setup2.ts': "import '@/utils/util';" };
  const tracked = Object.keys(sources);
  const rd = (f) => sources[f];
  assert.deepEqual(affectedTests(parseChanges(z(['M', 'src/tests/shared/handlers.ts'])), tracked, rd).globalInputs,
    ['vitest.setup.ts (imports a changed file)']);
  // other setupFiles (from vitest.config) count too; a file no setup imports does not
  assert.deepEqual(affectedTests(parseChanges(z(['M', 'src/utils/util.ts'])), tracked, rd, 40, ['src/setup2.ts']).globalInputs,
    ['src/setup2.ts (imports a changed file)', 'vitest.setup.ts (imports a changed file)']);
  assert.deepEqual(affectedTests(parseChanges(z(['M', 'src/other.ts'])), tracked, rd).globalInputs, []);
});

test('affected: a global test input is reported', () => {
  assert.deepEqual(affectedTests(parseChanges(z(['M', 'vitest.setup.ts'], ['M', 'package-lock.json'])), TRACKED, read).globalInputs,
    ['vitest.setup.ts', 'package-lock.json']);
});

// ---------------------------------------------------------------- vitest reports

const ROOT = '/work/repo';
const assertion = (title, status, ancestors = ['Suite'], msg = 'expected 1 to be 2') => ({
  ancestorTitles: ancestors, title, status, failureMessages: status === 'failed' ? [`${msg}\n    at x`] : [], location: status === 'failed' ? { line: 7, column: 3 } : null,
});
const fileResult = (file, assertionResults, extra = {}) => ({
  name: path.join(ROOT, file), status: assertionResults.some((a) => a.status === 'failed') ? 'failed' : 'passed', message: '', assertionResults, ...extra,
});

test('parseVitestReport: failed/passed ids, duplicates, load errors, missing files', () => {
  const report = { testResults: [
    fileResult('src/a.test.ts', [assertion('works', 'passed'), assertion('breaks', 'failed'), assertion('breaks', 'failed'), assertion('later', 'skipped')]),
    fileResult('src/b.test.ts', [], { status: 'failed', message: 'Failed to resolve import "@/gone"' }),
    fileResult('src/unwanted.test.ts', [assertion('x', 'failed')]),
  ] };
  const r = parseVitestReport(report, ROOT, ['src/a.test.ts', 'src/b.test.ts', 'src/c.test.ts']);
  assert.deepEqual(Object.keys(r).sort(), ['src/a.test.ts', 'src/b.test.ts', 'src/c.test.ts']);
  assert.deepEqual(r['src/a.test.ts'].passed, ['Suite > works']);
  assert.deepEqual(Object.keys(r['src/a.test.ts'].failed), ['Suite > breaks', 'Suite > breaks [2]']);
  assert.deepEqual(r['src/a.test.ts'].failed['Suite > breaks'], { message: 'expected 1 to be 2', line: 7 });
  assert.deepEqual(Object.keys(r['src/b.test.ts'].failed), [FILE_ERROR]);
  assert.deepEqual(Object.keys(r['src/c.test.ts'].failed), [INCOMPLETE]);
});

test('chunkResults: a timed-out chunk marks every file incomplete, even with a stale report', () => {
  const files = ['src/a.test.ts', 'src/b.test.ts'];
  const stale = JSON.stringify({ testResults: [fileResult('src/a.test.ts', [assertion('ok', 'passed')])] });
  const r = chunkResults(files, { timedOut: true, seconds: 300, code: null, signal: 'SIGKILL' }, stale, ROOT);
  for (const f of files) assert.match(r[f].failed[INCOMPLETE].message, /timed out after 300s/);
  const crashed = chunkResults(files, { timedOut: false, code: 1 }, '', ROOT);
  for (const f of files) assert.match(crashed[f].failed[INCOMPLETE].message, /exited 1 without a JSON report/);
});

test('chunkResults: a non-zero exit with an all-passing report (unhandled error) is not a pass', () => {
  const passing = JSON.stringify({ success: true, testResults: [fileResult('src/a.test.ts', [assertion('ok', 'passed')])] });
  const r = chunkResults(['src/a.test.ts'], { timedOut: false, code: 1 }, passing, ROOT);
  assert.match(r['src/a.test.ts'].failed[INCOMPLETE].message, /exited 1 \(unhandled error\?\)/);
  assert.deepEqual(r['src/a.test.ts'].passed, ['Suite > ok']);
  const failing = JSON.stringify({ success: false, testResults: [fileResult('src/a.test.ts', [assertion('bad', 'failed')])] });
  assert.deepEqual(Object.keys(chunkResults(['src/a.test.ts'], { timedOut: false, code: 1 }, failing, ROOT)['src/a.test.ts'].failed), ['Suite > bad']);
  assert.deepEqual(Object.keys(chunkResults(['src/a.test.ts'], { timedOut: false, code: 0 }, passing, ROOT)['src/a.test.ts'].failed), []);
});

const UNHANDLED_LOG = `\u001b[31m⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯\u001b[39m\nError: boom\nThis error originated in "src/b.test.ts" test file. It doesn't mean ...
 ⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯\nVitest caught 1 unhandled error during the test run.\n`;

test('chunkResults: an unhandled error is charged to its file even when the chunk also has an ordinary failure', () => {
  const files = ['src/a.test.ts', 'src/b.test.ts'];
  const rep = JSON.stringify({ success: false, testResults: [fileResult('src/a.test.ts', [assertion('bad', 'failed')]), fileResult('src/b.test.ts', [assertion('ok', 'passed')])] });
  const r = chunkResults(files, { timedOut: false, code: 1, log: UNHANDLED_LOG }, rep, ROOT);
  assert.deepEqual([Object.keys(r['src/a.test.ts'].failed), Object.keys(r['src/b.test.ts'].failed)], [['Suite > bad'], [UNHANDLED]]);
  // control: the same chunk without the banner has only the ordinary failure
  const clean = chunkResults(files, { timedOut: false, code: 1, log: 'FAIL src/a.test.ts > bad' }, rep, ROOT);
  assert.deepEqual(Object.keys(clean['src/b.test.ts'].failed), []);
  // an unhandled error vitest does not attribute to a file in the chunk is charged to every file in it
  const anon = chunkResults(files, { timedOut: false, code: 1, log: 'Vitest caught 2 unhandled errors during the test run.' }, rep, ROOT);
  assert.ok(UNHANDLED in anon['src/a.test.ts'].failed && UNHANDLED in anon['src/b.test.ts'].failed);
  // a new unhandled error is a new failure; one that also happens on base is not
  const head = { files: r };
  assert.deepEqual(compareRuns(head, { files: clean }).newFailures.map((f) => [f.file, f.test]), [['src/b.test.ts', UNHANDLED]]);
  assert.deepEqual(compareRuns(head, { files: r }).newFailures, []);
});

test('sideChunks: base uses the head chunks, mapped through renames, dropping files absent on base', () => {
  const changes = parseChanges(z(['A', 'src/new.test.ts'], ['R090', 'src/old.test.ts', 'src/moved.test.ts']));
  const onBase = new Set(['src/a.test.ts', 'src/old.test.ts', 'src/c.test.ts']);
  assert.deepEqual(sideChunks(['src/a.test.ts', 'src/new.test.ts', 'src/moved.test.ts', 'src/c.test.ts'], changes, 2, (p) => onBase.has(p)),
    [[['src/a.test.ts', 'src/a.test.ts']], [['src/old.test.ts', 'src/moved.test.ts'], ['src/c.test.ts', 'src/c.test.ts']]]);
  assert.deepEqual(sideChunks(['src/a.test.ts', 'src/new.test.ts'], [], 2, () => true), [[['src/a.test.ts', 'src/a.test.ts'], ['src/new.test.ts', 'src/new.test.ts']]]);
});

test('run: a spent time budget marks the remaining files incomplete without running them', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nvf-'));
  const tests = path.join(dir, 't.txt');
  writeFileSync(tests, 'src/a.test.ts\nsrc/b.test.ts\n');
  writeFileSync(path.join(dir, 'c.z'), '');
  for (const f of ['src/a.test.ts', 'src/b.test.ts']) { mkdirSync(path.join(dir, 'src'), { recursive: true }); writeFileSync(path.join(dir, f), ''); }
  const calls = [];
  const runner = async (root, files) => { calls.push(files); return { code: 0, timedOut: false, seconds: 0, log: '' }; };
  await runAll({ root: dir, tests, out: path.join(dir, 'r.json'), budget: '0' }, () => {}, runner);
  const r = JSON.parse(readFileSync(path.join(dir, 'r.json'), 'utf8'));
  assert.deepEqual(calls, []);
  assert.deepEqual(Object.keys(r.files['src/b.test.ts'].failed), ['(not run: head time budget spent)']);
  // a file skipped on BOTH sides must not match itself and pass: it is new (codex review)
  await runAll({ root: dir, tests, out: path.join(dir, 'b.json'), budget: '0', side: 'base', changes: path.join(dir, 'c.z') }, () => {}, runner);
  const b = JSON.parse(readFileSync(path.join(dir, 'b.json'), 'utf8'));
  assert.equal(compareRuns(r, b).newFailures.length, 2);
  await runAll({ root: dir, tests, out: path.join(dir, 'r2.json'), budget: '600' }, () => {}, runner); // control
  assert.deepEqual(calls, [['src/a.test.ts', 'src/b.test.ts']]);
});

test('chunk: splits in order', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

// ---------------------------------------------------------------- comparison

const side = (files) => ({ files, chunks: [] });
const ok = (passed = [], failed = []) => ({ passed, failed: Object.fromEntries(failed.map((t) => [t, { message: `${t} failed`, line: 3 }])) });

test('compare: a test passing on base and failing on head is new', () => {
  const r = compareRuns(side({ 'src/a.test.ts': ok([], ['T1']) }), side({ 'src/a.test.ts': ok(['T1']) }));
  assert.deepEqual(r.newFailures.map((f) => [f.file, f.test, f.base]), [['src/a.test.ts', 'T1', 'passed']]);
  assert.deepEqual([r.stillFailing, r.fixed], [[], []]);
});

test('compare: a test already failing on base is not new', () => {
  const r = compareRuns(side({ 'src/a.test.ts': ok(['T2'], ['T1']) }), side({ 'src/a.test.ts': ok(['T2'], ['T1']) }));
  assert.deepEqual(r.newFailures, []);
  assert.deepEqual(r.stillFailing.map((f) => f.test), ['T1']);
});

test('compare: a test failing on base and passing on head is reported fixed', () => {
  const r = compareRuns(side({ 'src/a.test.ts': ok(['T1']) }), side({ 'src/a.test.ts': ok([], ['T1']) }));
  assert.deepEqual([r.newFailures, r.fixed.map((f) => f.test)], [[], ['T1']]);
});

test('compare: a failing test that did not exist on base (new test, skipped before) is new', () => {
  const r = compareRuns(side({ 'src/a.test.ts': ok([], ['NEW', 'WAS_SKIPPED']) }), side({ 'src/a.test.ts': ok(['OTHER']) }));
  assert.deepEqual(r.newFailures.map((f) => [f.test, f.base]), [['NEW', 'absent or skipped'], ['WAS_SKIPPED', 'absent or skipped']]);
});

test('compare: a new test file that fails is a new failure', () => {
  const r = compareRuns(side({ 'src/new.test.ts': ok(['fine'], ['broken']) }), side({}));
  assert.deepEqual(r.newFailures.map((f) => [f.file, f.test, f.base]), [['src/new.test.ts', 'broken', 'not on base']]);
});

test('compare: a head timeout is a new failure unless the base timed out on that file too', () => {
  const timeout = { passed: [], failed: { [INCOMPLETE]: { message: 'chunk timed out after 300s', line: null } } };
  const fresh = compareRuns(side({ 'src/a.test.ts': timeout }), side({ 'src/a.test.ts': ok(['T1']) }));
  assert.deepEqual(fresh.newFailures.map((f) => [f.test, f.message]), [[INCOMPLETE, 'chunk timed out after 300s']]);
  const both = compareRuns(side({ 'src/a.test.ts': timeout }), side({ 'src/a.test.ts': timeout }));
  assert.deepEqual([both.newFailures, both.stillFailing.map((f) => f.test)], [[], [INCOMPLETE]]);
});

test('compare: when the base run did not complete, head failures count as new (fail-closed)', () => {
  const baseTimeout = { passed: [], failed: { [INCOMPLETE]: { message: 'timed out', line: null } } };
  const r = compareRuns(side({ 'src/a.test.ts': ok(['T2'], ['T1']) }), side({ 'src/a.test.ts': baseTimeout }));
  assert.deepEqual(r.newFailures.map((f) => [f.test, f.base]), [['T1', 'base did not complete']]);
});

test('compare: a file that newly fails to load is new; one that failed to load on base too is not', () => {
  const loadErr = { passed: [], failed: { [FILE_ERROR]: { message: 'Failed to resolve import', line: null } } };
  assert.equal(compareRuns(side({ 'src/a.test.ts': loadErr }), side({ 'src/a.test.ts': ok(['T1']) })).newFailures.length, 1);
  assert.equal(compareRuns(side({ 'src/a.test.ts': loadErr }), side({ 'src/a.test.ts': loadErr })).newFailures.length, 0);
});

// ---------------------------------------------------------------- CLI

async function run(args, env = {}) {
  const lines = [];
  const saved = process.env.GITHUB_STEP_SUMMARY;
  if ('GITHUB_STEP_SUMMARY' in env) process.env.GITHUB_STEP_SUMMARY = env.GITHUB_STEP_SUMMARY;
  else delete process.env.GITHUB_STEP_SUMMARY;
  try {
    return { code: await main(args, (l) => lines.push(l)), lines };
  } finally {
    if (saved === undefined) delete process.env.GITHUB_STEP_SUMMARY; else process.env.GITHUB_STEP_SUMMARY = saved;
  }
}

test('cli compare: exit 1 with annotations and summary tables; --advisory exits 0 with warnings', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nvf-'));
  const w = (name, body) => { const p = path.join(dir, name); writeFileSync(p, typeof body === 'string' ? body : JSON.stringify(body)); return p; };
  const head = w('head.json', { files: { 'src/a.test.ts': ok(['FIXED'], ['NEW', 'OLD']) }, chunks: [{ files: ['src/a.test.ts'], timedOut: false }] });
  const base = w('base.json', { files: { 'src/a.test.ts': ok(['NEW'], ['OLD', 'FIXED']) }, chunks: [{ files: ['src/a.test.ts'], timedOut: true }] });
  const summary = w('summary.md', '');
  const r = await run(['compare', '--head', head, '--base', base], { GITHUB_STEP_SUMMARY: summary });
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => l.startsWith('::error file=src/a.test.ts,line=3,title=New unit test failure%3A NEW::')));
  const md = readFileSync(summary, 'utf8');
  assert.match(md, /\| New failures \(fail on head, not on base\) \| 1 \|/);
  assert.match(md, /\| Still failing on base too \(not blocking\) \| 1 \|/);
  assert.match(md, /\| Fixed \(fail on base, pass on head\) \| 1 \|/);
  assert.match(md, /1 chunk\(s\) timed out\*\* \(base: src\/a.test.ts\)/);
  const draft = await run(['compare', '--head', head, '--base', base, '--advisory']);
  assert.equal(draft.code, 0);
  assert.ok(draft.lines.some((l) => l.startsWith('::warning file=src/a.test.ts')));
  const clean = await run(['compare', '--head', base, '--base', base]); // only still-failing tests
  assert.equal(clean.code, 0);
});
