'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Eye, RotateCcw, MoreVertical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMockTestHistory, getProgressAnalytics, HistoryRecord, ProgressAnalytics } from '@/api/mockTestApi';
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
    case 'Excellent':        return { bg: '#7c3aed', text: '#fff',    label: 'A' };
    case 'Good':             return { bg: '#16a34a', text: '#fff',    label: 'B' };
    case 'Average':          return { bg: '#d97706', text: '#fff',    label: 'C' };
    default:                 return { bg: '#dc2626', text: '#fff',    label: 'D' };
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
        <p className="font-bold mt-1" style={{ color: '#2557a7' }}>{payload[0].value}% score</p>
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
  const menuRef = useRef<HTMLTableCellElement>(null);

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
    if (progress.improvement_trend === 'improving') return <TrendingUp size={14} className="text-green-400" />;
    if (progress.improvement_trend === 'declining') return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  const trendColor = () => {
    if (!progress) return 'text-slate-300';
    if (progress.improvement_trend === 'improving') return 'text-green-400';
    if (progress.improvement_trend === 'declining') return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="w-full min-h-screen" style={{ background: '#F4F2EC' }}>

      {/* Dark top bar */}
      <div style={{ background: '#111827' }} className="px-8 py-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pt-4 pb-1">
          <button
            onClick={() => router.push('/mock-test')}
            className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-white transition"
          >
            MOCK TESTS
          </button>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-xs font-black tracking-widest uppercase text-white">HISTORY</span>
        </div>

        {/* Title row */}
        <div className="flex items-end justify-between py-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Test History</h1>
            <p className="text-slate-400 text-sm mt-1">Track your performance over time and monitor your growth</p>
          </div>
          {progress && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black tracking-widest uppercase text-slate-400">Overall Grade</span>
              <span
                className="text-sm font-black px-4 py-1.5 rounded-full"
                style={{ background: '#2557a7', color: '#fff' }}
              >
                {progress.overall_grade ?? 'B'}
              </span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-8 py-3 border-t border-white/10">
          {progress ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-slate-500">TESTS TAKEN</span>
                <span className="text-sm font-black text-white">{progress.total_tests}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-slate-500">AVG SCORE</span>
                <span className="text-sm font-black text-white">{progress.average_score}%</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-slate-500">BEST</span>
                <span className="text-sm font-black text-white">{progress.best_score}%</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className={`flex items-center gap-1.5 text-sm font-black ${trendColor()}`}>
                {trendIcon()}
                {progress.improvement_trend === 'improving' ? 'Improving' : progress.improvement_trend === 'declining' ? 'Declining' : 'Stable'}
              </div>
            </>
          ) : (
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="px-8 py-6">

        {/* Score Progress Chart */}
        {showChart && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Score Progress</h2>
                <p className="text-xs text-slate-500 mt-0.5">Accuracy trend across {chartData.length} tests</p>
              </div>
              <div className="flex items-center gap-5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-0.5 rounded inline-block" style={{ background: '#2557a7' }} /> Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 border-t border-dashed border-slate-400 inline-block" /> Avg ({averageScore}%)
                </span>
              </div>
            </div>
            <div className="h-52">
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
                    stroke="#2557a7"
                    strokeWidth={2.5}
                    dot={{ fill: '#2557a7', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#1a3d73' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showChart ? 0.1 : 0 }}
          className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
        >
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by test name or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': '#2557a7' } as React.CSSProperties}
              />
            </div>
            <button
              onClick={() => setSortLatest(p => !p)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ChevronDown size={14} className={`transition-transform ${sortLatest ? '' : 'rotate-180'}`} />
              {sortLatest ? 'Latest First' : 'Oldest First'}
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-widest uppercase text-slate-400 mr-1">Filter</span>
              {filterOptions.map(opt => {
                const isActive = filter === opt;
                const optColor =
                  opt === 'Excellent' ? '#7c3aed'
                  : opt === 'Good' ? '#16a34a'
                  : opt === 'Average' ? '#d97706'
                  : opt === 'Needs Improvement' ? '#dc2626'
                  : '#2557a7';
                return (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className="px-3 py-1 rounded-full text-xs font-black border transition"
                    style={isActive
                      ? { background: optColor, color: '#fff', borderColor: optColor }
                      : { background: 'transparent', color: optColor, borderColor: optColor + '55' }
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-slate-500">
              Showing <span className="font-black text-slate-900">{filtered.length}</span> of <span className="font-black text-slate-900">{historyData.length}</span>
            </span>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showChart ? 0.2 : 0.1 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: '#111827' }}>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Test Name</th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Accuracy</th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Questions</th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Grade</th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Date &amp; Time</th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2557a7', borderTopColor: 'transparent' }} />
                    </div>
                    <p className="text-slate-500 text-sm">Loading test history...</p>
                  </td>
                </tr>
              ) : filtered.map((test, i) => {
                const cfg = gradeConfig(test.grade);
                return (
                  <tr key={`${test.id}-${i}`} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{test.testName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${test.accuracy}%`, background: test.accuracy >= 70 ? '#16a34a' : test.accuracy >= 50 ? '#d97706' : '#dc2626' }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{test.accuracy}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{test.total} Qs</td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label} · {test.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="font-medium">{test.date}</div>
                      <div className="text-slate-400 text-xs">{test.time}</div>
                    </td>
                    <td className="px-6 py-4 relative" ref={openMenu === test.id + i ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenu(openMenu === test.id + i ? null : test.id + i)}
                        className="p-2 rounded-full hover:bg-slate-100 transition"
                      >
                        <MoreVertical size={16} className="text-slate-500" />
                      </button>
                      {openMenu === test.id + i && (
                        <div className="absolute right-6 top-12 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 w-48">
                          <button
                            onClick={() => { router.push(`/mock-test/results/${test.id}${test.sessionId ? `?parentSession=${test.sessionId}` : ''}`); setOpenMenu(null); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={15} className="text-slate-500" />
                            View Result
                          </button>
                          <button
                            onClick={() => { router.push(`/mock-test/${test.id}`); setOpenMenu(null); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <RotateCcw size={15} className="text-slate-500" />
                            Retake Test
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-400 text-sm">
                    No tests found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
