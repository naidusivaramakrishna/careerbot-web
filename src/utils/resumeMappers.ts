// Maps resume parser output OR enhanced_resume response → builder ResumeData format.
// Handles both raw snake_case parser fields AND camelCase enhanced_resume fields.

import type { ResumeData, CategorizedSkills, CustomSection, CustomField, CustomCategory } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { mergeEducationDegree } from "@/utils/educationPersistence";
import { isAbbreviationPeriod, normalizeCustomSectionName } from "@/app/(resume)/builder/creation/_utils/customSectionIdentity";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.trim();
  if (v == null) return fallback;
  return String(v).trim();
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// Enhanced-resume history can contain either the public `id` field or a
// legacy Mongo `_id`. Dropping `_id` makes a later edit look like a brand-new
// item to the backend's id-based merge and creates a duplicate.
function mappedId(item: AnyRecord): { id: string } | Record<string, never> {
  const id = str(item.id || item._id);
  return id ? { id } : {};
}

/** Extract text from an array that may contain plain strings OR { text, ... } objects */
function bulletTexts(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item !== null) return str((item as AnyRecord).text);
      return "";
    })
    .filter(Boolean);
}

function strArr(v: unknown): string[] {
  if (Array.isArray(v)) {
    return (v as unknown[])
      .map((x) =>
        typeof x === "string"
          ? x
          : typeof x === "object" && x !== null
          ? str((x as AnyRecord).name || (x as AnyRecord).skill)
          : ""
      )
      .filter(Boolean);
  }
  if (typeof v === "string") return v.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// Unwraps the {value}/{text} objects some parser records use for scalars.
function scoreText(v: unknown): string {
  if (v && typeof v === "object") v = (v as AnyRecord).value ?? (v as AnyRecord).text;
  return typeof v === "string" || typeof v === "number" ? str(v) : "";
}

const LEGACY_EDUCATION_SCORE_KEYS = ["grade", "gpa", "GPA", "cgpa", "CGPA", "percentage"];

/**
 * Education score for views that read the stored resume document directly
 * (JobMatch preview/editor, ATS preview). The builder persists a score ONLY as
 * scoreValue/scoreType (stored snake_case as score_value/score_type; the API's
 * builder Education schema drops every other score key on save); parser-only
 * records may still carry the legacy aliases. Builder fields win, aliases are
 * the fallback. `display` restores the "%" the builder stores without (legacy
 * values are shown as stored).
 */
export function getEducationScore(edu: unknown): { type: string; value: string; display: string } {
  const e: AnyRecord = edu && typeof edu === "object" ? (edu as AnyRecord) : {};
  const builderValue = scoreText(e.scoreValue) || scoreText(e.score_value);
  const value = builderValue || LEGACY_EDUCATION_SCORE_KEYS.map((k) => scoreText(e[k])).find(Boolean) || "";
  const type = [e.scoreType, e.score_type, e.gradeType, e.grade_type].map(scoreText).find(Boolean) || "";
  const addPercent = Boolean(builderValue) && type === "Percentage" && !value.endsWith("%");
  return { type, value, display: addPercent ? `${value}%` : value };
}

/** Writes an edited score where getEducationScore reads it first and drops stale aliases. */
export function withEducationScoreValue(edu: AnyRecord, value: string): AnyRecord {
  const next: AnyRecord = { ...edu, scoreValue: value };
  for (const key of ["score_value", ...LEGACY_EDUCATION_SCORE_KEYS]) delete next[key];
  return next;
}

/**
 * Maps parser API output (parsed_data) OR enhance API output (enhanced_resume)
 * to the builder's ResumeData shape.
 * Handles all field-name aliases: snake_case (parser), camelCase (enhanced_resume).
 */
export function mapParserOutputToBuilderData(rawParsedData: unknown): Partial<ResumeData> {
  const p = (rawParsedData as AnyRecord) || {};

  // snake_case sources (raw parser output)
  const llm: AnyRecord = (p.llm_data as AnyRecord) || {};
  const contact: AnyRecord = (p.contact as AnyRecord) || (p.personal_info as AnyRecord) || {};
  const social: AnyRecord = (p.social_links as AnyRecord) || {};
  const tech: AnyRecord = (p.technical_skills as AnyRecord) || {};

  // camelCase sources (enhanced_resume output)
  const piCamel: AnyRecord = (p.personalInfo as AnyRecord) || {};
  const catSkills: AnyRecord = (p.categorizedSkills as AnyRecord) || {};

  type EducationScoreType = "CGPA" | "Marks" | "GPA" | "Percentage";
  const normalizeScoreType = (value: unknown): EducationScoreType | undefined => {
    const normalized = str(value).trim().toLowerCase();
    const aliases: Record<string, EducationScoreType> = {
      cgpa: "CGPA", gpa: "GPA", marks: "Marks",
      percentage: "Percentage", percent: "Percentage", "%": "Percentage",
    };
    return aliases[normalized];
  };
  const inferEducationScoreType = (edu: AnyRecord, rawValue: string): EducationScoreType | undefined => {
    const value = rawValue.trim();
    const hasPercentageFormat = /%|percent/i.test(value);
    const numericValue = Number(value.replace(/%|percent(?:age)?/gi, "").replace(/,/g, "").trim());

    // Preserve an explicit selection unless it is impossible for the value.
    // Some parser records contain the default label CGPA alongside values such
    // as "78%" or "90". Treat those as percentages instead of propagating an
    // internally inconsistent type/value pair into the editor.
    const explicit = normalizeScoreType(
      edu.scoreType || edu.score_type || edu.gradeType || edu.grade_type
    );
    if (
      explicit === "CGPA" &&
      (hasPercentageFormat || (Number.isFinite(numericValue) && numericValue > 10))
    ) return "Percentage";
    if (
      explicit === "GPA" &&
      (hasPercentageFormat || (Number.isFinite(numericValue) && numericValue > 4))
    ) return numericValue <= 10 && !hasPercentageFormat ? "CGPA" : "Percentage";
    if (explicit) return explicit;
    if (str(edu.percentage)) return "Percentage";
    if (str(edu.cgpa)) return "CGPA";
    if (str(edu.gpa) || str(edu.gpa_value)) return "GPA";

    if (!value) return undefined;
    if (hasPercentageFormat) return "Percentage";
    const fraction = value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
    if (fraction) {
      const scale = Number(fraction[2]);
      if (scale === 100) return "Percentage";
      if (scale === 10) return "CGPA";
      if (scale === 4) return "GPA";
      return "Marks";
    }
    const numeric = numericValue;
    if (!Number.isFinite(numeric) || numeric < 0) return undefined;
    if (numeric > 10 && numeric <= 100) return "Percentage";
    if (numeric > 4 && numeric <= 10) return "CGPA";
    if (numeric <= 4) return "GPA";
    return undefined;
  };

  // "programming_language" (singular) is careerbot-ai's canonical slug --
  // title-casing it verbatim would read "Programming Language", not the
  // "Programming Languages" label used everywhere else in the app (e.g. the
  // predefined-bucket UI in Skills.tsx). Declared once, above BOTH of its
  // consumers below (the skill_id_map keys and the CustomCategory name),
  // because they must produce byte-identical display names -- Skills.tsx
  // looks a skill's id up as `skill_id_map[\`${category.name}:${skill}\`]`,
  // so any divergence between "the name a category is stored/displayed
  // under" and "the name its id-map entries are keyed under" makes every
  // lookup miss and silently falls back to using the skill's own NAME as
  // its "id" (see onRemoveSkill in Skills.tsx) -- which then 404s against
  // the backend. This exact drift is what broke deleting from "Programming
  // Languages": this map used the generic (singular) title-casing while
  // customCategoriesFromLlm's name already had the override applied.
  const CATEGORY_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    programming_language: "Programming Languages",
    ci_cd: "CI/CD",
    ai_ml: "AI/ML",
  };
  const categoryDisplayName = (cat: string): string => {
    const normalizedCategory = cat.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return CATEGORY_DISPLAY_NAME_OVERRIDES[normalizedCategory] ||
      cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // enhanced_data: technical_skills is a flat array of {skill, category} objects
  // It lives in llm_data.technical_skills OR top-level p.technical_skills (both are the same data)
  const llmTechArr = arr<AnyRecord>(
    llm.technical_skills ||
    (Array.isArray(p.technical_skills) ? p.technical_skills : null)
  );
  const llmByCategory: Record<string, string[]> = {};
  // skill_id_map from flat technical_skills array: keyed as "DisplayName:SkillName"
  const llmSkillIdMap: Record<string, string> = {};
  for (const s of llmTechArr) {
    const cat = str(s.category);
    const skill = str(s.skill);
    if (cat && skill) {
      if (!llmByCategory[cat]) llmByCategory[cat] = [];
      llmByCategory[cat].push(skill);
      // Store both raw key and display-name key so Skills.tsx lookup always hits
      if (s.id) {
        const displayName = categoryDisplayName(cat);
        llmSkillIdMap[`${cat}:${skill}`] = str(s.id);
        llmSkillIdMap[`${displayName}:${skill}`] = str(s.id);
      }
    }
  }
  // llm_data.technical_skills and top-level p.technical_skills start as the
  // same content, but the enhancer's _ensure_enhanced_item_ids only ever
  // stamps a stable `id` onto the TOP-LEVEL copy -- it never reaches into
  // llm_data. llmTechArr above prefers llm_data.technical_skills whenever
  // present, so a resume that has both ends up reading the id-less copy:
  // skill_id_map comes out empty for every parser-extracted skill, and
  // deleting one falls back to sending the skill's own NAME as its "id"
  // (see onRemoveSkill in Skills.tsx), which the backend's by-id delete
  // endpoint always 400s on. Backfill ids from the top-level copy, matched
  // by category+name, for any entry the loop above missed one for.
  if (llm.technical_skills && Array.isArray(p.technical_skills)) {
    for (const s of p.technical_skills as AnyRecord[]) {
      const cat = str(s.category);
      const skill = str(s.skill) || str(s.name);
      if (!cat || !skill || !s.id) continue;
      const displayName = categoryDisplayName(cat);
      const rawKey = `${cat}:${skill}`;
      const displayKey = `${displayName}:${skill}`;
      if (!llmSkillIdMap[rawKey]) llmSkillIdMap[rawKey] = str(s.id);
      if (!llmSkillIdMap[displayKey]) llmSkillIdMap[displayKey] = str(s.id);
    }
  }

  // p.skills is the backend's own CRUD-managed structure for the enhancer's
  // by-id skill endpoints (add_skill_to_enhanced / delete / rename): a dict
  // keyed by the 5 fixed category keys (programming_languages, frameworks,
  // soft_skills, project_management, marketing_sales) plus custom_skills (a
  // dict keyed by slug), each holding a list of {id, name} skill objects.
  // A skill added through "Add Skill" is written HERE by the backend, but
  // this mapper previously never read this shape at all -- only
  // p.categorizedSkills.custom_categories (the array shape) and the flat
  // p.technical_skills array -- so a manually-added skill was genuinely
  // persisted (confirmed by the backend's own duplicate-name check
  // rejecting a second add) yet never appeared in the UI after a reload.
  const skillsDict: AnyRecord =
    typeof p.skills === "object" && p.skills !== null && !Array.isArray(p.skills)
      ? (p.skills as AnyRecord)
      : {};
  const mergeSkillListIntoCategory = (categoryKey: string, list: unknown): void => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const skillName = typeof item === "string" ? item : str((item as AnyRecord)?.name);
      if (!skillName) continue;
      if (!llmByCategory[categoryKey]) llmByCategory[categoryKey] = [];
      llmByCategory[categoryKey].push(skillName);
      const itemId = typeof item === "object" && item !== null ? (item as AnyRecord).id : undefined;
      if (itemId) {
        const displayName = categoryDisplayName(categoryKey);
        llmSkillIdMap[`${categoryKey}:${skillName}`] = str(itemId);
        llmSkillIdMap[`${displayName}:${skillName}`] = str(itemId);
      }
    }
  };
  for (const fixedKey of [
    "programming_languages", "frameworks", "soft_skills",
    "project_management", "marketing_sales",
  ]) {
    mergeSkillListIntoCategory(fixedKey, skillsDict[fixedKey]);
  }
  const customSkillsDict = skillsDict.custom_skills || skillsDict.customSkills;
  if (customSkillsDict && typeof customSkillsDict === "object" && !Array.isArray(customSkillsDict)) {
    for (const [slug, list] of Object.entries(customSkillsDict as AnyRecord)) {
      mergeSkillListIntoCategory(slug, list);
    }
  }

  // Every LLM-assigned category becomes a named CustomCategory — the
  // predefined buckets (categorizedSkills.programming_languages/frameworks/
  // soft_skills/...) are always left empty (see below) and nothing else
  // populates them, so a category excluded here from becoming a custom
  // category would simply vanish. This used to filter out categories
  // ("programming_language", "framework", "soft_skill", ...) meant for
  // those predefined buckets, from back when they were actually populated.
  // "programming_language" is the AI service's canonical, frequently-hit
  // category slug (careerbot-ai normalizes "languages"/"programming_languages"/
  // "scripting"/etc. all into it), so it hit this gap on almost every resume
  // that had any — while other stale entries in that filter rarely matched
  // the AI's actual emitted slugs, which is why only Programming Languages
  // was reported missing and not the rest.
  const unmappedByCategory: Record<string, string[]> = { ...llmByCategory };
  const customCategoriesFromLlm: CustomCategory[] = Object.entries(unmappedByCategory).map(
    ([cat, catSkillsList]) => ({
      id: Math.random().toString(36).slice(2, 10),
      name: categoryDisplayName(cat),
      skills: catSkillsList,
    })
  );

  /* ── Personal Info ── */
  const fullname =
    str(contact.name) ||
    str(contact.full_name) ||
    str(llm.personal_info?.name) ||
    str(piCamel.fullname) ||
    "";

  const email =
    str(contact.email) ||
    str(llm.personal_info?.email) ||
    str(piCamel.email) ||
    "";

  const phone =
    str(contact.phone) ||
    str(contact.phone_number) ||
    str(llm.personal_info?.phone) ||
    str(piCamel.phone) ||
    "";

  const location =
    str(contact.location) ||
    str(contact.address) ||
    str(llm.personal_info?.location) ||
    str(piCamel.location) ||
    "";

  const extractSocialUrl = (v: unknown): string =>
    typeof v === "object" && v !== null ? str((v as AnyRecord).url) : str(v);

  const linkedinUrl =
    extractSocialUrl(social.linkedin) ||
    str(contact.linkedin) ||
    str(contact.linkedin_url) ||
    str(piCamel.linkedinUrl) ||
    "";

  const githubUrl =
    extractSocialUrl(social.github) ||
    str(contact.github) ||
    str(contact.github_url) ||
    str(piCamel.githubUrl) ||
    "";

  const portfolioRaw = social.portfolio;
  const portfolioUrl =
    (Array.isArray(portfolioRaw)
      ? extractSocialUrl(portfolioRaw[0])
      : extractSocialUrl(portfolioRaw)) ||
    str(contact.portfolio) ||
    str(contact.website) ||
    str(piCamel.portfolioUrl) ||
    str(piCamel.portifolioUrl) ||
    "";

  /* ── Professional Summary ── */
  // enhanced_resume returns professionalSummary as { summary, targetRole } object
  const profSumRaw = p.professionalSummary;
  const summaryText =
    (typeof profSumRaw === "object" && profSumRaw !== null
      ? str((profSumRaw as AnyRecord).summary)
      : str(profSumRaw)) ||
    str(p.summary) ||
    str(llm.summary) ||
    str(p.professional_summary) ||
    "";
  const targetRole =
    (typeof profSumRaw === "object" && profSumRaw !== null
      ? str((profSumRaw as AnyRecord).targetRole)
      : "") || "";

  /* ── Work Experience ── */
  const workExperience = arr<AnyRecord>(
    p.workExperience ||
    p.work_experience ||
    p.experience ||
    p.professional_experience ||
    llm.experience
  ).map((exp) => {
    // A missing end date is unknown; only an explicit current flag or Present means active.
    const isCurrent = Boolean(
      exp.is_current ||
      exp.currently_working ||
      exp.currentlyWorking ||
      str(exp.end_date || exp.endDate).toLowerCase() === "present"
    );
    return {
      ...mappedId(exp),
      company: str(exp.company) || str(exp.organization),
      role: str(exp.role) || str(exp.title) || str(exp.position),
      location: str(exp.location),
      startDate: str(exp.start_date) || str(exp.from) || str(exp.startDate),
      endDate: str(exp.end_date) || str(exp.to) || str(exp.endDate) || (isCurrent ? "Present" : ""),
      currentlyWorking: isCurrent,
      description:
        [
          ...bulletTexts(exp.key_contributions),
          ...bulletTexts(exp.achievements),
          ...bulletTexts(exp.responsibilities),
          ...bulletTexts(exp.contributions),
        ].join("\n") ||
        str(exp.description),
      technologies: strArr(exp.technologies) || [],
    };
  });

  /* ── Education ── */
  const education = arr<AnyRecord>(
    p.education || p.educational_qualifications || llm.education
  ).map((edu) => {
    // Parse start/end dates from "Jun 2020 – May 2022" when explicit fields are absent
    const durationStr = str(edu.duration);
    const durationParts = durationStr ? durationStr.split(/\s*[–—-]\s*/) : [];
    const startFromDuration = durationParts[0]?.trim() || "";
    const endFromDuration = durationParts[1]?.trim() || "";
    // Prefer builder fields because they contain the latest user edit. Parser
    // aliases are fallbacks for a resume that has never been edited.
    const rawScoreValue =
      str(edu.scoreValue) || str(edu.score_value) || str(edu.percentage) ||
      str(edu.cgpa) || str(edu.gpa) || str(edu.gpa_value) || str(edu.grade);
    const scoreType = inferEducationScoreType(edu, rawScoreValue);
    // Percentage is stored canonically without its display suffix. Keeping the
    // symbol in both scoreValue and the renderer caused values like "90%%".
    const scoreValue = scoreType === "Percentage"
      ? rawScoreValue.replace(/\s*(?:%|percent(?:age)?)\s*$/i, "").trim()
      : rawScoreValue;
    return {
      ...mappedId(edu),
      school:
        str(edu.school) ||
        str(edu.institution) ||
        str(edu.university) ||
        str(edu.college),
      // "M.Sc." + "Software Engineering" -> "M.Sc. Software Engineering".
      // mergeEducationDegree, not a plain join: once saved back as `degree`,
      // a reload still carrying the branch alias would append it again
      // ("M.Sc. Software Engineering Software Engineering").
      degree: mergeEducationDegree(
        str(edu.degree) || str(edu.qualification) || str(edu.program),
        str(edu.branch) || str(edu.field_of_study) || str(edu.specialization),
      ),
      startDate: str(edu.startDate) || str(edu.start_date) || str(edu.from) || startFromDuration,
      endDate:
        str(edu.endDate) ||
        str(edu.end_date) ||
        str(edu.to) ||
        endFromDuration,
      scoreType,
      scoreValue,
    };
  });

  /* ── Projects ── */
  const projects = arr<AnyRecord>(
    p.projects || p.project_details || llm.projects
  ).map((proj) => ({
    ...mappedId(proj),
    title: str(proj.name) || str(proj.title) || str(proj.projectName),
    description:
      str(proj.description) ||
      str(proj.summary) ||
      [
        ...bulletTexts(proj.key_contributions),
        ...bulletTexts(proj.achievements),
        ...bulletTexts(proj.contributions),
        ...bulletTexts(proj.responsibilities),
      ].join("\n") ||
      "",
    technologies:
      strArr(proj.technologies).length > 0
        ? strArr(proj.technologies)
        : strArr(proj.tech_stack).length > 0
        ? strArr(proj.tech_stack)
        : strArr(proj.techStack).length > 0
        ? strArr(proj.techStack)
        : strArr(proj.tools),
    startDate: str(proj.start_date) || str(proj.from) || str(proj.date) || str(proj.period) || str(proj.startDate),
    endDate: str(proj.end_date) || str(proj.to) || str(proj.endDate),
    link: str(proj.url) || str(proj.link),
  }));

  /* ── Internships ── */
  const internships = arr<AnyRecord>(p.internships || llm.internships).map((intern) => {
    const isCurrentIntern = Boolean(
      intern.is_current ||
      intern.currently_working ||
      intern.currentlyWorking ||
      str(intern.end_date || intern.endDate).toLowerCase() === "present"
    );
    return {
      ...mappedId(intern),
      company: str(intern.company) || str(intern.organization),
      role: str(intern.role) || str(intern.title),
      location: str(intern.location),
      startDate: str(intern.start_date) || str(intern.from) || str(intern.startDate),
      endDate: str(intern.end_date) || str(intern.to) || str(intern.endDate) || (isCurrentIntern ? "Present" : ""),
      currentlyWorking: isCurrentIntern,
      description:
        [
          ...bulletTexts(intern.key_contributions),
          ...bulletTexts(intern.achievements),
          ...bulletTexts(intern.responsibilities),
          ...bulletTexts(intern.contributions),
        ].join("\n") ||
        str(intern.description),
      technologies: strArr(intern.technologies) || [],
    };
  });

  /* ── Skills ── */
  // All call sites receive enhanced/parser output — skills arrive as custom_categories.
  // Predefined buckets are left empty; everything lands in custom_categories for display.
  //
  // soft_skills is sourced differently: unlike programming languages/frameworks/etc.
  // (which the AI tags inside technical_skills[].category and land in
  // customCategoriesFromLlm above), the AI service returns soft_skills as its own
  // dedicated top-level array field, so it has to be read directly here. It still
  // needs to end up in custom_categories, NOT categorizedSkills.soft_skills (the
  // predefined bucket) — Skills.tsx hides every predefined-bucket category card
  // for enhanced resumes (`!isEnhancedResume && SKILL_CATEGORIES...`), same as it
  // does for the other four. Putting it in the predefined bucket made it render
  // fine in the read-only Preview (which doesn't care where it lives) but gave it
  // no editable UI at all in the Enhancer's Skills modal.
  // catSkills.soft_skills (the camelCase enhanced_resume shape) is checked first
  // so a previously-saved manual addition round-trips on reload; p.soft_skills /
  // llm.soft_skills cover the fresh-parser-output shape. Entries can be plain
  // strings or { skill } objects (skill_dedup.py's normalize_soft_skills_list
  // emits both, see careerbot-ai) — strArr() already handles that shape.
  const softSkillsSource: unknown =
    strArr(catSkills.soft_skills).length > 0
      ? catSkills.soft_skills
      : strArr(p.soft_skills).length > 0
      ? p.soft_skills
      : llm.soft_skills;
  const softSkills = strArr(softSkillsSource);
  // strArr() above only extracts each entry's display name -- any `id` the
  // AI service's v2.5 evidence-shaped items carry ({name, evidence_count,
  // evidence_sections}) is silently dropped. Without it, Skills.tsx's
  // "Soft Skills" custom-category delete handler has nothing to send and
  // falls back to bailing out entirely (see its onRemoveSkill guard) --
  // which is exactly the "parser soft skills can't be deleted" bug when
  // this is the source they come from (there are three: this field,
  // technical_skills/llm_data.technical_skills, and the categorized skills
  // dict -- see resumeMappers.test.ts and service.py's
  // _ensure_enhanced_item_ids for the other two). Read the id from the same
  // raw source array `softSkills` was just derived from, so the name and id
  // can never come from two different (and possibly inconsistent) sources.
  if (Array.isArray(softSkillsSource)) {
    for (const item of softSkillsSource as AnyRecord[]) {
      if (typeof item !== "object" || item === null) continue;
      const name = str(item.name || item.skill);
      if (name && item.id) {
        llmSkillIdMap[`Soft Skills:${name}`] = str(item.id);
      }
    }
  }
  // Synthesize a "Soft Skills" custom category whenever there's data for it.
  // The merge below (by category name) makes this safe to always push --
  // if it also already round-tripped into catSkills.custom_categories from
  // a prior save, the two get combined (skills deduped by name) instead of
  // producing two separate "Soft Skills" cards.
  if (softSkills.length > 0) {
    customCategoriesFromLlm.push({
      id: Math.random().toString(36).slice(2, 10),
      name: "Soft Skills",
      skills: softSkills,
    });
  }

  // catSkills.custom_categories (round-tripped from a prior save) and
  // customCategoriesFromLlm (freshly derived from technical_skills /
  // p.skills / p.soft_skills above) are NOT alternatives for the same data
  // -- a skill added through the single-skill "Add Skill" endpoint only
  // ever touches p.skills, never categorizedSkills.custom_categories, so
  // picking one array over the other (the previous behavior) silently
  // dropped whichever source wasn't chosen. Merge by category name instead,
  // combining skill lists (deduped case-insensitively) when both sources
  // have an entry for the same category.
  const mergedCustomCategories: CustomCategory[] = (() => {
    const existing = Array.isArray(catSkills.custom_categories)
      ? (catSkills.custom_categories as CustomCategory[])
      : [];
    const byName = new Map<string, CustomCategory>();
    for (const cat of existing) {
      byName.set(cat.name, { ...cat, skills: [...(cat.skills || [])] });
    }
    for (const cat of customCategoriesFromLlm) {
      const match = byName.get(cat.name);
      if (!match) {
        byName.set(cat.name, cat);
        continue;
      }
      const seenLower = new Set(match.skills.map((s) => s.toLowerCase()));
      for (const skill of cat.skills) {
        if (!seenLower.has(skill.toLowerCase())) {
          match.skills.push(skill);
          seenLower.add(skill.toLowerCase());
        }
      }
    }
    return Array.from(byName.values());
  })();

  const categorizedSkills: CategorizedSkills = {
    programming_languages: [],
    frameworks: [],
    soft_skills: [],
    project_management: [],
    marketing_sales: [],
    custom_categories: mergedCustomCategories.length > 0 ? mergedCustomCategories : undefined,
    ...(Object.keys(llmSkillIdMap).length > 0 && { skill_id_map: llmSkillIdMap }),
  };

  // Flat skills array: all skills come from custom_categories
  const flatFromCategorized = [
    ...(categorizedSkills.custom_categories || []).flatMap((c) => c.skills),
  ];
  const skills: string[] =
    Array.isArray(p.skills) && strArr(p.skills).length > 0
      ? strArr(p.skills)
      : flatFromCategorized;

  /* ── Certifications ── */
  // enhanced_data.certifications may be all-empty objects (backend issue).
  // Fall back through: llm.certifications → p.certifications (if has real content)
  // → enhancer_state.resume.certifications (parser format, always has real data)
  const hasCertContent = (list: AnyRecord[]): boolean =>
    list.some((c) => str(c.full_name) || str(c.name) || str(c.certification) || str(c.title));

  const enhancerStateCerts = arr<AnyRecord>(
    (p.enhancer_state as AnyRecord)?.resume?.certifications
  );

  const rawCerts: AnyRecord[] =
    hasCertContent(arr<AnyRecord>(p.certifications))
      ? arr<AnyRecord>(p.certifications)
      : hasCertContent(arr<AnyRecord>(p.certificates))
      ? arr<AnyRecord>(p.certificates)
      : arr<AnyRecord>(llm.certifications).filter((c) => str(c.full_name) || str(c.name)).length > 0
      ? arr<AnyRecord>(llm.certifications)
      : enhancerStateCerts;

  // p.certifications may be in builder format (issuer field) — used as cross-source fallback
  // when rawCerts comes from llm_data and is missing issuer/date fields
  const pCertsArr = arr<AnyRecord>(p.certifications);

  const certifications = rawCerts.map((cert) => {
    const certName = str(cert.full_name) || str(cert.name) || str(cert.certification) || str(cert.title);
    // Find matching entry in p.certifications by name (case-insensitive) for issuer fallback
    const pMatch = pCertsArr.find((c) => {
      const n = str(c.name) || str(c.full_name) || str(c.certification) || str(c.title);
      return n && n.toLowerCase() === certName.toLowerCase();
    }) as AnyRecord | undefined;

    return {
      ...mappedId(cert),
      name: certName,
      issuer:
        str(cert.issuing_organization) ||
        str(cert.issued_by) ||
        str(cert.organization) ||
        str(cert.issuer) ||
        str(cert.issuedBy) ||
        str(pMatch?.issuedBy) ||
        str(pMatch?.issuer) ||
        str(pMatch?.issuing_organization),
      year:
        str(cert.year) || str(pMatch?.year),
      issueDate:
        str(cert.issueDate) || str(cert.year) || str(cert.date) ||
        str(pMatch?.issueDate) || str(pMatch?.date) || str(pMatch?.year),
      expiryDate:
        str(cert.expiry_date) || str(cert.expiry) || str(cert.expiryDate) ||
        str(pMatch?.expiryDate) || str(pMatch?.expiry_date),
      credentialId:
        str(cert.credential_id) || str(cert.credentialId) ||
        str(pMatch?.credentialId) || str(pMatch?.credential_id),
    };
  });

  /* ── Achievements ── */
  // The AI parser returns achievements as plain strings (e.g. "Niper JEE
  // 2025.") for most resumes, not { title, date, description } objects.
  // Treating every entry as an object meant ach.title/.date/.description
  // were all undefined -- the array length (and so the section) still
  // showed up, but every entry rendered with blank fields. Handle both
  // shapes, same pattern as bulletTexts() above.
  const achievements = arr<AnyRecord | string>(llm.achievements || p.achievements).map((ach) => {
    if (typeof ach === "string") {
      return { title: ach.trim(), date: "", description: "" };
    }
    return {
      ...mappedId(ach),
      title: str(ach.title) || str(ach.achievement) || str(ach.name),
      date: str(ach.date) || str(ach.year),
      description: str(ach.description),
    };
  });

  /* ── Volunteering ── */
  const volunteering = arr<AnyRecord>(p.volunteering || llm.volunteering).map((vol) => ({
    ...mappedId(vol),
    organization: str(vol.organization),
    role: str(vol.role) || str(vol.position),
    startDate: str(vol.start_date) || str(vol.from) || str(vol.startDate),
    endDate: str(vol.end_date) || str(vol.to) || str(vol.endDate),
  }));

  /* ── Awards ── */
  const awards = arr<AnyRecord>(p.awards || llm.awards).map((awd) => ({
    ...mappedId(awd),
    title: str(awd.title) || str(awd.name) || str(awd.award),
    issuedBy: str(awd.issued_by) || str(awd.organization) || str(awd.issuer) || str(awd.issuedBy),
    year: str(awd.year) || str(awd.date),
  }));

  /* ── Languages ── */
  const languages = arr<AnyRecord>(p.languages || p.languages_known || llm.languages).map(
    (lang) => {
      if (typeof lang === "string") return { name: lang, proficiency: "" };
      return {
        ...mappedId(lang),
        name: str(lang.name) || str(lang.language),
        proficiency: str(lang.proficiency) || str(lang.level),
      };
    }
  );

  /* ── Hobbies ── */
  const hobbies = arr<AnyRecord>(p.hobbies || llm.hobbies).map((h) => ({
    ...mappedId(h),
    name: str(h.name) || str(h.hobby),
    description: str(h.description),
  }));

  /* ── Interests ── */
  const interests = arr<AnyRecord>(p.interests || llm.interests).map((i) => ({
    ...mappedId(i),
    name: str(i.name) || str(i.interest),
    description: str(i.description),
    category: str(i.category),
  }));

  /* ── Publications ── */
  const publications = arr<AnyRecord>(p.publications || llm.publications).map((pub) => ({
    ...mappedId(pub),
    title: str(pub.title),
    authors: str(pub.authors),
    publicationName:
      str(pub.publication_name) ||
      str(pub.publicationName) ||
      str(pub.journal) ||
      str(pub.publisher) ||
      str(pub.venue),
    date: str(pub.date) || str(pub.year),
    url: str(pub.url) || str(pub.link),
    doi: str(pub.doi),
  }));

  /* ── Patents ── */
  const patents = arr<AnyRecord>(p.patents || llm.patents).map((pat) => ({
    ...mappedId(pat),
    title: str(pat.title),
    patentNumber: str(pat.patent_number) || str(pat.patentNumber),
    status: str(pat.status),
    date: str(pat.date) || str(pat.year),
    description: str(pat.description),
  }));

  /* ── References ── */
  const references = arr<AnyRecord>(p.references || llm.references).map((ref) => ({
    ...mappedId(ref),
    name: str(ref.name),
    relation: str(ref.relation) || str(ref.designation) || str(ref.title),
    contact: str(ref.contact) || str(ref.email) || str(ref.phone),
  }));

  return {
    personalInfo: {
      fullname,
      email,
      countryCode: str(piCamel.countryCode) || "+91",
      phone,
      location,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
    },
    professionalSummary: {
      summary: summaryText,
      targetRole,
    },
    workExperience,
    education,
    projects,
    internships,
    skills,
    categorizedSkills,
    certifications,
    achievements,
    volunteering,
    awards,
    languages,
    hobbies,
    interests,
    publications,
    patents,
    references,
    declaration: typeof p.declaration === 'string' ? str(p.declaration) : (typeof p.declaration === 'object' && p.declaration !== null && 'text' in p.declaration ? str((p.declaration as Record<string, unknown>).text) : str(llm.declaration)),
    declarationDate: str(p.declarationDate || p.declaration_date || llm.declarationDate || llm.declaration_date),
    declarationPlace: str(p.declarationPlace || p.declaration_place || llm.declarationPlace || llm.declaration_place),
    customSections: buildCustomSections(p, llm),
    coreCompetenciesDismissed: p.coreCompetenciesDismissed === true || p.core_competencies_dismissed === true,
  };
}

// ── Keys already handled as standard sections ──────────────────────────────
const STANDARD_MAPPED_KEYS = new Set([
  "summary", "professional_summary",
  "technical_skills", "soft_skills",
  "experience", "work_experience",
  "education",
  "projects",
  "certifications", "certificates",
  "achievements",
  "volunteering",
  "internships",
  "awards",
  "hobbies", "hobbies_and_interests", "interests",
  "languages", "languages_known",
  "publications",
  "patents",
  "references",
  "declaration", "declaration_date", "declaration_place",
  "contact", "personal_info", "social_links",
]);

// ── Structural / metadata keys that should never become custom sections ─────
const SKIP_KEYS = new Set([
  "llm_data", "section_metadata", "format_analysis", "contact_signals",
  "summary_analysis", "enhancer_state", "image_warning", "image_message",
  "headline", "personal_details", "tokens_used",
  "strategy_used", "user_id", "correlation_id", "trace_id",
]);

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function toCustomFields(data: unknown, sectionName: string): CustomField[] {
  // String value
  if (typeof data === "string" && data.trim()) {
    return [{ id: uid(), fieldName: sectionName, fieldType: "textarea", value: data.trim() }];
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  // Array of plain strings → list field
  if (data.every((item) => typeof item === "string")) {
    const values = (data as string[]).map((s) => s.trim()).filter(Boolean);
    if (values.length === 0) return [];
    return [{ id: uid(), fieldName: sectionName, fieldType: "list", value: values }];
  }

  // Array of objects → extract meaningful text per item into a list
  const items = data as AnyRecord[];
  const texts = items
    .map((item) => {
      if (typeof item !== "object" || item === null) return "";
      return (
        str(item.name) ||
        str(item.title) ||
        str(item.description) ||
        str(item.skill) ||
        str(item.value) ||
        str(item.competency) ||
        str(item.strength) ||
        // fallback: join all non-empty string values
        Object.values(item)
          .filter((v) => typeof v === "string" && (v as string).trim())
          .join(", ")
      );
    })
    .filter(Boolean);

  if (texts.length === 0) return [];
  return [{ id: uid(), fieldName: sectionName, fieldType: "list", value: texts }];
}

// A label sentence in the AI service's "Label. Elaboration." convention
// (e.g. "Backend Engineering at Scale.", "Event-Driven Messaging.") reads as
// a short noun/gerund phrase, unlike the elaboration sentence that follows
// it. Scanning for "starts with capitalized words, then a period" anywhere
// in the text doesn't work as a boundary marker: a label's OWN final word is
// itself capitalized and directly precedes that same period (e.g. "...at
// Scale."), so it matches the same shape and gets misread as a second, new
// label -- chopping one label into pieces. Word count doesn't have that
// problem, since it only judges each already-delimited sentence as a whole.
const MAX_LABEL_WORDS = 6;

// Words that stay lowercase inside an otherwise title-cased label
// ("Backend Engineering at Scale.", "Design of Distributed Systems.").
const LABEL_LOWERCASE_WORDS = new Set([
  "a", "an", "and", "as", "at", "across", "by", "for", "from", "in", "into",
  "of", "on", "or", "per", "the", "to", "via", "with",
]);

/**
 * True when a sentence reads like a Title-Cased label rather than prose: every
 * word either starts with a capital/digit or is one of the small lowercase
 * connector words above. "Event-Driven Messaging." passes; "Delivered systems."
 * does not, because "systems" is lowercase and is not a connector.
 */
function looksLikeLabelCase(sentence: string): boolean {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  return words.every((word, idx) => {
    const core = word.replace(/^[^\p{L}\p{N}]+/u, "");
    if (!core) return true;
    if (idx > 0 && LABEL_LOWERCASE_WORDS.has(core.replace(/[^\p{L}]/gu, "").toLowerCase())) return true;
    return /^[\p{Lu}\p{N}]/u.test(core);
  });
}

/**
 * Splits flattened text into sentences on "period + whitespace", re-attaching
 * the period each split consumed. A period that terminates a single-letter
 * token is an abbreviation, not a sentence end, so "U.S. Market Expansion."
 * stays one sentence instead of becoming "U.S." plus "Market Expansion.".
 */
function splitIntoSentences(flattened: string): string[] {
  const sentences: string[] = [];
  const boundary = /\.\s+/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(flattened)) !== null) {
    if (isAbbreviationPeriod(flattened, match.index)) continue;
    const sentence = flattened.slice(start, match.index + 1).trim();
    if (sentence) sentences.push(sentence);
    start = match.index + match[0].length;
  }
  const tail = flattened.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

function splitOnRepeatingLabel(text: string): string[] | null {
  const flattened = text.replace(/\s+/g, " ").trim();
  if (!flattened) return null;
  const sentences = splitIntoSentences(flattened);
  if (sentences.length < 2) return null;

  // Each group is one competency: its label sentence plus the elaboration
  // sentences that follow it. Word count ALONE cannot decide where the next
  // label starts -- an elaboration shorter than MAX_LABEL_WORDS
  // ("Delivered systems.") scores as a label and chops one competency into
  // two. A short sentence therefore only starts a new group when it also
  // reads like a label (Title Case), or when the current group already has
  // its own label plus at least one elaboration sentence.
  const groups: string[][] = [];
  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    const current = groups[groups.length - 1];
    const startsNewGroup =
      !current ||
      (wordCount <= MAX_LABEL_WORDS && (looksLikeLabelCase(sentence) || current.length >= 2));
    if (startsNewGroup) groups.push([sentence]);
    else current.push(sentence);
  }
  return groups.length > 1 ? groups.map((group) => group.join(" ")) : null;
}

/**
 * Splits a single raw core_competencies string into individual point
 * strings. Text extracted from a source document (or generated with a fixed
 * line width) sometimes carries word-wrap line breaks that land mid-sentence
 * rather than between competencies -- naively splitting on every "\n" turns
 * one point like "...for high-volume enterprise\nsystems." into two bogus
 * fragments ("...enterprise" and "systems."), the second of which then gets
 * misread as its own short label. Prefer the "Label." pattern itself (a
 * real repeating structure) over raw whitespace as the boundary whenever it
 * repeats; only fall back to newline/delimiter splitting for resumes that
 * list competencies as short keyword-style phrases with no such pattern.
 */
function splitCompetencyText(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (/\n\s*\n/.test(trimmed)) {
    return trimmed.split(/\n\s*\n/).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  const labeled = splitOnRepeatingLabel(trimmed);
  if (labeled) return labeled;

  if (trimmed.includes("\n")) return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
  const flattened = trimmed.replace(/\s+/g, " ").trim();
  if (/\s\|\s/.test(flattened)) return flattened.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
  if (flattened.includes(";")) return flattened.split(";").map((s) => s.trim()).filter(Boolean);
  return [flattened];
}

/**
 * Splits raw core_competencies data into individual point strings, always
 * returning a real array so downstream rendering can show one bullet per
 * point. Some resumes return this as a single delimited string instead of
 * a pre-split array (e.g. one achievement-style paragraph, or a "|"/";"
 * separated line) -- left as one string, it would render as a single blob
 * instead of separate points.
 */
function splitIntoPoints(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[]).flatMap((item) => {
      const text =
        typeof item === "string"
          ? item
          : typeof item === "object" && item !== null
          ? str(
              (item as AnyRecord).text ||
              (item as AnyRecord).competency ||
              (item as AnyRecord).name ||
              (item as AnyRecord).title
            )
          : "";
      if (!text.trim()) return [];
      // Each array entry is trusted as its own point -- only re-split it if
      // it internally repeats the "Label." pattern (a single entry that's
      // actually several competencies concatenated together). Otherwise
      // keep it exactly as given (just whitespace-flattened) so short
      // keyword-style items with no period are never merged with neighbors.
      return splitOnRepeatingLabel(text) || [text.replace(/\s+/g, " ").trim()];
    });
  }
  if (typeof raw === "string") return splitCompetencyText(raw);
  return [];
}

function buildCustomSections(p: AnyRecord, llm: AnyRecord = {}): CustomSection[] {
  // A saved builder/enhanced resume owns this collection. In particular, an
  // explicit [] means the user deleted every custom section and must not fall
  // back to stale parser metadata on refresh.
  const persistedSections = Array.isArray(p.customSections)
    ? p.customSections
    : Array.isArray(p.custom_sections)
      ? p.custom_sections
      : undefined;

  // Headings the parser mapped to core_competencies ("Key Competencies", ...).
  // A section saved under one of them before the source tag existed holds the
  // same points, so it is tagged and the synthesis below adds no second copy.
  const coreCompetencyHeadings = new Set(
    (Array.isArray(p.section_metadata) ? (p.section_metadata as AnyRecord[]) : [])
      .filter(meta => str(meta?.mapped_to) === "core_competencies")
      .map(meta => normalizeCustomSectionName(str(meta.original_name))),
  );

  let sections: CustomSection[];
  if (persistedSections) {
    sections = persistedSections.flatMap((rawSection, sectionIndex): CustomSection[] => {
      if (!rawSection || typeof rawSection !== "object") return [];
      const section = rawSection as AnyRecord;
      const sectionName = str(section.sectionName || section.section_name);
      if (!sectionName) return [];

      // The builder stores the exact named fields alongside the export-oriented
      // `items` projection. Prefer them so list values such as Java/Python/
      // Playwright remain editable after a refresh.
      const persistedFields = Array.isArray(section.fields)
        ? (section.fields as CustomField[])
        : [];
      const fields = persistedFields.length > 0
        ? persistedFields
        : toCustomFields(section.items || section.content, sectionName);

      // A field-less section is kept, not dropped: resumeApi.ts's
      // transformCustomSectionsForBackend persists a named section before it
      // has fields so the editor has a shell to add the first one to, and
      // dropping it here made that shell unreachable. Only this branch keeps
      // empties -- the parser fallback below still requires content.
      const isCoreCompetencies = section.source === "core_competencies"
        || coreCompetencyHeadings.has(normalizeCustomSectionName(sectionName))
        || (sectionName.trim().toLowerCase() === "core competencies"
          && splitIntoPoints(p.core_competencies || llm.core_competencies).length > 0);
      return [{
        id: str(section.id || section._id) || `custom_${sectionIndex}`,
        sectionName,
        fields,
        ...(isCoreCompetencies ? { source: "core_competencies" as const } : {}),
      }];
    });
  } else {
    // Parser metadata is a compatibility fallback for imported resumes that
    // predate persisted customSections. It is never allowed to override a saved
    // custom-section collection above.
    sections = [];
    const sectionMeta = Array.isArray(p.section_metadata)
      ? (p.section_metadata as AnyRecord[])
      : [];

    for (const meta of sectionMeta) {
      const originalName = typeof meta.original_name === "string" ? meta.original_name.trim() : "";
      const mappedTo = typeof meta.mapped_to === "string" ? meta.mapped_to.trim() : "";

      if (!originalName || !mappedTo) continue;
      if (STANDARD_MAPPED_KEYS.has(mappedTo)) continue;
      if (SKIP_KEYS.has(mappedTo)) continue;

      const sectionData = p[mappedTo];
      if (sectionData == null) continue;

      const fields = toCustomFields(sectionData, originalName);
      if (fields.length === 0) continue;

      // careerbot-ai maps a "Core Competencies" (or "Key Competencies")
      // heading to core_competencies. Tag it so the synthesis below sees the
      // section and does not add a second copy of the same points.
      sections.push({
        id: uid(),
        sectionName: originalName,
        fields,
        ...(mappedTo === "core_competencies" ? { source: "core_competencies" as const } : {}),
      });
    }
  }

  const coreCompetenciesRaw = p.core_competencies || llm.core_competencies;
  const coreCompetenciesPoints = splitIntoPoints(coreCompetenciesRaw);
  const coreCompetenciesDismissed = p.coreCompetenciesDismissed === true
    || p.core_competencies_dismissed === true;
  const hasCoreCompetencies = sections.some(section => section.source === "core_competencies");
  const legacyEmptyCollection = persistedSections !== undefined && persistedSections.length === 0;
  if (!coreCompetenciesDismissed && !legacyEmptyCollection && !hasCoreCompetencies && coreCompetenciesPoints.length > 0) {
    sections.push({
      id: uid(),
      sectionName: "Core Competencies",
      fields: [{ id: uid(), fieldName: "Core Competencies", fieldType: "list", value: coreCompetenciesPoints }],
      source: "core_competencies",
    });
  }

  return sections;
}
