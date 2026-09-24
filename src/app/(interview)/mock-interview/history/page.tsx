"use client";

import { useState, useEffect, useCallback } from "react";
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

function ScoreBadge({ score, loading, failed }: { score: number; loading?: boolean; failed?: boolean }) {
  if (loading) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 animate-pulse">
        …/100
      </span>
    );
  }
  if (failed) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
        —/100
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
    score_failed: false,
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
            return { ...s, overall_score: result.value.score, score_loaded: true, score_failed: false };
          }
          // Report fetch failed (still processing, rate-limited, etc.) — mark
          // as loaded so we don't refetch every render, but flag it as failed
          // so it renders "—" and is excluded from stats/chart below, rather
          // than silently scoring it 0.
          return { ...s, score_loaded: true, score_failed: true };
        })
      );
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey]);

  // Manual retry for a single failed row. Kept independent of the paginated
  // fetch effect above (which only re-runs when the visible page's id set
  // changes) so re-fetching one row doesn't require touching that effect's
  // dependencies or risk re-fetching every unresolved row on the page.
  const retryScore = useCallback((sessionId: string) => {
    let cancelled = false;
    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, score_loaded: false, score_failed: false } : s))
    );
    getReport(sessionId)
      .then((r) => {
        if (cancelled) return;
        const score = Math.round(r.overall_score);
        setSessions((prev) =>
          prev.map((s) => (s.session_id === sessionId ? { ...s, overall_score: score, score_loaded: true, score_failed: false } : s))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setSessions((prev) =>
          prev.map((s) => (s.session_id === sessionId ? { ...s, score_loaded: true, score_failed: true } : s))
        );
      });
    return () => { cancelled = true; };
  }, []);

  // Only sessions whose real score has resolved feed the stats/chart —
  // otherwise every unscored row's placeholder 0 would drag these down.
  const liveSessions = sessions.filter((s) => s.type === "mock" && s.score_loaded && !s.score_failed);
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Icon container */}
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#2557a7]/15 bg-[#2557a7]/5">
              <History size={22} className="text-[#2557a7]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2557a7]">Mock interview archive</p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-gray-900">
                Session History
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track completed live mock interviews, report status, and score movement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/mock-interview/live")}
            className="inline-flex items-center justify-center rounded-lg bg-[#2557a7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e4a8f]"
          >
            New mock interview
          </button>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7]">Readiness ledger</p>
            <div className="mt-5">
              <p className="text-5xl font-semibold tracking-tight text-gray-950">{bestScore}</p>
              <p className="mt-1 text-sm text-gray-500">best score out of 100</p>
            </div>
            <div className="mt-6 rounded-lg border border-gray-200">
              <div className="border-b border-gray-100 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Average</p>
                <p className="mt-1 text-lg font-semibold text-gray-950">{avgScore}/100</p>
              </div>
              <div className="border-b border-gray-100 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Sessions</p>
                <p className="mt-1 text-lg font-semibold text-gray-950">{totalSessions}</p>
              </div>
              <div className="px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Latest change</p>
                <p className="mt-1 text-lg font-semibold text-gray-950">{latestDelta >= 0 ? "+" : ""}{latestDelta}</p>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              className="rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-[#2557a7]/25"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {label}
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2557a7]/10 bg-[#2557a7]/5">
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
          className="mb-5 rounded-lg border border-gray-200 bg-white p-5"
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
          className="mb-5 overflow-hidden rounded-lg border border-gray-200 bg-white"
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Mic size={18} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No live interview sessions found.</p>
              <p className="mt-1 text-xs text-gray-500">Start a mock interview to build your report history.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginated.map((session) => (
                <div
                  key={session.session_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/mock-interview/report/${session.session_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/mock-interview/report/${session.session_id}`);
                    }
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  {/* Type icon container */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
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
                    <ScoreBadge score={session.overall_score} loading={!session.score_loaded} failed={session.score_failed} />
                    <div className="flex items-center gap-1.5">
                      {session.score_failed && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            retryScore(session.session_id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              retryScore(session.session_id);
                            }
                          }}
                          className="text-[10px] font-semibold text-[#2557a7] underline-offset-2 hover:underline cursor-pointer"
                        >
                          Retry
                        </span>
                      )}
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
                </div>
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
          </section>
        </div>
      </div>
    </div>
  );
}
