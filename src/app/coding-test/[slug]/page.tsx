'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle, ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Clock, Database, FileText, Keyboard, Loader2, Maximize2,
  Pause, Play, RotateCw, ShieldAlert, X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { CodingTestApiError, fetchProblem, fetchProblems } from '../_lib/api';
import { RunApiError, runCode, submitCode } from '../_lib/runApi';
import { GradingApiError, fetchQuota, mockGrade } from '../_lib/gradingApi';
import JudgePanel from '../_components/JudgePanel';
import GradingResultPanel from '@/components/coding-test/GradingResult';
import SubmitButton from '@/components/coding-test/SubmitButton';
import type { CodeEditorProps } from '../_components/CodeEditor';
import type {
  CodingProblemDetail, CodingProblemSummary, CodingTestLanguage, JudgeResponse,
  QuotaResponse, SubmitSolutionResponse,
} from '../_lib/types';
import { DIFFICULTY_BADGE, LANGUAGES } from '../_lib/ui';

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
type ActionState = 'idle' | 'running' | 'submitting' | 'done';
type LoadState = 'loading' | 'error' | 'notfound' | 'ready';

const TIMER_DEFAULT    = 45 * 60;
const SPLIT_DEFAULT    = 40;
const SPLIT_MIN        = 18;
const SPLIT_MAX        = 70;
const CONSOLE_DEFAULT  = 180;
const CONSOLE_MIN      = 72;
const CONSOLE_MAX      = 460;

function formatTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const CodeEditor = dynamic<CodeEditorProps>(
  () => import('../_components/CodeEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
        Loading editor…
      </div>
    ),
  },
);


/* ─────────────────────────────────────────────────────────────
   Shortcuts modal (extracted to keep render clean)
───────────────────────────────────────────────────────────── */
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: ['Ctrl', 'Enter'],          action: 'Run Code' },
    { keys: ['Esc'],                    action: 'Exit Full Screen' },
    { keys: ['Ctrl', 'S'],              action: 'Save Code (auto-save)' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Keyboard Shortcuts</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{action}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{k}</kbd>
                    {i < keys.length - 1 && <span className="text-xs text-slate-400">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">More shortcuts available in the Monaco editor via F1.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function CodingProblemDetailPage() {
  const router       = useRouter();
  const params       = useParams<{ slug: string }>();
  const slug         = typeof params?.slug === 'string' ? params.slug : '';
  const searchParams = useSearchParams();
  const backHref     = searchParams.get('language')
    ? `/coding-test/problems?language=${searchParams.get('language')}`
    : '/coding-test/problems';
  const isPracticeMode = searchParams.get('mode') === 'practice';

  const { userId } = useCurrentUserId();

  /* ── problem data ── */
  const [problem,      setProblem]      = useState<CodingProblemDetail | null>(null);
  const [loadState,    setLoadState]    = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey,    setReloadKey]    = useState(0);

  const _paramLang = searchParams.get('language') as CodingTestLanguage | null;
  const _validLangs: CodingTestLanguage[] = ['python', 'java', 'cpp', 'c'];
  const [language, setLanguage] = useState<CodingTestLanguage>(
    _paramLang && _validLangs.includes(_paramLang) ? _paramLang : 'python'
  );
  const [code, setCode]         = useState<Record<CodingTestLanguage, string>>({
    python: '', java: '', cpp: '', c: '',
  });

  useEffect(() => {
    const ctrl = new AbortController();
    setLoadState('loading');
    setErrorMessage('');
    fetchProblem(slug, ctrl.signal)
      .then((res) => {
        setProblem(res);
        // Initialize with starter code; user-specific localStorage is applied
        // in the effect below once userId is available.
        setCode({
          python: res.starter_code.python ?? '',
          java:   res.starter_code.java   ?? '',
          cpp:    res.starter_code.cpp    ?? '',
          c:      res.starter_code.c      ?? '',
        });
        setLoadState('ready');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof CodingTestApiError && err.status === 404) {
          setLoadState('notfound'); return;
        }
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setLoadState('error');
      });
    return () => ctrl.abort();
  }, [slug, reloadKey]);

  // Once both userId and problem are known, apply this user's saved drafts from
  // localStorage. Runs when userId resolves (async on first load) and whenever
  // the problem changes (slug navigation or reload). Keeping this separate from
  // the fetch effect avoids re-triggering the API call when userId resolves.
  useEffect(() => {
    if (!userId || !problem) return;
    setCode((prev) => ({
      python: localStorage.getItem(`code:${userId}:${problem.slug}:python`) ?? prev.python,
      java:   localStorage.getItem(`code:${userId}:${problem.slug}:java`)   ?? prev.java,
      cpp:    localStorage.getItem(`code:${userId}:${problem.slug}:cpp`)    ?? prev.cpp,
      c:      localStorage.getItem(`code:${userId}:${problem.slug}:c`)      ?? prev.c,
    }));
  }, [userId, problem]);

  /* ── problem list (for prev/next navigation) ── */
  const [problemList, setProblemList] = useState<CodingProblemSummary[]>([]);
  useEffect(() => {
    fetchProblems().then((r) => setProblemList(r.problems)).catch(() => {});
  }, []);

  const currentIndex = problemList.findIndex((p) => p.slug === slug);
  const prevProblem  = currentIndex > 0 ? problemList[currentIndex - 1] : null;
  const nextProblem  = currentIndex < problemList.length - 1 ? problemList[currentIndex + 1] : null;

  const navigateTo = (target: CodingProblemSummary) => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    router.push(`/coding-test/${target.slug}`);
  };

  /* ── run / submit ── */
  const [actionState,   setActionState]   = useState<ActionState>('idle');
  const [judgeResult,   setJudgeResult]   = useState<JudgeResponse | null>(null);
  const [judgeMode,     setJudgeMode]     = useState<'run' | 'submit'>('run');
  const [actionError,   setActionError]   = useState('');
  const [gradingResult, setGradingResult] = useState<SubmitSolutionResponse | null>(null);
  const [gradingError,  setGradingError]  = useState('');
  const [isGrading,     setIsGrading]     = useState(false);
  const [quota,         setQuota]         = useState<QuotaResponse | null>(null);

  /* ── timer ── */
  const [timerSeconds, setTimerSeconds] = useState(TIMER_DEFAULT);
  const [timerRunning, setTimerRunning] = useState(false);
  useEffect(() => {
    if (!timerRunning || timerSeconds === 0) {
      if (timerSeconds === 0) setTimerRunning(false);
      return;
    }
    const id = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerSeconds]);

  /* ── quota (loaded once on mount; refreshed after each AI grade) ── */
  useEffect(() => {
    fetchQuota().then(setQuota).catch(() => {});
  }, []);

  /* ── plain editor ── */
  const [plainEditor, setPlainEditor] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('coding_test_plain_editor')) setPlainEditor(true);
  }, []);

  /* ── auto-save indicator ── */
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saved');
    saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  /* ── tab-switch detection ── */
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const tabSwitchRef = useRef(0);
  useEffect(() => {
    const onVis  = () => {
      if (document.visibilityState === 'hidden') {
        tabSwitchRef.current += 1;
        setTabSwitchCount(tabSwitchRef.current);
        setShowTabWarning(true);
      }
    };
    const onBlur = () => {
      tabSwitchRef.current += 1;
      setTabSwitchCount(tabSwitchRef.current);
      setShowTabWarning(true);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  /* ── maximize: tracks real browser fullscreen state ── */
  const [isMaximized, setIsMaximized] = useState(true);
  useEffect(() => {
    const onFSChange = () => setIsMaximized(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  /* ── keyboard shortcuts dialog ── */
  const [showShortcuts, setShowShortcuts] = useState(false);

  /* ── split pane ── */
  const [leftPct,          setLeftPct]          = useState(SPLIT_DEFAULT);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isDesktop,        setIsDesktop]        = useState(false);
  const [isDragging,       setIsDragging]       = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql    = window.matchMedia('(min-width: 1024px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);
    update(mql);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanelCollapsed) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const startX   = e.clientX;
    const startPct = leftPct;
    setIsDragging(true);
    const onMove = (mv: PointerEvent) => {
      const w      = container.offsetWidth;
      const newPct = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, startPct + ((mv.clientX - startX) / w) * 100));
      setLeftPct(newPct);
    };
    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [leftPct, isPanelCollapsed]);

  /* ── console panel ── */
  const [consoleHeight,    setConsoleHeight]    = useState(CONSOLE_DEFAULT);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [consoleTab,       setConsoleTab]       = useState<'output' | 'tests' | 'grade'>('output');

  const startConsoleResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const startY = e.clientY;
    const startH = consoleHeight;
    const onMove = (mv: PointerEvent) => {
      const delta = startY - mv.clientY;
      setConsoleHeight(Math.max(CONSOLE_MIN, Math.min(CONSOLE_MAX, startH + delta)));
    };
    const onUp = () => {
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.body.style.cursor     = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [consoleHeight]);

  /* ── helpers ── */
  const clearRunOutput = useCallback(() => {
    setJudgeResult(null); setActionError(''); setActionState('idle');
    setGradingResult(null); setGradingError(''); setIsGrading(false);
  }, []);

  const resetToStarter = () => {
    if (!problem) return;
    if (userId) localStorage.removeItem(`code:${userId}:${slug}:${language}`);
    setCode((prev) => ({ ...prev, [language]: problem.starter_code[language] ?? '' }));
    clearRunOutput();
  };

  const togglePlainEditor = () => {
    setPlainEditor((prev) => {
      const next = !prev;
      if (next) localStorage.setItem('coding_test_plain_editor', '1');
      else      localStorage.removeItem('coding_test_plain_editor');
      return next;
    });
  };

  const isBusy = actionState === 'running' || actionState === 'submitting';

  const handleRun = useCallback(async () => {
    if (isBusy) return;
    const src = code[language]?.trim();
    if (!src) { setActionError('Write some code before running.'); return; }
    setActionState('running'); setActionError(''); setJudgeResult(null);
    setJudgeMode('run');
    setConsoleCollapsed(false);
    setConsoleTab('tests');
    try {
      const res = await runCode(slug, language, code[language]);
      setJudgeResult(res);
      setActionState('done');
    } catch (err) {
      setActionState('idle');
      setActionError(err instanceof RunApiError || err instanceof Error ? err.message : 'Failed to run your code.');
    }
  }, [isBusy, code, language, slug]);

  const handleSubmit = useCallback(async () => {
    if (isBusy) return;
    const src = code[language]?.trim();
    if (!src) { setActionError('Write some code before submitting.'); return; }
    setActionState('submitting'); setActionError('');
    setJudgeResult(null); setGradingResult(null); setGradingError('');
    setJudgeMode('submit');
    setConsoleCollapsed(false);
    setConsoleTab('tests');

    // In practice mode skip AI grading entirely — run judge only.
    const judgePromise = submitCode(slug, language, code[language]);
    const gradePromise = isPracticeMode ? null : mockGrade(slug, language, code[language], problem?.title);

    try {
      const judgeRes = await judgePromise;
      setJudgeResult(judgeRes);
      setActionState('done');
      if (judgeRes.verdict === 'accepted') {
        localStorage.setItem('progress_updated', Date.now().toString());
        router.refresh();
      }
    } catch (err) {
      setActionState('idle');
      setActionError(err instanceof RunApiError || err instanceof Error ? err.message : 'Failed to submit your solution.');
      return;
    }

    if (!gradePromise) return;

    // Await the grade (already running in parallel); only switch tab on success.
    setIsGrading(true);
    try {
      const gradeRes = await gradePromise;
      setGradingResult(gradeRes);
      setConsoleTab('grade');
      // A credit was consumed — refresh the displayed balance.
      fetchQuota().then(setQuota).catch(() => {});
    } catch (gradeErr) {
      if (gradeErr instanceof GradingApiError && gradeErr.status === 402) {
        setGradingError('No grading credits remaining. Upgrade your plan to see AI feedback.');
      } else if (gradeErr instanceof GradingApiError && (gradeErr.status === 502 || gradeErr.status === 503)) {
        setGradingError('AI grading is temporarily unavailable. Try again later.');
      } else {
        setGradingError(gradeErr instanceof Error ? gradeErr.message : 'AI grading unavailable.');
      }
    } finally {
      setIsGrading(false);
    }
  }, [isBusy, code, language, slug, router, problem, isPracticeMode]);

  /* ── derived ── */
  const isReady = loadState === 'ready' && !!problem;

  /* Timer pill colours */
  const timerBadge = timerSeconds < 120
    ? 'bg-red-50 border-red-200 text-red-600'
    : timerSeconds < 300
    ? 'bg-amber-50 border-amber-200 text-amber-600'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';


  /* Panel widths */
  const leftStyle = isDesktop
    ? {
        width:      isPanelCollapsed ? 0 : `${leftPct}%`,
        overflow:   isPanelCollapsed ? 'hidden' : undefined,
        transition: 'width 200ms ease',
        minWidth:   0,
      } as React.CSSProperties
    : undefined;

  const rightStyle = isDesktop
    ? {
        width:      isPanelCollapsed ? '100%' : `${100 - leftPct}%`,
        transition: 'width 200ms ease',
        flex:       'none',
      } as React.CSSProperties
    : undefined;

  /* ── shared editor node ── */
  const saveCode = useCallback((lang: CodingTestLanguage, val: string, currentSlug: string) => {
    if (userId) localStorage.setItem(`code:${userId}:${currentSlug}:${lang}`, val);
    triggerSave();
  }, [userId, triggerSave]);

  const editorNode = plainEditor ? (
    <textarea
      aria-label={`Plain text code editor for ${language}`}
      value={code[language]}
      onChange={(e) => {
        const v = e.target.value;
        setCode((p) => ({ ...p, [language]: v }));
        saveCode(language, v, slug);
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
      }}
      spellCheck={false}
      className="h-full w-full resize-none bg-[#1e1e1e] p-3 font-mono text-base text-slate-200 focus:outline-none"
    />
  ) : (
    <CodeEditor
      language={language}
      value={code[language]}
      onChange={(v) => {
        setCode((p) => ({ ...p, [language]: v }));
        saveCode(language, v, slug);
      }}
      onCtrlEnter={handleRun}
      onLanguageChange={(lang) => { setLanguage(lang); clearRunOutput(); }}
      languages={LANGUAGES}
    />
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <main className={`flex flex-col bg-slate-50 ${isMaximized ? 'h-screen overflow-hidden' : 'lg:h-screen lg:overflow-hidden'}`}>

      {/* ── Modals ── */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showTabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-amber-300 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" aria-hidden />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900">Tab Switch Detected</h2>
                <p className="mt-1 text-sm text-slate-600">
                  You left this session{' '}
                  <span className="font-bold text-amber-600">{tabSwitchCount} time{tabSwitchCount !== 1 ? 's' : ''}</span>.
                  Stay on this tab.
                </p>
              </div>
              <button type="button" onClick={() => setShowTabWarning(false)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                <X className="h-5 w-5" />
              </button>
            </div>
            <button type="button" onClick={() => setShowTabWarning(false)}
              className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
              Resume Practice
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TOP NAV BAR
      ════════════════════════════════════════ */}
      <nav className={`${isMaximized ? 'hidden' : 'flex'} shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2`}>
        {/* Left: back + prev/next + title */}
        <div className="flex min-w-0 items-center gap-2">
          <Link href={backHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Prev/Next navigation */}
          {problemList.length > 0 && (
            <>
              <div className="h-4 w-px shrink-0 bg-slate-200" aria-hidden />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => prevProblem && navigateTo(prevProblem)}
                  disabled={!prevProblem}
                  title={prevProblem ? `Previous: ${prevProblem.title}` : 'No previous problem'}
                  className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <span className="whitespace-nowrap text-xs text-slate-400 tabular-nums">
                  {currentIndex >= 0 ? `${currentIndex + 1} / ${problemList.length}` : '— / —'}
                </span>
                <button
                  type="button"
                  onClick={() => nextProblem && navigateTo(nextProblem)}
                  disabled={!nextProblem}
                  title={nextProblem ? `Next: ${nextProblem.title}` : 'No next problem'}
                  className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </>
          )}

          {isReady && (
            <>
              <div className="h-4 w-px shrink-0 bg-slate-200" aria-hidden />
              <span className="truncate text-sm font-semibold text-slate-800">{problem!.title}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[problem!.difficulty]}`}>
                {problem!.difficulty}
              </span>
            </>
          )}
        </div>

        {/* Right: controls */}
        {isReady && (
          <div className="flex shrink-0 items-center gap-2">
            {/* ── Timer pill ── */}
            <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-colors duration-500 ${timerBadge}`}>
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="font-mono text-sm font-semibold tabular-nums">{formatTimer(timerSeconds)}</span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                title={timerRunning ? 'Pause timer' : 'Start timer'}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                {timerRunning ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
              </button>
              {!timerRunning && timerSeconds < TIMER_DEFAULT && (
                <button
                  type="button"
                  onClick={() => setTimerSeconds(TIMER_DEFAULT)}
                  title="Reset timer"
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <RotateCw className="h-3 w-3" aria-hidden />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200" aria-hidden />

            <button type="button" onClick={resetToStarter}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition">
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button type="button" onClick={togglePlainEditor}
              title={plainEditor ? 'Switch to Monaco editor' : 'Switch to plain text editor'}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{plainEditor ? 'Code editor' : 'Plain text'}</span>
            </button>
            <button type="button" onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition">
              <Keyboard className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden lg:inline">Shortcuts</span>
            </button>
            <button type="button" onClick={() => setIsMaximized(true)} title="Full screen editor"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Full screen</span>
            </button>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════
          NON-READY STATES
      ════════════════════════════════════════ */}
      {loadState !== 'ready' && (
        <div className="flex-1 overflow-y-auto p-6">
          {loadState === 'loading' && <DetailSkeleton />}
          {loadState === 'notfound' && (
            <StatusCard title="Problem not found" message={`No problem exists for "${slug}".`} tone="neutral">
              <Link href="/coding-test"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                Browse all problems
              </Link>
            </StatusCard>
          )}
          {loadState === 'error' && (
            <StatusCard title="Couldn't load this problem" message={errorMessage} tone="error">
              <button type="button" onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                <RotateCw className="h-4 w-4" aria-hidden />Retry
              </button>
            </StatusCard>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          SPLIT PANE
      ════════════════════════════════════════ */}
      {isReady && problem && (
        <div
          ref={containerRef}
          className={`flex ${isMaximized ? 'flex-row flex-1 overflow-hidden' : 'flex-col lg:flex-1 lg:flex-row lg:overflow-hidden'}${isDragging ? ' select-none' : ''}`}
        >

          {/* ── Left panel: problem statement ── */}
          <section
            className="overflow-y-auto border-b border-slate-200 bg-white lg:border-b-0 lg:border-r"
            style={leftStyle}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold leading-tight text-slate-900">{problem.title}</h1>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">{problem.tag}</p>

              {/* Statement */}
              <div className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                {problem.statement}
              </div>

              {/* Examples */}
              {problem.examples.length > 0 && (
                <div className="mt-7">
                  <h2 className="mb-3 text-base font-semibold text-slate-900">Examples</h2>
                  <div className="space-y-3">
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="font-mono text-sm leading-6 text-slate-700">
                          <span className="font-semibold text-slate-500">Input:</span>{' '}{ex.input}
                        </p>
                        <p className="mt-1 font-mono text-sm leading-6 text-slate-700">
                          <span className="font-semibold text-slate-500">Output:</span>{' '}{ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            <span className="font-semibold">Explanation:</span>{' '}{ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {problem.constraints.length > 0 && (
                <div className="mt-7">
                  <h2 className="mb-3 text-base font-semibold text-slate-900">Constraints</h2>
                  <ul className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-sm text-slate-600">
                        <span className="mt-0.5 text-indigo-400">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Complexity */}
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <Clock className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Expected time</p>
                    <p className="mt-0.5 font-mono text-sm font-medium text-slate-700">{problem.expected_time_complexity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <Database className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Expected space</p>
                    <p className="mt-0.5 font-mono text-sm font-medium text-slate-700">{problem.expected_space_complexity}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Draggable vertical divider with collapse toggle (desktop only) ── */}
          <div
            role="separator"
            aria-label="Drag to resize panels"
            onPointerDown={startDrag}
            className={`group relative hidden lg:flex w-[5px] shrink-0 items-center justify-center bg-slate-100 transition-colors hover:bg-indigo-50 active:bg-indigo-100 ${isPanelCollapsed ? 'cursor-default' : 'cursor-col-resize'}`}
          >
            <div className="h-10 w-[3px] rounded-full bg-slate-300 transition-colors group-hover:bg-indigo-400 group-active:bg-indigo-500" />
            {/* Collapse / expand button */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsPanelCollapsed((c) => !c)}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-7 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:border-indigo-400 hover:text-indigo-600"
              aria-label={isPanelCollapsed ? 'Expand problem panel' : 'Collapse problem panel'}
            >
              {isPanelCollapsed
                ? <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                : <ChevronLeft  className="h-3.5 w-3.5" aria-hidden />}
            </button>
          </div>

          {/* ── Right panel: editor + console + run bar ── */}
          <section
            className="flex min-h-[520px] flex-col overflow-hidden bg-white lg:min-h-0 lg:flex-none"
            style={rightStyle}
          >
            {/* Editor fills remaining height */}
            <div className="flex-1 overflow-hidden">
              {editorNode}
            </div>

            {/* ── Console panel (persistent, resizable, collapsible) ── */}
            <div
              className="shrink-0 overflow-hidden border-t border-slate-200 bg-[#1e1e1e]"
              style={{
                height:     consoleCollapsed ? 34 : consoleHeight,
                transition: 'height 200ms ease',
              }}
            >
              {/* Console header — drag handle + tab bar */}
              <div
                className="flex cursor-ns-resize select-none items-center border-b border-[#3e3e3e] bg-[#252526]"
                onPointerDown={startConsoleResize}
              >
                {/* Tabs */}
                <div className="flex items-center">
                  {(['output', 'tests', 'grade'] as const).map((tab) => {
                    const LABELS = { output: 'Output', tests: 'Test Cases', grade: 'AI Grade' };
                    const active = consoleTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setConsoleTab(tab)}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          active
                            ? 'border-indigo-500 text-slate-200'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {LABELS[tab]}
                        {tab === 'tests' && judgeResult && (
                          <span className={`rounded-full px-1.5 py-px text-[9px] font-bold leading-none ${
                            judgeResult.verdict === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {judgeResult.passed}/{judgeResult.total}
                          </span>
                        )}
                        {tab === 'grade' && isGrading && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-400" aria-hidden />
                        )}
                        {tab === 'grade' && !isGrading && gradingResult?.score != null && (
                          <span className={`rounded-full px-1.5 py-px text-[9px] font-bold leading-none ${
                            gradingResult.score >= 70 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {gradingResult.score}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right-side status + actions */}
                <div className="flex flex-1 items-center justify-end gap-1 pr-2">
                  {isBusy && (
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" aria-hidden />
                  )}
                  {(actionState === 'done' || (actionState === 'idle' && !!actionError)) && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={clearRunOutput}
                      className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:bg-[#3c3c3c] hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setConsoleCollapsed((c) => !c)}
                    className="rounded p-0.5 text-slate-500 transition hover:bg-[#3c3c3c] hover:text-slate-200"
                    aria-label={consoleCollapsed ? 'Expand console' : 'Collapse console'}
                  >
                    {consoleCollapsed
                      ? <ChevronUp   className="h-3.5 w-3.5" aria-hidden />
                      : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
                  </button>
                </div>
              </div>

              {/* Console body — tab content */}
              {!consoleCollapsed && (
                <div className="overflow-y-auto" style={{ height: consoleHeight - 34 }}>
                  {/* Output tab — raw error / status summary */}
                  {consoleTab === 'output' && (
                    <div className="p-3">
                      {actionState === 'idle' && !actionError && (
                        <p className="font-mono text-[13px] italic text-slate-500">
                          No output yet — press{' '}
                          <span className="font-semibold text-emerald-400">Run Code</span>{' '}
                          to execute.
                        </p>
                      )}
                      {isBusy && (
                        <p className="font-mono text-[13px] italic text-slate-400">
                          {actionState === 'submitting' ? 'Submitting your code…' : 'Running your code…'}
                        </p>
                      )}
                      {actionError && (
                        <pre className="whitespace-pre-wrap font-mono text-[13px] leading-5 text-rose-400">{actionError}</pre>
                      )}
                      {actionState === 'done' && judgeResult && (() => {
                        const firstErr = judgeResult.results.find((r) => r.stderr);
                        return firstErr?.stderr ? (
                          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-5 text-amber-400">{firstErr.stderr}</pre>
                        ) : (
                          <p className="font-mono text-[13px] text-slate-400">
                            {judgeResult.verdict === 'accepted'
                              ? `✓ All ${judgeResult.total} test${judgeResult.total !== 1 ? 's' : ''} passed.`
                              : `${judgeResult.passed} / ${judgeResult.total} tests passed.`}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* Test Cases tab — judge results */}
                  {consoleTab === 'tests' && (
                    judgeResult ? (
                      <JudgePanel result={judgeResult} mode={judgeMode} />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3">
                        <p className="font-mono text-[13px] italic text-slate-500">
                          Press{' '}
                          <span className="font-semibold text-emerald-400">Run Code</span>{' '}
                          to see per-test-case results.
                        </p>
                      </div>
                    )
                  )}

                  {/* AI Grade tab */}
                  {consoleTab === 'grade' && (
                    <div className="p-3">
                      {isPracticeMode ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                          <ShieldAlert className="h-8 w-8 text-slate-600" aria-hidden />
                          <p className="text-sm font-medium text-slate-400">AI grading is not available in practice mode.</p>
                          <p className="text-xs text-slate-600">Submit your solution in an assessment to receive AI feedback.</p>
                        </div>
                      ) : (
                        <>
                          {isGrading && !gradingResult && !gradingError && (
                            <div className="flex items-center gap-2 font-mono text-[13px] italic text-slate-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              Getting AI feedback…
                            </div>
                          )}
                          {gradingError && !gradingResult && (
                            <div className="flex items-start gap-2 rounded-lg border border-rose-800 bg-rose-950/40 p-3">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                              <p className="text-sm text-rose-400">{gradingError}</p>
                            </div>
                          )}
                          {gradingResult && (
                            <GradingResultPanel result={gradingResult} />
                          )}
                          {!isGrading && !gradingResult && !gradingError && (
                            <p className="font-mono text-[13px] italic text-slate-500">
                              Press <span className="font-semibold text-indigo-400">Submit</span> to get AI feedback on your solution.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Low-credit warning ── */}
            {quota && quota.submissions_remaining > 0 && quota.submissions_remaining <= 5 && (
              <div className="flex shrink-0 items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                <p className="text-xs text-amber-700">
                  Only <strong>{quota.submissions_remaining}</strong> AI grading credit{quota.submissions_remaining === 1 ? '' : 's'} remaining.
                </p>
              </div>
            )}

            {/* ── Run bar ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              {/* Auto-save indicator */}
              <div
                className={`flex items-center gap-1 text-xs font-medium text-emerald-600 transition-opacity duration-300 ${
                  saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'
                }`}
                aria-live="polite"
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                Saved
              </div>

              <SubmitButton
                onRun={handleRun}
                onSubmit={handleSubmit}
                runState={actionState === 'running' ? 'running' : 'idle'}
                submitState={actionState === 'submitting' ? 'submitting' : 'idle'}
                submissionsRemaining={quota?.submissions_remaining ?? null}
                disabled={isGrading}
              />
            </div>
          </section>

        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   StatusCard
───────────────────────────────────────────────────────────── */
function StatusCard({
  title, message, tone, children,
}: {
  title: string; message: string; tone: 'error' | 'neutral'; children?: React.ReactNode;
}) {
  const isError = tone === 'error';
  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl border p-10 text-center ${
      isError ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
    }`}>
      <AlertCircle className={`h-8 w-8 ${isError ? 'text-rose-500' : 'text-slate-400'}`} aria-hidden />
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DetailSkeleton
───────────────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3 w-1/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="flex-1 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
    </div>
  );
}
