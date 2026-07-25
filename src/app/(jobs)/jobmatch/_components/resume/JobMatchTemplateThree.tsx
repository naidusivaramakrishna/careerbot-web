"use client";

import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import SafeHTML from "@/components/common/SafeHTML";
import AutoPaginator from "@/components/common/AutoPaginator";
import { getSafeExternalUrl } from "@/utils/validators";

interface JobMatchTemplateTHREEProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  activeSection?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editOverrides?: Record<string, any>;
  addedFields?: Record<string, string[]>;
  onEditSection?: (key: string) => void;
  onDeleteSection?: (key: string) => void;
  deletedSections?: string[];
  fontFamily?: string;
  /** Display labels for locally-added custom sections, keyed by their editOverrides id (e.g. "custom_171...": "Patents"). */
  customSectionLabels?: Record<string, string>;
}

const SKILL_CATEGORY_KEYWORDS: { label: string; keywords: string[] }[] = [
  // "language" was removed — as a bare keyword it matched natural-language
  // skill entries too ("Spanish (language)", "sign language"), miscategorizing
  // them as programming languages under this same-named bucket.
  { label: "Languages", keywords: ["python", "javascript", "typescript", "java", "c++", "c#", "golang", "rust", "swift", "kotlin", "php", "ruby", "scala", "perl", "dart"] },
  { label: "Databases", keywords: ["mysql", "postgresql", "postgres", "mongodb", "oracle", "sql server", "sqlite", "dynamodb", "cassandra", "mariadb", "firebase", "elasticsearch"] },
  { label: "Tools", keywords: ["git", "github", "gitlab", "bitbucket", "docker", "jira", "confluence", "postman", "jenkins", "webpack", "vite", "npm", "yarn", "figma"] },
  { label: "Cloud Platforms", keywords: ["aws", "amazon web services", "azure", "google cloud", "gcp", "digitalocean", "heroku", "vercel", "netlify", "cloudflare"] },
  { label: "Methodologies", keywords: ["ci/cd", "cicd", "agile", "scrum", "kanban", "tdd", "devops", "waterfall"] },
  { label: "Testing", keywords: ["jest", "vitest", "playwright", "cypress", "selenium", "mocha", "chai", "junit", "pytest", "unit testing", "testing library", "cucumber"] },
];
const SKILL_CATEGORY_ORDER = ["Languages", "Databases", "Tools", "Cloud Platforms", "Methodologies", "Technologies", "Testing"];

// Single-word keywords (java, php, dart, …) are short enough to false-match
// as a substring of an unrelated word, so those require a real word
// boundary; multi-word phrases (e.g. "sql server") are specific enough that
// a plain substring check is safe.
function isWholeWordMatch(text: string, keyword: string): boolean {
  const idx = text.indexOf(keyword);
  if (idx === -1) return false;
  const isWordChar = (c: string) => /[a-z0-9]/i.test(c);
  const before = idx > 0 ? text[idx - 1] : "";
  const after = idx + keyword.length < text.length ? text[idx + keyword.length] : "";
  return !isWordChar(before) && !isWordChar(after);
}

function keywordMatches(text: string, keyword: string): boolean {
  return keyword.includes(" ") ? text.includes(keyword) : isWholeWordMatch(text, keyword);
}

/** Buckets a flat skill list into labeled groups (Languages, Databases, Tools, …) via keyword match, falling back to "Technologies". */
function categorizeTechnicalSkills(items: string[]): { label: string; skills: string[] }[] {
  const buckets: Record<string, string[]> = {};
  for (const skill of items) {
    const lower = skill.toLowerCase();
    const match = SKILL_CATEGORY_KEYWORDS.find(({ keywords }) => keywords.some((kw) => keywordMatches(lower, kw)));
    const label = match ? match.label : "Technologies";
    (buckets[label] ??= []).push(skill);
  }
  return SKILL_CATEGORY_ORDER.filter((label) => buckets[label]?.length).map((label) => ({ label, skills: buckets[label] }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepSanitize(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(deepSanitize);
  if ("source" in val && "value" in val) {
    const v = val.value;
    if (v === null || v === undefined) return "";
    return deepSanitize(v);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const key of Object.keys(val)) result[key] = deepSanitize(val[key]);
  return result;
}

const JobMatchTemplateThree: React.FC<JobMatchTemplateTHREEProps> = ({
  data: rawData,
  activeSection,
  editOverrides,
  addedFields,
  onEditSection,
  onDeleteSection,
  deletedSections,
  fontFamily,
  customSectionLabels,
}) => {
  const data = deepSanitize(rawData);
  const deleted = deletedSections ?? [];
  const af = addedFields ?? {};
  const ov = editOverrides ?? {};

  const hlStyle: React.CSSProperties = {
    backgroundColor: "rgba(34,197,94,0.25)",
    borderRadius: "3px",
    padding: "0 2px",
  };
  const hl = (section: string, field: string, value: React.ReactNode): React.ReactNode =>
    (af[section] || []).includes(field) ? <span style={hlStyle}>{value}</span> : <>{value}</>;
  const hlIdx = (section: string, idx: number): boolean =>
    (af[section] || []).includes(String(idx));

  const parsedData = data?.parsed_data || data || {};
  const llmData = parsedData?.llm_data || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enhancedResume: Record<string, any> = data?.enhanced_resume || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toStr = (v: any): string => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      if (typeof v.value === "string") return v.value;
      if (typeof v.text === "string") return v.text;
      if (typeof v.name === "string") return v.name;
    }
    return "";
  };

  const contact = data?.contact || parsedData.contact || llmData.contact || llmData.personal_info || {};
  const name = toStr(
    ov.contact?.name || data?.contact?.name || data?.contact?.full_name ||
    contact.name || contact.full_name || parsedData.name || llmData.name ||
    llmData.personal_info?.name || parsedData.personalInfo?.fullName
  ) || "Your Name";

  // Job-title fixes from the match report write to contact.jobTitle /
  // job_title / currentRole / current_role / headline (and the top-level
  // headline list) — mirrors the PDF renderer's read priority so a fix
  // applied there shows up here too. `ov.contact` (editOverrides) reflects
  // the resume as most recently re-fetched, so it wins over the `data` prop
  // when both are populated; neither editor lets a user hand-type a "title"
  // field, so there is no separate manual-override tier to prioritise above it.
  const effectiveContact = (ov.contact && Object.keys(ov.contact).length > 0) ? ov.contact : contact;
  const headlineList = Array.isArray(parsedData.headline)
    ? parsedData.headline.filter(Boolean).join(" | ")
    : toStr(parsedData.headline);
  const title = toStr(
    effectiveContact.jobTitle || effectiveContact.job_title || effectiveContact.currentRole || effectiveContact.current_role || effectiveContact.headline ||
    headlineList ||
    effectiveContact.title || effectiveContact.role || effectiveContact.designation ||
    parsedData.title || llmData.title
  );
  const email = toStr(ov.contact?.email || data?.contact?.email || contact.email || parsedData.email || parsedData.personalInfo?.email);
  const phone = toStr(ov.contact?.phone || data?.contact?.phone || contact.phone || contact.phone_number || parsedData.personalInfo?.phone);
  const location = toStr(ov.contact?.location || data?.contact?.location || contact.location || parsedData.personalInfo?.location);
  const socialLinks = parsedData.social_links || llmData.social_links || parsedData.personalInfo || {};
  const resolveLink = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) {
      const o = val as Record<string, unknown>;
      return toStr(o.url || o.link || o.href || "");
    }
    return "";
  };
  const linkedin = toStr(ov.contact?.linkedin) || resolveLink(socialLinks.linkedin) || resolveLink(socialLinks.linkedIn) || toStr(socialLinks.linkedinUrl || contact.linkedin);
  const github = toStr(ov.contact?.github) || resolveLink(socialLinks.github) || resolveLink(socialLinks.GitHub) || toStr(socialLinks.githubUrl || contact.github);
  const portfolio = toStr(ov.contact?.portfolio) || resolveLink(socialLinks.portfolio) || toStr(socialLinks.website || socialLinks.portifolioUrl || contact.website);

  // A summary rewrite fix writes selected_summary (and, less often, leaves a
  // summary_variants list) — both outrank the plain summary fields below in
  // the PDF renderer, so they must be checked first here too.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractSummaryText = (val: any): string => {
    if (!val) return "";
    if (Array.isArray(val)) {
      for (const v of val) { const t = extractSummaryText(v); if (t) return t; }
      return "";
    }
    if (typeof val === "object") return toStr(val.summary || val.value || "");
    return typeof val === "string" ? val : "";
  };
  let professionalSummary = ov.summary ?? (
    extractSummaryText(parsedData.selected_summary) ||
    extractSummaryText(parsedData.summary_variants) ||
    parsedData.professionalSummary || parsedData.professional_summary ||
    parsedData.career_objective || parsedData.objective || parsedData.summary ||
    llmData.professionalSummary || llmData.professional_summary || llmData.summary || ""
  );
  if (professionalSummary && typeof professionalSummary === "object") professionalSummary = toStr(professionalSummary);
  if (typeof professionalSummary === "string" && professionalSummary.startsWith("{")) {
    try { const p = JSON.parse(professionalSummary); professionalSummary = p.summary || p.objective || professionalSummary; } catch { /* keep */ }
  }

  let education = ov.education ?? (parsedData.education || parsedData.educational_qualifications || llmData.education || []);
  if (!Array.isArray(education)) education = [];

  let workExperience = ov.experience ?? (
    parsedData.workExperience || parsedData.work_experience || parsedData.experience ||
    parsedData.professional_experience || llmData.workExperience || llmData.work_experience || llmData.experience || []
  );
  if (!Array.isArray(workExperience)) workExperience = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workExperience = workExperience.filter((e: any) => e.company || e.role || e.title || e.position || e.organization);

  let projects = ov.projects ?? (parsedData.projects || parsedData.project_details || llmData.projects || []);
  if (!Array.isArray(projects)) projects = [];

  let skills = ov.skills ?? (parsedData.skills || parsedData.technical_skills || llmData.skills || llmData.technical_skills || []);
  if (!Array.isArray(skills)) { if (typeof skills === "object") skills = Object.values(skills).flat(); else skills = []; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skills = (skills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  const newlyAddedSkills: string[] = ov.skills ? [] : (data?.newly_added_skills || []);
  const newlyAddedSkillsSet = new Set(newlyAddedSkills.map((s: string) => s.toLowerCase()));
  if (newlyAddedSkills.length > 0) skills = [...skills, ...newlyAddedSkills];

  let softSkills = ov.softSkills ?? (parsedData.soft_skills || llmData.soft_skills || []);
  if (!Array.isArray(softSkills)) softSkills = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  softSkills = (softSkills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  const newlyAddedSoftSkills: string[] = data?.newly_added_soft_skills || [];
  const newlyAddedSoftSkillsSet = new Set(newlyAddedSoftSkills.map((s: string) => s.toLowerCase()));
  if (newlyAddedSoftSkills.length > 0) softSkills = [...softSkills, ...newlyAddedSoftSkills];

  let internships = ov.internships ?? (parsedData.internships || parsedData.internship || parsedData.internship_details || llmData.internships || llmData.internship || []);
  if (!Array.isArray(internships)) internships = [];

  let certifications = ov.certifications ?? (
    parsedData.certifications || parsedData.certification || parsedData.certificates || parsedData.certification_details ||
    parsedData.professional_certifications || parsedData.courses || parsedData.training ||
    llmData.certifications || llmData.certificates || llmData.certification_details ||
    llmData.professional_certifications || llmData.courses || llmData.training ||
    enhancedResume.certifications || enhancedResume.certificates || []
  );
  if (!Array.isArray(certifications)) certifications = [];
  // Filter out items that have no extractable name (null-value placeholders from raw parse)
  certifications = certifications.filter((c: unknown) => {
    if (!c) return false;
    if (typeof c === "string") return c.trim() !== "";
    if (typeof c === "object") {
      const o = c as Record<string, unknown>;
      return !!(o.name || o.full_name || o.title || o.certification || o.course_name || o.course ||
                o.certification_name || o.certificate_name || o.cert_name);
    }
    return false;
  });

  let achievements = ov.achievements ?? (parsedData.achievements || llmData.achievements || []);
  if (!Array.isArray(achievements)) achievements = [];

  let awards = parsedData.awards || llmData.awards || [];
  if (!Array.isArray(awards)) awards = [];

  let volunteering = parsedData.volunteering || llmData.volunteering || [];
  if (!Array.isArray(volunteering)) volunteering = [];

  let languages = ov.languages ?? (parsedData.languages || parsedData.languages_known || llmData.languages || []);
  if (typeof languages === "string") languages = languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  if (!Array.isArray(languages)) languages = [];

  let publications = parsedData.publications || llmData.publications || [];
  if (!Array.isArray(publications)) publications = [];

  let references = parsedData.references || llmData.references || [];
  if (!Array.isArray(references)) references = [];

  let hobbies = parsedData.hobbies || parsedData.hobbies_and_interests || llmData.hobbies || llmData.hobbies_and_interests || [];
  if (!Array.isArray(hobbies)) hobbies = [];

  let interests = parsedData.interests || llmData.interests || [];
  if (!Array.isArray(interests)) interests = [];

  // personal_details (and other backend-invented sections) can arrive either
  // as a free-form {key: value} dict OR — when the parser can't structure a
  // heading it doesn't recognize — as a raw string[] of "Key: Value" lines
  // (backend calls this the "verbatim" fallback). There is no fixed
  // father_name/mother_name/dob shape on the backend at all, so read
  // whatever keys/lines are actually present instead of a hardcoded set.
  const pdValueToStr = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(pdValueToStr).filter(Boolean).join(", ");
    return toStr(v);
  };
  const personalDetailsRaw = parsedData.personal_details ?? parsedData.personalDetails ?? llmData.personal_details ?? llmData.personalDetails;
  const personalDetailsEntries: [string, string][] = Array.isArray(personalDetailsRaw)
    ? personalDetailsRaw.map((line): [string, string] => {
        const s = pdValueToStr(line);
        const idx = s.indexOf(":");
        return idx > -1 ? [s.slice(0, idx).trim(), s.slice(idx + 1).trim()] : ["", s];
      }).filter(([, v]) => v)
    : (personalDetailsRaw && typeof personalDetailsRaw === "object")
    ? Object.entries(personalDetailsRaw as Record<string, unknown>)
        .map(([k, v]): [string, string] => [k, pdValueToStr(v)])
        .filter(([, v]) => v)
    : [];

  const hasContent = (v: unknown): boolean => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return true;
  };
  const prettifyLabel = (key: string): string =>
    key
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // ══ DYNAMIC / BACKEND-DEFINED SECTIONS ══
  // parsed_data is an arbitrary flat dict on the backend — new top-level keys
  // (e.g. "bar_admissions_and_licenses", "practice_areas") appear per-document
  // beyond this template's fixed section list above. Surface anything left
  // over generically instead of silently dropping it. `section_metadata`
  // (when present) gives the section's original document heading.
  const INTERNAL_KEYS = new Set([
    "field_sources", "section_metadata", "parser_schema_version", "quality_score", "quality",
    "career_progression", "overall_experience", "parsing_method", "cache_hit",
    "message", "resume_id", "_id", "id", "file_name", "success", "llm_data",
    "parsed_data", "enhanced_resume", "newly_added_skills", "newly_added_soft_skills",
    "additional_sections", "custom_sections", "customSections", "ats_score",
    // Parser telemetry / QA / diagnostic fields — never resume content, but
    // land as ordinary top-level keys right alongside real sections, so they
    // must be excluded by name rather than by shape.
    "contact_signals", "embedding_texts", "field_confidence", "font_sections_raw",
    "format_analysis", "parse_metadata", "parse_warnings", "parsing_summary",
    "parser_diagnostics_summary", "developer_diagnostics", "parser_mode",
    "strategy_used", "summary_analysis", "tokens_used", "metadata", "user_id",
    "parser_version", "prompt_fingerprint", "parse_time_ms", "parsed_at", "section_order",
    "verb_inferred_skills", "achievements_metrics",
    "kpi_metrics", "reliability_metrics", "domain_experience", "fallbacks_used",
    "degraded_sections", "provenance", "soft_skills_covered_by_technical",
    "detected_stacks", "routing_flags",
  ]);
  // Defensive fallback for diagnostic-shaped keys the explicit list above
  // hasn't caught yet (the backend adds these fairly often) — matches
  // "…_analysis", "…_diagnostics", "…_confidence", etc. anywhere in the key.
  const META_KEY_PATTERN = /(^|_)(analysis|diagnostics?|confidence|warnings?|signals?|tokens?|embedding|schema|strategy|fingerprint|telemetry)(_|$)/i;
  const KNOWN_SECTION_KEYS = new Set([
    "contact", "personal_info", "personalInfo", "name", "full_name", "fullName",
    "headline", "title", "role", "designation", "email", "phone", "phone_number",
    "location", "social_links", "hobbies_and_interests",
    "selected_summary", "summary_variants", "professionalSummary", "professional_summary",
    "career_objective", "objective", "summary",
    "education", "educational_qualifications",
    "workExperience", "work_experience", "experience", "professional_experience",
    "projects", "project_details",
    "skills", "technical_skills", "soft_skills", "softSkills",
    "internships", "internship", "internship_details",
    "certifications", "certification", "certificates", "certification_details",
    "professional_certifications", "courses", "training",
    "achievements", "awards", "volunteering",
    "languages", "languages_known",
    "publications", "references", "hobbies", "interests",
    "personal_details", "personalDetails",
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionMetaList: any[] = Array.isArray(parsedData.section_metadata) ? parsedData.section_metadata : [];
  const labelFromMeta: Record<string, string> = {};
  sectionMetaList.forEach((m) => {
    const mappedTo = typeof m?.mapped_to === "string" ? m.mapped_to : "";
    const originalName = typeof m?.original_name === "string" ? m.original_name : "";
    if (mappedTo && originalName) labelFromMeta[mappedTo] = originalName;
  });

  const dynamicSections: { key: string; label: string; value: unknown }[] = [];
  const seenDynamicKeys = new Set<string>();
  [parsedData, llmData].forEach((source) => {
    if (!source || typeof source !== "object") return;
    Object.keys(source).forEach((key) => {
      if (seenDynamicKeys.has(key) || INTERNAL_KEYS.has(key) || KNOWN_SECTION_KEYS.has(key) || META_KEY_PATTERN.test(key)) return;
      const value = (source as Record<string, unknown>)[key];
      if (!hasContent(value)) return;
      seenDynamicKeys.add(key);
      dynamicSections.push({ key, label: labelFromMeta[key] || prettifyLabel(key), value });
    });
  });

  // Backend-normalized custom sections — the resume-builder's user-added
  // sections and the AI parser's own "additional_sections" both converge
  // into this {sectionName, items}[] shape server-side.
  const backendCustomSectionsRaw: unknown =
    parsedData.custom_sections ?? parsedData.customSections ?? data?.custom_sections ?? data?.customSections;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backendCustomSections: any[] = Array.isArray(backendCustomSectionsRaw) ? backendCustomSectionsRaw : [];

  // Locally-added custom sections (via "Add Custom Section" in the editor)
  // live only in editOverrides until they round-trip through a save +
  // refetch into custom_sections above. Render them too, with edit/delete
  // controls since they're already wired into the section editor.
  const localCustomKeys = Object.keys(ov).filter((k) => !KNOWN_SECTION_KEYS.has(k) && !seenDynamicKeys.has(k));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseDescription = (desc: any): string[] => {
    if (!desc) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unwrap = (item: any): string => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if (typeof item.value === "string") return item.value;
        if (typeof item.text === "string") return item.text;
      }
      return String(item ?? "");
    };
    if (Array.isArray(desc)) return desc.map(unwrap).filter(Boolean);
    if (typeof desc === "string") return desc.split(/\n+|•|\*|-(?=\s)/).map((s: string) => s.trim()).filter(Boolean);
    if (desc && typeof desc === "object" && typeof desc.value === "string") return desc.value ? [desc.value] : [];
    return [];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2,4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    }
    return dateString;
  };

  const baseFont = fontFamily || "Arial, Helvetica, sans-serif";

  const sc = (key: string) =>
    `relative group/section${activeSection === key ? " bg-blue-50 rounded px-1 -mx-1" : ""}`;

  const SectionActions = ({ sectionKey }: { sectionKey: string }) =>
    onEditSection || onDeleteSection ? (
      <div className="absolute top-0 right-0 flex flex-col gap-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 z-20">
        {onEditSection && (
          <button onClick={() => onEditSection(sectionKey)} title="Edit section"
            className="bg-blue-500 rounded-full p-1.5 shadow hover:bg-blue-600 transition-colors">
            <Edit3 className="w-3 h-3 text-white" />
          </button>
        )}
        {onDeleteSection && (
          <button onClick={() => onDeleteSection(sectionKey)} title="Remove section"
            className="bg-red-500 rounded-full p-1.5 shadow hover:bg-red-600 transition-colors">
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    ) : null;

  /* ── ATS-safe section divider ── */
  const SectionDivider = ({ label }: { label: string }) => (
    <div style={{ marginBottom: "9px", marginTop: "2px" }}>
      <h2 style={{
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#111827",
        margin: 0,
        paddingBottom: "5px",
        borderBottom: "2px solid #111827",
        fontFamily: baseFont,
      }}>
        {label}
      </h2>
    </div>
  );

  const renderBullets = (desc: string | string[] | null | undefined) => {
    if (!desc) return null;
    if (typeof desc === "string" && desc.includes("<")) {
      return <SafeHTML content={desc} className="ats-desc" />;
    }
    const items = parseDescription(desc);
    if (!items.length) return null;
    if (items.length === 1) return (
      <p style={{ margin: "3px 0 0", fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65 }}>{items[0]}</p>
    );
    return (
      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", listStyleType: "disc" }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, marginBottom: "2px" }}>{item}</li>
        ))}
      </ul>
    );
  };

  /* ── generic renderer for backend/custom sections whose shape we don't know ahead of time ── */
  const GENERIC_ITEM_KNOWN_KEYS = new Set([
    "title", "name", "sectionName", "subtitle", "organization", "company", "issuer",
    "startDate", "start_date", "endDate", "end_date", "date", "description", "details",
    "url", "link", "tags", "id", "icon", "displayOrder", "location",
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderGenericItems = (items: any[]): React.ReactNode => (
    <>
      {items.map((raw, idx) => {
        if (typeof raw === "string") {
          return raw ? (
            <p key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, margin: "0 0 4px" }}>{raw}</p>
          ) : null;
        }
        const item: Record<string, unknown> = (raw && typeof raw === "object") ? raw : {};
        const itemTitle = toStr(item.title || item.name || item.sectionName || "");
        const subtitle = toStr(item.subtitle || item.organization || item.company || item.issuer || "");
        const startDate = toStr(item.startDate || item.start_date || "");
        const endDate = toStr(item.endDate || item.end_date || item.date || "");
        const dateStr = startDate || endDate ? `${formatDate(startDate)}${startDate && endDate ? " – " : ""}${formatDate(endDate)}` : "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const description = (item.description || item.details || null) as any;
        const url = toStr(item.url || item.link || "");
        const tags: string[] = Array.isArray(item.tags) ? (item.tags as unknown[]).map((t) => toStr(t)).filter(Boolean) : [];
        const extraEntries = Object.entries(item).filter(([k, v]) => !GENERIC_ITEM_KNOWN_KEYS.has(k) && hasContent(v));

        if (!itemTitle && !subtitle && !description && !extraEntries.length) return null;

        return (
          <div key={idx} className="page-break-inside-avoid" style={{ marginBottom: "10px" }}>
            {(itemTitle || dateStr) && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{itemTitle}</span>
                {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
              </div>
            )}
            {subtitle && <div style={{ fontSize: "13.5px", color: "#374151", fontStyle: "italic", marginTop: "1px" }}>{subtitle}</div>}
            {description ? renderBullets(description) : null}
            {tags.length > 0 && (
              <p style={{ fontSize: "13px", color: "#4b5563", margin: "3px 0 0" }}>{tags.join(", ")}</p>
            )}
            {getSafeExternalUrl(url) && (
              <a href={getSafeExternalUrl(url)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none" }}>
                [Link]
              </a>
            )}
            {extraEntries.map(([k, v]) => (
              <p key={k} style={{ fontSize: "13px", color: "#4b5563", margin: "2px 0 0" }}>
                <strong>{prettifyLabel(k)}:</strong>{" "}
                {typeof v === "string" ? v : Array.isArray(v) ? (v as unknown[]).map((x) => toStr(x)).filter(Boolean).join(", ") : toStr(v)}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );

  const renderDynamicValue = (value: unknown): React.ReactNode => {
    if (Array.isArray(value)) {
      const isPlainList = value.every((v) => typeof v === "string" || v === null || v === undefined);
      if (isPlainList) {
        const strings = value.map((v) => (typeof v === "string" ? v : "")).filter(Boolean);
        return strings.length ? renderBullets(strings) : null;
      }
      return renderGenericItems(value);
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([k, v]): [string, string] => [k, pdValueToStr(v)])
        .filter(([, v]) => v);
      if (!entries.length) return null;
      return (
        <table style={{ fontSize: "13.5px", color: "#1f2937", borderCollapse: "collapse" }}>
          <tbody>
            {entries.map(([k, v], i) => (
              <tr key={i}>
                <td style={{ paddingRight: "16px", paddingBottom: "3px", color: "#4b5563", whiteSpace: "nowrap", verticalAlign: "top" }}>{prettifyLabel(k)}</td>
                <td style={{ paddingBottom: "3px" }}>: {v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    const s = typeof value === "string" ? value : "";
    if (!s) return null;
    return <p style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, margin: 0 }}>{s}</p>;
  };

  /* ── contact items ── */
  const contactParts: React.ReactNode[] = [];
  if (email) contactParts.push(<span key="email">{hl("contact", "email", email)}</span>);
  if (phone) contactParts.push(<span key="phone">{hl("contact", "phone", phone)}</span>);
  if (location) contactParts.push(<span key="loc">{hl("contact", "location", location)}</span>);
  if (getSafeExternalUrl(linkedin)) contactParts.push(
    <a key="li" href={getSafeExternalUrl(linkedin)}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "linkedin", "LinkedIn")}
    </a>
  );
  if (getSafeExternalUrl(github)) contactParts.push(
    <a key="gh" href={getSafeExternalUrl(github)}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "github", "GitHub")}
    </a>
  );
  if (getSafeExternalUrl(portfolio)) contactParts.push(
    <a key="pf" href={getSafeExternalUrl(portfolio)}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "portfolio", "Portfolio")}
    </a>
  );

  return (
    <>
      <style jsx global>{`
        .ats-desc b, .ats-desc strong { font-weight: 700; }
        .ats-desc i, .ats-desc em { font-style: italic; }
        .ats-desc ul { list-style-type: disc; padding-left: 1rem; margin-top: 3px; }
        .ats-desc li { font-size: 13.5px; line-height: 1.65; margin-bottom: 2px; color: #1f2937; }
      `}</style>

      <div style={{
          maxWidth: "100%",
          width: "100%",
          margin: "0 auto",
          padding: "32px 48px",
          background: "#ffffff",
          fontFamily: baseFont,
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}>

          {/* ══ HEADER ══ */}
          <div
            id="resume-section-contact"
            className={`${sc("contact")} mb-4 text-center`}
            style={{ marginBottom: "16px" }}
          >
            <SectionActions sectionKey="contact" />

            <h1 style={{
              fontSize: "30px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#111827",
              margin: "0 0 5px",
              fontFamily: baseFont,
            }}>
              {hl("contact", "name", name)}
            </h1>

            {title && (
              <p style={{ fontSize: "14.5px", color: "#4b5563", fontWeight: 500, margin: "0 0 9px", letterSpacing: "0.03em" }}>
                {hl("contact", "title", title)}
              </p>
            )}

            {/* Contact row — pipe-separated, single line, ATS safe */}
            {contactParts.length > 0 && (
              <div style={{ fontSize: "13px", color: "#374151", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 4px", lineHeight: 1.6 }}>
                {contactParts.map((part, i) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < contactParts.length - 1 && (
                      <span style={{ color: "#9ca3af", userSelect: "none" }}> • </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <hr style={{ border: "none", borderTop: "2px solid #111827", margin: "12px 0 0" }} />
          </div>

          <AutoPaginator>

            {/* ══ SUMMARY ══ */}
            {!deleted.includes("summary") && professionalSummary && (
              <div id="resume-section-summary" className={sc("summary")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="summary" />
                <SectionDivider label="Summary" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, textAlign: "justify", margin: 0 }}>
                  {hl("summary", "text", professionalSummary)}
                </p>
              </div>
            )}

            {/* ══ WORK EXPERIENCE ══ */}
            {!deleted.includes("experience") && workExperience.length > 0 && (
              <div id="resume-section-experience" className={sc("experience")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="experience" />
                <SectionDivider label="Work Experience" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {workExperience.map((exp: any, idx: number) => {
                  const company = toStr(exp.company || exp.organization || exp.employer || "");
                  const role = toStr(exp.role || exp.title || exp.position || exp.job_title || "");
                  const duration = toStr(exp.duration || exp.period || exp.dates || "");
                  const loc = toStr(exp.location || "");
                  const startDate = toStr(exp.startDate || exp.start_date || exp.from || exp.start || "");
                  const endDate = exp.currentlyWorking ? "Present" : toStr(exp.endDate || exp.end_date || exp.to || exp.end || "");
                  const dateStr = duration || (startDate ? `${formatDate(startDate)}${endDate ? ` – ${formatDate(endDate)}` : ""}` : "");
                  const desc = exp.description || exp.responsibilities || exp.details || null;
                  const isModified = hlIdx("experience", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      {/* Row 1: Company | Date */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{company}</span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {/* Row 2: Role | Location */}
                      {(role || loc) && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "1px" }}>
                          <span style={{ fontSize: "13.5px", fontStyle: "italic", color: "#374151" }}>{role}</span>
                          {loc && <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap", marginLeft: "8px" }}>{loc}</span>}
                        </div>
                      )}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ EDUCATION ══ */}
            {!deleted.includes("education") && education.length > 0 && (
              <div id="resume-section-education" className={sc("education")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="education" />
                <SectionDivider label="Education" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {education.map((edu: any, idx: number) => {
                  const degree = toStr(edu.degree || edu.qualification || edu.course || "");
                  const college = toStr(edu.college || edu.institution || edu.university || edu.school || "");
                  const branch = toStr(edu.branch || edu.specialization || edu.major || edu.field_of_study || "");
                  const duration = toStr(edu.duration || edu.period || "");
                  const startDate = toStr(edu.startDate || edu.start_date || edu.from || "");
                  const endDate = toStr(edu.endDate || edu.end_date || edu.to || edu.graduation_year || edu.passed_out || edu.year || "");
                  const dateStr = duration || (startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : formatDate(startDate || endDate));
                  const grade = toStr(edu.grade || edu.gpa || edu.cgpa || edu.percentage || "");
                  const gradeType = toStr(edu.gradeType || edu.grade_type || "Grade");
                  const itemChanged = hlIdx("education", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "8px",
                      paddingLeft: itemChanged ? "8px" : 0,
                      borderLeft: itemChanged ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>
                          {degree}{branch ? `, ${branch}` : ""}
                        </span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#374151", marginTop: "1px" }}>{college}</div>
                      {grade && <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "1px" }}>{gradeType}: {grade}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ PROJECTS ══ */}
            {!deleted.includes("projects") && projects.length > 0 && (
              <div id="resume-section-projects" className={sc("projects")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="projects" />
                <SectionDivider label="Projects" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {projects.map((proj: any, idx: number) => {
                  const projTitle = toStr(proj.title || proj.name || proj.project_name || "");
                  const link = toStr(proj.link || proj.url || proj.github_link || "");
                  const startDate = toStr(proj.startDate || proj.start_date || "");
                  const endDate = toStr(proj.endDate || proj.end_date || proj.date || proj.period || "");
                  const dateStr = startDate || endDate ? `${formatDate(startDate)}${startDate && endDate ? " – " : ""}${formatDate(endDate)}` : "";
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const unwrapProjItems = (arr: any[]) => arr.map((r: any) => typeof r === "object" ? toStr(r.text || r.description || r.value || "") : toStr(r)).filter(Boolean);
                  const desc = (() => {
                    if (proj.description) return proj.description;
                    if (proj.details) return proj.details;
                    const resps = Array.isArray(proj.responsibilities) ? unwrapProjItems(proj.responsibilities) : [];
                    const achvs = Array.isArray(proj.achievements) ? unwrapProjItems(proj.achievements) : [];
                    const combined = [...resps, ...achvs];
                    return combined.length ? combined : null;
                  })();
                  const rawTech = proj.tech_stack || proj.technologies || proj.techStack || proj.tools;
                  const tech: string[] = Array.isArray(rawTech) ? rawTech.map((t: unknown) => toStr(t)).filter(Boolean) : rawTech ? [toStr(rawTech)].filter(Boolean) : [];
                  const isModified = hlIdx("projects", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{projTitle}</span>
                          {getSafeExternalUrl(link) && (
                            <a href={getSafeExternalUrl(link)}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none" }}>
                              [Link]
                            </a>
                          )}
                        </div>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {desc && renderBullets(desc)}
                      {tech.length > 0 && (
                        <p style={{ fontSize: "13px", color: "#4b5563", margin: "3px 0 0" }}>
                          <strong>Technologies:</strong> {tech.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ SKILLS ══ */}
            {!deleted.includes("skills") && skills.length > 0 && (
              <div id="resume-section-skills" className={sc("skills")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="skills" />
                <SectionDivider label="Skills" />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {categorizeTechnicalSkills(skills as string[]).map(({ label, skills: groupSkills }) => {
                    const editorAdded = new Set((af.skills || []).map((s: string) => s.toLowerCase()));
                    return (
                      <p key={label} style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.6 }}>
                        <strong>{label}:</strong>{" "}
                        {groupSkills.map((skill, idx) => {
                          const isNew = newlyAddedSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                          return (
                            <React.Fragment key={idx}>
                              {isNew ? <span style={hlStyle}>{skill}</span> : skill}
                              {idx < groupSkills.length - 1 ? ", " : ""}
                            </React.Fragment>
                          );
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ SOFT SKILLS ══ */}
            {!deleted.includes("softSkills") && softSkills.length > 0 && (
              <div id="resume-section-softSkills" className={sc("softSkills")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="softSkills" />
                {skills.length === 0 && <SectionDivider label="Skills" />}
                <p style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.6 }}>
                  <strong>Soft Skills:</strong>{" "}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(softSkills as any[]).map((skill: string, idx: number) => {
                    const editorAdded = new Set((af.softSkills || []).map((s: string) => s.toLowerCase()));
                    const isNew = newlyAddedSoftSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                    return (
                      <React.Fragment key={idx}>
                        {isNew ? <span style={hlStyle}>{skill}</span> : skill}
                        {idx < softSkills.length - 1 ? ", " : ""}
                      </React.Fragment>
                    );
                  })}
                </p>
              </div>
            )}

            {/* ══ INTERNSHIPS ══ */}
            {!deleted.includes("internships") && internships.length > 0 && (
              <div id="resume-section-internships" className={sc("internships")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="internships" />
                <SectionDivider label="Internships" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {internships.map((intern: any, idx: number) => {
                  const company = toStr(intern.company || intern.organization || "");
                  const role = toStr(intern.role || intern.title || intern.position || "");
                  const duration = toStr(intern.duration || intern.period || "");
                  const startDate = toStr(intern.startDate || intern.start_date || intern.from || "");
                  const endDate = intern.currentlyWorking ? "Present" : toStr(intern.endDate || intern.end_date || intern.to || "");
                  const dateStr = duration || (startDate ? `${formatDate(startDate)}${endDate ? ` – ${formatDate(endDate)}` : ""}` : "");
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const unwrapItems = (arr: any[]) => arr.map((r: any) => typeof r === "object" ? toStr(r.text || r.description || r.value || "") : toStr(r)).filter(Boolean);
                  const desc = (() => {
                    if (intern.description) return intern.description;
                    const resps = Array.isArray(intern.responsibilities) ? unwrapItems(intern.responsibilities) : [];
                    const achvs = Array.isArray(intern.achievements) ? unwrapItems(intern.achievements) : [];
                    const combined = [...resps, ...achvs];
                    return combined.length ? combined : null;
                  })();
                  const isModified = hlIdx("internships", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{company}</span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {role && <div style={{ fontSize: "13.5px", fontStyle: "italic", color: "#374151", marginTop: "1px" }}>{role}</div>}
                      {Array.isArray(intern.tech_stack) && intern.tech_stack.length > 0 && (
                        <p style={{ fontSize: "13px", color: "#4b5563", fontStyle: "italic", margin: "2px 0 0" }}>
                          <strong>Stack:</strong> {intern.tech_stack.map((t: unknown) => toStr(t)).filter(Boolean).join(", ")}
                        </p>
                      )}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ CERTIFICATIONS ══ */}
            {!deleted.includes("certifications") && certifications.length > 0 && (
              <div id="resume-section-certifications" className={sc("certifications")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="certifications" />
                <SectionDivider label="Certifications" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {certifications.map((cert: any, idx: number) => {
                    const certName = typeof cert === "string"
                      ? cert
                      : toStr(cert.name || cert.full_name || cert.title || cert.certification || cert.course_name || cert.course || cert.certification_name || cert.certificate_name || cert.cert_name || "");
                    const issuedBy = typeof cert === "object" ? toStr(cert.issuedBy || cert.issued_by || cert.organization || cert.issuer || cert.institution || "") : "";
                    const year = typeof cert === "object" ? toStr(cert.year || cert.date || cert.issue_date || cert.completion_date || "") : "";
                    if (!certName) return null;
                    const isModified = hlIdx("certifications", idx);
                    return (
                      <li key={idx} style={{
                        fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px",
                        backgroundColor: isModified ? "rgba(34,197,94,0.1)" : undefined,
                      }}>
                        <span style={{ fontWeight: 600 }}>{certName}</span>
                        {issuedBy && <span style={{ color: "#4b5563" }}>{" — "}{issuedBy}</span>}
                        {year && <span style={{ color: "#6b7280" }}>{" ("}{year}{")"}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ ACHIEVEMENTS ══ */}
            {!deleted.includes("achievements") && achievements.length > 0 && (
              <div id="resume-section-achievements" className={sc("achievements")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="achievements" />
                <SectionDivider label="Achievements" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {achievements.map((achievement: any, idx: number) => {
                    const achieveTitle = typeof achievement === "string"
                      ? achievement
                      : toStr(achievement.title || achievement.name || achievement.achievement || "");
                    const desc = typeof achievement === "object" ? toStr(achievement.description || "") : "";
                    const date = typeof achievement === "object" ? toStr(achievement.date || achievement.year || "") : "";
                    if (!achieveTitle) return null;
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600 }}>{achieveTitle}</span>
                        {date && <span style={{ color: "#6b7280" }}>{" ("}{formatDate(date)}{")"}</span>}
                        {desc && <span style={{ color: "#374151" }}>{" — "}{desc}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ AWARDS ══ */}
            {!deleted.includes("awards") && awards.length > 0 && (
              <div id="resume-section-awards" className={sc("awards")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="awards" />
                <SectionDivider label="Awards" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {awards.map((award: any, idx: number) => {
                    const awardTitle = toStr(award.title || award.name || "");
                    const issuedBy = toStr(award.issuedBy || award.issued_by || award.organization || "");
                    const year = toStr(award.year || award.date || "");
                    if (!awardTitle) return null;
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600 }}>{awardTitle}</span>
                        {issuedBy && <span style={{ color: "#4b5563" }}>{" — "}{issuedBy}</span>}
                        {year && <span style={{ color: "#6b7280" }}>{" ("}{year}{")"}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ LANGUAGES ══ */}
            {!deleted.includes("languages") && languages.length > 0 && (
              <div id="resume-section-languages" className={sc("languages")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="languages" />
                <SectionDivider label="Languages" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {languages.map((lang: any, idx: number) => {
                    const langName = typeof lang === "string" ? lang : toStr(lang.language || lang.name || lang);
                    const proficiency = typeof lang === "string" ? "" : toStr(lang.proficiency || lang.level || "");
                    const itemChanged = hlIdx("languages", idx);
                    return (
                      <li key={idx} style={{
                        fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, breakInside: "avoid",
                        backgroundColor: itemChanged ? "rgba(34,197,94,0.1)" : undefined,
                      }}>
                        <span style={{ fontWeight: 600 }}>{langName}</span>
                        {proficiency && <span style={{ color: "#6b7280" }}>{" — "}{proficiency}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ VOLUNTEERING ══ */}
            {!deleted.includes("volunteering") && volunteering.length > 0 && (
              <div id="resume-section-volunteering" className={sc("volunteering")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="volunteering" />
                <SectionDivider label="Volunteering" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {volunteering.map((vol: any, idx: number) => {
                  const role = toStr(vol.role || vol.title || vol.position || "");
                  const org = toStr(vol.organization || vol.org || vol.company || "");
                  const duration = toStr(vol.duration || vol.period || "");
                  const desc = vol.description || null;
                  return (
                    <div key={idx} style={{ marginBottom: "8px" }} className="page-break-inside-avoid">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{role}</span>
                        {duration && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{duration}</span>}
                      </div>
                      {org && <div style={{ fontSize: "13.5px", color: "#374151", fontStyle: "italic", marginTop: "1px" }}>{org}</div>}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ PUBLICATIONS ══ */}
            {!deleted.includes("publications") && publications.length > 0 && (
              <div id="resume-section-publications" className={sc("publications")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="publications" />
                <SectionDivider label="Publications" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {publications.map((pub: any, idx: number) => {
                  const pubTitle = toStr(pub.title || pub.name || "");
                  const url = toStr(pub.url || pub.link || "");
                  const authors = toStr(pub.authors || pub.author || "");
                  const pubName = toStr(pub.publicationName || pub.publication_name || pub.journal || "");
                  const date = toStr(pub.date || pub.year || "");
                  return (
                    <div key={idx} style={{ marginBottom: "8px" }} className="page-break-inside-avoid">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{pubTitle}</span>
                        {getSafeExternalUrl(url) && (
                          <a href={getSafeExternalUrl(url)} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none" }}>[Link]</a>
                        )}
                      </div>
                      {authors && <div style={{ fontSize: "13px", color: "#4b5563" }}>{authors}</div>}
                      {(pubName || date) && (
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>
                          {pubName && <em>{pubName}</em>}{pubName && date && " · "}{date && formatDate(date)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ HOBBIES ══ */}
            {!deleted.includes("hobbies") && hobbies.length > 0 && (
              <div id="resume-section-hobbies" className={sc("hobbies")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="hobbies" />
                <SectionDivider label="Hobbies & Interests" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.7 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {hobbies.map((hobby: any) => {
                    const hobbyName = typeof hobby === "string" ? hobby : toStr(hobby.name || hobby.hobby || "");
                    return hobbyName;
                  }).filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {/* ══ INTERESTS ══ */}
            {!deleted.includes("interests") && interests.length > 0 && !hobbies.length && (
              <div id="resume-section-interests" className={sc("interests")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="interests" />
                <SectionDivider label="Interests" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.7 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {interests.map((interest: any) => {
                    const interestName = typeof interest === "string" ? interest : toStr(interest.name || interest.interest || "");
                    return interestName;
                  }).filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {/* ══ REFERENCES ══ */}
            {!deleted.includes("references") && references.length > 0 && (
              <div id="resume-section-references" className={sc("references")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="references" />
                <SectionDivider label="References" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {references.map((ref: any, idx: number) => {
                    const refName = toStr(ref.name || ref.referee || "");
                    const relation = toStr(ref.relation || ref.designation || ref.title || "");
                    const refContact = toStr(ref.contact || ref.email || ref.phone || "");
                    return (
                      <div key={idx}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{refName}</div>
                        {relation && <div style={{ fontSize: "13px", color: "#4b5563" }}>{relation}</div>}
                        {refContact && <div style={{ fontSize: "13px", color: "#6b7280" }}>{refContact}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PERSONAL DETAILS ══ */}
            {!deleted.includes("personalDetails") && personalDetailsEntries.length > 0 && (
              <div id="resume-section-personalDetails" className={sc("personalDetails")} style={{ marginBottom: "14px" }}>
                <SectionDivider label="Personal Details" />
                <table style={{ fontSize: "13.5px", color: "#1f2937", borderCollapse: "collapse" }}>
                  <tbody>
                    {personalDetailsEntries.map(([label, value], idx) => (
                      <tr key={idx}>
                        {label && (
                          <td style={{ paddingRight: "16px", paddingBottom: "3px", color: "#4b5563", whiteSpace: "nowrap", verticalAlign: "top" }}>
                            {prettifyLabel(label)}
                          </td>
                        )}
                        <td style={{ paddingBottom: "3px" }} colSpan={label ? 1 : 2}>{label ? ": " : ""}{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ DYNAMIC BACKEND SECTIONS — anything parsed_data carries beyond the fixed list above ══ */}
            {dynamicSections.map(({ key, label, value }) => {
              if (deleted.includes(key)) return null;
              const body = renderDynamicValue(value);
              if (!body) return null;
              return (
                <div key={`dyn-${key}`} id={`resume-section-${key}`} style={{ marginBottom: "14px" }}>
                  <SectionDivider label={label} />
                  {body}
                </div>
              );
            })}

            {/* ══ CUSTOM SECTIONS — backend-normalized (resume builder + AI "additional_sections") ══ */}
            {backendCustomSections.map((section, idx) => {
              const label = toStr(section?.sectionName || section?.section_name) || `Custom Section ${idx + 1}`;
              const items = Array.isArray(section?.items) ? section.items : [];
              if (!items.length) return null;
              return (
                <div key={`bcs-${idx}`} style={{ marginBottom: "14px" }}>
                  <SectionDivider label={label} />
                  {renderGenericItems(items)}
                </div>
              );
            })}

            {/* ══ CUSTOM SECTIONS — added locally via "Add Custom Section" (editable) ══ */}
            {localCustomKeys.map((key) => {
              if (deleted.includes(key)) return null;
              const value = ov[key];
              if (!hasContent(value)) return null;
              const label = customSectionLabels?.[key] || prettifyLabel(key.replace(/^custom_\d+$/, "Custom Section"));
              const body = renderDynamicValue(value);
              if (!body) return null;
              return (
                <div key={`local-${key}`} id={`resume-section-${key}`} className={sc(key)} style={{ marginBottom: "14px" }}>
                  <SectionActions sectionKey={key} />
                  <SectionDivider label={label} />
                  {body}
                </div>
              );
            })}

          </AutoPaginator>
        </div>
    </>
  );
};

export default JobMatchTemplateThree;
