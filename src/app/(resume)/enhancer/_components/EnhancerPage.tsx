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

      // Parse ONLY the backend suggestions array
      const backendSuggestions: string[] = enhanceResult.suggestions || [];

      if (process.env.NODE_ENV === 'development') {
        console.log("=== BACKEND SUGGESTIONS (RAW) ===");
        console.log("Suggestions array:", backendSuggestions);
      }

      // Transform backend suggestions to improvement format
      const allImprovements = backendSuggestions.map((suggestion, index) => {
        // Determine impact and category based on keywords in the suggestion
        let impact: 'high' | 'medium' | 'low' = 'medium';
        let impact_points = 8;
        let category = 'content';
        let section: string | null = null;

        const lowerSuggestion = suggestion.toLowerCase();

        // High priority suggestions (missing without optional)
        if (lowerSuggestion.includes('missing') && !lowerSuggestion.includes('optional')) {
          impact = 'high';
          impact_points = 12;
        }

        // Determine section - Check experience/education FIRST before contact
        if (lowerSuggestion.includes('experience #') || lowerSuggestion.includes('experience:')) {
          section = 'experience';
          category = 'content';
        } else if (lowerSuggestion.includes('education #') || lowerSuggestion.includes('education:')) {
          section = 'education';
          category = 'content';
        } else if (lowerSuggestion.includes('contact name') || lowerSuggestion.includes('contact') || lowerSuggestion.includes('email') || lowerSuggestion.includes('phone')) {
          section = 'contact';
          category = 'sections';
        } else if (lowerSuggestion.includes('achievement')) {
          section = 'achievements';
          category = 'sections';
        }

        // Optional suggestions have lower impact
        if (lowerSuggestion.includes('optional') || lowerSuggestion.includes('recommended')) {
          impact = 'medium';
          impact_points = 6;
        }

        // Split suggestion into title and description
        const parts = suggestion.split(' - ');
        const title = parts[0] || suggestion;
        const description = parts.length > 1 ? parts.slice(1).join(' - ') : suggestion;

        return {
          id: `backend_suggestion_${index}_${Date.now()}`,
          category,
          section,
          title,
          description,
          impact,
          impact_points,
          before: '',
          after: description,
          action_type: 'add_field',
          replacement_text: null,
        };
      });

      // Sort by impact points (highest first)
      allImprovements.sort((a, b) => b.impact_points - a.impact_points);

      if (process.env.NODE_ENV === 'development') {
        console.log("=== AI SUGGESTIONS ===");
        console.log("Total suggestions:", allImprovements.length);
        console.log("Suggestions:", allImprovements);
      }

      // Store enhancement report and improvements
      if (enhanceResult.enhancement_report) {
        sessionStorage.setItem("ats_score", JSON.stringify({
          total_score: enhanceResult.enhancement_report.details?.validation_results?.total_issues || 0,
          critical_count: enhanceResult.enhancement_report.details?.validation_results?.critical_count || 0,
          warning_count: enhanceResult.enhancement_report.details?.validation_results?.warning_count || 0,
          info_count: enhanceResult.enhancement_report.details?.validation_results?.info_count || 0,
        }));
        sessionStorage.setItem("improvements", JSON.stringify(allImprovements));
        sessionStorage.setItem("enhancement_report", JSON.stringify(enhanceResult.enhancement_report));
      }

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
    <div className="min-h-screen bg-gray-50">
      {uploading && <LoadingModal />}

      <main className="px-6 py-8 max-w-7xl mx-auto">

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8eff9] border border-[#c3d4ef] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2557a7]" />
            <span className="text-xs font-semibold text-[#2557a7]">AI-Powered Enhancement</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Enhance Your Resume</h1>
          <p className="text-sm text-gray-500">Upload your resume and let AI optimize it for ATS systems and recruiters.</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_380px] gap-6">

          {/* LEFT: Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Upload zone */}
            <div
              className={`m-6 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center py-16 px-8 ${
                dragActive
                  ? "border-[#2557a7] bg-[#e8eff9]"
                  : uploadedFileName
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-[#2557a7] hover:bg-[#e8eff9]/40"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFileName ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">{uploadedFileName}</p>
                  <p className="text-sm text-green-600 font-medium">File ready — processing...</p>
                </>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200 ${
                    dragActive ? "bg-[#2557a7] scale-110" : "bg-[#e8eff9]"
                  }`}>
                    <Upload className={`w-7 h-7 transition-colors ${dragActive ? "text-white" : "text-[#2557a7]"}`} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {dragActive ? "Drop your resume here" : "Drag & drop your resume"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-7">or click the button below to browse files</p>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.html,.rtf,.txt"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <span className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#2557a7] hover:bg-[#1a4a8f] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm">
                      <FileText className="w-4 h-4" />
                      Browse Files
                    </span>
                  </label>

                  <p className="text-xs text-gray-400 mt-5">PDF, DOCX supported</p>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="mx-6 mb-6 grid grid-cols-3 gap-3">
              {[
                { icon: "🔒", label: "Secure Upload", sub: "256-bit encrypted" },
                { icon: "⚡", label: "Instant Results", sub: "Under 30 seconds" },
                { icon: "🤖", label: "AI Powered", sub: "GPT-4 analysis" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="mx-6 mb-6 flex items-center gap-3 p-4 rounded-xl bg-[#e8eff9]/50 border border-[#c3d4ef]">
              <div className="flex -space-x-2 shrink-0">
                {["#4f46e5","#0891b2","#059669","#d97706"].map((color, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">10,000+</span> professionals enhanced their resumes this month
              </p>
            </div>
          </div>

          {/* RIGHT: How it works + features */}
          <div className="flex flex-col gap-5">

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Upload Resume", desc: "PDF, DOCX or any common format", color: "#2557a7" },
                  { step: "2", title: "AI Analysis", desc: "Our AI scans for ATS issues and gaps", color: "#7c3aed" },
                  { step: "3", title: "Review Suggestions", desc: "Accept or skip AI improvements", color: "#0891b2" },
                  { step: "4", title: "Export & Apply", desc: "Download a polished, ATS-ready resume", color: "#059669" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ background: item.color }}>
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What gets improved */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">What gets improved</h3>
              <div className="space-y-2.5">
                {[
                  { icon: "📌", label: "ATS Keyword Optimization" },
                  { icon: "✏️", label: "Bullet Point Rewriting" },
                  { icon: "📐", label: "Format & Structure" },
                  { icon: "💼", label: "Professional Language" },
                  { icon: "📊", label: "Impact & Metrics" },
                  { icon: "🎯", label: "Role-Specific Tailoring" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <Sparkles className="w-3 h-3 text-[#2557a7] ml-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Score preview */}
            <div className="bg-gradient-to-br from-[#2557a7] to-[#1a3f7a] rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold text-blue-200 mb-1">Average result</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold">+38%</span>
                <span className="text-sm text-blue-200 mb-1">ATS score improvement</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "78%" }} />
              </div>
              <p className="text-xs text-blue-200 mt-2">Based on 10,000+ resumes enhanced</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancerPage;
