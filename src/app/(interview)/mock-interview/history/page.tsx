"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLiveHistory, LiveSession, exportUserData } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Mic,
  Filter,
  Star,
  BarChart2,
  History,
  Download,
} from "lucide-react";

const FILTER_OPTIONS = ["All", "Mock", "Practice"];

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-[#2557a7]/10 text-[#2557a7]"
      : score >= 55
      ? "bg-gray-100 text-gray-600"
      : "bg-gray-200 text-gray-700";
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>
      {score}/100
    </span>
  );
}

// ─── Custom tooltip for chart ─────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
    >
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-[#2557a7]">{payload[0].value} / 100</p>
    </div>
  );
}

// ─── Map API session to display shape ─────────────────────────────────────────

function mapLiveSession(s: LiveSession) {
  return {
    session_id: s.session_id,
    type: s.type.startsWith("live_") ? "mock" : "practice",
    date: new Date(s.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    duration_min: s.duration_s ? Math.round(s.duration_s / 60) : 0,
    question_count: 0,
    overall_score: s.score != null ? Math.round(s.score * 10) : 0,
    improvement_pct: null as number | null,
    pressure: "—",
    status: s.status,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const { userProgress, userId } = useMockInterview();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState<ReturnType<typeof mapLiveSession>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!userId) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportUserData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mock-interview-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    getLiveHistory(50)
      .then((data) => {
        setSessions(data.sessions.map(mapLiveSession));
      })
      .catch(() => {
        setHistoryError("Could not load session history. Please try again.");
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  const filtered = sessions.filter(
    (s) => filter === "All" || s.type === filter.toLowerCase()
  );

  // Prefer API userProgress for stats when available
  const totalSessions = userProgress?.total_sessions ?? sessions.length;
  const avgScore = userProgress?.avg_score != null
    ? Math.round(userProgress.avg_score * 10)
    : sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + r.overall_score, 0) / sessions.length)
    : 0;
  const bestScore = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.overall_score))
    : 0;
  const latestDelta =
    sessions.length >= 2
      ? sessions[0].overall_score - sessions[1].overall_score
      : 0;

  // Chart data: score_trend is number[] (plain scores, newest last)
  const progressData =
    userProgress?.score_trend && userProgress.score_trend.length > 0
      ? userProgress.score_trend.map((score, i) => ({
          date: `Round ${i + 1}`,
          score: Math.round(score * 10),
          label: "",
        }))
      : sessions.map((s, i) => ({ date: s.date, score: s.overall_score, label: `Session ${i + 1}` }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/mock-interview")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors group shrink-0"
          >
            <div className="w-5 h-5 rounded-md bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors">
              <ChevronLeft size={12} />
            </div>
            Back
          </button>

          {/* Icon container */}
          <div className="w-12 h-12 bg-[#2557a7]/8 border border-[#2557a7]/15 rounded-xl flex items-center justify-center shrink-0">
            <History size={22} className="text-[#2557a7]" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Session History
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track your progress across all practice and mock sessions.
            </p>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Sessions",
              value: totalSessions.toString(),
              sub: "sessions completed",
              icon: Mic,
            },
            {
              label: "Avg Score",
              value: `${avgScore}`,
              sub: "/ 100 across sessions",
              icon: TrendingUp,
            },
            {
              label: "Best Score",
              value: `${bestScore}`,
              sub: "/ 100 personal best",
              icon: FileText,
            },
          ].map(({ label, value, sub, icon: Icon }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-[#2557a7]/20 transition-colors"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {label}
                </p>
                <div className="w-9 h-9 bg-[#2557a7]/8 border border-[#2557a7]/10 rounded-xl flex items-center justify-center">
                  <Icon size={15} className="text-[#2557a7]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">
                {value}
              </p>
              <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Progress chart ───────────────────────────────────────────────── */}
        <div
          className="bg-white border border-gray-200 rounded-xl p-5 mb-5"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Score Progress
              </p>
              <p className="text-sm font-bold text-gray-800">
                Performance Over Time
              </p>
            </div>
            <div
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                latestDelta >= 0
                  ? "bg-[#2557a7]/8 border border-[#2557a7]/15 text-[#2557a7]"
                  : "bg-gray-100 border border-gray-200 text-gray-600"
              }`}
            >
              {latestDelta >= 0 ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              {latestDelta >= 0 ? "+" : ""}
              {latestDelta} vs last session
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={progressData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[40, 100]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2557a7"
                strokeWidth={2.5}
                dot={{ fill: "#2557a7", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#2557a7", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Session list ─────────────────────────────────────────────────── */}
        <div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* List header with filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Sessions
              </p>
              <p className="text-sm font-bold text-gray-800">All Sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={11} className="text-gray-400 shrink-0" />
              <div className="flex gap-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filter === opt
                        ? "bg-[#2557a7] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400">Loading sessions…</p>
            </div>
          ) : historyError ? (
            <div className="py-14 text-center px-4">
              <p className="text-sm text-gray-500 mb-3">{historyError}</p>
              <button
                onClick={() => { setHistoryError(null); setHistoryLoading(true); getLiveHistory(50).then((d) => setSessions(d.sessions.map(mapLiveSession))).catch(() => setHistoryError("Could not load session history. Please try again.")).finally(() => setHistoryLoading(false)); }}
                className="text-xs text-[#2557a7] underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400">
                No {filter.toLowerCase()} sessions found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() =>
                    router.push(`/mock-interview/report/${session.session_id}`)
                  }
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  {/* Type icon container */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      session.type === "mock"
                        ? "bg-[#2557a7]/8 border-[#2557a7]/15 group-hover:bg-[#2557a7]/15"
                        : "bg-gray-100 border-gray-200 group-hover:bg-gray-200"
                    }`}
                  >
                    <Mic
                      size={16}
                      className={
                        session.type === "mock"
                          ? "text-[#2557a7]"
                          : "text-gray-500"
                      }
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {session.type === "mock"
                          ? "Mock Interview"
                          : "Practice Session"}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          session.type === "mock"
                            ? "bg-[#2557a7]/8 border border-[#2557a7]/15 text-[#2557a7]"
                            : "bg-gray-100 border border-gray-200 text-gray-500"
                        }`}
                      >
                        {session.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{session.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {session.duration_min} min
                      </span>
                      <span>{session.question_count} questions</span>
                    </div>
                  </div>

                  {/* Score + improvement */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <ScoreBadge score={session.overall_score} />
                    <div className="flex items-center gap-1.5">
                      {session.improvement_pct !== null && (
                        <span
                          className={`text-[10px] font-bold flex items-center gap-0.5 ${
                            session.improvement_pct >= 0
                              ? "text-[#2557a7]"
                              : "text-gray-500"
                          }`}
                        >
                          <TrendingUp size={9} />+{session.improvement_pct}%
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          session.pressure === "Handled Well"
                            ? "bg-[#2557a7]/8 border border-[#2557a7]/15 text-[#2557a7]"
                            : "bg-gray-100 border border-gray-200 text-gray-600"
                        }`}
                      >
                        {session.pressure}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Practice stats ───────────────────────────────────────────────── */}
        <div
          className="bg-white border border-gray-200 rounded-xl p-5"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-[#2557a7]/8 border border-[#2557a7]/10 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-[#2557a7]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Analytics
              </p>
              <p className="text-sm font-bold text-gray-800">Practice Stats</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Practice Rounds",
                value: (userProgress?.practice_rounds ?? 0).toString(),
                icon: Mic,
              },
              {
                label: "Avg Score",
                value: userProgress?.avg_score != null ? `${userProgress.avg_score.toFixed(1)}/10` : "—",
                icon: Star,
              },
              {
                label: "Live Sessions",
                value: (userProgress?.live_sessions ?? 0).toString(),
                icon: FileText,
              },
              {
                label: "Total Sessions",
                value: (userProgress?.total_sessions ?? sessions.length).toString(),
                icon: TrendingUp,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3 hover:border-[#2557a7]/15 hover:bg-[#2557a7]/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#2557a7]/8 border border-[#2557a7]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={11} className="text-[#2557a7]" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    {label}
                  </p>
                </div>
                <p className="text-xs font-bold text-gray-800 leading-snug">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Export My Data ───────────────────────────────────────────────── */}
        <div className="mt-5 flex flex-col items-end gap-1.5">
          {exportError && (
            <p className="text-xs text-gray-500">{exportError}</p>
          )}
          <button
            onClick={handleExport}
            disabled={exporting || !userId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Download size={13} className="text-gray-400" />
            {exporting ? "Exporting…" : "Export My Data"}
          </button>
        </div>

      </div>
    </div>
  );
}
