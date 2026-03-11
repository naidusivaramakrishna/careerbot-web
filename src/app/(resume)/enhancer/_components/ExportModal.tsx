// app/.../_components/ExportModal.tsx
import { useState } from "react";
import { Check, X, Download, Loader2 } from "lucide-react";
import { downloadEnhancedResume } from "@/api/enhancerApi";
import type { Improvement } from "@/types/api.types";
import { useResume } from "./ResumeContext";

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
  selectedTemplate?: string;
}

interface ValidatedImprovement {
  text: string;
  isFixed: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  onDownloadPDF,
  onDownloadDOC,
  enhancedId,
  improvements: propImprovements,
  selectedTemplate,
}: ExportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | null>(null);
  const { resumeData } = useResume();

  if (!isOpen) return null;

  // Validate if an improvement has been fixed based on current resume data
  const isImprovementFixed = (improvement: Improvement | string): boolean => {
    if (!resumeData) return false;

    const text = typeof improvement === 'string' ? improvement : (improvement.title || improvement.description);
    const lowerText = text.toLowerCase();

    // Check for contact field issues
    if (lowerText.includes('contact email') || lowerText.includes('email missing')) {
      return !!(resumeData.personalInfo?.email && resumeData.personalInfo.email.trim() !== '');
    }
    if (lowerText.includes('contact phone') || lowerText.includes('phone missing')) {
      return !!(resumeData.personalInfo?.phone && resumeData.personalInfo.phone.trim() !== '');
    }
    if (lowerText.includes('location missing')) {
      return !!(resumeData.personalInfo?.location && resumeData.personalInfo.location.trim() !== '');
    }

    // Check for experience field issues
    if (lowerText.includes('experience') && lowerText.includes('duration missing')) {
      // Extract experience index if specified (e.g., "Experience #1")
      const match = lowerText.match(/experience #?(\d+)/i);
      const index = match ? parseInt(match[1]) - 1 : 0;
      return !!(resumeData.workExperience?.[index]?.duration && resumeData.workExperience[index].duration.trim() !== '');
    }

    // Check for education field issues
    if (lowerText.includes('education') && (lowerText.includes('graduation') || lowerText.includes('duration missing'))) {
      const match = lowerText.match(/education #?(\d+)/i);
      const index = match ? parseInt(match[1]) - 1 : 0;
      return !!(resumeData.education?.[index]?.duration && resumeData.education[index].duration.trim() !== '');
    }

    // Check for projects field issues
    if (lowerText.includes('project') && lowerText.includes('duration missing')) {
      const match = lowerText.match(/project #?(\d+)/i);
      const index = match ? parseInt(match[1]) - 1 : 0;
      return !!(resumeData.projects?.[index]?.startDate || resumeData.projects?.[index]?.endDate);
    }

    // Check for skills missing
    if (lowerText.includes('skills') && lowerText.includes('missing')) {
      return !!(resumeData.skills && resumeData.skills.length > 0) ||
             !!(resumeData.categorizedSkills && Object.keys(resumeData.categorizedSkills).length > 0);
    }

    // Check for summary missing
    if (lowerText.includes('summary') && lowerText.includes('missing')) {
      return !!(resumeData.professionalSummary && resumeData.professionalSummary.trim() !== '');
    }

    // Check for internships field issues
    if (lowerText.includes('internship')) {
      const match = lowerText.match(/internship #?(\d+)/i);
      const index = match ? parseInt(match[1]) - 1 : 0;

      if (lowerText.includes('company') && lowerText.includes('missing')) {
        return !!(resumeData.internships?.[index]?.company && resumeData.internships[index].company.trim() !== '');
      }
      if (lowerText.includes('duration missing')) {
        return !!(resumeData.internships?.[index]?.duration && resumeData.internships[index].duration.trim() !== '');
      }
      if (lowerText.includes('role') || lowerText.includes('position')) {
        return !!(resumeData.internships?.[index]?.role && resumeData.internships[index].role.trim() !== '');
      }
    }

    // Check for GitHub profile
    if (lowerText.includes('github') && lowerText.includes('missing')) {
      return !!(resumeData.personalInfo?.githubUrl && resumeData.personalInfo.githubUrl.trim() !== '');
    }

    // Check for LinkedIn profile
    if (lowerText.includes('linkedin') && lowerText.includes('missing')) {
      return !!(resumeData.personalInfo?.linkedinUrl && resumeData.personalInfo.linkedinUrl.trim() !== '');
    }

    // Check for achievements
    if (lowerText.includes('achievement')) {
      if (lowerText.includes('missing') || lowerText.includes('incomplete')) {
        return !!(resumeData.achievements && resumeData.achievements.length > 0);
      }
    }

    // Check for certifications
    if (lowerText.includes('certification') && lowerText.includes('missing')) {
      return !!(resumeData.certifications && resumeData.certifications.length > 0);
    }

    // Check for awards
    if (lowerText.includes('award') && lowerText.includes('missing')) {
      return !!(resumeData.awards && resumeData.awards.length > 0);
    }

    // Check for volunteering
    if (lowerText.includes('volunteer') && lowerText.includes('missing')) {
      return !!(resumeData.volunteering && resumeData.volunteering.length > 0);
    }

    // Check for languages
    if (lowerText.includes('language') && lowerText.includes('missing')) {
      return !!(resumeData.languages && resumeData.languages.length > 0);
    }

    // For generic improvements (optimized, enhanced, etc.) that don't represent missing fields
    // Return true as these are considered "improvements made" not "issues to fix"
    if (lowerText.includes('optimized') ||
        lowerText.includes('enhanced') ||
        lowerText.includes('improved') ||
        lowerText.includes('cleaned up') ||
        lowerText.includes('corrected')) {
      return true;
    }

    // Default: if we can't determine, show as not fixed
    return false;
  };

  // Get improvements from props or session storage or use default
  const getValidatedImprovements = (): ValidatedImprovement[] => {
    let rawImprovements: (Improvement | string)[] = [];

    if (propImprovements && propImprovements.length > 0) {
      rawImprovements = propImprovements; // Show all improvements, not just first 4
    } else {
      const storedImprovements = sessionStorage.getItem('improvements');
      if (storedImprovements) {
        try {
          const parsed = JSON.parse(storedImprovements) as Improvement[];
          rawImprovements = parsed; // Show all improvements, not just first 4
        } catch {
          // Fall through to default
        }
      }
    }

    // If no improvements from backend, use defaults
    if (rawImprovements.length === 0) {
      rawImprovements = [
        "Optimized keywords for ATS systems",
        "Enhanced bullet points for impact and clarity",
        "Cleaned up formatting and structure",
        "Corrected grammar and improved readability",
      ];
    }

    // Validate each improvement
    return rawImprovements.map(imp => ({
      text: typeof imp === 'string' ? imp : (imp.title || imp.description),
      isFixed: isImprovementFixed(imp),
    }));
  };

  const improvements = getValidatedImprovements();

  // Map frontend template IDs to all 5 backend template IDs
  const TEMPLATE_ID_MAP: Record<string, string> = {
    apollo: "compact_professional",     // Modern (teal preview) → teal backend
    atlas: "professional_classic",      // Classic (serif, traditional)
    terra: "minimalist_classic",        // Minimal (centered name) → minimalist centered
    tempe: "clean_simple",              // Creative (clean, simple)
    classic_professional: "classic_professional", // Executive (serif, labeled groups)
  };

  // Handle download using backend API with correct template
  const handleDownload = async (format: "pdf" | "docx") => {
    if (format === "pdf" && onDownloadPDF) { onDownloadPDF(); return; }
    if (format === "docx" && onDownloadDOC) { onDownloadDOC(); return; }

    if (!enhancedId) { alert("Cannot download: No enhanced resume ID found"); return; }

    setIsDownloading(true);
    setDownloadFormat(format);

    try {
      const backendTemplate = selectedTemplate
        ? (TEMPLATE_ID_MAP[selectedTemplate] ?? "professional_classic")
        : "professional_classic";

      // Pass template directly to download (preserve_template=false applies the selected template)
      const blob = await downloadEnhancedResume(enhancedId, format, backendTemplate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced-resume.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to download resume: ${msg}`);
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Success header banner ── */}
        <div className="bg-linear-to-b from-[#e8eff9] to-white px-8 pt-10 pb-6 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-[#2557a7] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#2557a7]/20">
            <Check className="w-8 h-8 text-white stroke-3" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Resume Optimized!</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            Your resume is now ATS-friendly and ready to impress recruiters.
          </p>
        </div>

        {/* ── Improvements list ── */}
        <div className="px-7 py-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">What we found</p>
          <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                  improvement.isFixed ? "bg-emerald-100" : "bg-amber-100"
                }`}>
                  {improvement.isFixed ? (
                    <Check className="w-3 h-3 text-emerald-600 stroke-3" />
                  ) : (
                    <span className="text-[10px] font-black text-amber-600 leading-none">!</span>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${improvement.isFixed ? "text-gray-600" : "text-amber-700"}`}>
                  {improvement.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Download buttons ── */}
        <div className="px-7 pb-7">
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => handleDownload("docx")}
              disabled={isDownloading}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading && downloadFormat === "docx" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
              ) : (
                <><Download className="w-4 h-4" /> Download DOCX</>
              )}
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={isDownloading}
              className="flex-1 px-4 py-3 bg-[#2557a7] hover:bg-[#1a4a8f] text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading && downloadFormat === "pdf" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF</>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">PDF recommended for job applications</p>
        </div>

      </div>
    </div>
  );
}
