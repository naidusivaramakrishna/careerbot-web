"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

/* ================= TEMPLATE ================= */

export type TemplateId =
  | "default"
  | "apollo"
  | "atlas"
  | "terra"
  | "tempe"
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
  categorizedSkills?: Record<string, string>;
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
