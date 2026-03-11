import React, { useEffect, useState } from "react";
import JobMatchTemplate from "./JobMatchTemplate";
import httpClient from "@/lib/http";

interface ResumePreviewProps {
  pdfBlobUrl: string | null;
  pdfError: string | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDocx: boolean;
  docxBlob: Blob | null;
  parsedData: any;
  onRegenerate?: () => void;
  resumeId?: string | null;
}

// Add a reload counter to force iframe refresh
let reloadCounter = 0;

const ResumePreview: React.FC<ResumePreviewProps> = ({
  pdfBlobUrl,
  pdfError,
  isLoading,
  isUpdating,
  isDocx,
  docxBlob,
  parsedData,
  onRegenerate,
  resumeId,
}) => {
  const [docxPreview, setDocxPreview] = useState<string | null>(null);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  // Convert DOCX to PDF for preview (only if we're not using the template)
  useEffect(() => {
    const convertDocxToPdf = async () => {
      if (!docxBlob || !isDocx || parsedData) return; // Skip if we have parsedData

      try {
        setDocxError(null);
        // Use mammoth to convert DOCX to HTML
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: await docxBlob.arrayBuffer() });

        // Create a simple HTML document for preview
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; max-width: 8.5in; }
                h1, h2, h3 { margin-top: 12px; margin-bottom: 6px; }
                .section { margin-bottom: 20px; }
              </style>
            </head>
            <body>${result.value}</body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setDocxPreview(url);
      } catch (err) {
        setDocxError("Unable to preview DOCX file. Please convert to PDF for better preview.");
      }
    };

    convertDocxToPdf();
  }, [docxBlob, isDocx, parsedData]);

  // Trigger regenerate when parsedData changes (skills added)
  useEffect(() => {
    if (parsedData?.skills && onRegenerate) {
      onRegenerate();
    }
  }, [parsedData?.skills, onRegenerate]);

  // Force cleanup and reload when pdfBlobUrl changes
  useEffect(() => {
    if (pdfBlobUrl) {
      console.log("🔄 PDF blob URL changed, forcing iframe reload");
      reloadCounter++;
      setIframeKey(reloadCounter);

      // Small delay to ensure the old iframe is unmounted before showing new one
      setDisplayUrl(null);
      const timer = setTimeout(() => {
        setDisplayUrl(pdfBlobUrl);
      }, 50);

      return () => clearTimeout(timer);
    }
    return () => {
      if (pdfBlobUrl) {
        console.log("🧹 Cleaning up old PDF blob URL:", pdfBlobUrl);
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (pdfError) {
    return (
      <div className="h-[600px] bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-semibold mb-2">Error Loading Resume</p>
          <p className="text-red-700 text-sm">{pdfError}</p>
        </div>
      </div>
    );
  }

  if (docxError && isDocx && !pdfBlobUrl && !parsedData) {
    return (
      <div className="h-[600px] bg-white border border-amber-200 rounded-lg p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-amber-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-amber-800 font-semibold mb-2">DOCX Preview Limited</p>
          <p className="text-amber-700 text-sm mb-4">{docxError}</p>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-4 py-2 bg-[#2557a7] text-white rounded hover:bg-[#1a3f7a] text-sm font-medium"
            >
              Convert & Update Resume
            </button>
          )}
        </div>
      </div>
    );
  }

  // Priority 1: Show backend PDF preview (ALWAYS use backend, never frontend template)
  // Priority 2: Show DOCX preview if available
  // Priority 3: Show "No preview available" message
  return (
    <div className="relative h-[600px] bg-gradient-to-br from-white to-[#f9fbff] rounded-lg overflow-hidden border border-[#e0eaf5]">
      {isUpdating && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2557a7] border-t-transparent" />
            <p className="text-sm font-semibold text-slate-600">
              Updating resume...
            </p>
          </div>
        </div>
      )}

      {isLoading && !pdfBlobUrl && !docxPreview ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2557a7] border-t-transparent mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading resume preview...</p>
            <p className="text-sm text-gray-400 mt-2">
              Please wait while we fetch your resume
            </p>
          </div>
        </div>
      ) : displayUrl ? (
        // Priority 1: Show backend PDF (ALWAYS prefer backend)
        <iframe
          key={`pdf-preview-${iframeKey}`}
          // Disable PDF toolbar to show only custom download button (toolbar=0)
          src={`${displayUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="w-full h-full border-none"
          title="Resume PDF Preview"
        />
      ) : docxPreview ? (
        // Priority 2: Show DOCX preview
        <iframe
          key={docxPreview}
          src={docxPreview}
          className="w-full h-full border-none"
          title="Resume DOCX Preview"
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 font-medium">No preview available</p>
            <p className="text-sm text-gray-400 mt-2">
              Resume data could not be loaded
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
