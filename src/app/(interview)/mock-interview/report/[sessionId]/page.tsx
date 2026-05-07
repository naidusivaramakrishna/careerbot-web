"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport, shareReport, downloadReportPdf, ReportResponse } from "@/api/mockInterviewApi";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChevronLeft,
  Download,
  Share2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Mic,
  ChevronDown,
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

// ─── UI report shape ─────────────────────────────────────────────────────────

interface UiQuestion {
  num: number;
  text: string;
  practice_score: number;
  mock_score: number;
  duration_s: number;
  filler_count: number;
  feedback: string;
}

interface UiReport {
  session_id: string;
  date: string;
  duration_min: number;
  question_count: number;
  overall_score: number; // 0-100
  practice_avg: number;
  mock_avg: number;
  improvement_pct: number;
  pressure_handling: "Well" | "Needs Work";
  hinglish_phrases: { original: string; english: string }[];
  action_plan: string[];
  suggested_reattempt: string;
  interviewer_perspective: string;
  redo_questions: { num: number; text: string; score: number; issue: string }[];
  radar: { dimension: string; score: number }[];
  strengths: string[];
  areas_to_improve: string[];
  questions: UiQuestion[];
}

/** Map API ReportResponse → UI shape */
function mapReport(api: ReportResponse): UiReport {
  const answers = api.answers ?? [];
  const mockAvg = answers.length
    ? answers.reduce((s, a) => s + a.score, 0) / answers.length
    : 0;
  const overallScore = api.overall_score <= 10
    ? Math.round(api.overall_score * 10)
    : api.overall_score;

  return {
    session_id: api.session_id,
    date: new Date(api.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    duration_min: api.duration_min ?? 0,
    question_count: answers.length || api.question_count || 0,
    overall_score: overallScore,
    practice_avg: api.practice_avg ?? 0,
    mock_avg: api.mock_avg ?? parseFloat(mockAvg.toFixed(1)),
    improvement_pct: api.improvement_pct ?? 0,
    pressure_handling: api.pressure_tag === "pressure_affected" ? "Needs Work" : "Well",
    hinglish_phrases: api.hinglish_phrases ?? [],
    action_plan: api.action_plan ?? api.recommendations ?? [],
    suggested_reattempt: api.suggested_reattempt ?? api.performance_summary ?? "",
    interviewer_perspective: api.interviewer_perspective ?? "",
    redo_questions: (api.redo_questions ?? answers
      .filter((a) => a.score < 6)
      .map((a, i) => ({ num: i + 1, text: a.question_text, score: a.score, issue: a.feedback }))
      .slice(0, 2)),
    radar: api.radar ?? [
      { dimension: "HR Readiness", score: Math.round((api.scores?.hr ?? api.scores?.overall ?? 0) * 10) },
      { dimension: "Communication", score: Math.round((api.scores?.communication ?? api.scores?.overall ?? 0) * 10) },
      { dimension: "Confidence", score: Math.round((api.scores?.confidence ?? api.scores?.overall ?? 0) * 10) },
    ],
    strengths: api.strengths ?? [],
    areas_to_improve: api.improvement_areas ?? [],
    questions: answers.map((a, i) => ({
      num: i + 1,
      text: a.question_text,
      practice_score: a.score, // API doesn't split practice/mock per Q; use same
      mock_score: a.score,
      duration_s: a.duration_s ?? 0,
      filler_count: a.filler_count ?? 0,
      feedback: a.feedback,
    })),
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreColor(score: number, max = 10) {
  const pct = score / max;
  if (pct >= 0.7) return "text-[#2557a7]";
  if (pct >= 0.5) return "text-gray-500";
  return "text-gray-500";
}

function scoreBg(score: number, max = 10) {
  const pct = score / max;
  if (pct >= 0.7) return "bg-[#2557a7]/10 text-[#2557a7]";
  if (pct >= 0.5) return "bg-gray-100 text-gray-600";
  return "bg-gray-200 text-gray-700";
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 100, size = 120 }: { score: number; max?: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const pct = score / max;
  const offset = circ * (1 - pct);
  const color = pct >= 0.7 ? "#2557a7" : pct >= 0.5 ? "#6b7280" : "#9ca3af";
  const label = pct >= 0.8 ? "Excellent" : pct >= 0.7 ? "Great" : pct >= 0.6 ? "Good" : pct >= 0.5 ? "Average" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000"
        />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
          / {max}
        </text>
      </svg>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Question row ─────────────────────────────────────────────────────────────

function pressureTag(mockScore: number, practiceScore: number) {
  if (mockScore < practiceScore - 3) return { label: "Pressure affected", cls: "bg-gray-100 text-gray-600" };
  return { label: "Handled well", cls: "bg-[#2557a7]/10 text-[#2557a7]" };
}

function QuestionRow({ q }: { q: UiQuestion }) {
  const [open, setOpen] = useState(false);
  const delta = q.mock_score - q.practice_score;
  const pressure = pressureTag(q.mock_score, q.practice_score);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">
          {q.num}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-800 truncate">{q.text}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pressure.cls}`}>
            {pressure.label}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(q.mock_score)}`}>
            {q.mock_score.toFixed(1)}/10
          </span>
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${delta >= 0 ? "text-[#2557a7]" : "text-gray-500"}`}>
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
          </span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
              <p className="text-[10px] text-gray-500 mb-0.5">Practice</p>
              <p className={`text-sm font-bold ${scoreColor(q.practice_score)}`}>{q.practice_score.toFixed(1)}</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
              <p className="text-[10px] text-gray-500 mb-0.5">Mock</p>
              <p className={`text-sm font-bold ${scoreColor(q.mock_score)}`}>{q.mock_score.toFixed(1)}</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
              <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
              <p className="text-sm font-bold text-gray-800">{q.duration_s}s</p>
            </div>
            <div className={`text-center p-2 rounded-lg border ${pressure.cls}`}>
              <p className="text-[10px] mb-0.5 opacity-70">Pressure</p>
              <p className="text-[10px] font-bold leading-tight">{pressure.label}</p>
            </div>
          </div>
          {q.filler_count > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Mic size={11} className="text-gray-400" />
              <p className="text-xs text-gray-600">{q.filler_count} filler word{q.filler_count > 1 ? "s" : ""} detected</p>
            </div>
          )}
          <p className="text-xs text-gray-600 leading-relaxed">{q.feedback}</p>
        </div>
      )}
    </div>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────

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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
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
              className="w-full py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
    getReport(sessionId)
      .then((data) => setReport(mapReport(data)))
      .catch(() => setReportError("Could not load this report. It may have been deleted or is unavailable."))
      .finally(() => setReportLoading(false));
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
    Practice: q.practice_score,
    Mock: q.mock_score,
  }));

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading report…</p>
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

  return (
    <>
      {showShare && <ShareModal sessionId={sessionId} onClose={() => setShowShare(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Mock Interview
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 shadow-sm transition-all"
          >
            <Share2 size={13} />
            Share Report
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2557a7] text-white rounded-xl text-xs font-semibold hover:bg-[#1e4a8f] shadow-sm transition-all disabled:opacity-60"
          >
            {pdfLoading ? (
              <><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating…</>
            ) : (
              <><Download size={13} /> Download PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Report header */}
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] px-6 py-6 mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#2557a7] to-[#5b8fd6]" />
        {/* Decorative blob */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#2557a7]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mock Interview Report</h1>
          <div className="flex items-center gap-4 mt-1.5 text-gray-500 text-xs">
            <span>{report.date}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {report.duration_min} min
            </span>
            <span>{report.question_count} questions</span>
          </div>
        </div>
        <div className="relative z-10">
          <ScoreRing score={report.overall_score} />
        </div>
      </div>

      {/* Score comparison bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-800">Score Comparison</p>
          <div
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              report.improvement_pct >= 0
                ? "bg-[#2557a7]/10 text-[#2557a7]"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <TrendingUp size={11} />
            +{report.improvement_pct}% vs practice
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Your practice average was {report.practice_avg}. Your mock score is {report.mock_avg}. You improved by {report.improvement_pct}%.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              formatter={(value: number) => [value.toFixed(1), ""]}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="Practice" fill="#c5d4ec" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mock" fill="#2557a7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Radar chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5">
          <p className="text-sm font-bold text-gray-800 mb-4">Performance Dimensions</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={report.radar}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#2557a7"
                fill="#2557a7"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {report.radar.map((d) => (
              <div key={d.dimension} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{d.dimension}</span>
                <span className={`font-bold ${scoreColor(d.score, 100)}`}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5">
            <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-[#2557a7]" />
              Top 3 Strengths
            </p>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-[#2557a7] mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5">
            <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-gray-500" />
              Areas to Improve
            </p>
            <ul className="space-y-2">
              {report.areas_to_improve.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5 shrink-0">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* TOP 2 REDO QUESTIONS */}
      {report.redo_questions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
          <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-gray-500" />
            Redo These Questions
          </p>
          <div className="space-y-3">
            {report.redo_questions.map((q) => (
              <div key={q.num} className="flex items-start justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800 mb-0.5">Q{q.num}: {q.text}</p>
                  <p className="text-xs text-gray-600">{q.issue}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{q.score.toFixed(1)}/10</span>
                  <button
                    onClick={() => router.push("/mock-interview/practice")}
                    className="text-[10px] font-bold px-2.5 py-1.5 bg-[#2557a7] text-white rounded-lg hover:bg-[#1e4a8f] transition-all whitespace-nowrap"
                  >
                    Practice This
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-800">Question-by-Question Breakdown</p>
          <span className="text-[10px] text-gray-400 hidden sm:block">Click any row to expand transcript + feedback</span>
        </div>
        <div className="space-y-2">
          {report.questions.map((q) => (
            <QuestionRow key={q.num} q={q} />
          ))}
        </div>
      </div>

      {/* Hinglish Note */}
      {report.hinglish_phrases.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
          <p className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <MessageSquare size={14} className="text-gray-600" />
            Hinglish Detected
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {report.hinglish_phrases.length} phrase{report.hinglish_phrases.length > 1 ? "s were" : " was"} in Hinglish. In your actual interview, try the English alternatives below.
          </p>
          <div className="space-y-2">
            {report.hinglish_phrases.map((p, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 shrink-0">&ldquo;{p.original}&rdquo;</span>
                <span className="text-gray-400 mt-1">→</span>
                <span className="text-gray-700 font-medium mt-1">&ldquo;{p.english}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan + Suggested Reattempt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5">
          <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ListChecks size={14} className="text-[#2557a7]" />
            Action Plan
          </p>
          <ol className="space-y-2">
            {report.action_plan.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="w-4 h-4 rounded-full bg-[#2557a7]/10 text-[#2557a7] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
          <div className="mt-4 p-3 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl">
            <p className="text-xs text-[#2557a7]">
              <strong>Suggested reattempt:</strong> {report.suggested_reattempt}
            </p>
          </div>
        </div>

        {/* Interviewer's Perspective */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5">
          <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-[#2557a7]" />
            Interviewer&apos;s Perspective
          </p>
          <div className="p-3 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl">
            <p className="text-xs text-gray-700 leading-relaxed italic">
              &ldquo;{report.interviewer_perspective}&rdquo;
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${report.pressure_handling === "Well" ? "bg-[#2557a7]/10 text-[#2557a7]" : "bg-gray-100 text-gray-600"}`}>
              Pressure Handling: {report.pressure_handling}
            </span>
          </div>
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => router.push("/mock-interview/live")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] shadow-md transition-all"
        >
          <RotateCcw size={14} />
          Take Another Mock Interview
        </button>
        <button
          onClick={() => router.push("/mock-interview/practice")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all"
        >
          Practice Weak Questions
        </button>
        <button
          onClick={() => router.push("/mock-interview/history")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all"
        >
          View History
        </button>
      </div>
    </div>
    </>
  );
}
