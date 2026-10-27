"use client";
import { Download, Ellipsis, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Resume } from "../list/page";
import { formatDateResume } from "@/utils/formatDateResume";
import logger from "@/lib/logger";
import ResumeThumbnail from "./ResumeThumbnail";
import { ATS_TONE_CLASSES, atsTone } from "./resumeCompletion";

const ResumeCard = ({
  resume,
  onDownload,
  onSetPrimary,
  downloading,
  creationUrl,
}: {
  resume: Resume;
  index?: number;
  onDownload: () => void;
  onSetPrimary?: () => void;
  downloading: boolean;
  creationUrl?: string;
}) => {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modifiedTime, setModifiedTime] = useState(formatDateResume(resume.updatedAt));

  // Keep the relative "Updated …" label fresh
  useEffect(() => {
    setModifiedTime(formatDateResume(resume.updatedAt));
    const interval = setInterval(() => setModifiedTime(formatDateResume(resume.updatedAt)), 60000);
    return () => clearInterval(interval);
  }, [resume.updatedAt]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const openResume = () => {
    logger.info("Opening resume:", resume.id);
    localStorage.removeItem("resumeData");
    localStorage.setItem("current_resume_id", resume.id);
    router.push(
      creationUrl ??
        (resume.source === "enhanced"
          ? `/builder/creation/${resume.id}?source=enhanced`
          : `/builder/creation/${resume.id}`),
    );
  };

  const score = Math.min(100, Math.max(0, resume.score || 0));
  const tone = atsTone(score);
  // undefined = still being read, null = could not be read, number = % of core sections filled
  const completion = typeof resume.completion === "number" ? Math.min(100, Math.max(0, resume.completion)) : null;
  const completionPending = resume.completion === undefined;
  const hasRole = !!resume.job && resume.job !== "No Target Role";

  return (
    <div className="bg-white rounded-xl border border-[#e3e9f2] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        <ResumeThumbnail resumeId={resume.id} source={resume.source === "enhanced" ? "enhanced" : "builder"} updatedAt={resume.updatedAt} />

        {/* Everything else sits beside the thumbnail, as in the design */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Name + ATS score */}
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 min-w-0 flex-1 break-words text-[12px] font-semibold leading-5 text-gray-900" title={resume.name}>{resume.name}</p>
            <span
              data-testid="ats-score-pill"
              data-tone={tone}
              className={`shrink-0 whitespace-nowrap rounded-full px-1.5 py-[3px] text-[9px] font-semibold leading-none ${ATS_TONE_CLASSES[tone]}`}
            >
              ATS Score - {score}%
            </span>
          </div>

          {/* Target role: one line */}
          <div className="mt-1 flex flex-nowrap items-center gap-1.5 overflow-hidden">
            {resume.primary && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" /> Primary
              </span>
            )}
            {hasRole && (
              <span className="min-w-0 truncate whitespace-nowrap rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600" title={resume.job}>
                {resume.job}
              </span>
            )}
          </div>

          <p className="mt-1.5 whitespace-nowrap text-[10px] text-gray-500">Updated {modifiedTime}</p>

          {/* How much of the resume is filled in */}
          <div className="mt-1.5 flex items-center gap-2">
            <div
              role="progressbar"
              aria-label="Resume completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion ?? undefined}
              className="h-1.5 min-w-[48px] flex-1 overflow-hidden rounded-full bg-[#e3e9f2]"
            >
              {completionPending ? (
                <div className="h-full w-full animate-pulse bg-[#eef2f8]" />
              ) : completion !== null ? (
                <div className="h-full rounded-full bg-[#1d4fa8] transition-[width] duration-500" style={{ width: `${completion}%` }} />
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[10px] text-gray-600">
              {completionPending ? "…" : completion === null ? "—" : `${completion}% complete`}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={openResume}
              className="h-8 min-w-0 flex-1 rounded-md bg-[#eceff4] text-[11px] font-semibold text-gray-700 transition-colors hover:bg-[#1d4fa8] hover:text-white"
            >
              Continue Editing
            </button>

            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                aria-label="More actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e3e9f2] bg-white text-gray-600 hover:bg-gray-50"
              >
                <Ellipsis className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 bottom-full mb-1.5 z-30 w-44 bg-white border border-gray-200 rounded-xl p-1.5"
                  style={{ boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)" }}
                >
                  <button
                    type="button"
                    disabled={resume.primary}
                    onClick={() => { setMenuOpen(false); onSetPrimary?.(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700 font-medium disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <Star className={`w-4 h-4 text-amber-500 ${resume.primary ? "fill-amber-400" : ""}`} />
                    {resume.primary ? "Primary resume" : "Set as Primary"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDownload(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700 font-medium"
                  >
                    {downloading
                      ? <div className="w-4 h-4 border-2 border-[#1d4fa8] border-t-transparent rounded-full animate-spin" />
                      : <Download className="w-4 h-4 text-gray-500" />}
                    {downloading ? "Downloading…" : "Download"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;
