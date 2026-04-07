"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useResume } from "./ResumeContext";

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
  onSave?: (didChange: boolean, section: string, changedFieldNames: string[], changedFieldValues?: Record<string, string>) => void;
};

/** Returns "idx.fieldName" keys for fields that changed (any edit, not just empty→filled) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAddedFieldKeys(oldItems: any[], newItems: any[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < newItems.length; i++) {
    const old = i < oldItems.length ? (oldItems[i] || {}) : {};
    const next = newItems[i] || {};
    for (const key of Object.keys(next)) {
      if (String(old[key] || '') !== String(next[key] || '') && next[key]) keys.push(`${i}.${key}`);
    }
  }
  return keys;
}

const SectionEditorModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { resumeData, setResumeData, activeSection, addAddedFields } = useResume();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(null);

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
            (resumeData.internships?.length ?? 0) > 0
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    duration: "",
                    description: "",
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = { ...resumeData };
    let didChange = false;
    let changedFieldNames: string[] = [];
    let changedFieldValues: Record<string, string> = {};
    // Helper to extract plain field names from "idx.field" keys
    const plainFields = (keys: string[]) => keys.map(k => k.includes('.') ? k.split('.').slice(1).join('.') : k);

    switch (activeSection) {
      case "PersonalInfo": {
        const orig = resumeData.personalInfo || {};
        const newPersonalInfo = {
          fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
          email: formData.email || "",
          phone: formData.phone || "",
          location: formData.location || "",
          linkedinUrl: formData.linkedinUrl || "",
          githubUrl: formData.githubUrl || "",
          portifolioUrl: formData.portfolioUrl || "",
        };

        // Detect fields that changed (added or cleared)
        const newlyAdded: string[] = [];
        const cleared: string[] = [];
        const contactFields = ["email", "phone", "location", "linkedinUrl", "githubUrl", "portifolioUrl"] as const;
        for (const f of contactFields) {
          const oldVal = (orig as unknown as Record<string, string>)[f] || "";
          const newVal = (newPersonalInfo as Record<string, string>)[f] || "";
          if (!oldVal && newVal) newlyAdded.push(f);
          else if (oldVal && !newVal) cleared.push(f);
        }
        const allChanged = [...newlyAdded, ...cleared];
        if (allChanged.length) {
          if (newlyAdded.length) addAddedFields("PersonalInfo", newlyAdded);
          didChange = true;
          changedFieldNames = allChanged;
          // Capture actual values (empty string for cleared fields)
          changedFieldValues = Object.fromEntries(
            allChanged.map(f => [f, (newPersonalInfo as Record<string, string>)[f] || ''])
          );
        }

        updated.personalInfo = newPersonalInfo;
        break;
      }

      case "Summary": {
        const oldSummary = resumeData.professionalSummary || "";
        updated.professionalSummary = formData.summary;
        if (!oldSummary && formData.summary) { addAddedFields("Summary", ["0.text"]); didChange = true; changedFieldNames = ["summary"]; }
        break;
      }

      case "Experience": {
        const keys = getAddedFieldKeys(resumeData.workExperience || [], formData.items || []);
        updated.workExperience = formData.items || [];
        if (keys.length) { addAddedFields("Experience", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Education": {
        const keys = getAddedFieldKeys(resumeData.education || [], formData.items || []);
        updated.education = formData.items || [];
        if (keys.length) {
          addAddedFields("Education", keys);
          didChange = true;
          changedFieldNames = plainFields(keys);
          // Extract actual new values so applyFix can send them to the backend
          keys.forEach(key => {
            const [idxStr, ...fieldParts] = key.split('.');
            const idx = parseInt(idxStr, 10);
            const fieldName = fieldParts.join('.');
            const item = (formData.items?.[idx] || {}) as Record<string, unknown>;
            const val = item[fieldName];
            if (val != null && String(val).trim()) changedFieldValues[fieldName] = String(val);
          });
        }
        break;
      }

      case "Internships": {
        const keys = getAddedFieldKeys(resumeData.internships || [], formData.items || []);
        updated.internships = formData.items || [];
        if (keys.length) { addAddedFields("Internships", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Projects": {
        const keys = getAddedFieldKeys(resumeData.projects || [], formData.items || []);
        updated.projects = formData.items || [];
        if (keys.length) {
          addAddedFields("Projects", keys);
          didChange = true;
          changedFieldNames = plainFields(keys);
          // Extract values for applyFix (contributions are arrays → join as text)
          keys.forEach(key => {
            const [idxStr, ...fieldParts] = key.split('.');
            const idx = parseInt(idxStr, 10);
            const fieldName = fieldParts.join('.');
            const item = (formData.items?.[idx] || {}) as Record<string, unknown>;
            const val = item[fieldName];
            if (val != null) {
              changedFieldValues[fieldName] = Array.isArray(val)
                ? (val as string[]).filter(Boolean).join('; ')
                : String(val).trim();
            }
          });
        }
        break;
      }

      case "Skills": {
        const oldSkills = JSON.stringify(resumeData.categorizedSkills || {});
        const newSkillsData = formData.categorizedSkills || { languages: "", frameworks: "", libraries: "", databases: "", technologies: "", tools: "", cloudPlatforms: "", softSkills: "" };
        updated.categorizedSkills = newSkillsData;
        if (JSON.stringify(newSkillsData).length > oldSkills.length) {
          addAddedFields("Skills", ["0.skills"]);
          didChange = true;
          changedFieldNames = ["skills"];
          // Extract soft skills value for applyFix
          const softSkills = typeof newSkillsData.softSkills === 'string'
            ? newSkillsData.softSkills
            : Array.isArray(newSkillsData.softSkills)
              ? (newSkillsData.softSkills as string[]).join(', ')
              : '';
          if (softSkills.trim()) changedFieldValues = { skills: softSkills.trim() };
        }
        break;
      }

      case "Languages": {
        const keys = getAddedFieldKeys(resumeData.languages || [], formData.languages || []);
        updated.languages = formData.languages || [];
        if (formData.categorizedSkills) updated.categorizedSkills = formData.categorizedSkills;
        if (keys.length) {
          addAddedFields("Languages", keys);
          didChange = true;
          changedFieldNames = plainFields(keys);
          // Extract proficiency values so applyFix can send them to the backend
          keys.forEach(key => {
            const [idxStr, ...fieldParts] = key.split('.');
            const idx = parseInt(idxStr, 10);
            const fieldName = fieldParts.join('.');
            const item = (formData.languages?.[idx] || {}) as Record<string, unknown>;
            const val = item[fieldName];
            if (val != null && String(val).trim()) changedFieldValues[fieldName] = String(val);
          });
        }
        break;
      }

      case "Hobbies": {
        const keys = getAddedFieldKeys(resumeData.hobbies || [], formData.items || []);
        updated.hobbies = formData.items || [];
        if (keys.length) { addAddedFields("Hobbies", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Certificates": {
        const keys = getAddedFieldKeys(resumeData.certifications || [], formData.certificates || []);
        updated.certifications = formData.certificates || [];
        if (keys.length) { addAddedFields("Certificates", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Awards": {
        const keys = getAddedFieldKeys(resumeData.awards || [], formData.items || []);
        updated.awards = formData.items || [];
        if (keys.length) { addAddedFields("Awards", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Achievements": {
        const keys = getAddedFieldKeys(resumeData.achievements || [], formData.items || []);
        updated.achievements = formData.items || [];
        if (keys.length) { addAddedFields("Achievements", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Volunteering": {
        const keys = getAddedFieldKeys(resumeData.volunteering || [], formData.items || []);
        updated.volunteering = formData.items || [];
        if (keys.length) { addAddedFields("Volunteering", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Interests": {
        const keys = getAddedFieldKeys(resumeData.interests || [], formData.items || []);
        updated.interests = formData.items || [];
        if (keys.length) { addAddedFields("Interests", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "Publications": {
        const keys = getAddedFieldKeys(resumeData.publications || [], formData.items || []);
        updated.publications = formData.items || [];
        if (keys.length) { addAddedFields("Publications", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }

      case "References": {
        const keys = getAddedFieldKeys(resumeData.references || [], formData.items || []);
        updated.references = formData.items || [];
        if (keys.length) { addAddedFields("References", keys); didChange = true; changedFieldNames = plainFields(keys); }
        break;
      }
    }

    // Update React state for preview
    // Note: no backend save endpoint exists for partial edits.
    // Score refresh is handled via applyFix in the builder after this modal closes.
    setResumeData(updated);

    onSave?.(didChange, activeSection || '', changedFieldNames, changedFieldValues);
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
      languages: ((frontendData.languages as Array<string | Record<string, unknown>>) || []).map((lang: string | Record<string, unknown>) => {
        if (typeof lang === 'string') return lang;
        const language = (lang as Record<string, unknown>).language as string || "";
        const proficiency = (lang as Record<string, unknown>).proficiency as string || "";
        return proficiency ? `${language} - ${proficiency}` : language;
      }),
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
      publications: ((frontendData.publications as Array<string | Record<string, unknown>>) || []).map((pub: string | Record<string, unknown>) => {
        if (typeof pub === 'string') return pub;

        // Send as object with all fields for backend PDF generation
        return {
          title: ((pub as Record<string, unknown>).title as string) || "",
          authors: ((pub as Record<string, unknown>).authors as string) || "",
          publication_name: ((pub as Record<string, unknown>).publicationName as string) || "",
          date: ((pub as Record<string, unknown>).date as string) || "",
          url: ((pub as Record<string, unknown>).url as string) || "",
        };
      }),
      interests: (frontendData.interests as string[]) || [],
      hobbies: (frontendData.hobbies as string[]) || [],
      awards: ((frontendData.awards as Array<string | Record<string, unknown>>) || []).map((award: string | Record<string, unknown>) => {
        if (typeof award === 'string') return award;

        const title = ((award as Record<string, unknown>).title as string) || "";
        const issuedBy = ((award as Record<string, unknown>).issuedBy as string) || "";
        const year = ((award as Record<string, unknown>).year as string) || "";

        // Combine: "Title - Organization (Year)" or "Title (Year)" or just "Title"
        let result = title;
        if (issuedBy && year) {
          result = `${title} - ${issuedBy} (${year})`;
        } else if (year) {
          result = `${title} (${year})`;
        } else if (issuedBy) {
          result = `${title} - ${issuedBy}`;
        }

        return result;
      }),
      volunteering: ((frontendData.volunteering as Array<string | Record<string, unknown>>) || []).map((vol: string | Record<string, unknown>) => {
        if (typeof vol === 'string') return vol;

        // Send as object with all fields for backend PDF generation
        return {
          role: ((vol as Record<string, unknown>).role as string) || "",
          organization: ((vol as Record<string, unknown>).organization as string) || "",
          duration: ((vol as Record<string, unknown>).duration as string) || "",
          description: ((vol as Record<string, unknown>).description as string) || "",
        };
      }),
      references: ((frontendData.references as Array<string | Record<string, unknown>>) || []).map((ref: string | Record<string, unknown>) => {
        if (typeof ref === 'string') return ref;

        // Send as object with all fields for backend PDF generation
        return {
          name: ((ref as Record<string, unknown>).name as string) || "",
          relation: ((ref as Record<string, unknown>).relation as string) || "",
          contact: ((ref as Record<string, unknown>).contact as string) || "",
        };
      }),
      achievements: (frontendData.achievements as string[]) || [],
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
          languages: ((frontendData.languages as Array<string | Record<string, unknown>>) || []).map((lang: string | Record<string, unknown>) => {
            if (typeof lang === 'string') return lang;
            const language = (lang as Record<string, unknown>).language as string || "";
            const proficiency = (lang as Record<string, unknown>).proficiency as string || "";
            return proficiency ? `${language} - ${proficiency}` : language;
          }),
          hobbies: (frontendData.hobbies as string[]) || [],
          awards: ((frontendData.awards as Array<string | Record<string, unknown>>) || []).map((award: string | Record<string, unknown>) => {
            if (typeof award === 'string') return award;

            const title = ((award as Record<string, unknown>).title as string) || "";
            const issuedBy = ((award as Record<string, unknown>).issuedBy as string) || "";
            const year = ((award as Record<string, unknown>).year as string) || "";

            // Combine: "Title - Organization (Year)" or "Title (Year)" or just "Title"
            let result = title;
            if (issuedBy && year) {
              result = `${title} - ${issuedBy} (${year})`;
            } else if (year) {
              result = `${title} (${year})`;
            } else if (issuedBy) {
              result = `${title} - ${issuedBy}`;
            }

            return result;
          }),
          references: ((frontendData.references as Array<string | Record<string, unknown>>) || []).map((ref: string | Record<string, unknown>) => {
            if (typeof ref === 'string') return ref;

            // Send as object with all fields
            return {
              name: ((ref as Record<string, unknown>).name as string) || "",
              relation: ((ref as Record<string, unknown>).relation as string) || "",
              contact: ((ref as Record<string, unknown>).contact as string) || "",
            };
          }),
          interests: (frontendData.hobbies as string[]) || [],
          publications: ((frontendData.publications as Array<string | Record<string, unknown>>) || []).map((pub: string | Record<string, unknown>) => {
            if (typeof pub === 'string') return pub;

            // Send as object with all fields
            return {
              title: ((pub as Record<string, unknown>).title as string) || "",
              authors: ((pub as Record<string, unknown>).authors as string) || "",
              publication_name: ((pub as Record<string, unknown>).publicationName as string) || "",
              date: ((pub as Record<string, unknown>).date as string) || "",
              url: ((pub as Record<string, unknown>).url as string) || "",
            };
          }),
          volunteering: ((frontendData.volunteering as Array<string | Record<string, unknown>>) || []).map((vol: string | Record<string, unknown>) => {
            if (typeof vol === 'string') return vol;

            // Send as object with all fields
            return {
              role: ((vol as Record<string, unknown>).role as string) || "",
              organization: ((vol as Record<string, unknown>).organization as string) || "",
              duration: ((vol as Record<string, unknown>).duration as string) || "",
              description: ((vol as Record<string, unknown>).description as string) || "",
            };
          }),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blank: any;

    if (activeSection === "Education") {
      blank = {
        college: "",
        degree: "",
        branch: "",
        duration: "",
        grade: "",
        gradeType: "",
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* HEADER */}
          <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-[#f0f5ff] to-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2557a7] flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{activeSection?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeSection?.replace(/([A-Z])/g, ' $1').trim()}
                </h2>
                <p className="text-xs text-gray-500">Edit your resume section</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div className="px-8 py-7 overflow-y-auto flex-1 bg-white">
            {renderEditor()}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl flex-shrink-0">
            <div className="flex items-center gap-3">
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
                <>
                  <button
                    onClick={handleAddAdditional}
                    className="px-4 py-2 rounded-xl border border-[#2557a7]/30 text-[#2557a7] text-sm font-medium hover:bg-[#e8eff9] transition-colors"
                  >
                    + Add Additional
                  </button>
                  {formData?.items?.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <button
                        onClick={() => setFormData({ ...formData, activeIndex: Math.max(0, (formData.activeIndex ?? 0) - 1) })}
                        disabled={(formData.activeIndex ?? 0) === 0}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        ‹
                      </button>
                      <span className="text-xs font-medium text-gray-600">{(formData.activeIndex ?? 0) + 1} / {formData.items.length}</span>
                      <button
                        onClick={() => setFormData({ ...formData, activeIndex: Math.min(formData.items.length - 1, (formData.activeIndex ?? 0) + 1) })}
                        disabled={(formData.activeIndex ?? 0) === formData.items.length - 1}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => {
                          const idx = formData.activeIndex ?? 0;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const nextItems = formData.items.filter((_: any, i: number) => i !== idx);
                          setFormData({ ...formData, items: nextItems, activeIndex: Math.min(idx, nextItems.length - 1) });
                        }}
                        className="ml-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-[#2557a7] hover:bg-[#1a4a8f] text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
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