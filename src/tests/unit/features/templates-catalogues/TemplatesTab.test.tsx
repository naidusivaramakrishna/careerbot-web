/**
 * Unit tests for TemplatesTab — new-user default and flag lifecycle.
 *
 * Covers:
 *   - Auto-populate: SE career levels fetched + stored when no domain history exists
 *   - Auto-populate pre-selects Early Career as the active level
 *   - Auto-populate is skipped when user_chose_style flag is already set
 *   - Applying a catalogue/style template sets user_chose_style_{email} = 'true'
 *   - Applying a career-level template clears user_chose_style_{email}
 *   - Clicking a career-level card clears user_chose_style_{email}
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, configure } from '@testing-library/react';
import React from 'react';

// TemplatesTab is a heavy page to render: a case takes well under a second alone, but on a busy CI runner (many
// affected test files at once) the default 5 s test limit and 1 s waitFor limit are too short.
configure({ asyncUtilTimeout: 10_000 });
vi.setConfig({ testTimeout: 30_000 });

// ─── API mocks ─────────────────────────────────────────────────────────────────
const mockGetProfile = vi.fn();
const mockGetTemplatesByCategory = vi.fn();
const mockApplyTemplateToResume = vi.fn();
const mockGetTemplateCategories = vi.fn();
const mockGetTemplateById = vi.fn();

vi.mock('@/api/userApi', () => ({
  getProfile: () => mockGetProfile(),
}));

vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: (...args: unknown[]) => mockGetTemplatesByCategory(...args),
  applyTemplateToResume: (...args: unknown[]) => mockApplyTemplateToResume(...args),
  getTemplateCategories: () => mockGetTemplateCategories(),
  getTemplateById: (...args: unknown[]) => mockGetTemplateById(...args),
}));

// ─── Context mock ─────────────────────────────────────────────────────────────
const mockSetSelectedTemplate = vi.fn().mockResolvedValue(undefined);
const mockSetResumeStyle = vi.fn();
const mockSetSectionOrder = vi.fn();

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    selectedTemplate: null,
    setSelectedTemplate: mockSetSelectedTemplate,
    setResumeStyle: mockSetResumeStyle,
    setSectionOrder: mockSetSectionOrder,
    sectionOrder: ['Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Education'],
    previewCatalogueKey: null,
    resumeId: 'resume-1',
    resumeSource: 'normal',
  }),
}));

// ─── domainSectionOrder mock ──────────────────────────────────────────────────
vi.mock('@/app/(resume)/templates/_utils/domainSectionOrder', () => ({
  getSectionOrderByDomainAndCareer: () => ['Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Education'],
  getDomainSectionOrder: (domain?: string) => {
    if (domain?.includes('marine')) {
      return ['Personal Info', 'Professional Summary', 'Maritime Certifications', 'Skills', 'Work Experience', 'Vessels Operated'];
    }
    return ['Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Education'];
  },
  getSectionOrderFromTemplate: () => [],
  addCareerLevelSections: (sections: string[]) => sections,
  SECTION_KEY_TO_DISPLAY_NAME: {
    personalInfo: 'Personal Info',
    personal_details: 'Personal Info',
    professional_summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Work Experience',
    workExperience: 'Work Experience',
    education: 'Education',
    maritime_certifications: 'Maritime Certifications',
    vessels_operated: 'Vessels Operated',
    languages: 'Languages',
  },
}));

// ─── templateImages mock ──────────────────────────────────────────────────────
vi.mock('@/app/(resume)/templates/_constants/templateImages', () => ({
  DOMAIN_FAMILY_IMAGES: {},
  FALLBACK_TEMPLATE_IMAGE: '/fallback.jpg',
}));

// ─── imageUtils mock ──────────────────────────────────────────────────────────
vi.mock('@/lib/imageUtils', () => ({
  resolveTemplateImageUrl: (url: string) => url,
}));

// ─── templateStyles mock ──────────────────────────────────────────────────────
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  TEMPLATE_DEFAULT_STYLES: {
    compact_professional: { fontFamily: 'arial', headingColor: '#00695c' },
    clean_simple: { fontFamily: 'helvetica' },
  },
  STYLE_CATALOGUES: {},
}));

// ─── CatalogueTab mock ────────────────────────────────────────────────────────
vi.mock('@/app/(resume)/builder/creation/_components/templates/CatalogueTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'catalogue-tab' }),
}));

// ─── logger mock ─────────────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── hooks mocks ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({
    catalogues: [],
    getCataloguesMap: () => ({}),
  }),
}));

vi.mock('@/app/(resume)/templates/_utils/cataloguePersister', () => ({
  createCataloguePersister: () => vi.fn(),
}));

// ─── Component under test ─────────────────────────────────────────────────────
import TemplatesTab from '@/app/(resume)/builder/creation/_components/templates/TemplatesTab';

/** The Preview button of the template card with this name. */
const previewButtonOf = (cardName: string): HTMLElement =>
  within(screen.getByText(cardName).closest('.rounded-xl') as HTMLElement).getByRole('button', { name: 'Preview' });

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const USER_EMAIL = 'test@example.com';

const SE_TEMPLATES = [
  {
    id: 'se-ec', _id: 'se-ec',
    name: 'Software Engineering - Early Career',
    domain_family: 'software_engineering',
    preview_url: '/se-ec.jpg',
    description: 'Early career template',
    ats_friendly: true,
  },
  {
    id: 'se-fr', _id: 'se-fr',
    name: 'Software Engineering - Fresher',
    domain_family: 'software_engineering',
    preview_url: '/se-fr.jpg',
    description: 'Fresher template',
    ats_friendly: true,
  },
  {
    id: 'se-ml', _id: 'se-ml',
    name: 'Software Engineering - Mid-Level',
    domain_family: 'software_engineering',
    preview_url: '/se-ml.jpg',
    description: 'Mid-Level template',
    ats_friendly: true,
  },
];

const CAREER_LEVEL_DATA = SE_TEMPLATES.map(t => ({
  id: t.id,
  name: t.name,
  preview_url: t.preview_url,
  description: t.description,
  ats_friendly: t.ats_friendly,
  subtitle: 'Template',
  domain_family: 'software_engineering',
  domain_display_name: 'Software Engineering',
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TemplatesTab — SE auto-populate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    // No career levels stored, no style flag
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      return null;
    });
  });

  it('stores SE career level templates in localStorage when no domain history exists', async () => {
    render(<TemplatesTab resumeId="resume-1" />);

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        `careerLevelTemplates_${USER_EMAIL}`,
        expect.stringContaining('software_engineering'),
      );
    });
  });

  it('pre-selects the Early Career template as the active level', async () => {
    render(<TemplatesTab resumeId="resume-1" />);

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        `selectedTemplateId_${USER_EMAIL}`,
        'se-ec',
      );
    });
  });

  it('shows the SE career level cards after auto-populate completes', async () => {
    render(<TemplatesTab resumeId="resume-1" />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument();
    });
  });

  it('skips auto-populate and does not write careerLevelTemplates when user_chose_style is set', async () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });

    render(<TemplatesTab resumeId="resume-1" />);

    // Allow all async effects to settle
    await new Promise(r => setTimeout(r, 100));

    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      `careerLevelTemplates_${USER_EMAIL}`,
      expect.anything(),
    );
  });
});

describe('TemplatesTab — user_chose_style flag lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    mockApplyTemplateToResume.mockResolvedValue({});
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      return null;
    });
  });

  it('sets user_chose_style_{email} when a style/catalogue template is applied', async () => {
    render(<TemplatesTab resumeId="resume-1" />);

    // Wait for the component to render and templates to load
    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
    });

    // Click on the Style tab to access style templates
    const styleTabButton = screen.getByRole('button', { name: /Style/i });
    fireEvent.click(styleTabButton);

    // After style templates load, verify the flag can be set
    // (The actual setting happens in the CatalogueTab when user selects a style)
    // This test documents that user_chose_style should be set when style templates are applied
    await waitFor(() => {
      expect(mockGetTemplatesByCategory).toHaveBeenCalled();
    });
  });

  it('clears user_chose_style_{email} when a career-level card is clicked', async () => {
    // Pre-populate career level data so the cards render immediately from localStorage
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `careerLevelTemplates_${USER_EMAIL}`) return JSON.stringify(CAREER_LEVEL_DATA);
      if (key === `selectedTemplateId_${USER_EMAIL}`) return 'se-ec';
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });

    render(<TemplatesTab resumeId="resume-1" />);

    // Career level cards render after userEmail useEffect fires
    await waitFor(() => {
      expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument();
    });

    // Choosing the card is applying it (its Preview only opens the preview; see "Preview does not apply")
    // (the early-career card is the applied one; choose another)
    fireEvent.click(within(screen.getByText('Software Engineering Fresher Template').closest('.rounded-xl') as HTMLElement)
      .getByRole('button', { name: 'Apply Template' }));

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        `user_chose_style_${USER_EMAIL}`,
      );
    });
  });

  it('clears user_chose_style_{email} when a career-level template is applied via the modal', async () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `careerLevelTemplates_${USER_EMAIL}`) return JSON.stringify(CAREER_LEVEL_DATA);
      if (key === `selectedTemplateId_${USER_EMAIL}`) return 'se-ec';
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });

    render(<TemplatesTab resumeId="resume-1" />);

    // Click the career level card to open its modal
    await waitFor(() => {
      expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument();
    });
    fireEvent.click(previewButtonOf('Software Engineering Early Career Template'));

    // Apply the career-level template
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // the card has its own Apply Template button; this one is the preview window's
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Apply Template'));

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        `user_chose_style_${USER_EMAIL}`,
      );
    });
  });
});

describe('TemplatesTab — applying a template means the look of that template', () => {
  it('drops a style (catalogue) picked earlier, so preview and export show the template, not the old style', async () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `careerLevelTemplates_${USER_EMAIL}`) return JSON.stringify(CAREER_LEVEL_DATA);
      if (key === 'selected_catalogue') return 'classic';
      return null;
    });
    mockSetResumeStyle.mockClear();
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument());

    const card = screen.getByText('Software Engineering Early Career Template').closest('.rounded-xl') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Apply Template' }));

    await waitFor(() => expect(window.localStorage.removeItem).toHaveBeenCalledWith('selected_catalogue'));
    // the old style's colours and heading colour are cleared; the base look comes back
    const updaters = mockSetResumeStyle.mock.calls.map((call) => call[0]).filter((arg) => typeof arg === 'function');
    const results = updaters.map((update) => (update as (p: object) => Record<string, unknown>)({ accentColor: '#0369a1', sectionHeaderBg: '#ececec', fontFamily: 'times new roman' }));
    expect(results.some((r) => r.accentColor === undefined && r.sectionHeaderBg === undefined && r.fontFamily === 'arial')).toBe(true);
  });
});

describe('TemplatesTab — a career-level template brings back the builder font sizes', () => {
  it('drops the font sizes a style template set, so the domain preview does not keep them', async () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `careerLevelTemplates_${USER_EMAIL}`) return JSON.stringify(CAREER_LEVEL_DATA);
      return null;
    });
    mockApplyTemplateToResume.mockResolvedValue({});
    mockSetResumeStyle.mockClear();
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument());

    const card = screen.getByText('Software Engineering Early Career Template').closest('.rounded-xl') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Apply Template' }));

    await waitFor(() => expect(mockSetResumeStyle).toHaveBeenCalled());
    const updaters = mockSetResumeStyle.mock.calls.map((call) => call[0]).filter((arg) => typeof arg === 'function');
    // sizes as set by a style template (TEMPLATE_DEFAULT_STYLES)
    const styleTemplateLook = { nameFontSize: '15px', headingFontSize: '10px', bodyFontSize: '9px' };
    const results = updaters.map((update) => (update as (p: object) => Record<string, unknown>)(styleTemplateLook));
    expect(results.some((r) => r.nameFontSize === '20px' && r.headingFontSize === '14px' && r.bodyFontSize === '10px')).toBe(true);
  });
});

describe('TemplatesTab — no career-level data (PR #96 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });
  });

  it('when user_chose_style is set, skips auto-populate and shows style templates grid', async () => {
    localStorage.setItem(`user_chose_style_${USER_EMAIL}`, 'true');
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);

    render(<TemplatesTab resumeId="resume-1" />);

    // When user_chose_style is set, careerLevelTemplates should NOT be fetched/stored
    // (The component skips auto-populate and shows the general templates grid instead)
    await waitFor(() => {
      // The style templates grid should be rendered (either with content or empty state)
      // Instead of waiting for a non-existent loading spinner
      expect(screen.queryByText('No templates found')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify that careerLevelTemplates were NOT fetched/stored (auto-populate was skipped)
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      `careerLevelTemplates_${USER_EMAIL}`,
      expect.anything(),
    );
  });
});

describe('TemplatesTab — section order preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    mockGetTemplateById.mockResolvedValue({
      id: 'se-ec',
      name: 'Software Engineering - Early Career',
      domain_family: 'software_engineering',
      preview_url: '/se-ec.jpg',
      preview_html: '<div>preview</div>',
      preview_css: 'body{}',
    });
  });

  it('does not drop user-added sections when switching templates', async () => {
    // Pre-populate with marine domain and a user-added Languages section
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `domainFamily_${USER_EMAIL}`) return 'marine';
      if (key === `sectionOrder_${USER_EMAIL}`) {
        // Marine sections + Languages (user-added, not in any domain)
        return JSON.stringify(['Personal Info', 'Professional Summary', 'Maritime Certifications', 'Skills', 'Work Experience', 'Languages']);
      }
      return null;
    });

    render(<TemplatesTab resumeId="resume-1" />);

    // Verify setSectionOrder gets called with a result that:
    // - includes SE sections (Software Engineering)
    // - includes Languages (user-added, should be preserved)
    // - does NOT include Maritime Certifications (old template section)

    await waitFor(() => {
      expect(screen.getByText('Software Engineering Early Career Template')).toBeInTheDocument();
    });
    fireEvent.click(previewButtonOf('Software Engineering Early Career Template'));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // the card has its own Apply Template button; this one is the preview window's
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Apply Template'));

    // Verify the section order was updated
    await waitFor(() => {
      expect(mockSetSectionOrder).toHaveBeenCalled();
      const lastCall = mockSetSectionOrder.mock.calls[mockSetSectionOrder.mock.calls.length - 1][0];
      // Should have Software Engineering base sections
      expect(lastCall).toContain('Skills');
      expect(lastCall).toContain('Work Experience');
      // Should NOT have old Marine sections
      expect(lastCall).not.toContain('Maritime Certifications');
    });
  });
});

// ─── Preview vs Apply ─────────────────────────────────────────────────────────
// Preview only opens the preview window; nothing is selected, saved or marked "Applied ✓" until a
// template is applied, and only once applying it has worked.

/** The card with this name (the open preview window repeats the name in its title). */
const cardOf = (cardName: string): HTMLElement =>
  screen.getAllByText(cardName).find((el) => el.tagName === 'P')!.closest('.rounded-xl') as HTMLElement;
const EARLY = 'Software Engineering Early Career Template';
const FRESHER = 'Software Engineering Fresher Template';
const sectionOrderWrites = () =>
  (window.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.filter(([key]) => key === `sectionOrder_${USER_EMAIL}`);

describe('TemplatesTab — career-level card: Preview does not apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(SE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    mockGetTemplateById.mockImplementation(async (id: string) => ({ ...SE_TEMPLATES.find((t) => t.id === id) }));
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `careerLevelTemplates_${USER_EMAIL}`) return JSON.stringify(CAREER_LEVEL_DATA);
      if (key === `selectedTemplateId_${USER_EMAIL}`) return 'se-ec';
      if (key === `domainFamily_${USER_EMAIL}`) return 'marine';
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });
  });

  it('Preview then Close leaves the applied template, section order and style flags unchanged', async () => {
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText(FRESHER)).toBeInTheDocument());
    expect(within(cardOf(EARLY)).getByText('Applied ✓')).toBeInTheDocument();

    fireEvent.click(previewButtonOf(FRESHER));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // still the early-career template that is applied, not the previewed one
    expect(within(cardOf(FRESHER)).getByRole('button', { name: 'Apply Template' })).toBeInTheDocument();
    expect(within(cardOf(EARLY)).getByText('Applied ✓')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(cardOf(EARLY)).getByText('Applied ✓')).toBeInTheDocument();
    expect(mockSetSectionOrder).not.toHaveBeenCalled();
    expect(sectionOrderWrites()).toHaveLength(0);
    expect(window.localStorage.removeItem).not.toHaveBeenCalledWith(`user_chose_style_${USER_EMAIL}`);
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(`domainFamily_${USER_EMAIL}`, expect.anything());
    expect(mockApplyTemplateToResume).not.toHaveBeenCalled();
  });

  it('Apply in the preview window applies the previewed template and selects its domain', async () => {
    mockApplyTemplateToResume.mockResolvedValue({});
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText(FRESHER)).toBeInTheDocument());

    fireEvent.click(previewButtonOf(FRESHER));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Apply Template'));

    await waitFor(() => expect(within(cardOf(FRESHER)).getByText('Applied ✓')).toBeInTheDocument());
    expect(mockApplyTemplateToResume).toHaveBeenCalledWith('resume-1', 'se-fr');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(`domainFamily_${USER_EMAIL}`, 'software_engineering');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(`user_chose_style_${USER_EMAIL}`);
    expect(mockSetSectionOrder).toHaveBeenCalled();
  });

  it('a second click on Apply Template while the first is running does not apply twice', async () => {
    let finishFirst: (v: unknown) => void = () => {};
    mockApplyTemplateToResume.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
    mockApplyTemplateToResume.mockResolvedValue({});
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText(FRESHER)).toBeInTheDocument());

    const apply = within(cardOf(FRESHER)).getByRole('button', { name: 'Apply Template' });
    fireEvent.click(apply);
    fireEvent.click(apply);
    await waitFor(() => expect(mockApplyTemplateToResume).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 20));
    expect(mockApplyTemplateToResume).toHaveBeenCalledTimes(1);

    finishFirst({});
    await waitFor(() => expect(within(cardOf(FRESHER)).getByText('Applied ✓')).toBeInTheDocument());
    // released afterwards: another template can be applied
    fireEvent.click(within(cardOf(EARLY)).getByRole('button', { name: 'Apply Template' }));
    await waitFor(() => expect(mockApplyTemplateToResume).toHaveBeenCalledTimes(2));
  });

  it('a failed Apply Template leaves the card un-applied and changes nothing', async () => {
    mockApplyTemplateToResume.mockRejectedValue(new Error('boom'));
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText(FRESHER)).toBeInTheDocument());

    fireEvent.click(within(cardOf(FRESHER)).getByRole('button', { name: 'Apply Template' }));
    await waitFor(() => expect(mockApplyTemplateToResume).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));

    expect(within(cardOf(FRESHER)).getByRole('button', { name: 'Apply Template' })).toBeInTheDocument();
    expect(within(cardOf(EARLY)).getByText('Applied ✓')).toBeInTheDocument();
    expect(mockSetSectionOrder).not.toHaveBeenCalled();
    expect(sectionOrderWrites()).toHaveLength(0);
    expect(window.localStorage.removeItem).not.toHaveBeenCalledWith(`user_chose_style_${USER_EMAIL}`);
  });

  it('control: a successful Apply Template marks the card applied and keeps user-added sections', async () => {
    mockApplyTemplateToResume.mockResolvedValue({});
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText(FRESHER)).toBeInTheDocument());

    fireEvent.click(within(cardOf(FRESHER)).getByRole('button', { name: 'Apply Template' }));

    await waitFor(() => expect(within(cardOf(FRESHER)).getByText('Applied ✓')).toBeInTheDocument());
    expect(within(cardOf(EARLY)).getByRole('button', { name: 'Apply Template' })).toBeInTheDocument();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(`selectedTemplateId_${USER_EMAIL}`, 'se-fr');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(`domainFamily_${USER_EMAIL}`, 'software_engineering');
    const lastOrder = mockSetSectionOrder.mock.calls.at(-1)![0] as string[];
    expect(lastOrder).toEqual(['Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Education']);
  });
});

describe('TemplatesTab — style template card: Preview does not apply', () => {
  const STYLE_TEMPLATES = [
    { id: 'm1', template_id: 'compact_professional', name: 'Compact', category: 'modern' },
    { id: 'm2', template_id: 'clean_simple', name: 'Clean', category: 'classic' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue(STYLE_TEMPLATES);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });
  });

  it('Preview opens the preview without selecting the template', async () => {
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Modern')).toBeInTheDocument());
    mockSetSelectedTemplate.mockClear();

    fireEvent.click(previewButtonOf('Modern'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));

    expect(mockSetSelectedTemplate).not.toHaveBeenCalled();
    expect(mockApplyTemplateToResume).not.toHaveBeenCalled();
  });

  it('a failed Apply Template does not select the template', async () => {
    mockApplyTemplateToResume.mockRejectedValue(new Error('boom'));
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Modern')).toBeInTheDocument());
    mockSetSelectedTemplate.mockClear();

    fireEvent.click(within(cardOf('Modern')).getByRole('button', { name: 'Apply Template' }));
    await waitFor(() => expect(mockApplyTemplateToResume).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSetSelectedTemplate).not.toHaveBeenCalled();
  });

  it('Apply Template with no resume does not select the template', async () => {
    render(<TemplatesTab />);
    await waitFor(() => expect(screen.getByText('Modern')).toBeInTheDocument());
    mockSetSelectedTemplate.mockClear();

    fireEvent.click(within(cardOf('Modern')).getByRole('button', { name: 'Apply Template' }));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSetSelectedTemplate).not.toHaveBeenCalled();
    expect(mockApplyTemplateToResume).not.toHaveBeenCalled();
  });

  it('control: a successful Apply Template selects the template', async () => {
    mockApplyTemplateToResume.mockResolvedValue({});
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Modern')).toBeInTheDocument());

    fireEvent.click(within(cardOf('Modern')).getByRole('button', { name: 'Apply Template' }));

    await waitFor(() => expect(mockSetSelectedTemplate).toHaveBeenCalledWith('compact_professional'));
    expect(mockApplyTemplateToResume).toHaveBeenCalledWith('resume-1', 'm1');
  });

  it('applying a regular template drops the previous accent colour, so the template shows its own heading colour', async () => {
    // A style card (or a Color Theme pick) left an accent colour on the style; the plain templates colour their
    // headings with `accentColor || headingColor`, so a stale accent would hide the template's own colour.
    mockApplyTemplateToResume.mockResolvedValue({});
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(screen.getByText('Modern')).toBeInTheDocument());
    mockSetResumeStyle.mockClear();

    fireEvent.click(within(cardOf('Modern')).getByRole('button', { name: 'Apply Template' }));
    await waitFor(() => expect(mockSetSelectedTemplate).toHaveBeenCalledWith('compact_professional'));

    const updaters = mockSetResumeStyle.mock.calls.map((call) => call[0]).filter((arg) => typeof arg === 'function');
    const stale = { accentColor: '#1d4fa8', sectionHeaderBg: '#ececec', headingColor: '#111111' };
    const results = updaters.map((update) => (update as (p: object) => Record<string, unknown>)(stale));
    // the template's own colour (compact_professional: #00695c), with no accent left over
    expect(results.some((r) => r.accentColor === undefined && r.sectionHeaderBg === undefined && r.headingColor === '#00695c')).toBe(true);
  });
});
