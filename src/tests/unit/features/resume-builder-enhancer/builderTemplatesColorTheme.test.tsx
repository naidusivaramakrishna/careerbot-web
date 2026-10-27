/**
 * The export is sent `accentColor || headingColor` for the name and the section headings. TemplateOne-Five
 * (the plain ATS templates) read the style from the builder context, so a Color Theme pick (accentColor)
 * has to reach their headings, or the preview shows another colour than the export prints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';

const ctx = vi.hoisted(() => ({ style: {} as Record<string, unknown> }));
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    resumeStyle: { fontFamily: 'Arial', bodyFontSize: '12px', lineSpacing: 1.4, bold: false, italic: false, ...ctx.style },
    sectionOrder: ['Professional Summary', 'Skills'],
  }),
}));

import TemplateOne from '@/app/(resume)/builder/creation/_components/templates/TemplateOne';
import TemplateTwo from '@/app/(resume)/builder/creation/_components/templates/TemplateTwo';
import TemplateThree from '@/app/(resume)/builder/creation/_components/templates/TemplateThree';
import TemplateFour from '@/app/(resume)/builder/creation/_components/templates/TemplateFour';
import TemplateFive from '@/app/(resume)/builder/creation/_components/templates/TemplateFive';

const data = {
  personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
  professionalSummary: { summary: 'Summary line.', targetRole: '' },
  education: [], workExperience: [], projects: [], certifications: [], achievements: [],
  volunteering: [], references: [], internships: [], awards: [], hobbies: [], interests: [],
  languages: [], publications: [], patents: [], skills: ['React'],
  categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
  customSections: [],
} as unknown as ResumeData;

const TEMPLATES = [
  ['TemplateOne', TemplateOne], ['TemplateTwo', TemplateTwo], ['TemplateThree', TemplateThree],
  ['TemplateFour', TemplateFour], ['TemplateFive', TemplateFive],
] as const;

// jsdom normalises inline colours to rgb(); compare in that form
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const colours = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('*')).map(el => el.style.color).filter(Boolean);

describe('Color Theme on the plain ATS templates', () => {
  beforeEach(() => { ctx.style = {}; });
  afterEach(cleanup);

  it.each(TEMPLATES)('%s colours its headings with the chosen accent colour, as the export does', (_n, Tpl) => {
    ctx.style = { headingColor: '#111111', accentColor: '#1f9d55' };
    const { container } = render(<Tpl data={data} style={{} as ResumeStyle} />);
    expect(colours(container)).toContain(rgb('#1f9d55'));
    expect(colours(container)).not.toContain(rgb('#111111')); // the old heading colour no longer shows
  });

  it.each(TEMPLATES)('%s keeps the style\'s own heading colour when no accent colour is set', (_n, Tpl) => {
    ctx.style = { headingColor: '#111111' };
    const { container } = render(<Tpl data={data} style={{} as ResumeStyle} />);
    expect(colours(container)).toContain(rgb('#111111'));
  });
});
