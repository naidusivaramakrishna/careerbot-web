/**
 * PR #96 — domain-aware Skills editor regressions.
 *
 * Each test here failed on the PR head (cc916e25) and passes after the fix:
 *   - 'general' domain (no applied career-level template) hid every
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

const search: { source: string | null } = { source: null };
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'source' ? search.source : null) }),
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
const mockRenameCategory = vi.fn().mockResolvedValue(undefined);
const mockRenameEnhanced = vi.fn().mockResolvedValue(undefined);
vi.mock('@/api/resumeApi', () => ({
  addSkillToCategory: vi.fn().mockResolvedValue({ id: 'new-id' }),
  deleteSkillCategory: vi.fn().mockResolvedValue(undefined),
  renameSkillCategory: (...args: unknown[]) => mockRenameCategory(...args),
  deleteSkillById: (...args: unknown[]) => mockDeleteSkillById(...args),
}));
const mockDeleteSkillFromEnhanced = vi.fn().mockResolvedValue(undefined);
vi.mock('@/api/enhancerApi', () => ({
  addSkillToEnhancedResume: vi.fn(),
  deleteSkillFromEnhancedResume: (...args: unknown[]) => mockDeleteSkillFromEnhanced(...args),
  deleteSkillCategoryFromEnhancedResume: vi.fn(),
  renameSkillCategoryInEnhancedResume: (...args: unknown[]) => mockRenameEnhanced(...args),
}));
// Template storage is scoped by the logged-in account's email (getProfile).
vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'user@example.com' }),
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
  ctx.value = { resumeData, setResumeData, bumpResumeSavedVersion: vi.fn(), resolveSkillRemovedSuggestions: vi.fn() };
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

// The editor resolves its domain from the applied career-level template, the
// same storage PreviewPanel reads (see DomainSkillsConsistency.test.tsx).
function applyCareerTemplate(domain: string) {
  const email = 'user@example.com';
  window.localStorage.setItem('userEmail', email);
  window.localStorage.setItem(`selectedTemplateId_${email}`, 't1');
  window.localStorage.setItem(
    `careerLevelTemplates_${email}`,
    JSON.stringify([{ id: 't1', name: `${domain} - Mid-Level`, domain_family: domain }]),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  latest.data = null;
  search.source = null;
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
    applyCareerTemplate('healthcare');
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
    // ...nor dropped from the flat skills list (completeness badge, tips panel).
    expect(latest.data!.skills).toEqual(expect.arrayContaining(['Python', 'Go', 'React', 'Scrum', 'SEO', 'Triage', 'NewSkill']));
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

    // Domain applied elsewhere (a career-level template), then state updates.
    applyCareerTemplate('software_engineering');
    act(() => {
      setExternal!({ ...latest.data! });
    });

    await waitFor(() => expect(screen.getByTestId('chips-Databases & Data Storage')).toBeTruthy());
    const cs = latest.data!.categorizedSkills as Record<string, string[]>;
    expect(cs.programming_languages).toEqual(['Python', 'Go']);
    expect(cs.soft_skills).toEqual(['Leadership']);
    expect(cs.frameworks).toEqual(['React']);
  });
});

// ai-review (2817c0db) P2: a domain switch hides categories the new domain
// doesn't print. Hidden is display-only: nothing is sent to the server for
// them, the stored data is untouched, and they come back on switching back.
describe('Skills editor — switching domain away and back', () => {
  it('hides other-domain skills without deleting them, and shows them again on switching back', async () => {
    const { filterSkillsByDomain } = await import('@/app/(resume)/templates/skillsFilterByDomain');
    const { deleteSkillCategory } = await import('@/api/resumeApi');
    applyCareerTemplate('software_engineering');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: { ...baseSkills(), clinical_skills: [] } }} />);
    expect(screen.getByTestId('chips-Programming Languages').textContent).toBe('Python,Go');

    applyCareerTemplate('healthcare');
    act(() => { setExternal!({ ...latest.data! }); });
    await waitFor(() => expect(screen.queryByTestId('chips-Programming Languages')).toBeNull());
    fireEvent.click(screen.getByTestId('add-Clinical Skills & Diagnostics'));
    const hidden = latest.data!.categorizedSkills as Record<string, string[]>;
    expect(hidden.programming_languages).toEqual(['Python', 'Go']);
    expect(hidden.clinical_skills).toEqual(['NewSkill']);
    // The PDF/preview filter drops the key from its output only.
    expect(filterSkillsByDomain(hidden as never, 'healthcare')).not.toHaveProperty('programming_languages');
    expect(deleteSkillCategory).not.toHaveBeenCalled();
    expect(mockDeleteSkillById).not.toHaveBeenCalled();

    applyCareerTemplate('software_engineering');
    act(() => { setExternal!({ ...latest.data! }); });
    await waitFor(() => expect(screen.getByTestId('chips-Programming Languages').textContent).toBe('Python,Go'));
    expect(
      (filterSkillsByDomain(latest.data!.categorizedSkills as never, 'software_engineering') as Record<string, unknown>)
        .programming_languages,
    ).toEqual(['Python', 'Go']);
  });
});

// PR #148 ai-review (ebe5ea2e) P2: a skill with no stored id. The builder's
// delete route (delete_skill_from_resume) falls back to a case-insensitive
// name match, so builder resumes must still send the name; the enhanced
// route matches ids only, so enhanced resumes must reject and keep the chip.
describe('Skills editor — removing a skill that has no stored id', () => {
  const noIdSkills = () => ({
    ...baseSkills(),
    custom_categories: [{ id: 'c1', name: 'DevOps Tools', skills: ['Docker'] }],
  });

  it('builder resume: deletes a custom-category skill by name', async () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: noIdSkills() }} />);
    fireEvent.click(screen.getByTestId('remove-Add DevOps Tools skills...'));
    await waitFor(() => expect(mockDeleteSkillById).toHaveBeenCalledWith('r1', 'DevOps Tools', 'Docker'));
  });

  it('builder resume: deletes a predefined-category skill by name', async () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: noIdSkills() }} />);
    fireEvent.click(screen.getByTestId('remove-Programming Languages'));
    await waitFor(() => expect(mockDeleteSkillById).toHaveBeenCalledWith('r1', expect.any(String), 'Python'));
  });

  it('control: enhanced resume never sends the name as an id', async () => {
    search.source = 'enhanced';
    const { toast } = await import('sonner');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: noIdSkills() }} />);
    fireEvent.click(screen.getByTestId('remove-Add DevOps Tools skills...'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockDeleteSkillFromEnhanced).not.toHaveBeenCalled();
    expect(mockDeleteSkillById).not.toHaveBeenCalled();
  });
});

describe('Skills editor — re-creating a deleted predefined category', () => {
  const nameCategory = (name: string) => {
    fireEvent.click(screen.getByText('Add Custom Category'));
    const input = screen.getByPlaceholderText('Category name (e.g. Architecture Patterns)');
    fireEvent.change(input, { target: { value: name } });
    fireEvent.blur(input);
  };

  it('blocks a name that matches a category still on screen', async () => {
    const { toast } = await import('sonner');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: baseSkills() }} />);
    nameCategory('Programming Languages');
    expect(toast.error).toHaveBeenCalledWith('"Programming Languages" category already exists');
  });

  it('allows the name once that predefined category has been deleted', async () => {
    const { toast } = await import('sonner');
    const skills = { ...baseSkills(), programming_languages: [], hidden_predefined_categories: ['programming_languages'] };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    nameCategory('Programming Languages');
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('Skills editor — renaming a custom category', () => {
  const PLACEHOLDER = 'Category name (e.g. Architecture Patterns)';
  const withCustom = (skills: string[] = ['Docker']) => ({
    ...baseSkills(),
    custom_categories: [{ id: 'c1', name: 'DevOps Tools', skills }],
    skill_id_map: { 'DevOps Tools:Docker': 'skill-123' },
  });
  const rename = (to: string) => {
    const input = screen.getByDisplayValue('DevOps Tools');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: to } });
    fireEvent.blur(input);
  };
  const customNames = () =>
    (latest.data!.categorizedSkills as unknown as { custom_categories: Array<{ name: string }> }).custom_categories.map((c) => c.name);

  it('renames a saved category on the server and re-keys its skill ids', async () => {
    const { toast } = await import('sonner');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    rename('Cloud Tools');
    await waitFor(() => expect(mockRenameCategory).toHaveBeenCalledWith('r1', 'DevOps Tools', 'Cloud Tools'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Category renamed successfully.'));
    expect(customNames()).toEqual(['Cloud Tools']);
    const idMap = (latest.data!.categorizedSkills as unknown as { skill_id_map: Record<string, string> }).skill_id_map;
    expect(idMap).toEqual({ 'Cloud Tools:Docker': 'skill-123' });
  });

  it('uses the enhancer endpoint for an enhanced resume', async () => {
    search.source = 'enhanced';
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    rename('Cloud Tools');
    await waitFor(() => expect(mockRenameEnhanced).toHaveBeenCalledWith('r1', 'DevOps Tools', 'Cloud Tools'));
    expect(mockRenameCategory).not.toHaveBeenCalled();
  });

  it('reverts the name and shows an error when the server rejects it', async () => {
    const { toast } = await import('sonner');
    mockRenameCategory.mockRejectedValueOnce({ response: { status: 409 } });
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    rename('Cloud Tools');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('"Cloud Tools" category already exists'));
    expect(customNames()).toEqual(['DevOps Tools']);
  });

  it('does not call the server for a category with no saved skills', async () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom([]) }} />);
    rename('Cloud Tools');
    expect(mockRenameCategory).not.toHaveBeenCalled();
    expect(customNames()).toEqual(['Cloud Tools']);
  });

  it('after a rejected duplicate name, a second rename still targets this category on the server', async () => {
    const skills = {
      ...baseSkills(),
      custom_categories: [
        { id: 'c1', name: 'DevOps Tools', skills: ['Docker'] },
        { id: 'c2', name: 'Cloud Tools', skills: ['AWS'] },
      ],
    };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    const input = screen.getByDisplayValue('DevOps Tools') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'Cloud Tools' } });
    act(() => input.blur()); // duplicate: refused, name put back, box refocused
    await waitFor(() => expect(input.value).toBe('DevOps Tools'));

    fireEvent.change(input, { target: { value: 'Platform Tools' } });
    act(() => input.blur());

    await waitFor(() => expect(mockRenameCategory).toHaveBeenCalledTimes(1));
    expect(mockRenameCategory).toHaveBeenCalledWith('r1', 'DevOps Tools', 'Platform Tools');
  });

  it("caps the name box at the API's 50-character category name limit", () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    expect((screen.getByDisplayValue('DevOps Tools') as HTMLInputElement).maxLength).toBe(50);
  });

  it('offers a Rename button that focuses and selects the name box', () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    const input = screen.getByDisplayValue('DevOps Tools') as HTMLInputElement;
    expect(document.activeElement).not.toBe(input);
    fireEvent.click(screen.getByRole('button', { name: 'Rename DevOps Tools' }));
    expect(document.activeElement).toBe(input);
  });

  it('rejects a built-in name up front, without calling the server', async () => {
    const { toast } = await import('sonner');
    search.source = 'enhanced'; // predefined labels are not on screen, so only the built-in rule applies
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    rename('Soft Skills');
    expect(mockRenameEnhanced).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('"Soft Skills" is a built-in category name. Please choose a different name.');
    expect(customNames()).toEqual(['DevOps Tools']);
  });

  it("shows the backend's reason when it refuses a name", async () => {
    const { toast } = await import('sonner');
    mockRenameCategory.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: { message: "Validation error on field 'new_name': 'Misc Stuff' is not a recognized professional skill category." } },
      },
    });
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    rename('Misc Stuff');
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("'Misc Stuff' is not a recognized professional skill category."),
    );
    expect(customNames()).toEqual(['DevOps Tools']);
  });

  it('locks a built-in category shown as a row: read-only name, no Rename button', () => {
    const skills = { ...baseSkills(), custom_categories: [{ id: 'c1', name: 'marketingSales', skills: ['Lead Generation'] }] };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    expect((screen.getByDisplayValue('marketingSales') as HTMLInputElement).readOnly).toBe(true);
    expect(screen.queryByRole('button', { name: 'Rename marketingSales' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove marketingSales' })).toBeTruthy();
  });

  it('keeps the name box editable while a typed name passes through a built-in one', () => {
    // "Framework" (on the way to "Frameworks & Libraries") slugifies to a
    // built-in bucket; the lock is for a saved built-in row, not for a draft.
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    const input = screen.getByDisplayValue('DevOps Tools') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Framework' } });
    expect(input.readOnly).toBe(false);
    expect(screen.getByRole('button', { name: 'Rename Framework' })).toBeTruthy();
    fireEvent.change(input, { target: { value: 'Frameworks & Libraries' } });
    expect(input.readOnly).toBe(false);
  });

  it('keeps a saved built-in row locked by the name it had at focus, whatever the box holds', () => {
    // The opposite case: the lock follows the focused name, not the live text,
    // so a non-built-in value cannot unlock a stored built-in row.
    const skills = { ...baseSkills(), custom_categories: [{ id: 'c1', name: 'marketingSales', skills: ['Lead Generation'] }] };
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills }} />);
    const input = screen.getByDisplayValue('marketingSales') as HTMLInputElement;
    fireEvent.focus(input);
    expect(input.readOnly).toBe(true);
    fireEvent.change(input, { target: { value: 'Growth Tools' } });
    expect(input.readOnly).toBe(true);
    expect(screen.queryByRole('button', { name: /^Rename/ })).toBeNull();
  });

  it('puts the saved name back when the box is emptied', () => {
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: withCustom() }} />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(mockRenameCategory).not.toHaveBeenCalled();
    expect(customNames()).toEqual(['DevOps Tools']);
  });
});
