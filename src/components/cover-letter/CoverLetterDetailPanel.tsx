'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useCoverLetter } from '@/hooks/useCoverLetter';

interface CoverLetterDetailPanelProps {
  letterId: string;
}

export default function CoverLetterDetailPanel({ letterId }: CoverLetterDetailPanelProps) {
  const { letter, isLoading, error } = useCoverLetter(letterId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#2257a7]" />
        <span className="sr-only">Loading letter…</span>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center">
          <p className="text-slate-500 mb-4 text-sm">Could not load this letter.</p>
          <Link
            href={`/cover-letter/${encodeURIComponent(letterId)}`}
            className="text-sm text-[#2257a7] hover:underline"
          >
            Open in full view →
          </Link>
        </div>
      </div>
    );
  }

  const cl = letter.cover_letter;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Panel header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
              Cover Letter
            </p>
            <p className="text-sm text-slate-500">
              {new Date(letter.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Link
            href={`/cover-letter/${encodeURIComponent(letterId)}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#2257a7] hover:text-[#184284] border border-[#2257a7]/30 hover:border-[#2257a7] rounded-lg px-3 py-1.5 transition-colors"
          >
            Full view
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Letter content */}
        {letter.status === 'failed' || !cl ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-600">
            Generation failed for this letter.{' '}
            <Link
              href="/cover-letter/new"
              className="underline hover:no-underline"
            >
              Try a new one →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-700 leading-relaxed space-y-4 shadow-sm">
            <p>{cl.greeting}</p>
            <p>{cl.opening}</p>
            {cl.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <p>{cl.closing}</p>
            <p className="font-medium">{cl.signature}</p>
          </div>
        )}
      </div>
    </div>
  );
}