/**
 * PR #96 ai-review (1a8259c1) P1: software engineering, cybersecurity and
 * research resumes print the general categories (`frameworks`,
 * `project_management`, `marketing_sales`, ...) that filterSkillsByDomain keeps
 * for those domains, but the Skills editor only rendered the domain's own list,
 * so e.g. parser-filled `frameworks` skills printed as "Frameworks: ..." and
 * could not be edited or removed.
 *
 * Invariant checked for every domain: every predefined category the templates
 * print (filterSkillsByDomain keeps it and it has skills) is editable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

type AnyData = Record<string, unknown> & { resume_id?: string; categorizedSkills?: Record<string, unknown> };
const ctx: { value: Record<string, unknown> } = { value: {} };

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ctx.value,
}));
vi.mock('@/app/(resume)/builder/creation/_hooks/useValidation', () => ({
  useValidation: () => ({ errors: {} }),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel', () => ({
  default: () => null,
}));
vi.mock('@/app/(resume)/builder/creation/_components/editor/TechnologyChipsInput', () => {
  const Chips = React.forwardRef(function Chips(
    props: { label: string; placeholder?: string; selectedTechnologies: string[] },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ref,
  ) {
    const id = props.label || props.placeholder || 'custom';
    return React.createElement('span', { 'data-testid': `chips-${id}` }, props.selectedTechnologies.join(','));
  });
  return { default: Chips };
});
vi.mock('@/api/resumeApi', () => ({
  addSkillToCategory: vi.fn(),
  deleteSkillCategory: vi.fn(),
  deleteSkillById: vi.fn(),
}));
vi.mock('@/api/enhancerApi', () => ({
  addSkillToEnhancedResume: vi.fn(),
  deleteSkillFromEnhancedResume: vi.fn(),
  deleteSkillCategoryFromEnhancedResume: vi.fn(),
}));
vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'user@example.com' }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import Skills from '@/app/(resume)/builder/creation/_components/editor/sections/Skills';
import { DOMAIN_SKILLS } from '@/config/domainSkills';
import { filterSkillsByDomain } from '@/app/(resume)/templates/skillsFilterByDomain';

const EMAIL = 'user@example.com';
const META = new Set(['custom_categories', 'hidden_predefined_categories', 'skill_id_map']);

function applyCareerTemplate(domain: string) {
  window.localStorage.setItem('userEmail', EMAIL);
  window.localStorage.setItem(`selectedTemplateId_${EMAIL}`, 't1');
  window.localStorage.setItem(
    `careerLevelTemplates_${EMAIL}`,
    JSON.stringify([{ id: 't1', name: `${domain} - Mid-Level`, domain_family: domain }]),
  );
}

function Harness({ initial }: { initial: AnyData }) {
  const [resumeData, setResumeData] = React.useState<AnyData>(initial);
  ctx.value = { resumeData, setResumeData };
  return <Skills />;
}

/** One distinct skill in every predefined key of every domain. */
function everyKeyFilled(): Record<string, unknown> {
  const out: Record<string, unknown> = { custom_categories: [], hidden_predefined_categories: [], skill_id_map: {} };
  Object.values(DOMAIN_SKILLS).forEach((cats) => cats.forEach((c) => { out[c.key] = [`S-${c.key}`]; }));
  return out;
}

function editorText(): string {
  return screen.queryAllByTestId(/^chips-/).map((el) => el.textContent).join('|');
}

/** Every skill chip the editor renders. */
function editorSkills(): Set<string> {
  return new Set(editorText().split(/[|,]/).filter(Boolean));
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('every category the templates print is editable', () => {
  it.each(Object.keys(DOMAIN_SKILLS))('%s', (domain) => {
    applyCareerTemplate(domain);
    const categorizedSkills = everyKeyFilled();
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills }} />);

    const printed = filterSkillsByDomain(categorizedSkills as never, domain) as Record<string, unknown>;
    const printedKeys = Object.entries(printed)
      .filter(([k, v]) => !META.has(k) && Array.isArray(v) && v.length > 0)
      .map(([k]) => k);
    expect(printedKeys.length).toBeGreaterThan(0);
    const shown = editorSkills();
    const notEditable = printedKeys.filter((k) => !shown.has(`S-${k}`));
    expect(notEditable).toEqual([]);
    cleanup();
  });
});

describe('software engineering', () => {
  it('shows stored `frameworks` skills, labelled as the resume prints them', () => {
    applyCareerTemplate('software_engineering');
    render(
      <Harness
        initial={{
          resume_id: 'r1',
          categorizedSkills: {
            programming_languages: [], frameworks: ['React'], soft_skills: [], project_management: [], marketing_sales: [],
            frameworks_libraries: [], custom_categories: [], skill_id_map: {},
          },
        }}
      />,
    );
    expect(screen.getByTestId('chips-Frameworks').textContent).toBe('React');
    // The domain's own category is still there.
    expect(screen.getByTestId('chips-Frameworks & Libraries').textContent).toBe('');
  });

  it('does not add empty general categories the domain list does not have', () => {
    applyCareerTemplate('software_engineering');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: { custom_categories: [], skill_id_map: {} } }} />);
    expect(screen.queryByTestId('chips-Frameworks')).toBeNull();
    expect(screen.queryByTestId('chips-Marketing Sales')).toBeNull();
  });

  it('healthcare still hides general categories its templates do not print', () => {
    applyCareerTemplate('healthcare');
    render(
      <Harness
        initial={{ resume_id: 'r1', categorizedSkills: { programming_languages: ['Python'], frameworks: ['React'], custom_categories: [], skill_id_map: {} } }}
      />,
    );
    expect(editorText()).not.toContain('Python');
    expect(editorText()).not.toContain('React');
  });
});
