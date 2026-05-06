"use client";

import { Heart, MapPin, Sparkles, Clock, Briefcase, IndianRupee, Layers, ChevronDown, ChevronUp } from "lucide-react";
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
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    const weeks = Math.floor(days / 7);
    if (days < 30) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } catch {
    return "Recently";
  }
};

const getModeStyle = (mode?: string) => {
  if (!mode) return null;
  const m = mode.toLowerCase();
  if (m.includes("remote")) return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" };
  if (m.includes("hybrid")) return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" };
  return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
};

const bandColors: Record<string, string> = {
  strong: "bg-emerald-100 text-emerald-700",
  good: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-500",
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
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }
    setShowExplanation(true);
    if (explanation) return;
    setExplanationLoading(true);
    try {
      const data = await getMatchExplanation(props.id);
      setExplanation(data);
    } catch {
      // silently fail — matched_skills/missing_skills are already shown
    } finally {
      setExplanationLoading(false);
    }
  };

  useEffect(() => {
    setIsSaved(isJobSaved(props.id));
    const externalUrl = props.url || props.application_url;
    const isPortalJob = !!props.recruiter_id && !externalUrl;
    if (externalUrl) {
      setIsApplied(false);
    } else if (isPortalJob) {
      setIsApplied(!!props.is_applied);
    }
  }, [props.id, props.url, props.application_url, props.recruiter_id, props.is_applied]);

  useEffect(() => {
    if (!isModalOpen) document.body.style.overflow = "unset";
  }, [isModalOpen]);

  const handleApplyNow = async () => {
    if (isSubmitting) return;
    const externalUrl = props.url || props.application_url;
    if (externalUrl) {
      const opened = window.open(externalUrl, "_blank", "noopener,noreferrer");
      if (!opened) toast.error("Could not open link. Please check popup blocker settings.");
      else toast.success(`Redirecting to ${props.source || "Company Site"}…`);
      return;
    }
    if (props.recruiter_id) {
      setIsModalOpen(true);
      document.body.style.overflow = "hidden";
      return;
    }
    toast.error("Job application method not configured");
  };

  const handleModalSubmit = async (applicationData: ApplicationData) => {
    setIsSubmitting(true);
    try {
      const result = await applyToJob(props.id, applicationData);
      if (result?.success) {
        setIsApplied(true);
        setIsModalOpen(false);
        document.body.style.overflow = "unset";
        if (result.applied === false) {
          toast.info("You've already applied to this job");
        } else {
          toast.success("Application submitted successfully!");
        }
      } else {
        toast.error("Application failed. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
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
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  const isNew = (() => {
    const d = props.posted_date || props.created_at;
    if (!d) return false;
    try { return Date.now() - new Date(d).getTime() < 86400000; } catch { return false; }
  })();
  const sourceLabel = props.source && props.source !== "portal" ? props.source : "";
  const hasMatchScore = !!props.matchScore && props.matchScore > 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-[#2557a7]/25 hover:shadow-[0_8px_30px_rgba(37,87,167,0.10)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-[#2557a7] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-l-2xl" />

      <div className="p-5 pl-6">
        {/* ROW 1: Logo · Title · Badges · Save */}
        <div className="flex gap-3.5">
          <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm overflow-hidden">
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
              <span className="text-base font-extrabold text-[#2557a7] select-none">
                {(props.company || "J").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug truncate group-hover:text-[#2557a7] transition-colors duration-150">
                  {props.title || "Job Title"}
                </h3>
                <p className="text-[13px] text-gray-400 mt-0.5 truncate">
                  {props.company || "Company"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {/* AI match band badge — clickable to toggle explanation */}
                {hasMatchScore && props.match_band && (
                  <button
                    type="button"
                    onClick={handleToggleExplanation}
                    title="Why this match?"
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity ${bandColors[props.match_band] || "bg-gray-100 text-gray-500"}`}
                  >
                    {Math.round(props.matchScore!)}% match
                    {showExplanation ? <ChevronUp size={9} className="inline ml-0.5" /> : <ChevronDown size={9} className="inline ml-0.5" />}
                  </button>
                )}
                {isNew && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full tracking-widest uppercase">
                    New
                  </span>
                )}
                {(props.posted_date || props.created_at) && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
                    <Clock size={10} className="text-gray-300" />
                    {formatPostedTime(props.posted_date || props.created_at)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveJob}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors ml-0.5"
                  title={isSaved ? "Remove from saved" : "Save job"}
                >
                  <Heart
                    size={15}
                    className={`transition-all ${isSaved ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`}
                  />
                </button>
              </div>
            </div>

            {/* Chips: Location · Type · Mode · Level */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {props.location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.75 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-500 font-medium">
                  <MapPin size={10} className="text-gray-400" />
                  {props.location}
                </span>
              )}
              {props.type && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.75 bg-blue-50 border border-blue-100 rounded-full text-[11px] text-[#2557a7] font-semibold">
                  <Briefcase size={10} />
                  {props.type}
                </span>
              )}
              {props.mode && modeStyle && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.75 ${modeStyle.bg} rounded-full text-[11px] ${modeStyle.text} font-semibold`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${modeStyle.dot}`} />
                  {props.mode}
                </span>
              )}
              {level && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-[11px] font-semibold ${levelColors.bg || "bg-gray-50"} ${levelColors.text || "text-gray-500"}`}>
                  <Layers size={10} />
                  {level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Experience · Salary */}
        {(props.experience || props.salary) && (
          <div className="flex items-center gap-4 mt-3 px-3 py-2 bg-gray-50 rounded-xl">
            {props.experience && (
              <span className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                <Briefcase size={12} className="text-gray-400 shrink-0" />
                {props.experience}
              </span>
            )}
            {props.salary && (
              <span className="flex items-center gap-1 text-[13px] font-extrabold text-gray-900">
                <IndianRupee size={13} className="text-[#2557a7] shrink-0" />
                <span className="text-gray-800">{props.salary}</span>
              </span>
            )}
            {sourceLabel && (
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                via {sourceLabel}
              </span>
            )}
          </div>
        )}

        {/* ROW 3: Skills — color-coded when SmartMatch data is present */}
        {(() => {
          const hasMatchData =
            (props.matched_skills && props.matched_skills.length > 0) ||
            (props.missing_skills && props.missing_skills.length > 0);

          if (!hasMatchData) {
            // Normal mode: plain blue chips from job's skill list
            return skillChips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skillChips.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.75 bg-[#f0f4ff] text-[#2557a7] text-[11px] font-semibold rounded-full border border-[#dce8ff]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null;
          }

          // SmartMatch mode: merge matched + missing into one color-coded row
          const matchedSet = new Set(
            (props.matched_skills || []).map((s) => s.toLowerCase())
          );
          const missingSet = new Set(
            (props.missing_skills || []).map((s) => s.toLowerCase())
          );

          // Build display list: job skills first (colored), then any extra matched skills
          const displayed = new Set<string>();
          const chips: { skill: string; state: "matched" | "missing" | "neutral" }[] = [];

          skillChips.forEach((skill) => {
            const key = skill.toLowerCase();
            displayed.add(key);
            if (matchedSet.has(key)) chips.push({ skill, state: "matched" });
            else if (missingSet.has(key)) chips.push({ skill, state: "missing" });
            else chips.push({ skill, state: "neutral" });
          });

          // Add matched/missing skills not already in skillChips
          [...(props.matched_skills || []), ...(props.missing_skills || [])]
            .slice(0, 6)
            .forEach((skill) => {
              const key = skill.toLowerCase();
              if (!displayed.has(key)) {
                displayed.add(key);
                chips.push({
                  skill,
                  state: matchedSet.has(key) ? "matched" : "missing",
                });
              }
            });

          if (chips.length === 0) return null;

          return (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chips.slice(0, 7).map(({ skill, state }) => (
                <span
                  key={skill}
                  className={`px-2.5 py-0.75 text-[11px] font-semibold rounded-full border ${
                    state === "matched"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : state === "missing"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-gray-50 text-gray-500 border-gray-100"
                  }`}
                >
                  {state === "matched" ? "✓ " : state === "missing" ? "✗ " : ""}
                  {skill}
                </span>
              ))}
            </div>
          );
        })()}

        {/* ROW 3.7: Match explanation panel */}
        {showExplanation && (
          <div className="mt-3 rounded-xl bg-[#f8faff] border border-[#dce8ff] p-3">
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
                    <div
                      className={`text-[13px] font-extrabold ${
                        score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-rose-500"
                      }`}
                    >
                      {Math.round(score)}
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 70 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400"
                        }`}
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

        {/* ROW 4: Actions */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onBotClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-xl text-[11px] font-bold text-[#2557a7] border border-[#2557a7]/20 bg-[#f5f8ff] hover:bg-[#eaf0ff] hover:border-[#2557a7]/40 transition-all"
              title="Chat with Nancy"
            >
              <Sparkles size={12} />
              Ask Nancy
            </button>

            {props.match_band && (
              <button
                type="button"
                onClick={() => setShowMatchModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-xl text-[11px] font-bold border transition-all"
                style={{ color: "#0f2d4e", background: "#f0f4f8", borderColor: "rgba(15,45,78,0.15)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#e2eaf4"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f4f8"; }}
                title="Analyse how well your resume matches this job"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Match Analysis
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleApplyNow}
            disabled={isSubmitting || isApplied}
            className={`px-6 py-1.75 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-150 ${
              isSubmitting
                ? "bg-[#2557a7]/50 text-white cursor-wait"
                : isApplied
                ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                : "bg-[#2557a7] hover:bg-[#1e4a96] text-white shadow-md shadow-[#2557a7]/20 hover:shadow-[#2557a7]/30 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? "Applying…" : isApplied ? "Applied ✓" : "Apply Now"}
          </button>
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
          jobDescription={props.description || ""}
          onClose={() => setShowMatchModal(false)}
        />
      )}
    </div>
  );
}
