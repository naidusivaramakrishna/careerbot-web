"use client";

import { PageHeading, PanelHeading } from "../../_components/MockUI";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport, downloadReportPdf, ReportResponse, ReportAnswer } from "@/api/mockInterviewApi";
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
  Trophy,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
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
  // null = this answer was excluded/skipped from scoring, never a fabricated 0.
  mock_score: number | null;
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
  const scoredAnswers = answers.filter((a): a is ReportAnswer & { score: number } => typeof a.score === "number");
  const mockAvg = scoredAnswers.length
    ? scoredAnswers.reduce((s, a) => s + a.score, 0) / scoredAnswers.length
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
      .filter((q): q is typeof q & { score: number } => typeof q.score === "number" && q.score < 6)
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

function ScoreChip({ score, max = 10 }: { score: number | null; max?: number }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
        Not scored
      </span>
    );
  }
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
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

  const barData = (report?.questions ?? [])
    .filter((q): q is typeof q & { mock_score: number } => typeof q.mock_score === "number")
    .map((q) => ({
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
  return (
    <main className="mi-page mi-report-page">
      <button className="mi-back-link" onClick={() => router.push("/mock-interview/live")}><ChevronLeft size={17} />Back</button>
      <PageHeading eyebrow="REFLECT. REFINE. REPEAT." title="Mock Interview Report" description="Your conversation, in perspective. Find what worked and what to take into your next attempt." action={<button className="mi-button mi-button-secondary" onClick={handleDownloadPdf} disabled={pdfLoading}>{pdfLoading ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}{pdfLoading ? "Generating…" : "Download PDF"}</button>} />
      <div className="mi-report-meta"><span>{report.interview_label}</span><span>{report.date}</span><span><Clock size={15} />{report.duration_min} min</span><span>{report.question_count} questions</span></div>
      {report.not_scored && <div role="status" className="mi-notice"><AlertCircle size={20} /><p>This interview could not be scored, so the results below are not a reliable measure of performance.</p></div>}
      <section id="mi-report-overview" aria-label="Overall result" className="mi-panel mi-report-result"><div className="mi-report-score"><ScoreRing score={report.overall_score} /><div><p className="mi-eyebrow">OVERALL SCORE</p><h2>{report.performance_level || "Your session results"}</h2>{report.grade && <p>Grade <strong>{report.grade}</strong></p>}</div></div><div className="mi-report-result-copy"><h2>Executive summary</h2><p>{report.summary || "No written summary was provided for this session."}</p>{report.readiness && <div className="mi-report-readiness"><CheckCircle2 size={18} /><strong>{report.readiness.ready ? "Interview ready" : "Not yet interview-ready"}</strong></div>}</div></section>
      <nav className="mi-report-nav" aria-label="Report sections"><a href="#mi-report-overview">Overview</a><a href="#mi-report-scores">Score breakdown</a><a href="#mi-report-answers">Your answers</a><a href="#mi-report-next">Next steps</a></nav>
      <div className="mi-report-workspace">
        <div className="mi-report-main">
          <section id="mi-report-scores" aria-label="Score breakdown" className="mi-panel"><PanelHeading title="Score breakdown" description="A closer look at the skills and answers behind your result." /><div className="mi-report-score-columns">{report.dimensions.length > 0 && <div><h3>Competency breakdown</h3><p className="mi-caption">Scores out of 100. The lowest score is flagged as the focus area.</p><ul className="mi-score-meters">{report.dimensions.map(d => <ScoreMeter key={d.key} label={d.label} score={d.score} focus={weakest?.key === d.key} />)}</ul></div>}<div><h3>Score by question</h3><p className="mi-caption">Each bar is the score for one answer, out of 10.</p>{report.practice_avg > 0 && <span className="mi-pill"><TrendingUp size={13} />{report.improvement_pct >= 0 ? "+" : ""}{report.improvement_pct}% vs practice</span>}{barData.length > 0 ? <figure aria-label="Score by question"><figcaption className="sr-only">{barData.map(d => d.name + ": " + d.Score.toFixed(1) + " out of 10").join(". ")}</figcaption><div aria-hidden="true"><ResponsiveContainer width="100%" height={200}><BarChart data={barData} barCategoryGap="35%"><CartesianGrid strokeDasharray="3 5" stroke="rgba(37,87,167,.1)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={24} /><Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid rgba(37,87,167,.14)", fontSize: "12px" }} formatter={(value: number) => [value.toFixed(1), "Score"]} /><Bar dataKey="Score" fill="#2557a7" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></figure> : <p>No answers were scored.</p>}</div></div></section>
          {(report.strengths.length > 0 || report.areas_to_improve.length > 0) && <section aria-label="Strengths and improvements" className="mi-feedback-grid">{report.strengths.length > 0 && <article className="mi-panel"><span className="mi-icon-tile"><Trophy size={23} /></span><h2>Strengths</h2><ul className="mi-feedback-list">{report.strengths.map((item, index) => <li key={index}><CheckCircle2 size={17} />{item}</li>)}</ul></article>}{report.areas_to_improve.length > 0 && <article className="mi-panel"><span className="mi-icon-tile"><TrendingUp size={23} /></span><h2>Areas to improve</h2><ul className="mi-feedback-list">{report.areas_to_improve.map((item, index) => <li key={index}><ChevronRight size={17} />{item}</li>)}</ul></article>}</section>}
          <section id="mi-report-answers" aria-label="Question-by-question breakdown" className="mi-panel"><PanelHeading title="Question-by-question breakdown" description="Select a question to see feedback" action={<span className="mi-pill mi-pill-neutral">{report.questions.length} answers</span>} /><div className="mi-question-list">{report.questions.map(question => <QuestionRow key={question.num} q={question} />)}</div></section>
          {report.coding_round && <CodingPerformanceSection data={report.coding_round} />}
          {report.hinglish_phrases.length > 0 && <section aria-label="Hinglish phrases" className="mi-panel"><PanelHeading title="Hinglish detected" description={report.hinglish_phrases.length + " phrase" + (report.hinglish_phrases.length > 1 ? "s were" : " was") + " in Hinglish. In your actual interview, try the English alternatives below."} />{report.hinglish_phrases.map((phrase, index) => <div className="mi-language-row" key={index}><span>{phrase.original}</span><ChevronRight size={17} /><strong>{phrase.english}</strong></div>)}</section>}
        </div>
        <aside className="mi-report-aside" id="mi-report-next">
          <section className="mi-panel mi-report-next-card"><span className="mi-icon-tile"><ListChecks size={24} /></span><p className="mi-eyebrow">MAKE YOUR NEXT ATTEMPT COUNT</p><h2>Your next steps</h2>{report.readiness && report.readiness.areas.length > 0 && <><h3>Recommended practice areas</h3><div className="mi-area-chips">{report.readiness.areas.map(area => <span className="mi-pill" key={area}>{area}</span>)}</div></>}{(report.action_plan.length > 0 || report.suggested_reattempt) && <section aria-label="Next steps"><h3>Action plan</h3><ol className="mi-action-list">{report.action_plan.map((item, index) => <li key={index}><span>{index + 1}</span>{item}</li>)}</ol>{report.suggested_reattempt && <p className="mi-notice"><strong>Suggested reattempt:</strong> {report.suggested_reattempt}</p>}</section>}<div className="mi-stacked-actions"><button className="mi-button" onClick={() => router.push("/mock-interview/live")}><RotateCcw size={16} />Take Another Mock Interview</button><button className="mi-button mi-button-secondary" onClick={() => router.push(report.practice_href)}>Practice Weak Questions</button><button className="mi-text-button" onClick={() => router.push("/mock-interview/history")}>View History <ChevronRight size={16} /></button></div></section>
          {report.redo_questions.length > 0 && <section aria-label="Questions to redo" className="mi-panel"><h2>Redo these questions</h2><ul className="mi-redo-list">{report.redo_questions.map(question => <li key={question.num}><p><strong>Q{question.num}:</strong> {question.text}</p>{question.issue && <p className="mi-caption">{question.issue}</p>}<div><ScoreChip score={question.score} /><button className="mi-text-button" onClick={() => router.push(report.practice_href)}>Practice this <ChevronRight size={14} /></button></div></li>)}</ul></section>}
          {report.interviewer_perspective && <section className="mi-panel"><span className="mi-icon-tile"><BookOpen size={22} /></span><h2>Interviewer&apos;s perspective</h2><blockquote>{report.interviewer_perspective}</blockquote></section>}
        </aside>
      </div>
    </main>
  );
}
