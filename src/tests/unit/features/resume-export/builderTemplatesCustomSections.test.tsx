/**
 * PR #148: the five builder live-preview templates (TemplateOne-Five) render
 * the synthesized Core Competencies section through their generic
 * custom-section branch, because ResumeContext adds every loaded custom
 * section's name to sectionOrder (PreviewPanel.test.tsx mocks all five, so
 * nothing else renders them).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import type { CustomSection, ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';

const ctx = vi.hoisted(() => ({ sectionOrder: [] as string[] }));
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    resumeStyle: { fontFamily: 'Arial', bodyFontSize: '12px', lineSpacing: 1.4, bold: false, italic: false },
    sectionOrder: ctx.sectionOrder,
  }),
}));

import TemplateOne from '@/app/(resume)/builder/creation/_components/templates/TemplateOne';
import TemplateTwo from '@/app/(resume)/builder/creation/_components/templates/TemplateTwo';
import TemplateThree from '@/app/(resume)/builder/creation/_components/templates/TemplateThree';
import TemplateFour from '@/app/(resume)/builder/creation/_components/templates/TemplateFour';
import TemplateFive from '@/app/(resume)/builder/creation/_components/templates/TemplateFive';

const CORE: CustomSection = {
  id: 'cc-1',
  sectionName: 'Core Competencies',
  source: 'core_competencies',
  fields: [{ id: 'f1', fieldName: 'Core Competencies', fieldType: 'list', value: ['Stakeholder Management'] }],
};

function resume(): ResumeData {
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: 'Summary line.', targetRole: '' },
    education: [], workExperience: [], projects: [], certifications: [], achievements: [],
    volunteering: [], references: [], internships: [], awards: [], hobbies: [], interests: [],
    languages: [], publications: [], patents: [], skills: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    customSections: [CORE],
  } as unknown as ResumeData;
}

const TEMPLATES = [
  ['TemplateOne', TemplateOne],
  ['TemplateTwo', TemplateTwo],
  ['TemplateThree', TemplateThree],
  ['TemplateFour', TemplateFour],
  ['TemplateFive', TemplateFive],
] as const;

describe('builder templates and the synthesized Core Competencies section', () => {
  it.each(TEMPLATES)('%s renders it once, without repeating its name as a field label', (_n, Tpl) => {
    ctx.sectionOrder = ['Professional Summary', 'Core Competencies'];
    render(<Tpl data={resume()} style={{} as ResumeStyle} />);

    expect(screen.getAllByText('Stakeholder Management')).toHaveLength(1);
    expect(screen.queryByText(/^Core Competencies:\s*$/)).toBeNull();
    cleanup();
  });
});
