"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles, Briefcase, CircleDollarSign, Layers, MoreHorizontal, Home, Calendar, XCircle, CheckCircle, Share2, Flag, AlertTriangle, ChevronRight } from "lucide-react";
import { GoLocation } from "react-icons/go";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { isJobSaved, toggleJobSaved, recordJobApplication } from "@/utils/jobTracking";
import ApplicationModal, { ApplicationData } from "./ApplicationModal";
import MatchAnalysisModal from "./MatchAnalysisModal";
import ResumeCustomizePrompt from "./ResumeCustomizePrompt";
import { applyToJob } from "@/utils/jobApplication";
import { getMatchExplanation } from "@/api/insightsApi";
import type { MatchExplanationResponse } from "@/api/insightsApi";
import { parseResumeFromProfile, parseJdByJob } from "@/api/premiumApi";
import { matchResumeAndJD, getResume, getMatchAnalytics, parseJDText } from "@/api/parserApi";
import { isValidBackendJobId } from "@/utils/jobIdHelper";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { getMatchBandConfig } from "../utils/matchBand";
import { recordJobPreferenceSignal, type JobPreferenceSignal } from "@/utils/jobPreferenceLearning";

const SKIP_RESUME_PROMPT_KEY = "skipResumeCustomizePrompt";

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
  onApplyClick?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

// Assign a consistent color to each company based on first letter
const LOGO_PALETTE = [
  { bg: "bg-indigo-50", text: "text-indigo-700" },
  { bg: "bg-slate-100", text: "text-slate-700" },
  { bg: "bg-[#f1f3ff]", text: "text-[#4F46E5]" },
];

function getLogoColor(company: string) {
  const code = (company || "J").toUpperCase().charCodeAt(0);
  return LOGO_PALETTE[code % LOGO_PALETTE.length];
}

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

  const externalUrl = props.url || props.application_url;
  const recordSignal = (signal: JobPreferenceSignal) => {
    recordJobPreferenceSignal(signal, props, userId);
  };

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
        recordJobApplication(props.id, props.title, props.company, props.url || props.application_url || "", userId, { ...props });
        recordSignal("applied");
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
    const newState = toggleJobSaved(props.id, props.title, props.company, props.location, props.type, userId, { ...props });
    setIsSaved(newState);
    recordSignal(newState ? "saved" : "unsaved");
    toast[newState ? "success" : "info"](newState ? "Job saved!" : "Job removed from saved");
  };

  const level = deriveExperienceLevelFromYears(props.experience) || props.experience_level;
  const logoColor = getLogoColor(props.company);
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];
  const hasMissingSkills = !!props.missing_skills?.length;
  const isNew = (() => {
    const d = props.created_at || props.posted_date;
    if (!d) return false;
    try { return Date.now() - new Date(d).getTime() < 86400000; } catch { return false; }
  })();
  const sourceLabel = props.source && props.source !== "portal" ? props.source : "";
  const hasMatchScore = !!props.matchScore && Math.round(props.matchScore) > 0;

  // Smart Match jobs with a weak, fixable match get a "customize your resume
  // first?" gate before applying — reuses the match/skill-gap data already on
  // the card (no extra API call). Jobs without match data skip straight to
  // the normal Apply Now flow.
  const missingSkillsForPrompt = props.missing_skills ?? [];
  const shouldPromptResumeCustomize =
    hasMatchScore &&
    !!externalUrl &&
    !skipResumePrompt &&
    (props.match_band === "low" || props.match_band === "partial") &&
    missingSkillsForPrompt.length > 0;

  const persistSkipIfChecked = () => {
    if (!dontRemindAgain) return;
    setSkipResumePrompt(true);
    try { localStorage.setItem(SKIP_RESUME_PROMPT_KEY, "true"); } catch { /* ignore */ }
  };

  // Runs the same free match pipeline the jobmatch page itself runs when a
  // resume_id + jd_id are already known, then seeds its sessionStorage in the
  // exact shape Overview.tsx expects (see its analyzeMatch()) plus a one-shot
  // jm_skipWizard flag so it renders results (with resume preview) directly
  // instead of the upload wizard.
  const handleFixResume = async () => {
    if (isPreparingResumeFix) return;
    if (!isValidBackendJobId(props.id)) {
      toast.error("This listing hasn't finished syncing yet, so resume matching isn't available for it right now.");
      return;
    }
    persistSkipIfChecked();
    // Keep the modal open (showing the "Preparing your match…" button state
    // below) for the whole async pipeline — closing it here would hide that
    // loading state immediately, leaving no visible feedback until the hard
    // navigation at the end lands.
    setIsPreparingResumeFix(true);
    try {
      // parseJdByJob requires the backend to already have this job's JD
      // pre-indexed, which isn't true for every source (e.g. newer/less
      // common listings) — fall back to parsing the description text we
      // already have on the card, same as the manual "paste JD" wizard step.
      const resolveJdId = async (): Promise<string> => {
        try {
          const byJob = await parseJdByJob(props.id);
          if (byJob.jd_id) return byJob.jd_id;
        } catch { /* fall through to text-based parse */ }
        if (!props.description?.trim()) {
          throw new Error("This job has no description text to match against.");
        }
        const byText = await parseJDText(props.description);
        if (!byText.jd_id) throw new Error("Could not parse this job's description.");
        return byText.jd_id;
      };

      const [profileRes, jd_id] = await Promise.all([
        parseResumeFromProfile(),
        resolveJdId(),
      ]);

      const fullResumeData = await getResume(profileRes.resume_id).catch(() => null);

      // A freshly-created JD (from the parseJDText fallback above) can 404
      // with "jd_not_found" for a moment before the backend finishes making
      // it queryable — retry with backoff, same as Overview.tsx's analyzeMatch().
      let matchResp: Record<string, unknown> | undefined;
      let matchAttempt = 0;
      const maxMatchRetries = 2;
      while (matchAttempt <= maxMatchRetries) {
        try {
          matchResp = await matchResumeAndJD(profileRes.resume_id, jd_id) as Record<string, unknown>;
          break;
        } catch (matchErr) {
          matchAttempt++;
          if (matchAttempt > maxMatchRetries) throw matchErr;
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, matchAttempt - 1)));
        }
      }

      let finalMatchData = (matchResp?.data ?? matchResp) as Record<string, unknown>;
      try {
        const analytics = await getMatchAnalytics(profileRes.resume_id, jd_id);
        if (analytics) finalMatchData = { ...finalMatchData, analytics };
      } catch { /* optional enrichment */ }

      const newMatchResults = {
        data: finalMatchData,
        match_id: matchResp?.match_id ?? finalMatchData?.match_id,
        jd_id,
        duplicate: matchResp?.duplicate,
      };

      sessionStorage.setItem("jm_matchResults", JSON.stringify(newMatchResults));
      sessionStorage.setItem("jm_parsedResumeData", JSON.stringify(fullResumeData));
      sessionStorage.setItem("jm_parsedJDData", JSON.stringify(null));
      sessionStorage.setItem("jm_jdText", props.description || `${props.title} at ${props.company}`);
      sessionStorage.setItem("jm_skipWizard", "true");
      recordSignal("tailored");

      // Hard navigation, not router.push(): if /jobmatch/app was already
      // visited earlier this session, Next's client-side route cache can
      // reuse that mounted page instead of remounting it, which would skip
      // re-reading the sessionStorage we just seeded.
      window.location.href = "/jobmatch/app";
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { must_parse?: boolean } } })?.response?.status;
      const body = (err as { response?: { data?: { must_parse?: boolean } } })?.response?.data;
      if (status === 409 && body?.must_parse) {
        toast.error("Your resume hasn't been parsed yet. Please run an ATS scan first, then try again.");
      } else if (status === 404) {
        toast.error("No resume found on your profile. Please upload a resume first.");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not prepare your match analysis. Please try again.");
      }
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

  // "Why you match" — a one-line summary built from real matched/missing
  // skill counts already on the job, so it's visible without an extra
  // per-card API call (unlike the 5-dimension flip panel below).
  const whyYouMatch = (() => {
    const matchedCount = props.matched_skills?.length ?? 0;
    const missingCount = props.missing_skills?.length ?? 0;
    if (!hasMatchScore || (matchedCount === 0 && missingCount === 0)) return null;
    const parts: string[] = [];
    if (matchedCount > 0) parts.push(`Matches ${matchedCount} required skill${matchedCount === 1 ? "" : "s"}`);
    if (missingCount > 0) parts.push(`${missingCount} to grow`);
    return parts.join(" · ");
  })();

  const circleR = 27;
  const circleC = 2 * Math.PI * circleR;
  const circleOffset = circleC - ((props.matchScore || 0) / 100) * circleC;
  const bandCfg = getMatchBandConfig(props.match_band);
  const circleStroke = props.match_band ? bandCfg.color : "#14b8a6";
  const circleLabel = props.match_band ? bandCfg.label.toUpperCase() : "";
  const contentMinHeight = hasMatchScore
    ? (hasMissingSkills ? 218 : 168) + (whyYouMatch ? 18 : 0)
    : 136;

  const skillsNode = (() => {
    const hasMatchData =
      (props.matched_skills && props.matched_skills.length > 0) ||
      (props.missing_skills && props.missing_skills.length > 0);

    if (!hasMatchData) {
      return skillChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {skillChips.slice(0, 3).map((skill) => (
            <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-full border border-gray-200/70">
              {skill}
            </span>
          ))}
          {skillChips.length > 3 && (
            <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
              +{skillChips.length - 3} more
            </span>
          )}
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

    const visible = chips.slice(0, 4);
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

  const menuNode = showMenu && menuPos ? createPortal(
    <div
      ref={menuPortalRef}
      style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
      className="w-48 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] border border-gray-100 py-1.5"
    >
      {[
        {
          icon: XCircle, label: "Remove From List",
          action: () => { setShowMenu(false); recordSignal("dismissed"); props.onRemove?.(); toast.success("Job removed from list"); },
        },
        {
          icon: CheckCircle, label: "Already Applied",
          action: () => {
            recordJobApplication(props.id, props.title, props.company, props.url || props.application_url || "", userId, { ...props });
            recordSignal("applied");
            setIsApplied(true);
            setShowMenu(false);
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
    return (
      <>
        <motion.div
          role="group"
          tabIndex={0}
          data-job-id={props.id}
          aria-label={`${props.title} at ${props.company}. Press Enter to open job preview.`}
          data-selected={props.isSelected || undefined}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button, a")) return;
            props.onSelect?.();
          }}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              props.onSelect?.();
            }
          }}
          className={`jobs-card group relative overflow-hidden border bg-white px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 ${
            props.isSelected ? "border-[#4F46E5]/45 ring-2 ring-[#4F46E5]/10" : "border-slate-200/80"
          }`}
          whileHover={{}}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] ${logoColor.bg} ring-1 ring-black/5 shadow-sm`}>
              {props.logo && props.logo.trim() && !logoError ? (
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
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {(props.created_at || props.posted_date) && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    {formatPostedTime(props.created_at || props.posted_date)}
                  </span>
                )}
                {isNew && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    Be an early applicant
                  </span>
                )}
              </div>
              <h3 className="line-clamp-1 text-[17px] font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#4F46E5]">
                {props.title || "Job Title"}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-slate-500">
                <span className="font-semibold text-slate-700">{props.company || "Company"}</span>
                {sourceLabel && <span className="text-slate-400"> · {sourceLabel}</span>}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => props.onSelect?.()}
                className="group/view inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11.5px] font-bold text-[#4F46E5] transition-colors hover:text-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/35 focus-visible:ring-offset-2"
                title="Open quick view"
                aria-label="Open quick view"
              >
                Quick view
                <ChevronRight size={13} strokeWidth={2.25} className="transition-transform group-hover/view:translate-x-0.5" />
              </button>
              <button
                ref={menuBtnRef}
                type="button"
                onClick={handleMenuOpen}
                className="rounded-xl p-1.5 text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-600"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
          </div>

          {(props.location || props.type || props.salary || props.mode || level || props.experience) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 pt-2.5">
                {props.location && (
                  <span className="inline-flex min-w-0 max-w-[min(360px,45vw)] items-center gap-1.5 text-[12.5px] font-semibold text-slate-700" title={props.location}>
                    <GoLocation size={15} stroke="currentColor" strokeWidth={1.5} className="shrink-0 text-slate-500" />
                    <span className="truncate">{props.location}</span>
                  </span>
                )}
                {props.type && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                    <Briefcase size={15} strokeWidth={2} className="shrink-0 text-slate-500" />
                    {props.type}
                  </span>
                )}
                {props.salary && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                    <CircleDollarSign size={15} strokeWidth={2} className="shrink-0 text-slate-500" />
                    {props.salary}
                  </span>
                )}
                {props.mode && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                    <Home size={15} strokeWidth={2} className="shrink-0 text-slate-500" />
                    {props.mode}
                  </span>
                )}
                {level && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                    <Layers size={15} strokeWidth={2} className="shrink-0 text-slate-500" />
                    {level}
                  </span>
                )}
                {props.experience && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                    <Calendar size={15} strokeWidth={2} className="shrink-0 text-slate-500" />
                    {props.experience}
                  </span>
                )}
              </div>
          )}

          {skillChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skillChips.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-500">
                  {skill}
                </span>
              ))}
              {skillChips.length > 3 && (
                <span className="px-2 py-1 text-[11.5px] font-semibold text-slate-400">
                  +{skillChips.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <span className="text-[12px] text-slate-400">
              {props.applicant_count !== undefined && props.applicant_count !== null
                ? Number(props.applicant_count) < 25
                  ? "Less than 25 applicants"
                  : `${props.applicant_count} applicants`
                : ""}
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {props.onRemove && (
                <motion.button
                  type="button"
                  onClick={() => { recordSignal("dismissed"); props.onRemove?.(); toast.success("Job removed from list"); }}
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
                  isSaved ? "bg-indigo-50 text-[#4F46E5]" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-[#4F46E5]"
                }`}
                title={isSaved ? "Remove from saved" : "Save job"}
                aria-label={isSaved ? "Remove from saved" : "Save job"}
              >
                <Heart size={16} strokeWidth={2.5} className={isSaved ? "fill-[#4F46E5]" : ""} />
              </motion.button>
              <button
                type="button"
                onClick={props.onBotClick}
                aria-label="Ask Nancy AI about this job"
                className="jobs-card-secondary-action inline-flex h-10 items-center gap-1.5 border border-[#4F46E5]/15 bg-white px-4 text-[12px] font-bold text-[#4F46E5] transition-all hover:border-[#4F46E5]/30 hover:bg-[#eef3ff]"
              >
                <Sparkles size={12} />
                Check fit
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
                  className="jobs-card-primary-action inline-flex h-10 items-center whitespace-nowrap bg-[#4F46E5] px-5 text-[13px] font-bold text-white transition-all hover:bg-[#4338CA]"
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
                  className={`inline-flex h-10 items-center whitespace-nowrap rounded-2xl px-5 text-[13px] font-bold transition-all ${
                    isSubmitting
                      ? "bg-emerald-400 text-white cursor-wait opacity-70"
                      : isApplied
                      ? "bg-slate-100 text-slate-500 cursor-default"
                      : "bg-[#4F46E5] text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:bg-[#4338CA]"
                  }`}
                >
                  {isSubmitting ? "Applying..." : isApplied ? "Applied" : "Apply Now"}
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
      </>
    );
  }

  return (
    <>
    {/* Card: outer flex row so dark panel can span full height as a sibling */}
    <motion.div
      role="group"
      tabIndex={0}
      data-job-id={props.id}
      aria-label={`${props.title} at ${props.company}. Press Enter to open job preview.`}
      data-selected={props.isSelected || undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a")) return;
        props.onSelect?.();
      }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          props.onSelect?.();
        }
      }}
      className={`jobs-card jobs-card--matched group relative flex overflow-hidden border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 ${
        props.isSelected ? "border-[#4F46E5]/45 ring-2 ring-[#4F46E5]/10" : "border-slate-200/70"
      }`}
      whileHover={{}}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
{/* ── LEFT COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Swappable content zone: fixed height, both faces absolute-inset ── */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: contentMinHeight }}>
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
                <div className="flex items-start gap-3 px-4 pt-4 pb-0">
                  {/* Logo */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] ${logoColor.bg} ring-1 ring-black/5 shadow-[0_10px_22px_rgba(15,23,42,0.11)]`}>
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
                            <span className="text-[11.5px] font-semibold text-slate-400">
                              {formatPostedTime(props.created_at || props.posted_date)}
                            </span>
                          )}
                          {isNew && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
                              Early Applicant
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="line-clamp-1 cursor-pointer text-[18px] font-extrabold leading-snug text-slate-950 transition-colors duration-150 hover:text-[#4F46E5]">
                            {props.title || "Job Title"}
                          </h3>
                          {hasMatchScore && (
                            <span
                              className="shrink-0 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                              style={{ color: bandCfg.color, background: bandCfg.bg }}
                            >
                              {Math.round(props.matchScore!)}% Match
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          <span className="font-bold text-slate-700">{props.company || "Company"}</span>
                          {sourceLabel && <span className="text-gray-400"> · {sourceLabel}</span>}
                        </p>
                      </div>
                      <div className="mt-0.5 flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => props.onSelect?.()}
                          className="group/view inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11.5px] font-bold text-[#4F46E5] transition-colors hover:text-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/35 focus-visible:ring-offset-2"
                          title="Open quick view"
                          aria-label="Open quick view"
                        >
                          Quick view
                          <ChevronRight size={13} strokeWidth={2.25} className="transition-transform group-hover/view:translate-x-0.5" />
                        </button>
                        <button ref={menuBtnRef} type="button" onClick={handleMenuOpen}
                          className="rounded-xl p-1.5 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                          title="More options" aria-label="More options">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 pt-2.5 pb-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {props.location && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600" title={props.location}>
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="max-w-[180px] truncate">{props.location}</span>
                      </span>
                    )}
                    {props.type && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                        <Briefcase size={11} className="text-gray-400 shrink-0" />
                        {props.type}
                      </span>
                    )}
                    {props.mode && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                        <Home size={11} className="text-gray-400 shrink-0" />
                        {props.mode}
                      </span>
                    )}
                    {level && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                        <Layers size={11} className="text-gray-400 shrink-0" />
                        {level}
                      </span>
                    )}
                    {props.experience && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                        <Calendar size={11} className="text-gray-400 shrink-0" />
                        {props.experience}
                      </span>
                    )}
                    {props.salary && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
                        <CircleDollarSign size={11} className="shrink-0 text-slate-400" />
                        {props.salary}
                      </span>
                    )}
                  </div>
                  {whyYouMatch && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: bandCfg.color }}>
                      <CheckCircle size={12} className="shrink-0" />
                      {whyYouMatch}
                    </p>
                  )}
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
                          const color = score >= 50 ? "#4f46e5" : "#64748b";
                          const trackColor = score >= 50 ? "#e0e7ff" : "#e2e8f0";
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
        <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f7fb_100%)] px-4 py-2.5">
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #5896d7, #4338CA)",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
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
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all duration-200 ${
                isSaved ? "border-indigo-200 bg-indigo-50 text-[#4F46E5]" : "border-slate-200 bg-white text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-[#4F46E5]"
              }`}
              title={isSaved ? "Remove from saved" : "Save job"}
              aria-label={isSaved ? "Remove from saved" : "Save job"}
            >
              <Heart size={15} className={`transition-all ${isSaved ? "fill-[#4F46E5]" : ""}`} />
            </motion.button>

            <button
              type="button"
              onClick={props.onBotClick}
              aria-label="Ask Nancy AI about this job"
              className="jobs-card-secondary-action inline-flex shrink-0 items-center gap-1.5 border border-[#4F46E5]/15 bg-white px-3.5 py-2 text-[12px] font-bold text-[#4F46E5] transition-all hover:border-[#4F46E5]/30 hover:bg-[#eef3ff]"
            >
              <Sparkles size={11} className="text-[#4F46E5]" />
              Check fit
            </button>

            {shouldPromptResumeCustomize && !isApplied ? (
              <motion.button
                type="button"
                onClick={() => setShowResumePrompt(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="jobs-card-primary-action inline-flex items-center gap-1.5 whitespace-nowrap bg-[#4F46E5] px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-150 hover:bg-[#4338CA] active:scale-[0.98]"
              >
                Apply Now
              </motion.button>
            ) : externalUrl && !isApplied ? (
              <motion.a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-allow-new-tab
                onClick={handleExternalApplyClick}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="jobs-card-primary-action inline-flex items-center gap-1.5 whitespace-nowrap bg-[#4F46E5] px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-150 hover:bg-[#4338CA] active:scale-[0.98]"
              >
                Apply Now
              </motion.a>
            ) : (
              <motion.button
                type="button"
                onClick={handleApplyNow}
                disabled={isSubmitting || isApplied}
                whileHover={!isApplied && !isSubmitting ? { scale: 1.03 } : undefined}
                whileTap={!isApplied && !isSubmitting ? { scale: 0.96 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`jobs-card-primary-action inline-flex items-center gap-1.5 whitespace-nowrap px-5 py-2.5 text-[13px] font-bold transition-all duration-150 ${
                  isSubmitting
                    ? "bg-emerald-400 text-white cursor-wait opacity-70"
                    : isApplied
                    ? "bg-gray-100 text-gray-500 cursor-default"
                    : "bg-[#4F46E5] text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:bg-[#4338CA] hover:shadow-[0_12px_26px_rgba(79,70,229,0.34)] active:scale-[0.97]"
                }`}
              >
                {isSubmitting ? "Applying…" : isApplied ? "✓ Applied" : "Apply Now"}
              </motion.button>
            )}
          </div>
        </div>

      </div>

      {/* ── RIGHT: AI match panel ── */}
      {hasMatchScore && props.match_band && (
        <div
          className="flex w-[112px] shrink-0 cursor-pointer select-none flex-col"
          onClick={handleScoreHover}
        >
          <div
            className="jobs-match-panel group/panel relative flex flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden px-3 py-4 transition-all duration-300"
            style={{ background: "linear-gradient(160deg, #0f1d33 0%, #172b4a 46%, #214b86 100%)" }}
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
            action: () => { setShowMenu(false); recordSignal("dismissed"); props.onRemove?.(); toast.success("Job removed from list"); },
          },
          {
            icon: CheckCircle, label: "Already Applied",
            action: () => {
              recordJobApplication(props.id, props.title, props.company, props.url || props.application_url || "", userId, { ...props });
              recordSignal("applied");
              setIsApplied(true);
              setShowMenu(false);
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
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#4F46E5] transition-colors text-left group/item"
          >
            <Icon size={15} className="text-gray-400 group-hover/item:text-[#4F46E5] shrink-0 transition-colors" />
            {label}
          </button>
        ))}
      </div>,
      document.body
    )}
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
        onClose={() => setShowResumePrompt(false)}
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
