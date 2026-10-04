#!/usr/bin/env node
// Advisory `Frontend CI / Unit Tests (new failures)`: run the vitest files a PR
// affects on the PR head AND on its merge-base; fail only on tests that fail on
// head but not on base. develop2 already has failing tests, so a plain
// `vitest run` would fail every PR for reasons it did not cause.
//
//   affected --changes changes.z --files tracked.z --out tests.txt [--cap 40]
//     changes.z = `git diff --name-status -z -M <base> HEAD`, tracked.z =
//     `git ls-files -z`; sources are read from the cwd (head checkout).
//     AFFECTED = test files the PR adds/modifies/renames + test files that
//     reach a changed (or deleted / renamed-away) file through imports,
//     transitively. An import is a quoted specifier after from / import /
//     import( / require( / vi.mock( / vi.importActual(; `@/` is src/, `./` and
//     `../` relative, resolved as exact, +extension or /index; packages ignored.
//     Over --cap: changed tests + DIRECT importers only; still over: the first
//     --cap (nearest, then named after a changed file) run. Every affected file
//     not run (narrowed out or over the cap) is listed as NOT RUN with a warning.
//     A changed global input (vitest config/setup, package.json, lockfile,
//     tsconfig, or a file a setupFiles entry imports) is reported; the full
//     suite (~15 min) is not run.
//
//   run --root DIR --tests tests.txt --out res.json [--side base --changes
//     changes.z] [--chunk-size 8] [--chunk-timeout 420] [--budget 1500]
//     `npx vitest run --reporter=json --reporter=dot --retry=1` (a test that
//     passes on retry was a load flake, seen locally) in chunks, each under its
//     own timeout (the process group is killed), within --budget seconds in all.
//     A chunk that times out or leaves no usable report marks its files "(did
//     not complete)", one past the budget "(not run: <side> time budget spent)",
//     which never matches the other side: failing tests, never a pass. An
//     unhandled error (the dot reporter's banner) is the test "(unhandled
//     error)" of the file vitest names, or of every file in the chunk. --side
//     base keeps head's chunks, mapped through renames, minus files absent on
//     base; results stay keyed by head path.
//
//   compare --head head.json --base base.json [--advisory]
//     Test id = file + describe path + title. NEW = fails on head, did not fail
//     on base (passed, skipped, absent, or file not on base). A failure outside
//     any test is the test "(file)". A head "(did not complete)" is new unless
//     base did not complete that file either; if base did not complete a file,
//     every head failure in it is new (fail-closed). Known limits: an incomplete
//     chunk marks all its files, so an old failure sharing a chunk with a file
//     that hangs on one side only reads as new; tests not run are reported,
//     not compared.
//
// --advisory (draft PRs): warnings, exit 0. All findings go to the job summary.

import { readFileSync, appendFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { annotation } from './new-lint-errors.mjs';

export const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const CODE_FILE = /\.[cm]?[jt]sx?$/;
const VITEST_EXCLUDED = /^src\/tests\/e2e\//; // vitest.config.ts excludes these
export const GLOBAL_INPUT = /^(vitest\.(config|setup|workspace)\.[cm]?[jt]s|package(-lock)?\.json|tsconfig\.json)$/;
export const FILE_ERROR = '(file)';
export const INCOMPLETE = '(did not complete)';
export const UNHANDLED = '(unhandled error)';
const ANNOTATION_LIMIT = 10;
const EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

// ---- Changed files and the affected test set ----

/** Parse `git diff --name-status -z -M` into [{status, path, oldPath}]. */
export function parseChanges(text) {
  const parts = text.split('\0').filter((p) => p !== '');
  const out = [];
  for (let i = 0; i < parts.length;) {
    const status = parts[i++][0];
    if (status === 'R' || status === 'C') out.push({ status, oldPath: parts[i++], path: parts[i++] });
    else out.push({ status, oldPath: status === 'A' ? null : parts[i], path: parts[i++] });
  }
  return out;
}

const SPECIFIER = /(?:\bfrom|\bimport|\bimport\s*\(|\brequire\s*\(|\bvi\.(?:mock|doMock|importActual|importMock)\s*\()\s*['"]([^'"\n]+)['"]/g;

export function importSpecifiers(source) {
  return [...source.matchAll(SPECIFIER)].map((m) => m[1].replace(/\?.*$/, ''));
}

/** Resolve an import specifier to a path in `known`, or null. */
export function resolveImport(spec, fromFile, known) {
  let p;
  if (spec.startsWith('@/')) p = `src/${spec.slice(2)}`;
  else if (spec.startsWith('./') || spec.startsWith('../')) p = path.posix.join(path.posix.dirname(fromFile), spec);
  else return null;
  p = path.posix.normalize(p);
  for (const ext of EXTS) if (known.has(p + ext)) return p + ext;
  for (const ext of EXTS.slice(1)) if (known.has(`${p}/index${ext}`)) return `${p}/index${ext}`;
  return null;
}

const isTest = (f) => TEST_FILE.test(f) && !VITEST_EXCLUDED.test(f);

/** @returns {{run: string[], notRun: string[], narrowed: boolean, globalInputs: string[]}} */
export function affectedTests(changes, tracked, readSource, cap = 40, setupFiles = []) {
  const head = new Set(tracked);
  const known = new Set(tracked);
  const seeds = new Set();
  for (const c of changes) {
    if (c.oldPath) { known.add(c.oldPath); seeds.add(c.oldPath); }
    if (c.status !== 'D') seeds.add(c.path);
  }
  const importers = new Map(); // target -> files importing it
  for (const f of tracked) {
    if (!CODE_FILE.test(f)) continue;
    for (const spec of importSpecifiers(readSource(f))) {
      const target = resolveImport(spec, f, known);
      if (!target || target === f) continue;
      if (!importers.has(target)) importers.set(target, new Set());
      importers.get(target).add(f);
    }
  }
  // Breadth-first over reverse imports; depth 0 = changed, 1 = direct importer.
  const depth = new Map([...seeds].map((s) => [s, 0]));
  for (let frontier = [...seeds], d = 1; frontier.length; d++) {
    const next = frontier.flatMap((f) => [...(importers.get(f) ?? [])]).filter((f) => !depth.has(f));
    for (const f of next) depth.set(f, d);
    frontier = [...new Set(next)];
  }
  const stem = (f) => path.posix.basename(f).replace(/\.(test|spec)\..*$|\.[^.]*$/, '');
  const named = new Set([...seeds].map(stem));
  const order = (a, b) => depth.get(a) - depth.get(b) || named.has(stem(b)) - named.has(stem(a)) || a.localeCompare(b);
  const headTests = (pred) => [...depth.keys()].filter((f) => head.has(f) && isTest(f) && pred(depth.get(f))).sort(order);
  const every = headTests(() => true);
  const narrowed = every.length > cap;
  const run = every.filter((f) => !narrowed || depth.get(f) <= 1).slice(0, cap);
  // A setup file loads for every test, so a changed file it reaches (msw-handlers) affects them all.
  const isSetup = (f) => GLOBAL_INPUT.test(f) || setupFiles.includes(f);
  const globalInputs = [...changes.map((c) => c.path).filter(isSetup),
    ...[...depth.keys()].filter((f) => depth.get(f) > 0 && isSetup(f)).sort().map((f) => `${f} (imports a changed file)`)];
  return { run, notRun: every.filter((f) => !run.includes(f)), narrowed, globalInputs };
}

// ---- Running vitest ----

export const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

const firstLine = (s) => String(s ?? '').split('\n').find((l) => l.trim())?.trim().slice(0, 300) ?? '';

/** vitest JSON -> {file: {failed: {id: {message, line}}, passed: [id]}}; wanted files missing = incomplete. */
export function parseVitestReport(report, root, wanted) {
  const files = {};
  for (const r of report?.testResults ?? []) {
    const rel = path.relative(root, r.name).split(path.sep).join('/');
    if (!wanted.includes(rel)) continue;
    const [failed, passed, seen] = [{}, [], new Map()];
    for (const a of r.assertionResults ?? []) {
      let id = [...(a.ancestorTitles ?? []), a.title].filter(Boolean).join(' > ');
      seen.set(id, (seen.get(id) ?? 0) + 1);
      if (seen.get(id) > 1) id += ` [${seen.get(id)}]`;
      if (a.status === 'failed') failed[id] = { message: firstLine(a.failureMessages?.[0]), line: a.location?.line ?? null };
      else if (a.status === 'passed') passed.push(id);
    }
    if (r.message || (r.status === 'failed' && Object.keys(failed).length === 0)) {
      failed[FILE_ERROR] = { message: firstLine(r.message) || 'failed outside a test', line: null };
    }
    files[rel] = { failed, passed };
  }
  for (const f of wanted) if (!files[f]) files[f] = incomplete('not in the vitest report');
  return files;
}

const incomplete = (reason) => ({ failed: { [INCOMPLETE]: { message: reason, line: null } }, passed: [] });

function runChunk(root, files, outFile, timeoutSec) {
  return new Promise((resolve) => {
    rmSync(outFile, { force: true });
    const started = Date.now();
    // The dot reporter prints vitest's unhandled-error banner, which the json reporter leaves out.
    const child = spawn('npx', ['--no', 'vitest', 'run', '--reporter=json', '--reporter=dot', '--retry=1', `--outputFile.json=${outFile}`, ...files],
      { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let [log, timedOut] = ['', false];
    for (const s of [child.stdout, child.stderr]) s.on('data', (d) => { log = (log + d).slice(-2e6); });
    child.on('error', (err) => { log += String(err); });
    const killGroup = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } };
    const timer = setTimeout(() => { timedOut = true; killGroup(); }, timeoutSec * 1000);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      killGroup(); // no worker may outlive its chunk
      resolve({ code, signal, timedOut, seconds: Math.round((Date.now() - started) / 1000), log });
    });
  });
}

/** Chunk files vitest names in "This error originated in" lines; all of them if it caught unattributed ones. */
export function unhandledFiles(log, files) {
  const text = log.replace(/\u001b\[[0-9;]*m/g, '');
  if (!/Vitest caught \d+ unhandled error/.test(text)) return [];
  const named = [...text.matchAll(/This error originated in "([^"]+)" test file/g)].map((m) => m[1]).filter((f) => files.includes(f));
  return named.length ? [...new Set(named)] : files;
}

export function chunkResults(files, outcome, reportText, root) {
  if (outcome.timedOut) return Object.fromEntries(files.map((f) => [f, incomplete(`chunk timed out after ${outcome.seconds}s`)]));
  let report = null;
  try { report = JSON.parse(reportText); } catch { /* handled below */ }
  const exit = outcome.code ?? outcome.signal;
  if (!report) return Object.fromEntries(files.map((f) => [f, incomplete(`vitest exited ${exit} without a JSON report`)]));
  const res = parseVitestReport(report, root, files);
  // An unhandled error is charged to its file, compared like a test, whatever else failed in the chunk.
  const charged = unhandledFiles(outcome.log ?? '', files);
  for (const f of charged) res[f].failed[UNHANDLED] = { message: 'vitest caught an unhandled error while this file ran', line: null };
  // Exit 1 + a failing report is ordinary; any other non-zero exit marks the whole chunk.
  if (!charged.length && exit !== 0 && !(exit === 1 && report.success === false)) {
    for (const r of Object.values(res)) r.failed[INCOMPLETE] ??= { message: `vitest exited ${exit} (unhandled error?)`, line: null };
  }
  return res;
}

/** The HEAD list's chunks as [this side's path, head path] pairs: base keeps head's grouping, minus files it lacks. */
export function sideChunks(tests, changes, size, exists) {
  const toSide = new Map(changes.map((c) => [c.path, c.status === 'A' || c.status === 'C' ? null : c.oldPath]));
  return chunk(tests, size).map((c) => c.map((t) => [toSide.has(t) ? toSide.get(t) : t, t]).filter(([p]) => p && exists(p)));
}

export async function runAll(o, out, runner = runChunk) {
  const root = path.resolve(o.root);
  const tests = readFileSync(o.tests, 'utf8').split('\n').filter(Boolean);
  const changes = o.side === 'base' ? parseChanges(readFileSync(o.changes, 'utf8')) : [];
  const chunks = sideChunks(tests, changes, Number(o['chunk-size'] ?? 8), (p) => existsSync(path.join(root, p))).filter((c) => c.length);
  const kept = new Set(chunks.flat().map(([, t]) => t));
  const result = { side: o.side ?? 'head', files: {}, chunks: [], skipped: tests.filter((t) => !kept.has(t)) };
  const reportFile = `${path.resolve(o.out)}.chunk.json`;
  // Total budget per side (default 25 min, head + base inside the job's 60): what does not fit is incomplete, and compare still runs.
  const deadline = Date.now() + Number(o.budget ?? 1500) * 1000;
  for (const pairs of chunks) {
    const [files, sidePath] = [pairs.map(([p]) => p), new Map(pairs)];
    const left = Math.floor((deadline - Date.now()) / 1000);
    const outcome = left > 0 ? await runner(root, files, reportFile, Math.min(left, Number(o['chunk-timeout'] ?? 420)))
      : { skipped: true, code: null, timedOut: true, seconds: 0, log: '' };
    const text = existsSync(reportFile) ? readFileSync(reportFile, 'utf8') : '';
    // Keyed by side, so a file skipped on both sides never matches itself and passes.
    const res = outcome.skipped ? Object.fromEntries(files.map((f) => [f, { failed: { [`(not run: ${result.side} time budget spent)`]: { message: 'time budget spent before this chunk', line: null } }, passed: [] }]))
      : chunkResults(files, outcome, text, root);
    for (const [p, r] of Object.entries(res)) result.files[sidePath.get(p)] = r;
    result.chunks.push({ files: files.map((f) => sidePath.get(f)), code: outcome.code, timedOut: outcome.timedOut, seconds: outcome.seconds });
    const bad = Object.values(res).filter((r) => INCOMPLETE in r.failed).length;
    out(`[${result.side}] chunk of ${files.length}: exit ${outcome.code ?? outcome.signal}, ${outcome.seconds}s${outcome.timedOut ? ' TIMED OUT' : ''}${bad ? `, ${bad} file(s) incomplete` : ''}`);
    if (bad) out(outcome.log.split('\n').slice(-15).join('\n'));
  }
  writeFileSync(o.out, JSON.stringify(result, null, 1));
  return 0;
}

// ---- Comparison and report ----

/** @returns {{newFailures: object[], stillFailing: object[], fixed: object[]}} */
export function compareRuns(head, base) {
  const [newFailures, stillFailing, fixed] = [[], [], []];
  for (const [file, h] of Object.entries(head.files)) {
    const b = base.files[file];
    for (const [test, f] of Object.entries(h.failed)) {
      const row = { file, test, message: f.message, line: f.line };
      if (b && test in b.failed) { stillFailing.push(row); continue; }
      newFailures.push({ ...row, base: !b ? 'not on base' : INCOMPLETE in b.failed ? 'base did not complete' : b.passed.includes(test) ? 'passed' : 'absent or skipped' });
    }
  }
  for (const [file, b] of Object.entries(base.files)) {
    for (const test of Object.keys(b.failed)) if (head.files[file]?.passed.includes(test)) fixed.push({ file, test });
  }
  const order = (a, b) => a.file.localeCompare(b.file) || a.test.localeCompare(b.test);
  return { newFailures: newFailures.sort(order), stillFailing: stillFailing.sort(order), fixed: fixed.sort(order) };
}

const escCell = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

const summary = (md) => process.env.GITHUB_STEP_SUMMARY && appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

export function report({ newFailures, stillFailing, fixed }, { advisory, chunks = [], out = console.log }) {
  for (const f of newFailures.slice(0, ANNOTATION_LIMIT)) {
    out(annotation(advisory ? 'warning' : 'error', { file: f.file, line: f.line, title: `New unit test failure: ${f.test}`, message: f.message }));
  }
  const n = newFailures.length;
  const heading = n === 0 ? '### Unit tests: no new failures'
    : `### Unit tests: ${n} new failure${n === 1 ? '' : 's'}${advisory ? ' (draft PR — advisory, not blocking)' : ''}`;
  const lines = [heading, '', `| | Tests |`, '| --- | --- |',
    `| New failures (fail on head, not on base) | ${n} |`,
    `| Still failing on base too (not blocking) | ${stillFailing.length} |`,
    `| Fixed (fail on base, pass on head) | ${fixed.length} |`, ''];
  const timedOut = chunks.filter((c) => c.timedOut);
  if (timedOut.length) lines.push(`**${timedOut.length} chunk(s) timed out** (${timedOut.map((c) => `${c.side}: ${c.files.join(', ')}`).join('; ')}); their files count as \`${INCOMPLETE}\`.`, '');
  const table = (title, rows, withBase) => {
    if (!rows.length) return;
    lines.push(`#### ${title}`, '', `| File | Test |${withBase ? ' On base |' : ''} Message |`, `| --- | --- |${withBase ? ' --- |' : ''} --- |`);
    for (const r of rows) lines.push(`| \`${escCell(r.file)}\` | ${escCell(r.test)} |${withBase ? ` ${r.base} |` : ''} ${escCell(r.message ?? '')} |`);
    lines.push('');
  };
  table('New failures', newFailures, true);
  table('Still failing on base too', stillFailing, false);
  table('Fixed by this PR', fixed, false);
  out('');
  for (const f of newFailures) out(`NEW ${f.file}  ${f.test}  (base: ${f.base})  ${f.message}`);
  out(`${heading.replace(/^### /, '')} (still failing on base too: ${stillFailing.length}, fixed: ${fixed.length})`);
  summary(lines.join('\n') + '\n');
}

// ---- CLI ----

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { _cmd: cmd };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    const name = a.slice(2);
    if (name === 'advisory') opts.advisory = true;
    else opts[name] = rest[++i];
  }
  return opts;
}

export async function main(argv, out = console.log) {
  const o = parseArgs(argv);
  if (o._cmd === 'affected') {
    const changes = parseChanges(readFileSync(o.changes, 'utf8'));
    const tracked = readFileSync(o.files, 'utf8').split('\0').filter(Boolean);
    const read = (f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };
    const config = read(tracked.find((f) => /^vitest\.config\.[cm]?[jt]s$/.test(f)) ?? '');
    const setup = (/setupFiles:\s*\[([^\]]*)\]/.exec(config)?.[1].match(/['"][^'"]+['"]/g) ?? []).map((q) => path.posix.normalize(q.slice(1, -1)));
    const a = affectedTests(changes, tracked, read, Number(o.cap ?? 40), setup);
    writeFileSync(o.out, a.run.map((f) => `${f}\n`).join(''));
    const lines = [`### Unit tests: ${a.run.length} affected test file(s) selected`, ''];
    if (a.narrowed) lines.push('More files than the cap import the change transitively; narrowed to changed test files + direct importers.', '');
    if (a.notRun.length) lines.push(`**${a.notRun.length} affected file(s) NOT RUN (narrowed out or over the cap):** ${a.notRun.map((f) => `\`${f}\``).join(', ')}`, '');
    if (a.globalInputs.length) lines.push(`**Global test input changed** (${a.globalInputs.map((f) => `\`${f}\``).join(', ')}): this can affect every test; the full suite is NOT run here.`, '');
    for (const f of a.run) out(f);
    if (a.notRun.length || a.globalInputs.length) out(annotation('warning', { title: 'Unit tests: partial selection', message: lines.slice(2).join(' ').trim() }));
    summary(lines.join('\n') + '\n');
    return 0;
  }

  if (o._cmd === 'run') return runAll(o, out);

  if (o._cmd === 'compare') {
    const [head, base] = [o.head, o.base].map((f) => JSON.parse(readFileSync(f, 'utf8')));
    const result = compareRuns(head, base);
    const chunks = [...head.chunks.map((c) => ({ ...c, side: 'head' })), ...base.chunks.map((c) => ({ ...c, side: 'base' }))];
    report(result, { advisory: Boolean(o.advisory), chunks, out });
    return result.newFailures.length && !o.advisory ? 1 : 0;
  }

  throw new Error(`unknown command: ${o._cmd} (expected affected | run | compare)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => {
    // A crash in the gate itself must not block a draft PR either.
    const advisory = process.argv.includes('--advisory');
    console.log(annotation(advisory ? 'warning' : 'error', { title: 'new-vitest-failures', message: err.stack ?? String(err) }));
    process.exitCode = advisory ? 0 : 2;
  });
}
