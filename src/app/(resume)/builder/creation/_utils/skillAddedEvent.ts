/**
 * A skill chip is added through its own endpoint, not a section Save, so the
 * editor's "confirm the Manual Fix after saving" step never sees it. The Skills
 * editor announces each added chip with this event instead, and EditorTab
 * answers the matching ATS card (see findSoftSkillSuggestion).
 */
export const SKILL_ADDED_EVENT = "careerbot:skill-added";

export interface SkillAddedDetail {
  skill: string;
  category: string;
}

export function announceSkillAdded(skill: string, category: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SkillAddedDetail>(SKILL_ADDED_EVENT, { detail: { skill, category } }));
}
