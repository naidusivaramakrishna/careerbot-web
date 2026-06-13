"use client";
import { Download, EllipsisVertical, Share2, Sparkles, Star, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Resume } from "../page";
import { formatDateResume } from "@/utils/formatDateResume";
import logger from "@/lib/logger";

const ScoreRing = ({ score }: { score: number }) => {
  const isLoading = score === 0;
  const scoreColor = score >= 70 ? "#16a34a" : score >= 40 ? "#2557a7" : "#dc2626";
  const scoreTrack = score >= 70 ? "#dcfce7" : score >= 40 ? "#eff6ff" : "#fee2e2";
  const scoreLabel = score >= 70 ? "Good" : score >= 40 ? "Fair" : score > 0 ? "Low" : "";

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <path strokeWidth="3" fill="none" stroke={scoreTrack}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path strokeWidth="3" strokeDasharray={`${score}, 100`} fill="none"
            strokeLinecap="round" stroke={scoreColor}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: scoreColor }}>
          {score}
        </div>
      </div>
      {scoreLabel && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden sm:inline"
          style={{
            background: scoreColor === "#16a34a" ? "#f0fdf4" : scoreColor === "#2557a7" ? "#eff6ff" : "#fef2f2",
            color: scoreColor,
          }}>
          {scoreLabel}
        </span>
      )}
    </div>
  );
};

const SourceBadge = ({ source }: { source?: string }) => {
  if (source === "enhanced") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "linear-gradient(135deg,rgba(88,150,215,0.12),rgba(31,78,152,0.12))", color: "#1f4e98", border: "1px solid rgba(37,87,167,0.2)" }}>
        ✦ Enhanced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-500"
      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
      Builder
    </span>
  );
};

const ResumeTableRow = ({
  resume,
  onDownload,
  downloading,
}: {
  resume: Resume;
  index: number;
  onDelete: () => void;
  onDownload: () => void;
  downloading: boolean;
}) => {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const [createdTime, setCreatedTime] = useState(formatDateResume(resume.createdAt!));
  const [modifiedTime, setModifiedTime] = useState(formatDateResume(resume.updatedAt!));

  useEffect(() => {
    const interval = setInterval(() => {
      setCreatedTime(formatDateResume(resume.createdAt!));
      setModifiedTime(formatDateResume(resume.updatedAt!));
    }, 60000);
    return () => clearInterval(interval);
  }, [resume.createdAt, resume.updatedAt]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 208 });
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleRowClick = (e: React.MouseEvent) => {
    if (buttonRef.current?.contains(e.target as Node) || dropdownRef.current?.contains(e.target as Node)) return;
    logger.info("Opening resume:", resume.id);
    localStorage.removeItem("resumeData");
    localStorage.setItem("current_resume_id", resume.id);
    const url = resume.source === "enhanced"
      ? `/builder/creation/${resume.id}?source=enhanced`
      : `/builder/creation/${resume.id}`;
    router.push(url);
  };

  const initial = (resume.name || "?").charAt(0).toUpperCase();

  return (
    <tr
      onClick={handleRowClick}
      className="border-b border-gray-50 last:border-0 hover:bg-[#f5f8ff] transition-colors duration-150 cursor-pointer group"
    >
      {/* Resume name */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 group-hover:text-[#1f4e98] transition-colors truncate max-w-[160px]">
              {resume.name}
            </p>
            <div className="mt-0.5">
              <SourceBadge source={resume.source} />
            </div>
          </div>
        </div>
      </td>

      {/* Target role */}
      <td className="px-6 py-3.5">
        {resume.job && resume.job !== "No Target Role" ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-[#1f4e98]"
            style={{ background: "rgba(37,87,167,0.07)", border: "1px solid rgba(37,87,167,0.12)" }}>
            {resume.job}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* ATS Score */}
      <td className="px-6 py-3.5">
        <ScoreRing score={resume.score} />
      </td>

      {/* Last modified */}
      <td className="px-6 py-3.5">
        <span className="text-xs text-gray-500">{modifiedTime}</span>
      </td>

      {/* Created */}
      <td className="px-6 py-3.5">
        <span className="text-xs text-gray-500">{createdTime}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick edit */}
          <button
            onClick={(e) => { e.stopPropagation(); handleRowClick(e); }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-[#2557a7] hover:text-white transition-all"
            title="Open"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Overflow menu */}
          <button
            ref={buttonRef}
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <EllipsisVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOpen && mounted && pos && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.12), 0 8px 24px -6px rgba(0,0,0,0.07)",
            }}
            className="bg-white border border-gray-100 rounded-2xl w-52 overflow-hidden"
          >
            <div className="p-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Set as Primary</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-left group/item">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#2557a7]" />
                </div>
                <span className="text-sm text-gray-700 font-medium group-hover/item:text-[#1f4e98]">Optimize for Job</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Share2 className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Share</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {downloading
                    ? <div className="w-3.5 h-3.5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                    : <Download className="w-3.5 h-3.5 text-gray-500" />
                  }
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {downloading ? "Downloading…" : "Download"}
                </span>
              </button>
            </div>
          </div>,
          document.body
        )}
      </td>
    </tr>
  );
};

export default ResumeTableRow;
