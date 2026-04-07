"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { getResumeById, updateResume } from "@/api/resumeApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

export interface CategorizedSkills {
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cloud_platforms: string[];
  soft_skills: string[];
}

// Custom sections support
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
    phone: string;
    location: string;
    linkedinUrl: string;
    portfolioUrl: string;
    countryCode?: string;
  };
  professionalSummary: {
    summary: string;
    targetRole: string;
  };
  education: {
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    scoreType?: string;
    scoreValue?: string;
  }[];
  workExperience: { 
    company: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
    currentlyWorking: boolean; 
    description: string; 
    location: string; 
  }[];
  projects: { 
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
    name: string; 
    issuedBy: string; 
    year: string; 
    expiryDate?: string;
    credentialId?: string;
  }[];
  achievements: { 
    title: string; 
    date: string; 
    description: string; 
  }[];
  volunteering: { 
    organization: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
  }[];
  references: { 
    name: string; 
    relation: string; 
    contact: string; 
  }[];
  internships: { 
    company: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
    currentlyWorking: boolean; 
    description: string; 
    location: string; 
  }[];
  awards: { 
    title: string; 
    issuedBy: string; 
    year: string; 
  }[];
  hobbies: { 
    name: string; 
    description: string; 
    proficiencyLevel?: string; 
    achievement?: string; 
  }[];
  interests: { 
    name: string; 
    description: string; 
    category?: string;  
  }[];
  languages: { 
    language: string; 
    proficiency: string; 
  }[];
  publications: {
    title: string;
    authors: string;
    publicationName: string;
    date: string;
    url: string;
  }[];
  customSections: CustomSection[];
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

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  selectedTemplate: string | number | null;
  setSelectedTemplate: (id: string | number | null) => void;
  resumeStyle: ResumeStyle;
  setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
  lastUpdated: Date | null;
  resumeId: string | null;
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  createResume: () => Promise<void>;
  completionStatus: Record<string, boolean>;
  setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  getCompletionPercentage: () => number;
  isLoadingResume: boolean;
  // Custom sections methods
  addCustomSection: (sectionName: string) => void;
  removeCustomSection: (sectionId: string) => void;
  addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
  updateCustomFieldValue: (sectionId: string, fieldId: string, value: string | string[]) => void;
  deleteCustomField: (sectionId: string, fieldId: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);


interface ResumeProviderProps {
  children: ReactNode;
  resumeId?: string;
}

export const ResumeProvider = ({ children, resumeId: resumeIdProp }: ResumeProviderProps) => {
  const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("selected_template");
      return saved || "2"; // Default to template 2
    }
    return "2"; // Default to template 2
  });

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    // ✅ If resumeId is provided, don't use localStorage (we'll load from backend)
    if (resumeIdProp && resumeIdProp !== 'null' && resumeIdProp !== 'undefined') {
      logger.info("Resume ID provided, will load from backend:", resumeIdProp);
      return getEmptyResumeData(); // Return empty data, will be loaded from backend
    }

    // ✅ Only use localStorage for new resumes (no resumeId)
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('resumeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          logger.info("Loaded resume data from localStorage");
          return parsed;
        } catch (error) {
          logger.warn("Failed to parse localStorage data");
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
        phone: "",
        location: "",
        linkedinUrl: "",
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
  const [, setResumeId] = useState<string | null>(null);
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

  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
    "Work Experience",
    "Projects",
    "Certifications",
    "Achievements",
    "Volunteering",
    "Internships",
    "Awards",
    "Hobbies",
    "Interests",
    "Languages",
    "Publications",
    "References",
  ]);

  // ✅ FIXED: Only save to localStorage AFTER initial load is complete
  useEffect(() => {
    if (hasLoadedInitialData && resumeData) {
      try {
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
      } catch (error) {
        // Failed to save resume data to localStorage
      }
    }
  }, [resumeData, hasLoadedInitialData]);

  // ✅ NEW: Save data before page unload (backup save)
  useEffect(() => {
    if (hasLoadedInitialData) {
      const handleBeforeUnload = () => {
        try {
          localStorage.setItem('resumeData', JSON.stringify(resumeData));
          logger.info("Resume data backup saved before unload");
        } catch (error) {
          logger.error("Failed to backup save resume data:", error);
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
      logger.info("Template saved to localStorage:", selectedTemplate);
    }
  }, [selectedTemplate]);

  const setSelectedTemplate = async (id: string | number | null) => {
    setSelectedTemplateState(id);
    if (id !== null) {
      localStorage.setItem("selected_template", String(id));
      logger.info("Template saved to localStorage:", id);

      // Note: set-default API requires MongoDB ID (like "6971cbe74c0df89e108ce5b0")
      // This is handled separately in TemplatesTab when applying a template
    } else {
      localStorage.removeItem("selected_template");
    }
  };

  // ✅ Always fetch and use default template from backend
  useEffect(() => {
    const initializeDefaultTemplate = async () => {
      try {
        const { getDefaultTemplate, setDefaultTemplate } = await import("@/api/resumeApi");

        try {
          // First, try to set clean_simple as default (in case it's not already)
          try {
            await setDefaultTemplate("6971cbe74c0df89e108ce5b0"); // MongoDB ID for clean_simple
            logger.info("Set clean_simple as default template");
          } catch (setError) {
            logger.warn("Could not set default template (might already be set):", setError);
          }

          // Then fetch the default template
          const defaultTemplateData = await getDefaultTemplate();
          const defaultTemplateId = String((defaultTemplateData as unknown as Record<string, unknown>)?.template_id || (defaultTemplateData as unknown as Record<string, unknown>)?.id || "clean_simple");

          logger.info("Fetched default template from backend:", defaultTemplateId);
          await setSelectedTemplate(defaultTemplateId);
        } catch (fetchError) {
          // If fetching fails, use clean_simple as fallback
          logger.warn("Failed to fetch default template, using clean_simple:", fetchError);
          await setSelectedTemplate("clean_simple");
        }
      } catch (error) {
        logger.error("Failed to initialize default template:", error);
        // Last resort fallback
        await setSelectedTemplate("clean_simple");
      }
    };

    initializeDefaultTemplate();
  }, []); // Empty dependency array - runs once on mount

  // ✅ Load resume from backend (runs once on mount)
  useEffect(() => {
    const loadResumeData = async () => {
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
        const cachedData = localStorage.getItem("cached_resume_data");
        let data;

        if (cachedData) {
          try {
            data = JSON.parse(cachedData);
            logger.info("Using cached resume data for instant load");
            // Clear cache after use to ensure fresh data on subsequent loads
            localStorage.removeItem("cached_resume_data");
          } catch {
            logger.warn("Failed to parse cached data, fetching from backend");
            data = await getResumeById(resumeId);
          }
        } else {
          data = await getResumeById(resumeId);
        }

        const loadedData: ResumeData = {
          resume_id: data.id,
          personalInfo: {
            fullname: data.personalInfo?.fullname || "",
            email: data.personalInfo?.email || "",
            phone: data.personalInfo?.phone || "",
            location: data.personalInfo?.location || "",
            linkedinUrl: data.personalInfo?.linkedinUrl || "",
            portfolioUrl: (data.personalInfo as Record<string, string>)?.portfolioUrl || data.personalInfo?.portifolioUrl || "",
          },
          professionalSummary: typeof data.professionalSummary === 'string'
            ? { summary: data.professionalSummary, targetRole: "" }
            : (data.professionalSummary || { summary: "", targetRole: "" }),
          education: data.education || [],
          workExperience: data.workExperience || [],
          projects: data.projects || [],
          skills: data.skills || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categorizedSkills: data.categorizedSkills || data.categorized_skills || (data as any).categorizedSkills || {
            programming_languages: [],
            frameworks: [],
            databases: [],
            tools: [],
            cloud_platforms: [],
            soft_skills: []
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          certifications: (data.certifications || []).map((cert: any) => ({
            name: cert.name || "",
            issuedBy: cert.issuedBy || cert.issued_by || "",
            year: cert.year || "",
            expiryDate: cert.expiryDate || cert.expiry_date || "",
            credentialId: cert.credentialId || cert.credential_id || "",
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

        toast.success("Resume loaded successfully!");

      } catch (error) {
        logger.error("Failed to load resume:", error);
        toast.error("Failed to load resume data");
      } finally {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true); // ✅ Mark as loaded after backend attempt
      }
    };

    loadResumeData();
  }, [resumeIdProp]); // Re-run when resumeId prop changes

  useEffect(() => {
    setLastUpdated(new Date());
  }, [resumeData]);

  const getCompletionPercentage = (): number => {
    const totalSections = Object.keys(completionStatus).length;
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const createResume = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_RESUME_API as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) throw new Error("Failed to create resume");
      const result = await res.json();
      setResumeId(result.id);
    } catch (error) {
      logger.error("Error creating resume:", error);
    }
  };

  // Custom sections management
  const addCustomSection = (sectionName: string) => {
    const newSection: CustomSection = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      sectionName,
      fields: [],
    };
    setResumeData((prev) => ({
      ...prev,
      customSections: [...prev.customSections, newSection],
    }));

    // ✅ Add custom section to sectionOrder so it appears in the template
    setSectionOrder((prev) => [...prev, newSection.id]);
  };

  const removeCustomSection = (sectionId: string) => {
    setResumeData((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((s) => s.id !== sectionId),
    }));

    // ✅ Remove custom section from sectionOrder
    setSectionOrder((prev) => prev.filter((s) => s !== sectionId));
  };

  const addCustomField = (
    sectionId: string,
    fieldName: string,
    fieldType: CustomField["fieldType"]
  ) => {
    const newField: CustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      fieldName,
      fieldType,
      value: fieldType === "list" ? [] : "",
    };

    setResumeData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section) =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section
      ),
    }));
  };

  const updateCustomFieldValue = (
    sectionId: string,
    fieldId: string,
    value: string | string[]
  ) => {
    setResumeData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, value } : field
              ),
            }
          : section
      ),
    }));
  };

  const deleteCustomField = (sectionId: string, fieldId: string) => {
    setResumeData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.filter((field) => field.id !== fieldId),
            }
          : section
      ),
    }));
  };

  // ✅ Auto-save custom sections to backend whenever they change
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip autosave if:
    // 1. No resume ID (resume not created yet)
    // 2. Resume is still loading
    // 3. Custom sections are empty
    if (!resumeIdProp || isLoadingResume || resumeData.customSections.length === 0) {
      return;
    }

    // Debounce autosave to avoid too many API calls
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        logger.info("💾 Saving custom sections to backend...", resumeData.customSections);
        await updateResume(resumeIdProp, {
          customSections: resumeData.customSections,
        });
        logger.info("✅ Custom sections saved successfully");
      } catch (error) {
        logger.error("❌ Failed to save custom sections:", error);
      }
    }, 2000); // Wait 2 seconds after last change before saving

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resumeData.customSections, resumeIdProp, isLoadingResume]);

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
        addCustomSection,
        removeCustomSection,
        addCustomField,
        updateCustomFieldValue,
        deleteCustomField,
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
