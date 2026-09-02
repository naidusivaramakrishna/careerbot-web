"use client";
import { useMemo } from "react";
import { useResume, type ResumeData } from "../../_context/ResumeContext";

// Field requirements aligned to the actual ResumeData schema in
// ../../_context/ResumeContext.tsx. Kept local so the editor uses the
// real field names (the legacy sectionsConfig.sectionRequiredFields
// uses placeholder names that don't match the schema).
const REQUIRED: Record<string, string[]> = {
  "Personal Info": ["fullname", "email", "phone"],
  "Education": ["school", "degree", "endDate"],
  "Work Experience": ["company", "role", "startDate"],
  "Projects": ["title", "description"],
  "Certifications": ["name", "issuer"],
  "Internships": ["company", "role"],
  "Achievements": ["title", "description"],
  "Awards": ["title", "issuedBy"],
  "Publications": ["title", "publicationName"],
  "References": ["name", "contact"],
  "Volunteering": ["organization", "role"],
  "Hobbies": ["name"],
  "Interests": ["name"],
  "Languages": ["language", "proficiency"],
};

export type SectionStat = {
  key: string;
  label: string;
  /** 0..1 */
  completion: number;
  /** ai-assist availability */
  aiAssist: boolean;
  /** present in resume order */
  index: number;
};

const SECTION_LABEL_FIX: Record<string, string> = {
  personalInfo: "Personal Info",
  professionalSummary: "Professional Summary",
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  internships: "Internships",
  achievements: "Achievements",
  awards: "Awards",
  publications: "Publications",
  references: "References",
  volunteering: "Volunteering",
  hobbies: "Hobbies",
  interests: "Interests",
  languages: "Languages",
};

const AI_ASSIST_SECTIONS = new Set([
  "Professional Summary",
  "Work Experience",
  "Projects",
  "Internships",
]);

function toLabel(key: string): string {
  if (SECTION_LABEL_FIX[key]) return SECTION_LABEL_FIX[key];
  // already a label
  if (/^[A-Z]/.test(key) && key.includes(" ")) return key;
  // camelCase → Title Case
  const spaced = key.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/* ──────────────────────────────────────────────────────────────────────────────
   Completion calculator — derives per-section completeness from resumeData
   ────────────────────────────────────────────────────────────────────────────── */
function nonEmpty(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return Boolean(v);
}

function fillRatio(record: Record<string, unknown>, keys: string[]) {
  if (keys.length === 0) return 0;
  const filled = keys.reduce((n, k) => n + (nonEmpty(record?.[k]) ? 1 : 0), 0);
  return filled / keys.length;
}

function listFillRatio(items: unknown[] | undefined, requiredKeys: string[]) {
  if (!items || items.length === 0) return 0;
  // Average per-item fill ratio
  const ratios = items.map((it) =>
    fillRatio((it as Record<string, unknown>) ?? {}, requiredKeys)
  );
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

export function computeSectionCompletion(
  label: string,
  data: ResumeData
): number {
  const req = REQUIRED[label] ?? [];
  const d = data as unknown as Record<string, unknown>;

  switch (label) {
    case "Personal Info":
      return fillRatio(
        (data.personalInfo ?? {}) as Record<string, unknown>,
        req
      );
    case "Professional Summary": {
      const ps = (data.professionalSummary ?? {}) as { summary?: string; targetRole?: string };
      const filled = (nonEmpty(ps.summary) ? 1 : 0) + (nonEmpty(ps.targetRole) ? 0.5 : 0);
      return Math.min(1, filled);
    }
    case "Skills":
      return nonEmpty(data.skills) ? 1 : 0;
    case "Education":
    case "Work Experience":
    case "Projects":
    case "Certifications":
    case "Internships":
    case "Achievements":
    case "Awards":
    case "Publications":
    case "References":
    case "Volunteering":
    case "Hobbies":
    case "Interests":
    case "Languages": {
      const key = LIST_KEY[label];
      return listFillRatio(d[key] as unknown[] | undefined, req);
    }
    default:
      return 0;
  }
}

const LIST_KEY: Record<string, string> = {
  "Education": "education",
  "Work Experience": "workExperience",
  "Projects": "projects",
  "Certifications": "certifications",
  "Internships": "internships",
  "Achievements": "achievements",
  "Awards": "awards",
  "Publications": "publications",
  "References": "references",
  "Volunteering": "volunteering",
  "Hobbies": "hobbies",
  "Interests": "interests",
  "Languages": "languages",
};

/* ──────────────────────────────────────────────────────────────────────────────
   useSectionStats — single hook for SectionRail + ScoreTab
   ────────────────────────────────────────────────────────────────────────────── */
export function useSectionStats(): SectionStat[] {
  const { resumeData, sectionOrder } = useResume();
  return useMemo(() => {
    const base = ["personalInfo", ...(sectionOrder ?? [])];
    const seen = new Set<string>();
    return base
      .filter((k) => {
        const norm = k.toLowerCase();
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
      })
      .map((key, index) => {
        const label = toLabel(key);
        const completion = computeSectionCompletion(label, resumeData);
        return {
          key,
          label,
          completion,
          aiAssist: AI_ASSIST_SECTIONS.has(label),
          index,
        };
      });
  }, [resumeData, sectionOrder]);
}

/* ──────────────────────────────────────────────────────────────────────────────
   useOverallCompletion — averages section stats, used by AppBar / SectionRail footer
   ────────────────────────────────────────────────────────────────────────────── */
export function useOverallCompletion(): number {
  const stats = useSectionStats();
  if (stats.length === 0) return 0;
  return stats.reduce((a, s) => a + s.completion, 0) / stats.length;
}
