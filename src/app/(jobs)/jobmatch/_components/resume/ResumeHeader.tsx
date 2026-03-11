"use client";

import React, { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

interface ResumeHeaderProps {
  onDownload?: (format: "pdf" | "docx") => void;
  isDownloading?: boolean;
}

const ResumeHeader: React.FC<ResumeHeaderProps> = ({
  onDownload,
  isDownloading = false
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] shadow-md border-b border-[#bfdbfe]">
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-gradient-to-b from-[#2557a7] to-[#1a4a8f] rounded-full shadow-md"></div>
          <div>
            <h3 className="text-sm font-bold text-[#2557a7]">Your Resume</h3>
            <p className="text-xs text-[#2557a7]/70">Original PDF preview</p>
          </div>
        </div>

        {onDownload && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-[#bfdbfe] rounded-lg text-xs font-semibold text-[#2557a7] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:border-[#2557a7]/50"
              title="Download resume"
            >
              {isDownloading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showMenu && !isDownloading && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-[#bfdbfe] rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onDownload("pdf");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-[#2557a7] hover:bg-[#eff6ff] border-b border-[#e0eaf5] transition-colors duration-200"
                >
                  Download as PDF
                </button>
                <button
                  onClick={() => {
                    onDownload("docx");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-[#2557a7] hover:bg-[#eff6ff] transition-colors duration-200"
                >
                  Download as DOCX
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeHeader;
