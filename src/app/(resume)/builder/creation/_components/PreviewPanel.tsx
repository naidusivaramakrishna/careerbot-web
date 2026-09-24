"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowDownToLine,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  BarChart2,
  Shuffle,
} from "lucide-react";
import { useResume } from "../_context/ResumeContext";
import { useScore } from "../_context/ScoreContext";
import { useResumeScorePreview } from "../_hooks/useResumeScorePreview";
import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import TemplateThree from "./templates/TemplateThree";
import TemplateFour from "./templates/TemplateFour";
import TemplateFive from "./templates/TemplateFive";
import Template2 from "../../../templates/Template2";
import Template3 from "../../../templates/Template3";
import Template4 from "../../../templates/Template4";
import { downloadResume } from "../../../../../api/resumeApi";
import { downloadEnhancedResume } from "../../../../../api/enhancerApi";
import { getProfile } from "@/api/userApi";
import { detectCareerLevel as detectCareerLevelUtil } from "@/utils/careerLevelDetection";
import logger from "@/lib/logger";
import { STYLE_CATALOGUES, CATALOGUE_LAYOUT_MAP, HeaderLayout } from "../_utils/templateStyles";
import { useCatalogues } from "@/hooks/useCatalogues";
interface PreviewPanelProps {
  isTemplateSidebarOpen: boolean;
  onTabClick: (tab: string) => void;
  onOpenSidebar?: (tab: string) => void;
  resumeId?: string;
  isEnhancedResume?: boolean;
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
  resumeId: resumeIdProp,
  isEnhancedResume = false,
}) => {
  const { selectedTemplate, resumeData, resumeStyle, resumeSource, enhancedAtsScore, sectionOrder, previewCatalogueKey } = useResume();
  const { canonicalScore, setCanonicalScore } = useScore();
  const previewScore = useResumeScorePreview(resumeData);
  const { getCataloguesMap } = useCatalogues();

  // For enhanced resumes, seed the canonical score from the enhancer's ATS score
  // so the toolbar and any other score consumers show the correct value.
  useEffect(() => {
    if (isEnhancedResume && enhancedAtsScore?.final_score) {
      setCanonicalScore(Math.round(enhancedAtsScore.final_score));
    }
  }, [isEnhancedResume, enhancedAtsScore, setCanonicalScore]);

  const displayScore = isEnhancedResume && enhancedAtsScore?.final_score
    ? Math.round(enhancedAtsScore.final_score)
    : (canonicalScore ?? previewScore.score);
  const scoreLabel = "Score";

  useEffect(() => {
    console.warn("📋 PreviewPanel - sectionOrder:", sectionOrder, "selectedTemplate:", selectedTemplate);
  }, [sectionOrder, selectedTemplate]);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEmailReady, setIsEmailReady] = useState(false);

  // Fetch email before rendering template to avoid flash between global and scoped localStorage keys
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

  const getCareerLevel = (): "Fresher" | "Early Career" | "Mid-Level" | "Senior-Level" | "Lead" | "Architect" | "Manager" | "Director" | "Vice President" => {
    try {
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const careerLevelStorage = localStorage.getItem(careerLevelKey);
      const appliedTemplateId = localStorage.getItem(selectedTemplateKey);

      if (careerLevelStorage && appliedTemplateId) {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{ id: string; name: string }>;
        const applied = careerLevels.find((t) => String(t.id) === String(appliedTemplateId));

        if (applied) {
          const name = applied.name.toLowerCase();
          const detected = detectCareerLevelUtil(name);
          if (detected) {
            return detected;
          }
          if (name.includes('early') && name.includes('career')) return 'Early Career';
          if (name.includes('mid')) return 'Mid-Level';
        }
      }
    } catch (err) {
      logger.warn('Error extracting career level:', err);
    }
    return 'Mid-Level';
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
      // Use loaded catalogues from API if available, fallback to hardcoded STYLE_CATALOGUES for backward compatibility
      const cataloguesMap = getCataloguesMap();
      const catalogueConfig = selectedCatalogue ? (cataloguesMap[selectedCatalogue] || STYLE_CATALOGUES[selectedCatalogue]) : undefined;
      const catalogueTemplateId = catalogueConfig?.template_id;

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
      const careerLevel = getCareerLevel();

      const blob = isEnhancedResume
        ? await downloadEnhancedResume(resumeId, format, catalogueTemplateId, domainTemplateId, sectionBgColor, accentColor, sectionOrder, fontFamily, lineSpacing, careerLevel)
        : await downloadResume(resumeId, format, catalogueTemplateId, domainTemplateId, sectionBgColor, accentColor, sectionOrder, fontFamily, lineSpacing, careerLevel);

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

    const careerLevel = getCareerLevel();

    // Compute layoutVariant — use hovered catalogue key during preview, else the persisted selection
    const activeCatalogueKey = previewCatalogueKey ?? localStorage.getItem('selected_catalogue');
    // Use loaded catalogues from API if available, fallback to hardcoded for backward compatibility
    const cataloguesMap = getCataloguesMap();
    const activeCatalogueConfig = activeCatalogueKey ? (cataloguesMap[activeCatalogueKey] || STYLE_CATALOGUES[activeCatalogueKey]) : undefined;
    const catalogueTemplateId = activeCatalogueConfig?.template_id;
    const layoutVariant: HeaderLayout = (catalogueTemplateId && CATALOGUE_LAYOUT_MAP[catalogueTemplateId]) || "centered";

    // Function to get the correct template component based on domain_family
    const getTemplateByDomain = (domainFamily?: string) => {
      switch (domainFamily) {
        case 'healthcare':
        case 'education':
        case 'cybersecurity':
        case 'electronics_and_vlsi':
        case 'sales_business_development':
        case 'customer_support_service':
        case 'product_engineering_leadership':
        case 'marketing_creative':
        case 'operations_management':
        case 'human_resources':
        case 'logistics_warehouse_operations':
        case 'research_scholar':
        case 'software_engineering':
        case 'marine_merchant_navy':
        case 'core_engineering':
        case 'finance':
          return <Template2 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} />;
        case 'legal':
          return <Template4 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} />;
        case 'government_standard':
          return <Template3 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} />;
        default:
          return <Template2 data={resumeData} style={resumeStyle} careerLevel={careerLevel} domainFamily={domainFamily} sectionOrder={sectionOrder} layoutVariant={layoutVariant} />;
      }
    };

    // Template map with both string template_ids and numeric IDs
    const templateMap: { [key: string]: JSX.Element } = {
      // String-based template IDs
      'compact_professional': <TemplateOne data={resumeData} style={resumeStyle} />,
      'clean_simple': <TemplateTwo data={resumeData} style={resumeStyle} />,
      'minimalist_classic': <TemplateThree data={resumeData} style={resumeStyle} />,
      'professional_classic': <TemplateFour data={resumeData} style={resumeStyle} />,
      'classic_professional': <TemplateFive data={resumeData} style={resumeStyle} />,
      // Numeric IDs for backward compatibility
      '1': <TemplateOne data={resumeData} style={resumeStyle} />,
      '2': <TemplateTwo data={resumeData} style={resumeStyle} />,
      '3': <TemplateThree data={resumeData} style={resumeStyle} />,
      '4': <TemplateFour data={resumeData} style={resumeStyle} />,
      '5': <TemplateFive data={resumeData} style={resumeStyle} />,
    };

    // Read and immediately consume the fresh-start flag so it only governs the first
    // email-ready render. Reading sessionStorage here (after isEmailReady) is safe —
    // getProfile() resolves after the mount effect that would have cleared the ref,
    // so a ref approach was inert; direct sessionStorage read is the only reliable path.
    const isFreshStart = typeof window !== 'undefined' && sessionStorage.getItem('builder_fresh_start') === 'true';
    if (isFreshStart) sessionStorage.removeItem('builder_fresh_start');

    // Check if this is a career level template and render appropriate template based on domain
    const appliedTemplateId = localStorage.getItem(selectedTemplateKey);
    const careerLevelStorage = localStorage.getItem(careerLevelKey);
    logger.info('Career level render check:', { appliedTemplateId, hasCareerLevelStorage: !!careerLevelStorage });
    if (!isFreshStart && appliedTemplateId && careerLevelStorage) {
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
          // Use template's domain family for career level filtering
          const templateDomain = appliedTemplate.domain_family || 'software_engineering';
          logger.info('Rendering career level template with domain:', templateDomain);
          return getTemplateByDomain(templateDomain);
        }
      } catch (err) {
        logger.warn('Error checking career level template:', err);
      }
    }
    logger.info('Career level logic not triggered, checking templateMap');

    // Only honour catalogue/style templates that the user explicitly applied
    // via TemplatesTab. initializeBuilder auto-sets selectedTemplate to the API
    // default ("clean_simple") on every load — without this guard that would
    // cause new users to see old TemplateTwo instead of Template2.tsx.
    const styleKey = userEmail ? `user_chose_style_${userEmail}` : 'user_chose_style';
    const userChoseStyle = localStorage.getItem(styleKey) === 'true';
    if (userChoseStyle) {
      const explicitTemplate = templateMap[String(selectedTemplate)];
      if (explicitTemplate) return explicitTemplate;
    }

    // Default: Template2.tsx with software_engineering domain
    return getTemplateByDomain('software_engineering');
  };

  return (
    <section className="flex flex-col flex-1 bg-[#f8fafd] px-2 items-center h-[95vh] relative">
      {/* Toolbar - When Sidebar is Open */}
      {isTemplateSidebarOpen && (
        <div
          className="flex items-center justify-between border border-gray-300 rounded px-6 py-1.5 mb-0 bg-white shadow-sm relative z-30 transition-all duration-300 ease-in-out"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1 text-xs font-semibold">
            <span className="text-[#2d2d2d]">{`${scoreLabel} ${displayScore}%`}</span>
          </div>

          <div className="text-base font-semibold text-[#2d2d2d]">
            <span>PREVIEW</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportOptions((prev) => !prev)}
              disabled={isDownloading}
              className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${isDownloading ? "opacity-50 cursor-not-allowed" : ""
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
                  onClick={() => handleExport("DOCX")}
                  className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                >
                  DOCX
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
              className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
            >
              <span className="text-[#2d2d2d]">{`${scoreLabel} ${displayScore}%`}</span>
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

            <div className="px-3 text-sm font-semibold text-gray-700 min-w-7.5 text-center">
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
                className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${isDownloading ? "opacity-50 cursor-not-allowed" : ""
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

      <div
        ref={previewContainerRef}
        id="resume-preview"
        className="h-225 overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative transition-all duration-300 ease-in-out"
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












