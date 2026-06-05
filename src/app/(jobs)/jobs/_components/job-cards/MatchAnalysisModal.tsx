"use client";

import { useEffect, useState, type JSX } from "react";
import { createPortal } from "react-dom";
import { getMatchExplanation } from "@/api/insightsApi";
import type { MatchExplanationResponse } from "@/api/insightsApi";
import {
  parseResumeFromProfile,
  parseJdByJob,
  createPremiumAction,
  executePremiumAction,
} from "@/api/premiumApi";
import type { PendingActionResponse, ExecuteActionResponse } from "@/api/premiumApi";

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
}

type View = "pick" | "basic" | "premium";

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong:  { label: "Strong Match",  color: "#16a34a", bg: "rgba(220,252,231,0.9)" },
  good:    { label: "Good Match",    color: "#2557a7", bg: "rgba(219,234,254,0.9)" },
  partial: { label: "Partial Match", color: "#d97706", bg: "rgba(254,243,199,0.9)" },
  low:     { label: "Low Match",     color: "#dc2626", bg: "rgba(254,226,226,0.9)" },
};

/* ── Picker view ─────────────────────────────────────────────────────────── */
function PickerView({ jobTitle, company, onSelect, onClose }: {
  jobTitle: string; company: string;
  onSelect: (v: "basic" | "premium") => void;
  onClose: () => void;
}) {
  return (
    <div
      className="relative w-full max-w-2xl rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden px-8 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg,#5896d7 0%,#2557a7 50%,#1f4e98 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20 blur-3xl bg-blue-500" />
        <div className="pointer-events-none absolute bottom-0 left-12 w-28 h-28 rounded-full opacity-10 blur-2xl bg-indigo-400" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>AI Match Analysis</p>
            </div>
            <h2 className="text-[20px] font-extrabold text-white leading-tight">Choose Analysis Type</h2>
            <p className="text-[12.5px] mt-1 truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{jobTitle} · {company}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-0.5 shrink-0"
            style={{ color: "rgba(255,255,255,0.8)" }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="p-8 grid grid-cols-2 gap-5">

        {/* Basic — Free */}
        <button
          type="button"
          onClick={() => onSelect("basic")}
          className="group flex flex-col items-start rounded-2xl border-2 border-[#2557a7]/20 bg-[#f5f8ff] hover:border-[#2557a7] hover:bg-[#eaf0ff] transition-all p-6 text-left focus:outline-none"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm3.707 6.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            FREE
          </span>
          <p className="text-[16px] font-extrabold text-[#1f4e98] group-hover:text-[#2557a7] transition-colors mb-2">
            Basic Analysis
          </p>
          <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
            Understand your match score across 5 dimensions — skills, title, experience, education and location.
          </p>
          <ul className="space-y-2.5 w-full flex-1">
            {["Score breakdown", "Matched & missing skills", "Plain-English detail", "Instant result"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[12px] text-gray-600">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 w-full py-3 rounded-xl text-[13px] font-bold text-center text-[#2557a7] border-2 border-[#2557a7]/30 group-hover:bg-[#2557a7] group-hover:text-white transition-all">
            View Basic Analysis →
          </div>
        </button>

        {/* Premium — Locked */}
        <button
          type="button"
          onClick={() => onSelect("premium")}
          className="group flex flex-col items-start rounded-2xl border-2 border-amber-200 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-50 transition-all p-6 text-left focus:outline-none relative overflow-hidden"
        >
          <div className="pointer-events-none absolute top-0 right-0 w-24 h-24 opacity-5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-600">
              <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5l-9-4z" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            PREMIUM
          </span>
          <p className="text-[16px] font-extrabold text-amber-900 mb-2">Premium Analysis</p>
          <p className="text-[12px] text-amber-700/70 leading-relaxed mb-5">
            AI-powered deep analysis with personalised suggestions to improve your match score.
          </p>
          <ul className="space-y-2.5 w-full flex-1">
            {["Everything in Basic", "AI improvement tips", "Resume tailoring hints", "Priority action plan"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[12px] text-amber-800">
                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 w-full py-3 rounded-xl text-[13px] font-bold text-center text-amber-700 border-2 border-amber-300 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
            Unlock Premium →
          </div>
        </button>

      </div>
    </div>
  );
}

/* ── Dimension icons ─────────────────────────────────────────────────────── */
const DIM_ICONS: Record<string, JSX.Element> = {
  Skills: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  "Job Title": (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Experience: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Education: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  Location: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

/* ── Dimension color palette — softer, less aggressive ───────────────────── */
function dimPalette(score: number) {
  if (score >= 70) return { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" };
  if (score >= 40) return { color: "#d97706", bg: "#fefce8", border: "#fde68a" };
  if (score >= 15) return { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
  return              { color: "#e11d48", bg: "#fff5f5", border: "#fecdd3" };
}

/* ── Basic analysis view ─────────────────────────────────────────────────── */
function BasicView({ jobId, jobTitle, company, onBack, onClose }: {
  jobId: string; jobTitle: string; company: string;
  onBack: () => void; onClose: () => void;
}) {
  const [data, setData]         = useState<MatchExplanationResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [mounted, setMounted]   = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setLoading(true);
    setError("");
    getMatchExplanation(jobId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
          timer = setTimeout(() => { if (!cancelled) setMounted(true); }, 60);
        }
      })
      .catch(() => { if (!cancelled) { setError("Could not load match analysis. Please try again."); setLoading(false); } });
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [jobId]);

  const band    = data?.band ?? "low";
  const bandCfg = BAND_CONFIG[band] ?? BAND_CONFIG.low;

  const dims = data ? [
    {
      label: "Skills", score: data.explanation.skills.score,
      detail: data.explanation.skills.detail,
      matched: data.explanation.skills.matched ?? [] as string[],
      missing: data.explanation.skills.missing ?? [] as string[],
      meta: null,
    },
    {
      label: "Job Title", score: data.explanation.title.score,
      detail: data.explanation.title.detail,
      matched: [] as string[], missing: [] as string[],
      meta: data.explanation.title.job_title ? `Required: ${data.explanation.title.job_title}` : null,
    },
    {
      label: "Experience", score: data.explanation.experience.score,
      detail: data.explanation.experience.detail,
      matched: [] as string[], missing: [] as string[],
      meta: data.explanation.experience.job_range ? `Required: ${data.explanation.experience.job_range}` : null,
    },
    {
      label: "Education", score: data.explanation.education.score,
      detail: data.explanation.education.detail,
      matched: [] as string[], missing: [] as string[],
      meta: data.explanation.education.job_level ? `Required: ${data.explanation.education.job_level}` : null,
    },
    {
      label: "Location", score: data.explanation.location.score,
      detail: data.explanation.location.detail,
      matched: [] as string[], missing: [] as string[],
      meta: data.explanation.location.job_location ? `Location: ${data.explanation.location.job_location}` : null,
    },
  ] : [];

  const allMatched = data?.explanation.skills.matched ?? [];
  const allMissing = data?.explanation.skills.missing ?? [];
  const totalMatched = allMatched.length;
  const totalMissing = allMissing.length;

  const CHIP_PREVIEW = 8;
  const totalHidden = allMissing.length > CHIP_PREVIEW && !showAllSkills
    ? allMissing.length - CHIP_PREVIEW
    : 0;

  // AI recommendations derived from weakest dims
  const aiRecs: string[] = data ? [
    allMissing.length > 0
      ? `Add ${allMissing.slice(0, 2).join(" and ")} to your resume skills section`
      : null,
    data.explanation.title.score < 60
      ? `Update your job title to better align with "${data.explanation.title.job_title ?? "the required role"}"`
      : null,
    data.explanation.experience.score < 60
      ? "Highlight specific achievements and metrics in your experience section"
      : null,
  ].filter(Boolean) as string[] : [];

  return (
    <div
      className="relative w-full max-w-xl rounded-3xl bg-white overflow-hidden flex flex-col"
      style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.22)", maxHeight: "92vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden px-6 pt-5 pb-5 shrink-0"
        style={{ background: "linear-gradient(145deg, #4a7cc9 0%, #2557a7 55%, #1d4a94 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ background: bandCfg.color }} />
        <div className="pointer-events-none absolute bottom-0 left-10 w-24 h-24 rounded-full opacity-10 blur-2xl bg-blue-400" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={onBack} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.85)" }} aria-label="Back">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.80)" }}>AI Match Analysis · Free</p>
              <h2 className="text-[15px] font-extrabold text-white leading-tight truncate">{jobTitle}</h2>
              <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {data && (() => {
              const circR = 23;
              const circ  = 2 * Math.PI * circR;
              const off   = circ - (data.score / 100) * circ;
              return (
                <div className="flex flex-col items-center gap-1">
                  <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="hdr-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={bandCfg.color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={bandCfg.color} stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <circle cx="30" cy="30" r={circR} stroke="rgba(255,255,255,0.10)" strokeWidth="3.5" fill="none" />
                    <circle
                      cx="30" cy="30" r={circR}
                      stroke="url(#hdr-ring-grad)"
                      strokeWidth="3.5" fill="none"
                      strokeDasharray={circ}
                      strokeDashoffset={mounted ? off : circ}
                      strokeLinecap="round"
                      transform="rotate(-90 30 30)"
                      style={{
                        transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)",
                        filter: `drop-shadow(0 0 5px ${bandCfg.color}70)`,
                      }}
                    />
                    <text x="30" y="27" textAnchor="middle" fontSize="13" fontWeight="800" fill="white" dominantBaseline="middle">
                      {Math.round(data.score)}%
                    </text>
                    <text x="30" y="39" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="rgba(255,255,255,0.65)" dominantBaseline="middle" style={{ letterSpacing: "0.5px" }}>
                      MATCH
                    </text>
                  </svg>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.90)", border: "1px solid rgba(255,255,255,0.20)" }}
                  >
                    {bandCfg.label}
                  </span>
                </div>
              );
            })()}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.70)" }} aria-label="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Skills summary strip */}
        {data && (totalMatched > 0 || totalMissing > 0) && (
          <div className="relative flex items-center gap-3 mt-4 pt-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
            {totalMatched > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#6ee7b7" }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {totalMatched} matched
              </span>
            )}
            {totalMissing > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#fca5a5" }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {totalMissing} to add
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="overflow-y-auto flex-1 px-5 py-4" style={{ scrollbarWidth: "none" }}>
        {loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-t-[#2557a7] animate-spin" />
            </div>
            <p className="text-[13px] font-semibold text-gray-700">Analysing your match…</p>
            <p className="text-[11px] text-gray-400 mt-1">Comparing your profile to the job</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-gray-800">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-2">
            {dims.map((dim, idx) => {
              const pal = dimPalette(dim.score);
              const isSkills = dim.label === "Skills";
              const visibleMissing = isSkills && !showAllSkills
                ? dim.missing.slice(0, CHIP_PREVIEW)
                : dim.missing;
              const halfIdx = Math.ceil(visibleMissing.length / 2);
              const criticalGaps = visibleMissing.slice(0, halfIdx);
              const additionalSkills = visibleMissing.slice(halfIdx);

              return (
                <div
                  key={dim.label}
                  className="rounded-2xl border p-3.5"
                  style={{
                    borderColor: pal.border,
                    background: pal.bg,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 0.45s ease ${idx * 65}ms, transform 0.45s ease ${idx * 65}ms`,
                  }}
                >
                  {/* Row: icon + label | score */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${pal.color}18`, color: pal.color }}
                    >
                      {DIM_ICONS[dim.label]}
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 flex-1">{dim.label}</span>
                    <span className="text-[13.5px] font-black tabular-nums shrink-0" style={{ color: pal.color }}>
                      {Math.round(dim.score)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">/100</span>
                  </div>

                  {/* Progress bar — thinner */}
                  <div className="h-[3px] rounded-full bg-white/70 overflow-hidden mb-2.5" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: mounted ? `${Math.min(dim.score, 100)}%` : "0%",
                        background: `linear-gradient(90deg, ${pal.color}99, ${pal.color})`,
                        transition: `width 0.75s cubic-bezier(0.4,0,0.2,1) ${idx * 80}ms`,
                        boxShadow: `0 0 4px ${pal.color}50`,
                      }}
                    />
                  </div>

                  {/* Detail text */}
                  <p className="text-[11.5px] text-gray-600 leading-relaxed">{dim.detail}</p>

                  {/* Meta */}
                  {dim.meta && (
                    <p className="text-[10.5px] font-medium text-gray-400 mt-1">{dim.meta}</p>
                  )}

                  {/* Skill chips — only for Skills dim */}
                  {isSkills && (dim.matched.length > 0 || dim.missing.length > 0) && (
                    <div className="mt-2.5 space-y-2">
                      {/* Matched skills */}
                      {dim.matched.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dim.matched.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                              style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}
                            >
                              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Critical gaps */}
                      {criticalGaps.length > 0 && (
                        <div>
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-600 mb-1">Critical gaps</p>
                          <div className="flex flex-wrap gap-1">
                            {criticalGaps.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                style={{ background: "#fef9ec", color: "#92400e", border: "1px solid #fde68a" }}
                              >
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional skills */}
                      {additionalSkills.length > 0 && (
                        <div>
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400 mb-1">Additional skills</p>
                          <div className="flex flex-wrap gap-1">
                            {additionalSkills.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
                              >
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expand / collapse */}
                      {totalHidden > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllSkills(true)}
                          className="text-[10.5px] font-semibold text-[#2557a7] hover:text-[#1f4e98] transition-colors"
                        >
                          +{totalHidden} more skills to add →
                        </button>
                      )}
                      {showAllSkills && allMissing.length > CHIP_PREVIEW && (
                        <button
                          type="button"
                          onClick={() => setShowAllSkills(false)}
                          className="text-[10.5px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Show less ↑
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Recommendations */}
            {aiRecs.length > 0 && (
              <div
                className="rounded-2xl border p-4 mt-1"
                style={{
                  background: "linear-gradient(145deg, #f0f5ff, #eaefff)",
                  borderColor: "#c7d7f8",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.45s ease ${dims.length * 65 + 60}ms, transform 0.45s ease ${dims.length * 65 + 60}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#2557a7" }}>
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-[11.5px] font-bold text-[#1f4e98]">AI Recommendations</span>
                </div>
                <div className="space-y-2">
                  {aiRecs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[8px] font-black"
                        style={{ background: "#2557a7", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-[11.5px] leading-relaxed" style={{ color: "#1f4e98cc" }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-full border border-gray-200 text-[12.5px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full text-[12.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ── Premium view ────────────────────────────────────────────────────────── */
type PremiumPhase = "preparing" | "confirming" | "executing" | "success" | "error";

function PremiumHeader({ jobTitle, company, onBack, onClose }: {
  jobTitle: string; company: string; onBack: () => void; onClose: () => void;
}) {
  return (
    <div className="relative overflow-hidden px-6 pt-5 pb-5 shrink-0"
      style={{ background: "linear-gradient(135deg,#78350f 0%,#b45309 100%)" }}>
      <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 blur-2xl bg-amber-300" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={onBack} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Back">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 leading-none mb-0.5">Premium Analysis · AI</p>
            <h2 className="text-[15px] font-extrabold text-white leading-tight truncate">{jobTitle}</h2>
            <p className="text-[11px] text-white/45 truncate">{company}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} aria-label="Close">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PremiumView({ jobId, jobTitle, company, onBack, onClose }: {
  jobId: string; jobTitle: string; company: string; onBack: () => void; onClose: () => void;
}) {
  const [phase, setPhase]   = useState<PremiumPhase>("preparing");
  const [pending, setPending] = useState<PendingActionResponse | null>(null);
  const [result, setResult]   = useState<ExecuteActionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — on mount: resolve resume_id + jd_id → create pending action
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        // Parallel: get resume_id from profile + jd_id from job
        const [profileRes, jdRes] = await Promise.all([
          parseResumeFromProfile(),
          parseJdByJob(jobId),
        ]);

        if (cancelled) return;

        const action = await createPremiumAction({
          action_type: "resume_tailor",
          job_id: jobId,
          idempotency_key: `match-analysis-${jobId}-${Date.now()}`,
          options: { resume_id: profileRes.resume_id, jd_id: jdRes.jd_id },
        });

        if (cancelled) return;
        setPending(action);
        setPhase("confirming");
      } catch (err: unknown) {
        if (cancelled) return;
        // 409 from parse-from-profile means resume must be parsed first
        const status = (err as { response?: { status?: number; data?: { must_parse?: boolean; detail?: string } } })?.response?.status;
        const body   = (err as { response?: { data?: { must_parse?: boolean; detail?: string } } })?.response?.data;

        if (status === 409 && body?.must_parse) {
          setErrorMsg("Your resume hasn't been parsed yet. Please run an ATS scan first, then try again.");
        } else if (status === 402) {
          setErrorMsg("Insufficient credits. Please upgrade your plan to use premium analysis.");
        } else if (status === 404) {
          setErrorMsg("No resume found on your profile. Please upload a resume first.");
        } else {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
        setPhase("error");
      }
    }

    prepare();
    return () => { cancelled = true; };
  }, [jobId]);

  // Step 2 — user confirms
  const handleConfirm = async () => {
    if (!pending) return;
    setPhase("executing");
    try {
      const res = await executePremiumAction(pending.action_id);
      setResult(res);
      setPhase("success");
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data;
      setErrorMsg(body?.error?.message ?? (err instanceof Error ? err.message : "Execution failed. Please try again."));
      setPhase("error");
    }
  };

  const creditsAfter = pending
    ? pending.user_credits_remaining - pending.quoted_credits
    : 0;

  return (
    <div
      className="relative w-full max-w-md rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <PremiumHeader jobTitle={jobTitle} company={company} onBack={onBack} onClose={onClose} />

      <div className="px-6 py-6">

        {/* PREPARING */}
        {phase === "preparing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-11 h-11 rounded-full border-4 border-t-transparent animate-spin mb-4"
              style={{ borderColor: "#b45309", borderTopColor: "transparent" }} />
            <p className="text-[14px] font-bold text-gray-800">Preparing analysis…</p>
            <p className="text-[12px] text-gray-400 mt-1">Resolving your resume &amp; job details</p>
          </div>
        )}

        {/* CONFIRMING */}
        {phase === "confirming" && pending && (
          <div className="space-y-4">
            {/* Credit summary */}
            <div className="rounded-2xl p-4 bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">Credit Summary</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-600">Analysis cost</span>
                  <span className="text-[15px] font-extrabold text-amber-700">{pending.quoted_credits} credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Your balance</span>
                  <span className="text-[13px] font-semibold text-gray-700">{pending.user_credits_remaining} credits</span>
                </div>
                <div className="h-px bg-amber-200" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gray-700">After this action</span>
                  <span className="text-[14px] font-extrabold" style={{ color: creditsAfter >= 0 ? "#16a34a" : "#dc2626" }}>
                    {creditsAfter} credits
                  </span>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">What you get</p>
              {["AI-tailored resume suggestions for this job", "Keyword alignment with job description", "Skill gaps & priority action plan"].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[12px] text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#78350f,#b45309)", boxShadow: "0 4px 14px rgba(120,53,15,0.3)" }}
              >
                Confirm — {pending.quoted_credits} credits
              </button>
            </div>
          </div>
        )}

        {/* EXECUTING */}
        {phase === "executing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-11 h-11 rounded-full border-4 border-t-transparent animate-spin mb-4"
              style={{ borderColor: "#b45309", borderTopColor: "transparent" }} />
            <p className="text-[14px] font-bold text-gray-800">Running AI analysis…</p>
            <p className="text-[12px] text-gray-400 mt-1">This usually takes a few seconds</p>
          </div>
        )}

        {/* SUCCESS */}
        {phase === "success" && result && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#dcfce7", boxShadow: "0 6px 20px rgba(34,197,94,0.2)" }}>
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[16px] font-extrabold text-gray-900 mb-1">Analysis Complete!</p>
            <p className="text-[12px] text-gray-400 max-w-xs leading-relaxed">
              Premium AI analysis for <span className="font-semibold text-gray-700">{jobTitle}</span> is ready.
            </p>
            {result.user_credits_remaining !== undefined && (
              <p className="text-[11px] text-gray-400 mt-1">
                Credits used: <span className="font-semibold text-gray-600">{result.credits_used}</span> · Remaining: <span className="font-semibold text-gray-600">{result.user_credits_remaining}</span>
              </p>
            )}
            <button onClick={onClose} className="mt-5 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold"
              style={{ background: "linear-gradient(135deg,#78350f,#b45309)" }}>
              Done
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-[13px] font-bold text-gray-800 mb-1">Could not proceed</p>
            <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">{errorMsg}</p>
            <div className="flex gap-3 mt-5 w-full">
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Root modal ──────────────────────────────────────────────────────────── */
export default function MatchAnalysisModal({ jobId, jobTitle, company, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("pick");

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {view === "pick" && (
        <PickerView
          jobTitle={jobTitle}
          company={company}
          onSelect={setView}
          onClose={onClose}
        />
      )}
      {view === "basic" && (
        <BasicView
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          onBack={() => setView("pick")}
          onClose={onClose}
        />
      )}
      {view === "premium" && (
        <PremiumView
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          onBack={() => setView("pick")}
          onClose={onClose}
        />
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
