// ============================================
// FILE: app/enhancer/_components/EnhancerPage.tsx
// ============================================
"use client";

import React, { useState, useEffect } from "react";
import { Upload, FileText, Check, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResume, type SectionName } from "./ResumeContext";
import { processResumeEnhancement, enhanceResume } from "@/api/enhancerApi";
import { cleanResumeData, cleanResumeContent } from "../_utils/cleanResumeData";
import LoadingModal from "./LoadingModal";

const EnhancerPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setResumeData, setSelectedTemplate, setEnabledSections } = useResume();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Clear previous resume data when landing on upload page (fresh start on every visit)
  // This runs BEFORE the context's restore effect (children effects run first),
  // so sessionStorage is wiped before ResumeProvider can restore old data.
  // Exception: skip clearing when coming from ATS "Fix now" (from_ats=true).
  useEffect(() => {
    if (searchParams.get("from_ats") === "true") return;
    setResumeData(null);
    sessionStorage.removeItem('ctx_resumeData');
    sessionStorage.removeItem('ctx_enabledSections');
    sessionStorage.removeItem('ctx_selectedTemplate');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-process when coming from ATS "Fix now" button
  useEffect(() => {
    const fromAts = searchParams.get("from_ats");
    if (fromAts !== "true") return;

    const resumeId     = searchParams.get("resume_id");
    if (!resumeId) return;

    const atsBreakdown = searchParams.get("ats_breakdown") ?? undefined;

    let atsParsedData: unknown = {};
    try {
      const stored = localStorage.getItem("atsAnalysisData");
      if (stored) {
        const atsData = JSON.parse(stored) as { parsed_data?: unknown };
        atsParsedData = atsData.parsed_data || {};
      }
    } catch {}

    void handleFileUpload(null, { resumeId, atsParsedData, atsBreakdown });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      void handleFileUpload(file);
    } else {
      alert("Please upload a PDF or DOCX file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      void handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File | null, atsOverride?: { resumeId: string; atsParsedData: unknown; atsBreakdown?: string }) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parseResult: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let enhanceResult: any;

      if (atsOverride) {
        // ATS flow: resume already parsed, just run enhancement
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 95) { clearInterval(interval); return 95; }
            return Math.min(prev + Math.floor(Math.random() * 10) + 5, 95);
          });
        }, 300);

        enhanceResult = await enhanceResume({
          resume_id:     atsOverride.resumeId,
          ...(atsOverride.atsBreakdown ? { ats_breakdown: atsOverride.atsBreakdown } : {}),
        });
        clearInterval(interval);
        setUploadProgress(100);

        parseResult = {
          resume_id: atsOverride.resumeId,
          parsed_data: atsOverride.atsParsedData || {},
          file_name: "resume.pdf",
        };
      } else {
        // Normal file upload flow
        if (!file) { setUploading(false); return; }

        if (process.env.NODE_ENV === 'development') {
          console.log("File uploaded:", file.name);
        }

        // Store file metadata
        sessionStorage.setItem("uploadedFileName", file.name);
        sessionStorage.setItem("uploadedFileSize", file.size.toString());
        sessionStorage.setItem("uploadedFileType", file.type);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prevProgress) => {
            if (prevProgress >= 95) {
              clearInterval(interval);
              return 95;
            }
            return Math.min(
              prevProgress + Math.floor(Math.random() * 10) + 5,
              95
            );
          });
        }, 200);

        // Call the actual API to parse and enhance the resume
        const result = await processResumeEnhancement(file);
        clearInterval(interval);
        setUploadProgress(100);

        parseResult = result.parseResult;
        enhanceResult = result.enhanceResult;

        if (process.env.NODE_ENV === 'development') {
          console.log("Resume parsing result:", parseResult);
          console.log("Resume enhancement result:", enhanceResult);
        }
      }

      // Store the resume_id and enhanced_id for later use
      sessionStorage.setItem("resume_id", parseResult.resume_id);
      sessionStorage.setItem("enhanced_id", enhanceResult.enhanced_resume_id);
      sessionStorage.setItem("original_resume_id", enhanceResult.resume_id);

      // ============================================
      // JOBMATCH-STYLE DATA EXTRACTION
      // Use same robust logic as JobMatchTemplate
      // ============================================

      // Get the raw data - try multiple sources like JobMatch does
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData: any = enhanceResult.enhanced_resume || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedData: any = parseResult.parsed_data || rawData.parsed_data || rawData || {};
      const llmData = parsedData.llm_data || rawData.llm_data || {};

      if (process.env.NODE_ENV === 'development') {
        console.log("=== JOBMATCH-STYLE EXTRACTION ===");
        console.log("rawData:", rawData);
        console.log("parsedData:", parsedData);
        console.log("llmData:", llmData);
      }

      // Extract contact with multiple fallbacks (like JobMatch)
      const contact =
        rawData.contact ||
        parsedData.contact ||
        llmData.contact ||
        llmData.personal_info ||
        {};

      // Extract social links with multiple fallbacks
      const socialLinks =
        rawData.social_links ||
        parsedData.social_links ||
        llmData.social_links ||
        contact || // Sometimes in contact
        {};

      // Extract technical skills with multiple fallbacks and type safety
      let technicalSkills =
        rawData.technical_skills ||
        parsedData.technical_skills ||
        rawData.skills ||
        parsedData.skills ||
        llmData.technical_skills ||
        llmData.skills ||
        [];

      // Ensure array (like JobMatch)
      if (!Array.isArray(technicalSkills)) {
        if (typeof technicalSkills === 'object') {
          technicalSkills = Object.values(technicalSkills).flat();
        } else {
          technicalSkills = [];
        }
      }

      // Clean the data after extraction
      const enhancedData = cleanResumeData(rawData);

      // ============================================
      // HELPER FUNCTIONS (Define first)
      // ============================================

      // Helper function to clean string fields
      const cleanString = (str: string | undefined | null): string => {
        if (!str) return "";
        return cleanResumeContent(str).cleanContent.trim();
      };

      // Helper function to detect if a string is a section header
      const isSectionHeader = (str: string): boolean => {
        const headers = [
          'VOLUNTEERING',
          'PUBLICATIONS',
          'LANGUAGES',
          'HOBBIES',
          'INTERESTS',
          'REFERENCES',
          'AWARDS',
          'ACHIEVEMENTS',
          'CERTIFICATIONS',
          'CERTIFICATES',
          'EDUCATION',
          'EXPERIENCE',
          'SKILLS',
          'PROJECTS',
          'SUMMARY',
        ];

        const trimmed = str.trim().toUpperCase();
        return headers.includes(trimmed);
      };

      // Helper function to convert bullet points
      const formatBulletPoints = (contributions: string[] = []) => {
        // Clean each contribution to remove "CRITICAL RULES" text
        return contributions
          .map(c => {
            const cleaned = cleanResumeContent(c).cleanContent.trim();
            return cleaned ? `• ${cleaned}` : '';
          })
          .filter(c => c !== '') // Remove empty strings
          .join('\n');
      };

      // ============================================
      // WORK EXPERIENCE - JobMatch-style extraction
      // ============================================
      let workExperience =
        rawData.workExperience ||
        rawData.work_experience ||
        rawData.experience ||
        rawData.professional_experience ||
        parsedData.workExperience ||
        parsedData.work_experience ||
        parsedData.experience ||
        llmData.workExperience ||
        llmData.work_experience ||
        llmData.experience ||
        llmData.professional_experience ||
        [];

      if (!Array.isArray(workExperience)) workExperience = [];

      // Map with multiple field name fallbacks
      workExperience = workExperience.map((exp: Record<string, unknown>) => {
        const duration = exp.duration as string | undefined;
        const startDate = duration?.split(' - ')[0] || "";
        const endDate = duration?.split(' - ')[1] || "Present";
        return {
          role: cleanString((exp.role || exp.title || exp.position || exp.designation) as string),
          company: cleanString((exp.company || exp.organization || exp.employer) as string),
          location: cleanString((exp.location || exp.place || exp.city) as string),
          startDate,
          endDate,
          duration: duration || (startDate ? `${startDate} – ${endDate}` : ""),
          description: formatBulletPoints(
            (exp.key_contributions || exp.responsibilities || exp.description || exp.achievements) as string[] || []
          ),
          currentlyWorking: !duration || duration.includes("Present"),
        };
      }).filter((exp: { company: string; role: string }) => exp.company || exp.role);

      // ============================================
      // EDUCATION - JobMatch-style extraction
      // ============================================
      let education =
        rawData.education ||
        rawData.educational_qualifications ||
        parsedData.education ||
        parsedData.educational_qualifications ||
        llmData.education ||
        llmData.educational_qualifications ||
        [];

      if (!Array.isArray(education)) education = [];

      education = education.map((edu: Record<string, unknown>) => {
        const duration = edu.duration as string | undefined;
        const grade = edu.grade || edu.gpa;
        const gradeType = edu.grade_type || edu.grade_point || "GPA";

        return {
          college: cleanString((edu.college || edu.institution || edu.university || edu.school) as string),
          degree: cleanString((edu.degree || edu.qualification || edu.course) as string),
          branch: cleanString((edu.branch || edu.field || edu.specialization) as string),
          duration: duration || "",
          grade: cleanString((grade || "") as string),
          gradeType: cleanString((gradeType || "") as string),
          achievements: edu.achievements || "",
        };
      }).filter((edu: Record<string, unknown>) => edu.college || edu.degree);

      // ============================================
      // PROJECTS - JobMatch-style extraction
      // ============================================
      // Handle both llmData.projects and llmData.additional[0].projects
      const additionalData = Array.isArray(llmData.additional) && llmData.additional.length > 0
        ? llmData.additional[0]
        : {};

      console.log("=== ADDITIONAL DATA DEBUG ===");
      console.log("llmData.additional:", llmData.additional);
      console.log("additionalData:", additionalData);
      console.log("additionalData.languages:", additionalData?.languages);
      console.log("additionalData.interests:", additionalData?.interests);

      let projects =
        rawData.projects ||
        rawData.project_details ||
        parsedData.projects ||
        parsedData.project_details ||
        llmData.projects ||
        llmData.project_details ||
        additionalData.projects ||
        [];

      if (!Array.isArray(projects)) projects = [];

      projects = projects.map((proj: Record<string, unknown>) => ({
        title: cleanString((proj.title || proj.name || proj.project_name) as string),
        link: cleanString((proj.link || proj.url || proj.github) as string),
        client: cleanString((proj.client || "") as string),
        startDate: "",
        endDate: "",
        description: formatBulletPoints(
          (proj.key_contributions || proj.description || proj.details || proj.responsibilities) as string[] || []
        ),
      })).filter((proj: { title: string }) => proj.title);

      // ============================================
      // SKILLS - Extract from technical_skills array
      // ============================================
      const skills = technicalSkills.map((s: Record<string, unknown> | string) =>
        typeof s === 'string' ? s : ((s.skill as string) || s)
      );

      // Categorize skills by their category
      const categorizedSkills: Record<string, string[]> = {};
      technicalSkills.forEach((skillObj: Record<string, unknown> | string) => {
        if (typeof skillObj === 'string') return;
        const category = (skillObj.category as string) || "Other";
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        if (!categorizedSkills[categoryName]) {
          categorizedSkills[categoryName] = [];
        }
        categorizedSkills[categoryName].push(skillObj.skill as string);
      });

      // ============================================
      // CERTIFICATIONS - JobMatch-style extraction
      // ============================================
      let certifications =
        rawData.certifications ||
        rawData.certificates ||
        parsedData.certifications ||
        parsedData.certificates ||
        llmData.certifications ||
        llmData.certificates ||
        enhancedData.certifications ||
        [];

      if (!Array.isArray(certifications)) certifications = [];

      certifications = certifications.map((cert: Record<string, unknown> | string) => {
        if (typeof cert === 'string') {
          const cleaned = cleanString(cert.replace('(cid:127) ', ''));
          if (isSectionHeader(cleaned) || !cleaned) return null;
          return { name: cleaned, issuedBy: "", year: "" };
        }
        const name = cleanString((cert.name || cert.certification || cert.title) as string);
        if (isSectionHeader(name) || !name) return null;
        return {
          name,
          issuedBy: cleanString((cert.issuedBy || cert.issued_by || cert.organization || cert.issuer) as string),
          year: cleanString((cert.year || cert.date || cert.issued_date) as string)
        };
      }).filter((cert: { name: string; issuedBy: string; year: string } | null): cert is { name: string; issuedBy: string; year: string } => cert !== null);

      // ============================================
      // HOBBIES/INTERESTS - JobMatch-style extraction
      // ============================================
      let hobbies =
        rawData.hobbies ||
        rawData.interests ||
        parsedData.hobbies ||
        parsedData.interests ||
        (additionalData && additionalData.hobbies) ||
        (additionalData && additionalData.interests) ||
        llmData.hobbies ||
        llmData.interests ||
        enhancedData.hobbies ||
        enhancedData.interests ||
        [];

      if (!Array.isArray(hobbies)) hobbies = [];

      hobbies = hobbies
        .map((hobby: string | Record<string, unknown>) => {
          if (typeof hobby === 'string') {
            const cleaned = cleanString(hobby);
            if (isSectionHeader(cleaned) || !cleaned) return null;
            return { name: cleaned, description: "" };
          }
          const name = cleanString((hobby.name || hobby.hobby) as string);
          if (isSectionHeader(name) || !name) return null;
          return {
            name,
            description: cleanString((hobby.description || hobby.details) as string)
          };
        })
        .filter((h: { name: string; description: string } | null): h is { name: string; description: string } => h !== null);

      if (process.env.NODE_ENV === 'development') {
        console.log("Extracted hobbies:", hobbies);
      }

      // ============================================
      // LANGUAGES - JobMatch-style extraction
      // ============================================
      let languages =
        rawData.languages ||
        rawData.languages_known ||
        parsedData.languages ||
        parsedData.languages_known ||
        llmData.languages ||
        llmData.languages_known ||
        (additionalData && additionalData.languages) || // Check in additional[0]
        enhancedData.languages ||
        [];

      // Handle string format (comma-separated)
      if (typeof languages === 'string') {
        languages = languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
      }

      if (!Array.isArray(languages)) languages = [];

      languages = languages
        .map((lang: string | Record<string, unknown>) => {
          if (typeof lang === 'string') {
            const cleaned = cleanString(lang);
            if (isSectionHeader(cleaned) || !cleaned) return null;
            return { language: cleaned, proficiency: "" };
          }
          const language = cleanString((lang.language || lang.name || lang.lang) as string);
          if (isSectionHeader(language) || !language) return null;
          return {
            language,
            proficiency: cleanString((lang.proficiency || lang.level || lang.fluency) as string)
          };
        })
        .filter((l: { language: string; proficiency: string } | null): l is { language: string; proficiency: string } => l !== null);

      if (process.env.NODE_ENV === 'development') {
        console.log("Extracted languages:", languages);
      }

      // ============================================
      // AWARDS - Extract from awards field (NOT achievements)
      // ============================================
      const awardsRaw =
        rawData.awards ||
        parsedData.awards ||
        (additionalData && additionalData.awards) ||
        llmData.awards ||
        enhancedData.awards ||
        [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== AWARDS RAW DATA ===", awardsRaw);
      }

      const awards = awardsRaw
        .map((award: Record<string, unknown> | string) => {
          if (typeof award === 'string') {
            const cleaned = cleanString(award);
            // Skip if it's a section header or empty
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              title: cleaned,
              issuedBy: "",
              year: "",
            };
          }
          const title = cleanString(award.title as string);
          // Skip if title is a section header or empty
          if (isSectionHeader(title) || !title) {
            return null;
          }
          return {
            title,
            issuedBy: cleanString(award.issuedBy as string),
            year: cleanString(award.year as string),
          };
        })
        .filter((a: { title: string; issuedBy: string; year: string } | null): a is { title: string; issuedBy: string; year: string } => a !== null);

      // ============================================
      // ACHIEVEMENTS - Extract from achievements field (separate from awards)
      // ============================================
      const achievementsRaw =
        rawData.achievements ||
        parsedData.achievements ||
        llmData.achievements ||
        enhancedData.achievements ||
        [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== ACHIEVEMENTS RAW DATA ===", achievementsRaw);
      }

      const achievements = achievementsRaw
        .map((achievement: Record<string, unknown> | string) => {
          if (typeof achievement === 'string') {
            const cleaned = cleanString(achievement);
            // Skip if it's a section header or empty
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              title: cleaned,
              description: "",
              date: "",
            };
          }
          const title = cleanString((achievement.title || achievement.achievement) as string);
          // Skip if title is a section header or empty
          if (isSectionHeader(title) || !title) {
            return null;
          }
          return {
            title,
            description: cleanString((achievement.description || achievement.details) as string),
            date: cleanString((achievement.date || achievement.year) as string),
          };
        })
        .filter((a: { title: string; description: string; date: string } | null): a is { title: string; description: string; date: string } => a !== null);

      // Extract and clean Volunteering
      const volunteeringRaw =
        rawData.volunteering ||
        parsedData.volunteering ||
        (additionalData && additionalData.volunteering) ||
        llmData.volunteering ||
        enhancedData.volunteering ||
        [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== VOLUNTEERING RAW DATA ===", volunteeringRaw);
      }

      const volunteering = volunteeringRaw
        .map((vol: Record<string, unknown> | string) => {
          if (typeof vol === 'string') {
            const cleaned = cleanString(vol);
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              role: cleaned,
              organization: "",
              duration: "",
              description: "",
            };
          }
          const role = cleanString(vol.role as string);
          if (isSectionHeader(role) || !role) {
            return null;
          }

          return {
            role,
            organization: cleanString(vol.organization as string),
            duration: cleanString(vol.duration as string),
            description: formatBulletPoints((vol.contributions as string[]) || (vol.description as string[]) || []),
          };
        })
        .filter((v: { role: string; organization: string; duration: string; description: string } | null): v is { role: string; organization: string; duration: string; description: string } => v !== null);

      // Extract and clean Publications
      const publicationsRaw =
        rawData.publications ||
        parsedData.publications ||
        (additionalData && additionalData.publications) ||
        llmData.publications ||
        enhancedData.publications ||
        [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== PUBLICATIONS RAW DATA ===", publicationsRaw);
      }

      const publications = publicationsRaw
        .map((pub: Record<string, unknown> | string) => {
          if (typeof pub === 'string') {
            const cleaned = cleanString(pub);
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              title: cleaned,
              publicationName: "",
              date: "",
              authors: "",
              url: "",
            };
          }
          const title = cleanString(pub.title as string);
          if (isSectionHeader(title) || !title) {
            return null;
          }
          return {
            title,
            publicationName: cleanString(pub.publication_name as string || pub.publicationName as string || pub.publisher as string),
            date: cleanString(pub.date as string),
            authors: cleanString(pub.authors as string),
            url: cleanString(pub.url as string || pub.link as string),
          };
        })
        .filter((p: { title: string; publicationName: string; date: string; authors: string; url: string } | null): p is { title: string; publicationName: string; date: string; authors: string; url: string } => p !== null);

      // Extract and clean References
      const referencesRaw =
        rawData.references ||
        parsedData.references ||
        (additionalData && additionalData.references) ||
        llmData.references ||
        enhancedData.references ||
        [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== REFERENCES RAW DATA ===", referencesRaw);
      }

      const references = referencesRaw
        .map((ref: Record<string, unknown> | string) => {
          if (typeof ref === 'string') {
            const cleaned = cleanString(ref);
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              name: cleaned,
              relation: "",
              contact: "",
            };
          }
          const name = cleanString(ref.name as string);
          if (isSectionHeader(name) || !name) {
            return null;
          }
          return {
            name,
            relation: cleanString(ref.relation as string),
            contact: cleanString(ref.contact as string || ref.phone as string || ref.email as string),
          };
        })
        .filter((r: { name: string; relation: string; contact: string } | null): r is { name: string; relation: string; contact: string } => r !== null);

      const transformedResumeData = {
        personalInfo: {
          fullName: contact.name || "",
          email: contact.email || "",
          phone: contact.phone || "",
          location: contact.location || "",
          linkedinUrl: socialLinks.linkedIn || "",
          portfolioUrl: socialLinks.github || "",
        },
        professionalSummary: cleanString(enhancedData.summary),
        workExperience,
        education,
        skills,
        projects,
        languages,
        certifications,
        awards,
        hobbies,
        internships: (llmData.internships || []).map((intern: Record<string, unknown>) => ({
          role: cleanString(intern.role as string),
          company: cleanString(intern.company as string),
          location: cleanString(intern.location as string),
          duration: cleanString((intern.duration as string) || ""),
          description: formatBulletPoints((intern.key_contributions as string[]) || []),
        })),
        achievements, // Use the cleaned achievements array (separate from awards)
        volunteering,
        references,
        interests: hobbies,
        publications,
        categorizedSkills,
        // Include raw backend summary variants (if any) so editors can show AI suggestions
        summaryVariants: rawData.summary_variants || enhanceResult.enhanced_resume?.summary_variants || [],
      };

      if (process.env.NODE_ENV === 'development') {
        console.log("=== CLEANED DATA DEBUG ===");
        console.log("Awards count:", awards.length);
        console.log("Achievements count:", achievements.length);
        console.log("Volunteering count:", volunteering.length);
        console.log("Publications count:", publications.length);
        console.log("References count:", references.length);

        console.log("=== IMPROVEMENTS DEBUG ===");
        console.log("Backend enhancement_report:", enhanceResult.enhancement_report);
        console.log("Validation results:", enhanceResult.enhancement_report?.details?.validation_results);
      }

      // Extract improvements from backend response (SOURCE OF TRUTH)
      // suggestions is now an array of objects: { id, section, message, fix_type }
      type BackendSuggestion = { id: string; section: string; message: string; fix_type: string };
      const rawSuggestions = (enhanceResult.suggestions || []) as (BackendSuggestion | string)[];

      const backendSuggestions = rawSuggestions;

      // Transform backend suggestions to improvement format
      const allImprovements = backendSuggestions.map((suggestion, index) => {
        // Handle both object and legacy string formats
        const isObj = typeof suggestion === 'object' && suggestion !== null;
        const message = isObj ? (suggestion as BackendSuggestion).message : suggestion as string;
        const suggSection = isObj ? (suggestion as BackendSuggestion).section : null;
        const fixType = isObj ? (suggestion as BackendSuggestion).fix_type : 'manual';
        const suggId = isObj ? (suggestion as BackendSuggestion).id : `suggestion_${index}`;

        const lowerMsg = message.toLowerCase();

        // Determine impact — auto fixes are higher priority
        let impact: 'high' | 'medium' | 'low' = fixType === 'auto' ? 'high' : 'medium';
        let impact_points = fixType === 'auto' ? 12 : 8;

        if (lowerMsg.includes('missing') && !lowerMsg.includes('optional')) {
          impact = 'high';
          impact_points = 12;
        }
        if (lowerMsg.includes('optional') || lowerMsg.includes('recommended')) {
          impact = 'medium';
          impact_points = 6;
        }

        // Map section from object or fallback to message-based detection
        let section: string | null = suggSection?.toLowerCase() || null;
        const category = 'content';

        if (!section) {
          if (lowerMsg.includes('experience')) section = 'experience';
          else if (lowerMsg.includes('education')) section = 'education';
          else if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('phone')) section = 'contact';
          else if (lowerMsg.includes('achievement')) section = 'achievements';
        }

        // Split on ' - ' to separate the label from the replacement text
        const parts = message.split(' - ');
        const title = parts[0] || message;
        const description = parts.length > 1 ? parts.slice(1).join(' - ') : message;

        // For replacement suggestions, extract before/after from the message
        // Pattern: Replace "X" with "Y" — extract X as before, Y as after
        let before = '';
        let after = description;
        const replaceMatch = message.match(/^Replace\s+"([^"]+)"\s+with\s+"([^"]+)"/i);
        if (replaceMatch) {
          before = replaceMatch[1];
          after = replaceMatch[2];
        }

        return {
          id: `${suggId}_${Date.now()}`,
          original_suggestion_id: suggId,
          fix_type: fixType,
          category,
          section,
          title,
          description,
          impact,
          impact_points,
          before,
          after,
          action_type: 'add_field',
          replacement_text: null,
        };
      });

      // Sort by impact points (highest first)
      allImprovements.sort((a, b) => b.impact_points - a.impact_points);

      // Save improvements
      sessionStorage.setItem("improvements", JSON.stringify(allImprovements));
      sessionStorage.setItem("all_improvements", JSON.stringify(allImprovements));

      // Store ATS score from enhancer_state.ats_breakdown
      const atsBreakdown = enhanceResult.enhancer_state?.ats_breakdown as Record<string, unknown> | undefined;
      if (atsBreakdown) {
        sessionStorage.setItem("ats_score", JSON.stringify({
          final_score: atsBreakdown.FinalScore ?? atsBreakdown.Percentage ?? 0,
          max_score: atsBreakdown.MaxScore ?? 100,
          profile: atsBreakdown.Profile ?? 'General',
          domain: atsBreakdown.Domain ?? '',
          section_breakdown: atsBreakdown.SectionBreakdown ?? {},
        }));
      }

      // enhanced_id is already stored above — applyFix uses it directly

      // Set the resume data in context
      if (process.env.NODE_ENV === 'development') {
        console.log("Setting resume data:", transformedResumeData);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setResumeData(transformedResumeData as any);

      // Set default template to atlas (TemplateTwo)
      setSelectedTemplate("atlas");

      // Enable sections that have data
      const sectionsToEnable: SectionName[] = ["PersonalInfo"];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== SECTION DETECTION ===");
        console.log("professionalSummary:", transformedResumeData.professionalSummary?.substring(0, 50));
        console.log("workExperience.length:", transformedResumeData.workExperience.length);
        console.log("skills.length:", transformedResumeData.skills.length);
        console.log("education.length:", transformedResumeData.education.length);
        console.log("projects.length:", transformedResumeData.projects.length);
        console.log("languages.length:", transformedResumeData.languages.length);
        console.log("certifications.length:", transformedResumeData.certifications.length);
        console.log("awards.length:", transformedResumeData.awards.length);
        console.log("hobbies.length:", transformedResumeData.hobbies.length);
        console.log("internships.length:", transformedResumeData.internships.length);
        console.log("achievements.length:", transformedResumeData.achievements?.length || 0);
        console.log("volunteering.length:", transformedResumeData.volunteering?.length || 0);
        console.log("publications.length:", transformedResumeData.publications?.length || 0);
        console.log("references.length:", transformedResumeData.references?.length || 0);
        console.log("interests.length:", transformedResumeData.interests?.length || 0);
      }

      if (transformedResumeData.professionalSummary) sectionsToEnable.push("Summary");
      if (transformedResumeData.workExperience.length > 0) sectionsToEnable.push("Experience");
      if (transformedResumeData.skills.length > 0) sectionsToEnable.push("Skills");
      if (transformedResumeData.education.length > 0) sectionsToEnable.push("Education");
      if (transformedResumeData.projects.length > 0) sectionsToEnable.push("Projects");
      if (transformedResumeData.languages.length > 0) sectionsToEnable.push("Languages");
      if (transformedResumeData.certifications.length > 0) sectionsToEnable.push("Certificates");
      if (transformedResumeData.awards.length > 0) sectionsToEnable.push("Awards");
      if (transformedResumeData.hobbies.length > 0) sectionsToEnable.push("Hobbies");
      if (transformedResumeData.internships.length > 0) sectionsToEnable.push("Internships");
      if (transformedResumeData.achievements && transformedResumeData.achievements.length > 0) sectionsToEnable.push("Achievements");
      if (transformedResumeData.volunteering && transformedResumeData.volunteering.length > 0) sectionsToEnable.push("Volunteering");
      if (transformedResumeData.publications && transformedResumeData.publications.length > 0) sectionsToEnable.push("Publications");
      if (transformedResumeData.references && transformedResumeData.references.length > 0) sectionsToEnable.push("References");
      if (transformedResumeData.interests && transformedResumeData.interests.length > 0) sectionsToEnable.push("Interests");

      if (process.env.NODE_ENV === 'development') {
        console.log("=== FINAL ENABLED SECTIONS ===");
        console.log("sectionsToEnable:", sectionsToEnable);
      }

      setEnabledSections(sectionsToEnable);

      if (process.env.NODE_ENV === 'development') {
        console.log("Navigating to /enhancer/builder");
      }

      // Small delay to ensure state is set before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When coming from ATS, use replace so the /enhancer?from_ats=true entry is
      // removed from history — pressing Back returns to /atslogin/report instead of
      // re-triggering the auto-process loop.
      // For normal uploads, use push so Back returns to /enhancer as expected.
      if (atsOverride) {
        router.replace("/enhancer/builder");
      } else {
        router.push("/enhancer/builder");
      }
    } catch (error: unknown) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Full error:", error);

      const err = error as { message?: string; response?: unknown; __raw?: unknown };
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error __raw:", err?.__raw);

      // Try to extract meaningful error message
      let errorMessage = "Error uploading file. Please try again.";

      if (err?.__raw) {
        try {
          const rawError = typeof err.__raw === 'string'
            ? JSON.parse(err.__raw)
            : err.__raw;
          errorMessage = (rawError as { detail?: string; message?: string }).detail ||
                        (rawError as { detail?: string; message?: string }).message ||
                        errorMessage;
        } catch {
          errorMessage = String(err.__raw);
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      alert(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4ff 0%, #fafafa 40%, #f5f0ff 100%)" }}>
      {uploading && <LoadingModal />}

      <main className="px-8 py-10 max-w-6xl mx-auto">

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[#dde8fb] shadow-sm backdrop-blur mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-[#2557a7]" />
            <span className="text-xs font-semibold text-[#2557a7] tracking-wide">AI Resume Optimizer · GPT-4 Powered</span>
          </div>
          <h1 className="text-[2.75rem] font-black text-gray-900 leading-[1.1] tracking-tight mb-4">
            Beat the ATS.{" "}
            <span style={{ background: "linear-gradient(135deg, #2557a7 0%, #7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Get Hired Faster.
            </span>
          </h1>
          <p className="text-[15px] text-gray-500 max-w-xl mx-auto leading-relaxed">
            Upload your resume once. Our AI detects every gap, rewrites weak bullets, and returns a polished, ATS-ready document in seconds.
          </p>
        </div>

        {/* ══════════════════════════════════════════
            MAIN LAYOUT
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT: Upload + Stats ── */}
          <div className="flex flex-col gap-5">

            {/* Upload Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-xl shadow-gray-200/60 overflow-hidden">


              {/* Drop Zone */}
              <div
                className={`m-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-16 px-10 cursor-pointer select-none ${
                  dragActive
                    ? "border-[#2557a7] bg-[#eef3ff]"
                    : uploadedFileName
                    ? "border-emerald-400 bg-emerald-50/60"
                    : "border-gray-200 bg-gray-50/80 hover:border-[#2557a7]/50 hover:bg-[#f4f7ff]"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedFileName ? (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
                      <Check className="w-9 h-9 text-emerald-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">{uploadedFileName}</p>
                    <p className="text-sm text-emerald-600 font-semibold">Uploaded · AI is analyzing your resume…</p>
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Icon cluster */}
                    <div className={`relative mx-auto mb-6 w-20 h-20 transition-transform duration-300 ${dragActive ? "scale-110" : "hover:scale-105"}`}>
                      <div className="absolute inset-0 rounded-2xl rotate-6 opacity-20" style={{ background: "linear-gradient(135deg, #2557a7, #7c3aed)" }} />
                      <div className="absolute inset-0 rounded-2xl -rotate-3 opacity-10" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }} />
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #eef3ff, #f3eeff)" }}>
                        <Upload className="w-9 h-9 text-[#2557a7]" />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-1.5">
                      {dragActive ? "Release to upload" : "Drop your resume here"}
                    </h3>
                    <p className="text-sm text-gray-400 mb-7">PDF or DOCX · Instant AI analysis · 100% private</p>

                    <label className="cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.html,.rtf,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                      <span className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg shadow-blue-900/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-blue-900/30 group-hover:-translate-y-0.5"
                        style={{ background: "linear-gradient(135deg, #2557a7 0%, #7c3aed 100%)" }}>
                        <FileText className="w-4 h-4" />
                        Choose File to Upload
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Trust Row */}
              <div className="mx-6 mb-6 grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/60">
                {[
                  { icon: "🔐", label: "256-bit SSL", sub: "Bank-grade security" },
                  { icon: "⚡", label: "~20 Seconds", sub: "Instant analysis" },
                  { icon: "🧠", label: "GPT-4 AI", sub: "State-of-the-art" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1 px-4 py-3.5 text-center">
                    <span className="text-lg leading-none mb-0.5">{item.icon}</span>
                    <p className="text-[11px] font-bold text-gray-800">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "10,000+", label: "Resumes optimized", color: "#2557a7" },
                { value: "+38%", label: "Avg. ATS score boost", color: "#7c3aed" },
                { value: "94%", label: "Report better results", color: "#059669" },
              ].map((s) => (
                <div key={s.label} className="bg-white/90 backdrop-blur rounded-2xl border border-white shadow-md shadow-gray-200/50 px-5 py-4 text-center">
                  <p className="text-2xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/80 border border-white shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {["#2557a7","#7c3aed","#059669","#d97706","#dc2626"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{ background: c }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Join 10,000+ professionals</p>
                  <p className="text-[10px] text-gray-400">who boosted their interviews this month</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
                <span className="text-[10px] font-bold text-amber-700 ml-0.5">4.9</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Steps + Improvements + Score ── */}
          <div className="flex flex-col gap-4 sticky top-6">

            {/* How it works */}
            <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-xl shadow-gray-200/50 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 -translate-y-8 translate-x-8" style={{ background: "linear-gradient(135deg, #2557a7, #7c3aed)" }} />
              <p className="text-[10px] font-black text-[#2557a7] uppercase tracking-[0.15em] mb-5">How it works</p>
              <div className="space-y-1">
                {[
                  { n: "1", title: "Upload Resume", desc: "PDF or DOCX, any format", grad: "from-[#2557a7] to-[#1a3f7a]" },
                  { n: "2", title: "AI Deep Scan", desc: "Detects every ATS gap instantly", grad: "from-[#7c3aed] to-[#5b21b6]" },
                  { n: "3", title: "Review & Apply", desc: "One-click per improvement", grad: "from-[#0891b2] to-[#0e7490]" },
                  { n: "4", title: "Export & Apply", desc: "Download recruiter-ready PDF", grad: "from-[#059669] to-[#047857]" },
                ].map((item, idx) => (
                  <div key={item.n} className="flex items-start gap-3.5 relative">
                    {idx < 3 && <div className="absolute left-[17px] top-[36px] w-px h-6 bg-gray-100 z-0" />}
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center text-white text-xs font-black shrink-0 z-10 shadow-sm`}>
                      {item.n}
                    </div>
                    <div className="py-1.5 pb-4 last:pb-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What AI fixes */}
            <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-xl shadow-gray-200/50 p-6">
              <p className="text-[10px] font-black text-[#2557a7] uppercase tracking-[0.15em] mb-4">What AI fixes</p>
              <div className="space-y-2">
                {[
                  { icon: "🎯", label: "ATS Keyword Gaps" },
                  { icon: "✍️", label: "Weak Bullet Points" },
                  { icon: "📐", label: "Format & Structure" },
                  { icon: "📊", label: "Missing Metrics" },
                  { icon: "💼", label: "Professional Tone" },
                  { icon: "🔍", label: "Role Alignment" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f7ff] transition-colors group cursor-default">
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 flex-1">{item.label}</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Score Card */}
            <div className="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl"
              style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #2557a7 55%, #6d28d9 100%)" }}>
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.15em] mb-1">Average result</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-black leading-none">+38%</span>
                </div>
                <p className="text-sm text-blue-200 mb-4">ATS score improvement</p>
                <div className="h-1.5 rounded-full bg-white/20 mb-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: "78%" }} />
                </div>
                <div className="flex justify-between">
                  <p className="text-[10px] text-blue-300">Before upload</p>
                  <p className="text-[10px] text-blue-300">After AI enhancement</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancerPage;
