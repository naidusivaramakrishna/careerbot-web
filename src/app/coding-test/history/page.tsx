'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  History as HistoryIcon,
  RotateCw,
  SearchX,
} from 'lucide-react';

import { fetchHistory, GradingApiError } from '../_lib/gradingApi';
import type { HistoryEntry } from '../_lib/types';
import { normalizeScore } from '../_lib/ui';

type LoadState = 'loading' | 'error' | 'auth' | 'ready';
const PAGE_SIZE = 20;

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

export default function CodingTestHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    setErrorMessage('');

    fetchHistory(page, PAGE_SIZE)
      .then((res) => {
        if (!active) return;
        setEntries(res.entries);
        setTotal(res.total);
        setState('ready');
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof GradingApiError && err.status === 401) {
          setState('auth');
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
        setState('error');
      });

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/coding-test"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to problems
        </Link>

        <header className="mb-6 flex items-center gap-2 text-slate-900">
          <HistoryIcon className="h-5 w-5 text-indigo-600" aria-hidden />
          <h1 className="text-2xl font-bold">My submissions</h1>
        </header>

        {state === 'loading' && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {state === 'auth' && (
          <StatusCard
            icon={<AlertCircle className="h-8 w-8 text-indigo-400" aria-hidden />}
            title="Sign in to see your history"
            message="Your past submissions are saved to your account."
          >
            <Link
              href="/?showLogin=true"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Sign in
            </Link>
          </StatusCard>
        )}

        {state === 'error' && (
          <StatusCard
            icon={<AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />}
            title="Couldn’t load your history"
            message={errorMessage}
          >
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          </StatusCard>
        )}

        {state === 'ready' && entries.length === 0 && (
          <StatusCard
            icon={<SearchX className="h-8 w-8 text-slate-400" aria-hidden />}
            title="No submissions yet"
            message="Solve a problem and submit it for grading — it’ll show up here."
          >
            <Link
              href="/coding-test"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Browse problems
            </Link>
          </StatusCard>
        )}

        {state === 'ready' && entries.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">{total} submissions</p>
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.submission_id}>
                  <Link
                    href={`/coding-test/${e.problem_slug}`}
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
                    {(() => {
                      const s = normalizeScore(e.score);
                      return (
                        <span className={`shrink-0 text-sm font-semibold ${scoreTone(s)}`}>
                          {s === null ? '—' : `${s} / 100`}
                        </span>
                      );
                    })()}
                  </Link>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:border-indigo-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatusCard({
  icon,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
      {icon}
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      {children}
    </div>
  );
}
