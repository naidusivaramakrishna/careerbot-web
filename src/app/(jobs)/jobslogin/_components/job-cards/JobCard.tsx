"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles, Briefcase, CircleDollarSign, Layers, MoreHorizontal, Home, Calendar, XCircle, CheckCircle, Share2, Flag, Trash2, ChevronDown } from "lucide-react";
import { GoLocation } from "react-icons/go";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { isJobSaved, toggleJobSaved, recordJobApplication } from "@/utils/jobTracking";
import ApplicationModal, { ApplicationData } from "./ApplicationModal";
import MatchAnalysisModal from "./MatchAnalysisModal";
import JobPreviewModal from "./JobPreviewModal";
import ResumeCustomizePrompt from "./ResumeCustomizePrompt";
import { applyToJob } from "@/utils/jobApplication";
import { getMatchExplanation } from "@/api/insightsApi";
import type { MatchExplanationResponse } from "@/api/insightsApi";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { getSafeExternalUrl } from "@/utils/validators";
import { getMatchBandConfig } from "../utils/matchBand";
import { runFixResumeForJob, describeFixResumeError } from "../utils/fixResumeForJob";

const SKIP_RESUME_PROMPT_KEY = "skipResumeCustomizePrompt";
const SKIP_RESUME_PROMPT_EVENT = "skipResumeCustomizePromptChanged";

interface JobCardProps {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly logo?: string;
  readonly type: string;
  readonly mode?: string;
  readonly salary?: string;
  readonly posted_date?: string | null;
  readonly created_at?: string | null;
  readonly education?: string;
  readonly matchScore?: number;
  readonly url?: string;
  readonly application_url?: string;
  readonly recruiter_id?: string;
  readonly source?: string;
  readonly skills?: string;
  readonly experience?: string;
  readonly experience_level?: string;
  readonly description?: string;
  readonly is_applied?: boolean;
  readonly matched_skills?: string[];
  readonly missing_skills?: string[];
  readonly match_band?: string;
  readonly applicant_count?: number | string;
  readonly h1b_sponsor?: boolean;
  readonly remote?: boolean;
  readonly requirements?: string[];
  readonly responsibilities?: string;
  readonly onBotClick: () => void;
  readonly onRemove?: () => void;
  readonly onApplyClick?: () => void;
  readonly onSaveToggle?: (saved: boolean) => void;
  readonly onRemoveApplication?: () => void;
  readonly onAppliedToggle?: (jobId: string) => void;
  // Title click preference: when provided, the caller handles "view details"
  // itself (e.g. JobsContents swaps the list for an inline details panel)
  // instead of this card opening its own JobPreviewModal overlay.
  readonly onTitleClick?: () => void;
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
  const code = (company || "J").toUpperCase().codePointAt(0)!;
  return LOGO_PALETTE[code % LOGO_PALETTE.length];
}

const deriveExperienceLevelFromYears = (yearsStr?: string): string | null => {
  if (!yearsStr) return null;
  const matches = yearsStr.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const years = Number.parseInt(matches.at(-1)!, 10);
  if (years <= 1) return "Intern/New Grad";
  if (years <= 3) return "Entry Level";
  if (years <= 6) return "Mid Level";
  if (years <= 10) return "Senior Level";
  return "Lead/Staff";
};

const pluralizeAgo = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

const formatPostedTime = (dateStr?: string | null): string => {
  if (!dateStr) return "Recently";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return pluralizeAgo(mins, "minute");
    if (hours < 24) return pluralizeAgo(hours, "hour");
    if (days < 7) return pluralizeAgo(days, "day");
    const weeks = Math.floor(days / 7);
    if (days < 30) return pluralizeAgo(weeks, "week");
    const months = Math.floor(days / 30);
    return pluralizeAgo(months, "month");
  } catch {
    return "Recently";
  }
};

function getScoreColors(score: number): { color: string; track: string } {
  if (score >= 75) return { color: "#10b981", track: "#d1fae5" };
  if (score >= 50) return { color: "#3b82f6", track: "#dbeafe" };
  if (score >= 30) return { color: "#f59e0b", track: "#fef3c7" };
  return { color: "#ef4444", track: "#fee2e2" };
}

export default function JobCard(props: JobCardProps) {
  const { userId } = useCurrentUserId();
  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isApplied, setIsApplied] = useState(!!props.is_applied);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<MatchExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; left: number } | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isPreparingResumeFix, setIsPreparingResumeFix] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [skipResumePrompt, setSkipResumePrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(SKIP_RESUME_PROMPT_KEY) === "true"; } catch { return false; }
  });
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);

  // JobCard is mounted once per job in a list — each instance's
  // skipResumePrompt above is seeded from localStorage only at its own mount
  // time. Without this listener, checking "Do not remind me again" on one
  // job's popup persists to localStorage but leaves every other already-
  // mounted job card's in-memory state stale at `false`, so the popup kept
  // reappearing for the next job in the same session even though the user
  // had just opted out.
  useEffect(() => {
    const handleSkipChanged = () => setSkipResumePrompt(true);
    window.addEventListener(SKIP_RESUME_PROMPT_EVENT, handleSkipChanged);
    return () => window.removeEventListener(SKIP_RESUME_PROMPT_EVENT, handleSkipChanged);
  }, []);

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
    setIsSaved(isJobSaved(props.id, userId));
  }, [props.id, userId]);

  // Normalized + filtered at the source so every render sink downstream
  // (this card's own apply anchors, JobPreviewModal, ApplicationModal)
  // automatically gets a safe, absolute value — job urls originate from
  // third-party aggregators and are frequently bare-domain (no http(s)://)
  // and could contain javascript:/data: URIs.
  const rawExternalUrl = props.url || props.application_url;
  const externalUrl = getSafeExternalUrl(rawExternalUrl);

  // For external jobs the "Apply Now" element renders as a real <a target="_blank">
  // (see JSX below) so the browser treats it as a normal user-initiated navigation
  // instead of a script-triggered popup — window.open() was getting blocked
  // intermittently by browser/extension popup blockers. The "did you apply?"
  // confirmation is owned by JobsContents (not this card) since it has to
  // survive the card unmounting/re-rendering while the user is away on the
  // external tab — see onApplyClick.
  const handleExternalApplyClick = () => {
    toast.success(`Redirecting to ${props.source || "Company Site"}…`);
    props.onApplyClick?.();
  };

  const handleApplyNow = () => {
    if (isSubmitting || externalUrl) return;
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
        recordJobApplication(props.id, props.title, props.company, props.url || props.application_url || "", userId);
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
    const newState = toggleJobSaved(
      props.id,
      props.title,
      props.company,
      props.location,
      props.type,
      userId,
      props.url || props.application_url,
    );
    setIsSaved(newState);
    toast[newState ? "success" : "info"](newState ? "Job saved!" : "Job removed from saved");
    props.onSaveToggle?.(newState);
  };

  const handleTitleClick = () => {
    if (props.onTitleClick) { props.onTitleClick(); return; }
    setShowPreview(true);
  };

  // Applying from inside the preview modal opens either ApplicationModal
  // (internal/recruiter job) or a new tab (external job) — close the
  // preview first in both cases so it isn't left stacked/stranded
  // underneath once the user comes back to this tab.
  const handlePreviewApplyClick = () => {
    setShowPreview(false);
    if (externalUrl) {
      handleExternalApplyClick();
      return;
    }
    handleApplyNow();
  };

  const level = deriveExperienceLevelFromYears(props.experience) || props.experience_level;
  const logoColor = getLogoColor(props.company);
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];
  const isNew = (() => {
    const d = props.created_at || props.posted_date;
    if (!d) return false;
    try { return Date.now() - new Date(d).getTime() < 604800000; } catch { return false; } // 7 days
  })();
  const sourceLabel = props.source && props.source !== "portal" ? props.source : "";
  const hasMatchScore = !!props.matchScore && Math.round(props.matchScore) > 0;

  // Smart Match jobs below an 80% match get a "customize your resume first?"
  // gate before applying — reuses the match/skill-gap data already on the
  // card (no extra API call). Jobs without match data, or a match already at
  // 80%+, skip straight to the normal Apply Now flow.
  const missingSkillsForPrompt = props.missing_skills ?? [];
  const shouldPromptResumeCustomize =
    hasMatchScore &&
    !!externalUrl &&
    !skipResumePrompt &&
    Math.round(props.matchScore ?? 0) < 80;

  const persistSkipIfChecked = () => {
    if (!dontRemindAgain) return;
    setSkipResumePrompt(true);
    try { localStorage.setItem(SKIP_RESUME_PROMPT_KEY, "true"); } catch { /* ignore */ }
    // Tell every other already-mounted JobCard to flip its own state too —
    // see the listener effect above for why this is necessary.
    window.dispatchEvent(new Event(SKIP_RESUME_PROMPT_EVENT));
  };

  const handleFixResume = async () => {
    if (isPreparingResumeFix) return;
    persistSkipIfChecked();
    // Keep the modal open (showing the "Preparing your match…" button state
    // below) for the whole async pipeline — closing it here would hide that
    // loading state immediately, leaving no visible feedback until the hard
    // navigation at the end lands.
    setIsPreparingResumeFix(true);
    try {
      await runFixResumeForJob({ id: props.id, title: props.title, company: props.company, description: props.description });
    } catch (err: unknown) {
      toast.error(describeFixResumeError(err));
      setShowResumePrompt(false);
    } finally {
      setIsPreparingResumeFix(false);
    }
  };

  const handleApplyWithoutCustomizing = () => {
    persistSkipIfChecked();
    setShowResumePrompt(false);
    handleExternalApplyClick();
  };

  const circleR = 33;
  const circleC = 2 * Math.PI * circleR;
  const circleOffset = circleC - ((props.matchScore || 0) / 100) * circleC;
  const bandCfg = getMatchBandConfig(props.match_band);
  // Fixed teal, not band-dependent — matches the reference score card, which
  // keeps the same ring/label color regardless of match quality.
  const circleStroke = "#2dd4bf";
  // Simple two-tier label off the numeric score itself, not the backend's
  // multi-tier match_band — 75%+ reads as a good match, anything under as fair.
  const circleLabel = props.match_band ? ((props.matchScore ?? 0) >= 75 ? "GOOD MATCH" : "FAIR MATCH") : "";

  // "Why This Job Matches" flip-panel body — loading skeleton, resolved
  // explanation, or an unavailable-state message, depending on the async
  // getMatchExplanation() call kicked off by handleScoreHover.
  const analysisBodyNode = (() => {
    if (explanationLoading) {
      return (
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
      );
    }

    if (explanation) {
      return (
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
              const { color, track: trackColor } = getScoreColors(score);
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
      );
    }

    return <p className="text-[11.5px] text-gray-400 text-center">Match breakdown unavailable</p>;
  })();

  const menuNode = showMenu && menuPos ? createPortal(
    <div
      ref={menuPortalRef}
      style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
      className="w-48 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] border border-gray-100 py-1.5"
    >
      {[
        props.onRemove && {
          icon: XCircle, label: "Remove From List",
          action: () => { setShowMenu(false); props.onRemove?.(); toast.success("Job removed from list"); },
        },
        props.onRemoveApplication && {
          icon: Trash2, label: "Remove Application",
          action: () => {
            setShowMenu(false);
            if (window.confirm("Remove this job from your Applied list? This can't be undone.")) {
              props.onRemoveApplication?.();
              toast.success("Application removed");
            }
          },
        },
        {
          icon: CheckCircle, label: "Already Applied",
          action: () => {
            setIsApplied(true);
            setShowMenu(false);
            recordJobApplication(props.id, props.title, props.company, props.url || props.application_url || "", userId);
            // Unlike the save path (handleSaveJob → onSaveToggle), this bypasses
            // JobsContents' own recordJobApplication call sites — tell it directly
            // so the Applied tab badge/list update without waiting for that tab
            // to be (re)activated.
            props.onAppliedToggle?.(props.id);
            toast.success("Marked as applied");
          },
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
              el.remove();
              toast.success("Link copied to clipboard!");
            }
            setShowMenu(false);
          },
        },
        {
          icon: Flag, label: "Report Issue",
          action: () => { setShowMenu(false); toast.info("Thanks for reporting. We'll look into it."); },
        },
      ].filter((item): item is NonNullable<typeof item> => !!item).map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          type="button"
          onClick={action}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#4F46E5] transition-colors text-left group/item"
        >
          <Icon size={15} className="text-gray-400 group-hover/item:text-[#4F46E5] shrink-0 transition-colors" />
          {label}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  if (!hasMatchScore) {
    const applicantCountLabel =
      props.applicant_count !== undefined && props.applicant_count !== null
        ? (Number(props.applicant_count) < 25 ? "Less than 25 applicants" : `${props.applicant_count} applicants`)
        : "";

    let applyBtnClass: string;
    let applyBtnLabel: string;
    if (isSubmitting) {
      applyBtnClass = "bg-emerald-400 text-white cursor-wait opacity-70";
      applyBtnLabel = "Applying...";
    } else if (isApplied) {
      applyBtnClass = "bg-slate-100 text-slate-500 cursor-default";
      applyBtnLabel = "Applied";
    } else {
      applyBtnClass = "bg-[#4F46E5] text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:bg-[#4338CA]";
      applyBtnLabel = "Apply Now";
    }

    return (
      <>
        <motion.div
          className="jobs-premium-card group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,23,42,0.055),0_0_28px_rgba(79,70,229,0.12)] transition-colors"
          whileHover={{
            y: -2,
            boxShadow: "0 18px 46px rgba(15,23,42,0.10), 0 0 46px rgba(79,70,229,0.30), 0 0 0 1px rgba(79,70,229,0.18)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ${logoColor.bg} ring-1 ring-black/5 shadow-sm`}>
              {props.logo?.trim() && !logoError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.logo}
                  alt={props.company}
                  width={56}
                  height={56}
                  onError={() => setLogoError(true)}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className={`text-[17px] font-extrabold select-none ${logoColor.text}`}>
                  {(props.company || "J").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {(props.created_at || props.posted_date) && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {formatPostedTime(props.created_at || props.posted_date)}
                  </span>
                )}
                {isNew && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Be an early applicant
                  </span>
                )}
              </div>
              <h3
                onClick={handleTitleClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTitleClick();
                  }
                }}
                role="button"
                tabIndex={0}
                className="line-clamp-1 cursor-pointer text-[19px] font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#4F46E5]"
              >
                {props.title || "Job Title"}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-slate-500">
                <span className="font-semibold text-slate-700">{props.company || "Company"}</span>
                {sourceLabel && <span className="text-slate-400"> · {sourceLabel}</span>}
              </p>
            </div>

            <button
              ref={menuBtnRef}
              type="button"
              onClick={handleMenuOpen}
              className="shrink-0 rounded-xl p-1.5 text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-600"
              title="More options"
              aria-label="More options"
            >
              <MoreHorizontal size={17} />
            </button>
          </div>

          {(props.location || props.type || props.salary || props.mode || level || props.experience) && (
            <>
              <div className="my-3.5 border-t border-slate-200" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {props.location && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <GoLocation size={18} stroke="currentColor" strokeWidth={1} className="shrink-0 text-slate-600" />
                    <span className="truncate">{props.location}</span>
                  </span>
                )}
                {props.type && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <Briefcase size={18} strokeWidth={2.5} className="shrink-0 text-slate-600" />
                    {props.type}
                  </span>
                )}
                {props.salary && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <CircleDollarSign size={18} strokeWidth={2.5} className="shrink-0 text-slate-600" />
                    {props.salary}
                  </span>
                )}
                {props.mode && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <Home size={18} strokeWidth={2.5} className="shrink-0 text-slate-600" />
                    {props.mode}
                  </span>
                )}
                {level && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <Layers size={18} strokeWidth={2.5} className="shrink-0 text-slate-600" />
                    {level}
                  </span>
                )}
                {props.experience && (
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700">
                    <Calendar size={18} strokeWidth={2.5} className="shrink-0 text-slate-600" />
                    {props.experience}
                  </span>
                )}
              </div>
            </>
          )}

          {skillChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skillChips.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-500">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <span className="text-[12px] text-slate-400">
              {applicantCountLabel}
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {props.onRemove && (
                <motion.button
                  type="button"
                  onClick={() => { props.onRemove?.(); toast.success("Job removed from list"); }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900"
                  title="Not interested"
                  aria-label="Not interested"
                >
                  <XCircle size={16} strokeWidth={2.5} />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={handleSaveJob}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isSaved ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-500"
                }`}
                title={isSaved ? "Remove from saved" : "Save job"}
                aria-label={isSaved ? "Remove from saved" : "Save job"}
              >
                <Heart size={16} strokeWidth={2.5} className={isSaved ? "fill-red-500" : ""} />
              </motion.button>
              <button
                type="button"
                onClick={props.onBotClick}
                aria-label="Ask Nancy AI about this job"
                className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[#4F46E5]/10 bg-white px-4 text-[12px] font-bold text-[#4F46E5] shadow-sm transition-all hover:border-[#4F46E5]/25 hover:bg-[#eef3ff]"
              >
                <Sparkles size={12} />
                Ask Nancy
              </button>
              {externalUrl && !isApplied ? (
                <motion.a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-allow-new-tab
                  onClick={handleExternalApplyClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex h-10 items-center whitespace-nowrap rounded-2xl bg-[#4F46E5] px-5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] transition-all hover:bg-[#4338CA]"
                >
                  Apply Now
                </motion.a>
              ) : (
                <motion.button
                  type="button"
                  onClick={handleApplyNow}
                  disabled={isSubmitting || isApplied}
                  whileHover={!isApplied && !isSubmitting ? { scale: 1.02 } : undefined}
                  whileTap={!isApplied && !isSubmitting ? { scale: 0.97 } : undefined}
                  className={`inline-flex h-10 items-center whitespace-nowrap rounded-2xl px-5 text-[13px] font-bold transition-all ${applyBtnClass}`}
                >
                  {applyBtnLabel}
                </motion.button>
              )}
            </div>
          </div>
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

        {menuNode}

        {showPreview && (
          <JobPreviewModal
            title={props.title}
            company={props.company}
            location={props.location}
            type={props.type}
            mode={props.mode}
            remote={props.remote}
            salary={props.salary}
            experience={props.experience}
            education={props.education}
            skills={props.skills}
            description={props.description}
            responsibilities={props.responsibilities}
            requirements={props.requirements}
            source={props.source}
            postedLabel={formatPostedTime(props.created_at || props.posted_date)}
            isSaved={isSaved}
            isApplied={isApplied}
            externalUrl={externalUrl}
            onClose={() => setShowPreview(false)}
            onSaveClick={handleSaveJob}
            onApplyClick={handlePreviewApplyClick}
          />
        )}
      </>
    );
  }

  return (
    <>
    {/* Card: outer flex row so dark panel can span full height as a sibling */}
    <motion.div
      className="jobs-premium-card group relative flex overflow-hidden rounded-[22px] border border-slate-200/70 bg-white"
      style={{ boxShadow: "0 14px 38px rgba(15,23,42,0.07), 0 0 34px rgba(79,70,229,0.14), 0 1px 0 rgba(255,255,255,0.9)" }}
      whileHover={{
        y: -4,
        boxShadow: "0 26px 64px rgba(15,23,42,0.14), 0 0 56px rgba(79,70,229,0.34), 0 0 0 1px rgba(79,70,229,0.24)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
{/* ── LEFT COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Swappable content zone: both faces share one grid cell so the
            container auto-sizes to whichever face is tallest — height must
            stay dynamic since missing-skill chips can wrap onto more lines
            as the card narrows; a fixed pixel height clipped them. ── */}
        <div className="relative flex-1 grid">
          <AnimatePresence mode="wait" initial={false}>

            {/* ── FACE A: Normal card content ── */}
            {!showExplanation && (
              <motion.div
                key="normal"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="col-start-1 row-start-1 flex flex-col"
              >
                <div className="flex items-start gap-3 px-5 pt-3.5 pb-0">
                  {/* Logo */}
                  <div className={`flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-xl ${logoColor.bg} ring-1 ring-black/5 shadow-[0_10px_22px_rgba(15,23,42,0.11)]`}>
                    {props.logo?.trim() && !logoError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={props.logo} alt={props.company} width={70} height={70}
                        onError={() => setLogoError(true)} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className={`text-[25px] font-extrabold select-none ${logoColor.text}`}>
                        {(props.company || "J").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Title + company */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {(props.created_at || props.posted_date) && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#E7F9FD] text-black text-[10px] font-bold rounded-xl border border-sky-200/60">
                              {formatPostedTime(props.created_at || props.posted_date)}
                            </span>
                          )}
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E7F9FD] text-black text-[10px] font-bold rounded-full border border-sky-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
                              Early Applicant
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={handleTitleClick}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleTitleClick();
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className="line-clamp-1 cursor-pointer text-[20px] font-extrabold leading-snug text-black"
                          >
                            {props.title || "Job Title"}
                          </h3>
                        </div>
                        <p className="mt-0.5 truncate text-[13.5px] text-slate-500">
                          <span className="font-bold text-slate-700">{props.company || "Company"}</span>
                          {sourceLabel && <span className="text-gray-400"> · {sourceLabel}</span>}
                        </p>
                      </div>
                      <button ref={menuBtnRef} type="button" onClick={handleMenuOpen}
                        className="mt-0.5 shrink-0 rounded-xl p-1.5 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                        title="More options" aria-label="More options">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider — splits the card into header / meta / actions bands */}
                <div className="mx-5 my-3 border-t border-slate-200/80" />

                <div className="px-5 pb-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {props.location && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-700" title={props.location}>
                        <MapPin size={16} strokeWidth={2.3} className="text-slate-500 shrink-0" />
                        <span className="truncate">{props.location.split(",")[0].trim()}</span>
                      </span>
                    )}
                    {props.type && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-700">
                        <Briefcase size={16} strokeWidth={2.3} className="text-slate-500 shrink-0" />
                        {props.type}
                      </span>
                    )}
                    {props.mode && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-700">
                        <Home size={16} strokeWidth={2.3} className="text-slate-500 shrink-0" />
                        {props.mode}
                      </span>
                    )}
                    {level && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-700">
                        <Layers size={16} strokeWidth={2.3} className="text-slate-500 shrink-0" />
                        {level}
                      </span>
                    )}
                    {props.experience && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-700">
                        <Calendar size={16} strokeWidth={2.3} className="text-slate-500 shrink-0" />
                        {props.experience}
                      </span>
                    )}
                    {props.salary && (
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-emerald-600">
                        <CircleDollarSign size={16} strokeWidth={2.3} className="text-emerald-500 shrink-0" />
                        {props.salary}
                      </span>
                    )}
                  </div>
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
                className="col-start-1 row-start-1 flex flex-col"
                style={{ background: "linear-gradient(155deg, #f6f8ff 0%, #edf1ff 100%)" }}
              >
                {/* Compact header — single line */}
                <div className="flex items-center gap-2 px-5 pt-3 pb-2.5 border-b border-[#4F46E5]/10 shrink-0">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #5896d7, #4338CA)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <p className="text-[12px] font-bold text-[#4338CA] flex-1 leading-none tracking-tight">
                    Why This Job Matches
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowExplanation(false)}
                    className="w-5 h-5 flex items-center justify-center rounded text-[#4F46E5]/30 hover:text-[#4F46E5]/70 hover:bg-[#4F46E5]/10 transition-all shrink-0"
                    title="Back to job details"
                  >
                    <XCircle size={13} />
                  </button>
                </div>

                {/* Body — tight vertical rhythm */}
                <div className="flex-1 overflow-hidden flex flex-col justify-center gap-2 px-5 pt-2.5 pb-3">
                  {analysisBodyNode}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Divider — same inset as the header/meta divider above, so both lines read as equal length */}
        <div className="mx-5 border-t border-slate-200/80" />

        {/* Action row */}
        <div className="jobs-card-actions flex items-center justify-between gap-3 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f7fb_100%)] px-5 py-2.5">
          {/* Left: applicant count + match analysis */}
          <div className="flex items-center gap-2.5 min-w-0">
            {props.applicant_count !== undefined && props.applicant_count !== null && (
              <span className="text-[12px] text-gray-400 shrink-0">
                {Number(props.applicant_count) < 25
                  ? "Less than 25 applicants"
                  : `${props.applicant_count} applicants`}
              </span>
            )}
            {props.match_band && (
              <button
                type="button"
                onClick={() => setShowMatchModal(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4F46E5]/15 bg-white px-3 py-1.5 text-[11px] font-bold text-[#4F46E5] shadow-sm transition-all hover:border-[#4F46E5]/30 hover:bg-[#eef3ff] hover:shadow-md active:scale-[0.97]"
                title="Open match report — free basic breakdown or premium deep-dive"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Match Report
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
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all duration-200 ${
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4F46E5]/10 bg-white px-3.5 py-2 text-[12px] font-bold text-[#4F46E5] shadow-sm transition-all hover:border-[#4F46E5]/25 hover:bg-[#eef3ff] hover:shadow-md"
            >
              <Sparkles size={11} className="text-[#4F46E5]" />
              Ask Nancy
            </button>

            {(() => {
              if (shouldPromptResumeCustomize && !isApplied) {
                return (
                  <motion.button
                    type="button"
                    onClick={() => setShowResumePrompt(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#4F46E5] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] transition-all duration-150 hover:bg-[#4338CA] hover:shadow-[0_12px_26px_rgba(79,70,229,0.34)] active:scale-[0.97]"
                  >
                    Apply Now
                  </motion.button>
                );
              }

              if (externalUrl && !isApplied) {
                return (
                  <motion.a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-allow-new-tab
                    onClick={handleExternalApplyClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#4F46E5] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] transition-all duration-150 hover:bg-[#4338CA] hover:shadow-[0_12px_26px_rgba(79,70,229,0.34)] active:scale-[0.97]"
                  >
                    Apply Now
                  </motion.a>
                );
              }

              let panelApplyBtnClass: string;
              let panelApplyBtnLabel: string;
              if (isSubmitting) {
                panelApplyBtnClass = "bg-emerald-400 text-white cursor-wait opacity-70";
                panelApplyBtnLabel = "Applying…";
              } else if (isApplied) {
                panelApplyBtnClass = "bg-gray-100 text-gray-500 cursor-default";
                panelApplyBtnLabel = "✓ Applied";
              } else {
                panelApplyBtnClass = "bg-[#4F46E5] text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:bg-[#4338CA] hover:shadow-[0_12px_26px_rgba(79,70,229,0.34)] active:scale-[0.97]";
                panelApplyBtnLabel = "Apply Now";
              }

              return (
                <motion.button
                  type="button"
                  onClick={handleApplyNow}
                  disabled={isSubmitting || isApplied}
                  whileHover={!isApplied && !isSubmitting ? { scale: 1.03 } : undefined}
                  whileTap={!isApplied && !isSubmitting ? { scale: 0.96 } : undefined}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2.5 text-[13px] font-bold transition-all duration-150 ${panelApplyBtnClass}`}
                >
                  {panelApplyBtnLabel}
                </motion.button>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ── RIGHT: AI match panel ── */}
      {hasMatchScore && props.match_band && (
        <div
          className="flex w-[140px] shrink-0 cursor-pointer select-none flex-col my-[3px] mr-[3px]"
          onClick={handleScoreHover}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleScoreHover();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            className="jobs-score-panel group/panel relative flex flex-1 flex-col items-center overflow-hidden rounded-[18px] px-4 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.14)] transition-all duration-300"
            style={{ background: "linear-gradient(160deg, #0f1d33 0%, #172b4a 46%, #214b86 100%)" }}
          >
            {/* Ambient glow behind ring */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover/panel:opacity-100"
              style={{ background: `radial-gradient(ellipse 130% 80% at 50% -5%, ${circleStroke}28 0%, transparent 68%)` }} />
            {/* Top-right AI sparkle dot */}
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full opacity-60 animate-pulse"
              style={{ background: circleStroke }} />

            {/* Score ring + band label + signal rows — one group that centers together
                in the middle of the panel, so the ring lands mid-card regardless of
                whether the signal rows below it are present. */}
            <div className="relative z-10 flex flex-1 w-full flex-col items-center justify-center gap-2">
              <svg width="94" height="94" viewBox="0 0 94 94" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id={`panel-grad-${props.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={circleStroke} stopOpacity="1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="47" cy="47" r={circleR} stroke="rgba(255,255,255,0.08)" strokeWidth="5.5" fill="none" />
                {/* Progress */}
                <circle
                  cx="47" cy="47" r={circleR}
                  stroke={`url(#panel-grad-${props.id})`}
                  strokeWidth="5.5" fill="none"
                  strokeDasharray={circleC} strokeDashoffset={circleOffset}
                  strokeLinecap="round" transform="rotate(-90 47 47)"
                  className="transition-all duration-700"
                  style={{ filter: `drop-shadow(0 0 6px ${circleStroke}80)` }}
                />
                {/* Score */}
                <text x="47" y="47" textAnchor="middle" fontSize="21" fontWeight="800" fill="white" dominantBaseline="middle">
                  {Math.round(props.matchScore!)}%
                </text>
              </svg>

              <span className="text-center text-[12px] font-extrabold uppercase leading-tight tracking-wide text-white">
                {circleLabel}
              </span>

              {/* Signal rows — only real, backend-provided attributes; the divider only appears when there's something to show under it */}
              {(props.h1b_sponsor || props.remote) && (
                <div className="w-full space-y-1.5 border-t border-white/10 pt-2.5 mt-1">
                  {props.h1b_sponsor && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="shrink-0 text-emerald-400" />
                      <span className="text-[10.5px] font-semibold leading-tight text-white/80">H1B Sponsor Likely</span>
                    </div>
                  )}
                  {props.remote && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="shrink-0 text-emerald-400" />
                      <span className="text-[10.5px] font-semibold leading-tight text-white/80">Remote Friendly</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive hint — pinned below the centered group */}
            <span className="relative z-10 mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/45 transition-colors group-hover/panel:text-white/80">
              {showExplanation ? "Close" : "View Analysis"}
              <ChevronDown size={11} className={`transition-transform duration-200 ${showExplanation ? "rotate-180" : ""}`} />
            </span>
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

    {showPreview && (
      <JobPreviewModal
        title={props.title}
        company={props.company}
        location={props.location}
        type={props.type}
        mode={props.mode}
        remote={props.remote}
        salary={props.salary}
        experience={props.experience}
        education={props.education}
        skills={props.skills}
        description={props.description}
        responsibilities={props.responsibilities}
        requirements={props.requirements}
        source={props.source}
        postedLabel={formatPostedTime(props.created_at || props.posted_date)}
        matchScore={props.matchScore}
        match_band={props.match_band}
        matched_skills={props.matched_skills}
        missing_skills={props.missing_skills}
        isSaved={isSaved}
        isApplied={isApplied}
        externalUrl={externalUrl}
        onClose={() => setShowPreview(false)}
        onSaveClick={handleSaveJob}
        onApplyClick={handlePreviewApplyClick}
      />
    )}

    {menuNode}
    {showResumePrompt && (
      <ResumeCustomizePrompt
        jobTitle={props.title}
        company={props.company}
        logo={props.logo}
        matchScore={props.matchScore ?? 0}
        bandColor={bandCfg.color}
        bandLabel={bandCfg.label}
        missingSkills={missingSkillsForPrompt}
        applyUrl={externalUrl || ""}
        onClose={() => {
          // "Do not remind me again" was only persisted by the two action
          // buttons (Fix My Resume Now / Apply Without Customizing) — a user
          // who checks the box and just closes the popup (X button or
          // backdrop click) had the checkbox silently discarded, so the
          // prompt kept reappearing on later jobs despite having checked it.
          persistSkipIfChecked();
          setShowResumePrompt(false);
        }}
        onFixResume={handleFixResume}
        fixingResume={isPreparingResumeFix}
        onApplyWithoutCustomizing={handleApplyWithoutCustomizing}
        dontRemindAgain={dontRemindAgain}
        onDontRemindAgainChange={setDontRemindAgain}
      />
    )}
    </>
  );
}
