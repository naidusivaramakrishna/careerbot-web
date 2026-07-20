"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Home,
  MapPin,
  Sparkles,
  ShieldCheck,
  Target,
  X,
  XCircle,
} from "lucide-react";
import { getMatchBandConfig } from "../utils/matchBand";
import { getJobQualitySignal } from "@/utils/jobPreferenceLearning";

export interface PreviewJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  mode?: string;
  salary?: string;
  experience?: string;
  experience_level?: string;
  description?: string;
  source?: string;
  posted_date?: string | null;
  created_at?: string | null;
  url?: string;
  application_url?: string;
  matchScore?: number;
  match_band?: string;
  matched_skills?: string[];
  missing_skills?: string[];
}

interface JobPreviewPanelProps {
  job: PreviewJob;
  onClose: () => void;
  onAskAI: (prompt: string) => void;
  onTailorResume: () => void;
  isModal?: boolean;
}

function postedLabel(value?: string | null) {
  if (!value) return "Recently posted";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently posted";
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${Math.floor(days / 30)} months ago`;
}

function cleanDescription(value?: string) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export default function JobPreviewPanel({ job, onClose, onAskAI, onTailorResume, isModal = false }: JobPreviewPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const score = Math.round(job.matchScore || 0);
  const hasScore = score > 0;
  const band = getMatchBandConfig(job.match_band);
  const applyUrl = job.url || job.application_url;
  const description = cleanDescription(job.description);
  const matched = (job.matched_skills || []).slice(0, 6);
  const missing = (job.missing_skills || []).slice(0, 5);
  const quality = getJobQualitySignal(job);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && isModal && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModal, job.id, onClose]);

  const matchSummary = hasScore
    ? matched.length > 0
      ? `${matched.length} verified skill${matched.length === 1 ? "" : "s"} align with this role.`
      : "Calculated from your role, experience, education, skills, and location alignment."
    : "Add or parse your resume to unlock a personalized match explanation.";

  return (
    <section
      ref={panelRef}
      className="flex h-full min-h-0 flex-col bg-white"
      aria-labelledby="job-preview-title"
      aria-label={`Job preview for ${job.title}`}
    >
      <header className="shrink-0 border-b border-slate-200 bg-white px-5 pb-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#4F46E5]">
              Job preview
            </p>
            <h2 id="job-preview-title" className="text-[19px] font-extrabold leading-tight text-slate-950">
              {job.title}
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-slate-600">
              {job.company}{job.source ? ` · ${job.source}` : ""}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close job preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold text-slate-600">
          {job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>}
          {(job.mode || job.type) && <span className="inline-flex items-center gap-1.5"><Home size={14} />{job.mode || job.type}</span>}
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{postedLabel(job.posted_date || job.created_at)}</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-[14px] border border-indigo-100 bg-[linear-gradient(145deg,#f8f9ff_0%,#eef2ff_100%)] p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-black"
              style={{ color: hasScore ? band.color : "#64748b", background: hasScore ? band.bg : "#f1f5f9" }}
            >
              {hasScore ? `${score}%` : "—"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-extrabold text-slate-900">Why this matches</h3>
                {hasScore && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ color: band.color, background: band.bg }}>
                    {band.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{matchSummary}</p>
            </div>
          </div>
          <p className="mt-3 border-t border-indigo-100 pt-3 text-[11px] leading-relaxed text-slate-500">
            Match scores support your decision; they do not represent an employer’s hiring decision.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {job.type && <Meta icon={<Briefcase size={14} />} label="Job type" value={job.type} />}
          {(job.experience || job.experience_level) && <Meta icon={<Target size={14} />} label="Experience" value={job.experience || job.experience_level || ""} />}
          {job.salary && <Meta icon={<CircleDollarSign size={14} />} label="Salary" value={job.salary} />}
          {job.mode && <Meta icon={<Home size={14} />} label="Work model" value={job.mode} />}
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#4F46E5]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[12px] font-extrabold text-slate-900">Listing quality</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{quality.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {quality.reasons.length > 0 ? quality.reasons.join(" · ") : "This listing provides limited verification details."}
              </p>
            </div>
          </div>
        </div>

        {matched.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[13px] font-extrabold text-slate-900">Skills you already match</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matched.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  <CheckCircle2 size={11} />{skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[13px] font-extrabold text-slate-900">Potential skill gaps</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missing.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <XCircle size={11} />{skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-[13px] font-extrabold text-slate-900">About this role</h3>
          <p className="mt-2 text-[12.5px] leading-6 text-slate-600">
            {description || "A detailed description is not available for this listing. Open the source to review the complete requirements."}
          </p>
        </div>

        <div className="mt-5 rounded-[14px] border border-slate-200 bg-slate-50/80 p-3.5">
          <p className="px-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Ask CareerBot AI</p>
          <div className="mt-2 grid gap-2">
            <AIAction label="Check my fit" onClick={() => onAskAI("Do I qualify for this role?")} />
            <AIAction label="Explain my skill gaps" onClick={() => onAskAI("What skills am I missing?")} />
            <AIAction label="How should I tailor my resume?" onClick={() => onAskAI("How can I improve my match score?")} />
            <AIAction label="Tailor my resume for this job" onClick={onTailorResume} />
          </div>
        </div>
      </div>

      <footer className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-slate-200 bg-white p-4">
        <a
          href="/tracker"
          className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-[12px] font-bold text-slate-600 transition-colors hover:border-[#4F46E5]/30 hover:text-[#4F46E5]"
        >
          Pipeline
        </a>
        {applyUrl ? (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-[13px] font-extrabold text-white transition-colors hover:bg-[#4338CA]"
          >
            View job and apply <ArrowUpRight size={15} />
          </a>
        ) : (
          <p className="rounded-xl bg-slate-100 px-3 py-3 text-center text-[12px] font-semibold text-slate-500">
            Application instructions are not available yet.
          </p>
        )}
      </footer>
    </section>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-slate-400">{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="mt-1 line-clamp-2 text-[12px] font-bold text-slate-700">{value}</p>
    </div>
  );
}

function AIAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-between rounded-xl bg-white px-3 text-left text-[12px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-[#4F46E5] hover:ring-[#4F46E5]/30"
    >
      <span className="flex items-center gap-2"><Sparkles size={14} className="text-[#4F46E5]" />{label}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
