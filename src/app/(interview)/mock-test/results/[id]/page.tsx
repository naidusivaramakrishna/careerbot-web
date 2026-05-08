'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Brain, BookOpen, Calculator, TrendingUp, TrendingDown, Minus, Trophy, BarChart3, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { getParentSessionResult, getWeakAreasAnalytics, getMockTestHistory, getSessionById, getProgressAnalytics, getLeaderboard, TestResult, WeakAreasAnalytics, HistoryRecord, SessionMetadata, ProgressAnalytics, Leaderboard } from '@/api/mockTestApi';
import { resolveCompanyInfo } from '@/lib/mockTestConstants';

const sectionIconMap: Record<string, React.ElementType> = {
  'Logical Reasoning': Brain,
  'Verbal Ability':    BookOpen,
  'Aptitude':          Calculator,
};

type TabId = 'analysis' | 'review' | 'weak-areas' | 'leaderboard';

const gradeConfig: Record<string, { color: string; bg: string; ring: string; label: string; pillBg: string; pillText: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500', ring: '#10b981', label: 'Excellent',  pillBg: '#d1fae5', pillText: '#065f46' },
  B: { color: 'text-[#2557a7]',   bg: 'bg-[#2557a7]',  ring: '#2557a7', label: 'Good',       pillBg: '#eef3ff', pillText: '#2557a7' },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500',  ring: '#f59e0b', label: 'Average',    pillBg: '#fef3c7', pillText: '#92400e' },
  D: { color: 'text-orange-400',  bg: 'bg-orange-500',  ring: '#f97316', label: 'Below Avg',  pillBg: '#ffedd5', pillText: '#9a3412' },
  F: { color: 'text-red-400',     bg: 'bg-red-500',     ring: '#ef4444', label: 'Poor',       pillBg: '#fee2e2', pillText: '#991b1b' },
};

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
  const [weakAreas, setWeakAreas] = useState<WeakAreasAnalytics | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('analysis');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);
  const [progressAnalytics, setProgressAnalytics] = useState<ProgressAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchTestResult();
  }, [parentSessionId, refreshKey]);

  useEffect(() => {
    const fetchWeakAreas = async () => { try { setWeakAreas(await getWeakAreasAnalytics()); } catch { } };
    fetchWeakAreas();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => { try { setLeaderboard(await getLeaderboard()); } catch { } };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try { setHistory(await getMockTestHistory()); } catch { setHistory([]); } finally { setHistoryLoading(false); }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => { try { setProgressAnalytics(await getProgressAnalytics()); } catch { } };
    fetchProgress();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const fetchMeta = async () => { try { setSessionMetadata(await getSessionById(sessionId)); } catch { } };
    fetchMeta();
  }, [sessionId]);

  const totalScore     = result?.total_score ?? 0;
  const totalQuestions = result?.total_questions ?? 0;
  const accuracy       = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const circumference  = 2 * Math.PI * 52;
  const progressOffset = circumference - (accuracy / 100) * circumference;

  const sections = result?.sections ?? [];
  const grade    = result?.grade ?? 'F';
  const gc       = gradeConfig[grade] ?? gradeConfig['F'];

  const avgAcc = Math.round(
    typeof progressAnalytics?.average_accuracy === 'number'
      ? progressAnalytics.average_accuracy
      : typeof progressAnalytics?.average_score === 'number'
      ? progressAnalytics.average_score
      : 0
  );
  const percentile = leaderboard?.your_rank && leaderboard?.total_participants
    ? Math.max(1, 100 - Math.round((leaderboard.your_rank / leaderboard.total_participants) * 100))
    : null;

  const keyMetrics = [
    {
      label: 'ACCURACY',
      value: `${accuracy}%`,
      sub: accuracy > avgAcc && avgAcc > 0 ? `+${accuracy - avgAcc} above your avg` : `${accuracy}% of questions correct`,
      color: '#2557a7',
    },
    {
      label: 'TIME USED',
      value: sessionMetadata ? '—' : '—',
      sub: 'of session duration',
      color: '#2d2d2d',
    },
    {
      label: 'PERCENTILE',
      value: percentile ? `P${percentile}` : '—',
      sub: leaderboard?.total_participants ? `vs ${leaderboard.total_participants} attempts` : 'percentile rank',
      color: '#2d2d2d',
    },
    {
      label: 'VS AVG',
      value: avgAcc > 0 ? (accuracy >= avgAcc ? `+${accuracy - avgAcc}` : `${accuracy - avgAcc}`) : '—',
      sub: avgAcc > 0 ? `your last mean ${avgAcc}%` : 'compared to your average',
      color: accuracy >= avgAcc ? '#059669' : '#ef4444',
    },
  ];

  const getPerformanceFeedback = () => {
    if (!result) return { message: '', subtitle: '' };
    switch (result.grade) {
      case 'A': return { message: 'Outstanding Performance', subtitle: 'You are in the top tier. Keep it up!' };
      case 'B': return { message: 'Great Job', subtitle: 'Very strong result — just a bit more to reach the top.' };
      case 'C': return { message: `Above the 60% ${testInfo.name} cutoff`, subtitle: 'Focus on weak areas to improve your score further.' };
      case 'D': return { message: 'Keep Practicing', subtitle: 'Review the concepts and retake the test.' };
      default:  return { message: 'Needs Improvement', subtitle: 'Regular practice on core concepts will help.' };
    }
  };
  const feedback = getPerformanceFeedback();

  const resultDate = sessionMetadata?.created_at
    ? new Date(sessionMetadata.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#F4F2EC' }}>
        <div className="w-14 h-14 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-lg" style={{ color: '#2d2d2d' }}>Calculating your results…</p>
        <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>Fetching scores from all sections</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: '#F4F2EC' }}>
        <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Results</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#2557a7] text-white font-semibold rounded-xl hover:bg-[#1a3d73] transition">Retry</button>
            <button onClick={() => router.push('/mock-test')} className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-white transition">← Back to Mock Tests</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen" style={{ background: '#F4F2EC' }}>

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

      {/* ── Breadcrumb / top action bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-black tracking-wide">
          <button onClick={() => router.push('/mock-test')} className="hover:underline" style={{ color: 'rgba(0,0,0,0.4)' }}>MOCK TESTS</button>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>/</span>
          <span style={{ color: 'rgba(0,0,0,0.4)' }}>{testInfo.name.toUpperCase()}</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>/</span>
          <span style={{ color: 'rgba(0,0,0,0.4)' }}>RESULT</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>/</span>
          <span style={{ color: 'rgba(0,0,0,0.55)' }}>{resultDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-slate-200 text-xs font-black tracking-wide rounded-lg hover:bg-slate-50 transition" style={{ color: '#2d2d2d' }}>
            EXPORT PDF
          </button>
          <button
            onClick={() => router.push(`/mock-test/company/${testId}`)}
            className="px-3 py-1.5 border border-slate-200 text-xs font-black tracking-wide rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5"
            style={{ color: '#2d2d2d' }}
          >
            <RotateCcw size={10} /> RETAKE
          </button>
          <button
            onClick={() => router.push('/mock-test/history')}
            className="px-3 py-1.5 text-white text-xs font-black tracking-wide rounded-lg transition flex items-center gap-1.5"
            style={{ background: '#2557a7' }}
          >
            VIEW HISTORY <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* ── Body: main content + right sidebar ──────────────────────────── */}
      <div className="flex">

        {/* ── Main scrollable content ──────────────────────────────────── */}
        <div className="flex-1 p-6 space-y-4 min-w-0">

          {/* Score hero card */}
          <div className="bg-white rounded-xl p-6">
            <p className="text-xs font-black tracking-widest mb-4" style={{ color: 'rgba(0,0,0,0.3)' }}>
              YOUR RESULT · {testInfo.name.toUpperCase()}
            </p>
            <div className="flex items-start gap-6">

              {/* Score circle + grade + feedback */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="relative">
                  <svg width="100" height="100" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={gc.ring} strokeWidth="10"
                      strokeDasharray={circumference} strokeDashoffset={progressOffset}
                      strokeLinecap="round" transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                    <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="900" fill="#111">{totalScore}</text>
                    <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#94a3b8">of {totalQuestions}</text>
                  </svg>
                </div>
                <div className="max-w-xs">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-2"
                    style={{ background: gc.pillBg, color: gc.pillText }}
                  >
                    GRADE {grade} · {accuracy >= 60 ? 'PASSED' : 'FAILED'}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">{feedback.message}. {feedback.subtitle}</p>
                </div>
              </div>

              {/* Key metrics */}
              <div className="flex gap-3 flex-1 ml-2">
                {keyMetrics.map(m => (
                  <div key={m.label} className="flex-1 border border-slate-100 rounded-xl p-4 min-w-0">
                    <p className="text-xs font-black tracking-widest mb-2" style={{ color: 'rgba(0,0,0,0.3)' }}>{m.label}</p>
                    <p className="text-2xl font-black leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs leading-tight" style={{ color: 'rgba(0,0,0,0.35)' }}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insight banner */}
          {sections.length > 0 && (() => {
            const best  = [...sections].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0];
            const worst = [...sections].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
            return (
              <div className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: '#eef3ff', borderLeft: '4px solid #2557a7' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#2557a7' }}>
                  <TrendingUp size={13} style={{ color: 'white' }} />
                </div>
                <p className="text-sm font-semibold text-slate-800 flex-1">
                  Best gain — <span style={{ color: '#2557a7' }}>{best?.name} at {best?.accuracy}% accuracy</span>.{' '}
                  {worst && worst.name !== best?.name
                    ? <>{worst.name} still your bottleneck — {worst.accuracy}% accuracy. Drill plan attached below.</>
                    : 'Keep up the strong performance across all sections.'
                  }
                </p>
                <button
                  onClick={() => setActiveTab('weak-areas')}
                  className="px-4 py-2 text-white text-xs font-black rounded-lg shrink-0 hover:opacity-90 transition"
                  style={{ background: '#2557a7' }}
                >
                  VIEW STUDY PLAN
                </button>
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
            {activeTab === 'analysis' && (
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-slate-900">Section breakdown</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Per-section score, time, accuracy, and movement vs. your previous attempt.</p>
                  </div>
                  <span className="text-xs font-black tracking-wide" style={{ color: 'rgba(0,0,0,0.25)' }}>
                    {sections.length} SECTIONS · {totalQuestions} QUESTIONS
                  </span>
                </div>
                {sections.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Section breakdown unavailable</p>
                    <p className="text-sm mt-1 text-slate-400">The server did not return section scores for this session.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-6 text-xs font-black tracking-wide text-slate-400">SECTION</th>
                        <th className="text-right py-3 px-4 text-xs font-black tracking-wide text-slate-400">SCORE</th>
                        <th className="text-right py-3 px-4 text-xs font-black tracking-wide text-slate-400">ACCURACY</th>
                        <th className="text-right py-3 px-4 text-xs font-black tracking-wide text-slate-400">TIME</th>
                        <th className="text-left py-3 px-4 text-xs font-black tracking-wide text-slate-400">RIGHT / WRONG / SKIP</th>
                        <th className="text-center py-3 px-4 text-xs font-black tracking-wide text-slate-400">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((section, idx) => {
                        const pct     = section.accuracy ?? 0;
                        const verdict = pct >= 70 ? 'STRONG' : pct >= 50 ? 'OK' : 'WEAK';
                        const verdictBg    = verdict === 'STRONG' ? '#d1fae5' : verdict === 'OK' ? '#fef3c7' : '#fee2e2';
                        const verdictColor = verdict === 'STRONG' ? '#065f46' : verdict === 'OK' ? '#92400e' : '#991b1b';
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
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black shrink-0" style={{ color: 'rgba(0,0,0,0.2)' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900">{section.name}</p>
                                  {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-xl font-black text-slate-900">{section.score}</span>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold text-slate-600">{pct}%</td>
                            <td className="py-4 px-4 text-right text-slate-500 font-mono text-xs">{section.time ?? '—'}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-px flex-1 rounded overflow-hidden" style={{ height: 14, minWidth: 72 }}>
                                  <div className="bg-emerald-400" style={{ width: `${(correct / total) * 100}%` }} />
                                  <div className="bg-red-400" style={{ width: `${(wrong / total) * 100}%` }} />
                                  <div className="bg-slate-200" style={{ width: `${Math.max(0, (skipped / total)) * 100}%` }} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs shrink-0">
                                  <span className="font-semibold text-emerald-600">{correct}</span>
                                  <span className="font-semibold text-red-500">{wrong}</span>
                                  <span className="text-slate-400">{skipped}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded text-xs font-black" style={{ background: verdictBg, color: verdictColor }}>
                                {verdict}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* QUESTION REVIEW */}
            {activeTab === 'review' && (
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-black text-slate-900 mb-1">Question Review</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {result?.questions?.length
                    ? `${result.questions.length} question${result.questions.length !== 1 ? 's' : ''} reviewed`
                    : 'Section-level summary'}
                </p>
                {result?.questions && result.questions.length > 0 ? (
                  <div className="space-y-4">
                    {result.questions.map((q, idx) => (
                      <div key={`${q.question_id}-${idx}`} className={`rounded-xl border-2 overflow-hidden ${q.is_correct ? 'border-emerald-300' : 'border-red-300'}`}>
                        <div className={`flex items-center justify-between px-5 py-3 ${q.is_correct ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          <div className="flex items-center gap-2">
                            {q.is_correct
                              ? <CheckCircle size={16} className="text-emerald-600" />
                              : <span className="text-red-500 font-bold text-base leading-none">✗</span>}
                            <span className={`text-sm font-bold ${q.is_correct ? 'text-emerald-700' : 'text-red-600'}`}>
                              Q{idx + 1} — {q.is_correct ? 'Correct' : 'Incorrect'}
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
                                const isCorrect   = opt === q.correct_answer;
                                const isUserWrong = opt === q.user_answer && !q.is_correct;
                                return (
                                  <div key={oi} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold' : isUserWrong ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                                    {isCorrect   && <CheckCircle size={13} className="text-emerald-600 shrink-0" />}
                                    {isUserWrong && <span className="text-red-500 font-bold shrink-0">✗</span>}
                                    {!isCorrect && !isUserWrong && <span className="w-3.5 shrink-0" />}
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold uppercase tracking-wide">Your answer: </span>
                              <span className={`font-bold ${q.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>{q.user_answer || '(not answered)'}</span>
                            </div>
                            {!q.is_correct && (
                              <div>
                                <span className="text-slate-400 font-semibold uppercase tracking-wide">Correct: </span>
                                <span className="font-bold text-emerald-600">{q.correct_answer}</span>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => {
                      const pct = section.accuracy ?? 0;
                      const pass = pct >= 30;
                      const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-[#2557a7]' : 'bg-red-500';
                      return (
                        <div key={section.name} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              {(() => { const Icon = sectionIconMap[section.name] ?? Brain; return <Icon size={16} className="text-[#2557a7]" />; })()}
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

            {/* WEAK AREAS */}
            {activeTab === 'weak-areas' && (
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-black text-slate-900 mb-6">Topics Needing Practice</h3>
                {weakAreas?.weak_areas && Array.isArray(weakAreas.weak_areas) && weakAreas.weak_areas.length > 0 ? (
                  <div className="space-y-3">
                    {weakAreas.weak_areas.map((area, idx) => {
                      const acc = typeof area.accuracy === 'number' ? area.accuracy : 0;
                      return (
                        <div key={idx} className="border border-red-200 bg-red-50 rounded-xl p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-0.5">{area.topic || 'Unknown Topic'}</h4>
                              <p className="text-sm text-slate-500">{area.suggestion || 'Continue practicing this area'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-2xl font-black text-red-600">{acc}%</div>
                              <div className="text-xs text-slate-400">Accuracy</div>
                            </div>
                          </div>
                          <div className="w-full bg-red-200 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${acc}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Trophy size={32} className="mx-auto mb-3 text-emerald-500" />
                    <p className="font-semibold text-emerald-700 mb-1">No weak areas identified</p>
                    <p className="text-sm text-emerald-600">Great performance across all topics!</p>
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-black text-slate-900 mb-6">
                  Leaderboard
                  {leaderboard?.period && <span className="text-slate-400 font-medium text-sm ml-2">({leaderboard.period})</span>}
                </h3>
                {leaderboard && typeof leaderboard.your_rank === 'number' && (
                  <div className="rounded-xl p-5 mb-6 grid grid-cols-3 gap-4" style={{ background: '#2557a7' }}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Rank</p>
                      <p className="text-3xl font-black text-white">#{leaderboard.your_rank}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Score</p>
                      <p className="text-3xl font-black text-white">{leaderboard.your_score ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Participants</p>
                      <p className="text-3xl font-black text-white">{leaderboard.total_participants ?? 0}</p>
                    </div>
                  </div>
                )}
                {leaderboard?.entries && leaderboard.entries.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">Rank</th>
                          <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">Name</th>
                          <th className="text-right py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">Score</th>
                          <th className="text-right py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">Accuracy</th>
                          <th className="text-right py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">Tests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.entries.map((entry, idx) => (
                          <tr key={idx} className={`border-b border-slate-100 transition ${entry.rank === leaderboard.your_rank ? 'bg-[#eef3ff]' : 'hover:bg-slate-50'}`}>
                            <td className="py-3 px-4">
                              {entry.rank && entry.rank <= 3
                                ? <span className="text-lg">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                                : <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">{entry.rank}</span>}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{entry.name || '—'}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">{entry.score ?? 0}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">{entry.accuracy ?? 0}%</span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500">{entry.tests_completed ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No leaderboard data available yet.</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>

          {/* ── Bottom grid: Recommended drills + Leaderboard preview ──── */}
          {activeTab === 'analysis' && (
            <div className="grid grid-cols-2 gap-4">

              {/* Recommended drills */}
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-900">Recommended drills</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Focus on your weakest sections first.</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {(result?.improvements?.length
                    ? result.improvements
                    : sections.filter(s => (s.accuracy ?? 0) < 70).map(s => `${s.name} — practice ${s.name.toLowerCase()} problems (${s.total ?? 10} questions)`)
                  ).slice(0, 4).map((drill, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-black shrink-0" style={{ color: 'rgba(0,0,0,0.2)' }}>{String(idx + 1).padStart(2, '0')}</span>
                        <p className="text-sm font-semibold text-slate-900 truncate">{drill}</p>
                      </div>
                      <button className="text-xs font-black px-3 py-1 rounded-lg shrink-0 ml-2 transition" style={{ background: '#eef3ff', color: '#2557a7' }}>
                        START →
                      </button>
                    </div>
                  ))}
                  {!result?.improvements?.length && sections.filter(s => (s.accuracy ?? 0) < 70).length === 0 && (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">No drills needed — great performance!</div>
                  )}
                </div>
              </div>

              {/* Leaderboard preview */}
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">Leaderboard · {testInfo.name}</h3>
                  {leaderboard?.your_rank && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: '#eef3ff', color: '#2557a7' }}>
                      You ranked #{leaderboard.your_rank} — top {percentile ?? '—'}%
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50">
                  {(leaderboard?.entries ?? []).slice(0, 5).map((entry, idx) => (
                    <div key={idx} className={`flex items-center justify-between px-5 py-3 transition ${entry.rank === leaderboard?.your_rank ? 'bg-[#eef3ff]' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black w-6 text-center" style={{ color: (entry.rank ?? idx + 1) <= 3 ? '#2557a7' : 'rgba(0,0,0,0.2)' }}>
                          {String(entry.rank ?? idx + 1).padStart(2, '0')}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{entry.name || '—'}</p>
                        {entry.rank === leaderboard?.your_rank && (
                          <span className="text-xs font-black" style={{ color: '#2557a7' }}>YOU</span>
                        )}
                      </div>
                      <span className="font-black text-slate-900 text-sm">{entry.score ?? 0}</span>
                    </div>
                  ))}
                  {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                    <div className="text-center py-8 text-slate-400 text-sm">No leaderboard data yet.</div>
                  )}
                </div>
                {leaderboard?.entries && leaderboard.entries.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100">
                    <button onClick={() => setActiveTab('leaderboard')} className="text-xs font-black" style={{ color: '#2557a7' }}>
                      View full leaderboard →
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* History (shown in analysis view) */}
          {activeTab === 'analysis' && history.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900">Test History</h3>
                <button onClick={() => router.push('/mock-test/history')} className="text-xs font-black" style={{ color: '#2557a7' }}>View all →</button>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <div className="w-4 h-4 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Loading…</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left py-3 px-5 text-slate-400 font-semibold text-xs uppercase tracking-wide">Company</th>
                        <th className="text-left py-3 px-5 text-slate-400 font-semibold text-xs uppercase tracking-wide">Score</th>
                        <th className="text-left py-3 px-5 text-slate-400 font-semibold text-xs uppercase tracking-wide">Accuracy</th>
                        <th className="text-left py-3 px-5 text-slate-400 font-semibold text-xs uppercase tracking-wide">Grade</th>
                        <th className="text-left py-3 px-5 text-slate-400 font-semibold text-xs uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 5).map((record, idx) => (
                        <tr key={`${record.session_id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">{record.company_name}</td>
                          <td className="py-3.5 px-5 text-slate-600">{record.score}/{record.total}</td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-1.5 bg-[#2557a7] rounded-full" style={{ width: `${record.accuracy}%` }} />
                              </div>
                              <span className="text-slate-600 text-xs font-semibold">{record.accuracy}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              record.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                              record.grade === 'B' ? 'bg-[#eef3ff] text-[#2557a7]' :
                              record.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-600'
                            }`}>{record.grade}</span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 text-xs">
                            {new Date(record.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Right sidebar — SECTIONS OF REPORT ──────────────────────────── */}
        <div className="w-52 shrink-0 border-l bg-white" style={{ borderColor: '#e5e7eb' }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: '#f3f4f6' }}>
            <p className="text-xs font-black tracking-widest" style={{ color: 'rgba(0,0,0,0.3)' }}>SECTIONS OF REPORT</p>
          </div>
          <div className="p-2">
            {([
              { id: 'analysis',    label: 'SECTION SCORES',     badge: null },
              { id: 'review',      label: 'QUESTION REVIEW',    badge: result?.questions?.length ?? null },
              { id: 'weak-areas',  label: 'WEAK TOPICS',        badge: weakAreas?.weak_areas?.length ?? null },
              { id: 'leaderboard', label: 'LEADERBOARD',        badge: leaderboard?.your_rank ? `#${leaderboard.your_rank}` : null },
            ] as { id: TabId; label: string; badge: string | number | null }[]).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left mb-0.5 transition"
                style={{
                  background: activeTab === item.id ? '#eef3ff' : 'transparent',
                  color:      activeTab === item.id ? '#2557a7' : 'rgba(0,0,0,0.45)',
                }}
              >
                <span className="text-xs font-black tracking-wide">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="text-xs font-semibold" style={{ color: activeTab === item.id ? '#2557a7' : 'rgba(0,0,0,0.3)' }}>
                    ({item.badge})
                  </span>
                )}
              </button>
            ))}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left mb-0.5 transition"
              style={{ color: 'rgba(0,0,0,0.45)' }}
              onClick={() => setActiveTab('analysis')}
            >
              <span className="text-xs font-black tracking-wide">RECOMMENDED DRILLS</span>
            </button>
          </div>

          {/* Progress analytics in sidebar */}
          {progressAnalytics && (
            <div className="px-4 py-4 border-t" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-xs font-black tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.3)' }}>YOUR PROGRESS</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Tests</span>
                  <span className="text-xs font-black text-slate-900">{progressAnalytics.total_tests ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Avg Score</span>
                  <span className="text-xs font-black" style={{ color: '#2557a7' }}>{avgAcc}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Trend</span>
                  <span className="text-xs font-black flex items-center gap-1">
                    {progressAnalytics.improvement_trend === 'improving'
                      ? <><TrendingUp size={10} className="text-emerald-500" /><span className="text-emerald-600">Up</span></>
                      : progressAnalytics.improvement_trend === 'declining'
                      ? <><TrendingDown size={10} className="text-red-500" /><span className="text-red-500">Down</span></>
                      : <><Minus size={10} className="text-slate-400" /><span className="text-slate-500">Stable</span></>
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: '#f3f4f6' }}>
            <button
              onClick={() => router.push(`/mock-test/company/${testId}`)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-xs font-black rounded-lg hover:bg-slate-50 transition"
              style={{ color: '#2d2d2d' }}
            >
              <RotateCcw size={10} /> RETAKE TEST
            </button>
            <button
              onClick={() => router.push('/mock-test')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-white text-xs font-black rounded-lg hover:opacity-90 transition"
              style={{ background: '#2557a7' }}
            >
              TRY ANOTHER <ChevronRight size={10} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
