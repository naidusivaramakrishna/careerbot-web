/**
 * The parser sends several list sections as plain strings ("Best Paper Award
 * 2024"), not objects. Each must show its text in every preview template, not a
 * heading with blank lines under it.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';

const ORDER = ['Awards', 'Certifications', 'Hobbies', 'Interests', 'Volunteering', 'Publications', 'References'];

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    resumeStyle: { fontFamily: 'Arial', bodyFontSize: '12px', lineSpacing: 1.4, bold: false, italic: false },
    sectionOrder: ORDER,
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

const PLAIN = {
  awards: ['Best Paper Award 2024'],
  certifications: ['AWS Solutions Architect 2023'],
  hobbies: ['Cycling around the lake'],
  interests: ['Open Source Contribution'],
  volunteering: ['Red Cross Blood Camp'],
  publications: ['Dropout Prediction Using ML'],
  references: ['Dr. K. Rao Professor'],
};

function resume(): ResumeData {
  const mapped = mapParserOutputToBuilderData(PLAIN as never) as unknown as Record<string, unknown>;
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [], licenses: [], certificatesAndClearances: [],
    barAdmissionsAndLicenses: [], serviceRecord: [], vesselsOperated: [], portsExperience: [], seaServiceRecord: [],
    maritimeCertifications: [], researchGrants: [], editorialActivities: [], conferencePresentations: [],
    internships: [], achievements: [], languages: [], skills: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    customSections: [],
    ...mapped,
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
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={ORDER} />).container] as [string, Mount]),
];

afterEach(cleanup);

describe('list sections the parser sends as plain strings, in the live preview', () => {
  it.each(mounts)('%s shows the text of every entry', (_name, mount) => {
    const text = mount(resume()).textContent ?? '';

    for (const entries of Object.values(PLAIN)) {
      for (const entry of entries) expect(text, `missing "${entry}"`).toContain(entry);
    }
  });
});
