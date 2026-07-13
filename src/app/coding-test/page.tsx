'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Code2, RotateCw, SearchX } from 'lucide-react';
import { fetchProblems } from './_lib/api';
import type {
  CodingProblemSummary,
  CodingTestDifficulty,
  CodingTestLanguage,
} from './_lib/types';
import { DIFFICULTIES, DIFFICULTY_BADGE, LANGUAGES } from './_lib/ui';

type LoadState = 'loading' | 'error' | 'ready';

export default function CodingProblemsListPage() {
  const [problems, setProblems] = useState<CodingProblemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [language, setLanguage] = useState<CodingTestLanguage | ''>('');
  const [difficulty, setDifficulty] = useState<CodingTestDifficulty | ''>('');
  const [tag, setTag] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);
  const [baseTagOptions, setBaseTagOptions] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setErrorMessage('');

    fetchProblems(
      {
        language: language || undefined,
        difficulty: difficulty || undefined,
        tag: tag || undefined,
      },
      controller.signal,
    )
      .then((res) => {
        setProblems(res.problems);
        setTotal(res.total);
        setState('ready');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMessage(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
        setState('error');
      });

    return () => controller.abort();
  }, [language, difficulty, tag, reloadKey]);

  // Tag options come from a query that OMITS the `tag` filter (but respects
  // language/difficulty), so selecting a tag never collapses the dropdown to
  // just that tag. Runs independently of the main, tag-filtered fetch.
  useEffect(() => {
    const controller = new AbortController();
    fetchProblems(
      {
        language: language || undefined,
        difficulty: difficulty || undefined,
      },
      controller.signal,
    )
      .then((res) => {
        const set = new Set(res.problems.map((p) => p.tag).filter(Boolean));
        setBaseTagOptions(Array.from(set).sort((a, b) => a.localeCompare(b)));
      })
      .catch((err) => {
        // Non-fatal: keep the previous tag options. The main fetch surfaces
        // user-visible errors; the tag dropdown should not break the page.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });

    return () => controller.abort();
  }, [language, difficulty, reloadKey]);

  // Always include the currently-selected tag so the dropdown can still show it
  // even if it is absent from the latest base set.
  const tagOptions = useMemo(() => {
    const set = new Set(baseTagOptions);
    if (tag) set.add(tag);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [baseTagOptions, tag]);

  const hasActiveFilters = Boolean(language || difficulty || tag);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <Code2 className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Coding Practice
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Coding Problems
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse problems and practice in Python, Java, or C++.
          </p>
        </header>

        {/* Filters */}
        <section
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3"
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
                onClick={() => {
                  setLanguage('');
                  setDifficulty('');
                  setTag('');
                }}
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
            <p className="text-sm font-medium text-slate-700">
              No problems match these filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setLanguage('');
                  setDifficulty('');
                  setTag('');
                }}
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
              Showing {problems.length} of {total} problem
              {total === 1 ? '' : 's'}
            </p>
            <ul className="space-y-2">
              {problems.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/coding-test/${p.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
                        {p.title}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {p.tag}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[p.difficulty]}`}
                      >
                        {p.difficulty}
                      </span>
                      <ChevronRight
                        className="h-5 w-5 text-slate-300 group-hover:text-indigo-500"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value || '__all__'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
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
