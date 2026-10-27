import type { ResumeResponse } from "@/api/resumeApi";
import { normalizeResumeData } from "../../creation/_lib/normalizeResumeData";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

/**
 * The core sections a resume needs to read as complete. "% complete" on a resume card is the share
 * of these that have saved content (the same "has saved data" rule the editor's progress uses).
 */
export const CORE_SECTIONS = [
  "Personal Info",
  "Professional Summary",
  "Education",
  "Skills",
  "Work Experience",
  "Projects",
  "Certifications",
  "Internships",
] as const;

export const computeResumeCompletion = (data: unknown): number => {
  if (!data || typeof data !== "object") return 0;
  // normalizeResumeData understands both the API payload (snake_case, nested skills) and the
  // editor's camelCase shape, so a list record and an open resume are counted the same way.
  const n = normalizeResumeData(data as ResumeResponse);
  const filled = [
    n.contact.name && n.contact.email && n.contact.phone, // Personal Info
    n.summary.exists, // Professional Summary
    n.education.count > 0, // Education
    n.skills.total > 0, // Skills
    n.experience.workCount > 0, // Work Experience
    n.experience.projectCount > 0, // Projects
    n.certifications.count > 0, // Certifications
    n.experience.internshipCount > 0, // Internships
  ].filter(Boolean).length;
  return Math.round((filled / CORE_SECTIONS.length) * 100);
};

export type AtsTone = "good" | "fair" | "low";

/** Three bands for the ATS score pill: 70+ green, 55-69 amber, below 55 red. */
export const atsTone = (score: number): AtsTone => (score >= 70 ? "good" : score >= 55 ? "fair" : "low");

export const ATS_TONE_CLASSES: Record<AtsTone, string> = {
  good: "bg-[#e3f5ea] text-[#1b8a46]",
  fair: "bg-[#fdf0dc] text-[#c9740a]",
  low: "bg-[#fde6e6] text-[#d02f2f]",
};

const firstText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = firstText(item);
      if (text) return text;
    }
  }
  return "";
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/**
 * % complete for an uploaded (enhanced) resume, read the way the editor reads it: take the saved copy, hand
 * the mapper the enhancer state too (it falls back to it for sections the saved copy has only as empty
 * shells), then use the record's own display name when the parser found no name. Without these steps the same
 * resume counts lower on its card than in the editor. Returns null when the record has no resume data.
 */
export const computeEnhancedCompletion = (record: unknown): number | null => {
  const rec = asRecord(record);
  const state = rec.enhancer_state && typeof rec.enhancer_state === "object" ? asRecord(rec.enhancer_state) : undefined;
  const payload = rec.enhanced_data ?? state?.resume ?? rec.enhanced_resume;
  if (!payload || typeof payload !== "object") return null;
  const mapped = mapParserOutputToBuilderData({ ...asRecord(payload), enhancer_state: state });
  const displayName = typeof rec.display_name === "string" ? rec.display_name : "";
  return computeResumeCompletion({
    ...mapped,
    personalInfo: { ...mapped.personalInfo, fullname: mapped.personalInfo?.fullname || displayName },
  });
};

/**
 * Target role for an enhanced resume card. Fresher resumes carry it in
 * professionalSummary.targetRole; for experienced resumes the parser has no such field but does
 * produce a `headline`, so that is the fallback. Looked up in the saved resume first, then in the
 * enhancer copy and the original parse.
 */
export const readEnhancedTargetRole = (record: unknown): string => {
  const rec = asRecord(record);
  const state = asRecord(rec.enhancer_state);
  const sources = [rec.enhanced_data, state.resume, rec.enhanced_resume, rec.original_data, rec.resume, rec];
  for (const source of sources) {
    const data = asRecord(source);
    const summary = data.professionalSummary ?? data.professional_summary;
    const targetRole = typeof summary === "object" && summary !== null
      ? firstText((summary as Record<string, unknown>).targetRole ?? (summary as Record<string, unknown>).target_role)
      : "";
    if (targetRole) return targetRole;
  }
  for (const source of sources) {
    const headline = firstText(asRecord(source).headline);
    if (headline) return headline;
  }
  return "";
};
