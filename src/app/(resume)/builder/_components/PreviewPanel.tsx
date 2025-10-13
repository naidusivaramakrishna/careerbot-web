"use client";
import React, { useEffect, useState } from "react";
import { Eye, Sparkles, Layout, Zap, ArrowDownToLine, ZoomIn, ZoomOut } from "lucide-react";
import { useResume } from "../_context/ResumeContext";
import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import { downloadResume } from "../../../../api/resumeApi";

const PreviewPanel: React.FC = () => {
  const { selectedTemplate, resumeData, resumeStyle } = useResume();
  const targetScore = 0; // Replace with dynamic ATS score
  const [resumeScore, setResumeScore] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setResumeScore(targetScore), 300);
    return () => clearTimeout(timer);
  }, [targetScore]);

  const handleZoomIn = () => {
    if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
  };

  const handleExport = async (type: string) => {
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      // Get resume ID from context or state
      // Replace 'your_resume_id' with actual resume ID from your state/context
      const resumeId = resumeData?.resume_id || '1'; // Adjust based on your data structure
      
      // Convert type to lowercase for API
      const format = type.toLowerCase() as 'pdf' | 'doc';
      
      // Call download API
      await downloadResume(resumeId, format);
      
      // Close dropdown after successful download
      setShowExportOptions(false);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(`Failed to download ${type}. Please try again.`);
      
      // Show error message to user (you can replace this with a toast notification)
      alert(`Failed to download ${type}. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 1:
        return <TemplateOne data={resumeData} style={resumeStyle} />;
      case 2:
        return <TemplateTwo data={resumeData} style={resumeStyle} />;
      default:
        return (
          <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center ">
            <div className="mb-6">
              <span
                className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
                style={{ width: 56, height: 56 }}
              >
                <Eye className="w-7 h-7 text-blue-500" />
              </span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700 mb-1">
                Your resume preview will appear here
              </div>
              <div className="text-gray-500 mb-6 text-sm">
                Select template and start by adding your personal information
                and professional summary to see your resume come to life.
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  AI-powered content
                </span>
                <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
                  <Layout className="w-4 h-4 text-gray-800" />
                  Professional templates
                </span>
                <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Real-time preview
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <section className="flex flex-col flex-1 bg-[#f8fafd] py-6 px-4 items-center h-[95vh]">
      {/* Toolbar */}
      <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mb-4 gap-2 bg-white shadow-sm space-x-2 relative">
        {/* Resume Score */}
        <div className="flex flex-col items-center justify-center bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px]">
          <span className="text-orange-500">{`Resume Score ${resumeScore}%`}</span>
        </div>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} className="text-orange-500" />
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* PDF Preview label */}
        <div className="text-sm font-semibold text-gray-700">
          <span>PDF PREVIEW</span>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} className="text-orange-500" />
        </button>

        {/* Export Button with Dropdown */}
        <div className="ml-1 relative">
          <button
            onClick={() => setShowExportOptions((prev) => !prev)}
            disabled={isDownloading}
            className={`flex items-center gap-1 border bg-orange-50 border-orange-200 rounded-full px-7 py-1 text-orange-500 text-xs font-semibold hover:bg-orange-100 transition ${
              isDownloading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Export resume"
          >
            <ArrowDownToLine size={16} />
            {isDownloading ? 'Downloading...' : 'Export'}
          </button>
          {showExportOptions && !isDownloading && (
            <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
              <button
                onClick={() => handleExport("PDF")}
                className="w-full px-3 py-2 text-left text-orange-600 text-sm hover:bg-gray-100"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport("DOC")}
                className="w-full px-3 py-2 text-left text-sm text-orange-600 hover:bg-gray-100"
              >
                DOC
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {downloadError && (
        <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {downloadError}
        </div>
      )}

      {/* Preview Box */}
      <div
        id="resume-preview"
        className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start overflow-auto"
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
            transition: "transform 0.3s ease-in-out",
            width: "100%",
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </section>
  );
};
export default PreviewPanel;

