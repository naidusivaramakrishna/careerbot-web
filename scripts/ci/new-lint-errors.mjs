#!/usr/bin/env node
// Gate for the required `Frontend CI / Lint and Build` check: fail a pull
// request only on ESLint / TypeScript errors that the PR itself introduces, so
// the existing backlog on the base branch (~150 ESLint errors, ~550 tsc errors
// when this was written) does not block unrelated work.
//
//   files  --diff pr.diff [--under src/]
//       Print the TS/TSX files the PR adds or modifies (head paths), one per
//       line. Used to decide what ESLint lints and whether tsc runs at all.
//
//   eslint --diff pr.diff --report eslint.json [--root DIR] [--advisory]
//       An ESLint error (severity 2) is NEW when it sits on a line the PR adds
//       or changes, or is a fatal parse error in a changed file (reported
//       wherever it is: a file that does not parse cannot be linted at all,
//       and the base branch builds, so it did parse there). Errors on
//       untouched lines of a touched file are pre-existing and do not block.
//       Known gap: an error the PR causes on a line it did NOT touch (e.g.
//       prefer-const after removing a reassignment elsewhere) is not caught.
//
//   tsc --diff pr.diff --head tsc-head.txt --base tsc-base.txt
//       [--head-root DIR] [--base-root DIR] [--head-exit N] [--base-exit N]
//       [--advisory]
//       `tsc --noEmit --pretty false` is run on the PR head and on the base.
//       Errors are compared per file by (error code, message), NOT by line, as
//       lines shift. In a file the PR adds or modifies, every head error beyond
//       the base's count for that (code, message) is NEW and blocks. New errors
//       in files the PR did not touch are reported but do not block.
//       Known gap: matching is by count, so a PR that fixes one error and adds
//       an identical one (same file, code and message) nets to zero and passes.
//
// `pr.diff` is `git diff -U0 -M --diff-filter=ACMR <base> HEAD`. On a draft PR
// the workflow passes --advisory: findings become warnings and the exit code
// is 0. Every finding is listed in $GITHUB_STEP_SUMMARY, because GitHub shows
// only the first 10 error annotations of a step.

import { readFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const TS_FILE = /\.(ts|tsx)$/;
const ANNOTATION_LIMIT = 10;

// --------------------------------------------------------------------------
// git diff -U0 parsing
// --------------------------------------------------------------------------

function unquote(p) {
  // git C-quotes paths containing special characters: "a\tb" / "\303\251".
  if (!p.startsWith('"')) return p;
  const body = p.slice(1, -1);
  const bytes = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') {
      bytes.push(...Buffer.from(c, 'utf8'));
      continue;
    }
    const n = body[++i];
    if (/[0-7]/.test(n)) {
      bytes.push(parseInt(body.slice(i, i + 3), 8));
      i += 2;
    } else {
      bytes.push({ n: 10, t: 9, r: 13, '"': 34, '\\': 92, a: 7, b: 8, f: 12, v: 11 }[n] ?? n.charCodeAt(0));
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function stripPrefix(p, prefix) {
  const u = unquote(p.trim());
  return u.startsWith(prefix) ? u.slice(prefix.length) : u;
}

/**
 * Parse `git diff -U0` output.
 * @returns {Map<string, {oldPath: string|null, added: Set<number>, isNew: boolean}>}
 *   keyed by head path. `added` holds head line numbers the PR added/changed.
 */
export function parseDiff(text) {
  const files = new Map();
  let cur = null;
  const flush = () => {
    if (cur && cur.newPath) {
      files.set(cur.newPath, { oldPath: cur.isNew ? null : (cur.oldPath ?? cur.newPath), added: cur.added, isNew: cur.isNew });
    }
  };
  for (const line of text.split('\n')) {
    if (line.startsWith('diff --git ')) {
      flush();
      cur = { oldPath: null, newPath: null, added: new Set(), isNew: false };
      continue;
    }
    if (!cur) continue;
    if (line.startsWith('new file mode')) cur.isNew = true;
    else if (line.startsWith('rename from ')) cur.oldPath = unquote(line.slice(12));
    else if (line.startsWith('rename to ')) cur.newPath = unquote(line.slice(10));
    else if (line.startsWith('--- ')) {
      const p = line.slice(4);
      if (p.trim() !== '/dev/null') cur.oldPath = stripPrefix(p, 'a/');
    } else if (line.startsWith('+++ ')) {
      const p = line.slice(4);
      if (p.trim() !== '/dev/null') cur.newPath = stripPrefix(p, 'b/');
    } else if (line.startsWith('@@')) {
      const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!m) continue;
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      for (let i = 0; i < count; i++) cur.added.add(start + i);
    }
  }
  flush();
  return files;
}

// --------------------------------------------------------------------------
// Output helpers
// --------------------------------------------------------------------------

const escData = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escProp = (s) => escData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
const escCell = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function annotation(level, f) {
  const props = [];
  if (f.file) props.push(`file=${escProp(f.file)}`);
  if (f.line) props.push(`line=${f.line}`);
  if (f.col) props.push(`col=${f.col}`);
  props.push(`title=${escProp(f.title)}`);
  return `::${level} ${props.join(',')}::${escData(f.message)}`;
}

function report({ tool, blocking, advisoryOnly = [], advisory, note, out = console.log }) {
  const level = advisory ? 'warning' : 'error';
  const lines = [];
  blocking.slice(0, ANNOTATION_LIMIT).forEach((f) => out(annotation(level, f)));
  for (const f of advisoryOnly.slice(0, ANNOTATION_LIMIT)) out(annotation('warning', f));

  const heading = blocking.length === 0
    ? `### ${tool}: no new errors in changed code`
    : `### ${tool}: ${blocking.length} new error${blocking.length === 1 ? '' : 's'} in changed code${advisory ? ' (draft PR — advisory, not blocking)' : ''}`;
  lines.push(heading, '');
  if (note) lines.push(note, '');
  const table = (rows) => {
    lines.push('| Location | Rule | Message |', '| --- | --- | --- |');
    for (const f of rows) lines.push(`| \`${escCell(f.file ?? '(global)')}${f.line ? `:${f.line}` : ''}\` | ${escCell(f.rule)} | ${escCell(f.message)} |`);
    lines.push('');
  };
  if (blocking.length) table(blocking);
  if (advisoryOnly.length) {
    lines.push(`<details><summary>${advisoryOnly.length} new error(s) in files this PR did not touch (not blocking)</summary>`, '');
    table(advisoryOnly);
    lines.push('</details>', '');
  }
  const md = lines.join('\n') + '\n';
  out('');
  for (const f of blocking) out(`NEW ${f.file ?? '(global)'}${f.line ? `:${f.line}` : ''}${f.col ? `:${f.col}` : ''}  ${f.rule}  ${f.message}`);
  for (const f of advisoryOnly) out(`new (untouched file, not blocking) ${f.file ?? '(global)'}${f.line ? `:${f.line}` : ''}  ${f.rule}  ${f.message}`);
  out(heading.replace(/^### /, ''));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  return md;
}

// --------------------------------------------------------------------------
// ESLint
// --------------------------------------------------------------------------

/**
 * @param eslintResults parsed `eslint --format json` output
 * @param diff result of parseDiff
 * @param root directory ESLint's absolute filePaths are relative to
 */
export function newEslintErrors(eslintResults, diff, root) {
  const found = [];
  for (const res of eslintResults) {
    const rel = path.relative(root, res.filePath).split(path.sep).join('/');
    const changed = diff.get(rel);
    if (!changed) continue;
    for (const m of res.messages) {
      if (m.severity !== 2) continue;
      if (!(m.fatal || changed.added.has(m.line))) continue;
      found.push({
        file: rel, line: m.line, col: m.column,
        rule: m.ruleId ?? (m.fatal ? 'parse error' : 'eslint'),
        title: `ESLint ${m.ruleId ?? 'parse error'}`,
        message: m.message,
      });
    }
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

// --------------------------------------------------------------------------
// TypeScript
// --------------------------------------------------------------------------

const TSC_LOCATED = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const TSC_GLOBAL = /^error (TS\d+): (.*)$/;

/**
 * Parse `tsc --pretty false` output. Indented continuation lines (message
 * chains) are kept for display but not used for matching.
 * `roots` are absolute directories replaced by <root> in messages, so the same
 * error on the base checkout and on the head checkout compares equal.
 */
export function parseTsc(text, roots = []) {
  const errors = [];
  const norm = (s) => roots.filter(Boolean).reduce((acc, r) => acc.split(r.replace(/\/$/, '')).join('<root>'), s);
  // tsc prints paths relative to the cwd; should one come out absolute, make
  // it relative to whichever checkout root it is under so it matches the diff.
  const relFile = (f) => {
    let p = f.split(path.sep).join('/');
    for (const r of roots.filter(Boolean)) {
      const root = r.replace(/\/$/, '') + '/';
      if (p.startsWith(root)) { p = p.slice(root.length); break; }
    }
    return p.replace(/^\.\//, '');
  };
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    let m = TSC_LOCATED.exec(line);
    if (m) {
      errors.push({ file: relFile(m[1]), line: Number(m[2]), col: Number(m[3]), code: m[4], message: norm(m[5]) });
      continue;
    }
    m = TSC_GLOBAL.exec(line);
    if (m) {
      errors.push({ file: null, line: 0, col: 0, code: m[1], message: norm(m[2]) });
      continue;
    }
    if (/^\s+\S/.test(line) && errors.length) errors[errors.length - 1].detail = ((errors[errors.length - 1].detail ?? '') + '\n' + norm(line.trim())).trim();
  }
  return errors;
}

/**
 * Matching form of a tsc message. TypeScript prints union members in type-
 * creation order, which shifts when a PR adds or reorders code elsewhere: seen
 * on PR #117, where an unchanged error read `"login" | "password_reset" |
 * "signup"` on head but `"login" | "signup" | "password_reset"` on base. Union
 * members inside each quoted type are sorted so that reads as the same error.
 */
export function canonicalMessage(message) {
  return message.replace(/'([^']*)'/g, (whole, type) => (type.includes(' | ')
    ? `'${type.split(' | ').map((t) => t.trim()).sort().join(' | ')}'`
    : whole));
}

const key = (e) => `${e.code}\u0000${canonicalMessage(e.message)}`;

function groupBy(errors, fileOf) {
  const g = new Map();
  for (const e of errors) {
    const f = fileOf(e);
    if (!g.has(f)) g.set(f, []);
    g.get(f).push(e);
  }
  return g;
}

/**
 * @returns {{blocking: object[], elsewhere: object[]}} head errors not present
 *   on base. `blocking`: in files the PR adds/modifies (plus new global
 *   errors). `elsewhere`: in other files.
 */
export function newTscErrors(headErrors, baseErrors, diff) {
  const baseByFile = groupBy(baseErrors, (e) => e.file ?? '');
  const headByFile = groupBy(headErrors, (e) => e.file ?? '');
  const blocking = [];
  const elsewhere = [];
  for (const [file, errs] of headByFile) {
    const changed = file ? diff.get(file) : null;
    const basePath = changed ? changed.oldPath : file; // renames: compare with the old path
    const remaining = new Map();
    for (const e of (basePath === null ? [] : baseByFile.get(basePath) ?? [])) remaining.set(key(e), (remaining.get(key(e)) ?? 0) + 1);
    // When a (code, message) occurs more often on head than on base, the base
    // occurrences are matched against untouched lines first, so the excess
    // reported is the occurrences on lines the PR touched: the likely new ones.
    const ordered = [...errs].sort((a, b) => {
      const ta = changed?.added.has(a.line) ? 1 : 0;
      const tb = changed?.added.has(b.line) ? 1 : 0;
      return ta - tb || a.line - b.line;
    });
    const fresh = [];
    for (const e of ordered) {
      const n = remaining.get(key(e)) ?? 0;
      if (n > 0) remaining.set(key(e), n - 1);
      else fresh.push(e);
    }
    const target = (changed || !file) ? blocking : elsewhere;
    for (const e of fresh) {
      target.push({
        file: e.file, line: e.line, col: e.col, rule: e.code, title: `TypeScript ${e.code}`,
        message: e.detail ? `${e.message} ${e.detail.split('\n')[0]}` : e.message,
      });
    }
  }
  const order = (a, b) => (a.file ?? '').localeCompare(b.file ?? '') || a.line - b.line;
  return { blocking: blocking.sort(order), elsewhere: elsewhere.sort(order) };
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

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

// tsc: 0 = clean, 1/2 = diagnostics reported. Anything else (OOM, signal,
// missing binary) means the output cannot be trusted as an error list.
const TSC_OK_EXIT = new Set(['0', '1', '2']);

export function main(argv, out = console.log) {
  const o = parseArgs(argv);
  const diff = parseDiff(readFileSync(o.diff, 'utf8'));
  const advisory = Boolean(o.advisory);

  if (o._cmd === 'files') {
    const under = o.under ?? '';
    for (const [file] of diff) if (TS_FILE.test(file) && file.startsWith(under)) out(file);
    return 0;
  }

  if (o._cmd === 'eslint') {
    const results = JSON.parse(readFileSync(o.report, 'utf8'));
    const blocking = newEslintErrors(results, diff, path.resolve(o.root ?? '.'));
    report({
      tool: 'ESLint', blocking, advisory, out,
      note: 'Only errors on lines this PR adds or changes are gated; pre-existing errors elsewhere in the same files are not. Warnings never block.',
    });
    return blocking.length && !advisory ? 1 : 0;
  }

  if (o._cmd === 'tsc') {
    for (const side of ['head', 'base']) {
      const code = o[`${side}-exit`];
      if (code !== undefined && !TSC_OK_EXIT.has(String(code))) {
        const msg = `tsc on the ${side} exited with ${code}; cannot compare type errors.`;
        out(annotation(advisory ? 'warning' : 'error', { title: 'TypeScript check did not complete', message: msg }));
        if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### TypeScript: check did not complete\n\n${msg}\n`);
        return advisory ? 0 : 1;
      }
    }
    const roots = [o['head-root'], o['base-root']].map((r) => (r ? path.resolve(r) : r));
    const head = parseTsc(readFileSync(o.head, 'utf8'), roots);
    const base = parseTsc(readFileSync(o.base, 'utf8'), roots);
    const { blocking, elsewhere } = newTscErrors(head, base, diff);
    report({
      tool: 'TypeScript', blocking, advisoryOnly: elsewhere, advisory, out,
      note: `Compared with the PR base by file + error code + message (line numbers ignored). Head: ${head.length} errors, base: ${base.length}.`,
    });
    return blocking.length && !advisory ? 1 : 0;
  }

  throw new Error(`unknown command: ${o._cmd} (expected files | eslint | tsc)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    // A crash in the gate itself must not block a draft PR either.
    const advisory = process.argv.includes('--advisory');
    console.log(annotation(advisory ? 'warning' : 'error', { title: 'new-lint-errors', message: err.stack ?? String(err) }));
    process.exitCode = advisory ? 0 : 2;
  }
}
