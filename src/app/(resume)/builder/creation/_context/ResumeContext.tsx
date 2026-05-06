"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getResumeById } from "@/api/resumeApi";
import { httpClient } from "@/lib/http";
import { getEnhancedResume, applyFix } from "@/api/enhancerApi";
import type { ATSScore, EnhancedSuggestion } from "@/types/api.types";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";
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
  databases: string[];
  tools: string[];
  cloud_platforms: string[];
  soft_skills: string[];
  custom_categories?: CustomCategory[];
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
  }[];
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
      const saved = localStorage.getItem("selected_template");
      return saved || "2"; // Default to template 2
    }
    return "2"; // Default to template 2
  });

  const [enhancedAtsScore, setEnhancedAtsScore] = useState<EnhancedAtsScore>(null);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<EnhancedSuggestion[]>([]);

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
        portfolioUrl: ""
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
        databases: [],
        tools: [],
        cloud_platforms: [],
        soft_skills: []
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
      customSections: [],
    };
  }

  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
    fontFamily: "arial",
    nameFontSize: "20px",
    headingFontSize: "14px",
    bodyFontSize: "10px",
    bold: false,
    italic: false,
    lineSpacing: "1.0",
    headingColor: "#1A1A1A",
    bodyColor: "#4b5563",
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
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
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

          // Check in order of specificity
          if (templateName.includes('early') && templateName.includes('career')) {
            extractedLevel = 'early career';
          } else if (templateName.includes('senior') && (templateName.includes('level') || templateName.includes('-'))) {
            extractedLevel = 'senior-level';
          } else if (templateName.includes('mid') && (templateName.includes('level') || templateName.includes('-'))) {
            extractedLevel = 'mid-level';
          } else if (templateName.includes('fresher')) {
            extractedLevel = 'fresher';
          } else if (templateName.includes('senior')) {
            extractedLevel = 'senior-level';
          } else if (templateName.includes('mid')) {
            extractedLevel = 'mid-level';
          } else if (templateName.includes('early')) {
            extractedLevel = 'early career';
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
    console.warn("🎯 Initial sectionOrder from career level:", careerLevel, "Order:", order);
    return order;
  });

  // ✅ Update section order when career level changes or template is switched
  useEffect(() => {
    const careerLevel = getCareerLevelFromStorage();
    const newOrder = getSectionOrder(careerLevel);
    console.warn("📋 Updating sectionOrder from career level:", careerLevel, newOrder);
    setSectionOrder(newOrder);
  }, [resumeIdProp, selectedTemplate]); // Re-check career level when resumeId or selectedTemplate changes

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
      localStorage.setItem("selected_template", String(selectedTemplate));
      // // console.log("💾 Template saved to localStorage:", selectedTemplate);
    }
  }, [selectedTemplate]);

  const setSelectedTemplate = async (id: string | number | null) => {
    setSelectedTemplateState(id);
    if (id !== null) {
      localStorage.setItem("selected_template", String(id));
      // // console.log("💾 Template saved to localStorage:", id);

      // Note: set-default API requires MongoDB ID (like "6971cbe74c0df89e108ce5b0")
      // This is handled separately in TemplatesTab when applying a template
    } else {
      localStorage.removeItem("selected_template");
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
            if (data) return data; // Use cached data if available
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
          // Store ATS score from enhanced resume response
          if (resumeData.ats_score) {
            setEnhancedAtsScore(resumeData.ats_score);
          }
          const rawSuggestions = resumeData.ats_score?.suggestions as EnhancedSuggestion[] | undefined;
          if (rawSuggestions && rawSuggestions.length > 0) {
            setEnhancedSuggestions(rawSuggestions);
          }
        } else {
          processedData = resumeData || data;
        }

        // ✅ Set default template (with fallback to clean_simple)
        const { TEMPLATE_DEFAULT_STYLES } = await import("../_utils/templateStyles");
        try {
          const defaultTemplateId = String(defaultTemplateData?.template_id || defaultTemplateData?.id || "clean_simple");
          await setSelectedTemplate(defaultTemplateId);
          const defaults = TEMPLATE_DEFAULT_STYLES[defaultTemplateId];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));
        } catch {
          await setSelectedTemplate("clean_simple");
          const defaults = TEMPLATE_DEFAULT_STYLES["clean_simple"];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));
        }

        // Continue with resume data processing...
        data = processedData;
        const { countryCode: parsedCode, phoneNumber: parsedPhone } = splitPhone(data.personalInfo?.phone || "");

        const loadedData: ResumeData = {
          resume_id: data.id,
          personalInfo: {
            fullname: data.personalInfo?.fullname || data.personalInfo?.name || data.personalInfo?.full_name || "",
            email: data.personalInfo?.email || "",
            countryCode: data.personalInfo?.countryCode || parsedCode,
            phone: parsedPhone,
            location: data.personalInfo?.location || "",
            linkedinUrl: data.personalInfo?.linkedinUrl || "",
            githubUrl: data.personalInfo?.githubUrl || "",
            portfolioUrl: (data.personalInfo as Record<string, string>)?.portfolioUrl || data.personalInfo?.portifolioUrl || "",
          },
          professionalSummary: typeof data.professionalSummary === 'string'
            ? { summary: data.professionalSummary, targetRole: "" }
            : (data.professionalSummary || { summary: "", targetRole: "" }),
          education: data.education || [],
          workExperience: data.workExperience || [],
          projects: data.projects || [],
          skills: data.skills || [],
          categorizedSkills: data.categorizedSkills || {
            programming_languages: [],
            frameworks: [],
            databases: [],
            tools: [],
            cloud_platforms: [],
            soft_skills: []
          },
          certifications: (data.certifications || []).map((cert: Record<string, string | undefined>) => ({
            id: cert.id,
            name: cert.name || "",
            issuer: cert.issuer || cert.issuedBy || cert.issued_by || "",
            issueDate: cert.issueDate || cert.year || "",
            expiryDate: cert.expiryDate || cert.expiry_date || "",
            credentialId: cert.credentialId || cert.credential_id || "",
            credentialUrl: cert.credentialUrl || "",
          })),
          achievements: data.achievements || [],
          volunteering: data.volunteering || [],
          references: data.references || [],
          internships: data.internships || [],
          awards: data.awards || [],
          hobbies: data.hobbies || [],
          interests: data.interests || [],
          languages: data.languages || [],
          publications: data.publications || [],
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
    const response = await applyFix({
      enhancer_state: resumeIdProp,
      suggestion_id: suggestionId,
      fix_type: "auto",
    });
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
