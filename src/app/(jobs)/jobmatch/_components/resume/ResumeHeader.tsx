"use client";

import React, { useState } from "react";
import { Download, ChevronDown, Type } from "lucide-react";

export const RESUME_FONTS = [
  { value: "Inter, ui-sans-serif, sans-serif",           label: "Inter",             googleFont: null },
  { value: "'Roboto', sans-serif",                       label: "Roboto",            googleFont: "Roboto:wght@400;500;700" },
  { value: "'Lato', sans-serif",                         label: "Lato",              googleFont: "Lato:wght@400;700" },
  { value: "'Open Sans', sans-serif",                    label: "Open Sans",         googleFont: "Open+Sans:wght@400;600;700" },
  { value: "'Poppins', sans-serif",                      label: "Poppins",           googleFont: "Poppins:wght@400;500;600;700" },
  { value: "Georgia, 'Times New Roman', serif",          label: "Georgia",           googleFont: null },
  { value: "'Merriweather', serif",                      label: "Merriweather",      googleFont: "Merriweather:wght@400;700" },
  { value: "'Playfair Display', serif",                  label: "Playfair Display",  googleFont: "Playfair+Display:wght@400;600;700" },
  { value: "'Libre Baskerville', serif",                 label: "Libre Baskerville", googleFont: "Libre+Baskerville:wght@400;700" },
  { value: "'Source Serif 4', serif",                    label: "Source Serif",      googleFont: "Source+Serif+4:wght@400;600;700" },
];

interface ResumeHeaderProps {
  onDownload?: (format: "pdf" | "docx") => void;
  isDownloading?: boolean;
  pdfBlobUrl?: string | null;
  currentFont?: string;
  onFontChange?: (font: string) => void;
}

const ResumeHeader: React.FC<ResumeHeaderProps> = ({
  onDownload,
  isDownloading = false,
  currentFont = RESUME_FONTS[0].value,
  onFontChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

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

          {/* Font picker */}
          {onFontChange && (
            <div className="relative">
              <button
                onClick={() => { setShowFontMenu(v => !v); setShowMenu(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                title="Change font"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{RESUME_FONTS.find(f => f.value === currentFont)?.label ?? "Font"}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showFontMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFontMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                    {RESUME_FONTS.map(font => (
                      <button
                        key={font.value}
                        onClick={() => { onFontChange(font.value); setShowFontMenu(false); }}
                        style={{ fontFamily: font.value }}
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
                          currentFont === font.value
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
