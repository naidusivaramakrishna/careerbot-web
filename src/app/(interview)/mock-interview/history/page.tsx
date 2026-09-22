"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLiveHistory, getReport, LiveSession } from "@/api/mockInterviewApi";
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
  ChevronRight,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Mic,
  History,
} from "lucide-react";

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, loading }: { score: number; loading?: boolean }) {
  if (loading) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 animate-pulse">
        …/100
      </span>
    );
  }
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

function getInterviewLabel(type: string): string {
  if (type === "live_hr") return "HR Mock Interview";
  if (type === "live_technical") return "Technical Mock Interview";
  if (type === "live_managerial") return "Managerial Mock Interview";
  return "Mock Interview";
}

function mapLiveSession(s: LiveSession) {
  return {
    session_id: s.session_id,
    type: s.type.startsWith("live_") ? "mock" : "practice",
    interview_label: getInterviewLabel(s.type),
    date: new Date(s.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    duration_min: s.duration_s ? Math.round(s.duration_s / 60) : 0,
    question_count: typeof s.question_count === "number" ? s.question_count : null,
    // GET /live/history currently always returns score: null (backend known
    // gap) — resolved lazily per visible row from GET /report/{id} below.
    overall_score: 0,
    score_loaded: false,
    improvement_pct: null as number | null,
    pressure: s.pressure_tag === "pressure_affected" ? "Pressure affected" : null,
    status: s.status,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const { userProgress } = useMockInterview();
  const [sessions, setSessions] = useState<ReturnType<typeof mapLiveSession>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const filtered = sessions.filter((s) => s.type === "mock");
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIdsKey = paginated.map((s) => s.session_id).join(",");

  // GET /live/history returns score: null for every row (backend known gap).
  // Resolve the real score per visible row from GET /report/{id} instead —
  // only for the current page, to stay well under that endpoint's 10/min cap.
  useEffect(() => {
    const idsToFetch = paginated.filter((s) => !s.score_loaded).map((s) => s.session_id);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    Promise.allSettled(
      idsToFetch.map((id) => getReport(id).then((r) => ({ id, score: Math.round(r.overall_score) })))
    ).then((results) => {
      if (cancelled) return;
      setSessions((prev) =>
        prev.map((s) => {
          const idx = idsToFetch.indexOf(s.session_id);
          if (idx === -1) return s;
          const result = results[idx];
          if (result.status === "fulfilled") {
            return { ...s, overall_score: result.value.score, score_loaded: true };
          }
          // Report not available yet (still processing, or never scored) —
          // mark as loaded so we don't refetch every render.
          return { ...s, score_loaded: true };
        })
      );
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey]);

  // Only sessions whose real score has resolved feed the stats/chart —
  // otherwise every unscored row's placeholder 0 would drag these down.
  const liveSessions = sessions.filter((s) => s.type === "mock" && s.score_loaded);
  const totalSessions = userProgress?.live_sessions ?? sessions.filter((s) => s.type === "mock").length;
  const avgScore = liveSessions.length > 0
    ? Math.round(liveSessions.reduce((s, r) => s + r.overall_score, 0) / liveSessions.length)
    : 0;
  const bestScore = liveSessions.length > 0
    ? Math.max(...liveSessions.map((s) => s.overall_score))
    : 0;
  const latestDelta =
    liveSessions.length >= 2
      ? liveSessions[0].overall_score - liveSessions[1].overall_score
      : 0;

  const progressData = liveSessions.map((s, i) => ({
    date: s.date,
    score: s.overall_score,
    label: `Session ${i + 1}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          {/* Icon container */}
          <div className="w-12 h-12 bg-[#2557a7]/8 border border-[#2557a7]/15 rounded-xl flex items-center justify-center shrink-0">
            <History size={22} className="text-[#2557a7]" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Session History
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track your completed live mock interview sessions.
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
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Sessions
            </p>
            <p className="text-sm font-bold text-gray-800">Live Interview Sessions</p>
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
              <p className="text-sm text-gray-400">No live interview sessions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginated.map((session) => (
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
                        {session.interview_label}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{session.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {session.duration_min} min
                      </span>
                      <span>{session.question_count !== null ? `${session.question_count} questions` : "Questions pending"}</span>
                    </div>
                  </div>

                  {/* Score + improvement */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <ScoreBadge score={session.overall_score} loading={!session.score_loaded} />
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
                      {session.pressure && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600">
                          {session.pressure}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages} · {paginated.length} sessions
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      p === page
                        ? "bg-[#2557a7] text-white"
                        : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}
