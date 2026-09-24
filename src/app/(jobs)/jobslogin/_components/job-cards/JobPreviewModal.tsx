"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef } from "react";
import {
  Briefcase,
  Calendar,
  Check,
  CircleDollarSign,
  ExternalLink,
  Heart,
  Home,
  Layers,
  MapPin,
  X,
} from "lucide-react";
import { getMatchBandConfig } from "../utils/matchBand";
import { getSafeExternalUrl } from "@/utils/validators";

interface JobPreviewModalProps {
  title: string;
  company: string;
  location?: string;
  logo?: string;
  type?: string;
  mode?: string;
  remote?: boolean;
  salary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string[];
  source?: string;
  postedLabel?: string;
  matchScore?: number;
  match_band?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  isSaved?: boolean;
  isApplied?: boolean;
  externalUrl?: string;
  onClose: () => void;
  onSaveClick: () => void;
  onApplyClick: () => void;
}

function formatDescription(raw?: string): string[] {
  if (!raw) return [];
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    current += sentence;
    if (current.length > 280) {
      paragraphs.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}

const factClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm";

const SKILL_CHIP_STATE_CLASSES: Record<"matched" | "missing" | "neutral", string> = {
  matched: "border-emerald-200 bg-emerald-50 text-emerald-800",
  missing: "border-orange-200 bg-orange-50 text-orange-800",
  neutral: "border-slate-200 bg-white text-slate-700",
};

export default function JobPreviewModal(props: JobPreviewModalProps) {
  const { onClose } = props;
  const hasMatchScore = !!props.matchScore && Math.round(props.matchScore) > 0;
  const bandCfg = getMatchBandConfig(props.match_band);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const paragraphs = formatDescription(props.description);
  const responsibilityParagraphs = formatDescription(props.responsibilities);
  const skillChips = props.skills
    ? props.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
    : [];
  const matchedSet = new Set((props.matched_skills || []).map((skill) => skill.toLowerCase()));
  const missingSet = new Set((props.missing_skills || []).map((skill) => skill.toLowerCase()));
  // Re-derived here (not just trusted from the caller) so this modal is safe
  // to reuse even if a future caller passes a raw, unnormalized job URL.
  const safeExternalUrl = getSafeExternalUrl(props.externalUrl);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const matchBadge = hasMatchScore ? (
    <span
      className="inline-flex shrink-0 rounded-full px-3.5 py-2 text-xs font-bold"
      style={{
        background: bandCfg.bg,
        color: bandCfg.color,
        border: `1px solid ${bandCfg.color}33`,
      }}
      title="Match score based on your profile and this job's requirements"
    >
      {Math.round(props.matchScore!)}% match · {bandCfg.label}
    </span>
  ) : null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      onClick={props.onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex max-h-[94dvh] w-full max-w-[740px] flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.38)] outline-none sm:max-h-[88vh] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative z-10 shrink-0 border-b border-slate-200 bg-white px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="max-w-[520px] text-xl font-extrabold leading-[1.25] tracking-[-0.02em] text-slate-950 sm:text-2xl"
              >
                {props.title || "Job Title"}
              </h2>
              <p className="mt-2 truncate text-sm font-medium text-slate-500">
                {props.company || "Company"}
                {props.source && <span> · {props.source}</span>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">{matchBadge}</div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={props.onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                aria-label="Close job details"
                title="Close"
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>
          </div>
          <div className="mt-4 sm:hidden">{matchBadge}</div>
        </header>

        <main
          id={descriptionId}
          className="job-preview-scroll relative z-10 flex-1 overflow-y-auto bg-slate-50/60 px-5 py-5 sm:px-7 sm:py-6"
        >
          {(props.location ||
            props.type ||
            props.mode ||
            props.salary ||
            props.experience ||
            props.education) && (
            <div className="mb-7 flex flex-wrap gap-2">
              {props.location && (
                <span className={factClass}>
                  <MapPin size={14} className="text-slate-500" /> {props.location}
                </span>
              )}
              {props.type && (
                <span className={factClass}>
                  <Briefcase size={14} className="text-slate-500" /> {props.type}
                </span>
              )}
              {props.mode && (
                <span className={factClass}>
                  <Home size={14} className="text-slate-500" /> {props.mode}
                </span>
              )}
              {!props.mode && props.remote && (
                <span className={factClass}>
                  <Home size={14} className="text-slate-500" /> Remote
                </span>
              )}
              {props.postedLabel && (
                <span className={factClass}>
                  <Calendar size={14} className="text-slate-500" /> Posted {props.postedLabel}
                </span>
              )}
              {props.experience && (
                <span className={factClass}>
                  <Layers size={14} className="text-slate-500" /> {props.experience}
                </span>
              )}
              {props.education && (
                <span className={factClass}>
                  <Calendar size={14} className="text-slate-500" /> {props.education}
                </span>
              )}
              {props.salary && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                  <CircleDollarSign size={14} className="text-emerald-600" /> {props.salary}
                </span>
              )}
            </div>
          )}

          {paragraphs.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Job Description
              </h3>
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`} className="max-w-[74ch] text-sm leading-7 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ) : (
            <p className="text-sm text-slate-500">No description provided for this listing.</p>
          )}

          {responsibilityParagraphs.length > 0 && (
            <section className="mt-7 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Responsibilities
              </h3>
              {responsibilityParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`} className="max-w-[74ch] text-sm leading-7 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {!!props.requirements?.length && (
            <section className="mt-7">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Requirements
              </h3>
              <ul className="list-disc space-y-1.5 pl-4">
                {props.requirements.map((requirement, index) => (
                  <li
                    key={`${index}-${requirement.slice(0, 20)}`}
                    className="text-sm leading-7 text-slate-700 marker:text-indigo-500"
                  >
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {skillChips.length > 0 && (
            <section className="mt-7">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillChips.map((skill) => {
                  const normalizedSkill = skill.toLowerCase();
                  let state: "matched" | "missing" | "neutral";
                  if (matchedSet.has(normalizedSkill)) state = "matched";
                  else if (missingSet.has(normalizedSkill)) state = "missing";
                  else state = "neutral";

                  return (
                    <span
                      key={skill}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${SKILL_CHIP_STATE_CLASSES[state]}`}
                    >
                      {state === "matched" ? "✓ " : ""}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <footer className="relative z-10 flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-10px_28px_rgba(15,23,42,0.06)] sm:px-7">
          <button
            type="button"
            onClick={props.onSaveClick}
            aria-pressed={props.isSaved}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
              props.isSaved
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            }`}
            title={props.isSaved ? "Remove from saved" : "Save job"}
            aria-label={props.isSaved ? "Remove from saved jobs" : "Save job"}
          >
            <Heart size={19} className={props.isSaved ? "fill-rose-600" : ""} />
          </button>

          {safeExternalUrl && !props.isApplied ? (
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-allow-new-tab
              onClick={props.onApplyClick}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_28px_rgba(79,70,229,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              Apply Now <ExternalLink size={16} />
            </a>
          ) : (
            <button
              type="button"
              onClick={props.onApplyClick}
              disabled={props.isApplied}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                props.isApplied
                  ? "cursor-default bg-slate-100 text-slate-500"
                  : "bg-indigo-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_28px_rgba(79,70,229,0.3)]"
              }`}
            >
              {props.isApplied ? (
                <>
                  <Check size={17} /> Applied
                </>
              ) : (
                "Apply Now"
              )}
            </button>
          )}
        </footer>

        <style jsx>{`
          .job-preview-scroll {
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 transparent;
          }
          .job-preview-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .job-preview-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .job-preview-scroll::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border: 2px solid transparent;
            border-radius: 999px;
            background-clip: padding-box;
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
