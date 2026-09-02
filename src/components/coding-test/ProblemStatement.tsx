'use client';

import { Clock, Database } from 'lucide-react';
import type { CodingProblemDetail } from '@/types/codingTest';
import { DIFFICULTY_BADGE } from '@/app/coding-test/_lib/ui';

interface ProblemStatementProps {
  problem: CodingProblemDetail;
}

export default function ProblemStatement({ problem }: ProblemStatementProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{problem.title}</h1>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[problem.difficulty]}`}
        >
          {problem.difficulty}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-500">{problem.tag}</p>

      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {problem.statement}
      </div>

      {problem.examples.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Examples</h2>
          <div className="space-y-3">
            {problem.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <p className="font-mono text-xs text-slate-700">
                  <span className="font-semibold">Input:</span> {ex.input}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-700">
                  <span className="font-semibold">Output:</span> {ex.output}
                </p>
                {ex.explanation && (
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-semibold">Explanation:</span> {ex.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {problem.constraints.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Constraints</h2>
          <ul className="list-inside list-disc space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="font-mono text-xs text-slate-600">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Clock className="h-4 w-4 text-slate-400" aria-hidden />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Expected time</p>
            <p className="font-mono text-sm text-slate-700">{problem.expected_time_complexity}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Database className="h-4 w-4 text-slate-400" aria-hidden />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Expected space</p>
            <p className="font-mono text-sm text-slate-700">{problem.expected_space_complexity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
