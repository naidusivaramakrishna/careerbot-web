/**
 * Achievements in the live preview. The AI parser returns each achievement as
 * one sentence, which the mapper turns into a title with no date/description.
 * Every preview template must show those as bullet points; entries that carry
 * a date or description keep the bold-title-plus-details layout.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    resumeStyle: { fontFamily: 'Arial', bodyFontSize: '12px', lineSpacing: 1.4, bold: false, italic: false },
    sectionOrder: ['Achievements'],
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

const PARSED = [
  { text: 'Runner-up in the 8th National Level IEEE Project Competition-2024.', tone: 'unknown', id: 'a1' },
  { text: 'Runner-up in the Generative AI Hackathon at BNMIT, Bengaluru.', tone: 'unknown', id: 'a2' },
];

function resume(achievements: unknown[]): ResumeData {
  const mapped = mapParserOutputToBuilderData({ achievements });
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [], certifications: [],
    licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
    vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    volunteering: [], references: [], internships: [], awards: [],
    hobbies: [], interests: [], languages: [], publications: [], skills: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    customSections: [],
    achievements: mapped.achievements,
  } as unknown as ResumeData;
}

const style = {} as ResumeStyle;
const BUILDER = [
  ['TemplateOne', TemplateOne], ['TemplateTwo', TemplateTwo], ['TemplateThree', TemplateThree],
  ['TemplateFour', TemplateFour], ['TemplateFive', TemplateFive],
] as const;
const CLASSIC = [
  ['Template1', Template1, 'core_engineering'], ['Template2', Template2, 'software_engineering'],
  ['Template3', Template3, 'government_standard'], ['Template4', Template4, 'legal'],
] as const;

type Mount = (data: ResumeData) => void;
const mounts: Array<[string, Mount]> = [
  ...BUILDER.map(([name, Tpl]) => [name, (data: ResumeData) => { render(<Tpl data={data} style={style} />); }] as [string, Mount]),
  ...CLASSIC.map(([name, Tpl, domain]) => [name, (data: ResumeData) => {
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Achievements']} />);
  }] as [string, Mount]),
];

afterEach(cleanup);

const rowOf = (text: string): HTMLElement => {
  const row = screen.getByText(text).closest('[data-bullet-row]') as HTMLElement | null;
  expect(row, `"${text}" should sit in a bullet row`).not.toBeNull();
  return row as HTMLElement;
};

describe('achievements in the live preview', () => {
  it.each(mounts)('%s shows each parsed achievement as a bullet point', (_name, mount) => {
    mount(resume(PARSED));

    for (const { text } of PARSED) {
      expect(rowOf(text).textContent?.trim().match(/^[•–]/)).toBeTruthy();
    }
  });

  it.each(mounts)('%s still shows achievements the parser returns as plain strings', (_name, mount) => {
    mount(resume(['Won Alpha Hackathon 2024.', 'Published Beta paper.']));

    expect(rowOf('Won Alpha Hackathon 2024.').textContent?.trim().match(/^[•–]/)).toBeTruthy();
    expect(rowOf('Published Beta paper.').textContent?.trim().match(/^[•–]/)).toBeTruthy();
  });

  it.each(mounts)('%s draws an entry with a year and description as the same bullet, not a bold heading', (_name, mount) => {
    mount(resume([
      { title: 'Secured first place in Kabaddi', date: '', description: '' },
      { title: 'Completed the course with 71%', date: '2023', description: '<ul><li>Recognized for outstanding performance</li></ul>' },
    ]));

    const plain = rowOf('Secured first place in Kabaddi');
    const full = rowOf('Completed the course with 71%');

    // Same bullet, same layout: nothing about the row depends on having a date or description.
    expect(full.firstElementChild?.getAttribute('style')).toBe(plain.firstElementChild?.getAttribute('style'));
    expect(full.textContent?.trim().match(/^[•–]/)).toBeTruthy();
    // The achievement is a sentence, not a heading: no bold, no heading element.
    for (const row of [plain, full]) {
      expect(row.querySelector('h1,h2,h3,h4,b,strong')).toBeNull();
      expect(row.innerHTML).not.toMatch(/font-weight:\s*(bold|[6-9]00)/i);
    }
    // Year and description are still shown, in the row.
    expect(full.textContent).toContain('2023');
    expect(full.textContent).toContain('Recognized for outstanding performance');
  });

  it.each(mounts)('%s keeps a description-only entry as one bullet', (_name, mount) => {
    mount(resume([{ description: 'Won Alpha Hackathon 2024' }]));

    const row = rowOf('Won Alpha Hackathon 2024');
    expect(row.textContent?.trim().match(/^[•–]/)).toBeTruthy();
    expect((row.textContent?.match(/Won Alpha Hackathon 2024/g) ?? []).length).toBe(1);
  });
});
