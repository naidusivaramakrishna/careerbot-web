"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { getResumeById } from "@/api/resumeApi";
import { httpClient } from "@/lib/http";
import { getEnhancedResume, applyFix } from "@/api/enhancerApi";
import type { ATSScore, EnhancedSuggestion } from "@/types/api.types";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";
import { detectCareerLevel } from "@/utils/careerLevelDetection";
import { toast } from "sonner";
import { countryCodes } from "../_utils/sectionsConfig";
import { getSectionOrder } from "../../../templates/_utils/sectionOrder";
import logger from "@/lib/logger";

// Extract country code from a combined phone string like "+911234567890"
function splitPhone(phone: string): { countryCode: string; phoneNumber: string } {
  if (!phone || !phone.startsWith("+")) return { countryCode: "+91", phoneNumber: phone };
  // Sort by code length descending so longer codes match first (e.g., "+1-647" before "+1")
  const sorted = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (phone.startsWith(cc.code)) {
      return { countryCode: cc.code, phoneNumber: phone.slice(cc.code.length) };
    }
  }
  return { countryCode: "+91", phoneNumber: phone };
}

export interface CustomCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface CategorizedSkills {
  programming_languages: string[];
  frameworks: string[];
  soft_skills: string[];
  project_management: string[];
  marketing_sales: string[];
  custom_categories?: CustomCategory[];
  hidden_predefined_categories?: string[];
  // Maps "CategoryKey:SkillName" → backend skill ID for delete calls
  skill_id_map?: Record<string, string>;
}

type BackendSkillItem = { id?: string; name?: string };
type BackendSkills = Record<string, BackendSkillItem[]>;

const EMPTY_CATEGORIZED_SKILLS: CategorizedSkills = {
  programming_languages: [],
  frameworks: [],
  soft_skills: [],
  project_management: [],
  marketing_sales: [],
};

export function mapBackendSkillsToCategorized(backendSkills: unknown): CategorizedSkills {
  if (!backendSkills || typeof backendSkills !== 'object' || Array.isArray(backendSkills)) {
    return { ...EMPTY_CATEGORIZED_SKILLS };
  }
  const s = backendSkills as BackendSkills;
  const extractNames = (arr?: BackendSkillItem[]) =>
    (arr || []).map(i => i.name ?? '').filter(Boolean);

  const idMap: Record<string, string> = {};
  const buildIdMap = (key: string, arr?: BackendSkillItem[]) => {
    (arr || []).forEach(i => { if (i.id && i.name) idMap[`${key}:${i.name}`] = i.id; });
  };

  buildIdMap('programming_languages', s.programmingLanguages);
  buildIdMap('frameworks', s.frameworks);
  buildIdMap('soft_skills', s.softSkills);
  buildIdMap('project_management', s.projectManagement);
  buildIdMap('marketing_sales', s.marketingSales);

  // For custom/unknown category keys, populate skill_id_map using both the raw
  // camelCase key AND a display-name form so Skills.tsx lookup always finds the ID.
  const PREDEFINED = new Set(['programmingLanguages', 'frameworks', 'softSkills', 'projectManagement', 'marketingSales']);
  const customCategories: CustomCategory[] = [];

  // Convert camelCase or snake_case key to "Human Readable Name"
  const toDisplayName = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .replace(/^./, c => c.toUpperCase())
      .trim();

  const addCustomCategory = (key: string, items: BackendSkillItem[]) => {
    const displayName = toDisplayName(key);
    buildIdMap(key, items);
    buildIdMap(displayName, items);
    customCategories.push({
      id: `custom_backend_${key}`,
      name: displayName,
      skills: extractNames(items),
    });
  };

  Object.entries(s).forEach(([camelKey, items]) => {
    if (PREDEFINED.has(camelKey)) return;
    // Nested container: customSkills: { "dev_ops_tools": [{id, name}] }
    if (!Array.isArray(items) && typeof items === 'object' && items !== null) {
      Object.entries(items as Record<string, BackendSkillItem[]>).forEach(([subKey, subItems]) => {
        if (Array.isArray(subItems)) addCustomCategory(subKey, subItems);
      });
      return;
    }
    if (!Array.isArray(items)) return;
    addCustomCategory(camelKey, items as BackendSkillItem[]);
  });

  return {
    programming_languages: extractNames(s.programmingLanguages),
    frameworks: extractNames(s.frameworks),
    soft_skills: extractNames(s.softSkills),
    project_management: extractNames(s.projectManagement),
    marketing_sales: extractNames(s.marketingSales),
    ...(customCategories.length > 0 && { custom_categories: customCategories }),
    skill_id_map: idMap,
  };
}

export interface CustomField {
  id: string;
  fieldName: string;
  fieldType: "text" | "textarea" | "date" | "url" | "list";
  value: string | string[];
}

export interface CustomSection {
  id: string;
  sectionName: string;
  fields: CustomField[];
}

// Resume data structure
export interface ResumeData {
  resume_id?: string;
  personalInfo: {
    fullname: string;
    email: string;
    countryCode: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    dateOfBirth?: string;
    nationality?: string;
    category?: string;
    languages?: string;
    titlePrefix?: string;
    qualifications?: string;
    // Government Standard — India-specific
    fathersName?: string;
    maritalStatus?: string;
    gender?: string;
    permanentAddress?: string;
    // Healthcare
    specialisation?: string;
    medicalRegNo?: string;
    // Legal
    barEnrollmentNo?: string;
    yearOfEnrollment?: string;
    courtsOfPractise?: string;
    // Marine
    rank?: string;
    cocNumber?: string;
    stcwCertificates?: string;
    vesselTypes?: string;
    // Research Scholar
    orcidId?: string;
    googleScholarUrl?: string;
    hIndex?: string;
  };
  professionalSummary: {
    summary: string;
    targetRole: string;
  };
  education: {
    id?: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    scoreType?: "CGPA" | "Marks" | "GPA" | "Percentage";
    scoreValue?: string;
  }[];
  workExperience: {
    id?: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    location: string;
    technologies: string[];
  }[];
  projects: {
    id?: string;
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    link: string;
  }[];
  skills: string[];
  categorizedSkills?: CategorizedSkills;
  certifications: {
    id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
  achievements: {
    id?: string;
    title: string;
    date: string;
    description: string;
  }[];
  volunteering: {
    id?: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
  }[];
  references: {
    id?: string;
    name: string;
    relation: string;
    contact: string;
  }[];
  internships: {
    id?: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    location: string;
    technologies: string[];
  }[];
  awards: {
    id?: string;
    title: string;
    issuedBy: string;
    year: string;
  }[];
  hobbies: {
    id?: string;
    name: string;
    description: string;
    proficiencyLevel?: string;
    achievement?: string;
  }[];
  interests: {
    id?: string;
    name: string;
    description: string;
    category?: string;
  }[];
  languages: {
    id?: string;
    language: string;
    proficiency: string;
  }[];
  publications: {
    id?: string;
    title: string;
    authors: string;
    publicationName: string;
    date: string;
    url: string;
    doi?: string;
  }[];
  patents?: {
    id?: string;
    title: string;
    patentNumber: string;
    status: string;
    date: string;
    description?: string;
  }[];
  declaration?: string;
  declarationDate?: string;
  declarationPlace?: string;
  customSections?: CustomSection[];
}

// Style settings
export interface ResumeStyle {
  fontFamily: string;
  nameFontSize: string;
  headingFontSize: string;
  bodyFontSize: string;
  bold: boolean;
  italic: boolean;
  lineSpacing: string;
  headingColor: string;
  bodyColor: string;
  sectionHeaderBg?: string;
  accentColor?: string;
}

export type EnhancedAtsScore = ATSScore | null;

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  selectedTemplate: string | number | null;
  setSelectedTemplate: (id: string | number | null) => void;
  resumeStyle: ResumeStyle;
  setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
  lastUpdated: Date | null;
  resumeId: string | null;
  resumeSource: string | null;
  enhancedAtsScore: EnhancedAtsScore;
  enhancedSuggestions: EnhancedSuggestion[];
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  previewCatalogueKey: string | null;
  setPreviewCatalogueKey: React.Dispatch<React.SetStateAction<string | null>>;
  createResume: () => Promise<void>;
  completionStatus: Record<string, boolean>;
  setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  getCompletionPercentage: () => number;
  isLoadingResume: boolean;
  addCustomSection: (section: CustomSection) => void;
  removeCustomSection: (id: string) => void;
  addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
  updateCustomFieldValue: (sectionId: string, fieldId: string, value: string | string[]) => void;
  deleteCustomField: (sectionId: string, fieldId: string) => void;
  applyAutoFix: (suggestionId: string) => Promise<void>;
  applyManualFix: (suggestionId: string, value: string) => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);


interface ResumeProviderProps {
  children: ReactNode;
  resumeId?: string;
  source?: string;
}

export const ResumeProvider = ({ children, resumeId: resumeIdProp, source }: ResumeProviderProps) => {
  const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail');
      const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
      const saved = localStorage.getItem(key);
      return saved || "2";
    }
    return "2";
  });

  const [enhancedAtsScore, setEnhancedAtsScore] = useState<EnhancedAtsScore>(null);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<EnhancedSuggestion[]>([]);
  // Guards against out-of-order apply-fix responses: each call bumps this ref;
  // a response whose id no longer matches the latest is dropped, so a slower,
  // older fix can't stomp the resume state written by a newer one.
  const latestFixRequestRef = useRef(0);

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    // ✅ If resumeId is provided, don't use localStorage (we'll load from backend)
    if (resumeIdProp && resumeIdProp !== 'null' && resumeIdProp !== 'undefined') {
      console.log("🔄 Resume ID provided, will load from backend:", resumeIdProp);
      return getEmptyResumeData(); // Return empty data, will be loaded from backend
    }

    // ✅ Only use localStorage for new resumes (no resumeId)
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('resumeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log("📥 Loaded resume data from localStorage");
          return parsed;
        } catch (error) {
          console.warn("⚠️ Failed to parse localStorage data");
        }
      }
    }

    return getEmptyResumeData();
  });

  // Helper function to return empty resume data
  function getEmptyResumeData(): ResumeData {
    return {
      personalInfo: {
        fullname: "",
        email: "",
        countryCode: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        githubUrl: "",
        portfolioUrl: "",
        dateOfBirth: "",
        nationality: "",
        category: "",
        languages: "",
        titlePrefix: "",
        qualifications: ""
      },
      professionalSummary: {
        summary: "",
        targetRole: ""
      },
      education: [],
      workExperience: [],
      projects: [],
      skills: [],
      categorizedSkills: {
        programming_languages: [],
        frameworks: [],
        soft_skills: [],
        project_management: [],
        marketing_sales: [],
      },
      certifications: [],
      achievements: [],
      volunteering: [],
      references: [],
      internships: [],
      awards: [],
      hobbies: [],
      interests: [],
      languages: [],
      publications: [],
      patents: [],
      declaration: "",
      declarationDate: "",
      declarationPlace: "",
      customSections: [],
    };
  }

  // Reads user-saved font prefs from localStorage and applies them on top of current style.
  // Called after template/catalogue defaults so the user's choice always wins.
  const _reapplySavedFontPrefs = (setter: React.Dispatch<React.SetStateAction<ResumeStyle>>) => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!stored) return;
      const saved = JSON.parse(stored) as Partial<ResumeStyle>;
      const overrides: Partial<ResumeStyle> = {};
      if (saved.fontFamily) overrides.fontFamily = saved.fontFamily;
      if (saved.lineSpacing) overrides.lineSpacing = saved.lineSpacing;
      if (Object.keys(overrides).length > 0) {
        setter(prev => ({ ...prev, ...overrides }));
      }
    } catch { /* ignore */ }
  };

  const DEFAULT_RESUME_STYLE: ResumeStyle = {
    fontFamily: "arial",
    nameFontSize: "20px",
    headingFontSize: "14px",
    bodyFontSize: "10px",
    bold: false,
    italic: false,
    lineSpacing: "1.0",
    headingColor: "#1A1A1A",
    bodyColor: "#4b5563",
  };

  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>(() => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) return { ...DEFAULT_RESUME_STYLE, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULT_RESUME_STYLE;
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  // ✅ NEW: Track if initial load is complete
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
    "Personal Info": false,
    "Professional Summary": false,
    "Skills": false,
    "Education": false,
    "Work Experience": false,
    "Projects": false,
    "Certifications": false,
    "Achievements": false,
    "Volunteering": false,
    "Internships": false,
    "Awards": false,
    "Hobbies": false,
    "Interests": false,
    "Languages": false,
    "Publications": false,
    "References": false,
  });

  // ✅ Get career level from localStorage to set initial section order
  const getCareerLevelFromStorage = (): string | undefined => {
    try {
      if (typeof window === 'undefined') return undefined;
      const userEmail = localStorage.getItem('userEmail');
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';

      const careerLevelStorage = localStorage.getItem(careerLevelKey);
      const appliedTemplateId = localStorage.getItem(selectedTemplateKey);

      console.warn("🔍 Getting career level - email:", userEmail, "templateId:", appliedTemplateId);
      console.warn("🔍 careerLevelStorage:", careerLevelStorage);

      if (careerLevelStorage && appliedTemplateId) {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{ id: string; name: string }>;
        const applied = careerLevels.find((t) => String(t.id) === String(appliedTemplateId));
        console.warn("🔍 Applied template found:", applied);
        if (applied?.name) {
          const templateName = applied.name.toLowerCase().trim();
          // Extract career level from template name like "Core Engineering - Fresher"
          let extractedLevel: string | undefined;

          // Use shared utility for consistent career level detection
          const detected = detectCareerLevel(templateName);
          if (detected) {
            extractedLevel = detected.toLowerCase();
          } else if (templateName.includes('early') && templateName.includes('career')) {
            extractedLevel = 'early career';
          } else if (templateName.includes('fresher')) {
            extractedLevel = 'fresher';
          } else if (templateName.includes('mid')) {
            extractedLevel = 'mid-level';
          }

          console.warn("🔍 Extracted career level:", extractedLevel, "from template name:", applied.name);
          return extractedLevel;
        }
      }
    } catch (err) {
      console.warn("🔍 Error in getCareerLevelFromStorage:", err);
    }
    console.warn("🔍 No career level found, returning undefined");
    return undefined;
  };

  const [previewCatalogueKey, setPreviewCatalogueKey] = useState<string | null>(null);

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      // Try to load sectionOrder directly from localStorage first (set by DomainTemplatesModal)
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(sectionOrderKey) : null;

      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        console.warn("🎯 Loaded sectionOrder from localStorage:", parsed);
        return parsed;
      }
    } catch (err) {
      console.warn("🎯 Error loading sectionOrder from localStorage:", err);
    }

    // Fallback: compute from career level
    const careerLevel = getCareerLevelFromStorage();
    const order = getSectionOrder(careerLevel);
    return order;
  });

  // Persist resumeStyle to localStorage so font/spacing survive page refresh
  useEffect(() => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      localStorage.setItem(key, JSON.stringify(resumeStyle));
    } catch { /* ignore */ }
  }, [resumeStyle]);

  // ✅ Update section order when career level changes or template is switched
  useEffect(() => {
    // If user has a saved order in localStorage (e.g. after deleting a section), respect it
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(sectionOrderKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setSectionOrder(parsed);
        return;
      }
    } catch { /* ignore */ }
    // No saved order — compute from career level (first visit or after clearing storage)
    const careerLevel = getCareerLevelFromStorage();
    const newOrder = getSectionOrder(careerLevel);
    setSectionOrder(newOrder);
  }, [resumeIdProp, selectedTemplate]); // Re-check when resumeId or selectedTemplate changes

  // ✅ Monitor localStorage changes for template switches (from other components)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastCheckTime = 0;
    const handleStorageChange = () => {
      const now = Date.now();
      if (now - lastCheckTime < 1000) return; // Only check once per second
      lastCheckTime = now;

      try {
        // Try to load sectionOrder from localStorage first
        const userEmail = localStorage.getItem('userEmail');
        const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
        const stored = localStorage.getItem(sectionOrderKey);

        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          console.warn("📋 Storage check - loaded sectionOrder from localStorage:", parsed);
          setSectionOrder(parsed);
          return;
        }
      } catch (err) {
        console.warn("📋 Error loading sectionOrder from localStorage:", err);
      }

      // Fallback: compute from career level
      const careerLevel = getCareerLevelFromStorage();
      const newOrder = getSectionOrder(careerLevel);
      console.warn("📋 Storage check - careerLevel:", careerLevel, "newOrder:", newOrder);
      setSectionOrder(newOrder);
    };

    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIXED: Only save to localStorage AFTER initial load is complete
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData && resumeData) {
      try {
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
      } catch (error) {
        // Failed to save resume data to localStorage
      }
    }
  }, [resumeData, hasLoadedInitialData]);

  // ✅ NEW: Save data before page unload (backup save)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData) {
      const handleBeforeUnload = () => {
        try {
          localStorage.setItem('resumeData', JSON.stringify(resumeData));
          // // console.log("💾 Resume data backup saved before unload");
        } catch (error) {
          // // console.error("❌ Failed to backup save resume data:", error);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [resumeData, hasLoadedInitialData]);

  // Template persistence
  useEffect(() => {
    if (selectedTemplate !== null) {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
      localStorage.setItem(key, String(selectedTemplate));
    }
  }, [selectedTemplate]);

  const setSelectedTemplate = async (id: string | number | null) => {
    setSelectedTemplateState(id);
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
    if (id !== null) {
      localStorage.setItem(key, String(id));
    } else {
      localStorage.removeItem(key);
    }
  };

  // ✅ Parallelize template initialization and resume loading for better performance
  useEffect(() => {
    const initializeBuilder = async () => {
      // ✅ Use resumeId from prop (URL param) instead of localStorage
      const resumeId = resumeIdProp;

      if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true);
        return;
      }

      try {
        setIsLoadingResume(true);

        // ✅ Check for cached resume data first (for instant loading after creation)
        const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem("cached_resume_data") : null;
        let data;

        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            // Only use cache if it belongs to this exact resumeId
            if (cached?.resumeId === resumeId) {
              data = cached.data;
              localStorage.removeItem("cached_resume_data");
            } else {
              // Stale cache for a different resume — discard and fetch fresh
              localStorage.removeItem("cached_resume_data");
            }
          } catch {
            localStorage.removeItem("cached_resume_data");
          }
        }

        // ✅ Parallelize API calls: fetch template and resume data simultaneously
        const [defaultTemplateData, resumeData] = await Promise.all([
          (async () => {
            try {
              const { getDefaultTemplate } = await import("@/api/resumeApi");
              return await getDefaultTemplate();
            } catch (error) {
              console.warn("Failed to fetch default template, will use fallback", error);
              return null;
            }
          })(),
          (async () => {
            // For enhanced resumes, always fetch from API — cached data is flat
            // (no enhanced_data / ats_score) and would break the score tab on first load.
            if (data && source !== "enhanced") return data;
            if (source === "enhanced") {
              return await getEnhancedResume(resumeId);
            } else {
              return await getResumeById(resumeId);
            }
          })(),
        ]);

        // Process resume data
        let processedData;
        if (source === "enhanced" && resumeData?.enhanced_data) {
          // Handle enhanced resume data
          const enhancedDataWithFallback = {
            ...resumeData.enhanced_data,
            enhancer_state: resumeData.enhancer_state,
          };
          const mapped = mapParserOutputToBuilderData(enhancedDataWithFallback);
          processedData = {
            ...mapped,
            id: resumeData.id,
            personalInfo: {
              ...mapped.personalInfo,
              fullname: mapped.personalInfo?.fullname || resumeData.display_name || "",
            },
          };
          // Store ATS score — prefer API response; if missing, read from atsAnalysisData
          // which is already written by the ATS analysis flow (no new storage needed)
          const resolvedAtsScore = resumeData.ats_score ?? (() => {
            try {
              const cached = localStorage.getItem("atsAnalysisData");
              if (cached) return JSON.parse(cached)?.ats_score ?? null;
            } catch { /* ignore */ }
            return null;
          })();
          if (resolvedAtsScore) {
            setEnhancedAtsScore(resolvedAtsScore);
          }
          // Convert section_breakdown deductions into EnhancedSuggestion[] (after_example is the suggestion text)
          const derivedSuggestions: EnhancedSuggestion[] = [];
          const sectionBreakdown = (resolvedAtsScore?.section_breakdown ?? {}) as Record<string, {
            deductions?: { id: string; penalty: number; after_example?: string; message?: string }[];
          }>;
          for (const [sectionName, sec] of Object.entries(sectionBreakdown)) {
            for (const d of (sec.deductions ?? [])) {
              const text = d.after_example || d.message;
              if (text) {
                derivedSuggestions.push({ id: d.id, section: sectionName, message: text, fix_type: "manual" });
              }
            }
          }
          if (derivedSuggestions.length > 0) {
            setEnhancedSuggestions(derivedSuggestions);
          }
        } else {
          processedData = resumeData || data;
        }

        // ✅ Set default template (with fallback to clean_simple)
        const { TEMPLATE_DEFAULT_STYLES, STYLE_CATALOGUES } = await import("../_utils/templateStyles");
        try {
          // Use domain template ID
          const templateId = String(defaultTemplateData?.template_id || defaultTemplateData?.id || "clean_simple");
          await setSelectedTemplate(templateId);

          // Apply template defaults for styling
          const defaults = TEMPLATE_DEFAULT_STYLES[templateId];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));

          // Apply catalogue color/font overrides on top
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
          // Apply user-picked custom colour (from browse-templates colour picker).
          // Eclipse → sectionHeaderBg; all others → accentColor (section names use accentColor ?? headingColor,
          // so headingColor stays #000000 and role/degree titles remain black).
          if (typeof window !== 'undefined' && selectedCatalogue) {
            if (selectedCatalogue === 'eclipse') {
              const sectionBg = localStorage.getItem('selected_section_bg');
              // Clear accentColor so Eclipse-specific sectionHeaderBg doesn't coexist with a stale accent
              setResumeStyle(prev => ({ ...prev, sectionHeaderBg: sectionBg ?? undefined, accentColor: undefined }));
            } else {
              const accent = localStorage.getItem(`selected_color_${selectedCatalogue}`);
              // Clear sectionHeaderBg so a previous Eclipse session's value doesn't bleed into other catalogues
              setResumeStyle(prev => ({ ...prev, accentColor: accent ?? undefined, sectionHeaderBg: undefined }));
            }
          }
          // Re-apply user's saved font/spacing — must come last so template defaults don't overwrite them
          _reapplySavedFontPrefs(setResumeStyle);
        } catch {
          await setSelectedTemplate("clean_simple");
          const defaults = TEMPLATE_DEFAULT_STYLES["clean_simple"];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));

          // Apply catalogue if selected
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
          if (typeof window !== 'undefined' && selectedCatalogue) {
            if (selectedCatalogue === 'eclipse') {
              const sectionBg = localStorage.getItem('selected_section_bg');
              setResumeStyle(prev => ({ ...prev, sectionHeaderBg: sectionBg ?? undefined, accentColor: undefined }));
            } else {
              const accent = localStorage.getItem(`selected_color_${selectedCatalogue}`);
              setResumeStyle(prev => ({ ...prev, accentColor: accent ?? undefined, sectionHeaderBg: undefined }));
            }
          }
          // Re-apply user's saved font/spacing — must come last so template defaults don't overwrite them
          _reapplySavedFontPrefs(setResumeStyle);
        }

        // Continue with resume data processing...
        data = processedData;

        // Split combined phone (e.g. "+911234567890") into countryCode and phone
        const { countryCode: parsedCode, phoneNumber: parsedPhone } = splitPhone(data.personalInfo?.phone || "");

        // Normalize MongoDB's _id to id for all section items
        const normalizeId = <T extends Record<string, unknown>>(items: T[]): T[] =>
          items.map(item => (!item.id && item._id) ? { ...item, id: item._id } : item);

        const loadedData: ResumeData = {
          resume_id: data.id,
          personalInfo: {
            fullname: data.personalInfo?.fullname || data.personalInfo?.name || data.personalInfo?.full_name || "",
            email: data.personalInfo?.email || "",
            countryCode: data.personalInfo?.countryCode || parsedCode,
            phone: parsedPhone || "",
            location: data.personalInfo?.location || "",
            linkedinUrl: data.personalInfo?.linkedinUrl || "",
            githubUrl: data.personalInfo?.githubUrl || "",
            portfolioUrl: (data.personalInfo as Record<string, string>)?.portfolioUrl || data.personalInfo?.portifolioUrl || "",
            dateOfBirth: data.personalInfo?.dateOfBirth || null,
            nationality: data.personalInfo?.nationality || null,
            category: data.personalInfo?.category || null,
            languages: data.personalInfo?.languages || null,
            titlePrefix: data.personalInfo?.titlePrefix || null,
            qualifications: data.personalInfo?.qualifications || null,
            // Government Standard
            fathersName: data.personalInfo?.fathersName || null,
            gender: data.personalInfo?.gender || null,
            maritalStatus: data.personalInfo?.maritalStatus || null,
            permanentAddress: data.personalInfo?.permanentAddress || null,
            // Healthcare
            specialisation: data.personalInfo?.specialisation || null,
            medicalRegNo: data.personalInfo?.medicalRegNo || null,
            // Legal
            barEnrollmentNo: data.personalInfo?.barEnrollmentNo || null,
            yearOfEnrollment: data.personalInfo?.yearOfEnrollment || null,
            courtsOfPractise: data.personalInfo?.courtsOfPractise || null,
            // Marine
            rank: data.personalInfo?.rank || null,
            cocNumber: data.personalInfo?.cocNumber || null,
            vesselTypes: data.personalInfo?.vesselTypes || null,
            stcwCertificates: data.personalInfo?.stcwCertificates || null,
            // Research Scholar
            orcidId: data.personalInfo?.orcidId || null,
            hIndex: data.personalInfo?.hIndex || null,
            googleScholarUrl: data.personalInfo?.googleScholarUrl || null,
          },
          professionalSummary: typeof data.professionalSummary === 'string'
            ? { summary: data.professionalSummary, targetRole: "" }
            : {
              summary: data.professionalSummary?.summary || "",
              targetRole: data.professionalSummary?.targetRole || (data.professionalSummary as Record<string, string>)?.target_role || "",
            },
          education: normalizeId((data.education || []) as Record<string, unknown>[]) as ResumeData["education"],
          workExperience: normalizeId((data.workExperience || []) as Record<string, unknown>[]) as ResumeData["workExperience"],
          projects: normalizeId((data.projects || []) as Record<string, unknown>[]) as ResumeData["projects"],
          ...(() => {
            let categorizedSkills: CategorizedSkills;
            if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
              // New backend format: skills is an object with camelCase keys and {id,name} arrays
              categorizedSkills = mapBackendSkillsToCategorized(data.skills);
            } else {
              // Legacy format: categorizedSkills with snake_case string arrays
              categorizedSkills = (data.categorizedSkills as CategorizedSkills) || { ...EMPTY_CATEGORIZED_SKILLS };
            }
            const skills = [
              ...categorizedSkills.programming_languages,
              ...categorizedSkills.frameworks,
              ...categorizedSkills.soft_skills,
              ...(categorizedSkills.project_management || []),
              ...(categorizedSkills.marketing_sales || []),
              ...(categorizedSkills.custom_categories || []).flatMap(c => c.skills),
            ];
            return { skills, categorizedSkills };
          })(),
          certifications: (data.certifications || []).map((cert: Record<string, string | undefined>) => ({
            id: cert.id || cert._id,
            name: cert.name || "",
            issuer: cert.issuer || cert.issuedBy || cert.issued_by || "",
            issuedBy: cert.issuedBy || cert.issuer || cert.issued_by || "",
            issueDate: cert.issueDate || cert.year || "",
            year: cert.year || cert.issueDate || "",
            expiryDate: cert.expiryDate || cert.expiry_date || "",
            credentialId: cert.credentialId || cert.credential_id || "",
            credentialUrl: cert.credentialUrl || "",
          })),
          achievements: normalizeId((data.achievements || []) as Record<string, unknown>[]) as ResumeData["achievements"],
          volunteering: normalizeId((data.volunteering || []) as Record<string, unknown>[]) as ResumeData["volunteering"],
          references: normalizeId((data.references || []) as Record<string, unknown>[]) as ResumeData["references"],
          internships: normalizeId((data.internships || []) as Record<string, unknown>[]) as ResumeData["internships"],
          awards: normalizeId((data.awards || []) as Record<string, unknown>[]) as ResumeData["awards"],
          hobbies: normalizeId((data.hobbies || []) as Record<string, unknown>[]) as ResumeData["hobbies"],
          interests: normalizeId((data.interests || []) as Record<string, unknown>[]) as ResumeData["interests"],
          languages: normalizeId((data.languages || []) as Record<string, unknown>[]) as ResumeData["languages"],
          publications: normalizeId((data.publications || []) as Record<string, unknown>[]) as ResumeData["publications"],
          patents: normalizeId((data.patents || []) as Record<string, unknown>[]) as ResumeData["patents"],
          declaration: (data as Record<string, unknown>).declaration as string | undefined ?? "",
          declarationDate: (data as Record<string, unknown>).declarationDate as string | undefined ?? "",
          declarationPlace: (data as Record<string, unknown>).declarationPlace as string | undefined ?? "",
          customSections: data.customSections || [],
        };

        // ✅ Replace data completely (don't merge with previous state)
        // This ensures new resumes start fresh without old data
        setResumeData(loadedData);

        // Restore custom section names into sectionOrder so templates render them
        // Also restore completionStatus entries so the progress ring counts them
        if (loadedData.customSections && loadedData.customSections.length > 0) {
          setSectionOrder(prev => {
            const existing = new Set(prev);
            const toAdd = loadedData.customSections!
              .map(cs => cs.sectionName)
              .filter(name => !existing.has(name));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          });

          setCompletionStatus(prev => {
            const updated = { ...prev };
            loadedData.customSections!.forEach(cs => {
              if (!(cs.sectionName in updated)) {
                // Mark complete only if section has fields and all are filled
                const isComplete = cs.fields.length > 0 && cs.fields.every(field => {
                  if (field.fieldType === 'list') return (field.value as string[]).some(v => v.trim() !== '');
                  return String(field.value).trim() !== '';
                });
                updated[cs.sectionName] = isComplete;
              }
            });
            return updated;
          });
        }

        toast.success("Resume loaded successfully!");

      } catch (error) {
        // // console.error("❌ Failed to load resume:", error);
        toast.error("Failed to load resume data");
      } finally {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true); // ✅ Mark as loaded after backend attempt
      }
    };

    initializeBuilder();
  }, [resumeIdProp, source]); // Re-run when resumeId or source changes

  useEffect(() => {
    setLastUpdated(new Date());
  }, [resumeData]);

  const getCompletionPercentage = (): number => {
    const totalSections = Object.keys(completionStatus).length;
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const addCustomSection = (section: CustomSection) => {
    setResumeData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), section],
    }));
    // Add to completionStatus so it counts in the progress ring
    setCompletionStatus(prev => ({ ...prev, [section.sectionName]: false }));
  };

  const removeCustomSection = (id: string) => {
    const sectionToRemove = resumeData.customSections?.find(s => s.id === id);
    if (sectionToRemove) {
      setCompletionStatus(prev => {
        const next = { ...prev };
        delete next[sectionToRemove.sectionName];
        return next;
      });
    }
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).filter(s => s.id !== id),
    }));
  };

  const addCustomField = (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      fieldName,
      fieldType,
      value: fieldType === "list" ? [] : "",
    };
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
      ),
    }));
  };

  const updateCustomFieldValue = (sectionId: string, fieldId: string, value: string | string[]) => {
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map(f => f.id === fieldId ? { ...f, value } : f) }
          : s
      ),
    }));
  };

  const deleteCustomField = (sectionId: string, fieldId: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s
      ),
    }));
  };

  const applyAutoFix = async (suggestionId: string): Promise<void> => {
    if (!resumeIdProp) return;
    const requestId = ++latestFixRequestRef.current;
    const response = await applyFix({
      enhancer_state: resumeIdProp,
      suggestion_id: suggestionId,
      fix_type: "auto",
    });
    // Drop a response superseded by a newer apply-fix click (out-of-order guard).
    if (requestId !== latestFixRequestRef.current) return;
    if (response.success && response.enhancer_state) {
      // Re-map raw parser resume into builder format
      const mapped = mapParserOutputToBuilderData({
        ...response.enhancer_state.resume,
        enhancer_state: response.enhancer_state,
      });
      const { countryCode: parsedCode, phoneNumber: parsedPhone } = splitPhone(
        (mapped.personalInfo?.phone as string) || ""
      );
      setResumeData(prev => ({
        ...prev,
        ...mapped,
        resume_id: prev.resume_id,
        personalInfo: {
          fullname: mapped.personalInfo?.fullname || prev.personalInfo.fullname,
          email: mapped.personalInfo?.email || prev.personalInfo.email || '',
          location: mapped.personalInfo?.location || prev.personalInfo.location || '',
          countryCode: mapped.personalInfo?.countryCode || parsedCode,
          phone: parsedPhone || mapped.personalInfo?.phone || prev.personalInfo.phone,
          linkedinUrl: mapped.personalInfo?.linkedinUrl || prev.personalInfo.linkedinUrl || '',
          githubUrl: mapped.personalInfo?.githubUrl || prev.personalInfo.githubUrl || '',
          portfolioUrl: mapped.personalInfo?.portfolioUrl || prev.personalInfo.portfolioUrl || '',
          dateOfBirth: mapped.personalInfo?.dateOfBirth || prev.personalInfo.dateOfBirth || '',
          nationality: mapped.personalInfo?.nationality || prev.personalInfo.nationality || '',
          category: mapped.personalInfo?.category || prev.personalInfo.category || '',
          languages: mapped.personalInfo?.languages || prev.personalInfo.languages || '',
          titlePrefix: mapped.personalInfo?.titlePrefix || prev.personalInfo.titlePrefix || '',
          qualifications: mapped.personalInfo?.qualifications || prev.personalInfo.qualifications || '',
        },
      }));
      if (response.enhancer_state.ats_breakdown) {
        setEnhancedAtsScore(response.enhancer_state.ats_breakdown as unknown as ATSScore);
      }
      // Delay removal so the "Applied!" button state is visible to the user before it disappears
      setTimeout(() => {
        setEnhancedSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }, 1200);
    }
  };

  const applyManualFix = async (suggestionId: string, value: string): Promise<void> => {
    if (!resumeIdProp) return;
    const requestId = ++latestFixRequestRef.current;
    const response = await applyFix({
      enhancer_state: resumeIdProp,
      suggestion_id: suggestionId,
      fix_type: "manual",
      value,
    });
    // Drop a response superseded by a newer apply-fix click (out-of-order guard).
    if (requestId !== latestFixRequestRef.current) return;
    if (response.success && response.enhancer_state) {
      if (response.enhancer_state.ats_breakdown) {
        setEnhancedAtsScore(response.enhancer_state.ats_breakdown as unknown as ATSScore);
      }
      setTimeout(() => {
        setEnhancedSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }, 1200);
    }
  };

  const createResume = async () => {
    try {
      const result = await httpClient.post<{ id: string }>('/resumes/', resumeData);
      setResumeId(result.data.id);
    } catch {
      // createResume failure is silent — caller handles fallback
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        selectedTemplate,
        setSelectedTemplate,
        resumeStyle,
        setResumeStyle,
        lastUpdated,
        resumeId: resumeIdProp ?? null, // ✅ Use resume ID from URL param instead of state
        createResume,
        sectionOrder,
        setSectionOrder,
        previewCatalogueKey,
        setPreviewCatalogueKey,
        completionStatus,
        setCompletionStatus,
        getCompletionPercentage,
        isLoadingResume,
        resumeSource: source ?? null,
        enhancedAtsScore,
        enhancedSuggestions,
        addCustomSection,
        removeCustomSection,
        addCustomField,
        updateCustomFieldValue,
        deleteCustomField,
        applyAutoFix,
        applyManualFix,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};


export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("useResume must be used inside ResumeProvider");
  return context;
};
