'use client';

import { AlertTriangle } from 'lucide-react';
import type { SubmitSolutionResponse } from '@/types/codingTest';
import { normalizeScore } from '@/app/coding-test/_lib/ui';
import ScoreBreakdown from './ScoreBreakdown';
import FeedbackSection from './FeedbackSection';

function scoreTone(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Review the problem and try again';
}

interface GradingResultProps {
  result: SubmitSolutionResponse;
}

export default function GradingResult({ result }: GradingResultProps) {
  if (!result.grading_result) {
    return (
      <div
        className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4"
        role="alert"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-amber-800">Not graded</p>
          <p className="mt-0.5 text-sm text-amber-700">
            {result.error || 'We could not grade this submission. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const g = result.grading_result;
  const total = normalizeScore(result.score) ?? normalizeScore(g.total_score) ?? 0;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Grading result</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${scoreTone(total)}`}>{total}</span>
          <span className="text-sm text-slate-400">/ 100</span>
        </div>
      </div>
      <p className={`mt-1 text-xs font-medium ${scoreTone(total)}`}>
        {scoreLabel(total)}
      </p>

      {g.breakdown && (
        <div className="mt-4">
          <ScoreBreakdown breakdown={g.breakdown} />
        </div>
      )}

      <FeedbackSection summary={g.summary} suggestions={g.suggestions ?? []} />
    </div>
  );
}
