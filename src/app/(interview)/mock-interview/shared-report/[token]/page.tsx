"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart2,
  MessageSquare,
  TrendingUp,
  Award,
} from "lucide-react";
import { getSharedReport, ReportResponse } from "@/api/mockInterviewApi";

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke="#2557a7" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={circ * (1 - pct)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</span>
        <span className="text-[10px] text-gray-400 font-semibold">/ 10</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getSharedReport(token)
      .then(setReport)
      .catch(() => setError("This report link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading shared report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-sm text-gray-500">{error ?? "This report does not exist."}</p>
          <p className="text-xs text-gray-400 mt-2">Share links expire after 7 days.</p>
        </div>
      </div>
    );
  }

  const typeLabel = report.type?.replace("live_", "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Interview";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-3">
            <Award size={11} /> Shared Interview Report
          </div>
          <h1 className="text-xl font-bold text-gray-900">{typeLabel} Mock Interview Report</h1>
          <p className="text-xs text-gray-400 mt-1">
            Completed {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}{report.question_count ?? report.answers.length} questions
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Overall score */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <ScoreRing score={report.overall_score} />
          <div className="mt-3">
            {report.grade && (
              <span className="inline-block px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] text-sm font-bold rounded-full mb-2">
                Grade: {report.grade}
              </span>
            )}
            {report.performance_summary && (
              <p className="text-sm text-gray-600 leading-relaxed">{report.performance_summary}</p>
            )}
          </div>
        </div>

        {/* Score breakdown */}
        {report.scores && Object.keys(report.scores).filter((k) => k !== "overall").length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} className="text-[#2557a7]" />
              <p className="text-sm font-semibold text-gray-900">Score Breakdown</p>
            </div>
            <div className="space-y-3">
              {Object.entries(report.scores)
                .filter(([k]) => k !== "overall")
                .map(([key, val]) => val != null && (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 capitalize">{key.replace("_", " ")}</span>
                      <span className="text-xs font-bold text-gray-900">{(val as number).toFixed(1)}/10</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2557a7] rounded-full transition-all duration-700"
                        style={{ width: `${((val as number) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Strengths & improvement areas */}
        {((report.strengths?.length ?? 0) > 0 || (report.improvement_areas?.length ?? 0) > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(report.strengths?.length ?? 0) > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={13} className="text-[#2557a7]" />
                  <p className="text-xs font-semibold text-gray-900">Strengths</p>
                </div>
                <ul className="space-y-1.5">
                  {report.strengths!.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#2557a7] mt-0.5 shrink-0">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(report.improvement_areas?.length ?? 0) > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={13} className="text-[#2557a7]" />
                  <p className="text-xs font-semibold text-gray-900">Areas to Improve</p>
                </div>
                <ul className="space-y-1.5">
                  {report.improvement_areas!.map((a, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#2557a7] mt-0.5 shrink-0">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Per-question answers */}
        {report.answers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <MessageSquare size={13} className="text-[#2557a7]" />
              <p className="text-sm font-semibold text-gray-900">Question Breakdown</p>
            </div>
            <div className="divide-y divide-gray-100">
              {report.answers.map((ans, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed flex-1">
                      <span className="text-[#2557a7] mr-1.5">Q{i + 1}.</span>
                      {ans.question_text}
                    </p>
                    <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${
                      ans.score >= 7 ? "bg-[#2557a7]/10 text-[#2557a7]"
                      : ans.score >= 5 ? "bg-gray-100 text-gray-600"
                      : "bg-gray-100 text-gray-400"
                    }`}>
                      {ans.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{ans.feedback}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Key points: {ans.key_points_hit}/{ans.key_points_total}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watermark */}
        <p className="text-center text-[10px] text-gray-300 pb-4">
          Shared via CareerBot Mock Interview · Link expires after 7 days
        </p>
      </div>
    </div>
  );
}
