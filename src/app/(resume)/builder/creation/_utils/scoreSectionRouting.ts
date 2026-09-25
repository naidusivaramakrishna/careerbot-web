/** Resolves an ATS score dimension to a real resume editor. */
export type ScoreSectionAction = { editorSection: string; entryIndex?: number };

const EDITOR_SECTION_BY_TOKEN: Record<string, string> = {
  contact: "Personal Info", headline: "Professional Summary", summary: "Professional Summary",
  experience: "Work Experience", workexperience: "Work Experience",
  careerprogression: "Work Experience", leadership: "Work Experience",
  education: "Education", skills: "Skills", keywords: "Skills", projects: "Projects",
  certifications: "Certifications", internships: "Internships", achievements: "Achievements",
  volunteering: "Volunteering", awards: "Awards", languages: "Languages",
  publications: "Publications", hobbies: "Hobbies", interests: "Interests", references: "References",
};

const NON_EDITOR_TOKENS = new Set(["format", "formatting", "atscompatibility"]);
const normalize = (section: string) => section.toLowerCase().replace(/[^a-z0-9]/g, "");

function getEntryIndex(message?: string): number | undefined {
  const match = message?.match(/\b(?:entry|project|internship|experience)\s+(\d+)\b/i);
  const value = match ? Number(match[1]) : 0;
  return Number.isInteger(value) && value > 0 ? value - 1 : undefined;
}

function getOwnerFromMessage(message?: string): string | undefined {
  if (/\bproject\s+\d+\b/i.test(message ?? "")) return "Projects";
  if (/\binternship\s+\d+\b/i.test(message ?? "")) return "Internships";
  if (/\b(?:work\s+)?experience\s+\d+\b/i.test(message ?? "")) return "Work Experience";
  return undefined;
}

/**
 * Returns null for diagnostics that have no truthful editor target. Unknown
 * categories must not fall through to their raw name: that creates an empty modal.
 */
export function getScoreSectionAction(section: string, deductionMessage?: string): ScoreSectionAction | null {
  const token = normalize(section);
  if (!section || NON_EDITOR_TOKENS.has(token)) return null;
  // Suggestions carry this category as "content" (bare word) as often as
  // "Content Quality" / "ContentQuality".
  const editorSection = (["contentquality", "content"].includes(token) ? getOwnerFromMessage(deductionMessage) : undefined)
    ?? EDITOR_SECTION_BY_TOKEN[token];
  return editorSection ? { editorSection, entryIndex: getEntryIndex(deductionMessage) } : null;
}
