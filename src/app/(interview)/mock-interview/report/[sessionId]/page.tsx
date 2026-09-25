"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport, shareReport, downloadReportPdf, ReportResponse } from "@/api/mockInterviewApi";
import { getReportDimensions, humanize, mapCompetencyScores, normalizeOverallScore, type ReportDimension } from "../../_lib/reportScores";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChevronLeft,
  Download,
  Share2,
  Trophy,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Copy,
  X,
  Link2,
  MessageSquare,
  BookOpen,
  ListChecks,
  Loader2,
} from "lucide-react";
import { CodingPerformanceSection } from "@/components/interview/CodingPerformanceSection";
import type { CodingRoundData } from "@/components/interview/CodingPerformanceSection";
import type { ScoreBreakdown } from "@/app/coding-test/_lib/types";

// ─── UI report shape ─────────────────────────────────────────────────────────

interface UiQuestion {
  num: number;
  text: string;
  mock_score: number;
  // null = the backend did not report it (never show a fabricated 0).
  duration_s: number | null;
  filler_count: number | null;
  feedback: string;
  level: string | null;
  competencies: { key: string; label: string; score: number }[];
}

type UiDimension = ReportDimension;

/** Notes/practice page matching the interview type ("HR", "live_technical", ...). */
function getPracticeHref(type: string | undefined): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("technical")) return "/notes/technical";
  if (t.includes("managerial")) return "/notes/managerial";
  if (t.includes("hr")) return "/notes/hr";
  return "/notes/generate";
}

interface UiReport {
  session_id: string;
  practice_href: string;
  interview_label: string;
  grade: string | null;
  performance_level: string | null;
  summary: string;
  end_reason_label: string | null;
  not_scored: boolean;
  readiness: { ready: boolean; areas: string[] } | null;
  dimensions: UiDimension[];
  pressure_affected: boolean;
  date: string;
  duration_min: number;
  question_count: number;
  overall_score: number; // 0-100
  practice_avg: number;
  mock_avg: number;
  improvement_pct: number;
  hinglish_phrases: { original: string; english: string }[];
  action_plan: string[];
  suggested_reattempt: string;
  interviewer_perspective: string;
  redo_questions: { num: number; text: string; score: number; issue: string }[];
  strengths: string[];
  areas_to_improve: string[];
  questions: UiQuestion[];
  coding_round?: CodingRoundData;
}

function getInterviewLabel(type: string | undefined): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("technical")) return "Technical interview";
  if (t.includes("managerial")) return "Managerial interview";
  if (t.includes("hr")) return "HR interview";
  return "Mock interview";
}

const END_REASON_LABELS: Record<string, string> = {
  max_questions_reached: "Question limit reached",
  time_limit_reached: "Time limit reached",
  time_limit: "Time limit reached",
  user_ended: "Ended by candidate",
  ended_early: "Ended by candidate",
  completed: "Completed",
};

function getEndReasonLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return END_REASON_LABELS[reason] ?? humanize(reason);
}

/** Map API ReportResponse → UI shape */
function mapReport(api: ReportResponse): UiReport {
  const answers = api.answers ?? [];
  const mockAvg = answers.length
    ? answers.reduce((s, a) => s + a.score, 0) / answers.length
    : 0;
  const overallScore = normalizeOverallScore(api);

  // Map coding_performance from API to CodingRoundData
  let codingRound: CodingRoundData | undefined;
  if (api.coding_performance) {
    // Typed via ReportResponse; every read below is guarded because the
    // backend evolves this payload independently of the frontend.
    const perf = api.coding_performance;
    const str = (v: unknown, fallback: string) =>
      typeof v === "string" && v !== "" ? v : fallback;
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? v : fallback;
    // Convert criteria object to grading_result breakdown format
    // criteria values are objects ({score, weight, feedback}) on the current
    // backend; older payloads used a bare number. Handle both, drop anything
    // we cannot read a numeric score out of.
    const breakdown = {} as ScoreBreakdown;
    if (perf.criteria && typeof perf.criteria === "object") {
      Object.entries(perf.criteria).forEach(([key, value]) => {
        let score: number | undefined;
        let weight = 100;
        let feedback = "";

        if (typeof value === "number") {
          score = value;
        } else if (value && typeof value === "object") {
          const c = value as { score?: unknown; weight?: unknown; feedback?: unknown };
          if (typeof c.score === "number") score = c.score;
          if (typeof c.weight === "number" && c.weight > 0) weight = c.weight;
          if (typeof c.feedback === "string") feedback = c.feedback;
        }

        if (score === undefined) return;
        breakdown[key as keyof ScoreBreakdown] = {
          name: key,
          score,
          weight,
          feedback,
          suggestions: [],
        };
      });
    }

    // Backend field is ai_feedback_summary; `summary` is a legacy alias.
    const summary =
      typeof perf.ai_feedback_summary === "string"
        ? perf.ai_feedback_summary
        : typeof perf.summary === "string"
          ? perf.summary
          : "";
    const improvements = Array.isArray(perf.improvements)
      ? perf.improvements.filter((v: unknown): v is string => typeof v === "string")
      : Array.isArray(perf.suggestions)
        ? perf.suggestions.filter((v: unknown): v is string => typeof v === "string")
        : [];
    const hasGrading = summary !== "" || Object.keys(breakdown).length > 0;
    codingRound = {
      problem_slug: str(perf.problem_slug, "coding-round"),
      problem_title: str(perf.problem_title, "Coding Problem"),
      language: str(perf.language, "python"),
      score: typeof perf.score === "number" ? perf.score : null,
      // Previously gated on perf.summary alone, which is never present on the
      // current backend — the whole breakdown and AI feedback were dropped.
      grading_result: hasGrading ? {
        total_score: typeof perf.score === "number" ? perf.score : 0,
        breakdown,
        summary,
        suggestions: improvements,
      } : null,
      time_taken_s: num(perf.time_taken_s, 0),
      followup_answers: Array.isArray(perf.followup_scores)
        ? perf.followup_scores.map((raw: unknown) => {
            const fs = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
            return {
              attempt_number: num(fs.attempt_number, 0),
              follow_up_question: str(fs.follow_up_question, str(fs.question, "")),
              score: num(fs.score, 0),
              max_score: num(fs.max_score, 100),
            };
          })
        : undefined,
    };
  }

  return {
    session_id: api.session_id,
    practice_href: getPracticeHref(api.type),
    date: new Date(api.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    duration_min: api.duration_min ?? (api.duration_seconds ? Math.round(api.duration_seconds / 60) : 0),
    question_count: answers.length || api.question_count || 0,
    overall_score: overallScore,
    practice_avg: api.practice_avg ?? 0,
    mock_avg: api.mock_avg ?? parseFloat(mockAvg.toFixed(1)),
    improvement_pct: api.improvement_pct ?? 0,
    interview_label: getInterviewLabel(api.type),
    grade: api.grade ?? null,
    performance_level: api.performance_level ?? null,
    summary: api.performance_summary ?? "",
    end_reason_label: getEndReasonLabel(api.end_reason),
    not_scored: api.not_scored === true,
    readiness: api.interview_readiness && typeof api.interview_readiness.ready_for_interview === "boolean"
      ? { ready: api.interview_readiness.ready_for_interview, areas: api.interview_readiness.recommended_practice_areas ?? [] }
      : null,
    // Prefer the backend's per-competency scores; otherwise the category
    // scores (or a supplied radar) so older payloads still get a breakdown.
    dimensions: getReportDimensions(api, { fillFromOverall: true }),
    pressure_affected: api.pressure_tag === "pressure_affected",
    hinglish_phrases: api.hinglish_phrases ?? [],
    action_plan: api.action_plan ?? api.recommendations ?? [],
    suggested_reattempt: api.suggested_reattempt ?? "",
    interviewer_perspective: api.interviewer_perspective ?? "",
    // The two weakest answers, keeping each one's real question number.
    redo_questions: (api.redo_questions ?? answers
      .map((a, i) => ({ num: i + 1, text: a.question_text, score: a.score, issue: a.feedback ?? a.note ?? "" }))
      .filter((q) => q.score < 6)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)),
    strengths: api.strengths ?? [],
    areas_to_improve: api.improvement_areas ?? [],
    questions: answers.map((a, i) => ({
      num: i + 1,
      text: a.question_text,
      mock_score: a.score,
      duration_s: typeof a.duration_s === "number" ? a.duration_s : null,
      filler_count: typeof a.filler_count === "number" ? a.filler_count : null,
      feedback: a.feedback ?? a.note ?? "",
      level: a.performance_level ?? null,
      competencies: mapCompetencyScores(a.competency_scores, "percent"),
    })),
    coding_round: codingRound,
  };
}

// ─── Score bands ──────────────────────────────────────────────────────────────
// Status is always paired with a text label so it never relies on colour alone.

function getBand(pct: number) {
  if (pct >= 70) return { label: "Strong", hex: "#059669", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500" };
  if (pct >= 50) return { label: "Developing", hex: "#d97706", text: "text-amber-700", chip: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-500" };
  return { label: "Needs improvement", hex: "#dc2626", text: "text-red-700", chip: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500" };
}

function ScoreChip({ score, max = 10 }: { score: number; max?: number }) {
  const band = getBand((score / max) * 100);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${band.chip}`}>
      {score.toFixed(1)}/{max}
      <span className="sr-only">, {band.label}</span>
    </span>
  );
}

function ScoreMeter({ label, score, focus = false }: { label: string; score: number; focus?: boolean }) {
  const band = getBand(score);
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-gray-800">
          {label}
          {focus && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              Focus area
            </span>
          )}
        </span>
        <span className="tabular-nums text-gray-900">
          <span className="font-semibold">{score}</span>
          <span className="text-gray-400">/100</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={`${score} out of 100, ${band.label}`}
        className="h-2 overflow-hidden rounded-full bg-gray-100"
      >
        <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </li>
  );
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 100, size = 132 }: { score: number; max?: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  const offset = circ * (1 - pct);
  const band = getBand(pct * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Overall score ${score} out of ${max}, ${band.label}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={band.hex} strokeWidth="9"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x={size / 2} y={size / 2 + 2} textAnchor="middle" fontSize="28" fontWeight="700" fill="#111827">
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
          out of {max}
        </text>
      </svg>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${band.chip}`}>{band.label}</span>
    </div>
  );
}

// ─── Question row ─────────────────────────────────────────────────────────────

function QuestionRow({ q }: { q: UiQuestion }) {
  const [open, setOpen] = useState(false);
  const panelId = `question-panel-${q.num}`;
  const hasMetrics = q.duration_s !== null || q.filler_count !== null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2557a7]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
          {q.num}
        </span>
        <p className="flex-1 truncate text-sm font-medium text-gray-800">{q.text}</p>
        <div className="flex shrink-0 items-center gap-2">
          <ScoreChip score={q.mock_score} />
          {open ? <ChevronUp size={14} className="text-gray-400" aria-hidden="true" /> : <ChevronDown size={14} className="text-gray-400" aria-hidden="true" />}
        </div>
      </button>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-gray-100 bg-gray-50 px-4 py-4">
          {q.level && (
            <p className="text-xs text-gray-500">
              Performance level: <span className="font-semibold text-gray-800">{q.level}</span>
            </p>
          )}
          {q.feedback && <p className="text-sm leading-relaxed text-gray-700">{q.feedback}</p>}
          {q.competencies.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {q.competencies.map((c) => (
                <ScoreMeter key={c.key} label={c.label} score={c.score} />
              ))}
            </ul>
          )}
          {hasMetrics && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
              {q.duration_s !== null && (
                <div className="flex gap-1.5"><dt>Duration</dt><dd className="font-semibold text-gray-800">{q.duration_s}s</dd></div>
              )}
              {q.filler_count !== null && (
                <div className="flex gap-1.5"><dt>Filler words</dt><dd className="font-semibold text-gray-800">{q.filler_count}</dd></div>
              )}
            </dl>
          )}
          {!q.feedback && q.competencies.length === 0 && !hasMetrics && (
            <p className="text-xs text-gray-500">No additional detail was recorded for this answer.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ShareModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await shareReport(sessionId);
      const fullUrl = `${window.location.origin}${data.share_url}`;
      setShareUrl(fullUrl);
    } catch {
      setError("Failed to generate share link. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[#2557a7]" />
            <h3 className="text-sm font-bold text-gray-900">Share Your Report</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="p-3 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl mb-4 text-xs text-[#2557a7] leading-relaxed">
            A shareable link will be created. The shared version does <strong>NOT</strong> include your name, email, or phone number. Link expires in <strong>7 days</strong>.
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 mb-3">
              <AlertCircle size={12} className="text-gray-400 shrink-0" />
              {error}
            </div>
          )}

          {shareUrl ? (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Your shareable link:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 min-w-0"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${copied ? "bg-[#2557a7]/10 text-[#2557a7]" : "bg-[#2557a7] text-white hover:bg-[#1e4a8f]"}`}
                >
                  <Copy size={12} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Expires in 7 days · Shareable without login</p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2557a7] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1e4a8f] disabled:opacity-60"
            >
              {generating ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating link…</>
              ) : (
                <><Link2 size={14} /> Generate Link</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showShare, setShowShare] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [report, setReport] = useState<UiReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const maxAttempts = 6;

    const loadReport = async (attempt = 1) => {
      setReportLoading(true);
      setReportError(null);

      try {
        const data = await getReport(sessionId);
        if (cancelled) return;
        setReport(mapReport(data));
        setReportLoading(false);
      } catch {
        if (cancelled) return;
        if (attempt < maxAttempts) {
          retryTimer = setTimeout(() => loadReport(attempt + 1), 1500);
          return;
        }
        setReportError("Could not load this report. It may still be preparing or is unavailable.");
        setReportLoading(false);
      }
    };

    loadReport();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [sessionId]);

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    setPdfLoading(true);
    try {
      await downloadReportPdf(sessionId);
    } finally {
      setPdfLoading(false);
    }
  };

  const barData = (report?.questions ?? []).map((q) => ({
    name: `Q${q.num}`,
    Score: q.mock_score,
  }));

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Preparing report...</p>
        </div>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-sm text-gray-500 mb-4">{reportError ?? "This report does not exist."}</p>
          <button
            onClick={() => router.push("/mock-interview/history")}
            className="px-5 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  const weakest = report.dimensions.length > 1
    ? report.dimensions.reduce((min, d) => (d.score < min.score ? d : min))
    : null;
  const cardClass = "rounded-lg border border-gray-200 bg-white p-5 shadow-sm";
  const cardTitle = "text-sm font-semibold text-gray-900";

  return (
    <>
      {showShare && <ShareModal sessionId={sessionId} onClose={() => setShowShare(false)} />}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/mock-interview/live")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]"
            >
              <Share2 size={14} aria-hidden="true" />
              Share Report
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 rounded-lg bg-[#2557a7] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1e4a8f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pdfLoading ? (
                <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Generating…</>
              ) : (
                <><Download size={14} aria-hidden="true" /> Download PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2557a7]">Performance report</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Mock Interview Report</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>{report.interview_label}</span>
            <span>{report.date}</span>
            <span className="flex items-center gap-1">
              <Clock size={13} aria-hidden="true" />
              <span>{report.duration_min} min</span>
            </span>
            <span>{report.question_count} questions</span>
          </div>
          {(report.end_reason_label || report.pressure_affected) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.end_reason_label && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Session ended: {report.end_reason_label}
                </span>
              )}
              {report.pressure_affected && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                  Performance affected by pressure
                </span>
              )}
            </div>
          )}
        </header>

        {report.not_scored && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            This interview could not be scored, so the results below are not a reliable measure of performance.
          </div>
        )}

        {/* Overall result */}
        <section aria-label="Overall result" className="mb-5 grid gap-5 lg:grid-cols-3">
          <div className={cardClass}>
            <h2 className={cardTitle}>Overall score</h2>
            <div className="mt-4 flex justify-center">
              <ScoreRing score={report.overall_score} />
            </div>
            {(report.grade || report.performance_level) && (
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-center">
                {report.grade && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Grade</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-gray-900">{report.grade}</dd>
                  </div>
                )}
                {report.performance_level && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Level</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-gray-900">{report.performance_level}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className={`${cardClass} lg:col-span-2`}>
            <h2 className={cardTitle}>Executive summary</h2>
            {report.summary ? (
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{report.summary}</p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No written summary was provided for this session.</p>
            )}
            {report.readiness && (
              <div
                className={`mt-4 flex gap-3 rounded-lg border p-4 ${
                  report.readiness.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                }`}
              >
                {report.readiness.ready ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${report.readiness.ready ? "text-emerald-800" : "text-amber-800"}`}>
                    {report.readiness.ready ? "Interview ready" : "Not yet interview-ready"}
                  </p>
                  {report.readiness.areas.length > 0 && (
                    <>
                      <p className="mt-1 text-xs text-gray-600">Recommended practice areas</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {report.readiness.areas.map((area) => (
                          <li key={area} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-gray-700 ring-1 ring-inset ring-gray-200">
                            {area}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Competencies + per-question scores */}
        <section aria-label="Score breakdown" className="mb-5 grid gap-5 lg:grid-cols-2">
          {report.dimensions.length > 0 && (
            <div className={cardClass}>
              <h2 className={cardTitle}>Competency breakdown</h2>
              <p className="mt-1 text-xs text-gray-500">Scores out of 100. The lowest score is flagged as the focus area.</p>
              <ul className="mt-4 space-y-4">
                {report.dimensions.map((d) => (
                  <ScoreMeter key={d.key} label={d.label} score={d.score} focus={weakest?.key === d.key} />
                ))}
              </ul>
            </div>
          )}

          <div className={`${cardClass} ${report.dimensions.length === 0 ? "lg:col-span-2" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={cardTitle}>Score by question</h2>
              {report.practice_avg > 0 && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    report.improvement_pct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <TrendingUp size={12} aria-hidden="true" />
                  {report.improvement_pct >= 0 ? "+" : ""}{report.improvement_pct}% vs practice
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Each bar is the score for one answer, out of 10.</p>
            {barData.length > 0 ? (
              <figure className="mt-4" aria-label="Score by question">
                <figcaption className="sr-only">
                  {barData.map((d) => `${d.name}: ${d.Score.toFixed(1)} out of 10`).join(". ")}
                </figcaption>
                <div aria-hidden="true">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                        formatter={(value: number) => [value.toFixed(1), "Score"]}
                      />
                      <Bar dataKey="Score" fill="#2557a7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </figure>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No answers were scored.</p>
            )}
          </div>
        </section>

        {/* Strengths & improvements */}
        {(report.strengths.length > 0 || report.areas_to_improve.length > 0) && (
          <section aria-label="Strengths and improvements" className="mb-5 grid gap-5 lg:grid-cols-2">
            {report.strengths.length > 0 && (
              <div className={cardClass}>
                <h2 className={`${cardTitle} flex items-center gap-2`}>
                  <Trophy size={15} className="text-[#2557a7]" aria-hidden="true" />
                  Strengths
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.areas_to_improve.length > 0 && (
              <div className={cardClass}>
                <h2 className={`${cardTitle} flex items-center gap-2`}>
                  <AlertCircle size={15} className="text-amber-600" aria-hidden="true" />
                  Areas to improve
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {report.areas_to_improve.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <ChevronRight size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Weakest answers */}
        {report.redo_questions.length > 0 && (
          <section aria-label="Questions to redo" className={`mb-5 ${cardClass}`}>
            <h2 className={`${cardTitle} flex items-center gap-2`}>
              <RotateCcw size={15} className="text-[#2557a7]" aria-hidden="true" />
              Redo these questions
            </h2>
            <ul className="mt-3 space-y-3">
              {report.redo_questions.map((q) => (
                <li key={q.num} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">Q{q.num}: {q.text}</p>
                    {q.issue && <p className="mt-1 text-sm text-gray-600">{q.issue}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ScoreChip score={q.score} />
                    <button
                      type="button"
                      onClick={() => router.push(report.practice_href)}
                      className="rounded-lg bg-[#2557a7] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1e4a8f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
                    >
                      Practice this
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Question breakdown */}
        <section aria-label="Question-by-question breakdown" className={`mb-5 ${cardClass}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={cardTitle}>Question-by-question breakdown</h2>
            <span className="text-xs text-gray-400">Select a question to see feedback</span>
          </div>
          <div className="mt-4 space-y-2">
            {report.questions.map((q) => (
              <QuestionRow key={q.num} q={q} />
            ))}
          </div>
        </section>

        {/* Coding round performance */}
        {report.coding_round && (
          <CodingPerformanceSection data={report.coding_round} />
        )}

        {/* Hinglish Note */}
        {report.hinglish_phrases.length > 0 && (
          <section aria-label="Hinglish phrases" className={`mb-5 ${cardClass}`}>
            <h2 className={`${cardTitle} flex items-center gap-2`}>
              <MessageSquare size={15} className="text-gray-600" aria-hidden="true" />
              Hinglish detected
            </h2>
            <p className="mb-3 mt-1 text-xs text-gray-500">
              {report.hinglish_phrases.length} phrase{report.hinglish_phrases.length > 1 ? "s were" : " was"} in Hinglish. In your actual interview, try the English alternatives below.
            </p>
            <div className="space-y-2">
              {report.hinglish_phrases.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-gray-700">&ldquo;{p.original}&rdquo;</span>
                  <span className="mt-1 text-gray-400" aria-hidden="true">→</span>
                  <span className="mt-1 font-medium text-gray-700">&ldquo;{p.english}&rdquo;</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action plan / reattempt / interviewer perspective (only when the backend provides them) */}
        {(report.action_plan.length > 0 || report.suggested_reattempt || report.interviewer_perspective) && (
          <section aria-label="Next steps" className="mb-5 grid gap-5 lg:grid-cols-2">
            {(report.action_plan.length > 0 || report.suggested_reattempt) && (
              <div className={cardClass}>
                <h2 className={`${cardTitle} flex items-center gap-2`}>
                  <ListChecks size={15} className="text-[#2557a7]" aria-hidden="true" />
                  Action plan
                </h2>
                {report.action_plan.length > 0 && (
                  <ol className="mt-3 space-y-2.5">
                    {report.action_plan.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2557a7]/10 text-[11px] font-semibold text-[#2557a7]">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                )}
                {report.suggested_reattempt && (
                  <p className="mt-4 rounded-lg border border-[#2557a7]/15 bg-[#2557a7]/5 p-3 text-sm text-[#2557a7]">
                    <strong>Suggested reattempt:</strong> {report.suggested_reattempt}
                  </p>
                )}
              </div>
            )}
            {report.interviewer_perspective && (
              <div className={cardClass}>
                <h2 className={`${cardTitle} flex items-center gap-2`}>
                  <BookOpen size={15} className="text-[#2557a7]" aria-hidden="true" />
                  Interviewer&apos;s perspective
                </h2>
                <blockquote className="mt-3 rounded-lg border border-[#2557a7]/15 bg-[#2557a7]/5 p-3 text-sm italic leading-relaxed text-gray-700">
                  &ldquo;{report.interviewer_perspective}&rdquo;
                </blockquote>
              </div>
            )}
          </section>
        )}

        {/* Footer action buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/mock-interview/live")}
            className="flex items-center gap-2 rounded-lg bg-[#2557a7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e4a8f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Take Another Mock Interview
          </button>
          <button
            type="button"
            onClick={() => router.push(report.practice_href)}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]"
          >
            Practice Weak Questions
          </button>
          <button
            type="button"
            onClick={() => router.push("/mock-interview/history")}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]"
          >
            View History
          </button>
        </div>
      </div>
    </>
  );
}
