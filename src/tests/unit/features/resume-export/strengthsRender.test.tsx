/**
 * Strengths in the live preview. The Strengths backfill stores the section with
 * the same text under both `items` and `fields`; the preview shows it once
 * (it prefers `fields`), and the PDF/DOCX exports must match -- see the
 * backend's tests/unit/utils/test_export_preview_parity.py. This pins the
 * preview side for every template so the two can be compared.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';

const ORDER = ['Personal Info', 'Professional Summary', 'Strengths'];

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

const STRENGTHS = ['Smart Working', 'Multi-Talented'];

// The exact shape the backend's Strengths backfill writes.
const BACKFILLED = {
  id: 's1',
  sectionName: 'Strengths',
  icon: 'custom',
  items: STRENGTHS.map((description) => ({ title: '', description })),
  fields: [{ id: 'f1', fieldName: 'Strengths', fieldType: 'list', value: STRENGTHS }],
};

function resume(): ResumeData {
  const mapped = mapParserOutputToBuilderData({ customSections: [BACKFILLED] }) as unknown as Record<string, unknown>;
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], certifications: [], achievements: [], volunteering: [],
    references: [], internships: [], awards: [], hobbies: [], interests: [], languages: [], publications: [],
    patents: [], skills: [], licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [],
    serviceRecord: [], vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    categorizedSkills: { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} },
    ...mapped,
  } as unknown as ResumeData;
}

const style = {} as ResumeStyle;
const MOUNTS: Array<[string, () => HTMLElement]> = [
  ...([
    ['TemplateOne', TemplateOne], ['TemplateTwo', TemplateTwo], ['TemplateThree', TemplateThree],
    ['TemplateFour', TemplateFour], ['TemplateFive', TemplateFive],
  ] as const).map(([name, Tpl]) => [name, () => render(<Tpl data={resume()} style={style} />).container] as [string, () => HTMLElement]),
  ...([
    ['Template1', Template1, 'core_engineering'], ['Template2', Template2, 'software_engineering'],
    ['Template3', Template3, 'government_standard'], ['Template4', Template4, 'legal'],
  ] as const).map(([name, Tpl, domain]) => [name, () =>
    render(<Tpl data={resume()} style={style} domainFamily={domain} sectionOrder={ORDER} />).container] as [string, () => HTMLElement]),
];

afterEach(cleanup);

describe('Strengths in the live preview', () => {
  it.each(MOUNTS)('%s shows each strength exactly once', (_name, mount) => {
    const text = mount().textContent ?? '';

    for (const strength of STRENGTHS) {
      expect(text.split(strength).length - 1, strength).toBe(1);
    }
  });
});
