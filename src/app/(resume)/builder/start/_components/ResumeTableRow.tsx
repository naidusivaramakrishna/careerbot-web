"use client";
import { CircleCheck, Download, EllipsisVertical, Share2, Sparkles, SquarePen, Star } from "lucide-react";
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

  const handleEditResume = () => {
    logger.info("Editing resume:", resume.id);
    localStorage.removeItem("resumeData");
    localStorage.setItem("current_resume_id", resume.id);
    const url = resume.source === 'enhanced'
      ? `/builder/creation/${resume.id}?source=enhanced`
      : `/builder/creation/${resume.id}`;
    router.push(url);
    setIsOpen(false);
  };

  const getInitials = (fullname: string) => {
    return fullname.charAt(0).toUpperCase();
  };

  const displayInitials = getInitials(resume.name || '');

  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
          >
            {displayInitials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-gray-900">{resume.name}</p>
              {resume.primary && <CircleCheck className="w-3.5 h-3.5 text-[#2557a7]" />}
            </div>
            {resume.primary && (
              <span className="text-[10px] font-semibold text-[#1f4e98] bg-blue-50 px-1.5 py-0.5 rounded-full">
                Primary
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5 text-sm text-gray-600">{resume.job}</td>

      <td className="px-5 py-3.5">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              strokeWidth="3"
              fill="none"
              stroke="#eff6ff"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeWidth="3"
              strokeDasharray={`${displayScore}, 100`}
              fill="none"
              strokeLinecap="round"
              stroke="#2557a7"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
            {displayScore}%
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5 text-sm text-gray-500">{modifiedTime}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{createdTime}</td>
      <td className="px-5 py-3.5">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <EllipsisVertical className="w-4 h-4" />
        </button>

        {isOpen && mounted && pos && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white border border-gray-200 rounded-xl w-52 overflow-hidden"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <ul className="py-1 text-sm text-gray-700">
              <li className="px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer text-gray-600">
                <Star className="w-3.5 h-3.5 text-gray-400" /> Set as Primary
              </li>
              <li
                onClick={handleEditResume}
                className="px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer text-gray-600"
              >
                <SquarePen className="w-3.5 h-3.5 text-gray-400" /> Edit Resume
              </li>
              <li className="px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer text-gray-600">
                <Sparkles className="w-3.5 h-3.5 text-gray-400" /> Optimize for Job
              </li>
              <li className="px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer text-gray-600">
                <Share2 className="w-3.5 h-3.5 text-gray-400" /> Share
              </li>
              <li
                onClick={() => { onDownload(); setIsOpen(false); }}
                className="px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer transition text-gray-600"
              >
                {downloading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span>Download</span>
                  </>
                )}
              </li>
            </ul>
          </div>,
          document.body
        )}
      </td>
    </tr>
  );
};

export default ResumeTableRow;
