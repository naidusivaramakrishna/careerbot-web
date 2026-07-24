"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Eye,
  Sparkles,
  Layout,
  Zap,
  ArrowDownToLine,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  BarChart2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useResume } from "../_context/ResumeContext";
import { useScore } from "../_context/ScoreContext";
import { useResumeScorePreview } from "../_hooks/useResumeScorePreview";
import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import TemplateThree from "./templates/TemplateThree";
import TemplateFour from "./templates/TemplateFour";
import TemplateFive from "./templates/TemplateFive";
import Template1 from "../../../templates/Template1";
import Template2 from "../../../templates/Template2";
import Template3 from "../../../templates/Template3";
import Template4 from "../../../templates/Template4";
import ResumePagePager from "./templates/ResumePagePager";
import { downloadResume } from "../../../../../api/resumeApi";
import { downloadEnhancedResume } from "../../../../../api/enhancerApi";
import { getProfile } from "@/api/userApi";
import logger from "@/lib/logger";
import { STYLE_CATALOGUES, CATALOGUE_LAYOUT_MAP, HeaderLayout } from "../_utils/templateStyles";
import { buildAtsSectionIssues, getAtsScoreValue } from "../_utils/atsMissing";
interface PreviewPanelProps {
  isTemplateSidebarOpen: boolean;
  onTabClick: (tab: string) => void;
  onOpenSidebar?: (tab: string) => void;
  onOpenEditorSection?: (sectionName: string) => void;
  resumeId?: string;
  isEnhancedResume?: boolean;
  fromAts?: boolean;
}

const tabs = [
  { label: "Templates", icon: LayoutGrid },
  { label: "Score", icon: BarChart2 },
  { label: "Job Match", icon: Shuffle },
];


const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isTemplateSidebarOpen,
  onTabClick,
  onOpenSidebar,
  onOpenEditorSection,
  resumeId: resumeIdProp,
  isEnhancedResume = false,
  fromAts = false,
}) => {
  const { selectedTemplate, resumeData, resumeStyle, resumeSource, enhancedAtsScore, enhancedSuggestions, sectionOrder, previewCatalogueKey } = useResume();
  const { canonicalScore, setCanonicalScore } = useScore();
  const previewScore = useResumeScorePreview(resumeData);

  // For enhanced resumes, seed the canonical score from the enhancer's ATS score
  // so the toolbar and any other score consumers show the correct value.
  useEffect(() => {
    const enhancedScoreValue = getAtsScoreValue(enhancedAtsScore);
    if (isEnhancedResume && enhancedScoreValue > 0) {
      setCanonicalScore(enhancedScoreValue);
    }
  }, [isEnhancedResume, enhancedAtsScore, setCanonicalScore]);

  const enhancedScoreValue = getAtsScoreValue(enhancedAtsScore);
  const displayScore = isEnhancedResume && enhancedScoreValue > 0
    ? enhancedScoreValue
    : (canonicalScore ?? previewScore.score);
  const scoreLabel = "Score";
  const atsIssues = fromAts ? buildAtsSectionIssues(enhancedAtsScore, enhancedSuggestions, resumeData) : [];
  const topAtsIssue = atsIssues[0];

  const openAtsIssue = (issue: typeof topAtsIssue) => {
    if (!issue) return;
    const sectionName = issue.label === "Contact Information" ? "Personal Info" : issue.label;
    onOpenEditorSection?.(sectionName);
  };

  useEffect(() => {
    console.warn("📋 PreviewPanel - sectionOrder:", sectionOrder, "selectedTemplate:", selectedTemplate);
  }, [sectionOrder, selectedTemplate]);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEmailReady, setIsEmailReady] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTemplate, previewCatalogueKey]);

  const handlePageCountChange = React.useCallback((count: number) => {
    const safeCount = Math.max(1, count);
    setTotalPages(safeCount);
    setCurrentPage((page) => Math.min(page, safeCount));
  }, []);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const pageNavigation = (
    <div className="flex h-8 items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={goToPreviousPage}
        disabled={currentPage <= 1}
        className="flex h-8 w-7 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-[#2557a7] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Previous resume page"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-[48px] border-x border-slate-200 px-1.5 text-center text-xs font-black text-slate-700">
        {currentPage} / {totalPages}
      </div>
      <button
        type="button"
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
        className="flex h-8 w-7 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-[#2557a7] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Next resume page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  // Fetch email before rendering template to avoid flash between global and
  // scoped localStorage keys — used for scoped localStorage keys.
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const profile = await getProfile();
        if (profile.email) {
          setUserEmail(profile.email);
          logger.info('User email set for scoped storage:', profile.email);
        }
      } catch (err) {
        logger.warn('Failed to get user email for scoped storage', err);
      } finally {
        setIsEmailReady(true);
      }
    };

    fetchUserEmail();
  }, []);

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
      const resumeId = resumeIdProp ?? localStorage.getItem("current_resume_id");

      if (!resumeId) {
        throw new Error("No resume ID found. Please save your resume first.");
      }

      const format = type.toLowerCase() as "pdf" | "docx";
      const fileExtension = format;

      // Read selected catalogue and resolve its backend template_id for the style overlay
      const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
      const catalogueTemplateId = selectedCatalogue ? STYLE_CATALOGUES[selectedCatalogue]?.template_id : undefined;

      // Pass the domain template ID so the backend uses the correct section structure
      // (e.g., education template → "TEACHING EXPERIENCE"). This overrides the initial
      // default template_id set at parse time when the user hasn't explicitly re-applied.
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
      const domainTemplateId = typeof window !== 'undefined' ? localStorage.getItem(selectedTemplateKey) ?? undefined : undefined;

      // Pass section background color only for Eclipse — other catalogues don't use it,
      // and a stale value in resumeStyle from a previous Eclipse session would bleed through.
      const sectionBgColor = selectedCatalogue === 'eclipse' ? resumeStyle.sectionHeaderBg : undefined;
      // Pass the accent/heading color so name + section headings match the preview
      const accentColor = resumeStyle.accentColor || resumeStyle.headingColor;
      // Pass the user's selected font and line spacing so the PDF matches the preview
      const fontFamily = resumeStyle.fontFamily || undefined;
      const lineSpacing = resumeStyle.lineSpacing || undefined;

      const blob = isEnhancedResume
        ? await downloadEnhancedResume(resumeId, format)
        : await downloadResume(resumeId, format, catalogueTemplateId, domainTemplateId, sectionBgColor, accentColor, sectionOrder, fontFamily, lineSpacing);

      // ✅ Generate filename from person's name
      const fullname = resumeData.personalInfo?.fullname || "";
      const sanitizedName = fullname
        .trim()
        .replace(/\s+/g, "_")  // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_-]/g, "")  // Remove special characters
        .substring(0, 50);  // Limit length to 50 chars

      const filename = sanitizedName ? `${sanitizedName}.${fileExtension}` : `resume.${fileExtension}`;

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
    // Create user-scoped localStorage keys
    const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
    const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';

    // Extract career level from localStorage appliedTemplateId
    const getCareerLevel = (): "Fresher" | "Early Career" | "Mid-Level" | "Senior-Level" | "Lead" | "Manager" => {
      try {
        const careerLevelStorage = localStorage.getItem(careerLevelKey);
        const appliedTemplateId = localStorage.getItem(selectedTemplateKey);

        if (careerLevelStorage && appliedTemplateId) {
          const careerLevels = JSON.parse(careerLevelStorage) as Array<{ id: string; name: string }>;
          const applied = careerLevels.find((t) => String(t.id) === String(appliedTemplateId));

          if (applied) {
            const name = applied.name.toLowerCase();
            if (name.includes('fresher')) return 'Fresher';
            if (name.includes('early')) return 'Early Career';
            if (name.includes('manager')) return 'Manager';
            if (name.includes('lead')) return 'Lead';
            if (name.includes('mid')) return 'Mid-Level';
            if (name.includes('senior')) return 'Senior-Level';
          }
        }
      } catch (err) {
        logger.warn('Error extracting career level:', err);
      }
      return 'Mid-Level';
    };

    const careerLevel = getCareerLevel();

    // Compute layoutVariant — use hovered catalogue key during preview, else the persisted selection
    const activeCatalogueKey = previewCatalogueKey ?? localStorage.getItem('selected_catalogue');
    const catalogueTemplateId = activeCatalogueKey ? STYLE_CATALOGUES[activeCatalogueKey]?.template_id : undefined;
    const layoutVariant: HeaderLayout = (catalogueTemplateId && CATALOGUE_LAYOUT_MAP[catalogueTemplateId]) || "centered";

    // Function to get the correct template component based on domain_family
    const getTemplateByDomain = (domainFamily?: string) => {
      switch (domainFamily) {
        case 'healthcare':
        case 'education':
        case 'cybersecurity':
        case 'electronics_and_vlsi':
        case 'sales_business_development':
        case 'modern_minimal_template':
        case 'logistics_warehouse_operations':
        case 'research_scholar':
        case 'software_engineering':
        case 'marine_merchant_navy':
        case 'core_engineering':
        case 'finance':
          return <ResumePagePager currentPage={currentPage} onPageCountChange={handlePageCountChange}><Template2 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} /></ResumePagePager>;
        case 'legal':
          return <ResumePagePager currentPage={currentPage} onPageCountChange={handlePageCountChange}><Template4 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} /></ResumePagePager>;
        case 'government_standard':
          return <ResumePagePager currentPage={currentPage} onPageCountChange={handlePageCountChange}><Template3 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} /></ResumePagePager>;
        default:
          return <ResumePagePager currentPage={currentPage} onPageCountChange={handlePageCountChange}><Template1 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} /></ResumePagePager>;
      }
    };

    // Template map with both string template_ids and numeric IDs
    const templateMap: { [key: string]: JSX.Element } = {
      // String-based template IDs
      'compact_professional': <TemplateOne data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      'clean_simple': <TemplateTwo data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      'minimalist_classic': <TemplateThree data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      'professional_classic': <TemplateFour data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      'classic_professional': <TemplateFive data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      // Numeric IDs for backward compatibility
      '1': <TemplateOne data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      '2': <TemplateTwo data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      '3': <TemplateThree data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      '4': <TemplateFour data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
      '5': <TemplateFive data={resumeData} style={resumeStyle} onPageCountChange={handlePageCountChange} currentPage={currentPage} />,
    };

    // Check if this is a career level template and render appropriate template based on domain
    const appliedTemplateId = localStorage.getItem(selectedTemplateKey);
    const careerLevelStorage = localStorage.getItem(careerLevelKey);
    logger.info('Career level render check:', { appliedTemplateId, hasCareerLevelStorage: !!careerLevelStorage });
    if (appliedTemplateId && careerLevelStorage) {
      try {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{
          id: string;
          name: string;
          domain_family?: string;
        }>;
        logger.info('Parsed careerLevels:', careerLevels);
        const appliedTemplate = careerLevels.find((t) => String(t.id) === String(appliedTemplateId));
        logger.info('Applied template found:', appliedTemplate);
        if (appliedTemplate) {
          logger.info('Rendering career level template with domain:', appliedTemplate.domain_family);
          return getTemplateByDomain(appliedTemplate.domain_family);
        }
      } catch (err) {
        logger.warn('Error checking career level template:', err);
      }
    }
    logger.info('Career level logic not triggered, checking templateMap');

    // Get the template based on selectedTemplate
    const template = templateMap[String(selectedTemplate)] || templateMap.clean_simple || templateMap["2"];

    if (template) {
      // // console.log("✅ Template found and rendering:", selectedTemplate);
      return template;
    }

    // Default empty state
    // // console.log("⚠️ No template selected, showing empty state");
    return (
      <div className="w-full max-w-full min-h-200 bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
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
    <section className={`relative flex flex-1 flex-col items-center bg-[#f8fafd] px-3 ${fromAts ? "h-auto" : "h-[95vh]"}`}>
      {/* Toolbar - When Sidebar is Open */}
      {isTemplateSidebarOpen && (
        <div
          className="relative z-30 mb-0 grid grid-cols-[1fr_auto_1fr] items-center rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 ease-in-out"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div
            onClick={handleResumeScoreClick}
            className="w-fit cursor-pointer rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black transition hover:border-emerald-200 hover:bg-emerald-100"
          >
            <span className="text-slate-700">{scoreLabel}</span>
            <span className="ml-1.5 text-emerald-700">{displayScore}%</span>
          </div>

          <div className="flex items-center gap-2 justify-self-center text-sm font-black uppercase tracking-normal text-[#2557a7]">
            <span>PREVIEW</span>
            <span className="absolute bottom-0 left-1/2 h-0.5 w-14 -translate-x-1/2 rounded-full bg-[#2557a7]" />
            {pageNavigation}
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
            <button
              onClick={() => setShowExportOptions((prev) => !prev)}
              disabled={isDownloading}
              className={`flex items-center gap-2 rounded-lg border border-[#2557a7] bg-[#2557a7] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:border-[#1f4e98] hover:bg-[#1f4e98] hover:text-white ${isDownloading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <ArrowDownToLine size={16} />
              {isDownloading ? "Downloading..." : "Export"}
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
                  onClick={() => handleExport("DOCX")}
                  className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                >
                  DOCX
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar - When Sidebar is Closed */}
      {!isTemplateSidebarOpen && (
        <div
          className="relative z-30 mx-auto flex w-full min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 ease-in-out"
        >
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleResumeScoreClick}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black transition hover:border-emerald-200 hover:bg-emerald-100"
            >
              <span className="text-slate-700">{scoreLabel}</span>
              <span className="ml-1.5 text-emerald-700">{displayScore}%</span>
            </button>

            <div className="flex items-center gap-2">
              {tabs.slice(0, 1).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    onClick={() => onTabClick(tab.label)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
                    title={tab.label}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {pageNavigation}
            <div className="flex h-8 items-center gap-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <button
              onClick={handleZoomOut}
              className="flex h-8 w-7 items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomOut size={16} className="text-[#2557a7]" />
            </button>

            <div className="min-w-[54px] px-2 text-center text-xs font-semibold text-gray-700">
              {Math.round(zoomLevel * 100)}%
            </div>

            <button
              onClick={handleZoomIn}
              className="flex h-8 w-7 items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomIn size={16} className="text-[#2557a7]" />
            </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onTabClick("Job Match")}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
            >
              <Shuffle size={16} />
              Job Match
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportOptions((prev) => !prev)}
                disabled={isDownloading}
                className={`flex shrink-0 items-center gap-2 rounded-lg border border-[#2557a7] bg-[#2557a7] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:border-[#1f4e98] hover:bg-[#1f4e98] hover:text-white ${isDownloading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                <ArrowDownToLine size={16} />
                {isDownloading ? "Downloading..." : "Export"}
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
                    onClick={() => handleExport("DOCX")}
                    className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                  >
                    DOCX
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

      {fromAts && topAtsIssue && (
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
              <AlertTriangle size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-rose-700">{topAtsIssue.label} is missing</span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">{topAtsIssue.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAtsIssue(topAtsIssue)}
            className="shrink-0 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
          >
            Fix This Section
          </button>
        </div>
      )}

      <div
        ref={previewContainerRef}
        id="resume-preview"
        className={`${fromAts ? "h-[760px]" : "h-225"} relative mx-auto flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out print:h-auto print:overflow-visible print:shadow-none`}
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
          {isEmailReady ? renderTemplate() : (
            <div className="w-full flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PreviewPanel;












