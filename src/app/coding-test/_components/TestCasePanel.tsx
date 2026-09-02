'use client';

import { useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight, FlaskConical,
  Lock, Trophy, XCircle,
} from 'lucide-react';
import type { TestCaseResult, ParsedTestResults } from '../_lib/types';

/* ── per-row status icon ── */
function StatusIcon({ status }: { status: TestCaseResult['status'] }) {
  if (status === 'pass')
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />;
  if (status === 'fail')
    return <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden />;
  return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />;
}

/* ── expandable test case row ── */
function TestCaseRow({ tc }: { tc: TestCaseResult }) {
  const [open, setOpen] = useState(tc.status !== 'pass');

  const borderCls =
    tc.status === 'pass'
      ? 'border-emerald-800/40 bg-emerald-950/20'
      : tc.status === 'fail'
      ? 'border-rose-800/40 bg-rose-950/20'
      : 'border-amber-800/40 bg-amber-950/20';

  const labelCls =
    tc.status === 'pass' ? 'text-emerald-400'
    : tc.status === 'fail' ? 'text-rose-400'
    : 'text-amber-400';

  const label =
    tc.status === 'pass' ? 'Passed' : tc.status === 'fail' ? 'Failed' : 'Error';

  return (
    <div className={`rounded border ${borderCls}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <StatusIcon status={tc.status} />
        <span className="flex-1 text-xs font-medium text-slate-200">
          Test Case {tc.index}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${labelCls}`}>
          {label}
        </span>
        {open
          ? <ChevronDown className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
          : <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-700/60 px-3 py-2.5">
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Input
            </p>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-slate-300">
              {tc.input}
            </pre>
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Expected Output
            </p>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-emerald-300">
              {tc.expected}
            </pre>
          </div>
          {tc.status !== 'pass' && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Your Output
              </p>
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-rose-300">
                {tc.actual || '(no output)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── verdict derived purely from execution (no AI) ── */
type Verdict = 'accepted' | 'wrong' | 'error' | 'none';

function getVerdict(
  passed: number,
  total: number,
  exitCode: number | undefined,
  hasResults: boolean,
): Verdict {
  if (!hasResults || total === 0) return 'none';
  if (exitCode !== undefined && exitCode !== 0) return 'error';
  if (passed === total) return 'accepted';
  return 'wrong';
}

const VERDICT_CFG: Record<Exclude<Verdict, 'none'>, {
  Icon: React.ElementType;
  label: string;
  border: string;
  bg: string;
  text: string;
}> = {
  accepted: {
    Icon: Trophy,
    label: 'Accepted',
    border: 'border-emerald-700',
    bg:     'bg-emerald-950/30',
    text:   'text-emerald-400',
  },
  wrong: {
    Icon: XCircle,
    label: 'Wrong Answer',
    border: 'border-rose-700',
    bg:     'bg-rose-950/30',
    text:   'text-rose-400',
  },
  error: {
    Icon: AlertCircle,
    label: 'Runtime Error',
    border: 'border-amber-700',
    bg:     'bg-amber-950/30',
    text:   'text-amber-400',
  },
};

/* ── main component ── */
interface TestCasePanelProps extends ParsedTestResults {
  language: string;
  exitCode?: number;
  showVerdict?: boolean;
}

export default function TestCasePanel({
  results,
  passed,
  failed,
  total,
  language,
  exitCode,
  showVerdict = false,
}: TestCasePanelProps) {
  const isPython = language === 'python';
  const allPassed = passed === total && total > 0;
  const verdict = showVerdict ? getVerdict(passed, total, exitCode, results.length > 0) : 'none';
  const verdictCfg = verdict !== 'none' ? VERDICT_CFG[verdict] : null;

  return (
    <div className="space-y-2 p-3">
      {/* ── Execution-based verdict banner (no AI) ── */}
      {verdictCfg && (
        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${verdictCfg.border} ${verdictCfg.bg}`}>
          <verdictCfg.Icon className={`h-5 w-5 shrink-0 ${verdictCfg.text}`} aria-hidden />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${verdictCfg.text}`}>{verdictCfg.label}</p>
            <p className="text-[11px] text-slate-400">
              {verdict === 'accepted'
                ? `All ${total} sample test${total !== 1 ? 's' : ''} passed`
                : verdict === 'wrong'
                ? `${failed} of ${total} sample test${total !== 1 ? 's' : ''} failed`
                : 'Code exited with a non-zero status'}
            </p>
          </div>
          {verdict === 'accepted' && (
            <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-400">
              {passed}/{total}
            </span>
          )}
        </div>
      )}

      {/* ── Sample tests header ── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Sample Test Cases</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-emerald-400">{passed} passed</span>
          {failed > 0 && (
            <span className="font-semibold text-rose-400">{failed} failed</span>
          )}
          <span className="text-slate-500">/ {total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            allPassed ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: total > 0 ? `${(passed / total) * 100}%` : '0%' }}
        />
      </div>

      {/* Non-Python note */}
      {!isPython ? (
        <div className="rounded border border-amber-800/40 bg-amber-950/20 px-3 py-2.5 text-[11px] leading-5 text-amber-300">
          Per-test-case comparison is available for <strong>Python</strong> only.
          For {language.toUpperCase()}, review raw output in the <strong>Output</strong> tab.
        </div>
      ) : total === 0 ? (
        <p className="font-mono text-[13px] italic text-slate-500">
          No sample test cases found for this problem.
        </p>
      ) : (
        results.map((tc) => <TestCaseRow key={tc.index} tc={tc} />)
      )}

      {/* ── Hidden tests section ── */}
      <div className="mt-1 rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
          <span className="text-[11px] font-semibold text-slate-400">Hidden Test Cases</span>
          <Lock className="h-2.5 w-2.5 text-slate-600" aria-hidden />
        </div>
        <p className="text-[11px] leading-5 text-slate-500">
          Hidden test cases will be evaluated when judge-service integration is complete
          (coming soon). Sample test results above reflect the visible test coverage only.
        </p>
      </div>
    </div>
  );
}
