'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Brain, BookOpen, Calculator, BarChart3, ChevronRight, RotateCcw, CheckCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { getParentSessionResult, getSessionById, getSessionVideoEvaluation, TestResult, SessionMetadata, MockTestResultError, ResultErrorDiagnostics, VideoEvaluation } from '@/api/mockTestApi';
import { resolveCompanyInfo, resolveCompanyId } from '@/lib/mockTestConstants';

const sectionIconMap: Record<string, React.ElementType> = {
  'Logical Reasoning': Brain,
  'Verbal Ability':    BookOpen,
  'Aptitude':          Calculator,
};

type TabId = 'analysis' | 'review' | 'proctoring';

/**
 * Resolve a stored answer to the full option text.
 *
 * The runner submits the candidate's choice as a bare letter ("B"), while the
 * options and correct_answer carry the full label ("B. 20%"). A plain equality
 * check therefore never matched the candidate's pick, so their selected option
 * was never highlighted and "Your answer" showed a lone letter. Handles: exact
 * text, bare letter, "B." / "B)" prefixes, and case-insensitive text.
 */
function resolveOptionText(value: string | undefined | null, options: string[]): string | null {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;

  const exact = options.find(o => o === v);
  if (exact) return exact;

  const byLetter = (letter: string): string | null => {
    const idx = letter.toUpperCase().charCodeAt(0) - 65;
    return idx >= 0 && idx < options.length ? options[idx] : null;
  };

  if (/^[A-Za-z]$/.test(v)) {
    const hit = byLetter(v);
    if (hit) return hit;
  }

  const prefixed = v.match(/^([A-Za-z])\s*[.)]\s*/);
  if (prefixed) {
    const hit = byLetter(prefixed[1]);
    if (hit) return hit;
  }

  const ci = options.find(o => o.trim().toLowerCase() === v.toLowerCase());
  return ci ?? null;
}

export default function MockTestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.id as string;

  const parentSessionId = searchParams.get('parentSession');
  const sessionParam = searchParams.get('session') || searchParams.get('sessions');
  const sessionIds = useMemo(
    () => sessionParam ? sessionParam.split(',').filter(id => id.trim()) : [],
    [sessionParam]
  );
  const sessionId = sessionIds[0];

  const testInfo = resolveCompanyInfo(testId);

  const [result, setResult] = useState<TestResult | null>(null);
  // Deep-linkable tab, so History can send a candidate straight to their answers
  // and explanations instead of landing them on the score summary.
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam === 'review' ? 'review' : tabParam === 'proctoring' ? 'proctoring' : 'analysis',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<ResultErrorDiagnostics | null>(null);
  const [videoEvaluation, setVideoEvaluation] = useState<VideoEvaluation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        if (!parentSessionId) { setError('No parent session ID provided'); setLoading(false); return; }
        const result = await getParentSessionResult(parentSessionId);
        type SecRow = { name: string; accuracy: number };
        const secs = (result.sections ?? []) as SecRow[];
        if (!result.strengths?.length && secs.length > 0)
          result.strengths = secs.filter(s => s.accuracy >= 70).map(s => `${s.name}: ${s.accuracy}% accuracy`);
        if (!result.improvements?.length && secs.length > 0)
          result.improvements = secs.filter(s => s.accuracy < 60).map(s => `${s.name}: ${s.accuracy}% accuracy — needs more practice`);
        setResult(result);
        setError(null);
      } catch (err: unknown) {
        setError((err as { message?: string })?.message || 'Failed to load test results');
        // Keep the server-side identifiers so a failure can be traced in the
        // backend log from a screenshot alone.
        setErrorInfo((err as MockTestResultError)?.diagnostics ?? null);
        console.error('[results] failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestResult();
  }, [parentSessionId, refreshKey]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchMeta = async () => { try { setSessionMetadata(await getSessionById(sessionId)); } catch { } };
    fetchMeta();
  }, [sessionId]);

  // Proctoring evaluation. Keyed off the parent session — the same id the runner
  // uploads under. Absent (null) simply means this attempt had no recording, which
  // is not an error worth surfacing.
  useEffect(() => {
    if (!parentSessionId) return;
    let cancelled = false;

    // The recording uploads in the background after submit and the AI evaluator
    // can take a while, so it is normally NOT ready when this page first loads.
    // Poll for a few minutes so the Proctoring tab appears on its own instead of
    // requiring a manual refresh. Gives up quietly — a missing evaluation is not
    // an error worth showing.
    const POLL_DELAY_MS = 20_000;
    const MAX_ATTEMPTS = 9;

    (async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const evaluation = await getSessionVideoEvaluation(parentSessionId);
          if (cancelled) return;
          if (evaluation) { setVideoEvaluation(evaluation); return; }
        } catch (err) {
          console.error('[results] video evaluation fetch failed:', err);
          return;
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [parentSessionId, refreshKey]);

  const totalScore     = result?.total_score ?? 0;
  const totalQuestions = result?.total_questions ?? 0;
  const accuracy       = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  const sections = result?.sections ?? [];

  // The proctoring panel only exists once an evaluation has been stored, so a
  // deep link to it before the upload lands would otherwise render a blank body.
  const effectiveTab: TabId = activeTab === 'proctoring' && !videoEvaluation ? 'analysis' : activeTab;

  const resultDate = sessionMetadata?.created_at
    ? new Date(sessionMetadata.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#ffffff' }}>
        <div className="w-14 h-14 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-lg" style={{ color: '#2d2d2d' }}>Calculating your results…</p>
        <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>Fetching scores from all sections</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: '#ffffff' }}>
        <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="text-center max-w-lg w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Results</h2>
          <p className="text-slate-500 mb-5">{error}</p>

          {/* Server-side identifiers. Printed on screen so a bug report or
              screenshot is enough to find the exact failure in the backend log —
              previously this panel showed only the generic headline. */}
          {errorInfo && (
            <div className="mb-6 text-left rounded-xl border p-4" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#94A3B8' }}>
                Diagnostics — include this when reporting
              </p>
              <dl className="text-xs font-mono space-y-1" style={{ color: '#475569' }}>
                {([
                  ['status',     String(errorInfo.status ?? '—')],
                  ['error_code', errorInfo.errorCode],
                  ['error_id',   errorInfo.errorId],
                  ['request_id', errorInfo.requestId],
                  ['parent',     errorInfo.parentSessionId],
                  ['attempts',   String(errorInfo.attempts)],
                ] as [string, string | undefined][])
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="shrink-0" style={{ color: '#94A3B8' }}>{k}:</dt>
                      <dd className="break-all">{v}</dd>
                    </div>
                  ))}
              </dl>
              <button
                onClick={() => navigator.clipboard?.writeText(JSON.stringify({ message: error, ...errorInfo }, null, 2))}
                className="mt-3 text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-md border transition hover:bg-white"
                style={{ borderColor: '#CBD5E1', color: '#475569' }}
              >
                Copy details
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={() => { setError(null); setErrorInfo(null); setLoading(true); setRefreshKey(k => k + 1); }} className="px-6 py-3 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#172554] transition">Retry</button>
            <button onClick={() => router.push('/mock-test')} className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-white transition">← Back to Mock Tests</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>

      {/* Dev debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
          <p className="text-xs font-mono text-amber-800">
            DEBUG | session={sessionId} | score={result?.total_score}/{result?.total_questions} | grade={result?.grade} | sections={sections.length}
          </p>
        </div>
      )}

      {/* Processing banner */}
      {result && totalScore === 0 && sections.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-sm text-amber-800 font-medium">Scores may still be processing. If your score looks incorrect, click Refresh.</p>
          </div>
          <button
            onClick={() => { setLoading(true); setRefreshKey(k => k + 1); }}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shrink-0"
          >
            Refresh Results
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span style={{ color: '#64748B' }}>{testInfo.name}</span>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>Result · {resultDate}</span>
        </div>

        {/* Tab strip — segmented control: pill-shaped container with sliding active state */}
        <div
          className="mb-5 inline-flex items-center p-1 rounded-xl overflow-x-auto print:hidden"
          role="tablist"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
        >
          {([
            { id: 'analysis',    label: 'Section scores',  badge: null },
            { id: 'review',      label: 'Question review', badge: result?.questions?.length ?? null },
            // Only offered when a recording was actually evaluated — an empty tab
            // on every non-proctored attempt would be noise.
            ...(videoEvaluation ? [{ id: 'proctoring' as TabId, label: 'Proctoring', badge: null }] : []),
          ] as { id: TabId; label: string; badge: string | number | null }[]).map(item => {
            const active = effectiveTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(item.id)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 shrink-0"
                style={{
                  background: active ? '#ffffff' : 'transparent',
                  color:      active ? '#1e3a8a' : '#475569',
                  boxShadow:  active ? '0 1px 2px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.08)' : 'none',
                }}
              >
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded" style={{ background: active ? '#dbeafe' : '#E2E8F0', color: active ? '#1e3a8a' : '#475569' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body: single column — section-intro DNA ───────────────────────── */}
        <div className="space-y-5">

            {/* Practice Attempts — NXT Wave style card grid */}
            {(() => {
              type Attempt = {
                key: string;
                date: string;
                duration: string;
                score: number;
                total: number;
                correct: number;
                wrong: number;
                unanswered: number;
                isCurrent: boolean;
              };

              const fmtDate = (iso?: string) =>
                iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—';
              const fmtDuration = (sec?: number) => {
                if (sec == null) return '—';
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                if (m === 0) return `${s}SEC`;
                if (s === 0) return `${m}MINS`;
                return `${m}MINS${s}SEC`;
              };

              const currentCorrect = result?.sections?.reduce((a, s) => a + (s.correct ?? 0), 0) ?? totalScore;
              const currentWrong   = result?.sections?.reduce((a, s) => a + (s.wrong ?? 0), 0) ?? (result?.incorrect ?? 0);
              const currentSkipped = result?.sections?.reduce((a, s) => a + (s.skipped ?? 0), 0) ?? (result?.not_attempted ?? Math.max(0, totalQuestions - currentCorrect - currentWrong));

              const currentAttempt: Attempt = {
                key: sessionId ?? 'current',
                date: fmtDate(sessionMetadata?.created_at) !== '—' ? fmtDate(sessionMetadata?.created_at) : resultDate,
                duration: fmtDuration(result?.time_taken),
                score: totalScore,
                total: totalQuestions,
                correct: currentCorrect,
                wrong: currentWrong,
                unanswered: currentSkipped,
                isCurrent: true,
              };

              // Only show the current attempt — previous attempts are
              // available via the History page, no need to repeat them here.
              const attempts: Attempt[] = [currentAttempt];

              return (
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.01em' }}>
                      Your Result
                    </h2>
                    <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>
                      {testInfo.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 max-w-xl">
                    {attempts.map((a) => {
                      return (
                        <div
                          key={a.key}
                          className="bg-white rounded-2xl border p-6 flex flex-col"
                          style={{
                            borderColor: '#E5E7EB',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
                          }}
                        >
                          {/* Date / duration row */}
                          <div className="flex items-center justify-between pb-3 mb-5 border-b text-[11px] font-bold tracking-widest" style={{ borderColor: '#E5E7EB', color: '#475569' }}>
                            <span>{a.date}</span>
                            <span>{a.duration}</span>
                          </div>

                          {/* Score circle + breakdown */}
                          <div className="flex items-center gap-6">
                            <div
                              className="w-28 h-28 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: '#ffffff', border: '4px solid #dbeafe' }}
                            >
                              <span className="text-4xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>{a.score}</span>
                            </div>
                            <ul className="flex-1 min-w-0 space-y-3 text-sm">
                              <li className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#dcfce7' }}>
                                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="#15803d"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>
                                </span>
                                <span className="whitespace-nowrap"><span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{a.correct}</span> <span style={{ color: '#475569' }}>Correct Answers</span></span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
                                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="#dc2626"><path fillRule="evenodd" d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 11-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" clipRule="evenodd"/></svg>
                                </span>
                                <span className="whitespace-nowrap"><span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{a.wrong}</span> <span style={{ color: '#475569' }}>Wrong Answers</span></span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fef3c7' }}>
                                  <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                                </span>
                                <span className="whitespace-nowrap"><span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{a.unanswered}</span> <span style={{ color: '#475569' }}>Unanswered</span></span>
                              </li>
                            </ul>
                          </div>

                          {/* Review mistakes link */}
                          <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: '#E5E7EB' }}>
                            <button
                              onClick={() => a.isCurrent ? setActiveTab('review') : router.push(`/mock-test/results/${testId}?parentSession=${a.key}`)}
                              className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 hover:opacity-70 transition"
                              style={{ color: a.wrong > 0 ? '#1e3a8a' : '#94A3B8', cursor: a.wrong > 0 ? 'pointer' : 'default' }}
                              disabled={a.wrong === 0}
                            >
                              Review Mistakes <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}


          {/* ── Tab content ─────────────────────────────────────────────── */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >

            {/* ANALYSIS — Section breakdown table */}
            {effectiveTab === 'analysis' && (
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.01em' }}>Section breakdown</h3>
                    <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Per-section score, time, accuracy, and movement vs. your previous attempt.</p>
                  </div>
                  <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>
                    {sections.length} sections · {totalQuestions} questions
                  </span>
                </div>
                {sections.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#94A3B8' }} />
                    <p className="font-semibold" style={{ color: '#475569' }}>Section breakdown unavailable</p>
                    <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>The server did not return section scores for this session.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-8 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Section</th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Score</th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Accuracy</th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Time</th>
                        <th className="text-left py-3 px-4 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Right / Wrong / Skip</th>
                        <th className="text-center py-3 px-4 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((section, idx) => {
                        const pct     = section.accuracy ?? 0;
                        const verdict = pct >= 70 ? 'Strong' : pct >= 50 ? 'Okay' : 'Weak';
                        const verdictBg    = pct >= 70 ? '#d1fae5' : pct >= 50 ? '#fef3c7' : '#fee2e2';
                        const verdictColor = pct >= 70 ? '#065f46' : pct >= 50 ? '#92400e' : '#991b1b';
                        const correct  = section.correct  ?? section.score ?? 0;
                        const wrong    = section.wrong    ?? 0;
                        const skipped  = section.skipped  ?? Math.max(0, (section.total ?? 0) - correct - wrong);
                        const total    = section.total || 1;
                        const subLabel =
                          section.name.toLowerCase().includes('arithmetic') ? 'time-work, percentages' :
                          section.name.toLowerCase().includes('aptitude')   ? 'DI, permutations' :
                          section.name.toLowerCase().includes('reasoning')  ? 'logical sequences' :
                          section.name.toLowerCase().includes('technical')  ? 'DSA, SQL, OOP' : '';
                        return (
                          <tr key={section.name} className="border-b border-slate-50 hover:bg-slate-50 transition">
                            <td className="py-4 px-8">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: '#94A3B8' }}>
                                  {idx + 1}.
                                </span>
                                <div>
                                  <p className="font-bold" style={{ color: '#0F172A' }}>{section.name}</p>
                                  {subLabel && <p className="text-xs" style={{ color: '#94A3B8' }}>{subLabel}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-xl font-bold tabular-nums" style={{ color: '#0F172A' }}>{section.score}</span>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold tabular-nums" style={{ color: '#475569' }}>{pct}%</td>
                            <td className="py-4 px-4 text-right font-mono text-xs tabular-nums" style={{ color: '#94A3B8' }}>{section.time ?? '—'}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-px flex-1 rounded overflow-hidden" style={{ height: 14, minWidth: 72 }}>
                                  <div className="bg-emerald-400" style={{ width: `${(correct / total) * 100}%` }} />
                                  <div className="bg-red-400" style={{ width: `${(wrong / total) * 100}%` }} />
                                  <div className="bg-slate-200" style={{ width: `${Math.max(0, (skipped / total)) * 100}%` }} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs shrink-0 tabular-nums">
                                  <span className="font-semibold text-emerald-600">{correct}</span>
                                  <span className="font-semibold text-red-500">{wrong}</span>
                                  <span style={{ color: '#94A3B8' }}>{skipped}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase" style={{ background: verdictBg, color: verdictColor }}>
                                <span aria-hidden="true">{verdict === 'Strong' ? '✓' : verdict === 'Okay' ? '~' : '!'}</span>
                                {verdict}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            )}

            {/* QUESTION REVIEW */}
            {effectiveTab === 'review' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-1">Question Review</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {result?.questions?.length
                    ? `${result.questions.length} question${result.questions.length !== 1 ? 's' : ''} reviewed`
                    : 'Section-level summary'}
                </p>
                {result?.questions && result.questions.length > 0 ? (
                  <div className="space-y-4">
                    {result.questions.map((q, idx) => {
                      const opts        = q.options ?? [];
                      const chosenText  = resolveOptionText(q.user_answer, opts);
                      const correctText = resolveOptionText(q.correct_answer, opts) ?? q.correct_answer;
                      return (
                      <div key={`${q.question_id}-${idx}`} className={`rounded-xl border-2 overflow-hidden ${q.is_correct ? 'border-emerald-300' : !q.user_answer ? 'border-amber-300' : 'border-red-300'}`}>
                        <div className={`flex items-center justify-between px-5 py-3 ${q.is_correct ? 'bg-emerald-50' : !q.user_answer ? 'bg-amber-50' : 'bg-red-50'}`}>
                          <div className="flex items-center gap-2">
                            {/* Skipped questions now reach the report too, and calling
                                them "Incorrect" would misrepresent them — the user
                                never answered, they didn't get it wrong. */}
                            {q.is_correct
                              ? <CheckCircle size={16} className="text-emerald-600" />
                              : !q.user_answer
                                ? <span className="text-amber-500 font-bold text-base leading-none">–</span>
                                : <span className="text-red-500 font-bold text-base leading-none">✗</span>}
                            <span className={`text-sm font-bold ${q.is_correct ? 'text-emerald-700' : !q.user_answer ? 'text-amber-600' : 'text-red-600'}`}>
                              Q{idx + 1} — {q.is_correct ? 'Correct' : !q.user_answer ? 'Not answered' : 'Incorrect'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {q.difficulty && (
                              <span className={`font-semibold px-2 py-0.5 rounded-full ${q.difficulty === 'hard' ? 'bg-red-100 text-red-600' : q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {q.difficulty}
                              </span>
                            )}
                            {q.time_taken_seconds != null && <span>{q.time_taken_seconds}s</span>}
                          </div>
                        </div>
                        <div className="px-5 py-4 bg-white space-y-3">
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.question_text}</p>
                          {q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt, oi) => {
                                // Resolved, so a letter-coded answer still matches its option.
                                const isCorrect  = opt === correctText;
                                const isUserPick = opt === chosenText;
                                const isUserWrong = isUserPick && !q.is_correct;
                                return (
                                  <div key={oi} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold' : isUserWrong ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                                    {isCorrect   && <CheckCircle size={13} className="text-emerald-600 shrink-0" />}
                                    {isUserWrong && <span className="text-red-500 font-bold shrink-0">✗</span>}
                                    {!isCorrect && !isUserWrong && <span className="w-3.5 shrink-0" />}
                                    <span className="flex-1">{opt}</span>
                                    {/* Label the candidate's pick explicitly — colour alone
                                        does not say "this is what they chose". */}
                                    {isUserPick && (
                                      <span
                                        className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
                                        style={isCorrect
                                          ? { background: '#d1fae5', color: '#065f46' }
                                          : { background: '#fee2e2', color: '#991b1b' }}
                                      >
                                        Chosen
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold uppercase tracking-wide">Candidate answered: </span>
                              {/* Full option text, not the stored letter — "B" alone
                                  tells a reviewer nothing about what was chosen. */}
                              <span className={`font-bold ${q.is_correct ? 'text-emerald-600' : !q.user_answer ? 'text-amber-600' : 'text-red-500'}`}>
                                {chosenText ?? (q.user_answer || 'Not answered')}
                              </span>
                            </div>
                            {!q.is_correct && (
                              <div>
                                <span className="text-slate-400 font-semibold uppercase tracking-wide">Correct: </span>
                                <span className="font-bold text-emerald-600">{correctText}</span>
                              </div>
                            )}
                          </div>
                          {q.explanation && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Explanation</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}
                          {q.solution_steps && q.solution_steps.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Solution Steps</p>
                              <ol className="space-y-1.5">
                                {q.solution_steps.map((step, si) => (
                                  <li key={si} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold shrink-0 flex items-center justify-center mt-0.5">{si + 1}</span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {q.common_mistakes && q.common_mistakes.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Why Other Options Are Wrong</p>
                              <ul className="space-y-1.5">
                                {q.common_mistakes.map((m, mi) => (
                                  <li key={mi} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="text-red-400 font-bold shrink-0 mt-0.5">✗</span>
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => {
                      const pct = section.accuracy ?? 0;
                      const pass = pct >= 30;
                      const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-[#1e3a8a]' : 'bg-red-500';
                      return (
                        <div key={section.name} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              {(() => { const Icon = sectionIconMap[section.name] ?? Brain; return <Icon size={16} className="text-[#1e3a8a]" />; })()}
                              <span className="font-semibold text-slate-900 text-sm">{section.name}</span>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {section.score}/{section.total} {pass ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">{pct}% accuracy</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PROCTORING — AI evaluation of the recorded attempt */}
            {effectiveTab === 'proctoring' && videoEvaluation && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-1">Proctoring Review</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Automated review of the recording captured during this attempt.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Duration', value: videoEvaluation.duration_seconds
                        ? `${Math.floor(videoEvaluation.duration_seconds / 60)}m ${Math.round(videoEvaluation.duration_seconds % 60)}s`
                        : '—' },
                    { label: 'Recorded', value: videoEvaluation.created_at
                        ? new Date(videoEvaluation.created_at).toLocaleString()
                        : '—' },
                    { label: 'File', value: videoEvaluation.filename || '—' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#94A3B8' }}>{stat.label}</p>
                      <p className="text-sm font-semibold break-all" style={{ color: '#0F172A' }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* `result` is passed through from the AI service unchanged so new
                    fields reach the UI without a release — render whatever scalar
                    fields it carries rather than hardcoding a shape that may drift. */}
                {(() => {
                  const rows = Object.entries(videoEvaluation.result ?? {}).filter(
                    ([k, v]) =>
                      !['evaluation_id', 'test_id', 'filename', 'duration_seconds', 'timestamp'].includes(k) &&
                      (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'),
                  );
                  if (rows.length === 0) {
                    return (
                      <div className="rounded-xl px-5 py-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <p className="text-sm" style={{ color: '#475569' }}>
                          The recording was uploaded and accepted. No detailed findings were returned for this attempt.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <dl className="space-y-2">
                      {rows.map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-4 py-2 border-b" style={{ borderColor: '#F1F5F9' }}>
                          <dt className="text-sm font-semibold capitalize" style={{ color: '#475569' }}>
                            {key.replace(/[_-]+/g, ' ')}
                          </dt>
                          <dd className="text-sm text-right break-words" style={{ color: '#0F172A' }}>{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                })()}
              </div>
            )}

          </motion.div>

        </div>

        {/* Bottom action row — same shape as section intro */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <button
            onClick={() => router.push('/mock-test')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#475569' }}
          >
            ← Back to Tests
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const prevTitle = document.title;
                document.title = `CareerBot Result - ${testInfo.name} - ${resultDate}`;
                const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
                window.addEventListener('afterprint', restore);
                window.print();
              }}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition hover:bg-white"
              style={{ border: '1px solid #E5E7EB', color: '#475569', background: 'transparent' }}
            >
              Export PDF
            </button>
            <button
              onClick={() => router.push('/mock-test/history')}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition hover:bg-white"
              style={{ border: '1px solid #E5E7EB', color: '#475569', background: 'transparent' }}
            >
              View History
            </button>
            <button
              onClick={() => router.push('/mock-test')}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition hover:bg-white flex items-center gap-1.5"
              style={{ border: '1px solid #E5E7EB', color: '#475569', background: 'transparent' }}
            >
              <RotateCcw size={13} /> Retake
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)]"
              style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
            >
              <LogOut size={14} /> Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
