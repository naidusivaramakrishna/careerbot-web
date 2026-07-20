"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Pencil,
  Sparkles,
} from "lucide-react";

interface TopAnalysisBarProps {
  totalMissing: number;
  onBack?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onViewMissingSkills?: () => void;
  downloadDisabled?: boolean;
  isSaving?: boolean;
  isEditing?: boolean;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function getScoreTone(score: number) {
  if (score >= 80) return { color: "#059669", track: "#D1FAE5", label: "Strong match" };
  if (score >= 60) return { color: "#D97706", track: "#FEF3C7", label: "Good match" };
  return { color: "#DC2626", track: "#FEE2E2", label: "Needs improvement" };
}

export default function TopAnalysisBar({
  totalMissing,
  onBack,
  onDownload,
  onEdit,
  onViewMissingSkills,
  downloadDisabled,
  isSaving,
  isEditing,
}: TopAnalysisBarProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 px-6 py-3 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur" aria-label="Match report actions">
      <div className="flex min-h-11 items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to scans
          </button>
        )}

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div>
          <h1 className="text-sm font-extrabold tracking-[-0.01em] text-slate-950">Match report</h1>
          <p className="hidden text-[11px] text-slate-500 md:block">Resume evidence compared with role requirements</p>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onDownload}
          disabled={downloadDisabled}
          aria-label="Download resume"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#d9dee6] bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onEdit}
          aria-label={isEditing ? "Close resume editor" : "Open resume editor"}
          className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isEditing
              ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Pencil size={17} aria-hidden="true" />
          {isEditing ? "Close editor" : "Edit resume"}
        </button>

        {totalMissing > 0 && (
          <button
            type="button"
            onClick={onViewMissingSkills}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2557a7] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(37,87,167,.8)] transition-all hover:-translate-y-0.5 hover:bg-[#1e4b94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Sparkles size={17} aria-hidden="true" />
            Review top fixes
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}

        {isSaving && <span className="sr-only" role="status">Saving resume</span>}
      </div>
    </header>
  );
}

export function MatchScoreSummary({
  matchScore,
  totalMissing,
  matchedSkills,
}: {
  matchScore: number;
  totalMissing: number;
  matchedSkills: number;
}) {
  const score = clamp(matchScore);
  const tone = getScoreTone(score);
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="grid min-h-[132px] grid-cols-[76px_minmax(0,1fr)] items-center gap-x-5 gap-y-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-x-6 sm:px-6" aria-labelledby="match-score-heading">
      <div className="relative h-[76px] w-[76px] shrink-0" aria-label={`Match score ${score} out of 100`}>
        <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90" aria-hidden="true">
          <circle cx="38" cy="38" r={radius} fill="none" stroke={tone.track} strokeWidth="9" />
          <circle cx="38" cy="38" r={radius} fill="none" stroke={tone.color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold" style={{ color: tone.color }}>{score}%</span>
      </div>

      <div className="min-w-0">
        <h2 id="match-score-heading" className="text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-slate-950">{tone.label}</h2>
        <p className="mt-2 max-w-[42ch] text-sm leading-6 text-slate-500">
          {totalMissing > 0 ? `${totalMissing} important gaps are holding back this application. Start with the highest-impact fixes below.` : "Your resume covers the requirements identified for this role."}
        </p>
      </div>

      <dl className="col-span-2 grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-100 pt-4">
        <Metric value={totalMissing} label="Missing" tone="danger" />
        <Metric value={matchedSkills} label="Matched" tone="success" />
      </dl>
    </section>
  );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: "danger" | "success" }) {
  return (
    <div className="flex min-w-[72px] items-center justify-center gap-2 px-3 text-center">
      <dd className={`text-lg font-extrabold ${tone === "danger" ? "text-red-600" : "text-emerald-600"}`}>{value}</dd>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
    </div>
  );
}
