'use client';

import { useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  Clock, FlaskConical, Lock, Trophy, XCircle, Zap,
} from 'lucide-react';
import type { JudgeResponse, JudgeTestCaseResult, JudgeStatus } from '../_lib/types';

/* ── per-status config ── */
const STATUS_CFG: Record<JudgeStatus, {
  Icon: React.ElementType;
  color: string;
  border: string;
  label: string;
}> = {
  passed:               { Icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-800/40 bg-emerald-950/20', label: 'Passed'              },
  wrong_answer:         { Icon: XCircle,      color: 'text-rose-400',    border: 'border-rose-800/40 bg-rose-950/20',       label: 'Wrong Answer'        },
  runtime_error:        { Icon: AlertCircle,  color: 'text-amber-400',   border: 'border-amber-800/40 bg-amber-950/20',     label: 'Runtime Error'       },
  time_limit_exceeded:  { Icon: Clock,        color: 'text-orange-400',  border: 'border-orange-800/40 bg-orange-950/20',   label: 'Time Limit'          },
  memory_limit_exceeded:{ Icon: Zap,          color: 'text-red-400',     border: 'border-red-800/40 bg-red-950/20',         label: 'Memory Limit'        },
};

const VERDICT_CFG = {
  accepted:               { Icon: Trophy,      label: 'Accepted',               border: 'border-emerald-700', bg: 'bg-emerald-950/30', text: 'text-emerald-400' },
  wrong_answer:           { Icon: XCircle,     label: 'Wrong Answer',           border: 'border-rose-700',    bg: 'bg-rose-950/30',    text: 'text-rose-400'    },
  runtime_error:          { Icon: AlertCircle, label: 'Runtime Error',          border: 'border-amber-700',   bg: 'bg-amber-950/30',   text: 'text-amber-400'   },
  time_limit_exceeded:    { Icon: Clock,       label: 'Time Limit Exceeded',    border: 'border-orange-700',  bg: 'bg-orange-950/30',  text: 'text-orange-400'  },
  memory_limit_exceeded:  { Icon: Zap,         label: 'Memory Limit Exceeded',  border: 'border-red-700',     bg: 'bg-red-950/30',     text: 'text-red-400'     },
  no_test_cases:          { Icon: AlertCircle, label: 'No Test Cases',          border: 'border-slate-700',   bg: 'bg-slate-950/30',   text: 'text-slate-400'   },
};

/* ── individual test case row ── */
function JudgeTestCaseRow({ tc, num }: { tc: JudgeTestCaseResult; num: number }) {
  const [open, setOpen] = useState(!tc.passed);
  const cfg = STATUS_CFG[tc.status] ?? STATUS_CFG.wrong_answer;
  const Icon = cfg.Icon;

  return (
    <div className={`rounded border ${cfg.border}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.color}`} aria-hidden />
        <span className="flex-1 text-xs font-medium text-slate-200">Test Case {num}</span>
        {tc.wall_time_ms > 0 && (
          <span className="text-[10px] text-slate-500">{tc.wall_time_ms}ms</span>
        )}
        <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
        {open
          ? <ChevronDown  className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
          : <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-700/60 px-3 py-2.5">
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Expected Output</p>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-emerald-300">
              {tc.expected_output || '(empty)'}
            </pre>
          </div>
          {!tc.passed && tc.stdout && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Your Output</p>
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-rose-300">{tc.stdout}</pre>
            </div>
          )}
          {tc.stderr && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Error Output</p>
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-amber-300">{tc.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main component ── */
interface JudgePanelProps {
  result: JudgeResponse;
  /** 'run' = sample tests only; 'submit' = all tests including hidden */
  mode: 'run' | 'submit';
}

export default function JudgePanel({ result, mode }: JudgePanelProps) {
  const vcfg = VERDICT_CFG[result.verdict] ?? VERDICT_CFG.no_test_cases;
  const VIcon = vcfg.Icon;
  const failed = result.total - result.passed;

  return (
    <div className="space-y-2 p-3">
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${vcfg.border} ${vcfg.bg}`}>
        <VIcon className={`h-5 w-5 shrink-0 ${vcfg.text}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${vcfg.text}`}>{vcfg.label}</p>
          <p className="text-[11px] text-slate-400">
            {mode === 'run' ? 'Sample tests only' : 'All test cases'} · {result.passed}/{result.total} passed
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-bold text-slate-400">
          {result.passed}/{result.total}
        </span>
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">
          {mode === 'run' ? 'Sample Test Cases' : 'All Test Cases'}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-emerald-400">{result.passed} passed</span>
          {failed > 0 && <span className="font-semibold text-rose-400">{failed} failed</span>}
          <span className="text-slate-500">/ {result.total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            result.verdict === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: result.total > 0 ? `${(result.passed / result.total) * 100}%` : '0%' }}
        />
      </div>

      {/* Per-test rows */}
      {result.results.length === 0 ? (
        <p className="font-mono text-[13px] italic text-slate-500">No test case details available.</p>
      ) : (
        result.results.map((tc, i) => (
          <JudgeTestCaseRow key={tc.index} tc={tc} num={i + 1} />
        ))
      )}

      {/* Hidden tests note (run mode only) */}
      {mode === 'run' && (
        <div className="mt-1 rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            <span className="text-[11px] font-semibold text-slate-400">Hidden Test Cases</span>
            <Lock className="h-2.5 w-2.5 text-slate-600" aria-hidden />
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Click <span className="font-semibold text-indigo-400">Submit</span> to run against
            all hidden test cases and get your final verdict.
          </p>
        </div>
      )}
    </div>
  );
}
