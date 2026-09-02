'use client';

import { CheckCircle2, Lightbulb } from 'lucide-react';

interface FeedbackSectionProps {
  suggestions: string[];
  summary?: string;
}

export default function FeedbackSection({ suggestions, summary }: FeedbackSectionProps) {
  if (!summary && suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      {summary && (
        <p className="mb-3 text-sm leading-relaxed text-slate-700">{summary}</p>
      )}
      {suggestions.length > 0 && (
        <>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Suggestions
          </p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
