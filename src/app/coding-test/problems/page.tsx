'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Circle, Code2, RotateCw, SearchX, X } from 'lucide-react';
import { fetchProblems } from '../_lib/api';
import { fetchProblemsAnnotated, GradingApiError } from '../_lib/gradingApi';
import type {
  CodingTestDifficulty,
  CodingTestLanguage,
  ProblemWithStatus,
} from '../_lib/types';
import { DIFFICULTIES, DIFFICULTY_BADGE, LANGUAGES } from '../_lib/ui';

type LoadState = 'loading' | 'error' | 'ready';
type SidebarTab = 'popular' | 'tags';

const PAGE_SIZE = 20;

const POPULAR_TOPICS = [
  'Basic Programming Concepts',
  'Arrays',
  'Strings',
  'Basic Math',
  'Sorting',
  'Binary Search',
  'Data Structures',
  'Greedy',
  'Dynamic Programming',
  'Graphs',
  'Segment Trees',
] as const;

/**
 * Maps a popular topic display name to the closest matching actual tag in the
 * database. Tries exact → singular/plural → word-level → fallback.
 */
function resolveTopicTag(topic: string, availableTags: string[]): string {
  if (availableTags.length === 0) return topic;
  const tLow = topic.toLowerCase();

  // 1. Exact (case-insensitive)
  const exact = availableTags.find((t) => t.toLowerCase() === tLow);
  if (exact) return exact;

  // 2. Singular/plural: strip trailing 's' from both sides
  const stem = tLow.replace(/s$/, '');
  const plural = availableTags.find((t) => {
    const d = t.toLowerCase().replace(/s$/, '');
    return d === stem;
  });
  if (plural) return plural;

  // 3. Tag starts with topic or contains topic as a whole word (≥4 chars)
  const words = tLow.split(/\s+/).filter((w) => w.length >= 4);
  const wordMatch = availableTags.find((t) => {
    const d = t.toLowerCase();
    return words.some((w) => d.startsWith(w) || d.includes(` ${w}`));
  });
  if (wordMatch) return wordMatch;

  return topic; // fallback — API may return empty results
}

function ProblemStatusIcon({ status }: Readonly<{ status: 'accepted' | 'attempted' | null }>) {
  if (status === 'accepted') {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Solved" />;
  }
  if (status === 'attempted') {
    return <Circle className="h-4 w-4 shrink-0 text-amber-400" aria-label="Attempted" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-slate-200" aria-hidden />;
}

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
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('popular');

  const [problems, setProblems] = useState<ProblemWithStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const filters = {
      language: language || undefined,
      difficulty: difficulty || undefined,
      tag: tag || undefined,
    };
    setState('loading');
    setErrorMessage('');
    setPage(1);

    function applyResults(list: ProblemWithStatus[], count: number) {
      setProblems(list);
      setTotal(count);
      setState('ready');
    }

    fetchProblemsAnnotated(filters, controller.signal)
      .then((res) => applyResults(res, res.length))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        fetchProblems(filters, controller.signal)
          .then((res) => applyResults(res.problems.map((p) => ({ ...p, user_status: null })), res.total))
          .catch((fallbackErr) => {
            if (fallbackErr instanceof DOMException && fallbackErr.name === 'AbortError') return;
            setErrorMessage(fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong.');
            setState('error');
          });
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

  // Maps each popular topic display name → resolved actual database tag.
  const popularTopicTagMap = useMemo(() => {
    const map = new Map<string, string>();
    const claimedTags = new Set<string>();
    for (const topic of POPULAR_TOPICS) {
      const resolved = resolveTopicTag(topic, baseTagOptions);
      if (!claimedTags.has(resolved)) {
        map.set(topic, resolved);
        claimedTags.add(resolved);
      } else {
        map.set(topic, topic);
      }
    }
    return map;
  }, [baseTagOptions]);

  // Display label for the active chip: prefer the popular topic name over raw tag.
  const activeDisplayLabel = useMemo(() => {
    if (!tag) return '';
    for (const [topic, resolved] of popularTopicTagMap) {
      if (resolved === tag) return topic;
    }
    return tag;
  }, [tag, popularTopicTagMap]);

  const hasActiveFilters = Boolean(language || difficulty || tag);

  const totalPages = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));
  const visibleProblems = problems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearAllFilters() {
    setLanguage('');
    setDifficulty('');
    setTag('');
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">

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
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Topics sidebar ───────────────────────────────────────────── */}
          <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-60">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="px-4 pt-4">
                <h2 className="mb-3 text-sm font-bold text-slate-900">Topics</h2>
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('popular')}
                    className={`mr-5 pb-2 text-xs font-semibold border-b-2 transition-colors ${
                      sidebarTab === 'popular'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Popular Topics
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('tags')}
                    className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                      sidebarTab === 'tags'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tags
                  </button>
                </div>
              </div>

              <div className="px-3 py-3">
                <div className="mb-1 flex justify-end" style={{ minHeight: '1.25rem' }}>
                  {tag && (
                    <button
                      type="button"
                      onClick={() => setTag('')}
                      className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <ul className="space-y-0.5">
                  {sidebarTab === 'popular'
                    ? POPULAR_TOPICS.map((topic) => {
                        const resolvedTag = popularTopicTagMap.get(topic) ?? topic;
                        const isChecked = tag === resolvedTag;
                        const available = baseTagOptions.length === 0
                          || baseTagOptions.some((t) => t.toLowerCase() === resolvedTag.toLowerCase());
                        return (
                          <li key={topic}>
                            <label className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors group ${available ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default opacity-35'}`}>
                              <input
                                type="radio"
                                name="topic"
                                value={topic}
                                checked={isChecked}
                                disabled={!available && baseTagOptions.length > 0}
                                onChange={() => setTag(resolvedTag)}
                                onClick={() => { if (isChecked) setTag(''); }}
                                className="h-4 w-4 shrink-0 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={`text-sm leading-snug ${isChecked ? 'font-medium text-indigo-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {topic}
                              </span>
                            </label>
                          </li>
                        );
                      })
                    : tagOptions.map((topicTag) => {
                        const isChecked = tag === topicTag;
                        return (
                          <li key={topicTag}>
                            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 group">
                              <input
                                type="radio"
                                name="topic"
                                value={topicTag}
                                checked={isChecked}
                                onChange={() => setTag(topicTag)}
                                onClick={() => { if (isChecked) setTag(''); }}
                                className="h-4 w-4 shrink-0 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={`text-sm leading-snug ${isChecked ? 'font-medium text-indigo-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {topicTag}
                              </span>
                            </label>
                          </li>
                        );
                      })
                  }
                  {sidebarTab === 'tags' && tagOptions.length === 0 && (
                    <li className="py-3 text-center text-xs text-slate-400">No tags available</li>
                  )}
                </ul>
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">

            {/* Top filters: language + difficulty */}
            <section className="mb-5 flex flex-wrap items-end gap-3" aria-label="Filters">
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
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="pb-0.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear all
                </button>
              )}
            </section>

            {/* Active topic chip */}
            {tag && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">Topic:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  {activeDisplayLabel}
                  <button
                    type="button"
                    onClick={() => setTag('')}
                    aria-label="Remove topic filter"
                    className="ml-0.5 rounded-full hover:text-indigo-900"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              </div>
            )}

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
                    onClick={clearAllFilters}
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
                  {visibleProblems.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={language ? `/coding-test/${p.slug}?language=${language}` : `/coding-test/${p.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProblemStatusIcon status={p.user_status} />
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
                  ))}
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
        </div>
      </div>
    </main>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
