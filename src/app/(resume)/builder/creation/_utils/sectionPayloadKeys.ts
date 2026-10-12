// Top-level key used for a section in a builder PATCH /resumes/{id} body.
//
// Existing sections keep their snake_case keys (careerbot-api's
// _normalize_to_snake_case / ARRAY_MERGE_FIELDS handle those). The
// domain-specific sections are NOT in that normaliser: the API stores and
// returns them under the camelCase keys below (repository.serialize_doc /
// camel_to_snake_map; export's template_render_context reads the camelCase
// keys too). PATCHing the snake_case key makes patch_resume's merge base
// carry both spellings, and repository.update() then folds the stale
// camelCase copy over the new snake_case value — so every save after the
// first was silently discarded. Send the key the API round-trips.
const DOMAIN_SECTION_PAYLOAD_KEYS: Record<string, string> = {
  service_record: "serviceRecord",
  vessels_operated: "vesselsOperated",
  ports_experience: "portsExperience",
  sea_service_record: "seaServiceRecord",
  maritime_certifications: "maritimeCertifications",
  research_grants: "researchGrants",
  editorial_activities: "editorialActivities",
  conference_presentations: "conferencePresentations",
  certificates_and_clearances: "certificatesAndClearances",
  bar_admissions_and_licenses: "barAdmissionsAndLicenses",
};

export const toBuilderPayloadKey = (backendKey: string): string =>
  DOMAIN_SECTION_PAYLOAD_KEYS[backendKey] ?? backendKey;

export const buildBuilderSectionPayload = (
  backendKey: string,
  sectionData: unknown,
): Record<string, unknown> => ({ [toBuilderPayloadKey(backendKey)]: sectionData });

// Section display name → ResumeData key holding that multi-entry section's
// items. Autosave reads the live section data through this map; a missing
// entry makes it read `undefined` and PATCH `[]` for the section.
export const SECTION_STATE_KEYS: Record<string, string> = {
  "Education": "education",
  "Work Experience": "workExperience",
  "Service Record": "serviceRecord",
  "Vessels Operated": "vesselsOperated",
  "Ports Experience": "portsExperience",
  "Sea Service Record": "seaServiceRecord",
  "Maritime Certifications": "maritimeCertifications",
  "Projects": "projects",
  "Certifications": "certifications",
  "Licenses and Credentials": "licenses",
  "Certificates and Clearances": "certificatesAndClearances",
  "Bar Admissions and Licenses": "barAdmissionsAndLicenses",
  "Internships": "internships",
  "Achievements": "achievements",
  "Awards": "awards",
  "Volunteering": "volunteering",
  "Publications": "publications",
  "Patents": "patents",
  "References": "references",
  "Hobbies": "hobbies",
  "Interests": "interests",
  "Languages": "languages",
  "Research Grants": "researchGrants",
  "Editorial Activities": "editorialActivities",
  "Conference Presentations": "conferencePresentations",
};

const hasValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === "object") return Object.values(value).some(hasValue);
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined && value !== false;
};

// Skills hold content only when some category holds a skill. Category metadata
// (an added but still empty custom category with its id, hidden built-ins, the
// skill-id map) renders nothing and must not count.
const hasSkills = (data: Record<string, unknown>): boolean => {
  const categorized = data.categorizedSkills;
  const fromCategories = !!categorized && typeof categorized === "object"
    && Object.entries(categorized as Record<string, unknown>).some(([key, value]) => {
      if (key === "skill_id_map" || key === "hidden_predefined_categories") return false;
      if (key === "custom_categories") {
        return Array.isArray(value) && value.some((c) => hasValue((c as { skills?: unknown } | null)?.skills));
      }
      return hasValue(value);
    });
  return fromCategories || hasValue(data.skills);
};

/**
 * True only when `name` is a section known to hold no content, so rendering the
 * resume without it changes nothing visible. Anything unrecognised (Personal Info,
 * Professional Summary, ...) is treated as having content, the safe default for
 * deciding whether the preview must be re-rendered after a delete.
 */
export const isSectionKnownEmpty = (
  data: { customSections?: Array<{ sectionName: string; fields?: Array<{ value?: unknown }> }> } & Record<string, unknown>,
  name: string,
): boolean => {
  if (name === "Skills") return !hasSkills(data);
  const stateKey = SECTION_STATE_KEYS[name];
  if (stateKey) return !hasValue(data[stateKey]);
  const target = name.trim().replace(/\s+/g, " ").toLowerCase();
  const custom = (data.customSections || []).filter(
    (cs) => cs.sectionName.trim().replace(/\s+/g, " ").toLowerCase() === target,
  );
  if (custom.length > 0) return !custom.some((cs) => hasValue((cs.fields || []).map((f) => f.value)));
  return false;
};

/**
 * True when `name` is a section whose saved data shows it is filled in. Used so the
 * "Resume Sections n/m" counter and the sidebar ticks reflect what the preview
 * renders, not only whether the section's modal was Saved in this session.
 * Personal Info counts once full name, email and phone (its required fields) are set.
 */
export const sectionHasSavedData = (
  data: { customSections?: Array<{ sectionName: string; fields?: Array<{ value?: unknown }> }> } & Record<string, unknown>,
  name: string,
): boolean => {
  if (name === "Skills") return hasSkills(data);
  if (name === "Personal Info") {
    const pi = (data.personalInfo ?? {}) as Record<string, unknown>;
    return hasValue(pi.fullname) && hasValue(pi.email) && hasValue(pi.phone);
  }
  if (name === "Professional Summary") {
    const ps = data.professionalSummary as { summary?: unknown } | string | undefined;
    return hasValue(typeof ps === "object" && ps !== null ? ps.summary : ps);
  }
  const stateKey = SECTION_STATE_KEYS[name];
  if (stateKey) return hasValue(data[stateKey]);
  const target = name.trim().replace(/\s+/g, " ").toLowerCase();
  const custom = (data.customSections || []).find(
    (cs) => cs.sectionName.trim().replace(/\s+/g, " ").toLowerCase() === target,
  );
  if (custom) {
    const fields = custom.fields || [];
    return fields.length > 0 && fields.every((f) => hasValue(f.value));
  }
  return false;
};
