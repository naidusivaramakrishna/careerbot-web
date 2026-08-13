'use client';

import Link from 'next/link';
import { AlertCircle, RotateCw, SearchX } from 'lucide-react';
import type { HistoryEntry } from '@/types/codingTest';
import { normalizeScore } from '@/app/coding-test/_lib/ui';

function scoreTone(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

interface HistoryTableProps {
  entries: HistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  authRequired: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

export default function HistoryTable({
  entries,
  total,
  page,
  totalPages,
  loading,
  error,
  authRequired,
  onPageChange,
  onRetry,
}: HistoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
        <AlertCircle className="h-8 w-8 text-indigo-400" aria-hidden />
        <h2 className="text-base font-semibold text-slate-800">Sign in to see your history</h2>
        <p className="text-sm text-slate-500">
          Your past submissions are saved to your account.
        </p>
        <Link
          href="/?showLogin=true"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />
        <p className="text-sm font-medium text-rose-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
        <SearchX className="h-8 w-8 text-slate-400" aria-hidden />
        <h2 className="text-base font-semibold text-slate-800">No submissions yet</h2>
        <p className="text-sm text-slate-500">
          Solve a problem and submit it for grading — it&apos;ll show up here.
        </p>
        <Link
          href="/coding-test"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Browse problems
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500" aria-live="polite">
        {total} submission{total === 1 ? '' : 's'}
      </p>

      <ul className="space-y-2">
        {entries.map((e) => {
          const s = normalizeScore(e.score);
          return (
            <li key={e.submission_id}>
              <Link
                href={`/coding-test/${e.problem_slug}?submission=${e.submission_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {e.problem_slug}
                  </p>
                  <p className="text-xs text-slate-400">
                    {e.language} · {formatDate(e.submitted_at)}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${scoreTone(s)}`}>
                  {s === null ? '—' : `${s} / 100`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:border-indigo-300"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:border-indigo-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
