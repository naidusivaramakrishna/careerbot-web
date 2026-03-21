"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/* ================= TEMPLATE ================= */

export type TemplateId =
  | "default"
  | "apollo"
  | "atlas"
  | "terra"
  | "tempe"
  | "classic_professional"
  | "nexus"
  | "pulse"
  | "zen"
  | "nova"
  | "flow";

/* ================= SECTIONS ================= */

export type SectionName =
  | "PersonalInfo"
  | "Summary"
  | "Experience"
  | "Skills"
  | "Education"
  | "Projects"
  | "Languages"
  | "Certificates"
  | "Awards"
  | "Achievements"
  | "Internships"
  | "Volunteering"
  | "Hobbies"
  | "Interests"
  | "Publications"
  | "References";

/* ================= STYLES ================= */

export interface ResumeStyle {
  fontFamily: string;
  bodyFontSize: string;
  headingFontSize: string;
  nameFontSize: string;
  lineSpacing: string;
  bold: boolean;
  italic: boolean;
  headingColor: string;
  bodyColor: string;
}

/* ================= LANGUAGE ================= */

export interface LanguageItem {
  language: string;
  proficiency?: string;
}

/* ================= PERSONAL INFO ================= */
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portifolioUrl?: string;
}

/* ================= DATA ================= */

export interface ResumeData {
  personalInfo: PersonalInfo;
  professionalSummary?: string;
  workExperience: any[];
  education: any[];
  skills: string[];
  projects: any[];
  certifications?: any[];
  achievements?: any[];
  volunteering?: any[];
  references?: any[];
  internships?: any[];
  awards?: any[];
  hobbies?: any[];
  interests?: any[];
  languages?: LanguageItem[];
  publications?: any[];
  categorizedSkills?: Record<string, string | string[]>;
  summaryVariants?: unknown[];
}

/* ================= CONTEXT ================= */

export interface ResumeContextValue {
  resumeStyle: ResumeStyle;
  setResumeStyle: (s: ResumeStyle) => void;

  sectionOrder: SectionName[];
  setSectionOrder: (
    order: SectionName[] | ((prev: SectionName[]) => SectionName[])
  ) => void;

  enabledSections: SectionName[];
  setEnabledSections: (
    s: SectionName[] | ((prev: SectionName[]) => SectionName[])
  ) => void;

  selectedTemplate: TemplateId;
  setSelectedTemplate: (id: TemplateId) => void;

  resumeData: ResumeData | null;
  setResumeData: (d: ResumeData | null) => void;

  activeSection: SectionName | null;
  setActiveSection: (s: SectionName | null) => void;

  highlightedSection: SectionName | null;
  setHighlightedSection: (s: SectionName | null) => void;

  /** Sections that have been edited — kept permanently for green text highlight */
  editedSections: Set<SectionName>;
  addEditedSection: (s: SectionName) => void;

  /** Field-level tracking: section → list of field keys that were newly filled */
  addedFields: Record<string, string[]>;
  addAddedFields: (section: string, fields: string[]) => void;

  /** True after sessionStorage restore attempt is complete */
  isLoaded: boolean;
}

/* ================= DEFAULTS ================= */

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined);

const defaultStyle: ResumeStyle = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  bodyFontSize: "12px",
  headingFontSize: "14px",
  nameFontSize: "28px",
  lineSpacing: "1.5",
  bold: false,
  italic: false,
  headingColor: "#111827",
  bodyColor: "#374151",
};

export const ALL_SECTIONS: SectionName[] = [
  "Summary",
  "Experience",
  "Skills",
  "Education",
  "Projects",
  "Languages",
  "Certificates",
  "Awards",
  "Achievements",
  "Internships",
  "Volunteering",
  "Hobbies",
  "Interests",
  "Publications",
  "References",
];

const defaultSectionOrder: SectionName[] = [
  "PersonalInfo",
  ...ALL_SECTIONS,
];

// Default to only PersonalInfo - other sections will be enabled based on resume data
const defaultEnabledSections: SectionName[] = [
  "PersonalInfo",
];

/* ================= PROVIDER ================= */

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeStyle, setResumeStyle] =
    useState<ResumeStyle>(defaultStyle);

  const [sectionOrder, setSectionOrder] =
    useState<SectionName[]>(defaultSectionOrder);

  const [enabledSections, setEnabledSections] =
    useState<SectionName[]>(defaultEnabledSections);

  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("apollo");

  const [resumeData, setResumeData] =
    useState<ResumeData | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionName | null>(null);

  const [highlightedSection, setHighlightedSection] =
    useState<SectionName | null>(null);

  const [editedSections, setEditedSections] =
    useState<Set<SectionName>>(new Set());

  const addEditedSection = (s: SectionName) => {
    setEditedSections((prev) => new Set([...Array.from(prev), s]));
  };

  const [addedFields, setAddedFields] = useState<Record<string, string[]>>({});

  const addAddedFields = (section: string, fields: string[]) => {
    setAddedFields((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), ...fields],
    }));
  };

  // Reset addedFields whenever a new resume is loaded (resumeData set to null = new upload)
  useEffect(() => {
    if (resumeData === null) {
      setAddedFields({});
    }
  }, [resumeData]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Restore state from sessionStorage on mount (handles page reload)
  useEffect(() => {
    try {
      const rd = sessionStorage.getItem('ctx_resumeData');
      if (rd) setResumeData(JSON.parse(rd) as ResumeData);

      const es = sessionStorage.getItem('ctx_enabledSections');
      if (es) setEnabledSections(JSON.parse(es) as SectionName[]);

      const st = sessionStorage.getItem('ctx_selectedTemplate');
      if (st) setSelectedTemplate(st as TemplateId);
    } catch {
      // Storage unavailable or corrupt — start fresh
    }
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync resumeData to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    if (resumeData) {
      sessionStorage.setItem('ctx_resumeData', JSON.stringify(resumeData));
    }
  }, [resumeData, isLoaded]);

  // Sync enabledSections to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('ctx_enabledSections', JSON.stringify(enabledSections));
  }, [enabledSections, isLoaded]);

  // Sync selectedTemplate to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('ctx_selectedTemplate', selectedTemplate);
  }, [selectedTemplate, isLoaded]);

  const value: ResumeContextValue = {
    resumeStyle,
    setResumeStyle,
    sectionOrder,
    setSectionOrder,
    enabledSections,
    setEnabledSections,
    selectedTemplate,
    setSelectedTemplate,
    resumeData,
    setResumeData,
    activeSection,
    setActiveSection,
    highlightedSection,
    setHighlightedSection,
    editedSections,
    addEditedSection,
    addedFields,
    addAddedFields,
    isLoaded,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) {
    throw new Error("useResume must be used within ResumeProvider");
  }
  return ctx;
}