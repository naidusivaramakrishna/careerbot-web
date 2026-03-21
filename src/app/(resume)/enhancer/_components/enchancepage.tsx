// ============================================
// FILE: app/enhancer/_components/enchancepage.tsx
// ============================================
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useResume, type SectionName } from "./ResumeContext";
import { processResumeEnhancement } from "@/api/enhancerApi";
import { cleanResumeData, cleanResumeContent } from "../_utils/cleanResumeData";

const EnhancerPage: React.FC = () => {
  const router = useRouter();
  const { setResumeData, setSelectedTemplate, setEnabledSections } = useResume();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      void handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      console.log("File uploaded:", file.name);

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
      const { parseResult, enhanceResult } = await processResumeEnhancement(file);

      // Clear the interval
      clearInterval(interval);
      setUploadProgress(100);

      console.log("Resume parsing result:", parseResult);
      console.log("Resume enhancement result:", enhanceResult);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const llmData: any = parsedData.llm_data || rawData.llm_data || {};

      console.log("=== JOBMATCH-STYLE EXTRACTION ===");
      console.log("rawData:", rawData);
      console.log("parsedData:", parsedData);
      console.log("llmData:", llmData);

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
        return {
          role: cleanString((exp.role || exp.title || exp.position || exp.designation) as string),
          company: cleanString((exp.company || exp.organization || exp.employer) as string),
          location: cleanString((exp.location || exp.place || exp.city) as string),
          startDate: duration?.split(' - ')[0] || "",
          endDate: duration?.split(' - ')[1] || "Present",
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
      const additionalData = (Array.isArray(llmData.additional) && llmData.additional.length > 0
        ? llmData.additional[0]
        : {}) as Record<string, unknown>;

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

      console.log("Extracted hobbies:", hobbies);

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

      console.log("Extracted languages:", languages);

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
      console.log("=== AWARDS RAW DATA ===", awardsRaw);
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
      console.log("=== ACHIEVEMENTS RAW DATA ===", achievementsRaw);
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
      console.log("=== VOLUNTEERING RAW DATA ===", volunteeringRaw);
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
              startDate: "",
              endDate: "",
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
            startDate: cleanString(vol.startDate as string || vol.start_date as string),
            endDate: cleanString(vol.endDate as string || vol.end_date as string),
            description: formatBulletPoints((vol.contributions as string[]) || (vol.description as string[]) || []),
          };
        })
        .filter((v: { role: string; organization: string; startDate: string; endDate: string; description: string } | null): v is { role: string; organization: string; startDate: string; endDate: string; description: string } => v !== null);

      // Extract and clean Publications
      const publicationsRaw =
        rawData.publications ||
        parsedData.publications ||
        (additionalData && additionalData.publications) ||
        llmData.publications ||
        enhancedData.publications ||
        [];
      console.log("=== PUBLICATIONS RAW DATA ===", publicationsRaw);
      const publications = publicationsRaw
        .map((pub: Record<string, unknown> | string) => {
          if (typeof pub === 'string') {
            const cleaned = cleanString(pub);
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              title: cleaned,
              publisher: "",
              date: "",
              authors: "",
              link: "",
            };
          }
          const title = cleanString(pub.title as string);
          if (isSectionHeader(title) || !title) {
            return null;
          }
          return {
            title,
            publisher: cleanString(pub.publisher as string),
            date: cleanString(pub.date as string),
            authors: cleanString(pub.authors as string),
            link: cleanString(pub.link as string || pub.url as string),
          };
        })
        .filter((p: { title: string; publisher: string; date: string; authors: string; link: string } | null): p is { title: string; publisher: string; date: string; authors: string; link: string } => p !== null);

      // Extract and clean References
      const referencesRaw =
        rawData.references ||
        parsedData.references ||
        (additionalData && additionalData.references) ||
        llmData.references ||
        enhancedData.references ||
        [];
      console.log("=== REFERENCES RAW DATA ===", referencesRaw);
      const references = referencesRaw
        .map((ref: Record<string, unknown> | string) => {
          if (typeof ref === 'string') {
            const cleaned = cleanString(ref);
            if (isSectionHeader(cleaned) || !cleaned) {
              return null;
            }
            return {
              name: cleaned,
              title: "",
              company: "",
              email: "",
              phone: "",
            };
          }
          const name = cleanString(ref.name as string);
          if (isSectionHeader(name) || !name) {
            return null;
          }
          return {
            name,
            title: cleanString(ref.title as string),
            company: cleanString(ref.company as string),
            email: cleanString(ref.email as string),
            phone: cleanString(ref.phone as string),
          };
        })
        .filter((r: { name: string; title: string; company: string; email: string; phone: string } | null): r is { name: string; title: string; company: string; email: string; phone: string } => r !== null);

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
        summaryVariants: rawData.summary_variants || [],
      };

      console.log("=== CLEANED DATA DEBUG ===");
      console.log("Awards count:", awards.length);
      console.log("Achievements count:", achievements.length);
      console.log("Volunteering count:", volunteering.length);
      console.log("Publications count:", publications.length);
      console.log("References count:", references.length);

      console.log("=== IMPROVEMENTS DEBUG ===");
      console.log("Backend enhancement_report:", enhanceResult.enhancement_report);
      console.log("Validation results:", enhanceResult.enhancement_report?.details?.validation_results);

      // Extract improvements from backend response (SOURCE OF TRUTH)
      interface BackendIssue {
        code?: string;
        field?: string;
        message?: string;
        severity?: string;
        suggestion?: string;
        current_value?: string;
      }

      // Define types for work experience and education
      interface WorkExperience {
        company?: string;
        role?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }

      interface Education {
        degree?: string;
        institution?: string;
        startDate?: string;
        endDate?: string;
        achievements?: string;
        grade?: string;
      }

      // Parse ONLY the backend suggestions array
      const backendSuggestions = enhanceResult.suggestions || [];
      console.log("=== BACKEND SUGGESTIONS (RAW) ===");
      console.log("Suggestions array:", backendSuggestions);

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

      console.log("=== AI SUGGESTIONS ===");
      console.log("Total suggestions:", allImprovements.length);
      console.log("Suggestions:", allImprovements);

      // Always save all backend suggestions — never skip any
      sessionStorage.setItem("improvements", JSON.stringify(allImprovements));
      sessionStorage.setItem("all_improvements", JSON.stringify(allImprovements));

      // Store ATS score and enhancement report if available
      if (enhanceResult.enhancement_report) {
        sessionStorage.setItem("ats_score", JSON.stringify({
          total_score: enhanceResult.enhancement_report.details?.validation_results?.total_issues || 0,
          critical_count: enhanceResult.enhancement_report.details?.validation_results?.critical_count || 0,
          warning_count: enhanceResult.enhancement_report.details?.validation_results?.warning_count || 0,
          info_count: enhanceResult.enhancement_report.details?.validation_results?.info_count || 0,
        }));
        sessionStorage.setItem("enhancement_report", JSON.stringify(enhanceResult.enhancement_report));
      }

      // Set the resume data in context
      console.log("Setting resume data:", transformedResumeData);
      setResumeData(transformedResumeData);

      // Set default template to atlas (TemplateTwo)
      setSelectedTemplate("atlas");

      // Enable sections that have data
      const sectionsToEnable: SectionName[] = ["PersonalInfo"];

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

      console.log("=== FINAL ENABLED SECTIONS ===");
      console.log("sectionsToEnable:", sectionsToEnable);

      setEnabledSections(sectionsToEnable);

      console.log("Navigating to /enhancer/builder");
      
      // Small delay to ensure state is set before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Navigate to builder page
      router.push("/enhancer/builder");
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

  const steps = [
    { id: 1, name: "Upload" },
    { id: 2, name: "AI Analysis" },
    { id: 3, name: "Optimization" },
    { id: 4, name: "View Results" },
  ];

  const getStepStatus = (stepId: number) => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return false;
    const progressThreshold = ((idx + 1) / steps.length) * 100;
    return uploadProgress >= progressThreshold;
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="px-8 py-8">
        {/* Gray Background Container - Original Layout */}
        <div className="bg-gray-100 rounded-3xl p-8 border border-gray-200">
          {/* White Content Card */}
          <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Optimize Your Resume for Success
              </h1>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Our AI analyzes your resume, identifies improvement opportunities,
                and helps you create a polished, job-ready document in minutes.
              </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Sidebar - Progress */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-gray-200 shadow">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Your Progress</h3>
                      <p className="text-xs text-gray-500">Enhancement journey</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-1">
                    {steps.map((step, index) => {
                      const isCompleted = getStepStatus(step.id);
                      const progressStart = (index / steps.length) * 100;
                      const progressEnd = ((index + 1) / steps.length) * 100;
                      const inProgress = uploadProgress > progressStart && uploadProgress < progressEnd;
                      const isLast = index === steps.length - 1;

                      // Step icons
                      const stepIcons = [
                        <path key="upload" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
                        <path key="ai" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                        <path key="optimize" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                        <path key="export" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      ];

                      return (
                        <div key={step.id}>
                          <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            inProgress
                              ? "bg-indigo-50 border border-indigo-100"
                              : isCompleted
                              ? "bg-emerald-50/50"
                              : "hover:bg-gray-50"
                          }`}>
                            {/* Icon Circle */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              isCompleted
                                ? "bg-emerald-500 text-white shadow-sm"
                                : inProgress
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className={`w-4 h-4 ${inProgress ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {stepIcons[index]}
                                </svg>
                              )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isCompleted ? "text-emerald-700" : inProgress ? "text-indigo-700" : "text-gray-500"
                              }`}>
                                {step.name}
                              </p>
                              {inProgress && (
                                <p className="text-xs text-indigo-500 mt-0.5">Processing...</p>
                              )}
                              {isCompleted && (
                                <p className="text-xs text-emerald-500 mt-0.5">Complete</p>
                              )}
                            </div>

                            {/* Status Badge */}
                            {inProgress && (
                              <div className="flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                              </div>
                            )}
                            {isCompleted && (
                              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          {/* Connector Line */}
                          {!isLast && (
                            <div className="ml-[22px] h-2 flex items-center">
                              <div className={`w-0.5 h-full transition-colors duration-300 ${
                                isCompleted ? "bg-emerald-300" : "bg-gray-200"
                              }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Section */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall</span>
                        <span className={`text-xl font-bold ${
                          uploadProgress === 100 ? "text-emerald-600" : "text-indigo-600"
                        }`}>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            uploadProgress === 100
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                          }`}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        {uploadProgress === 0 && "Ready to start"}
                        {uploadProgress > 0 && uploadProgress < 100 && "Processing your resume..."}
                        {uploadProgress === 100 && "All steps completed!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Upload Area */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full">
                  {uploading ? (
                    /* Uploading State */
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                      {/* Spinner */}
                      <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Analyzing Resume
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Please wait while we process your document
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-indigo-600">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Upload Zone */
                    <div
                      className={`h-full min-h-[400px] border-2 border-dashed rounded-2xl transition-all duration-200 flex flex-col items-center justify-center p-8 ${
                        dragActive
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300 hover:border-gray-400 bg-gray-50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {/* Cloud Icon */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                        dragActive ? "bg-indigo-100" : "bg-white shadow-sm border border-gray-200"
                      }`}>
                        <svg
                          className={`w-8 h-8 ${dragActive ? "text-indigo-600" : "text-indigo-500"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Drag & drop a file here
                      </h3>
                      <p className="text-gray-500 mb-6">
                        or click to browse from your device
                      </p>

                      {/* Upload Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.html,.rtf,.txt"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={uploading}
                        />
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload resume for enhancement
                        </span>
                      </label>

                      {/* Supported Formats */}
                      <p className="text-sm text-gray-400 mt-6">
                        We can read: DOC, DOCX, PDF, HTML, RTF, TXT
                      </p>
                    </div>
                  )}

                  {/* Security Note */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Your files are encrypted and never shared</span>
                  </div>
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