import { isSectionKnownEmpty } from "./sectionPayloadKeys";

/**
 * Whether the resume has the 7 CORE sections the AI score needs. Mirrors the backend rule
 * (`completeness.py` -> `eligible_for_ai_score`), so the screen and the server agree on when the AI
 * score replaces the static one:
 *
 *   1. Personal Info        - a name and an email
 *   2. Professional Summary - at least 20 characters
 *   3. Education            - at least one entry
 *   4. Skills               - at least one skill
 *   5. Work Experience      - at least one entry (a fresher's internship counts)
 *   6. Projects             - at least one entry
 *   7. Certifications       - at least one entry
 *
 * Any other section (Achievements, Hobbies, Languages, ...) does not count toward the 7.
 * The server stays the authority: it answers 422 with the fields it is still missing, and the
 * score panel shows those. This only decides WHEN to ask, and what to tell the user to fill in.
 */

export const MIN_SUMMARY_CHARS = 20;

export interface ReadinessItem {
  label: string;
  done: boolean;
}

export interface AiScoreReadiness {
  eligible: boolean;
  items: ReadinessItem[];
  doneCount: number;
}

type ResumeLike = Record<string, unknown> & {
  personalInfo?: { fullname?: unknown; email?: unknown } | null;
  professionalSummary?: { summary?: unknown } | string | null;
};

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const hasContent = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasContent);
  if (value && typeof value === "object") return Object.values(value).some(hasContent);
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined && value !== false;
};

const filledCount = (value: unknown): number => (Array.isArray(value) ? value.filter(hasContent).length : 0);

export function getAiScoreReadiness(data: unknown): AiScoreReadiness {
  const resume = (data && typeof data === "object" ? data : {}) as ResumeLike;

  const personal = resume.personalInfo ?? {};
  const summary = resume.professionalSummary;
  const summaryText = typeof summary === "string" ? summary : summary?.summary;

  const items: ReadinessItem[] = [
    { label: "Personal Info", done: text(personal.fullname) !== "" && text(personal.email) !== "" },
    { label: "Professional Summary", done: text(summaryText).length >= MIN_SUMMARY_CHARS },
    { label: "Education", done: filledCount(resume.education) > 0 },
    { label: "Skills", done: !isSectionKnownEmpty(resume as never, "Skills") },
    { label: "Work Experience", done: filledCount(resume.workExperience) > 0 || filledCount(resume.internships) > 0 },
    { label: "Projects", done: filledCount(resume.projects) > 0 },
    { label: "Certifications", done: filledCount(resume.certifications) > 0 },
  ];

  const doneCount = items.filter((item) => item.done).length;
  return { eligible: doneCount === items.length, items, doneCount };
}

/** "Skills", "Skills and Education", "Personal Info, Skills and Education" */
export function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
