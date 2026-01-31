"use client";

import React from "react";
import { Download, FileDown } from "lucide-react";

interface ResumeHeaderProps {
  onDownload?: (format: "pdf" | "docx") => void;
  isDownloading?: boolean;
}

const ResumeHeader: React.FC<ResumeHeaderProps> = ({
  onDownload,
  isDownloading = false
}) => (
  <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-50 via-amber-100 to-yellow-100 shadow-sm">
    <div className="h-12 px-5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-8 bg-white rounded-full shadow-md"></div>
        <div>
          <h3 className="text-base font-bold text-slate-700">Your Resume</h3>
          <p className="text-xs text-slate-500">Original PDF preview</p>
        </div>
      </div>

      {onDownload && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload("pdf")}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            title="Download as PDF"
          >
            {isDownloading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>PDF</span>
          </button>

          <button
            onClick={() => onDownload("docx")}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            title="Download as DOCX"
          >
            {isDownloading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>DOCX</span>
          </button>
        </div>
      )}
    </div>
  </div>
);

export default ResumeHeader;
