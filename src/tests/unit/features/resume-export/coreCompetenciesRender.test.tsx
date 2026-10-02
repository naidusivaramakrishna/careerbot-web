/**
 * PR #148 review: `extractNamedCustomSection` pulls the "Core Competencies"
 * custom section out of the list the generic trailing custom-sections block
 * renders, and `renderCoreCompetencies` is what renders it instead. Two ways
 * that lost content:
 *   - it read only `fields[0]`, so a multi-field section lost every other field
 *   - it is only called from inside the `sectionOrder.length > 0` branch, while
 *     the section is removed from the generic list unconditionally, so an empty
 *     section order dropped the section from the resume altogether
 */
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import Template1 from '@/app/(resume)/templates/Template1';
import Template2 from '@/app/(resume)/templates/Template2';
import Template3 from '@/app/(resume)/templates/Template3';
import Template4 from '@/app/(resume)/templates/Template4';
import type { CustomSection, ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';

const style = {} as ResumeStyle;

function resume(customSections: CustomSection[]): ResumeData {
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: 'Summary line.', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [], certifications: [],
    licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
    vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    achievements: [], volunteering: [], references: [], internships: [], awards: [],
    hobbies: [], interests: [], languages: [], publications: [],
    customSections,
    skills: [],
    categorizedSkills: {
      custom_categories: [],
      hidden_predefined_categories: [],
      skill_id_map: {},
    },
  } as unknown as ResumeData;
}

const MULTI_FIELD_SECTION: CustomSection[] = [{
  id: 'cc-1',
  sectionName: 'Core Competencies',
  fields: [
    { id: 'f1', fieldName: 'Core Competencies', fieldType: 'list', value: ['Stakeholder Management'] },
    { id: 'f2', fieldName: 'Tooling', fieldType: 'list', value: ['Kubernetes'] },
    { id: 'f3', fieldName: 'Notes', fieldType: 'text', value: 'Promoted twice.' },
  ],
}];

const SINGLE_FIELD_SECTION: CustomSection[] = [{
  id: 'cc-1',
  sectionName: 'Core Competencies',
  fields: [
    { id: 'f1', fieldName: 'Core Competencies', fieldType: 'list', value: ['Stakeholder Management'] },
  ],
}];

const TEMPLATES = [
  ['Template1', Template1, 'core_engineering'],
  ['Template2', Template2, 'software_engineering'],
  ['Template3', Template3, 'government_standard'],
  ['Template4', Template4, 'legal'],
] as const;

const ORDER = ['Personal Info', 'Professional Summary', 'Skills'];

describe('Core Competencies rendering', () => {
  it.each(TEMPLATES)('%s: renders every field of the section, not only the first', (_n, Tpl, domain) => {
    render(<Tpl data={resume(MULTI_FIELD_SECTION)} style={style} domainFamily={domain} sectionOrder={[...ORDER]} />);

    expect(screen.getByText('Stakeholder Management')).toBeTruthy();
    expect(screen.getByText('Kubernetes')).toBeTruthy();
    // renderHTMLToReact prefixes a bullet, so the element text is "• Promoted twice.".
    expect(screen.getByText(/Promoted twice\./)).toBeTruthy();
    cleanup();
  });

  it.each(TEMPLATES)('%s: still renders the section when there is no section order', (_n, Tpl, domain) => {
    render(<Tpl data={resume(SINGLE_FIELD_SECTION)} style={style} domainFamily={domain} sectionOrder={[]} />);

    expect(screen.getByText('Stakeholder Management')).toBeTruthy();
    cleanup();
  });

  it.each(TEMPLATES)('%s: renders the section exactly once when an order is present', (_n, Tpl, domain) => {
    render(<Tpl data={resume(SINGLE_FIELD_SECTION)} style={style} domainFamily={domain} sectionOrder={[...ORDER]} />);

    expect(screen.getAllByText('Stakeholder Management')).toHaveLength(1);
    expect(screen.getAllByText(/^core competencies$/i)).toHaveLength(1);
    cleanup();
  });
});
