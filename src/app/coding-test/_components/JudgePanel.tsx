'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronRight,
  Clock, FlaskConical, Lock, XCircle,
} from 'lucide-react';

import type { JudgeResponse, JudgeTestCaseResult, JudgeStatus } from '../_lib/types';

/* ── per-status config ── */
const STATUS_CFG: Record<JudgeStatus, { color: string; label: string }> = {
  passed:                { color: 'text-emerald-600', label: 'Passed'       },
  wrong_answer:          { color: 'text-rose-500',    label: 'Wrong Answer' },
  runtime_error:         { color: 'text-amber-500',   label: 'Runtime Error'},
  time_limit_exceeded:   { color: 'text-orange-500',  label: 'TLE'         },
  memory_limit_exceeded: { color: 'text-red-500',     label: 'MLE'         },
};

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5)  return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

/* ── clean checklist test-case row ── */
function TestCaseRow({
  tc, num,
}: { tc: JudgeTestCaseResult; num: number }) {
  const [open, setOpen] = useState(!tc.passed);
  const cfg = STATUS_CFG[tc.status] ?? STATUS_CFG.wrong_answer;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        {/* Status icon */}
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          tc.passed ? 'bg-emerald-100' : 'bg-rose-100'
        }`}>
          {tc.passed
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            : <XCircle      className="h-4 w-4 text-rose-500"    aria-hidden />}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Test Case {num}</p>
          {tc.wall_time_ms > 0 && (
            <p className="text-[11px] text-slate-400 mt-px flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {tc.wall_time_ms}ms
            </p>
          )}
        </div>

        {/* Status badge */}
        <span className={`shrink-0 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>

        {/* Expand chevron */}
        {open
          ? <ChevronDown  className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />}
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Expected</p>
            <pre className="whitespace-pre-wrap rounded bg-white border border-slate-200 px-3 py-2 font-mono text-[12px] leading-5 text-emerald-700">
              {tc.expected_output || '(empty)'}
            </pre>
          </div>
          {!tc.passed && tc.stdout && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Your Output</p>
              <pre className="whitespace-pre-wrap rounded bg-white border border-rose-200 px-3 py-2 font-mono text-[12px] leading-5 text-rose-600">{tc.stdout}</pre>
            </div>
          )}
          {tc.stderr && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Error</p>
              <pre className="whitespace-pre-wrap rounded bg-white border border-amber-200 px-3 py-2 font-mono text-[12px] leading-5 text-amber-700">{tc.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── history entry type (internal) ── */
interface HistoryItem {
  id: number;
  result: JudgeResponse;
  mode: 'run' | 'submit';
  timestamp: Date;
}

/* ── main component ── */
interface JudgePanelProps {
  result: JudgeResponse;
  mode: 'run' | 'submit';
}

export default function JudgePanel({ result, mode }: JudgePanelProps) {
  const counterRef = useRef(0);
  const [history,    setHistory]    = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const [, setTick] = useState(0);

  /* accumulate new results; latest result = most recent top */
  useEffect(() => {
    const id = ++counterRef.current;
    const item: HistoryItem = { id, result, mode, timestamp: new Date() };
    setHistory((prev) => [item, ...prev]);
    setSelectedId(id);
  }, [result, mode]);

  /* re-render time labels every 15 s */
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(interval);
  }, []);

  const selected = history.find((h) => h.id === selectedId) ?? history[0];
  if (!selected) return null;

  const { result: sel, mode: selMode } = selected;
  const accepted = sel.verdict === 'accepted';
  const failed   = sel.total - sel.passed;

  const verdictHeading =
    selMode === 'submit'
      ? accepted ? 'Submission Passed' : 'Submission Failed'
      : accepted ? 'All Sample Tests Passed' : 'Some Tests Failed';

  const verdictSub =
    selMode === 'submit'
      ? `Submitted ${timeAgo(selected.timestamp)}`
      : `Run ${timeAgo(selected.timestamp)}`;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ══ Left sidebar: submission history (always shown) ══ */}
      <div className="flex w-[130px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 p-2">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">History</p>
        {history.length === 0 && (
          <p className="px-1 text-[11px] text-slate-400">No runs yet</p>
        )}
        {history.map((h) => {
          const isActive = h.id === selectedId;
          const ok = h.result.verdict === 'accepted';
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedId(h.id)}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                isActive
                  ? ok ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-rose-50 ring-1 ring-rose-200'
                  : 'hover:bg-slate-100'
              }`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                ok ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                {ok
                  ? <CheckCircle2 className="h-3 w-3 text-white" aria-hidden />
                  : <XCircle      className="h-3 w-3 text-white" aria-hidden />}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-[11px] font-semibold ${
                  isActive
                    ? ok ? 'text-emerald-700' : 'text-rose-600'
                    : 'text-slate-600'
                }`}>
                  {h.mode === 'run' ? 'Run' : 'Submit'}
                </p>
                <p className="text-[10px] text-slate-400">{timeAgo(h.timestamp)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ══ Main content ══ */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto p-5">

          {/* Verdict heading */}
          <h3 className={`text-xl font-bold ${accepted ? 'text-slate-800' : 'text-rose-600'}`}>
            {verdictHeading}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{verdictSub}</p>

          {/* Score bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {sel.passed} of {sel.total} test{sel.total !== 1 ? 's' : ''} passed
              </span>
              {failed > 0 && (
                <span className="font-semibold text-rose-500">{failed} failed</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  accepted ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: sel.total > 0 ? `${(sel.passed / sel.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Celebratory message */}
          {accepted && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Your code passed all our tests.{' '}
              <span className="font-semibold text-emerald-600">Way to go!</span>
            </p>
          )}

          {/* Test case checklist OR hidden-test summary */}
          {sel.results.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">
                {selMode === 'submit'
                  ? `${sel.passed} of ${sel.total} hidden test cases passed.`
                  : 'No test case details available.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sel.results.map((tc, i) => (
                <TestCaseRow key={tc.index} tc={tc} num={i + 1} />
              ))}
            </div>
          )}

          {/* Hidden tests nudge (run mode only) */}
          {selMode === 'run' && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold text-indigo-700 mb-0.5 flex items-center gap-1">
                  Hidden Test Cases
                  <Lock className="h-2.5 w-2.5 text-indigo-400" aria-hidden />
                </p>
                <p className="text-[11px] leading-5 text-indigo-600">
                  Click <span className="font-bold">Submit</span> to run against all hidden test cases and get your final verdict.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Congratulations bar (submit + accepted) ── */}
        {selMode === 'submit' && accepted && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
            <p className="text-sm font-medium text-slate-700">
              Congratulations, all tests have passed!
            </p>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Finish lesson
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
