"use client";

import { Heart, MapPin, Sparkles, Clock, Briefcase, IndianRupee, Layers, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isJobSaved, toggleJobSaved } from "@/utils/jobTracking";
import ApplicationModal, { ApplicationData } from "./ApplicationModal";
import MatchAnalysisModal from "./MatchAnalysisModal";
import { applyToJob } from "@/utils/jobApplication";
import { getMatchExplanation } from "@/api/insightsApi";
import type { MatchExplanationResponse } from "@/api/insightsApi";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  type: string;
  mode?: string;
  salary?: string;
  time: string;
  posted_date?: string;
  created_at?: string | null;
  matchScore?: number;
  matchText?: string;
  url?: string;
  application_url?: string;
  recruiter_id?: string;
  source?: string;
  company_website?: string;
  skills?: string;
  experience?: string;
  experience_level?: string;
  description?: string;
  roleTrending?: boolean;
  highHiring?: boolean;
  is_applied?: boolean;
  matched_skills?: string[];
  missing_skills?: string[];
  match_band?: string;
  onBotClick: () => void;
}

// Assign a consistent color to each company based on first letter
const LOGO_PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-700"   },
  { bg: "bg-violet-100", text: "text-violet-700"  },
  { bg: "bg-emerald-100",text: "text-emerald-700" },
  { bg: "bg-amber-100",  text: "text-amber-700"   },
  { bg: "bg-rose-100",   text: "text-rose-700"    },
  { bg: "bg-indigo-100", text: "text-indigo-700"  },
  { bg: "bg-cyan-100",   text: "text-cyan-700"    },
  { bg: "bg-orange-100", text: "text-orange-700"  },
  { bg: "bg-teal-100",   text: "text-teal-700"    },
  { bg: "bg-pink-100",   text: "text-pink-700"    },
  { bg: "bg-sky-100",    text: "text-sky-700"     },
  { bg: "bg-lime-100",   text: "text-lime-700"    },
];

function getLogoColor(company: string) {
  const code = (company || "J").toUpperCase().charCodeAt(0);
  return LOGO_PALETTE[code % LOGO_PALETTE.length];
}

const BAND_LABELS: Record<string, string> = {
  strong:  "BEST FIT",
  good:    "RECOMMENDED",
  partial: "WORTH EXPLORING",
  low:     "LOW RELEVANCE",
};

const BAND_STYLES: Record<string, string> = {
  strong:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  good:    "bg-blue-100 text-blue-700 border-blue-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  low:     "bg-gray-100 text-gray-500 border-gray-200",
};

const getExperienceLevelColors = (level?: string): { bg: string; text: string } => {
  if (!level) return { bg: "", text: "" };
  const l = level.toLowerCase();
  if (l.includes("intern") || l.includes("new grad")) return { bg: "bg-blue-50", text: "text-blue-700" };
  if (l.includes("entry")) return { bg: "bg-sky-50", text: "text-sky-700" };
  if (l.includes("mid")) return { bg: "bg-indigo-50", text: "text-indigo-700" };
  if (l.includes("senior")) return { bg: "bg-purple-50", text: "text-purple-700" };
  if (l.includes("lead") || l.includes("staff")) return { bg: "bg-orange-50", text: "text-orange-700" };
  if (l.includes("director") || l.includes("executive")) return { bg: "bg-red-50", text: "text-red-700" };
  return { bg: "", text: "" };
};

const deriveExperienceLevelFromYears = (yearsStr?: string): string | null => {
  if (!yearsStr) return null;
  const matches = yearsStr.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const years = parseInt(matches[matches.length - 1], 10);
  if (years <= 1) return "Intern/New Grad";
  if (years <= 3) return "Entry Level";
  if (years <= 6) return "Mid Level";
  if (years <= 10) return "Senior Level";
  return "Lead/Staff";
};

const formatPostedTime = (dateStr?: string | null): string => {
  if (!dateStr) return "Recently";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (days < 30) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  } catch {
    return "Recently";
  }
};

const getModeStyle = (mode?: string) => {
  if (!mode) return null;
  const m = mode.toLowerCase();
  if (m.includes("remote")) return { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (m.includes("hybrid")) return { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
  return { bg: "bg-slate-50 border-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
};

export default function JobCard(props: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<MatchExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const handleToggleExplanation = async () => {
    if (showExplanation) { setShowExplanation(false); return; }
    setShowExplanation(true);
    if (explanation) return;
    setExplanationLoading(true);
    try {
      const data = await getMatchExplanation(props.id);
      setExplanation(data);
    } catch { /* silently fail */ }
    finally { setExplanationLoading(false); }
  };

  useEffect(() => {
    setIsSaved(isJobSaved(props.id));
    const externalUrl = props.url || props.application_url;
    const isPortalJob = !!props.recruiter_id && !externalUrl;
    if (!externalUrl && isPortalJob) setIsApplied(!!props.is_applied);
  }, [props.id, props.url, props.application_url, props.recruiter_id, props.is_applied]);

  const handleApplyNow = async () => {
    if (isSubmitting) return;
    const externalUrl = props.url || props.application_url;
    if (externalUrl) {
      const opened = window.open(externalUrl, "_blank", "noopener,noreferrer");
      if (!opened) toast.error("Could not open link. Please check popup blocker settings.");
      else toast.success(`Redirecting to ${props.source || "Company Site"}…`);
      return;
    }
    if (props.recruiter_id) { setIsModalOpen(true); return; }
    toast.error("Job application method not configured");
  };

  const handleModalSubmit = async (applicationData: ApplicationData) => {
    setIsSubmitting(true);
    try {
      const result = await applyToJob(props.id, applicationData);
      if (result.success) {
        setIsApplied(true);
        setIsModalOpen(false);
        toast[result.status === "already_applied" ? "info" : "success"](result.message);
        return;
      }
      toast[result.status === "validation_error" ? "warning" : "error"](result.message);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveJob = () => {
    const newState = toggleJobSaved(props.id, props.title, props.company, props.location, props.type);
    setIsSaved(newState);
    toast[newState ? "success" : "info"](newState ? "Job saved!" : "Job removed from saved");
  };

  const level = deriveExperienceLevelFromYears(props.experience) || props.experience_level;
  const levelColors = getExperienceLevelColors(level);
  const modeStyle = getModeStyle(props.mode);
  const logoColor = getLogoColor(props.company);
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];
  const isNew = (() => {
    const d = props.posted_date || props.created_at;
    if (!d) return false;
    try { return Date.now() - new Date(d).getTime() < 86400000; } catch { return false; }
  })();
  const sourceLabel = props.source && props.source !== "portal" ? props.source.toUpperCase() : "";
  const hasMatchScore = !!props.matchScore && props.matchScore > 0;

  return (
    <>
    <div className="group relative bg-white rounded-xl border border-gray-100 hover:border-[#2557a7]/20 hover:shadow-[0_4px_20px_rgba(37,87,167,0.08)] hover:-translate-y-px transition-all duration-200 overflow-hidden">

      <div className="px-5 pt-4 pb-0">

        {/* TOP SECTION: Left info + Right logo */}
        <div className="flex items-start justify-between gap-4">
          {/* LEFT: title, company, meta */}
          <div className="flex-1 min-w-0">
            {/* Title + NEW badge + match band */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-[#2557a7] transition-colors duration-150">
                {props.title || "Job Title"}
              </h3>
              {isNew && (
                <span className="px-1.5 py-px bg-emerald-500 text-white text-[8px] font-bold rounded uppercase tracking-widest shrink-0">
                  NEW
                </span>
              )}
              {hasMatchScore && props.match_band && (
                <button
                  type="button"
                  onClick={handleToggleExplanation}
                  title="Why this match?"
                  className={`shrink-0 inline-flex items-center gap-0.5 px-2.5 py-px text-[10px] font-bold rounded-full uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity border ${BAND_STYLES[props.match_band] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                >
                  {Math.round(props.matchScore!)}% {BAND_LABELS[props.match_band] || props.match_band}
                  {showExplanation ? <ChevronUp size={9} className="inline ml-0.5" /> : <ChevronDown size={9} className="inline ml-0.5" />}
                </button>
              )}
            </div>

            {/* Company + Hiring */}
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[13px] text-gray-600 font-medium">{props.company || "Company"}</p>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Hiring
              </span>
            </div>

            {/* Exp + Salary row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-2">
              {props.experience && (
                <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                  <Briefcase size={12} className="text-gray-400 shrink-0" />
                  {props.experience}
                </span>
              )}
              {props.salary && (
                <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                  <IndianRupee size={12} className="text-gray-400 shrink-0" />
                  {props.salary}
                </span>
              )}
            </div>

            {/* Location row */}
            {props.location && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-gray-400 shrink-0" />
                <span className="text-[12.5px] text-gray-600">{props.location}</span>
              </div>
            )}

            {/* Work mode + type + level badges */}
            {(props.mode || props.type || level) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {props.mode && modeStyle && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${modeStyle.bg} border rounded-full text-[11px] ${modeStyle.text} font-semibold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${modeStyle.dot}`} />
                    {props.mode}
                  </span>
                )}
                {props.type && (
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-600 font-semibold">
                    {props.type}
                  </span>
                )}
                {level && (
                  <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-transparent ${levelColors.bg || "bg-gray-50"} ${levelColors.text || "text-gray-500"}`}>
                    <Layers size={9} />
                    {level}
                  </span>
                )}
              </div>
            )}

            {/* Skills row */}
            {(() => {
              const hasMatchData =
                (props.matched_skills && props.matched_skills.length > 0) ||
                (props.missing_skills && props.missing_skills.length > 0);

              if (!hasMatchData) {
                return skillChips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skillChips.map((skill) => (
                      <span key={skill} className="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-full border border-gray-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null;
              }

              const matchedSet = new Set((props.matched_skills || []).map((s) => s.toLowerCase()));
              const missingSet = new Set((props.missing_skills || []).map((s) => s.toLowerCase()));
              const displayed = new Set<string>();
              const chips: { skill: string; state: "matched" | "missing" | "neutral" }[] = [];

              skillChips.forEach((skill) => {
                const key = skill.toLowerCase();
                displayed.add(key);
                if (matchedSet.has(key)) chips.push({ skill, state: "matched" });
                else if (missingSet.has(key)) chips.push({ skill, state: "missing" });
                else chips.push({ skill, state: "neutral" });
              });

              [...(props.matched_skills || []), ...(props.missing_skills || [])]
                .slice(0, 6)
                .forEach((skill) => {
                  const key = skill.toLowerCase();
                  if (!displayed.has(key)) {
                    displayed.add(key);
                    chips.push({ skill, state: matchedSet.has(key) ? "matched" : "missing" });
                  }
                });

              if (chips.length === 0) return null;

              return (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {chips.slice(0, 7).map(({ skill, state }) => (
                    <span
                      key={skill}
                      className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${
                        state === "matched"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : state === "missing"
                          ? "bg-rose-50 text-rose-600 border-rose-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {state === "matched" ? "✓ " : state === "missing" ? "✗ " : ""}{skill}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* RIGHT: Company logo */}
          <div className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-xl ${logoColor.bg} overflow-hidden border border-gray-100`}>
            {props.logo && props.logo.trim() && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.logo}
                alt={props.company}
                width={40}
                height={40}
                onError={() => setLogoError(true)}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className={`text-base font-extrabold select-none ${logoColor.text}`}>
                {(props.company || "J").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Match explanation panel */}
        {showExplanation && (
          <div className="mt-3 rounded-lg bg-[#f8faff] border border-[#dce8ff] p-3">
            {explanationLoading ? (
              <div className="flex gap-2 animate-pulse">
                {[60, 80, 50, 70, 65].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-gray-200" style={{ width: w }} />
                ))}
              </div>
            ) : explanation ? (
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    ["Skills", explanation.explanation.skills.score, explanation.explanation.skills.detail],
                    ["Title", explanation.explanation.title.score, explanation.explanation.title.detail],
                    ["Exp", explanation.explanation.experience.score, explanation.explanation.experience.detail],
                    ["Edu", explanation.explanation.education.score, explanation.explanation.education.detail],
                    ["Location", explanation.explanation.location.score, explanation.explanation.location.detail],
                  ] as [string, number, string][]
                ).map(([label, score, detail]) => (
                  <div key={label} className="flex flex-col items-center gap-0.5" title={detail}>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">{label}</div>
                    <div className={`text-[13px] font-extrabold ${score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                      {Math.round(score)}
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">Match breakdown unavailable</p>
            )}
          </div>
        )}

        {/* DIVIDER */}
        <div className="mt-3 border-t border-gray-100" />

        {/* BOTTOM ROW: Posted · Source | Ask Nancy · Match analysis | Apply */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            {(props.posted_date || props.created_at) && (
              <span className="flex items-center gap-1 text-[11.5px] text-gray-400">
                <Clock size={11} className="text-gray-300" />
                Posted: {formatPostedTime(props.posted_date || props.created_at)}
              </span>
            )}
            {sourceLabel && (
              <span className="text-[11px] font-semibold text-gray-400 tracking-wide">
                Via {sourceLabel}
              </span>
            )}
            <span className="w-px h-3.5 bg-gray-200" />
            <button
              type="button"
              onClick={props.onBotClick}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2557a7] hover:text-[#1a4a96] transition-colors"
            >
              <Sparkles size={12} />
              Ask Nancy
            </button>
            {props.match_band && (
              <button
                type="button"
                onClick={() => setShowMatchModal(true)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Match analysis
              </button>
            )}
          </div>

          {/* Save + Apply */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveJob}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
              title={isSaved ? "Remove from saved" : "Save job"}
            >
              <Heart size={14} className={`transition-all ${isSaved ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}`} />
            </button>
            <button
              type="button"
              onClick={handleApplyNow}
              disabled={isSubmitting || isApplied}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12.5px] font-bold whitespace-nowrap transition-all duration-150 ${
                isSubmitting
                  ? "bg-[#2557a7]/50 text-white cursor-wait"
                  : isApplied
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                  : "bg-[#2557a7] hover:bg-[#1e4a96] text-white shadow-sm hover:shadow-[0_4px_12px_rgba(37,87,167,0.25)] active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? "Applying…" : isApplied ? "✓ Applied" : <>Apply now <ArrowRight size={13} /></>}
            </button>
          </div>
        </div>

      </div>
    </div>

    <ApplicationModal
      isOpen={isModalOpen}
      jobTitle={props.title}
      jobCompany={props.company}
      location={props.location}
      jobType={props.type}
      recruiterName="Available"
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleModalSubmit}
      isLoading={isSubmitting}
    />

    {showMatchModal && (
      <MatchAnalysisModal
        jobId={props.id}
        jobTitle={props.title}
        company={props.company}
        onClose={() => setShowMatchModal(false)}
      />
    )}
    </>
  );
}
