/**
 * Awards, Certifications and Languages in the live preview, using the shapes
 * the parser actually stored across real resumes (awards {title, issuedBy,
 * year}; certifications {full_name, issuing_organization, year, ...}; languages
 * {language} / {name, proficiency}). Every template must show their text.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    resumeStyle: { fontFamily: 'Arial', bodyFontSize: '12px', lineSpacing: 1.4, bold: false, italic: false },
    sectionOrder: ['Awards', 'Certifications', 'Languages'],
  }),
}));

import TemplateOne from '@/app/(resume)/builder/creation/_components/templates/TemplateOne';
import TemplateTwo from '@/app/(resume)/builder/creation/_components/templates/TemplateTwo';
import TemplateThree from '@/app/(resume)/builder/creation/_components/templates/TemplateThree';
import TemplateFour from '@/app/(resume)/builder/creation/_components/templates/TemplateFour';
import TemplateFive from '@/app/(resume)/builder/creation/_components/templates/TemplateFive';
import Template1 from '@/app/(resume)/templates/Template1';
import Template2 from '@/app/(resume)/templates/Template2';
import Template3 from '@/app/(resume)/templates/Template3';
import Template4 from '@/app/(resume)/templates/Template4';

function resume(): ResumeData {
  const mapped = mapParserOutputToBuilderData({
    awards: [{ title: 'Best Paper Award', issuedBy: 'IEEE Society', year: '2024' }],
    certifications: [
      { code: 'SAA', confidence: 0.9, domain: 'cloud', full_name: 'AWS Solutions Architect', issuing_organization: 'Amazon Web Services', year: '2023' },
    ],
    languages: [{ language: 'Hindi' }, { name: 'Telugu', proficiency: 'Native' }],
  });
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [],
    licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
    vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    volunteering: [], references: [], internships: [], achievements: [],
    hobbies: [], interests: [], publications: [], skills: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    customSections: [],
    awards: mapped.awards,
    certifications: mapped.certifications,
    languages: mapped.languages,
  } as unknown as ResumeData;
}

const style = {} as ResumeStyle;
type Mount = (data: ResumeData) => HTMLElement;
const mounts: Array<[string, Mount]> = [
  ...([
    ['TemplateOne', TemplateOne], ['TemplateTwo', TemplateTwo], ['TemplateThree', TemplateThree],
    ['TemplateFour', TemplateFour], ['TemplateFive', TemplateFive],
  ] as const).map(([name, Tpl]) => [name, (data: ResumeData) => render(<Tpl data={data} style={style} />).container] as [string, Mount]),
  ...([
    ['Template1', Template1, 'core_engineering'], ['Template2', Template2, 'software_engineering'],
    ['Template3', Template3, 'government_standard'], ['Template4', Template4, 'legal'],
  ] as const).map(([name, Tpl, domain]) => [name, (data: ResumeData) =>
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Awards', 'Certifications', 'Languages']} />).container] as [string, Mount]),
];

afterEach(cleanup);

describe('awards, certifications and languages in the live preview', () => {
  it.each(mounts)('%s shows the text of every parsed entry', (_name, mount) => {
    const text = mount(resume()).textContent ?? '';

    for (const expected of [
      'Best Paper Award', 'IEEE Society', '2024',
      'AWS Solutions Architect', 'Amazon Web Services', '2023',
      'Hindi', 'Telugu', 'Native',
    ]) {
      expect(text, `missing "${expected}"`).toContain(expected);
    }
  });
});
