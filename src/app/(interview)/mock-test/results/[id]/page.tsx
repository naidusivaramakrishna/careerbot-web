'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { History, Brain, BookOpen, Calculator, TrendingUp, TrendingDown, Minus, Trophy, Target, BarChart3, ChevronRight, RotateCcw, ArrowLeft, CheckCircle } from 'lucide-react';
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

const gradeConfig: Record<string, { color: string; bg: string; ring: string; label: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500', ring: '#10b981', label: 'Excellent' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500',    ring: '#3b82f6', label: 'Good'      },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500',  ring: '#f59e0b', label: 'Average'   },
  D: { color: 'text-orange-400',  bg: 'bg-orange-500',  ring: '#f97316', label: 'Below Avg' },
  F: { color: 'text-red-400',     bg: 'bg-red-500',     ring: '#ef4444', label: 'Poor'      },
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
        if (!parentSessionId) {
          setError('No parent session ID provided');
          setLoading(false);
          return;
        }

        const result = await getParentSessionResult(parentSessionId);
        const secs = result.sections ?? [];

        if (!result.strengths?.length && secs.length > 0) {
          result.strengths = secs
            .filter((s: any) => s.accuracy >= 70)
            .map((s: any) => `${s.name}: ${s.accuracy}% accuracy`);
        }

        if (!result.improvements?.length && secs.length > 0) {
          result.improvements = secs
            .filter((s: any) => s.accuracy < 60)
            .map((s: any) => `${s.name}: ${s.accuracy}% accuracy — needs more practice`);
        }

        setResult(result);
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Failed to load test results');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [parentSessionId, refreshKey]);

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        const data = await getWeakAreasAnalytics();
        setWeakAreas(data);
      } catch { }
    };
    fetchWeakAreas();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch { }
    };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getMockTestHistory();
        setHistory(data);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchProgressAnalytics = async () => {
      try {
        const data = await getProgressAnalytics();
        setProgressAnalytics(data);
      } catch { }
    };
    fetchProgressAnalytics();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const fetchMetadata = async () => {
      try {
        const metadata = await getSessionById(sessionId);
        setSessionMetadata(metadata);
      } catch { }
    };
    fetchMetadata();
  }, [sessionId]);

  const totalScore = result?.total_score ?? 0;
  const totalQuestions = result?.total_questions ?? 0;
  const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const circumference = 2 * Math.PI * 52;
  const progressOffset = circumference - (accuracy / 100) * circumference;

  const sections = result?.sections ?? [];
  const grade = result?.grade ?? 'F';
  const gc = gradeConfig[grade] ?? gradeConfig['F'];

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'analysis',   label: 'Analysis',   icon: BarChart3 },
    { id: 'review',     label: 'Review',     icon: BookOpen  },
    { id: 'weak-areas', label: 'Weak Areas', icon: Target    },
    { id: 'leaderboard',label: 'Leaderboard',icon: Trophy    },
  ];

  const getPerformanceFeedback = () => {
    if (!result) return { message: '', subtitle: '' };
    switch (result.grade) {
      case 'A': return { message: 'Outstanding Performance', subtitle: 'You are in the top tier. Keep it up!' };
      case 'B': return { message: 'Great Job', subtitle: 'Very strong result — just a bit more to reach the top.' };
      case 'C': return { message: 'Good Effort', subtitle: 'On the right track. Focus on weak areas to improve.' };
      case 'D': return { message: 'Keep Practicing', subtitle: 'Review the concepts and retake the test.' };
      default:  return { message: 'Needs Improvement', subtitle: 'Regular practice on core concepts will help.' };
    }
  };

  const feedback = getPerformanceFeedback();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full bg-slate-950 min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="w-14 h-14 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-semibold text-lg">Calculating your results…</p>
        <p className="text-slate-400 text-sm">Fetching scores from all sections</p>
        <p className="text-slate-500 text-xs mt-2">This may take up to 20 seconds</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full bg-slate-950 min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Results</h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#2557a7] text-white font-semibold rounded-xl hover:bg-[#1a3d73] transition">
              Retry
            </button>
            <button onClick={() => router.push('/mock-test')} className="px-6 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition">
              ← Back to Mock Tests
            </button>
          </div>
          <p className="mt-6 text-xs text-slate-500">Results may still be processing. Try refreshing in a few seconds.</p>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#f0f4f8] min-h-screen">

      {/* ── Dev Debug Banner ──────────────────────────────────────────────── */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
          <p className="text-xs font-mono text-amber-800">
            DEBUG | session={sessionId} | score={result?.total_score}/{result?.total_questions} | grade={result?.grade} | sections={sections.length}
          </p>
        </div>
      )}

      {/* ── Processing Banner — shown when results loaded but score is still 0 ── */}
      {result && totalScore === 0 && sections.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Scores may still be processing. If your score looks incorrect, click Refresh.
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); setRefreshKey(k => k + 1); }}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
          >
            Refresh Results
          </button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0f2044] to-slate-900 px-6 md:px-10 pt-8 pb-0">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/mock-test')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition"
          >
            <ArrowLeft size={16} />
            Mock Tests
          </button>
          <button
            onClick={() => router.push('/mock-test/history')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition"
          >
            <History size={15} />
            Test History
          </button>
        </div>

        {/* Company + Title */}
        <div className="flex items-center gap-4 mb-8">
          {testInfo.logoPath && (
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src={testInfo.logoPath} alt={testInfo.name} className="h-7 object-contain" />
            </div>
          )}
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-0.5">{testInfo.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Mock Test Results</h1>
          </div>
        </div>

        {/* Score Row */}
        <div className="flex flex-col md:flex-row md:items-end gap-8 pb-8">

          {/* Circular gauge */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke={gc.ring}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="white">{accuracy}%</text>
                <text x="60" y="72" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">Accuracy</text>
              </svg>
              {/* Grade badge */}
              <div className={`absolute -top-1 -right-1 w-8 h-8 ${gc.bg} rounded-full flex items-center justify-center shadow-lg`}>
                <span className="text-white text-xs font-black">{grade}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Score</p>
              <p className="text-5xl font-black text-white leading-none">
                {totalScore}
                <span className="text-2xl text-slate-400 font-semibold">/{totalQuestions}</span>
              </p>
              <p className={`text-sm font-semibold mt-2 ${gc.color}`}>{gc.label}</p>
            </div>
          </div>

          {/* Feedback + Stats */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{feedback.message}</h2>
            <p className="text-slate-400 text-sm mb-5">{feedback.subtitle}</p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-3">
              {sections.map(s => (
                <div key={s.name} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  {(() => { const Icon = sectionIconMap[s.name] ?? Brain; return <Icon size={15} className="text-slate-400" />; })()}
                  <div>
                    <p className="text-white text-xs font-semibold leading-none mb-0.5">{s.name}</p>
                    <p className="text-slate-400 text-xs">{s.score}/{s.total} · {s.accuracy}%</p>
                  </div>
                </div>
              ))}
              {sessionMetadata?.created_at && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                  <p className="text-slate-400 text-xs mb-0.5">Submitted</p>
                  <p className="text-white text-xs font-semibold">
                    {new Date(sessionMetadata.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#2557a7] text-white bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 py-8 space-y-6">

        {/* ── Progress Analytics ──────────────────────────────────────────── */}
        {progressAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-6 gap-3"
          >
            {[
              { label: 'Total Tests',    value: progressAnalytics.total_tests ?? 0,         color: 'text-slate-900' },
              { label: 'Avg Score',      value: typeof progressAnalytics.average_score === 'number' && progressAnalytics.average_score > 0 ? progressAnalytics.average_score.toFixed(1) : (progressAnalytics.average_score === 0 ? '0.0' : '—'), color: 'text-[#2557a7]' },
              { label: 'Avg Accuracy',   value: typeof progressAnalytics.average_accuracy === 'number' ? progressAnalytics.average_accuracy.toFixed(1) + '%' : (typeof progressAnalytics.average_score === 'number' && progressAnalytics.average_score > 0 ? progressAnalytics.average_score.toFixed(1) + '%' : '—'), color: 'text-emerald-600' },
              { label: 'Best Score',     value: progressAnalytics.best_score ?? 0,           color: 'text-purple-600' },
              { label: 'Overall Grade',  value: progressAnalytics.overall_grade ?? 'N/A',    color: 'text-slate-900' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              </div>
            ))}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Trend</p>
              {progressAnalytics.improvement_trend === 'improving' && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <TrendingUp size={16} /> Improving
                </div>
              )}
              {progressAnalytics.improvement_trend === 'declining' && (
                <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm">
                  <TrendingDown size={16} /> Declining
                </div>
              )}
              {(!progressAnalytics.improvement_trend || progressAnalytics.improvement_trend === 'stable') && (
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                  <Minus size={16} /> Stable
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Tab Content ─────────────────────────────────────────────────── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 md:p-8">

            {/* ── Analysis ─────────────────────────────────────────────── */}
            {activeTab === 'analysis' && (
              <div>
                {sections.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-500">Section breakdown unavailable</p>
                    <p className="text-sm mt-1">The server did not return section scores for this session.</p>
                  </div>
                ) : (
                  <>
                    {/* Section Cards Grid */}
                    <h3 className="text-base font-bold text-slate-800 mb-5">Section Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {sections.map((section) => {
                        const Icon = sectionIconMap[section.name] ?? Brain;
                        const pct = section.accuracy ?? 0;
                        const pass = pct >= 30;
                        const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-[#2557a7]' : 'bg-red-500';
                        return (
                          <div key={section.name} className="border border-slate-200 rounded-xl p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <Icon size={18} className="text-[#2557a7]" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{section.name}</p>
                                  {section.difficulty && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      section.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                      section.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>{section.difficulty}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                {pass ? 'Pass' : 'Fail'}
                              </span>
                            </div>

                            {/* Score */}
                            <div className="flex items-end gap-2 mb-3">
                              <span className="text-3xl font-black text-slate-900">{section.score}</span>
                              <span className="text-slate-400 font-medium mb-0.5">/ {section.total} correct</span>
                              {section.time && <span className="text-xs text-slate-400 ml-auto mb-0.5">{section.time}</span>}
                            </div>

                            {/* Correct / Wrong / Skipped mini stats */}
                            <div className="flex gap-3 mb-3">
                              <span className="text-xs font-semibold text-emerald-600">✓ {section.correct ?? section.score} correct</span>
                              <span className="text-xs font-semibold text-red-500">✗ {section.wrong ?? 0} wrong</span>
                              <span className="text-xs font-semibold text-slate-400">— {section.skipped ?? (section.total - section.score)} skipped</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">{pct}% accuracy</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Total Questions</p>
                        <p className="text-xl font-black text-slate-900">{totalQuestions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Correct</p>
                        <p className="text-xl font-black text-emerald-600">{totalScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Incorrect / Skipped</p>
                        <p className="text-xl font-black text-red-500">{totalQuestions - totalScore}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Question Review ───────────────────────────────────────── */}
            {activeTab === 'review' && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Question Review</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {result?.questions?.length
                    ? `${result.questions.length} question${result.questions.length !== 1 ? 's' : ''} reviewed`
                    : 'Section-level summary'}
                </p>

                {result?.questions && result.questions.length > 0 ? (
                  <div className="space-y-4">
                    {result.questions.map((q, idx) => (
                      <div
                        key={`${q.question_id}-${idx}`}
                        className={`rounded-xl border-2 overflow-hidden ${
                          q.is_correct ? 'border-emerald-300' : 'border-red-300'
                        }`}
                      >
                        {/* Question header */}
                        <div className={`flex items-center justify-between px-5 py-3 ${
                          q.is_correct ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            {q.is_correct
                              ? <CheckCircle size={16} className="text-emerald-600" />
                              : <span className="text-red-500 font-bold text-base leading-none">✗</span>
                            }
                            <span className={`text-sm font-bold ${q.is_correct ? 'text-emerald-700' : 'text-red-600'}`}>
                              Q{idx + 1} — {q.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {q.difficulty && (
                              <span className={`font-semibold px-2 py-0.5 rounded-full ${
                                q.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{q.difficulty}</span>
                            )}
                            {q.time_taken_seconds != null && <span>{q.time_taken_seconds}s</span>}
                          </div>
                        </div>

                        <div className="px-5 py-4 bg-white space-y-4">
                          {/* Question text */}
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.question_text}</p>

                          {/* Options */}
                          {q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt, oi) => {
                                const isCorrect = opt === q.correct_answer;
                                const isUserWrong = opt === q.user_answer && !q.is_correct;
                                return (
                                  <div
                                    key={oi}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${
                                      isCorrect
                                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold'
                                        : isUserWrong
                                        ? 'border-red-300 bg-red-50 text-red-700'
                                        : 'border-slate-100 bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    {isCorrect && <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />}
                                    {isUserWrong && <span className="text-red-500 font-bold flex-shrink-0">✗</span>}
                                    {!isCorrect && !isUserWrong && <span className="w-3.5 flex-shrink-0" />}
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Answer row */}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold uppercase tracking-wide">Your answer: </span>
                              <span className={`font-bold ${q.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                                {q.user_answer || '(not answered)'}
                              </span>
                            </div>
                            {!q.is_correct && (
                              <div>
                                <span className="text-slate-400 font-semibold uppercase tracking-wide">Correct: </span>
                                <span className="font-bold text-emerald-600">{q.correct_answer}</span>
                              </div>
                            )}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Explanation</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}

                          {/* Solution steps */}
                          {q.solution_steps && q.solution_steps.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Solution Steps</p>
                              <ol className="space-y-1.5">
                                {q.solution_steps.map((step, si) => (
                                  <li key={si} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex-shrink-0 flex items-center justify-center mt-0.5">{si + 1}</span>
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
                  /* Fallback: section-level summary when no question data */
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

            {/* ── Weak Areas ────────────────────────────────────────────── */}
            {activeTab === 'weak-areas' && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-6">Topics Needing Practice</h3>
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
                            <div className="text-right flex-shrink-0">
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

            {/* ── Leaderboard ───────────────────────────────────────────── */}
            {activeTab === 'leaderboard' && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-6">
                  Leaderboard {leaderboard?.period && <span className="text-slate-400 font-medium text-sm ml-2">({leaderboard.period})</span>}
                </h3>

                {leaderboard && typeof leaderboard.your_rank === 'number' && (
                  <div className="bg-gradient-to-r from-[#2557a7] to-[#1a3d73] rounded-xl p-5 mb-6 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Your Rank</p>
                      <p className="text-3xl font-black text-white">#{leaderboard.your_rank}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Your Score</p>
                      <p className="text-3xl font-black text-white">{leaderboard.your_score ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Participants</p>
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
                          <tr key={idx} className={`border-b border-slate-100 transition ${entry.rank === leaderboard.your_rank ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {entry.rank && entry.rank <= 3 ? (
                                  <span className="text-lg">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">{entry.rank}</span>
                                )}
                              </div>
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

          </div>
        </motion.div>

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/mock-test/company/${testId}`)}
            className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-white hover:border-slate-400 transition text-sm"
          >
            <RotateCcw size={15} />
            Retake Test
          </button>
          <button
            onClick={() => router.push('/mock-test')}
            className="flex items-center gap-2 px-6 py-3 bg-[#2557a7] hover:bg-[#1a3d73] text-white font-semibold rounded-xl transition text-sm"
          >
            Try Another Test
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── Test History ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <History size={18} className="text-[#2557a7]" />
            <h2 className="font-bold text-slate-900">Test History</h2>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <div className="w-5 h-5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">No test history yet.</p>
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
                  {history.map((record, idx) => (
                    <tr key={`${record.session_id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{record.company_name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{record.score}/{record.total}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-[#2557a7] rounded-full"
                              style={{ width: `${record.accuracy}%` }}
                            />
                          </div>
                          <span className="text-slate-600 text-xs font-semibold">{record.accuracy}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          record.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          record.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          record.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {record.grade}
                        </span>
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
        </motion.div>

      </div>
    </div>
  );
}
