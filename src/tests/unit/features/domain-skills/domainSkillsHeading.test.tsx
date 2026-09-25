/**
 * PR #96 ai-review (1a8259c1) P2: a resume whose only skills sit in categories
 * the domain filter removes printed a bare SKILLS heading with no body.
 * The heading condition counted the unfiltered flat `skills` list, while the
 * body only renders the filtered categories.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import Template1 from '@/app/(resume)/templates/Template1';
import Template2 from '@/app/(resume)/templates/Template2';
import Template3 from '@/app/(resume)/templates/Template3';
import Template4 from '@/app/(resume)/templates/Template4';
import type { ResumeData, ResumeStyle } from '@/app/(resume)/builder/creation/_context/ResumeContext';

const style = {} as ResumeStyle;
// Template4 titles the section "SKILLS AND TOOLS".
const HEADING = /^skills( and tools)?$/i;

function resume(categorizedSkills: Record<string, unknown>, skills: string[]): ResumeData {
  return {
    personalInfo: { fullname: 'A B', email: 'a@b.c', countryCode: '+91', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
    professionalSummary: { summary: '', targetRole: '' },
    education: [], workExperience: [], projects: [], patents: [], certifications: [],
    licenses: [], certificatesAndClearances: [], barAdmissionsAndLicenses: [], serviceRecord: [],
    vesselsOperated: [], portsExperience: [], seaServiceRecord: [], maritimeCertifications: [],
    researchGrants: [], editorialActivities: [], conferencePresentations: [],
    achievements: [], volunteering: [], references: [], internships: [], awards: [],
    hobbies: [], interests: [], languages: [], publications: [], customSections: [],
    skills,
    categorizedSkills: {
      custom_categories: [],
      hidden_predefined_categories: [],
      skill_id_map: {},
      ...categorizedSkills,
    },
  } as unknown as ResumeData;
}

const TEMPLATES = [
  ['Template1', Template1, 'healthcare'],
  ['Template2', Template2, 'healthcare'],
  ['Template3', Template3, 'government_standard'],
  ['Template4', Template4, 'legal'],
] as const;

describe('Skills heading follows the filtered skills', () => {
  it.each(TEMPLATES)('%s: no SKILLS heading when every skill is in a category the domain hides', (_n, Tpl, domain) => {
    const data = resume({ programming_languages: ['Python'], frameworks: ['React'] }, ['Python', 'React']);
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Skills']} />);
    expect(screen.queryByText(HEADING)).toBeNull();
    cleanup();
  });

  it.each(TEMPLATES)('%s: SKILLS heading and body when a printed category has skills', (_n, Tpl, domain) => {
    const data = resume(
      { programming_languages: ['Python'], soft_skills: ['Empathy'] },
      ['Python', 'Empathy'],
    );
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Skills']} />);
    expect(screen.getByText(HEADING)).toBeTruthy();
    expect(screen.getByText(/Empathy/)).toBeTruthy();
    expect(screen.queryByText(/Python/)).toBeNull();
    cleanup();
  });

  it.each(TEMPLATES)('%s: SKILLS heading for a named custom category only', (_n, Tpl, domain) => {
    const data = resume(
      { programming_languages: ['Python'], custom_categories: [{ id: 'c1', name: 'Tools', skills: ['Jira'] }] },
      ['Python', 'Jira'],
    );
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Skills']} />);
    expect(screen.getByText(HEADING)).toBeTruthy();
    expect(screen.getByText(/Jira/)).toBeTruthy();
    cleanup();
  });

  it.each(TEMPLATES)('%s: legacy resume without categorizedSkills still prints the flat list', (_n, Tpl, domain) => {
    const data = { ...resume({}, ['Python']), categorizedSkills: undefined } as unknown as ResumeData;
    render(<Tpl data={data} style={style} domainFamily={domain} sectionOrder={['Skills']} />);
    expect(screen.getByText(HEADING)).toBeTruthy();
    expect(screen.getByText(/Python/)).toBeTruthy();
    cleanup();
  });
});
