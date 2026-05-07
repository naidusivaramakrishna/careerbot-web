"use client";
import { CircleCheck, Download, EllipsisVertical, Share2, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Resume } from "../page";
import { formatDateResume } from "@/utils/formatDateResume";
import logger from "@/lib/logger";

const ResumeTableRow = ({
  resume,
  onDownload,
  downloading
}: {
  resume: Resume;
  index: number;
  onDelete: () => void;
  onDownload: () => void;
  downloading: boolean;
}) => {
  const router = useRouter();
  const displayScore = resume.score || 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Mark as mounted so portal renders only on the client
  useEffect(() => { setMounted(true); }, []);

  // Dynamic time formatting that updates every minute
  const [createdTime, setCreatedTime] = useState(formatDateResume(resume.created));
  const [modifiedTime, setModifiedTime] = useState(formatDateResume(resume.modified));

  useEffect(() => {
    const interval = setInterval(() => {
      setCreatedTime(formatDateResume(resume.created));
      setModifiedTime(formatDateResume(resume.modified));
    }, 60000);
    return () => clearInterval(interval);
  }, [resume.created, resume.modified]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.right - 208, // 208px = w-52, aligns right edge with button
      });
    }
    setIsOpen(prev => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if the click was on the actions button or dropdown
    if (buttonRef.current?.contains(e.target as Node) || dropdownRef.current?.contains(e.target as Node)) return;
    logger.info("Opening resume:", resume.id);
    localStorage.removeItem("resumeData");
    localStorage.setItem("current_resume_id", resume.id);
    const url = resume.source === 'enhanced'
      ? `/builder/creation/${resume.id}?source=enhanced`
      : `/builder/creation/${resume.id}`;
    router.push(url);
  };

  const getInitials = (fullname: string) => {
    return fullname.charAt(0).toUpperCase();
  };

  const displayInitials = getInitials(resume.name || '');

  const scoreColor = displayScore >= 70 ? "#16a34a" : displayScore >= 40 ? "#2557a7" : "#dc2626";
  const scoreTrack = displayScore >= 70 ? "#dcfce7" : displayScore >= 40 ? "#eff6ff" : "#fee2e2";

  return (
    <tr onClick={handleRowClick} className="border-b border-gray-50 last:border-0 hover:bg-[#f8faff] transition-colors cursor-pointer group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
          >
            {displayInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-[#1f4e98] transition-colors">{resume.name}</p>
              {resume.primary && <CircleCheck className="w-3.5 h-3.5 text-[#2557a7]" />}
            </div>
            {resume.primary ? (
              <span className="text-[10px] font-semibold text-[#1f4e98] bg-blue-50 px-1.5 py-0.5 rounded-full">
                Primary
              </span>
            ) : (
              <span className="text-xs text-gray-400">{resume.source === 'enhanced' ? 'Enhanced' : 'Builder'}</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        {resume.job && resume.job !== 'No Target Role' ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-medium text-[#1f4e98]">
            {resume.job}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-11 h-11">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path strokeWidth="3" fill="none" stroke={scoreTrack}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path strokeWidth="3" strokeDasharray={`${displayScore}, 100`} fill="none"
                strokeLinecap="round" stroke={scoreColor}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: scoreColor }}>
              {displayScore}%
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="text-sm text-gray-500">{modifiedTime}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500">{createdTime}</span>
      </td>
      <td className="px-6 py-4">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <EllipsisVertical className="w-4 h-4" />
        </button>

        {isOpen && mounted && pos && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15), 0 8px 24px -6px rgba(0,0,0,0.08)",
            }}
            className="bg-white border border-gray-200 rounded-2xl w-52 overflow-hidden"
          >
            <div className="p-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Set as Primary</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-left group">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#2557a7]" />
                </div>
                <span className="text-sm text-gray-700 font-medium group-hover:text-[#1f4e98]">Optimize for Job</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Share2 className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Share</span>
              </button>

              <button
                onClick={() => { onDownload(); setIsOpen(false); }}
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
