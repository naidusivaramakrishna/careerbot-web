// Unit tests for scripts/ci/new-lint-errors.mjs. Run with:
//   node --test scripts/ci/
// (Named test_*.mjs, not *.test.mjs, so vitest's default include does not
// collect this node:test file.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { parseDiff, parseTsc, newEslintErrors, newTscErrors, annotation, canonicalMessage, main } from './new-lint-errors.mjs';

const DIFF = `diff --git a/src/api/chat.ts b/src/api/chat.ts
index 1111111..2222222 100644
--- a/src/api/chat.ts
+++ b/src/api/chat.ts
@@ -10,0 +11,3 @@ export function a() {
+const x: any = 1;
+const y: any = 2;
+const z = 3;
@@ -40 +43 @@ export function b() {
-old
+new
@@ -50,2 +52,0 @@ function c() {
-gone
-gone2
diff --git a/src/new.tsx b/src/new.tsx
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/new.tsx
@@ -0,0 +1,2 @@
+export const A = 1;
+export const B: any = 2;
diff --git a/src/old/name.ts b/src/lib/name.ts
similarity index 90%
rename from src/old/name.ts
rename to src/lib/name.ts
index 4444444..5555555 100644
--- a/src/old/name.ts
+++ b/src/lib/name.ts
@@ -5 +5 @@
-a
+b
diff --git a/src/pure/move.ts b/src/moved/move.ts
similarity index 100%
rename from src/pure/move.ts
rename to src/moved/move.ts
diff --git "a/src/we\\303\\251ird name.ts" "b/src/we\\303\\251ird name.ts"
index 6666666..7777777 100644
--- "a/src/we\\303\\251ird name.ts"
+++ "b/src/we\\303\\251ird name.ts"
@@ -1 +1 @@
-a
+b
diff --git a/vitest.setup.ts b/vitest.setup.ts
index 8888888..9999999 100644
--- a/vitest.setup.ts
+++ b/vitest.setup.ts
@@ -3 +3 @@
-a
+b
`;

test('parseDiff: added/changed line numbers per head file', () => {
  const d = parseDiff(DIFF);
  assert.deepEqual([...d.get('src/api/chat.ts').added].sort((a, b) => a - b), [11, 12, 13, 43]);
  assert.equal(d.get('src/api/chat.ts').oldPath, 'src/api/chat.ts');
  assert.equal(d.get('src/api/chat.ts').isNew, false);
});

test('parseDiff: pure deletion hunk (+N,0) adds no lines', () => {
  const d = parseDiff(DIFF);
  assert.ok(!d.get('src/api/chat.ts').added.has(52));
});

test('parseDiff: new files have no old path', () => {
  const f = parseDiff(DIFF).get('src/new.tsx');
  assert.equal(f.isNew, true);
  assert.equal(f.oldPath, null);
  assert.deepEqual([...f.added], [1, 2]);
});

test('parseDiff: renames map head path to base path, including 100% renames', () => {
  const d = parseDiff(DIFF);
  assert.equal(d.get('src/lib/name.ts').oldPath, 'src/old/name.ts');
  assert.deepEqual([...d.get('src/lib/name.ts').added], [5]);
  assert.equal(d.get('src/moved/move.ts').oldPath, 'src/pure/move.ts');
  assert.equal(d.get('src/moved/move.ts').added.size, 0);
});

test('parseDiff: C-quoted paths are decoded', () => {
  assert.ok(parseDiff(DIFF).has('src/weéird name.ts'));
});

// ---------------------------------------------------------------- ESLint

const ROOT = '/work/repo';
const eslintResult = (file, messages) => ({ filePath: path.join(ROOT, file), messages });
const msg = (line, ruleId, severity = 2, extra = {}) => ({ line, column: 7, ruleId, severity, message: `${ruleId} at ${line}`, ...extra });

test('eslint: errors on added lines block; untouched-line errors and warnings do not', () => {
  const d = parseDiff(DIFF);
  const found = newEslintErrors([
    eslintResult('src/api/chat.ts', [
      msg(11, '@typescript-eslint/no-explicit-any'),
      msg(12, '@typescript-eslint/no-explicit-any'),
      msg(13, 'no-console', 1), // warning on an added line
      msg(5, '@typescript-eslint/no-explicit-any'), // pre-existing, untouched line
      msg(43, 'prefer-const'), // changed line
    ]),
  ], d, ROOT);
  assert.deepEqual(found.map((f) => [f.file, f.line, f.rule]), [
    ['src/api/chat.ts', 11, '@typescript-eslint/no-explicit-any'],
    ['src/api/chat.ts', 12, '@typescript-eslint/no-explicit-any'],
    ['src/api/chat.ts', 43, 'prefer-const'],
  ]);
});

test('eslint: files outside the diff are ignored', () => {
  const found = newEslintErrors([eslintResult('src/other.ts', [msg(11, 'x')])], parseDiff(DIFF), ROOT);
  assert.deepEqual(found, []);
});

test('eslint: a fatal parse error in a changed file blocks wherever it is reported', () => {
  const found = newEslintErrors([
    eslintResult('src/api/chat.ts', [{ line: 200, column: 1, ruleId: null, fatal: true, severity: 2, message: 'Parsing error: Unexpected token' }]),
  ], parseDiff(DIFF), ROOT);
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'parse error');
});

// ---------------------------------------------------------------- tsc

const TSC_BASE = `src/api/chat.ts(5,3): error TS2322: Type 'null' is not assignable to type 'string'.
src/api/chat.ts(80,1): error TS7006: Parameter 'e' implicitly has an 'any' type.
src/old/name.ts(9,9): error TS2339: Property 'foo' does not exist on type 'Bar'.
src/untouched.ts(1,1): error TS2304: Cannot find name 'gone'.
vite.config.ts(3,1): error TS2769: No overload matches this call.
  Type 'import("/base/dir/node_modules/vite/index").Plugin' is not assignable.
`;

test('parseTsc: located, global and continuation lines; roots normalised', () => {
  const errs = parseTsc(`${TSC_BASE}error TS5023: Unknown compiler option 'x'.\n`, ['/base/dir']);
  assert.equal(errs.length, 6);
  assert.deepEqual(errs[0], { file: 'src/api/chat.ts', line: 5, col: 3, code: 'TS2322', message: "Type 'null' is not assignable to type 'string'." });
  assert.match(errs[4].detail, /<root>\/node_modules\/vite/);
  assert.deepEqual([errs[5].file, errs[5].code], [null, 'TS5023']);
});

test('parseTsc: an absolute file path under a checkout root becomes repo-relative', () => {
  const [e] = parseTsc("/runner/work/src/api/chat.ts(1,1): error TS2304: Cannot find name 'x'.\n", ['/runner/work']);
  assert.equal(e.file, 'src/api/chat.ts');
});

test('tsc: line shifts do not create new errors; extra occurrences do', () => {
  const head = parseTsc(`src/api/chat.ts(8,3): error TS2322: Type 'null' is not assignable to type 'string'.
src/api/chat.ts(12,3): error TS2322: Type 'null' is not assignable to type 'string'.
src/api/chat.ts(83,1): error TS7006: Parameter 'e' implicitly has an 'any' type.
`);
  const { blocking, elsewhere } = newTscErrors(head, parseTsc(TSC_BASE), parseDiff(DIFF));
  // two TS2322 on head vs one on base: the one on an added line (12) is reported
  assert.deepEqual(blocking.map((e) => [e.file, e.line, e.rule]), [['src/api/chat.ts', 12, 'TS2322']]);
  assert.deepEqual(elsewhere, []);
});

test('tsc: every error in a file the PR adds is new', () => {
  const head = parseTsc("src/new.tsx(2,14): error TS2322: Type 'number' is not assignable to type 'string'.\n");
  const { blocking } = newTscErrors(head, parseTsc(TSC_BASE), parseDiff(DIFF));
  assert.equal(blocking.length, 1);
});

test('tsc: renamed files are compared with the base path', () => {
  const head = parseTsc("src/lib/name.ts(10,9): error TS2339: Property 'foo' does not exist on type 'Bar'.\n");
  assert.deepEqual(newTscErrors(head, parseTsc(TSC_BASE), parseDiff(DIFF)).blocking, []);
});

test('tsc: new errors in files the PR did not touch are reported, not blocking', () => {
  const head = parseTsc(`${TSC_BASE}src/untouched.ts(2,1): error TS2304: Cannot find name 'other'.\n`);
  const { blocking, elsewhere } = newTscErrors(head, parseTsc(TSC_BASE), parseDiff(DIFF));
  assert.deepEqual(blocking, []);
  assert.deepEqual(elsewhere.map((e) => [e.file, e.line]), [['src/untouched.ts', 2]]);
});

test('tsc: messages differing only by checkout root compare equal', () => {
  const base = parseTsc("vitest.setup.ts(3,1): error TS2322: Type 'import(\"/runner/base/x\").A' is not assignable.\n", ['/runner/base']);
  const head = parseTsc("vitest.setup.ts(3,1): error TS2322: Type 'import(\"/runner/work/x\").A' is not assignable.\n", ['/runner/work']);
  assert.deepEqual(newTscErrors(head, base, parseDiff(DIFF)).blocking, []);
});

test('tsc: a union printed in a different member order is the same error (PR #117)', () => {
  const base = parseTsc(`src/api/chat.ts(70,50): error TS2345: Argument of type 'string' is not assignable to parameter of type '"login" | "signup" | "password_reset" | "email_verify" | undefined'.\n`);
  const head = parseTsc(`src/api/chat.ts(70,50): error TS2345: Argument of type 'string' is not assignable to parameter of type '"login" | "password_reset" | "signup" | "email_verify" | undefined'.\n`);
  assert.deepEqual(newTscErrors(head, base, parseDiff(DIFF)).blocking, []);
  // ...but a different union is still a different error
  const other = parseTsc(`src/api/chat.ts(70,50): error TS2345: Argument of type 'string' is not assignable to parameter of type '"login" | "signup" | undefined'.\n`);
  assert.equal(newTscErrors(other, base, parseDiff(DIFF)).blocking.length, 1);
  assert.equal(canonicalMessage("Type 'B | A' is not assignable to type 'C'."), "Type 'A | B' is not assignable to type 'C'.");
});

test('tsc: a new global (unlocated) error blocks', () => {
  const head = parseTsc("error TS5023: Unknown compiler option 'x'.\n");
  assert.equal(newTscErrors(head, [], parseDiff(DIFF)).blocking.length, 1);
});

// ---------------------------------------------------------------- output / CLI

test('annotation escapes properties and data', () => {
  assert.equal(
    annotation('error', { file: 'a,b:c.ts', line: 3, col: 4, title: 'ESLint x', message: '50% done\nnext' }),
    '::error file=a%2Cb%3Ac.ts,line=3,col=4,title=ESLint x::50%25 done%0Anext',
  );
});

function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'nle-'));
  const w = (name, body) => { const p = path.join(dir, name); writeFileSync(p, body); return p; };
  return { dir, w };
}

function run(args, env = {}) {
  const lines = [];
  const saved = process.env.GITHUB_STEP_SUMMARY;
  if ('GITHUB_STEP_SUMMARY' in env) process.env.GITHUB_STEP_SUMMARY = env.GITHUB_STEP_SUMMARY;
  else delete process.env.GITHUB_STEP_SUMMARY;
  try {
    return { code: main(args, (l) => lines.push(l)), lines };
  } finally {
    if (saved === undefined) delete process.env.GITHUB_STEP_SUMMARY; else process.env.GITHUB_STEP_SUMMARY = saved;
  }
}

test('cli files: TS/TSX files under a prefix', () => {
  const { w } = fixture();
  const { lines } = run(['files', '--diff', w('d', DIFF), '--under', 'src/']);
  assert.deepEqual(lines.sort(), ['src/api/chat.ts', 'src/lib/name.ts', 'src/moved/move.ts', 'src/new.tsx', 'src/weéird name.ts']);
});

test('cli eslint: exit 1 with summary; --advisory downgrades to warnings and exit 0', () => {
  const { dir, w } = fixture();
  const diff = w('d', DIFF);
  const rep = w('e.json', JSON.stringify([
    { filePath: path.join(dir, 'src/api/chat.ts'), messages: [msg(11, '@typescript-eslint/no-explicit-any'), msg(5, '@typescript-eslint/no-explicit-any')] },
  ]));
  const summary = w('summary.md', '');
  const blocking = run(['eslint', '--diff', diff, '--report', rep, '--root', dir], { GITHUB_STEP_SUMMARY: summary });
  assert.equal(blocking.code, 1);
  assert.ok(blocking.lines.some((l) => l.startsWith('::error file=src/api/chat.ts,line=11,')));
  assert.match(readFileSync(summary, 'utf8'), /\| `src\/api\/chat.ts:11` \| @typescript-eslint\/no-explicit-any \|/);
  const draft = run(['eslint', '--diff', diff, '--report', rep, '--root', dir, '--advisory']);
  assert.equal(draft.code, 0);
  assert.ok(draft.lines.some((l) => l.startsWith('::warning file=src/api/chat.ts,line=11,')));
});

test('cli eslint: only the first 10 findings become annotations, all are listed', () => {
  const { dir, w } = fixture();
  const added = Array.from({ length: 15 }, (_, i) => `+x${i}`).join('\n');
  const diff = w('d', `diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -0,0 +1,15 @@\n${added}\n`);
  const rep = w('e.json', JSON.stringify([{ filePath: path.join(dir, 'src/a.ts'), messages: Array.from({ length: 15 }, (_, i) => msg(i + 1, 'r')) }]));
  const { code, lines } = run(['eslint', '--diff', diff, '--report', rep, '--root', dir]);
  assert.equal(code, 1);
  assert.equal(lines.filter((l) => l.startsWith('::error')).length, 10);
  assert.equal(lines.filter((l) => l.startsWith('NEW ')).length, 15);
});

test('cli tsc: clean when head adds nothing; exit 1 on a new error', () => {
  const { w } = fixture();
  const diff = w('d', DIFF);
  const base = w('b', TSC_BASE);
  assert.equal(run(['tsc', '--diff', diff, '--head', w('h1', TSC_BASE), '--base', base]).code, 0);
  const head = w('h2', `${TSC_BASE}src/new.tsx(2,14): error TS2322: Type 'number' is not assignable to type 'string'.\n`);
  assert.equal(run(['tsc', '--diff', diff, '--head', head, '--base', base]).code, 1);
  assert.equal(run(['tsc', '--diff', diff, '--head', head, '--base', base, '--advisory']).code, 0);
});

test('cli tsc: an abnormal tsc exit (e.g. OOM) fails instead of comparing garbage', () => {
  const { w } = fixture();
  const diff = w('d', DIFF);
  const empty = w('e', '');
  const r = run(['tsc', '--diff', diff, '--head', w('h', TSC_BASE), '--base', empty, '--head-exit', '2', '--base-exit', '134']);
  assert.equal(r.code, 1);
  assert.ok(r.lines[0].startsWith('::error title=TypeScript check did not complete'));
  assert.equal(run(['tsc', '--diff', diff, '--head', w('h', TSC_BASE), '--base', empty, '--base-exit', '134', '--advisory']).code, 0);
});
