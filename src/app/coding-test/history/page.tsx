'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  History as HistoryIcon,
  RotateCw,
  SearchX,
  Sparkles,
} from 'lucide-react';

import { fetchProgress, fetchSubmissions, GradingApiError } from '../_lib/gradingApi';
import { fetchProblems } from '../_lib/api';
import type { HistoryEntry, UserProgressEntry } from '../_lib/types';

type LoadState = 'loading' | 'error' | 'auth' | 'ready';

function scoreColor(score: number | null): string {
  if (score == null) return 'text-slate-400';
  if (score >= 70)   return 'text-emerald-600';
  if (score >= 50)   return 'text-amber-600';
  return 'text-rose-600';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function CodingTestHistoryPage() {
  const [entries, setEntries] = useState<UserProgressEntry[]>([]);
  const [submissions, setSubmissions] = useState<HistoryEntry[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProblems().then((res) => {
      const map: Record<string, string> = {};
      for (const p of res.problems) map[p.slug] = p.title;
      setTitleMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setState('loading');
    setErrorMessage('');

    Promise.all([
      fetchProgress(),
      fetchSubmissions(1, 50).catch(() => ({ entries: [] as HistoryEntry[] })),
    ])
      .then(([progressRes, historyRes]) => {
        if (!active) return;
        const sorted = [...progressRes.entries].sort(
          (a, b) => new Date(b.last_run_at).getTime() - new Date(a.last_run_at).getTime(),
        );
        setEntries(sorted);
        setSubmissions(historyRes.entries);
        setState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof GradingApiError && err.status === 401) {
          setState('auth');
          return;
        }
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setState('error');
      });

    return () => { active = false; };
  }, [reloadKey]);

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
          <h1 className="text-2xl font-bold">My Progress</h1>
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
            title="Sign in to see your progress"
            message="Your problem history is saved to your account."
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
            title="Couldn't load your progress"
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
            title="No problems attempted yet"
            message="Run your code against a problem — it'll show up here."
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
            <p className="mb-3 text-sm text-slate-500">{entries.length} problem{entries.length === 1 ? '' : 's'} attempted</p>
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.problem_slug}>
                  <Link
                    href={`/coding-test/${e.problem_slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {e.status === 'accepted' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Accepted" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-amber-400" aria-label="Attempted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {titleMap[e.problem_slug] ?? e.problem_slug}
                        </p>
                        <p className="text-xs text-slate-400">
                          {e.attempts} attempt{e.attempts === 1 ? '' : 's'} · last run {formatDate(e.last_run_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        e.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {e.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {state === 'ready' && submissions.length > 0 && (
          <section className="mt-10">
            <header className="mb-4 flex items-center gap-2 text-slate-900">
              <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden />
              <h2 className="text-lg font-semibold">Graded Submissions</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {submissions.length}
              </span>
            </header>
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.submission_id}>
                  <Link
                    href={`/coding-test/${s.problem_slug}?submission=${s.submission_id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {s.problem_title ?? s.problem_slug}
                      </p>
                      <p className="text-xs text-slate-400">
                        <span className="capitalize">{s.language}</span>
                        {' · '}{formatDate(s.submitted_at)}
                      </p>
                      {s.error && (
                        <p className="mt-0.5 text-xs text-rose-500">{s.error}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-baseline gap-0.5">
                      <span className={`text-xl font-bold tabular-nums ${scoreColor(s.score)}`}>
                        {s.score ?? '—'}
                      </span>
                      {s.score != null && (
                        <span className="text-xs text-slate-400">/ 100</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
      {icon}
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      {children}
    </div>
  );
}
