"use client";

import { PageHeading, PanelHeading } from "../_components/MockUI";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLiveHistory, getReport, LiveSession, ReportResponse } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";
import { normalizeOverallScore } from "../_lib/reportScores";
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Mic,
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

// ─── Report loading ───────────────────────────────────────────────────────────
// GET /live/history returns score: null for finished sessions (a backend known
// gap) and 0.0 for sessions that never finished - neither is a real score. The
// score, duration and question count only exist in GET /report/{id}, and only
// for "completed" sessions. That endpoint is limited to ~10/min, so reports
// are fetched in small batches, and each result is remembered on this device
// (a finished report never changes) so later visits are instant.

const REPORT_CACHE_KEY = "mock_interview_report_summaries_v1";
const REPORT_BATCH_SIZE = 8;
const REPORT_BATCH_GAP_MS = 60_000;

interface ReportSummary {
  score: number;
  duration_min: number | null;
  question_count: number | null;
}

function readReportCache(): Record<string, ReportSummary> {
  try {
    const parsed = JSON.parse(localStorage.getItem(REPORT_CACHE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function cacheReportSummary(sessionId: string, summary: ReportSummary) {
  try {
    localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify({ ...readReportCache(), [sessionId]: summary }));
  } catch {
    /* storage unavailable or full - it just isn't remembered */
  }
}

function summarizeReport(r: ReportResponse): ReportSummary {
  return {
    // Same scale rules as the report page, so a session shows one score everywhere.
    score: Math.round(normalizeOverallScore(r)),
    duration_min: typeof r.duration_seconds === "number"
      ? Math.round(r.duration_seconds / 60)
      : typeof r.duration_min === "number" ? r.duration_min : null,
    question_count: Array.isArray(r.answers) ? r.answers.length : null,
  };
}

function mapLiveSession(s: LiveSession, cache: Record<string, ReportSummary> = {}) {
  const hasReport = s.status === "completed";
  const cached = hasReport ? cache[s.session_id] : undefined;
  return {
    session_id: s.session_id,
    type: s.type.startsWith("live_") ? "mock" : "practice",
    interview_label: getInterviewLabel(s.type),
    timestamp: new Date(s.created_at).getTime() || 0,
    date: new Date(s.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    // null = unknown (the list sends null); filled in from the report.
    duration_min: cached?.duration_min ?? (s.duration_s ? Math.round(s.duration_s / 60) : null),
    question_count: cached?.question_count ?? (typeof s.question_count === "number" ? s.question_count : null),
    // Only completed sessions have a report and therefore a score.
    has_report: hasReport,
    overall_score: cached?.score ?? 0,
    score_loaded: cached !== undefined,
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
        const cache = readReportCache();
        setSessions(data.sessions.map((s) => mapLiveSession(s, cache)));
      })
      .catch(() => {
        setHistoryError("Could not load session history. Please try again.");
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  // The list, pagination and stats cover completed sessions only. Sessions that
  // never finished (active / recovering / abandoned) have no report to show.
  const mockSessions = sessions.filter((s) => s.type === "mock");
  const filtered = mockSessions.filter((s) => s.has_report);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const completedIdsKey = filtered.filter((s) => s.has_report).map((s) => s.session_id).join(",");
  const inflightRef = useRef<Set<string>>(new Set());

  const applyReportResult = useCallback((id: string, summary: ReportSummary | null) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.session_id !== id) return s;
        // A failed fetch is flagged, never scored as 0, and excluded from stats.
        if (!summary) return { ...s, score_loaded: true, score_failed: true };
        return {
          ...s,
          overall_score: summary.score,
          duration_min: summary.duration_min ?? s.duration_min,
          question_count: summary.question_count ?? s.question_count,
          score_loaded: true,
          score_failed: false,
        };
      })
    );
  }, []);

  const fetchReport = useCallback((id: string) => {
    if (inflightRef.current.has(id)) return;
    inflightRef.current.add(id);
    getReport(id)
      .then((r) => {
        const summary = summarizeReport(r);
        cacheReportSummary(id, summary);
        applyReportResult(id, summary);
      })
      .catch(() => applyReportResult(id, null))
      .finally(() => inflightRef.current.delete(id));
  }, [applyReportResult]);

  // Load every completed session's report, current page first, in batches that
  // stay under the report endpoint's ~10/min limit. Sessions that never
  // finished have no report and are not requested.
  useEffect(() => {
    if (historyLoading) return;
    const onPage = new Set(paginated.map((s) => s.session_id));
    const ids = filtered
      .filter((s) => s.has_report && !s.score_loaded)
      .sort((a, b) => Number(onPage.has(b.session_id)) - Number(onPage.has(a.session_id)))
      .map((s) => s.session_id);
    if (ids.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const runBatch = (start: number) => {
      ids.slice(start, start + REPORT_BATCH_SIZE).forEach(fetchReport);
      if (start + REPORT_BATCH_SIZE < ids.length) {
        timer = setTimeout(() => runBatch(start + REPORT_BATCH_SIZE), REPORT_BATCH_GAP_MS);
      }
    };
    runBatch(0);

    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoading, completedIdsKey]);

  // Manual retry for a single failed row, independent of the batch loader.
  const retryScore = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, score_loaded: false, score_failed: false } : s))
    );
    fetchReport(sessionId);
  }, [fetchReport]);

  // Stats, average, best and the chart use every completed session whose real
  // score has resolved. Unfinished sessions have no score and failed fetches
  // are excluded, so no placeholder 0 drags the numbers down.
  const completedSessions = filtered;
  const liveSessions = completedSessions
    .filter((s) => s.score_loaded && !s.score_failed)
    .sort((a, b) => b.timestamp - a.timestamp); // newest first
  const completedCount = completedSessions.length;
  const pendingCount = completedSessions.filter((s) => !s.score_loaded).length;
  const failedCount = completedSessions.filter((s) => s.score_failed).length;
  const totalSessions = userProgress?.live_sessions ?? mockSessions.length;
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

  // Oldest to newest, so "over time" reads left to right.
  const progressData = [...liveSessions].reverse().map((s, i) => ({
    date: s.date,
    score: s.overall_score,
    label: `Session ${i + 1}`,
  }));

  return (
    <main className="mi-page mi-history-page">
      <PageHeading eyebrow="YOUR INTERVIEW JOURNEY" title="Session History" description="See how far you?ve come. Revisit your conversations and find your next opportunity to improve." action={<button className="mi-button" onClick={() => router.push("/mock-interview/live")}>New mock interview <ArrowRight size={18} /></button>} />
      <section className="mi-stat-grid" aria-label="Interview statistics">
        {[
          { label: "Total Sessions", value: totalSessions.toString(), sub: completedCount + " completed", Icon: Mic },
          { label: "Avg Score", value: String(avgScore), sub: "/ 100 across " + liveSessions.length + " completed session" + (liveSessions.length === 1 ? "" : "s"), Icon: TrendingUp },
          { label: "Best Score", value: String(bestScore), sub: "/ 100 personal best", Icon: FileText },
          { label: "Latest change", value: (latestDelta >= 0 ? "+" : "") + latestDelta, sub: "vs last session", Icon: latestDelta >= 0 ? TrendingUp : TrendingDown },
        ].map(({ label, value, sub, Icon }) => <div className="mi-panel mi-stat-card" key={label}><div><p>{label}</p><span className="mi-icon-tile"><Icon size={20} /></span></div><strong>{value}</strong><small>{sub}</small></div>)}
      </section>
      {(pendingCount > 0 || failedCount > 0) && <p role="status" className="mi-notice">{pendingCount > 0 ? "Loading scores for " + pendingCount + " completed session" + (pendingCount === 1 ? "" : "s") + ". Your results will appear as they become available." : failedCount + " completed session" + (failedCount === 1 ? "" : "s") + " could not be scored and " + (failedCount === 1 ? "is" : "are") + " left out of these figures. Use Retry on the row."}</p>}
      <div className="mi-history-overview">
        <section className="mi-panel mi-chart-panel"><PanelHeading title="Performance Over Time" description="Score Progress" action={<span className="mi-pill">{latestDelta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{latestDelta >= 0 ? "+" : ""}{latestDelta} vs last session</span>} /><ResponsiveContainer width="100%" height={220}><LineChart data={progressData} margin={{ top: 12, right: 16, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" stroke="rgba(37,87,167,.10)" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="score" stroke="#2557a7" strokeWidth={3} dot={{ fill: "#2557a7", r: 4, strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 6, fill: "#2557a7" }} /></LineChart></ResponsiveContainer><p className="mi-caption">Completed sessions <strong>{completedCount}</strong></p></section>
        <aside className="mi-panel mi-history-next"><span className="mi-icon-tile"><Mic size={26} /></span><p className="mi-eyebrow">KEEP YOUR MOMENTUM</p><h2>Your next conversation starts here.</h2><p>Put the feedback from your last session into action. Every attempt is a chance to tell your story more clearly.</p><button className="mi-button mi-button-secondary" onClick={() => router.push("/mock-interview/live")}>Start another session <ArrowRight size={17} /></button></aside>
      </div>
      <section className="mi-panel mi-session-list"><PanelHeading title="Mock Interview Completed Sessions" description="Select a session to revisit your report." action={<span className="mi-pill mi-pill-neutral">{filtered.length} sessions</span>} />
        {historyLoading ? <div className="mi-empty-state"><p>Loading sessions?</p></div> : historyError ? <div className="mi-empty-state"><p>{historyError}</p><button className="mi-button mi-button-secondary" onClick={() => { setHistoryError(null); setHistoryLoading(true); getLiveHistory(50).then(d => { const cache = readReportCache(); setSessions(d.sessions.map(session => mapLiveSession(session, cache))); }).catch(() => setHistoryError("Could not load session history. Please try again.")).finally(() => setHistoryLoading(false)); }}>Retry</button></div> : filtered.length === 0 ? <div className="mi-empty-state"><span className="mi-icon-tile"><Mic size={28} /></span><h3>No completed interview sessions found.</h3>{mockSessions.length > 0 && <p>Sessions you started but did not finish are not listed.</p>}<p>Start a mock interview to build your report history.</p></div> : <>
          <div className="mi-session-columns" aria-hidden="true"><span>INTERVIEW</span><span>SESSION DETAILS</span><span>RESULT</span><span /></div>
          {paginated.map(session => <div key={session.session_id} className="mi-session-row" role="button" tabIndex={0} onClick={() => router.push(`/mock-interview/report/${session.session_id}`)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(`/mock-interview/report/${session.session_id}`); } }}>
            <div className="mi-session-name"><span className="mi-icon-tile"><Mic size={21} /></span><div><strong>{session.interview_label}</strong><small>{session.date}</small></div></div><div className="mi-session-details">{session.duration_min !== null && <span><Clock size={14} />{session.duration_min} min</span>}<span>{session.question_count !== null ? session.question_count + " questions" : "Questions pending"}</span></div><div className="mi-session-score"><ScoreBadge score={session.overall_score} loading={session.has_report && !session.score_loaded} failed={session.score_failed || !session.has_report} />{session.has_report && session.score_failed && <button onClick={event => { event.stopPropagation(); retryScore(session.session_id); }} onKeyDown={event => event.stopPropagation()} className="mi-text-button">Retry</button>}{session.improvement_pct !== null && <small>{session.improvement_pct >= 0 ? "+" : ""}{session.improvement_pct}%</small>}{session.pressure && <small>{session.pressure}</small>}</div><ArrowRight size={18} aria-hidden="true" />
          </div>)}
        </>}
        {totalPages > 1 && <div className="mi-pagination"><p>Page {page} of {totalPages} ? {paginated.length} sessions</p><div><button aria-label="Previous page" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map(value => <button key={value} aria-current={page === value ? "page" : undefined} onClick={() => setPage(value)}>{value}</button>)}<button aria-label="Next page" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages}><ChevronRight size={16} /></button></div></div>}
      </section>
    </main>
  );
}
