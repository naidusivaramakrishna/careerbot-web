'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, ChevronDown, Eye, RotateCcw, MoreVertical } from 'lucide-react';
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

const fallbackHistory: TestHistory[] = [
  { id: '1', sessionId: '', testName: 'TCS Mock-Test',        score: 36, total: 50, accuracy: 72,  grade: 'Good',      date: '03-02-2026', time: '11:00 AM' },
  { id: '2', sessionId: '', testName: 'Infosys Mock-Test',    score: 26, total: 50, accuracy: 61,  grade: 'Average',   date: '03-02-2026', time: '10:00 AM' },
  { id: '3', sessionId: '', testName: 'TCS Mock-Test',        score: 42, total: 50, accuracy: 82,  grade: 'Good',      date: '03-02-2026', time: '02:00 PM' },
  { id: '4', sessionId: '', testName: 'Cognizant Mock-Test',  score: 40, total: 50, accuracy: 80,  grade: 'Good',      date: '04-02-2026', time: '10:00 AM' },
  { id: '5', sessionId: '', testName: 'Accenture Mock-Test',  score: 50, total: 50, accuracy: 100, grade: 'Excellent', date: '05-02-2026', time: '11:00 AM' },
  { id: '6', sessionId: '', testName: 'Wipro NLTH Mock-Test', score: 40, total: 50, accuracy: 80,  grade: 'Good',      date: '06-02-2026', time: '11:00 AM' },
];

const mapGrade = (grade: string): TestHistory['grade'] => {
  // Backend returns letter grades (A, B, C, D, F)
  // Map to display grades
  if (grade === 'A' || grade === 'Excellent') return 'Excellent';
  if (grade === 'B' || grade === 'Good') return 'Good';
  if (grade === 'C' || grade === 'Average') return 'Average';
  return 'Needs Improvement'; // D, F, or unknown
};

const formatDateTime = (isoString: string) => {
  const d = new Date(isoString);
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

const gradeBadge = (grade: TestHistory['grade']) => {
  switch (grade) {
    case 'Excellent':        return { bg: 'bg-purple-600', text: 'text-white',    emoji: '🥇' };
    case 'Good':             return { bg: 'bg-green-500',  text: 'text-white',    emoji: '🏅' };
    case 'Average':          return { bg: 'bg-gray-300',   text: 'text-gray-800', emoji: '🥉' };
    default:                 return { bg: 'bg-red-100',    text: 'text-red-700',  emoji: '⚠️' };
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
        <p className="text-[#2557a7] font-bold mt-1">{payload[0].value}% score</p>
        <p className="text-slate-500 text-xs">{payload[0].payload.grade}</p>
      </div>
    );
  }
  return null;
};

// Aggregate sessions from the same test (same company, within 5 minutes)
const aggregateTestSessions = (history: TestHistory[]): TestHistory[] => {
  if (history.length === 0) return [];

  const aggregated: TestHistory[] = [];
  let currentGroup: TestHistory[] = [];

  for (let i = 0; i < history.length; i++) {
    const current = history[i];

    if (currentGroup.length === 0) {
      currentGroup.push(current);
    } else {
      const lastInGroup = currentGroup[currentGroup.length - 1];

      // Check if same company and within 5 minutes
      const currentDate = new Date(current.date.split('-').reverse().join('-'));
      const lastDate = new Date(lastInGroup.date.split('-').reverse().join('-'));
      const timeDiffMinutes = (lastDate.getTime() - currentDate.getTime()) / (1000 * 60);

      if (
        current.testName === lastInGroup.testName &&
        Math.abs(timeDiffMinutes) <= 5 &&
        currentGroup.length < 4
      ) {
        // Same test, add to group
        currentGroup.push(current);
      } else {
        // Different test or timeout, finalize current group
        if (currentGroup.length > 1) {
          // Multiple sessions from same test - aggregate them
          const aggregatedRecord = aggregateGroup(currentGroup);
          aggregated.push(aggregatedRecord);
        } else {
          // Single session - add as is
          aggregated.push(currentGroup[0]);
        }
        currentGroup = [current];
      }
    }
  }

  // Handle last group
  if (currentGroup.length > 0) {
    if (currentGroup.length > 1) {
      const aggregatedRecord = aggregateGroup(currentGroup);
      aggregated.push(aggregatedRecord);
    } else {
      aggregated.push(currentGroup[0]);
    }
  }

  return aggregated;
};

// Aggregate multiple sessions into one
const aggregateGroup = (sessions: TestHistory[]): TestHistory => {
  // For multi-section tests:
  // - Sum scores from all sections
  // - Sum totals from all sections (since each section has its own questions)
  // - Recalculate accuracy from total score and total questions
  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.total, 0);

  // Recalculate accuracy correctly from total score and total questions
  const aggregatedAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // Determine aggregated grade based on recalculated accuracy
  let grade: TestHistory['grade'] = 'Needs Improvement';
  if (aggregatedAccuracy >= 90) grade = 'Excellent';
  else if (aggregatedAccuracy >= 80) grade = 'Good';
  else if (aggregatedAccuracy >= 70) grade = 'Average';

  return {
    id: sessions[0].id,
    sessionId: sessions[0].sessionId, // First session ID
    testName: sessions[0].testName,
    score: totalScore,
    total: totalQuestions,
    accuracy: aggregatedAccuracy,
    grade,
    date: sessions[0].date,
    time: sessions[0].time,
  };
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
        const mapped = records.map(mapRecord);

        // Group consecutive sessions from the same test (same company, close timestamps)
        const aggregated = aggregateTestSessions(mapped);
        setHistoryData(aggregated);
      } catch (err: any) {
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchProgress = async () => {
      try {
        const data = await getProgressAnalytics();
        setProgress(data);
      } catch (err: any) {
      }
    };

    fetchHistory();
    fetchProgress();

    // Refresh history when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHistory();
      }
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
        filter === 'All Results' ||
        t.grade === filter ||
        (filter === 'Needs Improvement' && t.grade === 'Needs Improvement');
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date.split('-').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('-').reverse().join('-')).getTime();
      return sortLatest ? dateB - dateA : dateA - dateB;
    });

  // Chart data: chronological order (oldest first for chart)
  const chartData: ChartDataPoint[] = useMemo(() => {
    return [...historyData]
      .sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('-').reverse().join('-')).getTime();
        return dateA - dateB;
      })
      .map(t => ({
        name: t.date,
        score: t.accuracy, // Use accuracy directly from backend, not score/total
        grade: t.grade,
        testName: t.testName,
      }));
  }, [historyData]);

  const averageScore = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);
  }, [chartData]);

  const showChart = chartData.length >= 2;

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white px-8 py-6 border-b border-slate-200 flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Test History</h1>
          <p className="text-slate-500 mt-1">Track your performance over time and monitor your growth</p>
          {progress && (
            <div className="flex gap-6 mt-3">
              <span className="text-sm text-slate-600">Tests taken: <span className="font-bold text-slate-900">{progress.total_tests}</span></span>
              <span className="text-sm text-slate-600">Avg score: <span className="font-bold text-slate-900">{progress.average_score}%</span></span>
              <span className="text-sm text-slate-600">Best: <span className="font-bold text-slate-900">{progress.best_score}%</span></span>
              <span className={`text-sm font-semibold ${progress.improvement_trend === 'improving' ? 'text-green-600' : progress.improvement_trend === 'declining' ? 'text-red-500' : 'text-slate-500'}`}>
                {progress.improvement_trend === 'improving' ? '↑ Improving' : progress.improvement_trend === 'declining' ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500 font-medium">Overall Grade</span>
          <span className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
            🏅 {progress?.overall_grade ?? 'Good'}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-8 py-6 bg-indigo-50 min-h-screen">
        {/* Back to Result */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Result
        </button>

        {/* Score Progress Chart */}
        {showChart && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Score Progress</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your score trend across {chartData.length} tests</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#2557a7] rounded inline-block" /> Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Average ({averageScore}%)
                </span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  <ReferenceLine
                    y={averageScore}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
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

        {/* Search & Filter Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showChart ? 0.1 : 0 }}
          className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
        >
          {/* Search + Sort */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by test name or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2557a7] text-sm"
              />
            </div>
            <button
              onClick={() => setSortLatest(p => !p)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
              {sortLatest ? 'Latest First' : 'Oldest First'}
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Filter tabs + Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 mr-1">Filter:</span>
              {filterOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                    filter === opt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : opt === 'Excellent'
                      ? 'border-purple-300 text-purple-600 hover:bg-purple-50'
                      : opt === 'Good'
                      ? 'border-green-300 text-green-600 hover:bg-green-50'
                      : opt === 'Average'
                      ? 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'
                      : 'border-red-300 text-red-500 hover:bg-red-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> of <span className="font-bold text-slate-900">{historyData.length}</span> result{historyData.length !== 1 ? 's' : ''}
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
              <tr className="bg-green-100">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Test Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Accuracy</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total Questions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Grade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date &amp; Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-3 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-500 mt-3">Loading test history...</p>
                  </td>
                </tr>
              ) : filtered.map((test, i) => {
                const badge = gradeBadge(test.grade);
                return (
                  <tr key={`${test.id}-${i}`} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{test.testName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{test.accuracy}%</td>
                    <td className="px-6 py-4 text-sm text-slate-700">Questions: {test.total}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.emoji} {test.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{test.date}</div>
                      <div className="text-slate-400">({test.time})</div>
                    </td>
                    <td className="px-6 py-4 relative" ref={openMenu === test.id + i ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenu(openMenu === test.id + i ? null : test.id + i)}
                        className="p-2 rounded-full hover:bg-slate-100 transition"
                      >
                        <MoreVertical size={18} className="text-slate-500" />
                      </button>

                      {openMenu === test.id + i && (
                        <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 w-48">
                          <button
                            onClick={() => { router.push(`/mock-test/results/${test.id}${test.sessionId ? `?session=${test.sessionId}` : ''}`); setOpenMenu(null); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={16} className="text-slate-500" />
                            View Detail result
                          </button>
                          <button
                            onClick={() => { router.push(`/mock-test/${test.id}`); setOpenMenu(null); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <RotateCcw size={16} className="text-slate-500" />
                            Retake mock test
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}


              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
