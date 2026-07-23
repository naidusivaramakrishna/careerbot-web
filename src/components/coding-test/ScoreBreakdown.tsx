'use client';

import type { ScoreBreakdown } from '@/types/codingTest';
import { CRITERION_ORDER } from '@/types/codingTest';

const CRITERION_LABEL: Record<string, string> = {
  correctness: 'Correctness',
  efficiency: 'Efficiency',
  code_quality: 'Code Quality',
  edge_cases: 'Edge Cases',
};

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
}

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="space-y-2.5">
      {CRITERION_ORDER.map((key) => {
        const c = breakdown[key];
        if (!c) return null;
        const weight =
          Number.isFinite(c.weight) && c.weight > 0 ? Math.round(c.weight) : 0;
        const rawScore = Number.isFinite(c.score) ? Math.round(c.score) : 0;
        const score = weight > 0 ? Math.min(weight, Math.max(0, rawScore)) : 0;
        const pct = weight > 0 ? Math.round((score / weight) * 100) : 0;
        return (
          <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                {CRITERION_LABEL[key] ?? key}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {score} / {weight}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  pct >= 75
                    ? 'bg-emerald-500'
                    : pct >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            {c.feedback && (
              <p className="mt-1.5 text-xs text-slate-600">{c.feedback}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
