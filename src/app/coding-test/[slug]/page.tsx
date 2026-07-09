'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Database,
  FileText,
  History,
  Loader2,
  Pause,
  Play,
  RotateCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { CodingTestApiError, fetchProblem } from '../_lib/api';
import { fetchQuota, GradingApiError, submitSolution } from '../_lib/gradingApi';
import { RunApiError, runCode } from '../_lib/runApi';
import GradingResultPanel from '../_components/GradingResultPanel';
import OutputPanel from '../_components/OutputPanel';
import QuotaBanner from '@/components/coding-test/QuotaBanner';
import type { CodeEditorProps } from '../_components/CodeEditor';
import type {
  CodingProblemDetail,
  CodingTestLanguage,
  QuotaResponse,
  RunResult,
  SubmitSolutionResponse,
} from '../_lib/types';
import { DIFFICULTY_BADGE, LANGUAGES } from '../_lib/ui';

type SubmitState = 'idle' | 'submitting' | 'done';
type RunState = 'idle' | 'running' | 'done';

const TIMER_DEFAULT = 45 * 60; // 45 minutes in seconds

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Monaco must not run on the server.
const CodeEditor = dynamic<CodeEditorProps>(() => import('../_components/CodeEditor'), {
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
  const searchParams = useSearchParams();
  const langParam = searchParams.get('language');
  const backHref = langParam
    ? `/coding-test/problems?language=${langParam}`
    : '/coding-test/problems';

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
    c: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setErrorMessage('');

    fetchProblem(slug, controller.signal)
      .then((res) => {
        setProblem(res);
        setCode({
          python: localStorage.getItem(`code:${slug}:python`) ?? res.starter_code.python ?? '',
          java: localStorage.getItem(`code:${slug}:java`) ?? res.starter_code.java ?? '',
          cpp: localStorage.getItem(`code:${slug}:cpp`) ?? res.starter_code.cpp ?? '',
          c: localStorage.getItem(`code:${slug}:c`) ?? res.starter_code.c ?? '',
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

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [result, setResult] = useState<SubmitSolutionResponse | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [noCredits, setNoCredits] = useState(false);
  const [serviceDown, setServiceDown] = useState(false);

  const [quota, setQuota] = useState<QuotaResponse | null>(null);

  useEffect(() => {
    fetchQuota()
      .then(setQuota)
      .catch(() => {}); // silent — user may not be signed in
  }, []);

  const [runState, setRunState] = useState<RunState>('idle');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState('');

  const [timerSeconds, setTimerSeconds] = useState(TIMER_DEFAULT);
  const [timerRunning, setTimerRunning] = useState(false);

  const [plainEditor, setPlainEditor] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('coding_test_plain_editor')) setPlainEditor(true);
  }, []);

  useEffect(() => {
    if (!timerRunning || timerSeconds === 0) {
      if (timerSeconds === 0) setTimerRunning(false);
      return;
    }
    const id = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerSeconds]);

  const togglePlainEditor = () => {
    setPlainEditor((prev) => {
      const next = !prev;
      if (next) localStorage.setItem('coding_test_plain_editor', '1');
      else localStorage.removeItem('coding_test_plain_editor');
      return next;
    });
  };

  const clearRunOutput = () => {
    setRunResult(null);
    setRunError('');
    setRunState('idle');
  };

  const resetToStarter = () => {
    if (!problem) return;
    localStorage.removeItem(`code:${slug}:${language}`);
    setCode((prev) => ({
      ...prev,
      [language]: problem.starter_code[language] ?? '',
    }));
    clearRunOutput();
  };

  const handleRun = async () => {
    if (runState === 'running') return;
    const source = code[language]?.trim();
    if (!source) {
      setRunError('Write some code before running.');
      setRunResult(null);
      return;
    }
    setRunState('running');
    setRunError('');
    setRunResult(null);
    try {
      const res = await runCode(
        language,
        code[language],
        problem?.examples?.map((e) => ({ input: e.input, output: e.output })),
      );
      setRunResult(res);
      setRunState('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setRunState('idle');
      setRunError(
        err instanceof RunApiError || err instanceof Error
          ? err.message
          : 'Failed to run your code.',
      );
    }
  };

  const handleSubmit = async () => {
    if (!problem || submitState === 'submitting') return;
    const source = code[language]?.trim();
    if (!source) {
      setSubmitError('Write some code before submitting.');
      setResult(null);
      setSubmitState('idle');
      return;
    }
    setSubmitState('submitting');
    setSubmitError('');
    setNeedsAuth(false);
    setNoCredits(false);
    setServiceDown(false);
    setResult(null);
    try {
      const res = await submitSolution({
        problem_slug: problem.slug,
        language,
        code: code[language],
      });
      setResult(res);
      setSubmitState('done');
      setQuota((q) =>
        q
          ? {
              ...q,
              submissions_remaining: Math.max(0, q.submissions_remaining - 1),
              credits_remaining: Math.max(0, q.credits_remaining - q.cost_per_submission),
            }
          : q,
      );
    } catch (err) {
      setSubmitState('idle');
      if (err instanceof GradingApiError && err.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (err instanceof GradingApiError && err.status === 402) {
        setNoCredits(true);
        return;
      }
      if (err instanceof GradingApiError && (err.status === 502 || err.status === 503)) {
        setServiceDown(true);
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit your solution.',
      );
    }
  };

  const timerColor =
    timerSeconds < 120 ? 'text-red-600 animate-pulse' :
    timerSeconds < 300 ? 'text-amber-500' :
    'text-slate-600';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link
          href={backHref}
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
                      onClick={() => { setLanguage(l.value); clearRunOutput(); }}
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
                <div className="flex items-center gap-3">
                  {/* Countdown timer */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    <span className={`font-mono text-sm font-semibold tabular-nums ${timerColor}`}>
                      {formatTimer(timerSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      title={timerRunning ? 'Pause timer' : 'Start timer'}
                      className="text-slate-400 transition hover:text-indigo-600"
                    >
                      {timerRunning
                        ? <Pause className="h-3.5 w-3.5" aria-hidden />
                        : <Play className="h-3.5 w-3.5" aria-hidden />}
                    </button>
                    {!timerRunning && timerSeconds < TIMER_DEFAULT && (
                      <button
                        type="button"
                        onClick={() => setTimerSeconds(TIMER_DEFAULT)}
                        title="Reset timer to 45:00"
                        className="text-slate-400 transition hover:text-slate-600"
                      >
                        <RotateCw className="h-3 w-3" aria-hidden />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={resetToStarter}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={togglePlainEditor}
                    title={plainEditor ? 'Switch to Monaco code editor' : 'Switch to plain text editor (screen-reader friendly)'}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    {plainEditor ? 'Code editor' : 'Plain text'}
                  </button>
                </div>
              </div>

              <div className="h-[460px] min-h-[320px]">
                {plainEditor ? (
                  <textarea
                    aria-label={`Plain text code editor for ${language}`}
                    value={code[language]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCode((prev) => ({ ...prev, [language]: v }));
                      localStorage.setItem(`code:${slug}:${language}`, v);
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    spellCheck={false}
                    className="h-full w-full resize-none rounded-lg border border-slate-700 bg-[#1e1e1e] p-3 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <CodeEditor
                    language={language}
                    value={code[language]}
                    onChange={(v) => {
                      setCode((prev) => ({ ...prev, [language]: v }));
                      localStorage.setItem(`code:${slug}:${language}`, v);
                    }}
                    onCtrlEnter={handleSubmit}
                  />
                )}
              </div>

              <QuotaBanner quota={quota} variant="strip" className="mt-3" />

              <div className="mt-3 flex items-center justify-between gap-3">
                <Link
                  href="/coding-test/history"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"
                >
                  <History className="h-3.5 w-3.5" aria-hidden />
                  My submissions
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={runState === 'running' || submitState === 'submitting'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {runState === 'running' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Running…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" aria-hidden />
                        Run
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitState === 'submitting' || runState === 'running' || quota?.submissions_remaining === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {submitState === 'submitting' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Grading…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" aria-hidden />
                        Submit for grading
                      </>
                    )}
                  </button>
                </div>
              </div>

              {runError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                  <p className="text-sm text-rose-700">{runError}</p>
                </div>
              )}

              {runState === 'done' && runResult && (
                <OutputPanel result={runResult} />
              )}

              {needsAuth && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                  <p className="text-sm text-indigo-700">
                    Please{' '}
                    <Link href="/?showLogin=true" className="font-semibold underline">
                      sign in
                    </Link>{' '}
                    to submit your solution and save it to your history.
                  </p>
                </div>
              )}

              {noCredits && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  <p className="text-sm text-amber-700">
                    You have no grading submissions remaining. Please upgrade your plan to continue.
                  </p>
                </div>
              )}

              {serviceDown && (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                    <p className="text-sm text-rose-700">
                      The AI grading service is temporarily unavailable. Your code is safe — please try again in a moment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Retry
                  </button>
                </div>
              )}

              {submitError && !needsAuth && !noCredits && !serviceDown && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                  <p className="text-sm text-rose-700">{submitError}</p>
                </div>
              )}

              {submitState === 'done' && result && (
                <GradingResultPanel result={result} />
              )}
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
