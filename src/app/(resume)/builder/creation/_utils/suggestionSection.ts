import type { ResumeData } from "../_context/ResumeContext";

// Maps each section component's key to the suggestion `section` values from the API.
// Section values come from enhancer_state.suggestions[].section in the backend response.
//
// Shared between SectionTipsPanel (renders the Manual Fix / Auto Fix cards) and
// EditorTab (auto-completes a Manual Fix suggestion when its target field is
// edited and the section is Saved) — both need to know which suggestion
// `section` values belong to a given editor section, and how to read a
// suggestion's current value out of resumeData. Keeping one definition avoids
// the two call sites silently drifting apart on which sections/fields count.
export const SUGGESTION_SECTION_MAP: Record<string, string[]> = {
  PersonalInfo: ["Contact"],
  // `format` / `Formatting` has no resume-data editor. Routing it to Summary
  // caused an empty, unrelated modal and a no-op Mark-as-done action.
  ProfessionalSummary: ["Summary", "content"],
  Skills: ["Skills", "Keywords"],
  Education: ["Education"],
  // ContentQuality covers bullet-level suggestions; entryContent filtering scopes them per-entry
  // Leadership suggestions reference specific bullet text — same entry-level filtering applies
  // A listed-but-not-demonstrated skill is owned by Skills, but its evidence
  // must be added to a project, internship, or work-experience entry.
  WorkExperience: ["WorkExperience", "Experience", "ContentQuality", "content", "Leadership", "Skills"],
  Projects: ["Projects", "ContentQuality", "content", "Leadership", "Skills"],
  Certifications: ["Certifications"],
  Internships: ["Internships", "ContentQuality", "content", "Leadership", "Skills"],
  Achievements: ["Achievements"],
  Volunteering: ["Volunteering"],
  Awards: ["Awards"],
  Hobbies: ["Hobbies"],
  Interests: ["Interests"],
  // IntelligencePenalty suggestions are about missing language proficiency
  Languages: ["Languages", "IntelligencePenalty"],
  Publications: ["Publications"],
  References: ["References"],
};

/** Converts a modal display name ("Work Experience") to its SUGGESTION_SECTION_MAP
 * key ("WorkExperience") — every key above is the display name with spaces stripped. */
export function toSuggestionSectionKey(displaySectionName: string): string {
  return displaySectionName.replace(/\s+/g, "");
}

/** Counts bullet lines in a Project/Internship `description`, which is stored
 * as contentEditable-produced HTML (block tags per bullet), not plain text
 * with "\n" separators. */
function countBulletLines(description: string | undefined): number {
  if (!description) return 0;
  return description
    .replace(/<\/(div|p|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

/**
 * Returns true only for objective, data-presence suggestions that can be
 * verified without AI judgement. Semantic deductions (Leadership, impact,
 * writing quality, keywords, etc.) deliberately return false.
 */
export function isStructuralSuggestionSatisfied(
  resumeData: ResumeData,
  suggestion: { section?: string; message: string },
): boolean {
  const message = suggestion.message.toLowerCase();

  // Example: "'Python' is listed but not demonstrated anywhere." The
  // suggestion's own wording ("use it in your work experience") is the AI
  // scorer's actual evidence contract: confirmed via a live apply response
  // where a skill textually present in a Project's description still came
  // back with technical_skills[].evidence_count: 0 / strength: "not_used".
  // Only Work Experience mentions count as evidence server-side — checking
  // Projects/Internships text here made the client believe the deduction was
  // satisfied when it wasn't, auto-submitting /enhance/apply with a value the
  // backend then rejected ("provide a valid value").
  const demonstratedSkill = suggestion.message.match(/['\"]([^'\"]+)['\"]\s+is listed but not demonstrated/i)?.[1]?.trim();
  if (demonstratedSkill) {
    const escapedSkill = demonstratedSkill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const skillPattern = new RegExp(`(^|[^a-z0-9])${escapedSkill}(?=$|[^a-z0-9])`, "i");
    const evidence = (resumeData.workExperience ?? []).map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`);
    return evidence.some(entry => skillPattern.test(entry));
  }

  // Contact deductions are objective field-presence checks. Without this
  // branch, saving Location persisted the text but never called /enhance/apply,
  // leaving the old card and 98% section score on screen.
  if (suggestion.section?.toLowerCase() === "contact") {
    const contact = resumeData.personalInfo ?? {};
    if (message.includes("location")) return Boolean(contact.location?.trim());
    if (message.includes("github")) return Boolean(contact.githubUrl?.trim());
    if (message.includes("linkedin")) return Boolean(contact.linkedinUrl?.trim());
    if (message.includes("portfolio")) return Boolean(contact.portfolioUrl?.trim());
    if (message.includes("phone")) return Boolean(contact.phone?.trim());
    if (message.includes("email")) return Boolean(contact.email?.trim());
  }

  // “Missing summary section” is an objective presence deduction, not a
  // subjective writing-quality recommendation.  It was missing from this
  // allowlist, so saving a valid Professional Summary only persisted text;
  // it never sent the suggestion ID to /enhance/apply to recalculate the
  // Summary bar and remove/mark the ATS card.
  if (
    suggestion.section?.toLowerCase() === "summary"
    && /missing (?:professional )?summary (?:section|content)|no (?:professional )?summary/i.test(message)
  ) {
    const plainText = (resumeData.professionalSummary?.summary ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Must agree with the backend summary writeback validator (minimum 20
    // characters), otherwise the UI would falsely show a fixed card.
    return plainText.length >= 20;
  }

  if (suggestion.section?.toLowerCase() === "education") {
    const entryMatch = message.match(/\bentry\s+(\d+)\b/i);
    const entryIndex = entryMatch ? Number(entryMatch[1]) - 1 : 0;
    const entry = resumeData.education?.[entryIndex];
    if (!entry) return false;

    // Keep this field classification aligned with the AI writeback resolver.
    // A generic presence suggestion is handled by the list-level rule below.
    if (/grade|gpa|cgpa|percentage|score/.test(message)) {
      return Boolean(entry.scoreValue?.trim());
    }
    if (/duration|both\s+start\s+and\s+end|start\s+and\s+end/.test(message)) {
      return Boolean(entry.startDate?.trim() && entry.endDate?.trim());
    }
    if (/start\s+date/.test(message)) return Boolean(entry.startDate?.trim());
    if (/passed[_\s-]?out|graduation|year|end\s+date|completion/.test(message)) {
      return Boolean(entry.endDate?.trim());
    }
  }

  // "Projects scored 0/0. Add 3+ bullet points per project with tech stack,
  // your role, and measurable outcomes..." / the same template for
  // Internships. This was previously unhandled, so Save on the ATS report
  // page (atslogin/report — the only place a manual-fix suggestion can be
  // confirmed, since SectionTipsPanel hides its own "Mark as done" control
  // there) could never auto-confirm a `*_score_gap` suggestion no matter how
  // many bullets were actually added: this function fell through to `false`
  // for every entry, so getChangedSatisfiedManualSuggestions never selected it.
  const scoreGapBulletMatch = message.match(/scored 0\/0\.\s*add\s+(\d+)\+?\s+bullet points? per (project|internship)/i);
  if (scoreGapBulletMatch) {
    const requiredBullets = Number(scoreGapBulletMatch[1]);
    const kind = scoreGapBulletMatch[2].toLowerCase();
    const entries = kind === "project" ? (resumeData.projects ?? []) : (resumeData.internships ?? []);
    return entries.some((entry) => countBulletLines((entry as { description?: string }).description) >= requiredBullets);
  }

  const isProjectPresence = /no projects listed|add(?:ing)?\s+(?:at least\s+)?(?:\d+\s+)?projects?/i.test(message);
  if (isProjectPresence) {
    const countMatch = message.match(/add(?:ing)?\s+(?:at least\s+)?(\d+)\s+projects?/i);
    const required = countMatch ? Number(countMatch[1]) : 1;
    return (resumeData.projects ?? []).length >= required;
  }

  if (/add at least one certification|no certifications? listed/i.test(message)) {
    return (resumeData.certifications ?? []).length > 0;
  }
  if (/add at least one internship|no internships? listed/i.test(message)) {
    return (resumeData.internships ?? []).length > 0;
  }
  if (/add at least one education|no education (?:entry|listed)/i.test(message)) {
    return (resumeData.education ?? []).length > 0;
  }
  if (/add at least one (?:work experience|experience)|no (?:work )?experience listed/i.test(message)) {
    return (resumeData.workExperience ?? []).length > 0;
  }
  if (/add at least one achievement|no achievements? listed/i.test(message)) {
    return (resumeData.achievements ?? []).length > 0;
  }
  if (/add at least one award|no awards? listed/i.test(message)) {
    return (resumeData.awards ?? []).length > 0;
  }
  if (/add at least one language|no languages? listed/i.test(message)) {
    return (resumeData.languages ?? []).length > 0;
  }
  if (/add at least one volunteer|no volunteer(?:ing)? (?:entry|experience|listed)/i.test(message)) {
    return (resumeData.volunteering ?? []).length > 0;
  }

  return false;
}

/**
 * Selects the exact manual deductions that a section Save may confirm.
 * This is deliberately pure so Save behavior is regression-tested without
 * mounting the entire editor. A suggestion must belong to the editor section,
 * be objectively satisfied, and have a changed target value since modal open.
 */
export function getChangedSatisfiedManualSuggestions(
  resumeData: ResumeData,
  suggestions: Array<{ id: string; section: string; message: string; fix_type: string; status?: string }>,
  ownerSection: string,
  originalValues: Record<string, string>,
): Array<{ id: string; section: string; message: string; fix_type: string; status?: string }> {
  const sectionValues = SUGGESTION_SECTION_MAP[toSuggestionSectionKey(ownerSection)] ?? [];
  return suggestions.filter((suggestion) => {
    if (suggestion.status === "fixed" || suggestion.fix_type !== "manual" || !sectionValues.includes(suggestion.section)) {
      return false;
    }
    const currentValue = getSectionValue(resumeData, suggestion.section, suggestion, ownerSection);
    return isStructuralSuggestionSatisfied(resumeData, suggestion)
      && Boolean(currentValue.trim())
      && currentValue !== originalValues[suggestion.id];
  });
}
/** Reads the current value of whatever field a suggestion targets, out of resumeData.
 * `suggestion` narrows generic sections (e.g. "Contact") to a specific field via its message. */
export function getSectionValue(
  resumeData: ResumeData,
  section: string,
  suggestion?: { message: string },
  ownerSection?: string,
): string {
  const s = section.toLowerCase();
  const owner = ownerSection?.toLowerCase().replace(/\s+/g, "");
  if (["summary", "content"].includes(s)) {
    return resumeData.professionalSummary?.summary ?? "";
  }
  if (s === "contact") {
    const p = resumeData.personalInfo ?? {};
    if (suggestion) {
      const msg = suggestion.message.toLowerCase();
      if (msg.includes("github")) return p.githubUrl ?? "";
      if (msg.includes("linkedin")) return p.linkedinUrl ?? "";
      if (msg.includes("portfolio")) return p.portfolioUrl ?? "";
      if (msg.includes("email")) return p.email ?? "";
      if (msg.includes("phone")) return p.phone ?? "";
      if (msg.includes("location")) return p.location ?? "";
    }
    return [p.fullname, p.email, p.phone, p.location, p.linkedinUrl, p.githubUrl, p.portfolioUrl]
      .filter(Boolean).join(", ");
  }
  const isSkillDemonstration = s === "skills" && /['\"][^'\"]+['\"]\s+is listed but not demonstrated/i.test(suggestion?.message ?? "");
  if (isSkillDemonstration && owner === "projects") {
    return (resumeData.projects ?? [])
      .map(e => `${e.title ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (isSkillDemonstration && owner === "internships") {
    return (resumeData.internships ?? [])
      .map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (isSkillDemonstration && owner === "workexperience") {
    return (resumeData.workExperience ?? [])
      .map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (["skills", "keywords"].includes(s)) {
    if (resumeData.categorizedSkills) {
      return Object.values(resumeData.categorizedSkills).flat().join(", ");
    }
    return (resumeData.skills ?? []).join(", ");
  }
  // Leadership and ContentQuality are cross-cutting ATS categories. Resolve
  // them against the editor that owns the suggestion card; treating them as
  // Work Experience unconditionally made project/internship edits invisible.
  if (["contentquality", "content", "leadership"].includes(s) && owner === "projects") {
    return (resumeData.projects ?? [])
      .map(e => `${e.title ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (["contentquality", "content", "leadership"].includes(s) && owner === "internships") {
    return (resumeData.internships ?? [])
      .map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (["workexperience", "experience", "contentquality", "content", "leadership"].includes(s)) {
    return (resumeData.workExperience ?? [])
      .map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (s === "projects") {
    return (resumeData.projects ?? [])
      .map(e => `${e.title ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (s === "education") {
    const message = suggestion?.message.toLowerCase() ?? "";
    const entryMatch = message.match(/\bentry\s+(\d+)\b/i);
    const entry = resumeData.education?.[(entryMatch ? Number(entryMatch[1]) : 1) - 1];
    if (!entry) return "";

    // /enhance/apply writes one targeted value. Sending a whole education
    // entry (degree, school, and both dates) corrupts the target field and
    // makes the AI service reject or fail to resolve the deduction.
    if (/grade|gpa|cgpa|percentage|score/.test(message)) {
      const value = entry.scoreValue?.trim() ?? "";
      if (!value) return "";
      return entry.scoreType && !new RegExp(entry.scoreType, "i").test(value)
        ? `${value} ${entry.scoreType}`
        : value;
    }
    if (/duration|both\s+start\s+and\s+end|start\s+and\s+end/.test(message)) {
      return [entry.startDate, entry.endDate].filter(Boolean).join(" - ");
    }
    if (/start\s+date/.test(message)) return entry.startDate ?? "";
    if (/passed[_\s-]?out|graduation|year|end\s+date|completion/.test(message)) {
      return entry.endDate ?? "";
    }
    return `${entry.degree ?? ""} ${entry.school ?? ""}`.trim();
  }
  if (s === "certifications") {
    return (resumeData.certifications ?? []).map(e => e.name).filter(Boolean).join(", ");
  }
  if (s === "internships") {
    return (resumeData.internships ?? [])
      .map(e => `${e.company ?? ""} ${e.role ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean).join(" ");
  }
  if (s === "achievements") {
    return (resumeData.achievements ?? []).map(e => `${e.title} ${e.description ?? ""}`).join(" ");
  }
  if (s === "awards") {
    return (resumeData.awards ?? []).map(e => e.title).filter(Boolean).join(", ");
  }
  if (s === "hobbies") {
    return (resumeData.hobbies ?? []).map(e => `${e.name} ${e.description ?? ""}`).join(" ");
  }
  if (s === "interests") {
    return (resumeData.interests ?? []).map(e => `${e.name} ${e.description ?? ""}`).join(" ");
  }
  if (["languages", "intelligencepenalty"].includes(s)) {
    return (resumeData.languages ?? []).map(e => `${e.name} ${e.proficiency ?? ""}`).join(", ");
  }
  if (s === "publications") {
    return (resumeData.publications ?? []).map(e => e.title).filter(Boolean).join(", ");
  }
  if (s === "volunteering") {
    return (resumeData.volunteering ?? [])
      .map(e => `${e.organization ?? ""} ${e.role ?? ""}`.trim())
      .filter(Boolean).join(", ");
  }
  if (s === "references") {
    return (resumeData.references ?? [])
      .map(e => `${e.name ?? ""} ${e.contact ?? ""}`.trim())
      .filter(Boolean).join(", ");
  }
  if (s === "patents") {
    return (resumeData.patents ?? []).map(e => e.title).filter(Boolean).join(", ");
  }
  return "";
}
