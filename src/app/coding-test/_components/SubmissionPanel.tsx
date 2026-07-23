'use client';

import {
  AlertCircle, CheckCircle2, Lightbulb, Lock, Trophy, XCircle,
} from 'lucide-react';
import type { SubmissionResult, SubmitVerdict } from '../_lib/types';

const VERDICT_CFG: Record<SubmitVerdict, {
  Icon: React.ElementType;
  border: string;
  bg: string;
  text: string;
  label: string;
}> = {
  Accepted: {
    Icon: Trophy,
    border: 'border-emerald-700',
    bg:     'bg-emerald-950/30',
    text:   'text-emerald-400',
    label:  '✓ Accepted',
  },
  Partial: {
    Icon: AlertCircle,
    border: 'border-amber-700',
    bg:     'bg-amber-950/30',
    text:   'text-amber-400',
    label:  '~ Partial',
  },
  'Wrong Answer': {
    Icon: XCircle,
    border: 'border-rose-700',
    bg:     'bg-rose-950/30',
    text:   'text-rose-400',
    label:  '✗ Wrong Answer',
  },
  'Runtime Error': {
    Icon: AlertCircle,
    border: 'border-rose-700',
    bg:     'bg-rose-950/30',
    text:   'text-rose-400',
    label:  '✗ Runtime Error',
  },
  'Compilation Error': {
    Icon: AlertCircle,
    border: 'border-rose-700',
    bg:     'bg-rose-950/30',
    text:   'text-rose-400',
    label:  '✗ Compilation Error',
  },
};

function Bar({ pct, passed, total }: { pct: number; passed: number; total: number }) {
  const color =
    pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <p className="text-right font-mono text-[10px] text-slate-400 tabular-nums">
        {passed} / {total}
      </p>
    </div>
  );
}

export default function SubmissionPanel({ result }: { result: SubmissionResult }) {
  const cfg = VERDICT_CFG[result.verdict] ?? VERDICT_CFG['Wrong Answer'];
  const { Icon } = cfg;

  const hiddenPct = result.hiddenTotal > 0
    ? (result.hiddenPassed / result.hiddenTotal) * 100 : 0;
  const samplePct = result.sampleTotal > 0
    ? (result.samplePassed / result.sampleTotal) * 100 : 0;

  return (
    <div className="space-y-3 p-3">
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${cfg.border} ${cfg.bg}`}>
        <Icon className={`h-6 w-6 shrink-0 ${cfg.text}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`text-base font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Score:{' '}
            <span className="font-semibold text-slate-200">{result.score} / 100</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`text-3xl font-black tabular-nums ${cfg.text}`}>
            {result.score}
          </span>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">pts</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Sample tests */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Sample Tests
          </p>
          <p className="mt-1 text-lg font-bold text-slate-200">
            {result.samplePassed}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {result.sampleTotal}
            </span>
          </p>
          <Bar pct={samplePct} passed={result.samplePassed} total={result.sampleTotal} />
        </div>

        {/* Hidden tests */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-slate-500" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Hidden Tests
            </p>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-200">
            {result.hiddenPassed}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {result.hiddenTotal}
            </span>
          </p>
          <Bar pct={hiddenPct} passed={result.hiddenPassed} total={result.hiddenTotal} />
        </div>
      </div>

      {/* AI summary */}
      {result.summary && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-slate-300">{result.summary}</p>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="rounded-lg border border-amber-800/30 bg-amber-950/10 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            Suggestions
          </p>
          <ul className="space-y-1.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
