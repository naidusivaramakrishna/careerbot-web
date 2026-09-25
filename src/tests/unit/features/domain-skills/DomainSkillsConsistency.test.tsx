/**
 * PR #96 ai-review (58ef79ee) P1s — editor/preview domain split and the
 * domain-category API key.
 *
 *  - The Skills editor read the domain from `templateDomain_<resumeId>` while
 *    PreviewPanel (and so PDF/DOCX) read it from the applied career-level
 *    template in `careerLevelTemplates_<email>`. Skills typed under a category
 *    the preview's domain filters out vanished from the output.
 *  - Deleting a domain category sent the editor key (`clinical_skills`) while
 *    adding sent the label ("Clinical Skills & Diagnostics"); the backend
 *    slugifies the URL name, so the delete targeted a bucket that never exists.
 *  - core_engineering's "Project Management" is stored by the backend in the
 *    fixed project_management field, so the editor key must be
 *    `project_management` or the skills disappear after a reload.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

type AnyData = Record<string, unknown> & {
  resume_id?: string;
  categorizedSkills?: Record<string, unknown>;
};
const ctx: { value: Record<string, unknown> } = { value: {} };
const latest: { data: AnyData | null } = { data: null };

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ctx.value,
}));
vi.mock('@/app/(resume)/builder/creation/_context/ScoreContext', () => ({
  useScore: () => ({ canonicalScore: 50, setCanonicalScore: vi.fn() }),
}));
vi.mock('@/app/(resume)/builder/creation/_hooks/useResumeScorePreview', () => ({
  useResumeScorePreview: () => ({ score: 50 }),
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

// The preview's template components: expose the domain PreviewPanel chose.
const { domainProbe } = vi.hoisted(() => ({
  domainProbe: (name: string) => ({
    default: (props: { domainFamily?: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const R = require('react');
      return R.createElement('div', { 'data-testid': 'preview-template' }, `${name}:${props.domainFamily ?? ''}`);
    },
  }),
}));
vi.mock('@/app/(resume)/templates/Template2', () => domainProbe('Template2'));
vi.mock('@/app/(resume)/templates/Template3', () => domainProbe('Template3'));
vi.mock('@/app/(resume)/templates/Template4', () => domainProbe('Template4'));

const { mockDeleteSkillCategory } = vi.hoisted(() => ({ mockDeleteSkillCategory: vi.fn() }));
vi.mock('@/api/resumeApi', () => ({
  addSkillToCategory: vi.fn().mockResolvedValue({ id: 'new-id' }),
  deleteSkillCategory: (...args: unknown[]) => mockDeleteSkillCategory(...args),
  deleteSkillById: vi.fn().mockResolvedValue(undefined),
  downloadResume: vi.fn(),
}));
vi.mock('@/api/enhancerApi', () => ({
  addSkillToEnhancedResume: vi.fn(),
  deleteSkillFromEnhancedResume: vi.fn(),
  deleteSkillCategoryFromEnhancedResume: vi.fn(),
  downloadEnhancedResume: vi.fn(),
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
import PreviewPanel from '@/app/(resume)/builder/creation/_components/PreviewPanel';

const EMAIL = 'user@example.com';

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
  latest.data = resumeData;
  ctx.value = {
    resumeData,
    setResumeData,
    selectedTemplate: null,
    resumeStyle: {},
    sectionOrder: [],
    previewCatalogueKey: null,
  };
  return <Skills />;
}

function renderPreview(resumeData: AnyData) {
  ctx.value = {
    resumeData,
    setResumeData: vi.fn(),
    selectedTemplate: null,
    resumeStyle: {},
    sectionOrder: [],
    previewCatalogueKey: null,
  };
  return render(<PreviewPanel isTemplateSidebarOpen={false} onTabClick={vi.fn()} resumeId="r1" />);
}

const skills = () => ({
  programming_languages: ['Python'],
  frameworks: [],
  soft_skills: ['Empathy'],
  project_management: [],
  marketing_sales: [],
  clinical_skills: ['Triage'],
  legal_practice: ['Litigation'],
  custom_categories: [],
  skill_id_map: {},
});

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteSkillCategory.mockResolvedValue(undefined);
  window.localStorage.clear();
  window.sessionStorage.clear();
  latest.data = null;
});

describe('editor and preview resolve the domain from the same stored state', () => {
  it('uses the applied career-level template for both (stale templateDomain_<id> ignored)', async () => {
    applyCareerTemplate('healthcare');
    // Written by DomainTemplatesModal for an earlier legal choice; the preview never reads it.
    window.localStorage.setItem('templateDomain_r1', 'legal');
    const data = { resume_id: 'r1', categorizedSkills: skills() };

    renderPreview(data);
    await waitFor(() =>
      expect(screen.getByTestId('preview-template').textContent).toBe('Template2:healthcare'),
    );
    cleanup();

    render(<Harness initial={data} />);
    expect(screen.getByTestId('chips-Clinical Skills & Diagnostics').textContent).toBe('Triage');
    expect(screen.queryByTestId('chips-Legal Practice Areas')).toBeNull();
  });

  it('shows the healthcare categories for a user who applied healthcare before templateDomain_<id> existed', () => {
    applyCareerTemplate('healthcare');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills() }} />);
    expect(screen.getByTestId('chips-Clinical Skills & Diagnostics').textContent).toBe('Triage');
    // The healthcare preview filters programming_languages out; the editor must not offer it.
    expect(screen.queryByTestId('chips-Programming Languages')).toBeNull();
  });

  it('falls back to the general categories once the career template is cleared (style template applied)', () => {
    // TemplatesTab removes careerLevelTemplates/selectedTemplateId when a style
    // template is applied; the style templates print only the general categories.
    window.localStorage.setItem('userEmail', EMAIL);
    window.localStorage.setItem('templateDomain_r1', 'healthcare');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills() }} />);
    expect(screen.getByTestId('chips-Programming Languages').textContent).toBe('Python');
    expect(screen.queryByTestId('chips-Clinical Skills & Diagnostics')).toBeNull();
  });
});

describe('editor and preview scope template storage by the same account (ai-review 1a8259c1 P2)', () => {
  it('ignores a stale localStorage userEmail from a previous account', async () => {
    // Previous account in this browser applied legal; nothing clears userEmail on logout.
    window.localStorage.setItem('userEmail', 'old@example.com');
    window.localStorage.setItem('selectedTemplateId_old@example.com', 'old1');
    window.localStorage.setItem(
      'careerLevelTemplates_old@example.com',
      JSON.stringify([{ id: 'old1', name: 'legal - Mid-Level', domain_family: 'legal' }]),
    );
    // Logged-in account (getProfile → user@example.com) applied healthcare.
    window.localStorage.setItem(`selectedTemplateId_${EMAIL}`, 't1');
    window.localStorage.setItem(
      `careerLevelTemplates_${EMAIL}`,
      JSON.stringify([{ id: 't1', name: 'healthcare - Mid-Level', domain_family: 'healthcare' }]),
    );
    const data = { resume_id: 'r1', categorizedSkills: skills() };

    renderPreview(data);
    await waitFor(() =>
      expect(screen.getByTestId('preview-template').textContent).toBe('Template2:healthcare'),
    );
    cleanup();

    render(<Harness initial={data} />);
    await waitFor(() =>
      expect(screen.getByTestId('chips-Clinical Skills & Diagnostics').textContent).toBe('Triage'),
    );
    expect(screen.queryByTestId('chips-Legal Practice Areas')).toBeNull();
  });
});

describe('deleting a domain category', () => {
  it('sends the same category name that adding a skill sends', async () => {
    applyCareerTemplate('healthcare');
    window.localStorage.setItem('templateDomain_r1', 'healthcare');
    render(<Harness initial={{ resume_id: 'r1', categorizedSkills: skills() }} />);

    fireEvent.click(screen.getByTitle('Remove Clinical Skills & Diagnostics category'));
    await waitFor(() => expect(mockDeleteSkillCategory).toHaveBeenCalled());
    expect(mockDeleteSkillCategory).toHaveBeenCalledWith('r1', 'Clinical Skills & Diagnostics');
  });
});

describe('core_engineering Project Management', () => {
  it('is edited under the key the backend stores it in (project_management)', () => {
    applyCareerTemplate('core_engineering');
    window.localStorage.setItem('templateDomain_r1', 'core_engineering');
    const data = { resume_id: 'r1', categorizedSkills: { ...skills(), project_management: ['Scrum'] } };
    render(<Harness initial={data} />);
    expect(screen.getByTestId('chips-Project Management').textContent).toBe('Scrum');
  });
});

describe('custom categories whose slug matches another domain key (P2)', () => {
  it('stays visible in the editor, since every template prints custom_categories', () => {
    applyCareerTemplate('healthcare');
    const data = {
      resume_id: 'r1',
      categorizedSkills: {
        ...skills(),
        // A user-named "Tools & Platforms" comes back from the API as this id;
        // tools_platforms is a sales_business_development key.
        custom_categories: [{ id: 'custom_backend_tools_platforms', name: 'Tools platforms', skills: ['Salesforce'] }],
      },
    };
    render(<Harness initial={data} />);
    expect(screen.getByTestId('chips-Add Tools platforms skills...').textContent).toBe('Salesforce');
  });
});
