import type { ResumeResponse } from "@/api/resumeApi";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};

const asArray = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const text = (value: unknown): string => typeof value === "string" ? value : "";

const hasText = (value: unknown): boolean => text(value).trim().length > 0;

// These values describe the skills editor state; they are not resume skills.
// The editor loader explicitly excludes them when it creates its flat list.
const SKILL_METADATA_KEYS = new Set([
  "id",
  "_id",
  "deletedCategories",
  "deleted_categories",
  "hiddenCategories",
  "hidden_categories",
  "hidden_predefined_categories",
  "skill_id_map",
]);

/**
 * The editor expands the persisted categorized-skills payload into a flat
 * list before preview scoring. The list view receives that persisted payload
 * directly, so it needs the same expansion to avoid losing the skills points.
 */
const flattenSkillNames = (value: unknown, names: string[] = []): string[] => {
  if (typeof value === "string") {
    if (value.trim()) names.push(value);
    return names;
  }
  if (Array.isArray(value)) {
    value.forEach(item => flattenSkillNames(item, names));
    return names;
  }
  const item = asRecord(value);
  if (hasText(item.name)) {
    names.push(text(item.name));
    return names;
  }
  Object.entries(item).forEach(([key, child]) => {
    if (!SKILL_METADATA_KEYS.has(key)) flattenSkillNames(child, names);
  });
  return names;
};

export interface NormalizedResumeData {
  contact: {
    name: boolean;
    email: boolean;
    phone: boolean;
    location: boolean;
    links: number;
  };
  summary: {
    exists: boolean;
    length: number;
    hasTargetRole: boolean;
  };
  education: {
    count: number;
    hasGPA: boolean;
    hasCompleteDates: boolean;
  };
  skills: {
    total: number;
    categorized: boolean;
    categories: number;
  };
  experience: {
    workCount: number;
    internshipCount: number;
    projectCount: number;
    hasQuantifiedResults: number;
  };
  certifications: {
    count: number;
    hasIssuer: boolean;
  };
  achievements: {
    count: number;
    awardsCount: number;
  };
  languages: {
    count: number;
  };
  extras: {
    volunteeringCount: number;
    hobbiesCount: number;
    interestsCount: number;
    publicationsCount: number;
  };
  isFresher: boolean;
}

export const normalizeResumeData = (resume: ResumeResponse): NormalizedResumeData => {
  const raw = resume as unknown as UnknownRecord;
  const collection = (...keys: string[]): UnknownRecord[] => {
    for (const key of keys) {
      if (Array.isArray(raw[key])) return asArray(raw[key]);
    }
    return [];
  };

  const personalInfo = asRecord(raw.personalInfo ?? raw.personal_info);
  const summary = raw.professionalSummary ?? raw.professional_summary;
  const summarySource = asRecord(summary);
  const summaryObj = typeof summary === "string"
    ? { summary, targetRole: "" }
    : {
      summary: text(summarySource.summary),
      targetRole: text(summarySource.targetRole ?? summarySource.target_role),
    };

  const workExperience = collection("workExperience", "work_experience")
    .filter(e => hasText(e.company) || hasText(e.role));
  const internships = collection("internships")
    .filter(e => hasText(e.company) || hasText(e.role));
  const projects = collection("projects")
    .filter(e => hasText(e.title));
  const education = collection("education")
    .filter(e => hasText(e.school) || hasText(e.degree));
  const rawSkills = raw.skills;
  const skills = Array.isArray(rawSkills)
    ? rawSkills.filter((skill): skill is string => typeof skill === "string" && Boolean(skill.trim()))
    : flattenSkillNames(rawSkills);
  const categorizedSkills = asRecord(raw.categorizedSkills ?? raw.categorized_skills ?? (
    rawSkills && typeof rawSkills === "object" && !Array.isArray(rawSkills) ? rawSkills : undefined
  ));
  // The editor initializes the five standard categories when it receives the
  // persisted skills object. Treat that representation as categorized here too.
  const categorizedSkillCount = rawSkills && typeof rawSkills === "object" && !Array.isArray(rawSkills)
    ? Math.max(3, Object.keys(categorizedSkills).length)
    : Object.keys(categorizedSkills).length;
  const certifications = collection("certifications")
    .filter(e => hasText(e.name));
  const achievements = collection("achievements")
    .filter(e => hasText(e.title));
  const awards = collection("awards")
    .filter(e => hasText(e.title));
  const languages = collection("languages")
    .filter(e => hasText(e.name) || hasText(e.language));
  const volunteering = collection("volunteering")
    .filter(e => hasText(e.organization) || hasText(e.role));
  const hobbies = collection("hobbies")
    .filter(e => hasText(e.name));
  const interests = collection("interests")
    .filter(e => hasText(e.name));
  const publications = collection("publications")
    .filter(e => hasText(e.title));

  const isFresher = workExperience.length === 0 && education.length > 0;

  const countQuantifiedResults = (items: UnknownRecord[]) =>
    items.filter(item => /\d+%?|\d+[xX+]|\b(increased|improved|reduced|achieved)\b/i.test(text(item.description))).length;

  return {
    contact: {
      name: hasText(personalInfo.fullname ?? personalInfo.name ?? personalInfo.full_name),
      email: hasText(personalInfo.email),
      phone: hasText(personalInfo.phone),
      location: hasText(personalInfo.location),
      links: [personalInfo.linkedinUrl ?? personalInfo.linkedin_url, personalInfo.githubUrl ?? personalInfo.github_url, personalInfo.portfolioUrl ?? personalInfo.portfolio_url].filter(hasText).length,
    },
    summary: {
      exists: hasText(summaryObj.summary),
      length: (summaryObj.summary || "").trim().length,
      hasTargetRole: hasText(summaryObj.targetRole),
    },
    education: {
      count: education.length,
      hasGPA: education.some(e => hasText(e.scoreValue ?? e.score_value)),
      hasCompleteDates: education.filter(e => e.startDate && e.endDate).length > 0,
    },
    skills: {
      total: skills.length,
      categorized: categorizedSkillCount > 0,
      categories: categorizedSkillCount,
    },
    experience: {
      workCount: workExperience.length,
      internshipCount: internships.length,
      projectCount: projects.length,
      hasQuantifiedResults: countQuantifiedResults([...workExperience, ...projects]),
    },
    certifications: {
      count: certifications.length,
      hasIssuer: certifications.some(c => hasText(c.issuer ?? c.issuedBy ?? c.issued_by)),
    },
    achievements: {
      count: achievements.length,
      awardsCount: awards.length,
    },
    languages: {
      count: languages.length,
    },
    extras: {
      volunteeringCount: volunteering.length,
      hobbiesCount: hobbies.length,
      interestsCount: interests.length,
      publicationsCount: publications.length,
    },
    isFresher,
  };
};
