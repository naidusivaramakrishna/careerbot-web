/**
 * PR #96 — domain-aware Skills editor regressions.
 *
 * Each test here failed on the PR head (cc916e25) and passes after the fix:
 *   - 'general' domain (no templateDomain_<id> in localStorage) hid every
 *     existing skill, and one edit rebuilt categorizedSkills with the other
 *     general categories set to [] — which EditorTab then saves.
 *   - Soft Skills were listed for every domain but never displayed.
 *   - Removing a skill from a custom category sent the skill name instead of
 *     its backend id (the id map was filtered to predefined keys only).
 *   - A domain change while the editor was mounted cleared all skills, which
 *     contradicts the PR's "switching domains preserves existing data".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ─── Context mock backed by real React state ─────────────────────────────────
type AnyData = Record<string, unknown> & {
  resume_id?: string;
  categorizedSkills?: Record<string, unknown>;
  templateDomain?: string;
};
const ctx: { value: unknown } = { value: null };
const latest: { data: AnyData | null } = { data: null };

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

// Minimal chips input: shows the selected chips and exposes add/remove buttons.
vi.mock('@/app/(resume)/builder/creation/_components/editor/TechnologyChipsInput', () => {
  const Chips = React.forwardRef(function Chips(
    props: {
      label: string;
      placeholder?: string;
      selectedTechnologies: string[];
      onTechnologiesChange: (s: string[]) => void;
      onRemoveSkill?: (s: string) => Promise<void>;
    },
    _ref,
  ) {
    const id = props.label || props.placeholder || 'custom';
    return React.createElement(
      'div',
      null,
      React.createElement('span', { 'data-testid': `chips-${id}` }, props.selectedTechnologies.join(',')),
      React.createElement(
        'button',
        { 'data-testid': `add-${id}`, onClick: () => props.onTechnologiesChange([...props.selectedTechnologies, 'NewSkill']) },
        'add',
      ),
      React.createElement(
        'button',
        {
          'data-testid': `remove-${id}`,
          onClick: () => props.onRemoveSkill?.(props.selectedTechnologies[0]).catch(() => undefined),
        },
        'remove',
      ),
    );
  });
  return { default: Chips };
});

const mockDeleteSkillById = vi.fn().mockResolvedValue(undefined);
vi.mock('@/api/resumeApi', () => ({
  addSkillToCategory: vi.fn().mockResolvedValue({ id: 'new-id' }),
  deleteSkillCategory: vi.fn().mockResolvedValue(undefined),
  deleteSkillById: (...args: unknown[]) => mockDeleteSkillById(...args),
}));
vi.mock('@/api/enhancerApi', () => ({
  addSkillToEnhancedResume: vi.fn(),
  deleteSkillFromEnhancedResume: vi.fn(),
  deleteSkillCategoryFromEnhancedResume: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import Skills from '@/app/(resume)/builder/creation/_components/editor/sections/Skills';

let setExternal: ((d: AnyData) => void) | null = null;
function Harness({ initial }: { initial: AnyData }) {
  const [resumeData, setResumeData] = React.useState<AnyData>(initial);
  latest.data = resumeData;
  setExternal = setResumeData;
  ctx.value = { resumeData, setResumeData };
  return <Skills />;
}

const baseSkills = () => ({
  programming_languages: ['Python', 'Go'],
  frameworks: ['React'],
  soft_skills: ['Leadership'],
  project_management: ['Scrum'],
  marketing_sales: ['SEO'],
  custom_categories: [] as Array<{ id: string; name: string; skills: string[] }>,
  skill_id_map: {} as Record<string, string>,
});

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  latest.data = null;
});

describe('Skills editor — general domain (no stored domain)', () => {
  it('shows the resume\'s existing skills', () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: baseSkills() }} />);
    expect(screen.getByTestId('chips-Programming Languages').textContent).toBe('Python,Go');
    expect(screen.getByTestId('chips-Frameworks & Libraries').textContent).toBe('React');
    expect(screen.getByTestId('chips-Soft Skills').textContent).toBe('Leadership');
  });

  it('editing one category does not wipe the others', () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: baseSkills() }} />);
    fireEvent.click(screen.getByTestId('add-Programming Languages'));
    const cs = latest.data!.categorizedSkills as Record<string, string[]>;
    expect(cs.programming_languages).toEqual(['Python', 'Go', 'NewSkill']);
    expect(cs.frameworks).toEqual(['React']);
    expect(cs.soft_skills).toEqual(['Leadership']);
    expect(cs.project_management).toEqual(['Scrum']);
    expect(cs.marketing_sales).toEqual(['SEO']);
  });
});

describe('Skills editor — non-technical domain', () => {
  it('shows Soft Skills for healthcare and keeps hidden categories on edit', () => {
    window.localStorage.setItem('templateDomain_r1', 'healthcare');
    const skills = { ...baseSkills(), clinical_skills: ['Triage'] };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    expect(screen.getByTestId('chips-Soft Skills').textContent).toBe('Leadership');
    expect(screen.getByTestId('chips-Clinical Skills & Diagnostics').textContent).toBe('Triage');

    fireEvent.click(screen.getByTestId('add-Clinical Skills & Diagnostics'));
    const cs = latest.data!.categorizedSkills as Record<string, string[]>;
    expect(cs.clinical_skills).toEqual(['Triage', 'NewSkill']);
    // programming_languages is not shown for healthcare, but must not be erased
    expect(cs.programming_languages).toEqual(['Python', 'Go']);
    expect(cs.soft_skills).toEqual(['Leadership']);
  });
});

describe('Skills editor — custom category skill removal', () => {
  it('sends the backend skill id, not the skill name', async () => {
    const skills = {
      ...baseSkills(),
      custom_categories: [{ id: 'c1', name: 'DevOps Tools', skills: ['Docker'] }],
      skill_id_map: { 'DevOps Tools:Docker': 'skill-123' },
    };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    fireEvent.click(screen.getByTestId('remove-Add DevOps Tools skills...'));
    await waitFor(() => expect(mockDeleteSkillById).toHaveBeenCalled());
    expect(mockDeleteSkillById).toHaveBeenCalledWith('r1', 'DevOps Tools', 'skill-123');
  });
});

describe('Skills editor — domain change', () => {
  it('does not clear existing skills when the domain changes after mount', async () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: baseSkills() }} />);
    expect(screen.getByTestId('chips-Programming Languages').textContent).toBe('Python,Go');

    // Domain applied elsewhere (DomainTemplatesModal writes this key), then state updates.
    window.localStorage.setItem('templateDomain_r1', 'software_engineering');
    act(() => {
      setExternal!({ ...latest.data!, templateDomain: 'software_engineering' });
    });

    await waitFor(() => expect(latest.data!.templateDomain).toBe('software_engineering'));
    const cs = latest.data!.categorizedSkills as Record<string, string[]>;
    expect(cs.programming_languages).toEqual(['Python', 'Go']);
    expect(cs.soft_skills).toEqual(['Leadership']);
    expect(cs.frameworks).toEqual(['React']);
  });
});
