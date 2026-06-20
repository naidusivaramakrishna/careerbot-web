'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Database,
  Play,
  RotateCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { CodingTestApiError, fetchProblem } from '../_lib/api';
import type {
  CodingProblemDetail,
  CodingTestLanguage,
} from '../_lib/types';
import { DIFFICULTY_BADGE, LANGUAGES } from '../_lib/ui';

// Monaco must not run on the server.
const CodeEditor = dynamic(() => import('../_components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-slate-700 bg-[#1e1e1e] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

type LoadState = 'loading' | 'error' | 'notfound' | 'ready';

export default function CodingProblemDetailPage() {
  // React 18 compat: `React.use()` crashes on React 18. `useParams()` from
  // next/navigation works on React 18 + 19 and decodes the dynamic segment.
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [problem, setProblem] = useState<CodingProblemDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [language, setLanguage] = useState<CodingTestLanguage>('python');
  // Per-language editor contents. Seeded from starter on first load; the user's
  // edits in each language are preserved when switching back and forth.
  const [code, setCode] = useState<Record<CodingTestLanguage, string>>({
    python: '',
    java: '',
    cpp: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setErrorMessage('');

    fetchProblem(slug, controller.signal)
      .then((res) => {
        setProblem(res);
        setCode({
          python: res.starter_code.python ?? '',
          java: res.starter_code.java ?? '',
          cpp: res.starter_code.cpp ?? '',
        });
        setState('ready');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof CodingTestApiError && err.status === 404) {
          setState('notfound');
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
        setState('error');
      });

    return () => controller.abort();
  }, [slug, reloadKey]);

  const resetToStarter = () => {
    if (!problem) return;
    setCode((prev) => ({
      ...prev,
      [language]: problem.starter_code[language] ?? '',
    }));
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link
          href="/coding-test"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to problems
        </Link>

        {state === 'loading' && <DetailSkeleton />}

        {state === 'notfound' && (
          <StatusCard
            title="Problem not found"
            message={`No problem exists for "${slug}".`}
            tone="neutral"
          >
            <Link
              href="/coding-test"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Browse all problems
            </Link>
          </StatusCard>
        )}

        {state === 'error' && (
          <StatusCard title="Couldn’t load this problem" message={errorMessage} tone="error">
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

        {state === 'ready' && problem && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: statement */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-slate-900">
                  {problem.title}
                </h1>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[problem.difficulty]}`}
                >
                  {problem.difficulty}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {problem.tag}
              </p>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {problem.statement}
              </div>

              {problem.examples.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">
                    Examples
                  </h2>
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
                          <span className="font-semibold">Output:</span>{' '}
                          {ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold">Explanation:</span>{' '}
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {problem.constraints.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">
                    Constraints
                  </h2>
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
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Expected time
                    </p>
                    <p className="font-mono text-sm text-slate-700">
                      {problem.expected_time_complexity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <Database className="h-4 w-4 text-slate-400" aria-hidden />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Expected space
                    </p>
                    <p className="font-mono text-sm text-slate-700">
                      {problem.expected_space_complexity}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right: editor */}
            <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLanguage(l.value)}
                      aria-pressed={language === l.value}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        language === l.value
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetToStarter}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  Reset
                </button>
              </div>

              <div className="h-[460px] min-h-[320px]">
                <CodeEditor
                  language={language}
                  value={code[language]}
                  onChange={(v) =>
                    setCode((prev) => ({ ...prev, [language]: v }))
                  }
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Run &amp; submit coming soon.
                </p>
                <button
                  type="button"
                  disabled
                  title="Grading is not wired up yet"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                >
                  <Play className="h-4 w-4" aria-hidden />
                  Run / Submit
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusCard({
  title,
  message,
  tone,
  children,
}: {
  title: string;
  message: string;
  tone: 'error' | 'neutral';
  children?: React.ReactNode;
}) {
  const isError = tone === 'error';
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border p-10 text-center ${
        isError ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
      }`}
    >
      <AlertCircle
        className={`h-8 w-8 ${isError ? 'text-rose-500' : 'text-slate-400'}`}
        aria-hidden
      />
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3 w-1/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-full animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      </div>
      <div className="h-[520px] animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
    </div>
  );
}
