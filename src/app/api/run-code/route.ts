import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
const MAX_BODY_BYTES = 64 * 1024; // 64 KB
const RUNTIMES_URL = 'https://wandbox.org/api/list.json';

type Lang = 'python' | 'java' | 'cpp' | 'c';

interface WandboxConfig {
  compilerPrefix: string;
  language: string;
  options?: string;
}

const LANG_CONFIG: Record<Lang, WandboxConfig> = {
  python: { compilerPrefix: 'cpython-3',   language: 'Python' },
  java:   { compilerPrefix: 'openjdk-jdk', language: 'Java'   },
  cpp:    { compilerPrefix: 'gcc-',        language: 'C++', options: 'c++17,warning' },
  c:      { compilerPrefix: 'gcc-',        language: 'C',   options: 'c11,warning'   },
};

const compilerCache: Partial<Record<Lang, string>> = {};

const FALLBACKS: Record<Lang, string> = {
  python: 'cpython-3.12.7',
  java:   'openjdk-jdk-21+35',
  cpp:    'gcc-13.2.0',
  c:      'gcc-13.2.0-c',
};

async function fetchRuntimes(): Promise<{ name: string; language: string }[]> {
  try {
    const res = await fetch(RUNTIMES_URL, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {
    // fall through
  }
  return [];
}

async function resolveCompiler(lang: Lang, exclude?: string): Promise<string> {
  const cached = compilerCache[lang];
  if (cached && cached !== exclude) return cached;

  const cfg = LANG_CONFIG[lang];
  const runtimes = await fetchRuntimes();

  const match = runtimes.find(
    (r) => r.language === cfg.language && r.name.startsWith(cfg.compilerPrefix) && r.name !== exclude,
  );

  const fallback = FALLBACKS[lang];
  const compiler = match?.name ?? (fallback !== exclude ? fallback : (runtimes.find(
    (r) => r.language === cfg.language && r.name.startsWith(cfg.compilerPrefix),
  )?.name ?? fallback));

  compilerCache[lang] = compiler;
  return compiler;
}

// ---------------------------------------------------------------------------
// Test harness generators
// ---------------------------------------------------------------------------

interface Example {
  input: string;
  output: string;
}

function normalizeForPython(s: string): string {
  return s
    .replace(/\bnull\b/g, 'None')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False');
}

// Parameter names that conventionally hold tree nodes or linked-list heads
const TREE_PARAMS = new Set(['root', 'root1', 'root2', 'p', 'q', 'node', 'u', 'v']);
const LIST_PARAMS = new Set(['head', 'head1', 'head2', 'l1', 'l2', 'list1', 'list2']);

const TREENODE_CLASS = [
  'class TreeNode:',
  '    def __init__(self, val=0, left=None, right=None):',
  '        self.val = val; self.left = left; self.right = right',
].join('\n');

const BUILD_TREE_FN = [
  'def _build_tree(_vs):',
  '    if not _vs: return None',
  '    from collections import deque as _DQ',
  '    _ns = [TreeNode(v) if v is not None else None for v in _vs]',
  '    _q = _DQ([_ns[0]]); _i = 1',
  '    while _q and _i < len(_ns):',
  '        _nd = _q.popleft()',
  '        if _nd:',
  '            if _i < len(_ns): _nd.left  = _ns[_i]; _i += 1',
  '            if _i < len(_ns): _nd.right = _ns[_i]; _i += 1',
  '            if _nd.left:  _q.append(_nd.left)',
  '            if _nd.right: _q.append(_nd.right)',
  '    return _ns[0]',
].join('\n');

const LISTNODE_CLASS = [
  'class ListNode:',
  '    def __init__(self, val=0, next=None):',
  '        self.val = val; self.next = next',
].join('\n');

const BUILD_LIST_FN = [
  'def _build_list(_vs):',
  '    _d = ListNode(); _c = _d',
  '    for v in _vs: _c.next = ListNode(v); _c = _c.next',
  '    return _d.next',
].join('\n');

// Replace `param=[...]` with `param=_build_tree([...])` / `_build_list(...)` where needed.
function transformInput(input: string, useTree: boolean, useList: boolean): string {
  return input.replace(
    /\b(\w+)\s*=\s*(\[[^\]]*\])/g,
    (_m, name: string, listVal: string) => {
      if (useTree && TREE_PARAMS.has(name)) return `${name}=_build_tree(${listVal})`;
      if (useList && LIST_PARAMS.has(name)) return `${name}=_build_list(${listVal})`;
      return _m;
    },
  );
}

function buildPythonTestHarness(userCode: string, examples: Example[]): string {
  // Find the first non-dunder method inside class Solution — avoids matching
  // TreeNode.__init__ or other helper-class methods that appear earlier.
  const solutionBody = userCode.match(/class Solution[^:]*:([\s\S]+)/)?.[1] ?? '';
  const method = solutionBody.match(/def\s+(?!__\w)(\w+)\s*\(\s*self/)?.[1];
  if (!method || examples.length === 0) return userCode;

  const usesTree   = userCode.includes('TreeNode');
  const usesList   = userCode.includes('ListNode');
  const hasTreeCls = userCode.includes('class TreeNode');
  const hasListCls = userCode.includes('class ListNode');

  const preamble: string[] = ['', '# ── Auto-test against examples ─────────────────────────'];
  if (usesTree && !hasTreeCls) preamble.push(TREENODE_CLASS);
  if (usesTree)  preamble.push(BUILD_TREE_FN);
  if (usesList && !hasListCls) preamble.push(LISTNODE_CLASS);
  if (usesList)  preamble.push(BUILD_LIST_FN);
  preamble.push('_sol = Solution()');

  const lines = [...preamble];

  examples.forEach((ex, i) => {
    let inputArgs = normalizeForPython(ex.input);
    inputArgs = transformInput(inputArgs, usesTree, usesList);
    const expected = normalizeForPython(ex.output);
    const n = i + 1;
    lines.push(
      `try:`,
      `    _r${i} = _sol.${method}(${inputArgs})`,
      `    _e${i} = ${expected}`,
      `    if str(_r${i}) == str(_e${i}):`,
      `        print(f"Test ${n}: ✓ PASS  output={_r${i}!r}")`,
      `    else:`,
      `        print(f"Test ${n}: ✗ FAIL  got={_r${i}!r}  expected={_e${i}!r}")`,
      `except Exception as _ex${i}:`,
      `    print(f"Test ${n}: ✗ ERROR  {_ex${i}}")`,
    );
  });

  return userCode + '\n' + lines.join('\n');
}

function buildJavaTestHarness(userCode: string, examples: Example[]): string {
  const hasClass = /\bclass\s+\w+/.test(userCode);
  const codeBody = hasClass ? userCode.replace(/\bSolution\b/g, 'Main') : userCode;

  // Extract first non-constructor, non-main method name so we can call it
  const methodMatch = codeBody.match(
    /(?:public|private|protected)\s+(?:static\s+)?(?!void\b)(\w[\w<>\[\]]*)\s+(?!main\b)(\w+)\s*\(/,
  );
  const methodName = methodMatch?.[2];

  // Strip "param = value" key prefixes so we get bare argument list for the call
  function extractArgs(input: string): string {
    return input
      .split(/,\s*(?=\w+\s*=)/)
      .map(part => { const eq = part.indexOf('='); return eq !== -1 ? part.slice(eq + 1).trim() : part.trim(); })
      .join(', ');
  }

  const testLines: string[] = [];
  if (methodName && examples.length > 0) {
    testLines.push('        Main _sol = new Main();');
    examples.forEach((ex, i) => {
      const args = extractArgs(ex.input);
      const expected = ex.output.trim();
      const n = i + 1;
      testLines.push(
        `        try { var _r${i} = _sol.${methodName}(${args}); String _e${i} = String.valueOf(${expected});`,
        `            if (String.valueOf(_r${i}).equals(_e${i})) System.out.println("Test ${n}: \\u2713 PASS  output=" + _r${i});`,
        `            else System.out.println("Test ${n}: \\u2717 FAIL  got=" + _r${i} + "  expected=" + _e${i});`,
        `        } catch (Exception _ex${i}) { System.out.println("Test ${n}: \\u2717 ERROR  " + _ex${i}); }`,
      );
    });
  } else {
    examples.forEach((e, i) => testLines.push(`        // Test ${i + 1}: ${e.input} -> ${e.output}`));
    testLines.push('        System.out.println("Add test calls here to verify your solution.");');
  }

  const mainMethod = [
    '',
    '    public static void main(String[] args) {',
    ...testLines,
    '    }',
  ].join('\n');

  if (hasClass) {
    const lastBrace = codeBody.lastIndexOf('}');
    if (lastBrace === -1) return codeBody;
    return codeBody.slice(0, lastBrace) + mainMethod + '\n}';
  }

  // Bare method(s) — wrap in a class so Wandbox can compile
  const indented = codeBody.trim().split('\n').map(l => '    ' + l).join('\n');
  return ['public class Main {', indented, mainMethod, '}'].join('\n');
}

function buildCppTestHarness(userCode: string, examples: Example[]): string {
  if (examples.length === 0) return userCode;

  const exampleComment = examples
    .map((e, i) => `// Test ${i + 1}: ${e.input} -> ${e.output}`)
    .join('\n');

  return [
    userCode,
    '',
    exampleComment,
    'int main() {',
    '    // Add your test calls here, e.g.:',
    '    // Solution sol;',
    '    // cout << sol.yourMethod(...) << endl;',
    '    return 0;',
    '}',
  ].join('\n');
}

function buildCTestHarness(userCode: string, examples: Example[]): string {
  if (examples.length === 0) return userCode;

  const exampleComment = examples
    .map((e, i) => `// Test ${i + 1}: ${e.input} -> ${e.output}`)
    .join('\n');

  return [
    '#include <stdio.h>',
    userCode,
    '',
    exampleComment,
    'int main() {',
    '    /* Add your test calls here */',
    '    return 0;',
    '}',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: { language: Lang; code: string; examples?: Example[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { language, code, examples = [] } = body;
  const cfg = LANG_CONFIG[language];
  if (!cfg) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  // Wrap user code in a language-appropriate test harness using the visible examples
  let mainCode: string;
  switch (language) {
    case 'python': mainCode = buildPythonTestHarness(code, examples); break;
    case 'java':   mainCode = buildJavaTestHarness(code, examples);   break;
    case 'cpp':    mainCode = buildCppTestHarness(code, examples);    break;
    case 'c':      mainCode = buildCTestHarness(code, examples);      break;
    default:       mainCode = code;
  }

  async function callWandbox(compiler: string): Promise<Response> {
    const body: Record<string, unknown> = { compiler, code: mainCode, save: false };
    if (cfg.options) body.options = cfg.options;
    return fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  let compiler = await resolveCompiler(language);
  let wandboxRes: Response;

  try {
    wandboxRes = await callWandbox(compiler);
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the code execution service.' },
      { status: 503 },
    );
  }

  // Auto-retry once with a freshly resolved compiler if we hit a 500
  if (!wandboxRes.ok && wandboxRes.status === 500) {
    delete compilerCache[language];
    const retryCompiler = await resolveCompiler(language, compiler);
    if (retryCompiler !== compiler) {
      try {
        const retryRes = await callWandbox(retryCompiler);
        if (retryRes.ok) {
          compiler = retryCompiler;
          wandboxRes = retryRes;
        }
      } catch {
        // fall through to error below
      }
    }
  }

  if (!wandboxRes.ok) {
    delete compilerCache[language];
    return NextResponse.json(
      { error: `Code execution service returned ${wandboxRes.status}.` },
      { status: wandboxRes.status },
    );
  }

  const data = await wandboxRes.json();

  const stdout: string = data.program_output || '';
  const compilerErr: string = data.compiler_output || data.compiler_error || '';
  const programErr: string = data.program_error || '';
  const stderr = [compilerErr, programErr].filter(Boolean).join('\n');
  const exitCode = Number.parseInt(String(data.status ?? '0'), 10) || 0;

  return NextResponse.json({ stdout, stderr, exit_code: exitCode });
}
