// Maps resume parser output OR enhanced_resume response → builder ResumeData format.
// Handles both raw snake_case parser fields AND camelCase enhanced_resume fields.

import type { ResumeData, CategorizedSkills, CustomSection, CustomField, CustomCategory } from "@/app/(resume)/builder/creation/_context/ResumeContext";

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

  // enhanced_data: technical_skills is a flat array of {skill, category} objects
  // It lives in llm_data.technical_skills OR top-level p.technical_skills (both are the same data)
  const llmTechArr = arr<AnyRecord>(
    llm.technical_skills ||
    (Array.isArray(p.technical_skills) ? p.technical_skills : null)
  );
  const llmByCategory: Record<string, string[]> = {};
  for (const s of llmTechArr) {
    const cat = str(s.category);
    const skill = str(s.skill);
    if (cat && skill) {
      if (!llmByCategory[cat]) llmByCategory[cat] = [];
      llmByCategory[cat].push(skill);
    }
  }
  const llmCat = (...cats: string[]): string[] =>
    cats.flatMap((c) => llmByCategory[c] || []);

  // Categories that map to one of the 6 standard buckets
  const STANDARD_LLM_CATEGORIES = new Set([
    "programming_language", "frontend",
    "framework", "backend",
    "database",
    "tools", "tool",
    "cloud", "cloud_platform", "cloud_platforms",
    "soft_skill", "soft_skills",
  ]);

  // Skills in unmapped categories → auto-create named CustomCategory entries
  const unmappedByCategory: Record<string, string[]> = {};
  for (const [cat, catSkillsList] of Object.entries(llmByCategory)) {
    if (!STANDARD_LLM_CATEGORIES.has(cat)) {
      unmappedByCategory[cat] = catSkillsList;
    }
  }
  const customCategoriesFromLlm: CustomCategory[] = Object.entries(unmappedByCategory).map(
    ([cat, catSkillsList]) => ({
      id: Math.random().toString(36).slice(2, 10),
      name: cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
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

  const linkedinUrl =
    str(social.linkedin) ||
    str(contact.linkedin) ||
    str(contact.linkedin_url) ||
    str(piCamel.linkedinUrl) ||
    "";

  const githubUrl =
    str(social.github) ||
    str(contact.github) ||
    str(contact.github_url) ||
    str(piCamel.githubUrl) ||
    "";

  const portfolioRaw = social.portfolio;
  const portfolioUrl =
    (Array.isArray(portfolioRaw) ? str(portfolioRaw[0]) : str(portfolioRaw)) ||
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
    llm.experience ||
    p.work_experience ||
    p.experience ||
    p.professional_experience ||
    p.workExperience   // camelCase from enhanced_resume
  ).map((exp) => {
    // explicit null end_date from the enhancer API means currently working
    const isCurrent = Boolean(
      exp.is_current ||
      exp.currently_working ||
      exp.currentlyWorking ||
      exp.end_date === null ||
      str(exp.end_date || exp.endDate).toLowerCase() === "present"
    );
    return {
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
    };
  });

  /* ── Education ── */
  const education = arr<AnyRecord>(
    llm.education || p.education || p.educational_qualifications
  ).map((edu) => {
    // Parse start/end dates from "Jun 2020 – May 2022" when explicit fields are absent
    const durationStr = str(edu.duration);
    const durationParts = durationStr ? durationStr.split(/\s*[–—-]\s*/) : [];
    const startFromDuration = durationParts[0]?.trim() || "";
    const endFromDuration = durationParts[1]?.trim() || "";
    return {
      school:
        str(edu.institution) ||
        str(edu.school) ||
        str(edu.university) ||
        str(edu.college),
      // Combine degree + branch so "M.Sc." + "Software Engineering" → "M.Sc. Software Engineering"
      degree:
        [
          str(edu.degree) || str(edu.qualification) || str(edu.program),
          str(edu.branch) || str(edu.field_of_study) || str(edu.specialization),
        ]
          .filter(Boolean)
          .join(" ") || "",
      startDate: str(edu.start_date) || str(edu.from) || str(edu.startDate) || startFromDuration,
      endDate:
        str(edu.end_date) ||
        str(edu.to) ||
        str(edu.endDate) ||
        endFromDuration,
      scoreType: "CGPA" as const,
      scoreValue: str(edu.gpa) || str(edu.grade) || str(edu.percentage) || str(edu.scoreValue),
    };
  });

  /* ── Projects ── */
  const projects = arr<AnyRecord>(
    llm.projects || p.projects || p.project_details
  ).map((proj) => ({
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
  const internships = arr<AnyRecord>(llm.internships || p.internships).map((intern) => {
    const isCurrentIntern = Boolean(
      intern.is_current ||
      intern.currently_working ||
      intern.currentlyWorking ||
      intern.end_date === null ||
      str(intern.end_date || intern.endDate).toLowerCase() === "present"
    );
    return {
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
    };
  });

  /* ── Skills ── */
  // enhanced_data stores skills as p.skills = { programming_languages: [...], frameworks: [...] }
  // parser stores skills under p.technical_skills
  // enhanced_resume (camelCase) stores under p.categorizedSkills
  const skillsObj: AnyRecord =
    (typeof p.skills === "object" && !Array.isArray(p.skills) && p.skills !== null)
      ? (p.skills as AnyRecord)
      : {};

  const categorizedSkills: CategorizedSkills = {
    // programming_language + frontend (HTML/CSS/JS) both map here
    programming_languages:
      strArr(tech.programming_languages || tech.languages).length > 0
        ? strArr(tech.programming_languages || tech.languages)
        : strArr(catSkills.programming_languages).length > 0
        ? strArr(catSkills.programming_languages)
        : strArr(skillsObj.programming_languages).length > 0
        ? strArr(skillsObj.programming_languages)
        : llmCat("programming_language", "frontend"),
    // framework + backend (Node.js/Express) both map here
    frameworks:
      strArr(tech.frameworks || tech.libraries).length > 0
        ? strArr(tech.frameworks || tech.libraries)
        : strArr(catSkills.frameworks).length > 0
        ? strArr(catSkills.frameworks)
        : strArr(skillsObj.frameworks).length > 0
        ? strArr(skillsObj.frameworks)
        : llmCat("framework", "backend"),
    databases:
      strArr(tech.databases).length > 0
        ? strArr(tech.databases)
        : strArr(catSkills.databases).length > 0
        ? strArr(catSkills.databases)
        : strArr(skillsObj.databases).length > 0
        ? strArr(skillsObj.databases)
        : llmCat("database"),
    tools:
      strArr(tech.tools).length > 0
        ? strArr(tech.tools)
        : strArr(catSkills.tools).length > 0
        ? strArr(catSkills.tools)
        : strArr(skillsObj.tools).length > 0
        ? strArr(skillsObj.tools)
        : llmCat("tools", "tool"),
    cloud_platforms:
      strArr(tech.cloud_platforms || tech.cloud).length > 0
        ? strArr(tech.cloud_platforms || tech.cloud)
        : strArr(catSkills.cloud_platforms).length > 0
        ? strArr(catSkills.cloud_platforms)
        : strArr(skillsObj.cloud_platforms).length > 0
        ? strArr(skillsObj.cloud_platforms)
        : llmCat("cloud", "cloud_platform", "cloud_platforms"),
    soft_skills:
      strArr(p.soft_skills || tech.soft_skills).length > 0
        ? strArr(p.soft_skills || tech.soft_skills)
        : strArr(catSkills.soft_skills).length > 0
        ? strArr(catSkills.soft_skills)
        : strArr(skillsObj.soft_skills).length > 0
        ? strArr(skillsObj.soft_skills)
        : llmCat("soft_skill", "soft_skills"),
    // Prefer existing custom_categories (camelCase source), then auto-generate from unmapped llm categories
    custom_categories:
      Array.isArray(catSkills.custom_categories) && catSkills.custom_categories.length > 0
        ? (catSkills.custom_categories as CustomCategory[])
        : customCategoriesFromLlm.length > 0
        ? customCategoriesFromLlm
        : undefined,
  };

  // Flat skills array: prefer flat p.skills array, else build from categorized
  const flatFromCategorized = [
    ...categorizedSkills.programming_languages,
    ...categorizedSkills.frameworks,
    ...categorizedSkills.databases,
    ...categorizedSkills.tools,
    ...categorizedSkills.cloud_platforms,
    ...categorizedSkills.soft_skills,
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
    arr<AnyRecord>(llm.certifications).filter((c) => str(c.full_name) || str(c.name)).length > 0
      ? arr<AnyRecord>(llm.certifications)
      : hasCertContent(arr<AnyRecord>(p.certifications))
      ? arr<AnyRecord>(p.certifications)
      : hasCertContent(arr<AnyRecord>(p.certificates))
      ? arr<AnyRecord>(p.certificates)
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
      name: certName,
      issuer:
        str(cert.issuing_organization) ||
        str(cert.issued_by) ||
        str(cert.organization) ||
        str(cert.issuer) ||
        str(cert.issuedBy) ||
        str(pMatch?.issuer) ||
        str(pMatch?.issuedBy) ||
        str(pMatch?.issuing_organization),
      issueDate:
        str(cert.issueDate) || str(cert.year) || str(cert.date) ||
        str(pMatch?.issueDate) || str(pMatch?.date) || str(pMatch?.year),
      expiryDate:
        str(cert.expiry_date) || str(cert.expiry) || str(cert.expiryDate) ||
        str(pMatch?.expiryDate) || str(pMatch?.expiry_date),
      credentialId:
        str(cert.credential_id) || str(cert.credentialId) ||
        str(pMatch?.credentialId) || str(pMatch?.credential_id),
      credentialUrl:
        str(cert.credentialUrl) || str(cert.credential_url) ||
        str(pMatch?.credentialUrl) || str(pMatch?.credential_url),
    };
  });

  /* ── Achievements ── */
  const achievements = arr<AnyRecord>(llm.achievements || p.achievements).map((ach) => ({
    title: str(ach.title) || str(ach.achievement) || str(ach.name),
    date: str(ach.date) || str(ach.year),
    description: str(ach.description),
  }));

  /* ── Volunteering ── */
  const volunteering = arr<AnyRecord>(llm.volunteering || p.volunteering).map((vol) => ({
    organization: str(vol.organization),
    role: str(vol.role) || str(vol.position),
    startDate: str(vol.start_date) || str(vol.from) || str(vol.startDate),
    endDate: str(vol.end_date) || str(vol.to) || str(vol.endDate),
  }));

  /* ── Awards ── */
  const awards = arr<AnyRecord>(llm.awards || p.awards).map((awd) => ({
    title: str(awd.title) || str(awd.name) || str(awd.award),
    issuedBy: str(awd.issued_by) || str(awd.organization) || str(awd.issuer) || str(awd.issuedBy),
    year: str(awd.year) || str(awd.date),
  }));

  /* ── Languages ── */
  const languages = arr<AnyRecord>(llm.languages || p.languages || p.languages_known).map(
    (lang) => {
      if (typeof lang === "string") return { language: lang, proficiency: "" };
      return {
        language: str(lang.language) || str(lang.name),
        proficiency: str(lang.proficiency) || str(lang.level),
      };
    }
  );

  /* ── Hobbies ── */
  const hobbies = arr<AnyRecord>(llm.hobbies || p.hobbies).map((h) => ({
    name: str(h.name) || str(h.hobby),
    description: str(h.description),
  }));

  /* ── Interests ── */
  const interests = arr<AnyRecord>(llm.interests || p.interests).map((i) => ({
    name: str(i.name) || str(i.interest),
    description: str(i.description),
    category: str(i.category),
  }));

  /* ── Publications ── */
  const publications = arr<AnyRecord>(llm.publications || p.publications).map((pub) => ({
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
  }));

  /* ── References ── */
  const references = arr<AnyRecord>(llm.references || p.references).map((ref) => ({
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
    references,
    customSections: buildCustomSections(p),
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
  "references",
  "contact", "personal_info", "social_links",
]);

// ── Structural / metadata keys that should never become custom sections ─────
const SKIP_KEYS = new Set([
  "llm_data", "section_metadata", "format_analysis", "contact_signals",
  "summary_analysis", "enhancer_state", "image_warning", "image_message",
  "headline", "declaration", "personal_details", "tokens_used",
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

function buildCustomSections(p: AnyRecord): CustomSection[] {
  const customSections: CustomSection[] = [];
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

    customSections.push({ id: uid(), sectionName: originalName, fields });
  }

  return customSections;
}
