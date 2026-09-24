"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  BriefcaseBusiness,
  Calendar,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  Flag,
  Heart,
  Home,
  Layers,
  ListChecks,
  MapPin,
  Share2,
  Wrench,
} from "lucide-react";
import { getSafeExternalUrl } from "@/utils/validators";
import { isJobSaved, toggleJobSaved, recordJobApplication } from "@/utils/jobTracking";
import { applyToJob, type ApplicationData } from "@/utils/jobApplication";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { getMatchExplanation, type MatchExplanationResponse } from "@/api/insightsApi";
import ApplicationModal from "./job-cards/ApplicationModal";
import type { NormalizedJob } from "./JobsContents";

// Same palette JobCard.tsx uses for its fallback logo initial — kept as a
// small local copy rather than importing a non-exported helper across files.
const LOGO_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-lime-100", text: "text-lime-700" },
];

function getLogoColor(company: string) {
  const code = (company || "J").toUpperCase().codePointAt(0)!;
  return LOGO_PALETTE[code % LOGO_PALETTE.length];
}

const pluralizeAgo = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

function formatPostedTime(dateStr?: string | null): string {
  if (!dateStr) return "";
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
    return "";
  }
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
        {icon}
      </span>
      <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-slate-700">{children}</h2>
    </div>
  );
}

// Renders in place of the filter bar + job list (see JobsContents.tsx) when a
// job title is clicked — same content JobPreviewModal shows, just inline on
// the page instead of as an overlay, per the "no popup, no separate page"
// request. Sidebar stays untouched; "Back" restores the list.
interface JobDetailsInlineProps {
  job: NormalizedJob;
  onBack: () => void;
  onSaveToggle?: (saved: boolean) => void;
  onApplyClick?: () => void;
}

type DescriptionBlock = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function pushParagraphBlocks(html: string, blocks: DescriptionBlock[]): void {
  const text = stripTags(html);
  if (!text) return;

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = "";
  for (const sentence of sentences) {
    current += sentence;
    if (current.length > 280) {
      blocks.push({ type: "paragraph", text: current.trim() });
      current = "";
    }
  }
  if (current.trim()) blocks.push({ type: "paragraph", text: current.trim() });
}

// Splits raw description/responsibilities HTML into paragraph and bulleted-list
// blocks, in source order — so a <ul><li> job posting renders as real bullets
// instead of the old approach (strip all tags, then re-chunk by length), which
// flattened lists into one run-on paragraph. Sources that never had list markup
// to begin with (plain scraped text with no <li> boundaries) still render as
// paragraphs — there's no reliable signal to reconstruct bullets that were
// never there, and guessing split points would misrender as often as it helped.
function parseDescriptionBlocks(raw?: string): DescriptionBlock[] {
  if (!raw) return [];
  const blocks: DescriptionBlock[] = [];
  const listBlockRe = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = listBlockRe.exec(raw)) !== null) {
    pushParagraphBlocks(raw.slice(lastIndex, match.index), blocks);
    const items = Array.from(match[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
      .map((m) => stripTags(m[1]))
      .filter(Boolean);
    if (items.length > 0) blocks.push({ type: "list", items });
    lastIndex = match.index + match[0].length;
  }
  pushParagraphBlocks(raw.slice(lastIndex), blocks);
  return blocks;
}

function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item.slice(0, 20)}`} className="text-sm leading-7 text-slate-700 marker:text-indigo-500">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-sm leading-7 text-slate-700">
            {block.text}
          </p>
        );
      })}
    </>
  );
}

const factClass = "inline-flex items-center gap-2 text-sm font-bold text-slate-800";

const SKILL_CHIP_STATE_CLASSES: Record<"matched" | "missing" | "neutral", string> = {
  matched: "border-emerald-200 bg-emerald-50 text-emerald-800",
  missing: "border-orange-200 bg-orange-50 text-orange-800",
  neutral: "border-slate-200 bg-white text-slate-700",
};

export default function JobDetailsInline({ job, onBack, onSaveToggle, onApplyClick }: JobDetailsInlineProps) {
  const { userId } = useCurrentUserId();
  const [isSaved, setIsSaved] = useState(() => isJobSaved(job.id, userId));
  const [isApplied, setIsApplied] = useState(!!job.is_applied);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [explanation, setExplanation] = useState<MatchExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const hasMatchScore = !!job.matchScore && Math.round(job.matchScore) > 0;
  const logoColor = getLogoColor(job.company);
  const postedLabel = formatPostedTime(job.created_at || job.posted_date);

  // Score breakdown — same endpoint JobCard's own flip-panel uses, so this is
  // real backend data, not invented numbers.
  useEffect(() => {
    if (!hasMatchScore) return;
    let cancelled = false;
    setExplanationLoading(true);
    getMatchExplanation(job.id)
      .then((data) => { if (!cancelled) setExplanation(data); })
      .catch(() => { /* breakdown is optional enrichment — silently unavailable */ })
      .finally(() => { if (!cancelled) setExplanationLoading(false); });
    return () => { cancelled = true; };
  }, [job.id, hasMatchScore]);
  const descriptionBlocks = parseDescriptionBlocks(job.description);
  const responsibilityBlocks = parseDescriptionBlocks(job.responsibilities);
  const skillChips = job.skills
    ? job.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
    : [];
  const matchedSet = new Set((job.matched_skills || []).map((skill) => skill.toLowerCase()));
  const missingSet = new Set((job.missing_skills || []).map((skill) => skill.toLowerCase()));
  const safeExternalUrl = getSafeExternalUrl(job.url || job.application_url);

  const handleSaveJob = () => {
    const newState = toggleJobSaved(
      job.id,
      job.title,
      job.company,
      job.location,
      job.type,
      userId,
      job.url || job.application_url,
    );
    setIsSaved(newState);
    toast[newState ? "success" : "info"](newState ? "Job saved!" : "Job removed from saved");
    onSaveToggle?.(newState);
  };

  const handleShare = () => {
    const link = job.url || job.application_url || window.location.href;
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
  };

  const handleReportIssue = () => {
    toast.info("Thanks for reporting. We'll look into it.");
  };

  const handleExternalApplyClick = () => {
    toast.success(`Redirecting to ${job.source || "Company Site"}…`);
    recordJobApplication(job.id, job.title, job.company, job.url || job.application_url || "", userId);
    setIsApplied(true);
    onApplyClick?.();
  };

  const handleApplyNow = () => {
    if (isSubmitting || safeExternalUrl) return;
    if (job.recruiter_id) { setIsModalOpen(true); return; }
    toast.error("Job application method not configured");
  };

  const handleModalSubmit = async (applicationData: ApplicationData) => {
    setIsSubmitting(true);
    try {
      const result = await applyToJob(job.id, applicationData);
      if (result.success) {
        setIsApplied(true);
        setIsModalOpen(false);
        recordJobApplication(job.id, job.title, job.company, job.url || job.application_url || "", userId);
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

  // Same two-tier rule as JobCard's own score panel (75%+ = Good Match,
  // below = Fair Match) — not the backend's 4-tier match_band label, so this
  // card and the job card never disagree on the same job's score.
  const matchLabel = (job.matchScore ?? 0) >= 75 ? "Good Match" : "Fair Match";

  const breakdownRows = explanation
    ? [
        { label: "Experience Level", score: explanation.explanation.experience.score },
        { label: "Skill", score: explanation.explanation.skills.score },
        { label: "Role Fit", score: explanation.explanation.title.score },
        { label: "Education", score: explanation.explanation.education.score },
        { label: "Location", score: explanation.explanation.location.score },
      ]
    : [];

  const matchBadge = hasMatchScore ? (
    <div
      className="w-full shrink-0 rounded-[22px] bg-[#EEF2FF] px-4 pb-4 pt-4 sm:w-[260px]"
      title="Match score based on your profile and this job's requirements"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xl font-black leading-none text-slate-950">
          {Math.round(job.matchScore)}<span className="text-lg">%</span>
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
          {matchLabel}
        </span>
      </div>

      {explanationLoading && (
        <div className="mt-3 space-y-2 rounded-2xl bg-white p-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      )}

      {!explanationLoading && breakdownRows.length > 0 && (
        <div className="mt-3 space-y-2.5 rounded-2xl bg-white p-3.5">
          {breakdownRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-bold text-slate-950">{Math.round(row.score)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="pb-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Back to results
      </button>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-5">
            <span className="border-b-2 border-slate-950 pb-1 text-base font-bold text-slate-950">
              Overview
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              <Share2 size={14} /> Share
            </button>
            <button
              type="button"
              onClick={handleReportIssue}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              <Flag size={14} /> Report Issue
            </button>
            {job.applicant_count !== undefined && job.applicant_count !== null && (
              <span className="text-xs font-semibold text-slate-500">
                {job.applicant_count < 25 ? "Less than 25 applicants" : `${job.applicant_count}+ applicants`}
              </span>
            )}
          </div>
        </div>

        <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
          {/* flex-wrap (not a fixed grid) so the score card drops to its own
              row automatically when there isn't room beside the title,
              instead of overflowing/getting clipped at narrower widths. */}
          <div className="flex flex-wrap content-start items-start gap-4">
            {/* flex-basis:auto (grow, not flex-1's basis:0%) so the browser's
                line-wrap decision is based on this column's natural content
                width — otherwise the score card never gets pushed to its own
                line and the title just gets squeezed to near-zero instead.
                content-start keeps wrapped lines packed tight (no distributed
                gap) when this row wraps to two lines. */}
            <div className="min-w-0 grow basis-auto">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${logoColor.bg} ring-1 ring-black/5`}>
                  {job.logo?.trim() && !logoError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.logo} alt={job.company} width={48} height={48}
                      onError={() => setLogoError(true)} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className={`text-base font-extrabold select-none ${logoColor.text}`}>
                      {(job.company || "J").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-slate-500">
                  {job.company || "Company"}
                  {postedLabel && <span> · {postedLabel}</span>}
                </p>
              </div>
              <h1 className="mt-2.5 max-w-[560px] text-xl font-extrabold leading-[1.25] tracking-[-0.02em] text-slate-950 sm:text-2xl">
                {job.title || "Job Title"}
              </h1>

              {(job.location || job.type || job.mode || job.salary || job.experience || job.education) && (
                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2.5">
                  {job.location && (
                    <span className={factClass}><MapPin size={16} className="text-slate-500" /> {job.location}</span>
                  )}
                  {job.type && (
                    <span className={factClass}><Briefcase size={16} className="text-slate-500" /> {job.type}</span>
                  )}
                  {job.mode && (
                    <span className={factClass}><Home size={16} className="text-slate-500" /> {job.mode}</span>
                  )}
                  {!job.mode && job.remote && (
                    <span className={factClass}><Home size={16} className="text-slate-500" /> Remote</span>
                  )}
                  {job.experience && (
                    <span className={factClass}><Layers size={16} className="text-slate-500" /> {job.experience}</span>
                  )}
                  {job.education && (
                    <span className={factClass}><Calendar size={16} className="text-slate-500" /> {job.education}</span>
                  )}
                  {job.salary && (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                      <CircleDollarSign size={16} className="text-emerald-600" /> {job.salary}
                    </span>
                  )}
                </div>
              )}
            </div>
            {matchBadge}
          </div>
        </header>

        <main className="px-5 py-5 sm:px-7">
          {descriptionBlocks.length > 0 ? (
            <section className="space-y-3">
              <SectionHeading icon={<BriefcaseBusiness size={18} />}>Job Description</SectionHeading>
              <DescriptionBlocks blocks={descriptionBlocks} />
            </section>
          ) : (
            <p className="text-sm text-slate-500">No description provided for this listing.</p>
          )}

          {responsibilityBlocks.length > 0 && (
            <section className="mt-7 space-y-3">
              <SectionHeading icon={<ListChecks size={18} />}>Responsibilities</SectionHeading>
              <DescriptionBlocks blocks={responsibilityBlocks} />
            </section>
          )}

          {!!job.requirements?.length && (
            <section className="mt-7">
              <SectionHeading icon={<ClipboardCheck size={18} />}>Requirements</SectionHeading>
              <ul className="list-disc space-y-1.5 pl-4">
                {job.requirements.map((requirement, index) => (
                  <li key={`${index}-${requirement.slice(0, 20)}`} className="text-sm leading-7 text-slate-700 marker:text-indigo-500">
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {skillChips.length > 0 && (
            <section className="mt-7">
              <SectionHeading icon={<Wrench size={18} />}>Skills</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {skillChips.map((skill) => {
                  const normalizedSkill = skill.toLowerCase();
                  let state: "matched" | "missing" | "neutral";
                  if (matchedSet.has(normalizedSkill)) state = "matched";
                  else if (missingSet.has(normalizedSkill)) state = "missing";
                  else state = "neutral";
                  return (
                    <span key={skill} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${SKILL_CHIP_STATE_CLASSES[state]}`}>
                      {state === "matched" ? "✓ " : ""}{skill}
                    </span>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <footer className="flex items-center gap-3 border-t border-slate-200 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={handleSaveJob}
            aria-pressed={isSaved}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${
              isSaved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            }`}
            title={isSaved ? "Remove from saved" : "Save job"}
            aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
          >
            <Heart size={19} className={isSaved ? "fill-rose-600" : ""} />
          </button>

          {safeExternalUrl && !isApplied ? (
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-allow-new-tab
              onClick={handleExternalApplyClick}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Apply Now <ExternalLink size={16} />
            </a>
          ) : (
            <button
              type="button"
              onClick={handleApplyNow}
              disabled={isApplied || isSubmitting}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all ${
                isApplied ? "cursor-default bg-slate-100 text-slate-500" : "bg-indigo-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 hover:bg-indigo-700"
              }`}
            >
              {isApplied ? (<><Check size={17} /> Applied</>) : "Apply Now"}
            </button>
          )}
        </footer>
      </div>

      <ApplicationModal
        isOpen={isModalOpen}
        jobTitle={job.title}
        jobCompany={job.company}
        location={job.location}
        jobType={job.type}
        recruiterName="Available"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
