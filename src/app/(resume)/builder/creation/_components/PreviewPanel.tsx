"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Eye,
  Sparkles,
  Layout,
  Zap,
  ArrowDownToLine,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  BarChart2,
  Shuffle,
} from "lucide-react";
import { useResume } from "../_context/ResumeContext";
import { useScore } from "../_context/ScoreContext";
import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import TemplateThree from "./templates/TemplateThree";
import TemplateFour from "./templates/TemplateFour";
import { downloadResume } from "../../../../../api/resumeApi";

interface PreviewPanelProps {
  isTemplateSidebarOpen: boolean;
  onTabClick: (tab: string) => void;
  onOpenSidebar?: (tab: string) => void;
  resumeId?: string;
}

const tabs = [
  { label: "Templates", icon: LayoutGrid },
  { label: "Score", icon: BarChart2 },
  { label: "Job Match", icon: Shuffle },
];

// A4 page dimensions at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  isTemplateSidebarOpen, 
  onTabClick,
  onOpenSidebar
}) => {
  const { selectedTemplate, resumeData, resumeStyle } = useResume();
  const { overallScore } = useScore();
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculatePages = () => {
      if (contentRef.current && selectedTemplate) {
        const contentHeight = contentRef.current.scrollHeight;
        const effectivePageHeight = A4_HEIGHT_PX;
        const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
        setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
        // // console.log(`📄 Total pages calculated: ${calculatedPages}`);
      }
    };

    calculatePages();
    const timer = setTimeout(calculatePages, 500);
    return () => clearTimeout(timer);
  }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

  useEffect(() => {
    const handleScroll = () => {
      if (previewContainerRef.current && contentRef.current && selectedTemplate) {
        const container = previewContainerRef.current;
        const content = contentRef.current;
        
        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        
        const scrolledContent = containerRect.top - contentRect.top;
        const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
        const page = Math.floor(scrolledContent / effectivePageHeight) + 1;
        
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
      }
    };

    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [selectedTemplate, totalPages, zoomLevel]);

  const navigateToPage = (pageNumber: number) => {
    if (previewContainerRef.current && contentRef.current) {
      const containerRect = previewContainerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      
      const contentOffsetFromTop = contentRect.top - containerRect.top + previewContainerRef.current.scrollTop;
      const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
      const targetPagePosition = (pageNumber - 1) * effectivePageHeight;
      const scrollPosition = contentOffsetFromTop + targetPagePosition;
      
      previewContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentPage(pageNumber);
    }
  };

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
      const resumeId = localStorage.getItem("current_resume_id");

      if (!resumeId) {
        throw new Error("No resume ID found. Please save your resume first.");
      }

      // // console.log("📥 Downloading resume:", resumeId, "Format:", type);

      const format = type.toLowerCase() as "pdf" | "doc";
      const blob = await downloadResume(resumeId, format);

      // ✅ Generate filename from person's name
      const fullname = resumeData.personalInfo?.fullname || "";
      const sanitizedName = fullname
        .trim()
        .replace(/\s+/g, "_")  // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_-]/g, "")  // Remove special characters
        .substring(0, 50);  // Limit length to 50 chars

      const filename = sanitizedName ? `${sanitizedName}.${format}` : `resume.${format}`;

      console.log("📥 Downloading as:", filename);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      setShowExportOptions(false);

    } catch (error) {
      // // console.error("Download failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download";
      setDownloadError(`Failed to download ${type}. ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResumeScoreClick = () => {
    if (onOpenSidebar) {
      onOpenSidebar("Score");
    }
    onTabClick("Score");
  };

  // ✅ UPDATED: renderTemplate to support all 4 templates with both string and number IDs
  const renderTemplate = () => {
    // // console.log("🎨 Rendering template:", selectedTemplate, typeof selectedTemplate);
    
    // Template map with both string template_ids and numeric IDs
    const templateMap: { [key: string]: JSX.Element } = {
      // String-based template IDs
      'compact_professional': <TemplateOne data={resumeData} style={resumeStyle} />,
      'clean_simple': <TemplateTwo data={resumeData} style={resumeStyle} />,
      'minimalist_classic': <TemplateThree data={resumeData} style={resumeStyle} />,
      'professional_classic': <TemplateFour data={resumeData} style={resumeStyle} />,
      // Numeric IDs for backward compatibility
      '1': <TemplateOne data={resumeData} style={resumeStyle} />,
      '2': <TemplateTwo data={resumeData} style={resumeStyle} />,
      '3': <TemplateThree data={resumeData} style={resumeStyle} />,
      '4': <TemplateFour data={resumeData} style={resumeStyle} />,
    };

    // Get the template based on selectedTemplate
    const template = templateMap[String(selectedTemplate)];
    
    if (template) {
      // // console.log("✅ Template found and rendering:", selectedTemplate);
      return template;
    }

    // Default empty state
    // // console.log("⚠️ No template selected, showing empty state");
    return (
      <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
        <div className="mb-6">
          <span
            className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
            style={{ width: 56, height: 56 }}
          >
            <Eye className="w-7 h-7 text-[#2557a7]" />
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
  };

  return (
    <section className="flex flex-col flex-1 bg-[#f8fafd] px-2 items-center h-[95vh] relative">
      {/* Toolbar - When Sidebar is Open */}
      {isTemplateSidebarOpen && (
        <div 
          className="flex items-center justify-center border border-gray-300 rounded px-2 py-1.5 mb-0 gap-2 bg-white shadow-sm space-x-2 relative z-30 transition-all duration-300 ease-in-out"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1 text-xs font-semibold relative`}>
            <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
          </div>

          <div className="flex-1"></div>

          <div className="text-base font-semibold text-[#2d2d2d]">
            <span>PREVIEW</span>
          </div>

          <div className="flex-1"></div>

          <div className="ml-1 relative">
            <button
              onClick={() => setShowExportOptions((prev) => !prev)}
              disabled={isDownloading}
              className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
                isDownloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowDownToLine size={16} />
              {isDownloading ? "Downloading..." : " Export"}
            </button>
            {showExportOptions && !isDownloading && (
              <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={() => handleExport("PDF")}
                  className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport("DOC")}
                  className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                >
                  DOC
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar - When Sidebar is Closed */}
      {!isTemplateSidebarOpen && (
        <div 
          className="flex items-center justify-between rounded border border-gray-300 px-2 py-1.5 gap-2 bg-white shadow-sm relative z-30 transition-all duration-300 ease-in-out mx-auto"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className="flex items-center gap-8 ml-4">
            <button
              onClick={handleResumeScoreClick}
              className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
            >
              <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
            </button>

            <div className="flex items-center gap-2">
              {tabs.slice(0, 1).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    onClick={() => onTabClick(tab.label)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
                    title={tab.label}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomOut size={16} className="text-[#2557a7]" />
            </button>

            <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
              {Math.round(zoomLevel * 100)}%
            </div>

            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomIn size={16} className="text-[#2557a7]" />
            </button>
          </div>

          <div className="flex items-center gap-8 mr-4">
            <button
              onClick={() => onTabClick("Job Match")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
            >
              <Shuffle size={16} />
              Job Match
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportOptions((prev) => !prev)}
                disabled={isDownloading}
                className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
                  isDownloading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ArrowDownToLine size={16} />
                {isDownloading ? "Downloading..." : " Export"}
              </button>
              {showExportOptions && !isDownloading && (
                <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => handleExport("PDF")}
                    className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("DOC")}
                    className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                  >
                    DOC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {downloadError && (
        <div 
          className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden transition-all duration-300 ease-in-out mx-auto"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          {downloadError}
        </div>
      )}

      <div
        ref={previewContainerRef}
        id="resume-preview"
        className="h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative transition-all duration-300 ease-in-out"
        style={{ 
          width: isTemplateSidebarOpen ? '99%' : '90%',
          maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
        }}
      >
        {/* {selectedTemplate && (
          <div ref={pageNavRef} className="sticky top-0 z-30 bg-white">
            <div className="flex items-center justify-end px-4 py-2 gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => navigateToPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    currentPage === pg
                      ? "bg-[#2557a7] text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
            <div className="w-full border-b border-gray-300"></div>
          </div>
        )} */}

        <div
          ref={contentRef}
          className="resume-content px-2 py-6"
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












