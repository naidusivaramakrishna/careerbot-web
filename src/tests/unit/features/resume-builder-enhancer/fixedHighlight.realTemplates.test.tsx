/**
 * The green "fixed" highlight finds the text a fix added by searching the
 * rendered preview for it. Templates reformat some values (dates, profile
 * links, phone numbers), so this renders every real template and checks that
 * each kind of fix is actually found, not just that a highlight is registered.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { diffTextUnits, displayVariants, findHighlightRanges } from '@/app/(resume)/builder/creation/_utils/fixedTextHighlight';

const ORDER = [
  'Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Projects',
  'Education', 'Certifications', 'Achievements', 'Languages',
];

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

const info = (over: Record<string, string> = {}) => ({
  fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '',
  linkedinUrl: '', githubUrl: '', portfolioUrl: '', ...over,
});
const job = (over: Record<string, unknown> = {}) => ({
  company: 'Acme', role: 'Dev', startDate: '2022-01', endDate: '2023-01', currentlyWorking: false,
  description: '<ul><li>Built things</li></ul>', location: '', technologies: [], ...over,
});
const edu = (over: Record<string, unknown> = {}) => ({
  school: 'JNTU', degree: 'B.Tech', startDate: '', endDate: '', scoreType: 'CGPA', scoreValue: '', ...over,
});

const base = (over: Record<string, unknown> = {}): ResumeData => ({
  personalInfo: info(), professionalSummary: { summary: '', targetRole: '' },
  education: [edu()], workExperience: [job()],
  projects: [{ title: 'Proj', description: '<ul><li>Did stuff</li></ul>', technologies: [], startDate: '', endDate: '', link: '' }],
  certifications: [], achievements: [], volunteering: [], references: [], internships: [], awards: [],
  hobbies: [], interests: [], languages: [], publications: [], patents: [], skills: [],
  licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
  vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
  researchGrants: [], editorialActivities: [], conferencePresentations: [],
  categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
  customSections: [], ...over,
}) as unknown as ResumeData;

// One entry per kind of fix: the resume after the fix, diffed against `base()`.
// (Certificates carry the same value in `year` and `issueDate`, as the mapper
// produces: the builder templates show `year`, the classic ones `issueDate`.)
const FIXES: Array<[string, Record<string, unknown>]> = [
  ['contact location', { personalInfo: info({ location: 'Vijayawada' }) }],
  ['contact phone', { personalInfo: info({ phone: '9876543210' }) }],
  ['contact LinkedIn link', { personalInfo: info({ linkedinUrl: 'https://www.linkedin.com/in/ab-12345' }) }],
  ['contact GitHub link', { personalInfo: info({ githubUrl: 'https://github.com/ab' }) }],
  ['contact portfolio link', { personalInfo: info({ portfolioUrl: 'https://ab.dev' }) }],
  ['summary', { professionalSummary: { summary: 'Backend engineer with five years of experience building APIs.', targetRole: '' } }],
  ['education grade', { education: [edu({ scoreValue: '8.5' })] }],
  ['education dates', { education: [edu({ startDate: '2018-08', endDate: '2022-05' })] }],
  ['work experience bullet', { workExperience: [job({ description: '<ul><li>Built things</li><li>Reduced API latency by 40% across 12 services</li></ul>' })] }],
  ['work experience dates', { workExperience: [job({ startDate: '2021-06' })] }],
  ['project bullet', { projects: [{ title: 'Proj', description: '<ul><li>Did stuff</li><li>Deployed on AWS with CI/CD</li></ul>', technologies: [], startDate: '', endDate: '', link: '' }] }],
  ['certification', { certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', issueDate: '2023', year: '2023', expiryDate: '', credentialId: '' }] }],
  ['achievement', { achievements: [{ title: 'Won Alpha Hackathon 2024.', date: '', description: '' }] }],
  ['language', { languages: [{ name: 'Telugu', proficiency: 'Native' }] }],
];

const style = {} as ResumeStyle;
const MOUNTS: Array<[string, (data: ResumeData) => HTMLElement]> = [
  ...([
    ['TemplateOne', TemplateOne], ['TemplateTwo', TemplateTwo], ['TemplateThree', TemplateThree],
    ['TemplateFour', TemplateFour], ['TemplateFive', TemplateFive],
  ] as const).map(([name, Tpl]) => [name, (data: ResumeData) => render(<Tpl data={data} style={style} />).container] as [string, (d: ResumeData) => HTMLElement]),
  ...([
    ['Template1', Template1, 'core_engineering'], ['Template2', Template2, 'software_engineering'],
    ['Template3', Template3, 'government_standard'], ['Template4', Template4, 'legal'],
  ] as const).map(([name, Tpl, domain]) => [name, (data: ResumeData) =>
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={ORDER} />).container] as [string, (d: ResumeData) => HTMLElement]),
];

afterEach(cleanup);

describe('fixed-text highlight finds every kind of fix in every real template', () => {
  it.each(MOUNTS)('%s', (_name, mount) => {
    const missed: string[] = [];
    for (const [label, over] of FIXES) {
      const after = base(over);
      const units = diffTextUnits(base(), after);
      expect(units.length, `${label}: the fix should add text`).toBeGreaterThan(0);

      const root = mount(after);
      for (const unit of units) {
        if (findHighlightRanges(root, [unit]).length === 0) missed.push(`${label} -> "${unit.text}"`);
      }
      cleanup();
    }
    expect(missed).toEqual([]);
  });
});

describe('displayVariants', () => {
  it('lists the ways the preview shows a stored month and a full date', () => {
    expect(displayVariants('2018-08')).toEqual(expect.arrayContaining(['Aug 2018', 'Aug 18', 'August 2018', '08/2018']));
    expect(displayVariants('2018-08-05')).toEqual(expect.arrayContaining(['Aug 5, 2018', '05/08/2018']));
  });

  it('maps profile links to the label the preview prints', () => {
    expect(displayVariants('https://www.linkedin.com/in/ab')).toContain('LinkedIn');
    expect(displayVariants('https://github.com/ab')).toContain('GitHub');
    expect(displayVariants('https://ab.dev')).toContain('Portfolio');
  });

  it('adds nothing for ordinary text, numbers or an impossible month', () => {
    expect(displayVariants('Reduced latency by 40%')).toEqual([]);
    expect(displayVariants('8.5')).toEqual([]);
    expect(displayVariants('2018-13')).toEqual([]);
  });
});
