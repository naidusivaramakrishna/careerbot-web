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
