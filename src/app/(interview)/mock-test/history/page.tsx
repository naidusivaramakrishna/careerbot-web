'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, ChevronRight, Eye, RotateCcw, MoreVertical, TrendingUp, TrendingDown, Minus, History as HistoryIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMockTestHistory, getProgressAnalytics, HistoryRecord, ProgressAnalytics } from '@/api/mockTestApi';
import LoadingScreen from '../_components/LoadingScreen';
import HighlightBox from '../_components/HighlightBox';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface TestHistory {
  id: string;
  sessionId: string;
  testName: string;
  score: number;
  total: number;
  accuracy: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  date: string;
  time: string;
}

const mapGrade = (grade: string): TestHistory['grade'] => {
  if (grade === 'A' || grade === 'Excellent') return 'Excellent';
  if (grade === 'B' || grade === 'Good') return 'Good';
  if (grade === 'C' || grade === 'Average') return 'Average';
  return 'Needs Improvement';
};

const formatDateTime = (isoString: string) => {
  const utcString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
  const d = new Date(utcString);
  if (isNaN(d.getTime())) return { date: isoString, time: '' };
  const date = d.toLocaleDateString('en-GB').split('/').join('-');
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

const mapRecord = (r: HistoryRecord, i: number): TestHistory => {
  const { date, time } = formatDateTime(r.submitted_at);
  return {
    id: r.company_id ?? String(i + 1),
    sessionId: r.session_id,
    testName: r.company_name,
    score: r.score,
    total: r.total,
    accuracy: r.accuracy,
    grade: mapGrade(r.grade),
    date,
    time,
  };
};

const gradeConfig = (grade: TestHistory['grade']) => {
  switch (grade) {
    case 'Excellent':        return { bg: '#dcfce7', text: '#15803d', label: 'A', dot: '#22c55e' };
    case 'Good':             return { bg: '#dbeafe', text: '#1e3a8a', label: 'B', dot: '#3b82f6' };
    case 'Average':          return { bg: '#fef3c7', text: '#92400e', label: 'C', dot: '#f59e0b' };
    default:                 return { bg: '#fee2e2', text: '#991b1b', label: 'D', dot: '#ef4444' };
  }
};

const filterOptions = ['All Results', 'Excellent', 'Good', 'Average', 'Needs Improvement'] as const;
type FilterOption = typeof filterOptions[number];

interface ChartDataPoint {
  name: string;
  score: number;
  grade: string;
  testName: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataPoint }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-bold text-slate-900 mb-1">{payload[0].payload.testName}</p>
        <p className="text-slate-500">{label}</p>
        <p className="font-bold mt-1" style={{ color: '#1e3a8a' }}>{payload[0].value}% score</p>
        <p className="text-slate-500 text-xs">{payload[0].payload.grade}</p>
      </div>
    );
  }
  return null;
};

export default function MockTestHistoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('All Results');
  const [sortLatest, setSortLatest] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<TestHistory[]>([]);
  const [progress, setProgress] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const records = await getMockTestHistory();
        setHistoryData(records.map(mapRecord));
      } catch {
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchProgress = async () => {
      try {
        const data = await getProgressAnalytics();
        setProgress(data);
      } catch {
        // silent
      }
    };

    fetchHistory();
    fetchProgress();

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchHistory();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = historyData
    .filter(t => {
      const matchSearch = t.testName.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'All Results' || t.grade === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date.split('-').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('-').reverse().join('-')).getTime();
      return sortLatest ? dateB - dateA : dateA - dateB;
    });

  const chartData: ChartDataPoint[] = useMemo(() => {
    return [...historyData]
      .sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('-').reverse().join('-')).getTime();
        return dateA - dateB;
      })
      .map(t => ({
        name: t.date,
        score: t.accuracy,
        grade: t.grade,
        testName: t.testName,
      }));
  }, [historyData]);

  const averageScore = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);
  }, [chartData]);

  const showChart = chartData.length >= 2;

  const trendIcon = () => {
    if (!progress) return null;
    if (progress.improvement_trend === 'improving') return <TrendingUp size={12} style={{ color: '#15803d' }} />;
    if (progress.improvement_trend === 'declining') return <TrendingDown size={12} style={{ color: '#dc2626' }} />;
    return <Minus size={12} style={{ color: '#64748B' }} />;
  };

  const trendLabel = () => {
    if (!progress) return '—';
    if (progress.improvement_trend === 'improving') return 'Improving';
    if (progress.improvement_trend === 'declining') return 'Declining';
    return 'Stable';
  };

  const trendColor = () => {
    if (!progress) return '#94A3B8';
    if (progress.improvement_trend === 'improving') return '#15803d';
    if (progress.improvement_trend === 'declining') return '#dc2626';
    return '#475569';
  };

  if (loading && historyData.length === 0) return <LoadingScreen label="Loading history" />;

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>History</span>
        </div>

        {/* Main card — section-intro DNA */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-7">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ borderColor: '#E5E7EB', background: '#F8FAFC' }}>
              <HistoryIcon size={22} style={{ color: '#1e3a8a' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                Test History
              </h2>
              <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                Track your performance over time and monitor your growth across every attempt.
              </p>
            </div>
          </div>

          <HighlightBox>
            <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
              {progress?.total_tests
                ? <>You&apos;ve completed{' '}
                    <span className="font-bold" style={{ color: '#1e3a8a' }}>{progress.total_tests}</span>{' '}
                    {progress.total_tests === 1 ? 'test' : 'tests'} so far · Overall grade{' '}
                    <span className="font-bold" style={{ color: '#0F172A' }}>{progress.overall_grade ?? '—'}</span>
                  </>
                : 'Take your first test to start tracking your growth.'}
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Tests</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>{progress?.total_tests ?? 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Avg</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>
                  {progress?.average_score != null ? Math.round(progress.average_score) : '—'}
                  <span className="text-base font-bold" style={{ color: '#60a5fa' }}>%</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Best</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>
                  {progress?.best_score != null ? Math.round(progress.best_score) : '—'}
                  <span className="text-base font-bold" style={{ color: '#94A3B8' }}>%</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Trend</p>
                <p className="text-sm font-bold flex items-center gap-1 justify-end" style={{ color: trendColor() }}>
                  {trendIcon()} {trendLabel()}
                </p>
              </div>
            </div>
          </HighlightBox>
        </div>

        {/* Score Progress Chart — secondary card */}
        {showChart && (
          <div
            className="mt-5 bg-white rounded-2xl border overflow-hidden p-6 md:p-8"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
          >
            <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>Score progress</h3>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Accuracy trend across {chartData.length} tests</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold" style={{ color: '#94A3B8' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 rounded inline-block" style={{ background: '#1e3a8a' }} /> Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed inline-block" style={{ borderColor: '#94A3B8' }} /> Avg ({averageScore}%)
                </span>
              </div>
            </div>
            <div className="h-40 md:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: string) => {
                      const parts = val.split('-');
                      return parts.length === 3 ? `${parts[0]}/${parts[1]}` : val;
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={averageScore} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1e3a8a"
                    strokeWidth={2.5}
                    dot={{ fill: '#1e3a8a', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#172554' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* All tests list — secondary card */}
        <div
          className="mt-5 bg-white rounded-2xl border overflow-hidden p-6 md:p-8"
          style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
        >
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>All attempts</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                Showing <span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{filtered.length}</span> of{' '}
                <span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{historyData.length}</span>
              </p>
            </div>
            <button
              onClick={() => setSortLatest(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:bg-slate-50"
              style={{ border: '1px solid #E5E7EB', color: '#475569' }}
            >
              <ChevronDown size={12} className={`transition-transform ${sortLatest ? '' : 'rotate-180'}`} />
              {sortLatest ? 'Latest first' : 'Oldest first'}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-3 pointer-events-none" size={15} style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by test name or company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ border: '1px solid #E5E7EB', color: '#0F172A', ['--tw-ring-color' as string]: '#1e3a8a' } as React.CSSProperties}
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-[10px] font-bold tracking-widest uppercase mr-1" style={{ color: '#94A3B8' }}>Filter</span>
            {filterOptions.map(opt => {
              const isActive = filter === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition"
                  style={isActive
                    ? { background: '#1e3a8a', color: '#fff', border: '1px solid #1e3a8a' }
                    : { background: 'transparent', color: '#475569', border: '1px solid #E5E7EB' }
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Numbered <ol> — mirrors section intro instructions list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl px-5 py-8 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <p className="text-sm" style={{ color: '#475569' }}>
                {historyData.length === 0
                  ? 'No test history yet — take a test to see your progress.'
                  : 'No tests match your search or filter.'}
              </p>
            </div>
          ) : (
            <ol className="space-y-2.5">
              {filtered.map((test, i) => {
                const cfg = gradeConfig(test.grade);
                const accColor = test.accuracy >= 70 ? '#15803d' : test.accuracy >= 50 ? '#b45309' : '#dc2626';
                const menuKey = test.id + i;
                return (
                  <motion.li
                    key={menuKey}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex gap-3 text-[15px] leading-relaxed rounded-xl px-3 py-3 transition hover:bg-slate-50"
                    style={{ border: '1px solid #F1F5F9' }}
                  >
                    <span className="font-semibold tabular-nums shrink-0 w-5 pt-0.5" style={{ color: '#475569' }}>{i + 1}.</span>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-bold truncate" style={{ color: '#000' }}>{test.testName}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                          {test.date} · {test.time} · {test.total} questions
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: cfg.bg, color: cfg.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label} · {test.grade}
                        </span>
                        <span className="font-bold tabular-nums" style={{ color: accColor }}>{test.accuracy}%</span>

                        <div className="relative" ref={openMenu === menuKey ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenu(openMenu === menuKey ? null : menuKey)}
                            className="p-1.5 rounded-full hover:bg-slate-100 transition"
                          >
                            <MoreVertical size={15} style={{ color: '#94A3B8' }} />
                          </button>
                          {openMenu === menuKey && (
                            <div className="absolute right-0 top-9 bg-white border rounded-xl shadow-lg z-50 py-1.5 w-44"
                              style={{ borderColor: '#E5E7EB' }}>
                              <button
                                onClick={() => { router.push(`/mock-test/results/${test.id}${test.sessionId ? `?parentSession=${test.sessionId}` : ''}`); setOpenMenu(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-left hover:bg-slate-50"
                                style={{ color: '#475569' }}
                              >
                                <Eye size={14} style={{ color: '#94A3B8' }} />
                                View result
                              </button>
                              <button
                                onClick={() => { router.push(`/mock-test/${test.id}`); setOpenMenu(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-left hover:bg-slate-50"
                                style={{ color: '#475569' }}
                              >
                                <RotateCcw size={14} style={{ color: '#94A3B8' }} />
                                Retake test
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Bottom action row — section-intro DNA */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/mock-test')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#475569' }}
          >
            ← Back to Tests
          </button>

          <button
            onClick={() => router.push('/mock-test/custom')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)]"
            style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
          >
            Take a Test <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
