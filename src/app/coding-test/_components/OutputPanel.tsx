'use client';

import { CheckCircle2, FlaskConical, Lock, Terminal, XCircle } from 'lucide-react';
import type { RunResult } from '../_lib/types';

export default function OutputPanel({ result }: { result: RunResult }) {
  const success = result.exit_code === 0;
  const hasOutput = result.stdout || result.stderr;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e] text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Terminal className="h-3.5 w-3.5" aria-hidden />
          <span className="font-medium">Output</span>
          <span className="ml-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
            sample tests
          </span>
        </div>
        {success ? (
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            <span>Exited 0</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-rose-400">
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            <span>Exited {result.exit_code}</span>
          </div>
        )}
      </div>

      {/* Output body */}
      <div className="max-h-52 overflow-y-auto p-3">
        {!hasOutput && (
          <p className="font-mono italic text-slate-500">No output.</p>
        )}
        {result.stdout && (
          <pre className="whitespace-pre-wrap font-mono leading-5 text-slate-200">{result.stdout}</pre>
        )}
        {result.stderr && (
          <pre className="mt-1 whitespace-pre-wrap font-mono text-rose-400">{result.stderr}</pre>
        )}
      </div>

      {/* Hidden test case note */}
      <div className="flex items-start gap-2 border-t border-slate-700 px-3 py-2">
        <FlaskConical className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" aria-hidden />
        <p className="text-[10px] leading-4 text-slate-500">
          <span className="text-slate-400">Sample tests only.</span> Click{' '}
          <span className="font-semibold text-indigo-400">Submit for grading</span> to run your
          code against{' '}
          <span className="inline-flex items-center gap-0.5">
            <Lock className="h-2.5 w-2.5" aria-hidden />
            hidden test cases
          </span>{' '}
          and get AI feedback on correctness, efficiency, and edge cases.
        </p>
      </div>
    </div>
  );
}
