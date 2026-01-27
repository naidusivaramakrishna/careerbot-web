"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useResume } from "./ResumeContext";
import { updateEnhancedResume } from "@/api/enhancerApi";

/* ===== EDITORS ===== */
import PersonalInfoEditor from "./section-editors/PersonalInfoEditor";
import SummaryEditor from "./section-editors/SummaryEditor";
import ExperienceEditor from "./section-editors/ExperienceEditor";
import EducationEditor from "./section-editors/EducationEditor";
import InternshipsEditor from "./section-editors/InternshipsEditor";
import ProjectsEditor from "./section-editors/ProjectsEditor";
import SkillsEditor from "./section-editors/SkillsEditor";
import LanguagesEditor from "./section-editors/LanguagesEditor";
import HobbiesEditor from "./section-editors/HobbiesEditor";
import CertificatesEditor from "./section-editors/CertificatesEditor";
import AwardsEditor from "./section-editors/AwardsEditor";
import AchievementsEditor from "./section-editors/AchievementsEditor";
import VolunteeringEditor from "./section-editors/VolunteeringEditor";
import InterestsEditor from "./section-editors/InterestsEditor";
import PublicationsEditor from "./section-editors/PublicationsEditor";
import ReferencesEditor from "./section-editors/ReferencesEditor";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SectionEditorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { resumeData, setResumeData, activeSection } = useResume();
  const [formData, setFormData] = useState<any>(null);

  /* ================= INIT FORM DATA ================= */
  useEffect(() => {
    if (!isOpen || !resumeData || !activeSection) return;

    switch (activeSection) {
      case "PersonalInfo": {
        const parts = resumeData.personalInfo.fullName?.split(" ") || [];
        const pInfo = resumeData.personalInfo;
        
        console.log("=== LOADING PersonalInfo ===");
        console.log("Full personalInfo object:", pInfo);
        console.log("linkedinUrl:", pInfo.linkedinUrl);
        console.log("githubUrl:", pInfo.githubUrl);
        console.log("portifolioUrl:", pInfo.portifolioUrl);
        
        const loadedData = {
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: pInfo.email || "",
          phone: pInfo.phone || "",
          location: pInfo.location || "",
          linkedinUrl: pInfo.linkedinUrl || "",
          githubUrl: pInfo.githubUrl || "",
          portfolioUrl: pInfo.portifolioUrl || "",
        };
        
        console.log("Loaded formData:", loadedData);
        setFormData(loadedData);
        break;
      }

      case "Summary":
        setFormData({ summary: resumeData.professionalSummary || "" });
        break;

      case "Experience":
        setFormData({
          items:
            resumeData.workExperience?.length > 0
              ? resumeData.workExperience
              : [
                  {
                    company: "",
                    role: "",
                    location: "",
                    client: "",
                    years: "",
                    skills: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                    currentlyWorking: false,
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Education":
        setFormData({
          items:
            resumeData.education?.length > 0
              ? resumeData.education
              : [
                  {
                    college: "",
                    degree: "",
                    branch: "",
                    duration: "",
                    grade: "",
                    gradeType: "",
                    achievements: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Internships":
        setFormData({
          items:
            resumeData.internships?.length > 0
              ? resumeData.internships
              : [
                  {
                    company: "",
                    role: "",
                    duration: "",
                    location: "",
                    description: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Projects":
        setFormData({
          items:
            resumeData.projects?.length > 0
              ? resumeData.projects
              : [
                  {
                    title: "",
                    link: "",
                    client: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Skills":
        // Convert categorizedSkills from arrays to comma-separated strings
        console.log("=== LOADING SKILLS ===");
        console.log("Full resumeData:", resumeData);
        console.log("categorizedSkills in resumeData:", resumeData.categorizedSkills);

        // Normalize keys: backend/local data may use snake_case (programming_languages, cloud_platforms, soft_skills)
        const rawSkills = resumeData.categorizedSkills || {};
        const getVal = (obj: any, ...keys: string[]) => {
          for (const k of keys) {
            if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
          }
          return undefined;
        };

        const skillsData = {
          languages: getVal(rawSkills, "languages", "programming_languages", "programmingLanguages", "programming_languages"),
          frameworks: getVal(rawSkills, "frameworks", "frameworks_list"),
          libraries: getVal(rawSkills, "libraries", "library"),
          databases: getVal(rawSkills, "databases", "database"),
          technologies: getVal(rawSkills, "technologies", "tech", "technology"),
          tools: getVal(rawSkills, "tools", "toolset"),
          cloudPlatforms: getVal(rawSkills, "cloudPlatforms", "cloud_platforms", "cloudPlatformsList"),
          softSkills: getVal(rawSkills, "softSkills", "soft_skills", "softSkillsList"),
        } as Record<string, any>;

        console.log("Normalized skills data:", skillsData);

        const convertedSkills = {
          languages: Array.isArray(skillsData.languages) ? skillsData.languages.join(", ") : (skillsData.languages || ""),
          frameworks: Array.isArray(skillsData.frameworks) ? skillsData.frameworks.join(", ") : (skillsData.frameworks || ""),
          libraries: Array.isArray(skillsData.libraries) ? skillsData.libraries.join(", ") : (skillsData.libraries || ""),
          databases: Array.isArray(skillsData.databases) ? skillsData.databases.join(", ") : (skillsData.databases || ""),
          technologies: Array.isArray(skillsData.technologies) ? skillsData.technologies.join(", ") : (skillsData.technologies || ""),
          tools: Array.isArray(skillsData.tools) ? skillsData.tools.join(", ") : (skillsData.tools || ""),
          cloudPlatforms: Array.isArray(skillsData.cloudPlatforms) ? skillsData.cloudPlatforms.join(", ") : (skillsData.cloudPlatforms || ""),
          softSkills: Array.isArray(skillsData.softSkills) ? skillsData.softSkills.join(", ") : (skillsData.softSkills || "")
        };
        // Fallback: if categorized fields are empty but there is a flat `resumeData.skills` array,
        // show those in the Languages field so users see their existing skills in the modal.
        if (
          (!convertedSkills.languages || convertedSkills.languages.trim() === "") &&
          (!convertedSkills.frameworks || convertedSkills.frameworks.trim() === "") &&
          (!convertedSkills.libraries || convertedSkills.libraries.trim() === "") &&
          (!convertedSkills.databases || convertedSkills.databases.trim() === "") &&
          (!convertedSkills.technologies || convertedSkills.technologies.trim() === "") &&
          (!convertedSkills.tools || convertedSkills.tools.trim() === "") &&
          (!convertedSkills.cloudPlatforms || convertedSkills.cloudPlatforms.trim() === "") &&
          (!convertedSkills.softSkills || convertedSkills.softSkills.trim() === "")
        ) {
          const flatSkills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
          if (flatSkills.length > 0) {
            console.log("Using flat resumeData.skills as fallback for Skills modal (auto-categorizing)");
            const auto = autoCategorizeFlatSkills(flatSkills as string[]);
            // Only set fields that are empty
            Object.keys(auto).forEach((k) => {
              const key = k as keyof typeof convertedSkills;
              if (!convertedSkills[key] || convertedSkills[key].trim() === "") convertedSkills[key] = auto[key];
            });
          }
        }
        console.log("Converted skills:", convertedSkills);
        setFormData({
          categorizedSkills: convertedSkills
        });
        break;

      case "Languages":
        // Convert categorizedSkills from arrays to comma-separated strings (normalize keys like in Skills case)
        const rawSkills2 = resumeData.categorizedSkills || {};
        const getVal2 = (obj: any, ...keys: string[]) => {
          for (const k of keys) {
            if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
          }
          return undefined;
        };

        const skillsData2 = {
          languages: getVal2(rawSkills2, "languages", "programming_languages"),
          frameworks: getVal2(rawSkills2, "frameworks", "frameworks_list"),
          libraries: getVal2(rawSkills2, "libraries", "library"),
          databases: getVal2(rawSkills2, "databases", "database"),
          technologies: getVal2(rawSkills2, "technologies", "tech"),
          tools: getVal2(rawSkills2, "tools", "toolset"),
          cloudPlatforms: getVal2(rawSkills2, "cloudPlatforms", "cloud_platforms"),
          softSkills: getVal2(rawSkills2, "softSkills", "soft_skills"),
        } as Record<string, any>;

        const convertedSkills2 = {
          languages: Array.isArray(skillsData2.languages) ? skillsData2.languages.join(", ") : (skillsData2.languages || ""),
          frameworks: Array.isArray(skillsData2.frameworks) ? skillsData2.frameworks.join(", ") : (skillsData2.frameworks || ""),
          libraries: Array.isArray(skillsData2.libraries) ? skillsData2.libraries.join(", ") : (skillsData2.libraries || ""),
          databases: Array.isArray(skillsData2.databases) ? skillsData2.databases.join(", ") : (skillsData2.databases || ""),
          technologies: Array.isArray(skillsData2.technologies) ? skillsData2.technologies.join(", ") : (skillsData2.technologies || ""),
          tools: Array.isArray(skillsData2.tools) ? skillsData2.tools.join(", ") : (skillsData2.tools || ""),
          cloudPlatforms: Array.isArray(skillsData2.cloudPlatforms) ? skillsData2.cloudPlatforms.join(", ") : (skillsData2.cloudPlatforms || ""),
          softSkills: Array.isArray(skillsData2.softSkills) ? skillsData2.softSkills.join(", ") : (skillsData2.softSkills || "")
        };
        // Fallback as above for Languages case
        if (
          (!convertedSkills2.languages || convertedSkills2.languages.trim() === "") &&
          (!convertedSkills2.frameworks || convertedSkills2.frameworks.trim() === "") &&
          (!convertedSkills2.libraries || convertedSkills2.libraries.trim() === "") &&
          (!convertedSkills2.databases || convertedSkills2.databases.trim() === "") &&
          (!convertedSkills2.technologies || convertedSkills2.technologies.trim() === "") &&
          (!convertedSkills2.tools || convertedSkills2.tools.trim() === "") &&
          (!convertedSkills2.cloudPlatforms || convertedSkills2.cloudPlatforms.trim() === "") &&
          (!convertedSkills2.softSkills || convertedSkills2.softSkills.trim() === "")
        ) {
          const flatSkills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
          if (flatSkills.length > 0) {
            console.log("Using flat resumeData.skills as fallback for Languages modal (auto-categorizing)");
            const auto2 = autoCategorizeFlatSkills(flatSkills as string[]);
            Object.keys(auto2).forEach((k) => {
              const key = k as keyof typeof convertedSkills2;
              if (!convertedSkills2[key] || convertedSkills2[key].trim() === "") convertedSkills2[key] = auto2[key];
            });
          }
        }
        // Prepare languages array for LanguagesEditor: prefer explicit `resumeData.languages`,
        // otherwise derive from categorized skills (comma-separated string) or flat `resumeData.skills`.
        const derivedLanguages = (() => {
          if (Array.isArray(resumeData.languages) && resumeData.languages.length > 0) return resumeData.languages;
          if (convertedSkills2.languages && typeof convertedSkills2.languages === 'string' && convertedSkills2.languages.trim() !== "") {
            return convertedSkills2.languages.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          }
          return [];
        })();

        setFormData({
          // Provide both shapes: `languages` (array) for LanguagesEditor and `categorizedSkills` for saving
          languages: derivedLanguages,
          categorizedSkills: convertedSkills2,
        });
        break;

      case "Hobbies":
        setFormData({
          items:
            (resumeData.hobbies?.length ?? 0) > 0
              ? resumeData.hobbies
              : [
                  {
                    name: "",
                    proficiencyLevel: "",
                    achievement: "",
                    description: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Certificates":
        setFormData({ certificates: resumeData.certifications || [] });
        break;

      case "Awards":
        setFormData({
          items:
            (resumeData.awards?.length ?? 0) > 0
              ? resumeData.awards
              : [
                  {
                    title: "",
                    issuedBy: "",
                    year: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Achievements":
        setFormData({
          items:
            (resumeData.achievements?.length ?? 0) > 0
              ? resumeData.achievements
              : [
                  {
                    title: "",
                    date: "",
                    description: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Volunteering":
        setFormData({
          items:
            (resumeData.volunteering?.length ?? 0) > 0
              ? resumeData.volunteering
              : [
                  {
                    organization: "",
                    role: "",
                    startDate: "",
                    endDate: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Interests":
        setFormData({
          items:
            (resumeData.interests?.length ?? 0) > 0
              ? resumeData.interests
              : [
                  {
                    name: "",
                    category: "",
                    description: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "Publications":
        setFormData({
          items:
            (resumeData.publications?.length ?? 0) > 0
              ? resumeData.publications
              : [
                  {
                    title: "",
                    authors: "",
                    publicationName: "",
                    date: "",
                    url: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      case "References":
        setFormData({
          items:
            (resumeData.references?.length ?? 0) > 0
              ? resumeData.references
              : [
                  {
                    name: "",
                    relation: "",
                    contact: "",
                  },
                ],
          activeIndex: 0,
        });
        break;

      default:
        setFormData({});
    }
  }, [isOpen, resumeData, activeSection]);

  if (!isOpen || !formData) return null;

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!resumeData || !activeSection) return;

    const updated: any = { ...resumeData };

    switch (activeSection) {
      case "PersonalInfo":
        console.log("=== SAVING PersonalInfo ===");
        console.log("Current formData:", formData);
        console.log("linkedinUrl from form:", formData.linkedinUrl);
        console.log("githubUrl from form:", formData.githubUrl);
        console.log("portfolioUrl from form:", formData.portfolioUrl);

        const newPersonalInfo = {
          fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
          email: formData.email || "",
          phone: formData.phone || "",
          location: formData.location || "",
          linkedinUrl: formData.linkedinUrl || "",
          githubUrl: formData.githubUrl || "",
          portifolioUrl: formData.portfolioUrl || "",
        };

        console.log("New personalInfo object:", newPersonalInfo);
        updated.personalInfo = newPersonalInfo;
        console.log("Full updated resume data:", updated);
        break;

      case "Summary":
        updated.professionalSummary = formData.summary;
        break;

      case "Experience":
        updated.workExperience = formData.items || [];
        break;

      case "Education":
        updated.education = formData.items || [];
        break;

      case "Internships":
        updated.internships = formData.items || [];
        break;

      case "Projects":
        updated.projects = formData.items || [];
        break;

      case "Skills":
        updated.categorizedSkills = formData.categorizedSkills || {
          languages: "",
          frameworks: "",
          libraries: "",
          databases: "",
          technologies: "",
          tools: "",
          cloudPlatforms: "",
          softSkills: ""
        };
        break;

      case "Languages":
        // Update categorizedSkills.languages
        updated.categorizedSkills = formData.categorizedSkills || {
          languages: "",
          frameworks: "",
          libraries: "",
          databases: "",
          technologies: "",
          tools: "",
          cloudPlatforms: "",
          softSkills: ""
        };
        break;

      case "Hobbies":
        updated.hobbies = formData.items || [];
        break;

      case "Certificates":
        updated.certifications = formData.certificates || [];
        break;

      case "Awards":
        updated.awards = formData.items || [];
        break;

      case "Achievements":
        updated.achievements = formData.items || [];
        break;

      case "Volunteering":
        updated.volunteering = formData.items || [];
        break;

      case "Interests":
        updated.interests = formData.items || [];
        break;

      case "Publications":
        updated.publications = formData.items || [];
        break;

      case "References":
        updated.references = formData.items || [];
        break;
    }

    // Update React state for preview
    setResumeData(updated);

    // Save to backend database (transform frontend format to backend format)
    try {
      const enhancedId = sessionStorage.getItem("enhanced_id");
      if (enhancedId) {
        console.log("💾 Saving changes to backend...");

        // Transform frontend data structure to backend format
        const backendPayload = transformToBackendFormat(updated);

        await updateEnhancedResume(enhancedId, {
          enhanced_sections: backendPayload
        });

        console.log("✅ Successfully saved to backend!");
      }
    } catch (error) {
      console.error("❌ Failed to save to backend:", error);
      // Still close modal - changes are saved in React state for preview
    }

    onClose();
  };

  /* ================= TRANSFORM CATEGORIZED SKILLS ================= */
  const transformCategorizedSkills = (categorizedSkills: Record<string, string | string[]> | undefined): string[] => {
    const skills: string[] = [];

    if (!categorizedSkills || typeof categorizedSkills !== 'object') {
      return skills;
    }

    Object.entries(categorizedSkills).forEach(([, skillsValue]) => {
      if (!skillsValue) return;

      // Handle both string and array formats
      let skillsList: string[] = [];

      if (typeof skillsValue === 'string') {
        skillsList = skillsValue
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      } else if (Array.isArray(skillsValue)) {
        skillsList = skillsValue
          .map(s => String(s).trim())
          .filter(s => s.length > 0);
      }

      skills.push(...skillsList);
    });

    return skills;
  };

  /* ================= AUTO-CATEGORIZE FLAT SKILLS ================= */
  const autoCategorizeFlatSkills = (flatSkills: string[] = []) => {
    const langList = new Set([
      'python','javascript','java','c','c++','c#','css','html','html5','typescript','go','ruby','php','sql','kotlin','swift'
    ]);
    const frameworkList = new Set(['react','django','fastapi','angular','vue','flask','spring','express','next.js','nextjs']);
    const libraryList = new Set(['numpy','pandas','tensorflow','torch','lodash','rxjs','axios']);
    const dbList = new Set(['postgresql','postgres','mongodb','mysql','redis','sqlite','mssql','cassandra']);
    const toolList = new Set(['git','github','gitlab','docker','jenkins','jira','kubernetes','kubectl','ansible']);
    const cloudList = new Set(['aws','azure','gcp','google cloud','google cloud platform','google cloud platform (gcp)']);

    const buckets: Record<string, string[]> = {
      languages: [],
      frameworks: [],
      libraries: [],
      databases: [],
      technologies: [],
      tools: [],
      cloudPlatforms: [],
      softSkills: [],
    };

    flatSkills.forEach((raw) => {
      if (!raw) return;
      const s = String(raw).trim();
      const lower = s.toLowerCase();

      // Exact set matches
      if (langList.has(lower)) {
        buckets.languages.push(s);
        return;
      }
      if (frameworkList.has(lower) || /react|django|fastapi|angular|vue|flask|spring|next/.test(lower)) {
        buckets.frameworks.push(s);
        return;
      }
      if (libraryList.has(lower) || /numpy|pandas|tensorflow|torch|lodash/.test(lower)) {
        buckets.libraries.push(s);
        return;
      }
      if (dbList.has(lower) || /postgres|mongo|mysql|redis|sqlite|cassandra/.test(lower)) {
        buckets.databases.push(s);
        return;
      }
      if (toolList.has(lower) || /docker|jenkins|kubernetes|jira|git(hub|lab)?/.test(lower)) {
        buckets.tools.push(s);
        return;
      }
      if (cloudList.has(lower) || /aws|azure|gcp|google cloud/.test(lower)) {
        buckets.cloudPlatforms.push(s);
        return;
      }

      // Heuristics
      if (/framework|library|api|sdk/.test(lower)) {
        buckets.frameworks.push(s);
        return;
      }
      if (/performance|optimization|scal|security|microservice|microservices|ai|machine learning|ml|data/.test(lower)) {
        buckets.technologies.push(s);
        return;
      }
      if (/communicat|teamwork|leadership|management|problem solving|security best/.test(lower)) {
        buckets.softSkills.push(s);
        return;
      }

      // Default: technologies
      buckets.technologies.push(s);
    });

    // Convert arrays to comma-joined strings (unique)
    const uniq = (arr: string[]) => Array.from(new Set(arr)).join(', ');

    return {
      languages: uniq(buckets.languages),
      frameworks: uniq(buckets.frameworks),
      libraries: uniq(buckets.libraries),
      databases: uniq(buckets.databases),
      technologies: uniq(buckets.technologies),
      tools: uniq(buckets.tools),
      cloudPlatforms: uniq(buckets.cloudPlatforms),
      softSkills: uniq(buckets.softSkills),
    } as Record<string, string>;
  };

  /* ================= TRANSFORM TO BACKEND FORMAT ================= */
  const transformToBackendFormat = (frontendData: Record<string, unknown>) => {
    // Backend expects this structure:
    // {
    //   contact: { name, email, phone, location },
    //   social_links: { linkedIn, github },
    //   summary: "...",
    //   experience: [...],
    //   education: [...],
    //   skills: [...],
    //   ...
    // }

    const personalInfo = frontendData.personalInfo as Record<string, unknown> | undefined;

    return {
      contact: {
        name: (personalInfo?.fullName as string) || "",
        email: (personalInfo?.email as string) || "",
        phone: (personalInfo?.phone as string) || "",
        location: (personalInfo?.location as string) || "",
      },
      social_links: {
        linkedIn: (personalInfo?.linkedinUrl as string) || null,
        github: (personalInfo?.githubUrl as string) || (personalInfo?.portfolioUrl as string) || null,
      },
      summary: (frontendData.professionalSummary as string) || "",
      experience: ((frontendData.workExperience as Array<Record<string, unknown>>) || []).map((exp: Record<string, unknown>) => {
        // Split description into bullet points (split by newlines and filter empty)
        const description = (exp.description as string) || "";
        const key_contributions = description
          .split('\n')
          .map((line: string) => line.trim().replace(/^[•\-*]\s*/, ''))
          .filter((line: string) => line.length > 0);

        // Split skills into array (comma-separated)
        const skillsStr = (exp.skills as string) || "";
        const technologies = skillsStr
          .split(',')
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill.length > 0);

        return {
          company: (exp.company as string) || "",
          role: (exp.role as string) || "",
          duration: `${(exp.startDate as string) || ""} – ${(exp.endDate as string) || ""}`.trim(),
          location: (exp.location as string) || null,
          client: (exp.client as string) || null,
          years: parseFloat((exp.years as string) || "0") || 0,
          technologies,
          key_contributions,
        };
      }),
      education: ((frontendData.education as Array<Record<string, unknown>>) || []).map((edu: Record<string, unknown>) => ({
        degree: (edu.degree as string) || "",
        branch: (edu.branch as string) || "",
        college: (edu.college as string) || "",
        duration: (edu.duration as string) || "",
        grade: (edu.grade as string) || null,
        grade_type: (edu.gradeType as string) || null,
        achievements: (edu.achievements as string) || null,
      })),
      skills: transformCategorizedSkills(frontendData.categorizedSkills as Record<string, string>),
      certifications: ((frontendData.certifications as Array<string | Record<string, unknown>>) || []).map((cert: string | Record<string, unknown>) =>
        typeof cert === 'string' ? cert : ((cert as Record<string, unknown>).name as string) || ""
      ),
      projects: ((frontendData.projects as Array<Record<string, unknown>>) || []).map((proj: Record<string, unknown>) => ({
        title: (proj.title as string) || "",
        client: (proj.client as string) || null,
        key_contributions: proj.description ? [(proj.description as string)] : [],
      })),
      internships: ((frontendData.internships as Array<Record<string, unknown>>) || []).map((intern: Record<string, unknown>) => ({
        company: (intern.company as string) || "",
        role: (intern.role as string) || "",
        duration: (intern.duration as string) || null,
        location: (intern.location as string) || null,
        key_contributions: (intern.description as string)
          ? [(intern.description as string)]
          : [],
      })),
      llm_data: {
        experience: ((frontendData.workExperience as Array<Record<string, unknown>>) || []).map((exp: Record<string, unknown>) => {
          // Split description into bullet points (split by newlines and filter empty)
          const description = (exp.description as string) || "";
          const key_contributions = description
            .split('\n')
            .map((line: string) => line.trim().replace(/^[•\-*]\s*/, ''))
            .filter((line: string) => line.length > 0);

          // Split skills into array (comma-separated)
          const skillsStr = (exp.skills as string) || "";
          const technologies = skillsStr
            .split(',')
            .map((skill: string) => skill.trim())
            .filter((skill: string) => skill.length > 0);

          return {
            company: (exp.company as string) || "",
            role: (exp.role as string) || "",
            duration: `${(exp.startDate as string) || ""} – ${(exp.endDate as string) || ""}`.trim() || null,
            years: parseFloat((exp.years as string) || "0") || 0,
            location: (exp.location as string) || null,
            client: (exp.client as string) || null,
            technologies,
            key_contributions,
            responsibilities: [],
            _keywords_added: []
          };
        }),
        education: ((frontendData.education as Array<Record<string, unknown>>) || []).map((edu: Record<string, unknown>) => ({
          degree: (edu.degree as string) || "",
          branch: (edu.branch as string) || "",
          college: (edu.college as string) || "",
          duration: (edu.duration as string) || null,
          grade: (edu.grade as string) || null,
          grade_type: (edu.gradeType as string) || null,
          achievements: (edu.achievements as string) || null,
          grade_percentage: null
        })),
        additional: {
          languages: ((frontendData.languages as Array<string | Record<string, unknown>>) || []).map((lang: string | Record<string, unknown>) =>
            typeof lang === 'string' ? lang : ((lang as Record<string, unknown>).language as string) || ""
          ),
          hobbies: (frontendData.hobbies as string[]) || [],
          awards: ((frontendData.awards as Array<string | Record<string, unknown>>) || []).map((award: string | Record<string, unknown>) =>
            typeof award === 'string' ? award : ((award as Record<string, unknown>).title as string) || ""
          ),
          references: [],
          interests: (frontendData.hobbies as string[]) || [],
          publications: [],
          volunteering: [],
          categorizedSkills: (frontendData.categorizedSkills as Record<string, string>) || {}
        }
      }
    };
  };

  /* ================= ADD ADDITIONAL ================= */
  const handleAddAdditional = () => {
    if (
      !["Experience", "Education", "Internships", "Projects", "Achievements", "Volunteering", "Hobbies", "Awards", "Interests", "Publications", "References"].includes(
        activeSection!
      )
    )
      return;

    const items = formData.items || [];
    const activeIndex = formData.activeIndex ?? 0;

    if (activeIndex < items.length - 1) {
      setFormData({ ...formData, activeIndex: activeIndex + 1 });
      return;
    }

    let blank: any;

    if (activeSection === "Education") {
      blank = {
        school: "",
        degree: "",
        location: "",
        startDate: "",
        endDate: "",
        achievements: "",
      };
    } else if (activeSection === "Internships") {
      blank = {
        role: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      };
    } else if (activeSection === "Projects") {
      blank = {
        title: "",
        link: "",
        startDate: "",
        endDate: "",
        description: "",
        technologies: [],
      };
    } else if (activeSection === "Achievements") {
      blank = {
        title: "",
        date: "",
        description: "",
      };
    } else if (activeSection === "Volunteering") {
      blank = {
        organization: "",
        role: "",
        startDate: "",
        endDate: "",
      };
    } else if (activeSection === "Hobbies") {
      blank = {
        name: "",
        proficiencyLevel: "",
        achievement: "",
        description: "",
      };
    } else if (activeSection === "Awards") {
      blank = {
        title: "",
        issuedBy: "",
        year: "",
      };
    } else if (activeSection === "Interests") {
      blank = {
        name: "",
        category: "",
        description: "",
      };
    } else if (activeSection === "Publications") {
      blank = {
        title: "",
        authors: "",
        publicationName: "",
        date: "",
        url: "",
      };
    } else if (activeSection === "References") {
      blank = {
        name: "",
        relation: "",
        contact: "",
      };
    } else {
      blank = {
        role: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        currentlyWorking: false,
      };
    }

    setFormData({
      ...formData,
      items: [...items, blank],
      activeIndex: items.length,
    });
  };

  /* ================= RENDER EDITOR ================= */
  const renderEditor = () => {
    switch (activeSection) {
      case "PersonalInfo":
        return <PersonalInfoEditor formData={formData} setFormData={setFormData} />;
      case "Summary":
        return (
          <SummaryEditor
            formData={formData}
            setFormData={setFormData}
            summaryVariants={(resumeData as any)?.summaryVariants}
          />
        );
      case "Experience":
        return <ExperienceEditor formData={formData} setFormData={setFormData} />;
      case "Education":
        return <EducationEditor formData={formData} setFormData={setFormData} />;
      case "Internships":
        return <InternshipsEditor formData={formData} setFormData={setFormData} />;
      case "Projects":
        return <ProjectsEditor formData={formData} setFormData={setFormData} />;
      case "Skills":
        return <SkillsEditor formData={formData} setFormData={setFormData} />;
      case "Languages":
        return <LanguagesEditor formData={formData} setFormData={setFormData} />;
      case "Hobbies":
        return <HobbiesEditor formData={formData} setFormData={setFormData} />;
      case "Certificates":
        return <CertificatesEditor formData={formData} setFormData={setFormData} />;
      case "Awards":
        return <AwardsEditor formData={formData} setFormData={setFormData} />;
      case "Achievements":
        return <AchievementsEditor formData={formData} setFormData={setFormData} />;
      case "Volunteering":
        return <VolunteeringEditor formData={formData} setFormData={setFormData} />;
      case "Interests":
        return <InterestsEditor formData={formData} setFormData={setFormData} />;
      case "Publications":
        return <PublicationsEditor formData={formData} setFormData={setFormData} />;
      case "References":
        return <ReferencesEditor formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  /* ================= MODAL ================= */
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* HEADER */}
          <div className="flex justify-between items-center px-10 py-6 border-b flex-shrink-0">
            <h2 className="text-xl font-bold">{activeSection}</h2>
            <X className="cursor-pointer text-gray-500" onClick={onClose} />
          </div>

          {/* BODY - Scrollable */}
          <div className="px-10 py-8 overflow-y-auto flex-1">
            {renderEditor()}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-10 py-6 border-t bg-gray-50 rounded-b-3xl flex-shrink-0">
            <div>
              {(activeSection === "Experience" ||
                activeSection === "Education" ||
                activeSection === "Internships" ||
                activeSection === "Projects" ||
                activeSection === "Achievements" ||
                activeSection === "Volunteering" ||
                activeSection === "Hobbies" ||
                activeSection === "Awards" ||
                activeSection === "Interests" ||
                activeSection === "Publications" ||
                activeSection === "References") && (
                <button
                  onClick={handleAddAdditional}
                  className="px-4 py-2 rounded-full border text-sm hover:bg-white transition-colors"
                >
                  ＋ Add Additional
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-blue-700 text-white text-sm hover:bg-blue-800 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionEditorModal;