import { NextRequest, NextResponse } from 'next/server';

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
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

async function resolveCompiler(lang: Lang): Promise<string> {
  const cached = compilerCache[lang];
  if (cached) return cached;

  const cfg = LANG_CONFIG[lang];
  let runtimes: { name: string; language: string }[] = [];

  try {
    const res = await fetch(RUNTIMES_URL, { next: { revalidate: 3600 } });
    if (res.ok) runtimes = await res.json();
  } catch {
    // fall through to hardcoded fallback
  }

  const match = runtimes.find(
    (r) => r.language === cfg.language && r.name.startsWith(cfg.compilerPrefix),
  );

  const FALLBACKS: Record<Lang, string> = {
    python: 'cpython-3.12.0',
    java:   'openjdk-jdk-21+35',
    cpp:    'gcc-13.2.0',
    c:      'gcc-13.2.0',
  };

  const compiler = match?.name ?? FALLBACKS[lang];
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
  // Rename Solution→Main so Wandbox (which uses Main.java) can compile.
  // We can't easily inject calls without knowing the method signature,
  // so just ensure compilation works and note the examples.
  const renamed = userCode.replace(/\bSolution\b/g, 'Main');

  if (examples.length === 0) return renamed;

  // Insert a main method that prints example expectations (read-only reminder).
  const exampleComment = examples
    .map((e, i) => `    // Test ${i + 1}: ${e.input} → ${e.output}`)
    .join('\n');

  // Try to insert main() before the last closing brace of the class
  const lastBrace = renamed.lastIndexOf('}');
  if (lastBrace === -1) return renamed;

  const mainMethod = [
    '',
    '    public static void main(String[] args) {',
    '        // Run these examples to test your solution:',
    exampleComment,
    '        System.out.println("Add print() calls here to test your solution.");',
    '    }',
  ].join('\n');

  return renamed.slice(0, lastBrace) + mainMethod + '\n}';
}

function buildCppTestHarness(userCode: string, examples: Example[]): string {
  if (examples.length === 0) return userCode;

  const exampleComment = examples
    .map((e, i) => `// Test ${i + 1}: ${e.input} → ${e.output}`)
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
    .map((e, i) => `// Test ${i + 1}: ${e.input} → ${e.output}`)
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

  const compiler = await resolveCompiler(language);

  const wandboxBody: Record<string, unknown> = {
    compiler,
    code: mainCode,
    save: false,
  };
  if (cfg.options) wandboxBody.options = cfg.options;

  let wandboxRes: Response;
  try {
    wandboxRes = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wandboxBody),
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the code execution service.' },
      { status: 503 },
    );
  }

  if (!wandboxRes.ok) {
    delete compilerCache[language];
    return NextResponse.json(
      { error: `Code execution service returned ${wandboxRes.status}.` },
      { status: wandboxRes.status },
    );
  }

  const data = await wandboxRes.json();

  const stdout: string = data.program_output ?? '';
  const compilerErr: string = data.compiler_output ?? data.compiler_error ?? '';
  const programErr: string = data.program_error ?? '';
  const stderr = [compilerErr, programErr].filter(Boolean).join('\n');
  const exitCode = Number.parseInt(String(data.status ?? '0'), 10) || 0;

  return NextResponse.json({ stdout, stderr, exit_code: exitCode });
}
