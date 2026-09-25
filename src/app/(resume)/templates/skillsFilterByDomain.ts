import { ResumeData } from "../builder/creation/_context/ResumeContext";
import { DOMAIN_SKILLS, type SkillDomain } from "@/config/domainSkills";

// Technical domains also print the general categories even when the domain's
// editor list does not show them (e.g. `frameworks`, `project_management`).
const DOMAINS_WITH_GENERAL_CATEGORIES = new Set([
  'software_engineering',
  'cybersecurity',
  'research_scholar',
]);

const GENERAL_CATEGORIES = [
  'programming_languages',
  'frameworks',
  'soft_skills',
  'project_management',
  'marketing_sales',
];

// Backend naming variants of editor keys.
const KEY_VARIANTS: Record<string, string[]> = {
  healthcare: ['healthcare_it_systems'],
};

const META_KEYS = ['custom_categories', 'hidden_predefined_categories', 'skill_id_map'] as const;

/**
 * Allowed predefined category keys for a domain, derived from the same
 * DOMAIN_SKILLS list the Skills editor renders, so the editor and the
 * resume templates can never disagree about a domain's keys.
 */
function allowedKeysForDomain(domain: string): Set<string> | null {
  const categories = DOMAIN_SKILLS[domain as SkillDomain];
  if (!categories) return null;
  const keys = new Set(categories.map((c) => c.key));
  (KEY_VARIANTS[domain] || []).forEach((k) => keys.add(k));
  if (DOMAINS_WITH_GENERAL_CATEGORIES.has(domain)) GENERAL_CATEGORIES.forEach((k) => keys.add(k));
  return keys;
}

export function filterSkillsByDomain(
  categorizedSkills: ResumeData['categorizedSkills'] | undefined,
  domainFamily?: string
): ResumeData['categorizedSkills'] | undefined {
  if (!categorizedSkills || !domainFamily) {
    return categorizedSkills;
  }

  const allowed = allowedKeysForDomain(domainFamily);
  // Unknown domain: nothing to filter against, show the resume as stored.
  if (!allowed) return categorizedSkills;

  const filtered: Record<string, unknown> = {};
  META_KEYS.forEach((k) => {
    filtered[k] = categorizedSkills[k];
  });
  Object.entries(categorizedSkills).forEach(([key, value]) => {
    if (allowed.has(key)) filtered[key] = value;
  });
  return filtered as ResumeData['categorizedSkills'];
}

/**
 * Whether the Skills section has anything to print. The templates render the
 * filtered categories whenever `filteredCategorizedSkills` is present, and the
 * flat `skills` list only for legacy resumes without categorized skills, so the
 * heading must follow the same data (a flat list full of skills the domain
 * filters out would otherwise print a SKILLS heading with no body).
 */
export function hasPrintableSkills(
  filteredCategorizedSkills: ResumeData['categorizedSkills'] | undefined,
  skills: string[] | undefined,
): boolean {
  if (filteredCategorizedSkills && Object.keys(filteredCategorizedSkills).length > 0) {
    const predefined = Object.entries(filteredCategorizedSkills).some(
      ([key, value]) =>
        !(META_KEYS as readonly string[]).includes(key) &&
        Array.isArray(value) &&
        value.some((s) => typeof s === 'string'),
    );
    const custom = (filteredCategorizedSkills.custom_categories || []).some(
      (c) => !!c?.name && Array.isArray(c.skills) && c.skills.length > 0,
    );
    return predefined || custom;
  }
  return !!skills && skills.length > 0;
}
