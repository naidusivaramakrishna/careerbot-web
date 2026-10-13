/**
 * Languages in the live preview. A language the resume lists without a
 * proficiency level ("English") must not render a dangling separator
 * ("English -"). The classic templates printed " - {proficiency}" unconditionally.
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
    sectionOrder: ['Languages'],
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

function resume(languages: unknown[]): ResumeData {
  const mapped = mapParserOutputToBuilderData({ languages });
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [], certifications: [],
    licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
    vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    volunteering: [], references: [], internships: [], awards: [], achievements: [],
    hobbies: [], interests: [], publications: [], skills: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    customSections: [],
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
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Languages']} />).container] as [string, Mount]),
];

afterEach(cleanup);

describe('languages in the live preview', () => {
  it.each(mounts)('%s shows a language without a proficiency and no dangling separator', (_name, mount) => {
    const text = mount(resume([{ language: 'English' }])).textContent ?? '';

    expect(text).toContain('English');
    expect(text).not.toMatch(/English[\s ]*[-–—(]/);
  });

  it.each(mounts)('%s still shows the proficiency when there is one', (_name, mount) => {
    const text = mount(resume([{ language: 'English', proficiency: 'Fluent' }])).textContent ?? '';

    expect(text).toMatch(/English[\s ]*[-–—(]\s*Fluent/);
  });
});
