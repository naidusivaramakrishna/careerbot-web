"use client";

import React, { useState } from "react";
import { Download, ChevronDown, ExternalLink } from "lucide-react";

interface ResumeHeaderProps {
  onDownload?: (format: "pdf" | "docx") => void;
  isDownloading?: boolean;
  pdfBlobUrl?: string | null;
}

const ResumeHeader: React.FC<ResumeHeaderProps> = ({
  onDownload,
  isDownloading = false,
  pdfBlobUrl,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-12 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-linear-to-b from-[#2557a7] to-[#1a4a8f] rounded-full" />
          <div>
            <h3 className="text-sm font-bold text-gray-800">Your Resume</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Open in new tab */}
          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
          )}

          {/* Download */}
          {onDownload && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] hover:bg-[#1a4a8f] text-white border border-[#2557a7] rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Download resume"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showMenu && !isDownloading && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => { onDownload("pdf"); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    Download as PDF
                  </button>
                  <button
                    onClick={() => { onDownload("docx"); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download as DOCX
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeHeader;
