'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Circle, Code2, RotateCw, SearchX } from 'lucide-react';
import { fetchProblems } from '../_lib/api';
import { fetchProgress, GradingApiError } from '../_lib/gradingApi';
import type {
  CodingProblemSummary,
  CodingTestDifficulty,
  CodingTestLanguage,
} from '../_lib/types';
import { DIFFICULTIES, DIFFICULTY_BADGE, LANGUAGES } from '../_lib/ui';

type LoadState = 'loading' | 'error' | 'ready';
type ProblemStatus = 'solved' | 'attempted';

const PAGE_SIZE = 20;

export default function CodingProblemsListPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <CodingProblemsListContent />
    </Suspense>
  );
}

function CodingProblemsListContent() {
  const searchParams = useSearchParams();

  const paramLang = searchParams.get('language') as CodingTestLanguage | null;
  const validLangs: CodingTestLanguage[] = ['python', 'java', 'cpp', 'c'];
  const [language, setLanguage] = useState<CodingTestLanguage | ''>(
    paramLang && validLangs.includes(paramLang) ? paramLang : '',
  );
  const [difficulty, setDifficulty] = useState<CodingTestDifficulty | ''>('');
  const [tag, setTag] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [baseTagOptions, setBaseTagOptions] = useState<string[]>([]);

  const [problems, setProblems] = useState<CodingProblemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [page, setPage] = useState(1);
  const [statusMap, setStatusMap] = useState<Record<string, ProblemStatus>>({});

  // Silently fetch progress to mark solved/attempted problems.
  useEffect(() => {
    fetchProgress()
      .then((res) => {
        const map: Record<string, ProblemStatus> = {};
        for (const e of res.entries) {
          map[e.problem_slug] = e.status === 'accepted' ? 'solved' : 'attempted';
        }
        setStatusMap(map);
      })
      .catch((err: unknown) => {
        // 401 = not signed in; silently ignore so unauthenticated users still
        // see the list. Any other error is also non-critical here.
        if (err instanceof GradingApiError) return;
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setErrorMessage('');
    setPage(1);
    fetchProblems(
      { language: language || undefined, difficulty: difficulty || undefined, tag: tag || undefined },
      controller.signal,
    )
      .then((res) => { setProblems(res.problems); setTotal(res.total); setState('ready'); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setState('error');
      });
    return () => controller.abort();
  }, [language, difficulty, tag, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProblems({ language: language || undefined, difficulty: difficulty || undefined }, controller.signal)
      .then((res) => {
        const set = new Set(res.problems.map((p) => p.tag).filter(Boolean));
        setBaseTagOptions(Array.from(set).sort((a, b) => a.localeCompare(b)));
      })
      .catch((err) => { if (err instanceof DOMException && err.name === 'AbortError') return; });
    return () => controller.abort();
  }, [language, difficulty, reloadKey]);

  const tagOptions = useMemo(() => {
    const set = new Set(baseTagOptions);
    if (tag) set.add(tag);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [baseTagOptions, tag]);

  const hasActiveFilters = Boolean(language || difficulty || tag);

  const totalPages = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));
  const visibleProblems = problems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">

        {/* Back nav */}
        <Link
          href="/coding-test"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to Practice
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <Code2 className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">Coding Practice</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">All Problems</h1>
          <p className="mt-1 text-sm text-slate-500">
            Filter by language, difficulty, or topic tag.
          </p>
        </header>

        {/* Filters */}
        <section
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"
          aria-label="Filters"
        >
          <FilterSelect
            label="Language"
            value={language}
            onChange={(v) => setLanguage(v as CodingTestLanguage | '')}
            options={[
              { value: '', label: 'All languages' },
              ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
            ]}
          />
          <FilterSelect
            label="Difficulty"
            value={difficulty}
            onChange={(v) => setDifficulty(v as CodingTestDifficulty | '')}
            options={[
              { value: '', label: 'All difficulties' },
              ...DIFFICULTIES.map((d) => ({
                value: d,
                label: d.charAt(0).toUpperCase() + d.slice(1),
              })),
            ]}
          />
          <FilterSelect
            label="Tag"
            value={tag}
            onChange={setTag}
            options={[
              { value: '', label: 'All tags' },
              ...tagOptions.map((t) => ({ value: t, label: t })),
            ]}
          />
          {hasActiveFilters && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={() => { setLanguage(''); setDifficulty(''); setTag(''); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Results */}
        {state === 'loading' && <ListSkeleton />}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />
            <p className="text-sm font-medium text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          </div>
        )}

        {state === 'ready' && problems.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <SearchX className="h-8 w-8 text-slate-400" aria-hidden />
            <p className="text-sm font-medium text-slate-700">No problems match these filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setLanguage(''); setDifficulty(''); setTag(''); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {state === 'ready' && problems.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500" aria-live="polite">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, problems.length)} of {total} problem{total === 1 ? '' : 's'}
            </p>
            <ul className="space-y-2">
              {visibleProblems.map((p) => {
                const status = statusMap[p.slug];
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/coding-test/${p.slug}${language ? `?language=${language}` : ''}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {status === 'solved' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Solved" />
                        ) : status === 'attempted' ? (
                          <Circle className="h-4 w-4 shrink-0 text-amber-400" aria-label="Attempted" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate-200" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
                            {p.title}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{p.tag}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[p.difficulty]}`}>
                          {p.difficulty}
                        </span>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:border-indigo-300"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:border-indigo-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value || '__all__'} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div className="w-full">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/5 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
        </li>
      ))}
    </ul>
  );
}
