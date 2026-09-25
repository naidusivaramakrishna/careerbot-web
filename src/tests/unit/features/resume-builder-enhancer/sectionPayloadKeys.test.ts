import { describe, it, expect } from 'vitest';
import {
  buildBuilderSectionPayload,
  toBuilderPayloadKey,
  SECTION_STATE_KEYS,
} from '@/app/(resume)/builder/creation/_utils/sectionPayloadKeys';

// careerbot-api (develop2) returns these sections under camelCase keys and its
// repository.update() folds a camelCase key onto the snake_case one
// (app/services/resume_builder_service/repository.py camel_to_snake_map).
// When the builder PATCHes the snake_case key, patch_resume's merge base
// (ResumeOut dump) still carries the stored camelCase copy, and that stale
// copy overwrites the new value on write: every save after the first is lost.
// Sending the camelCase key is the round-trip the API actually supports.
describe('buildBuilderSectionPayload — domain sections use the API camelCase key', () => {
  const cases: Array<[string, string]> = [
    ['service_record', 'serviceRecord'],
    ['vessels_operated', 'vesselsOperated'],
    ['ports_experience', 'portsExperience'],
    ['sea_service_record', 'seaServiceRecord'],
    ['maritime_certifications', 'maritimeCertifications'],
    ['research_grants', 'researchGrants'],
    ['editorial_activities', 'editorialActivities'],
    ['conference_presentations', 'conferencePresentations'],
    ['certificates_and_clearances', 'certificatesAndClearances'],
    ['bar_admissions_and_licenses', 'barAdmissionsAndLicenses'],
  ];

  it.each(cases)('%s is sent as %s', (snake, camel) => {
    const items = [{ id: 'x1', title: 'entry' }];
    const payload = buildBuilderSectionPayload(snake, items);
    expect(payload).toEqual({ [camel]: items });
    expect(payload).not.toHaveProperty(snake);
  });

  it('leaves existing sections on their current snake_case keys (no behaviour change)', () => {
    for (const key of [
      'personal_info', 'professional_summary', 'work_experience', 'education',
      'projects', 'certifications', 'licenses', 'internships', 'publications',
      'declaration', 'custom_section_name',
    ]) {
      expect(toBuilderPayloadKey(key)).toBe(key);
    }
  });
});

// ResumeSide registers these as multi-entry editor components; autosave
// (EditorTab triggerAutoSave) resolves the live data through SECTION_STATE_KEYS.
describe('SECTION_STATE_KEYS — autosave can find every multi-entry section', () => {
  const expected: Record<string, string> = {
    'Service Record': 'serviceRecord',
    'Vessels Operated': 'vesselsOperated',
    'Ports Experience': 'portsExperience',
    'Sea Service Record': 'seaServiceRecord',
    'Maritime Certifications': 'maritimeCertifications',
    'Research Grants': 'researchGrants',
    'Editorial Activities': 'editorialActivities',
    'Conference Presentations': 'conferencePresentations',
    'Licenses and Credentials': 'licenses',
    'Certificates and Clearances': 'certificatesAndClearances',
    'Bar Admissions and Licenses': 'barAdmissionsAndLicenses',
    Education: 'education',
    'Work Experience': 'workExperience',
    Projects: 'projects',
    Certifications: 'certifications',
    Internships: 'internships',
  };

  it.each(Object.entries(expected))('%s → %s', (section, key) => {
    expect(SECTION_STATE_KEYS[section]).toBe(key);
  });
});
