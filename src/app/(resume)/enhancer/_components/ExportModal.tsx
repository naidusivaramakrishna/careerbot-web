// app/.../_components/ExportModal.tsx
import React, { useState } from "react";
import { Check, X, Download, Loader2 } from "lucide-react";
import { downloadEnhancedResume } from "@/api/enhancerApi";
import type { Improvement } from "@/api/enhancerApi";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF?: () => void;
  onDownloadDOC?: () => void;
  enhancedId?: string;
  improvements?: Improvement[];
  atsScore?: {
    total_score?: number;
    score_improvement?: number;
  };
}

export default function ExportModal({
  isOpen,
  onClose,
  onDownloadPDF,
  onDownloadDOC,
  enhancedId,
  improvements: propImprovements,
  atsScore,
}: ExportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | null>(null);

  if (!isOpen) return null;

  // Get improvements from props or session storage or use default
  const getImprovements = () => {
    if (propImprovements && propImprovements.length > 0) {
      return propImprovements.slice(0, 4).map(imp => imp.title || imp.description);
    }

    const storedImprovements = sessionStorage.getItem('improvements');
    if (storedImprovements) {
      try {
        const parsed = JSON.parse(storedImprovements) as Improvement[];
        return parsed.slice(0, 4).map(imp => imp.title || imp.description);
      } catch {
        // Fall through to default
      }
    }

    return [
      "Optimized keywords for ATS systems",
      "Enhanced bullet points for impact and clarity",
      "Cleaned up formatting and structure",
      "Corrected grammar and improved readability",
    ];
  };

  const improvements = getImprovements();

  // Handle download with API integration
  const handleDownload = async (format: "pdf" | "docx") => {
    // Use custom handlers if provided (for backward compatibility)
    if (format === "pdf" && onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    if (format === "docx" && onDownloadDOC) {
      onDownloadDOC();
      return;
    }

    // Use API if enhancedId is provided
    if (!enhancedId) {
      console.error("No enhanced_id provided for download");
      alert("Cannot download: No enhanced resume ID found");
      return;
    }

    setIsDownloading(true);
    setDownloadFormat(format);

    try {
      const blob = await downloadEnhancedResume(enhancedId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced-resume.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Resume downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(`Download failed:`, error);
      alert(`Failed to download resume. Please try again.`);
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/20 backdrop-blur-sm p-4
      "
    >
      <div className="relative bg-gray-100 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="absolute inset-2 bg-emerald-400 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full p-8 shadow-lg">
                <Check className="w-12 h-12 text-white stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Your Resume is Optimized!
            </h2>
            <p className="text-gray-600 text-base leading-relaxed max-w-lg mx-auto">
              Your resume has been enhanced and optimized for better job
              applications. It&apos;s now ATS-friendly and primed to impress
              recruiters.
            </p>
            {atsScore?.total_score !== undefined && (
              <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 rounded-full border border-indigo-100">
                <span className="text-sm font-medium text-gray-600">ATS Score:</span>
                <span className="text-2xl font-bold text-indigo-600">{atsScore.total_score}%</span>
                {atsScore.score_improvement !== undefined && atsScore.score_improvement > 0 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    +{atsScore.score_improvement} points
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Improvements List */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              What we improved
            </h3>
            <div className="space-y-4">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="bg-emerald-100 rounded-full p-1">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {improvement}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => handleDownload("docx")}
              disabled={isDownloading}
              className="flex-1 px-6 py-3.5 bg-white text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 transition-all shadow-sm hover:shadow-md border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading && downloadFormat === "docx" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download DOCX
                </>
              )}
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={isDownloading}
              className="flex-1 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading && downloadFormat === "pdf" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500">
            <span className="underline cursor-pointer hover:text-gray-700 transition-colors">
              PDF recommended for job applications.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
