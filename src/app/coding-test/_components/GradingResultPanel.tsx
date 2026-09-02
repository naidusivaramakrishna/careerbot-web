'use client';

import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

import { CRITERION_ORDER } from '../_lib/types';
import type { SubmitSolutionResponse } from '../_lib/types';
import { normalizeScore } from '../_lib/ui';

const CRITERION_LABEL: Record<string, string> = {
  correctness: 'Correctness',
  efficiency: 'Efficiency',
  code_quality: 'Code Quality',
  edge_cases: 'Edge Cases',
};

function scoreTone(pct: number): string {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export default function GradingResultPanel({
  result,
}: {
  result: SubmitSolutionResponse;
}) {
  // Grading failed or was blocked: no score, only an error reason.
  if (!result.grading_result) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Not graded
          </p>
          <p className="mt-0.5 text-sm text-amber-700">
            {result.error || 'We could not grade this submission. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const g = result.grading_result;
  // Clamp to a valid 0–100 (defense-in-depth; falls back to the breakdown total).
  const total =
    normalizeScore(result.score) ?? normalizeScore(g.total_score) ?? 0;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Grading result</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${scoreTone(total)}`}>{total}</span>
          <span className="text-sm text-slate-400">/ 100</span>
        </div>
      </div>

      {g.summary && (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{g.summary}</p>
      )}

      <div className="mt-4 space-y-2.5">
        {CRITERION_ORDER.map((key) => {
          const c = g.breakdown?.[key];
          if (!c) return null;
          // Defense-in-depth: a malformed grader response (NaN/Infinity/negative
          // weight/score > weight) must not render NaN% or impossible values.
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
                    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
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

      {g.suggestions && g.suggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Suggestions
          </p>
          <ul className="space-y-1">
            {g.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
