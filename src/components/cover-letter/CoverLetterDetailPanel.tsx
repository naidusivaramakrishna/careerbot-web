"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useCoverLetter } from "@/hooks/useCoverLetter";

interface CoverLetterDetailPanelProps {
  letterId: string;
  onDelete?: (letterId: string) => void;
}

export default function CoverLetterDetailPanel({ letterId, onDelete }: CoverLetterDetailPanelProps) {
  const { letter, isLoading, error } = useCoverLetter(letterId);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center 2xl:min-h-[520px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2557a7]" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading letter preview...</p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-5 2xl:min-h-[520px] 2xl:px-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-center 2xl:p-6">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-3 text-sm font-black text-red-700">Could not load this letter.</p>
          <Link
            href={`/cover-letter/${encodeURIComponent(letterId)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#2557a7] ring-1 ring-red-200 transition hover:ring-[#2557a7]"
          >
            Open full view
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const coverLetter = letter.cover_letter;
  const created = new Date(letter.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const wordCount = letter.metadata.word_count ?? letter.plain_text?.split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <div className="px-5 py-6 2xl:px-6 2xl:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between 2xl:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7] 2xl:text-xs">Selected letter</p>
            <h2 className="mt-2 text-xl font-black text-slate-950 2xl:text-2xl">Cover letter preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Created {created}
              {wordCount > 0 ? ` - ${wordCount} words` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Review required
            </span>
            <Link
              href={`/cover-letter/${encodeURIComponent(letterId)}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2557a7] px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1e4a94]"
            >
              Full view
              <ExternalLink className="h-4 w-4" />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(letterId)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {letter.status === "failed" || !coverLetter ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-6 text-center 2xl:p-8">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
            <h3 className="mt-3 text-lg font-black text-red-700">Generation failed</h3>
            <p className="mt-2 text-sm text-red-600">
              This draft could not be completed. Start a new generation with a stronger job source.
            </p>
            <Link
              href="/cover-letter/new"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 2xl:h-11 2xl:px-5"
            >
              Try again
              <Sparkles className="h-4 w-4" />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(letterId)}
                className="ml-3 mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 2xl:h-11 2xl:px-5"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        ) : (
          <article className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm 2xl:p-6">
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-7 text-slate-700">
              <p>{coverLetter.greeting}</p>
              <p>{coverLetter.opening}</p>
              {coverLetter.body.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
              ))}
              <p>{coverLetter.closing}</p>
              <p className="font-bold text-slate-950">{coverLetter.signature}</p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
