"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles, Briefcase, CircleDollarSign, Layers, MoreHorizontal, Home, Calendar, XCircle, CheckCircle, Share2, Flag, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  posted_date?: string | null;
  created_at?: string | null;
  education?: string;
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
  applicant_count?: number | string;
  h1b_sponsor?: boolean;
  onBotClick: () => void;
  onRemove?: () => void;
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
  good:    "GOOD MATCH",
  partial: "FAIR MATCH",
  low:     "LOW MATCH",
};

const BAND_CIRCLE_COLORS: Record<string, string> = {
  strong:  "#10b981",
  good:    "#3b82f6",
  partial: "#14b8a6",
  low:     "#9ca3af",
};

const BAND_LABEL_COLORS: Record<string, string> = {
  strong:  "text-emerald-300",
  good:    "text-sky-200",
  partial: "text-teal-300",
  low:     "text-gray-300",
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
    if (mins < 60) return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
    const weeks = Math.floor(days / 7);
    if (days < 30) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  } catch {
    return "Recently";
  }
};

export default function JobCard(props: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isApplied, setIsApplied] = useState(!!props.is_applied);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<MatchExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; left: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuBtnRef.current?.contains(t) || menuPortalRef.current?.contains(t)) return;
      setShowMenu(false);
    };

    const updatePos = () => {
      if (menuBtnRef.current) {
        const r = menuBtnRef.current.getBoundingClientRect();
        setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right, left: r.right - 192 });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [showMenu]);

  const handleMenuOpen = () => {
    if (menuBtnRef.current) {
      const r = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right, left: r.right - 192 });
    }
    setShowMenu(v => !v);
  };

  const handleScoreHover = async () => {
    const willOpen = !showExplanation;
    setShowExplanation(willOpen);
    if (willOpen && !explanation && !explanationLoading) {
      setExplanationLoading(true);
      try {
        const data = await getMatchExplanation(props.id);
        setExplanation(data);
      } catch { /* silently fail */ }
      finally { setExplanationLoading(false); }
    }
  };

  useEffect(() => {
    setIsSaved(isJobSaved(props.id));
  }, [props.id]);

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
  const logoColor = getLogoColor(props.company);
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];
  const isNew = (() => {
    const d = props.created_at || props.posted_date;
    if (!d) return false;
    try { return Date.now() - new Date(d).getTime() < 86400000; } catch { return false; }
  })();
  const sourceLabel = props.source && props.source !== "portal" ? props.source : "";
  const hasMatchScore = !!props.matchScore && Math.round(props.matchScore) > 0;

  const circleR = 27;
  const circleC = 2 * Math.PI * circleR;
  const circleOffset = circleC - ((props.matchScore || 0) / 100) * circleC;
  const circleStroke = props.match_band ? (BAND_CIRCLE_COLORS[props.match_band] || "#14b8a6") : "#14b8a6";
  const circleLabelColor = props.match_band ? (BAND_LABEL_COLORS[props.match_band] || "text-teal-400") : "text-teal-400";
  const circleLabel = props.match_band ? (BAND_LABELS[props.match_band] || props.match_band.toUpperCase()) : "";

  const skillsNode = (() => {
    const hasMatchData =
      (props.matched_skills && props.matched_skills.length > 0) ||
      (props.missing_skills && props.missing_skills.length > 0);

    if (!hasMatchData) {
      return skillChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {skillChips.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-full border border-gray-200/70">
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

    const visible = chips.slice(0, 7);
    const matchedNeutral = visible.filter((c) => c.state !== "missing");
    const missingChips   = visible.filter((c) => c.state === "missing");

    return (
      <div className="mt-3 space-y-2">
        {/* Matched + neutral chips */}
        {matchedNeutral.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchedNeutral.map(({ skill, state }) => (
              <span
                key={skill}
                className={`px-2.5 py-0.5 text-[10.5px] font-medium rounded-full border transition-colors ${
                  state === "matched"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100"
                    : "bg-gray-50 text-gray-500 border-gray-200/60 hover:bg-gray-100"
                }`}
              >
                {state === "matched" ? "✓ " : ""}{skill}
              </span>
            ))}
          </div>
        )}

        {/* Missing skills section */}
        {missingChips.length > 0 && (
          <div style={{ marginTop: 10, marginBottom: 8 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={11} className="text-orange-400 shrink-0" />
              <span className="text-[10.5px] font-bold text-orange-600 shrink-0 leading-none">
                Missing Skills
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingChips.map(({ skill }) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-[10.5px] font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200/70 hover:bg-orange-100 hover:border-orange-300/60 transition-colors duration-150 cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })();

  return (
    <>
    {/* Card: outer flex row so dark panel can span full height as a sibling */}
    <motion.div
      className="group relative bg-white rounded-2xl overflow-hidden flex border border-gray-100"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)" }}
      whileHover={{
        y: -3,
        boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(37,87,167,0.08), 0 0 0 1px rgba(37,87,167,0.12)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
{/* ── LEFT COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Swappable content zone: fixed height, both faces absolute-inset ── */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: 230 }}>
          <AnimatePresence mode="wait" initial={false}>

            {/* ── FACE A: Normal card content ── */}
            {!showExplanation && (
              <motion.div
                key="normal"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex items-start gap-3.5 px-5 pt-4 pb-0">
                  {/* Logo */}
                  <div className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl ${logoColor.bg} overflow-hidden ring-1 ring-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}>
                    {props.logo && props.logo.trim() && !logoError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={props.logo} alt={props.company} width={56} height={56}
                        onError={() => setLogoError(true)} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className={`text-[17px] font-extrabold select-none ${logoColor.text}`}>
                        {(props.company || "J").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Title + company */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {(props.created_at || props.posted_date) && (
                            <span className="text-[11.5px] text-gray-400 font-medium">
                              {formatPostedTime(props.created_at || props.posted_date)}
                            </span>
                          )}
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-200/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Early Applicant
                            </span>
                          )}
                        </div>
                        <h3 className="text-[16px] font-bold text-gray-900 leading-snug hover:text-[#2557a7] transition-colors duration-150 cursor-pointer line-clamp-1">
                          {props.title || "Job Title"}
                        </h3>
                        <p className="text-[12.5px] text-gray-500 mt-0.5 truncate">
                          <span className="text-gray-700 font-semibold">{props.company || "Company"}</span>
                          {sourceLabel && <span className="text-gray-400"> · {sourceLabel}</span>}
                        </p>
                      </div>
                      <button ref={menuBtnRef} type="button" onClick={handleMenuOpen}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 opacity-0 group-hover:opacity-100 mt-0.5"
                        title="More options" aria-label="More options">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-5 pt-2.5 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {props.location && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11.5px] text-gray-600">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[110px]">{props.location}</span>
                      </span>
                    )}
                    {props.type && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11.5px] text-gray-600">
                        <Briefcase size={11} className="text-gray-400 shrink-0" />
                        {props.type}
                      </span>
                    )}
                    {props.mode && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11.5px] text-gray-600">
                        <Home size={11} className="text-gray-400 shrink-0" />
                        {props.mode}
                      </span>
                    )}
                    {level && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11.5px] text-gray-600">
                        <Layers size={11} className="text-gray-400 shrink-0" />
                        {level}
                      </span>
                    )}
                    {props.experience && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11.5px] text-gray-600">
                        <Calendar size={11} className="text-gray-400 shrink-0" />
                        {props.experience}
                      </span>
                    )}
                    {props.salary && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[11.5px] text-emerald-700 font-medium">
                        <CircleDollarSign size={11} className="text-emerald-500 shrink-0" />
                        {props.salary}
                      </span>
                    )}
                  </div>
                  {skillsNode}
                </div>
              </motion.div>
            )}

            {/* ── FACE B: AI Analysis mode ── */}
            {showExplanation && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex flex-col"
                style={{ background: "linear-gradient(155deg, #f6f8ff 0%, #edf1ff 100%)" }}
              >
                {/* Compact header — single line */}
                <div className="flex items-center gap-2 px-5 pt-3 pb-2.5 border-b border-[#2557a7]/10 shrink-0">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #5896d7, #1f4e98)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <p className="text-[12px] font-bold text-[#1f4e98] flex-1 leading-none tracking-tight">
                    Why This Job Matches
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowExplanation(false)}
                    className="w-5 h-5 flex items-center justify-center rounded text-[#2557a7]/30 hover:text-[#2557a7]/70 hover:bg-[#2557a7]/10 transition-all shrink-0"
                    title="Back to job details"
                  >
                    <XCircle size={13} />
                  </button>
                </div>

                {/* Body — tight vertical rhythm */}
                <div className="flex-1 overflow-hidden flex flex-col justify-center gap-2 px-5 pt-2.5 pb-3">
                  {explanationLoading ? (
                    <>
                      <style>{`
                        @keyframes jc-shimmer { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
                        .jc-shimmer { background:linear-gradient(90deg,#e4eaf8 25%,#d8e2f6 50%,#e4eaf8 75%); background-size:1600px 100%; animation:jc-shimmer 1.5s ease-in-out infinite; }
                      `}</style>
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-11/12 rounded-full jc-shimmer" />
                        <div className="h-2.5 w-3/4 rounded-full jc-shimmer" />
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                            <div className="w-12 h-12 rounded-full jc-shimmer" />
                            <div className="h-2 w-9 rounded-full jc-shimmer" />
                            <div className="h-1.5 w-6 rounded-full jc-shimmer" />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : explanation ? (
                    <>
                      {/* Description — improved contrast and weight */}
                      {props.description && (() => {
                        const raw = props.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
                        const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];
                        const structuredRe = /(?:location|shift|pay rate|per hour|per month|£|₹|\d+:\d{2}|monday|sunday|saturday|lpa|salary|holiday pay|weekends?:|nights?:)/i;
                        const clean = sentences.filter(s => s.trim().length > 25 && !structuredRe.test(s));
                        const text = (clean.length > 0 ? clean.join(" ") : raw).trim() + "...";
                        return text ? (
                          <p className="text-[11.5px] font-medium text-gray-600 leading-[1.55] line-clamp-2 shrink-0">
                            {text}
                          </p>
                        ) : null;
                      })()}

                      {/* Hero metrics — larger circles, score-colored, two-line labels */}
                      <div className="flex items-start gap-1 mt-0.5">
                        {(
                          [
                            { label: "Experience", score: explanation.explanation.experience.score },
                            { label: "Skills",     score: explanation.explanation.skills.score     },
                            { label: "Role",       score: explanation.explanation.title.score      },
                            { label: "Education",  score: explanation.explanation.education.score  },
                            { label: "Location",   score: explanation.explanation.location.score   },
                          ] as { label: string; score: number }[]
                        ).map(({ label, score }) => {
                          const r = 22;
                          const circ = 2 * Math.PI * r;
                          const offset = circ - (score / 100) * circ;
                          const color = score >= 75 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
                          const trackColor = score >= 75 ? "#d1fae5" : score >= 50 ? "#dbeafe" : score >= 30 ? "#fef3c7" : "#fee2e2";
                          return (
                            <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
                              <svg width="54" height="54" viewBox="0 0 54 54">
                                <circle cx="27" cy="27" r={r} stroke={trackColor} strokeWidth="3.5" fill="none" />
                                <circle cx="27" cy="27" r={r} stroke={color} strokeWidth="3.5" fill="none"
                                  strokeDasharray={circ} strokeDashoffset={offset}
                                  strokeLinecap="round" transform="rotate(-90 27 27)"
                                  style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
                                />
                                <text textAnchor="middle" x="27" y="27" dominantBaseline="middle"
                                  fontSize="11" fontWeight="900" fill={color}>{Math.round(score)}</text>
                              </svg>
                              <span className="text-[9.5px] font-bold text-gray-600 text-center leading-tight mt-0.5">{label}</span>
                              <span className="text-[8.5px] font-semibold leading-none" style={{ color }}>{score >= 50 ? "Match" : "Gap"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11.5px] text-gray-400 text-center">Match breakdown unavailable</p>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action row */}
        <div className="border-t border-gray-100 flex items-center justify-between px-5 py-3 gap-3 bg-[#f9fafb]">
          {/* Left: applicant count + match analysis */}
          <div className="flex items-center gap-2.5 min-w-0">
            {props.applicant_count !== undefined && props.applicant_count !== null && (
              <span className="text-[12px] text-gray-400 shrink-0">
                {Number(props.applicant_count) < 25
                  ? "Under 25 applicants"
                  : `${props.applicant_count} applicants`}
              </span>
            )}
            {props.match_band && (
              <button
                type="button"
                onClick={() => setShowMatchModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #5896d7, #1f4e98)",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(37,87,167,0.3)",
                }}
                title="View AI match analysis"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Analysis
              </button>
            )}
          </div>

          {/* Right: heart + Ask Nancy + Apply */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              onClick={handleSaveJob}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-200 ${
                isSaved ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-400"
              }`}
              title={isSaved ? "Remove from saved" : "Save job"}
              aria-label={isSaved ? "Remove from saved" : "Save job"}
            >
              <Heart size={15} className={`transition-all ${isSaved ? "fill-red-500" : ""}`} />
            </motion.button>

            <button
              type="button"
              onClick={props.onBotClick}
              aria-label="Ask Nancy AI about this job"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eef3ff] hover:bg-[#dde8ff] text-[12px] font-semibold text-[#2557a7] border border-[#2557a7]/10 hover:border-[#2557a7]/25 transition-all shrink-0"
            >
              <Sparkles size={11} className="text-[#2557a7]" />
              Ask Nancy
            </button>

            <motion.button
              type="button"
              onClick={handleApplyNow}
              disabled={isSubmitting || isApplied}
              whileHover={!isApplied && !isSubmitting ? { scale: 1.03 } : undefined}
              whileTap={!isApplied && !isSubmitting ? { scale: 0.96 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-150 ${
                isSubmitting
                  ? "bg-emerald-400 text-white cursor-wait opacity-70"
                  : isApplied
                  ? "bg-gray-100 text-gray-500 cursor-default"
                  : "bg-[#2557a7] hover:bg-[#1f4e98] text-white shadow-sm hover:shadow-[0_4px_16px_rgba(37,87,167,0.4)] active:scale-[0.97]"
              }`}
            >
              {isSubmitting ? "Applying…" : isApplied ? "✓ Applied" : "Apply Now"}
            </motion.button>
          </div>
        </div>

      </div>

      {/* ── RIGHT: AI match panel ── */}
      {hasMatchScore && props.match_band && (
        <div
          className="shrink-0 w-[120px] flex flex-col cursor-pointer select-none"
          onClick={handleScoreHover}
        >
          <div
            className="flex-1 flex flex-col items-center justify-center gap-2.5 px-3 py-4 relative overflow-hidden group/panel transition-all duration-300"
            style={{ background: "linear-gradient(160deg, #111e35 0%, #172640 45%, #1c2f52 100%)" }}
          >
            {/* Ambient glow behind ring */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover/panel:opacity-100"
              style={{ background: `radial-gradient(ellipse 130% 80% at 50% -5%, ${circleStroke}28 0%, transparent 68%)` }} />
            {/* Top-right AI sparkle dot */}
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full opacity-60 animate-pulse"
              style={{ background: circleStroke }} />

            {/* Score ring using inline SVG for full control */}
            <div className="relative z-10">
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id={`panel-grad-${props.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={circleStroke} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={circleStroke} stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="36" cy="36" r={circleR} stroke="rgba(255,255,255,0.07)" strokeWidth="5.5" fill="none" />
                {/* Progress */}
                <circle
                  cx="36" cy="36" r={circleR}
                  stroke={`url(#panel-grad-${props.id})`}
                  strokeWidth="5.5" fill="none"
                  strokeDasharray={circleC} strokeDashoffset={circleOffset}
                  strokeLinecap="round" transform="rotate(-90 36 36)"
                  className="transition-all duration-700"
                  style={{ filter: `drop-shadow(0 0 6px ${circleStroke}80)` }}
                />
                {/* Score */}
                <text x="36" y="33" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="white" dominantBaseline="middle">
                  {Math.round(props.matchScore!)}%
                </text>
                <text x="36" y="44" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.75)" dominantBaseline="middle" style={{ letterSpacing: "0.8px" }}>
                  SCORE
                </text>
              </svg>
            </div>

            {/* Band label */}
            <div className="relative z-10 text-center space-y-1.5">
              <span
                className="inline-block text-[8.5px] font-bold tracking-wider uppercase leading-none px-2 py-0.5 rounded-full"
                style={{ color: circleStroke, background: `${circleStroke}30`, border: `1px solid ${circleStroke}60` }}
              >
                {circleLabel}
              </span>
              <div className="text-[8px] text-white/70 font-semibold tracking-widest uppercase group-hover/panel:text-white transition-colors">
                {showExplanation ? "CLOSE ✕" : "ANALYZE →"}
              </div>
            </div>

            {props.h1b_sponsor && (
              <span className="relative z-10 text-[7.5px] text-blue-300/40 text-center leading-tight">✓ H1B</span>
            )}
          </div>
        </div>
      )}

    </motion.div>

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

    {showMenu && menuPos && createPortal(
      <div
        ref={menuPortalRef}
        style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
        className="w-48 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] border border-gray-100 py-1.5"
      >
        {[
          {
            icon: XCircle, label: "Remove From List",
            action: () => { setShowMenu(false); props.onRemove?.(); toast.success("Job removed from list"); },
          },
          {
            icon: CheckCircle, label: "Already Applied",
            action: () => { setIsApplied(true); setShowMenu(false); toast.success("Marked as applied"); },
          },
          {
            icon: Share2, label: "Share",
            action: () => {
              const link = props.url || props.application_url || window.location.href;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(link)
                  .then(() => toast.success("Link copied to clipboard!"))
                  .catch(() => toast.error("Could not copy link"));
              } else {
                const el = document.createElement("textarea");
                el.value = link;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                toast.success("Link copied to clipboard!");
              }
              setShowMenu(false);
            },
          },
          {
            icon: Flag, label: "Report Issue",
            action: () => { setShowMenu(false); toast.info("Thanks for reporting. We'll look into it."); },
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#2557a7] transition-colors text-left group/item"
          >
            <Icon size={15} className="text-gray-400 group-hover/item:text-[#2557a7] shrink-0 transition-colors" />
            {label}
          </button>
        ))}
      </div>,
      document.body
    )}
    </>
  );
}
