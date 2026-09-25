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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── API mocks ─────────────────────────────────────────────────────────────────
const mockGetProfile = vi.fn();
const mockGetTemplatesByCategory = vi.fn();
const mockApplyTemplateToResume = vi.fn();
const mockGetTemplateCategories = vi.fn();

vi.mock('@/api/userApi', () => ({
  getProfile: () => mockGetProfile(),
}));

vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: (...args: unknown[]) => mockGetTemplatesByCategory(...args),
  applyTemplateToResume: (...args: unknown[]) => mockApplyTemplateToResume(...args),
  getTemplateCategories: () => mockGetTemplateCategories(),
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
    sectionOrder: [],
    previewCatalogueKey: null,
  }),
}));

// ─── domainSectionOrder mock ──────────────────────────────────────────────────
vi.mock('@/app/(resume)/templates/_utils/domainSectionOrder', () => ({
  getSectionOrderByDomainAndCareer: () => ['Summary', 'Experience', 'Education', 'Skills'],
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
    compact_professional: { fontFamily: 'arial' },
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

// ─── Component under test ─────────────────────────────────────────────────────
import TemplatesTab from '@/app/(resume)/builder/creation/_components/templates/TemplatesTab';

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
    mockGetTemplatesByCategory.mockResolvedValue([]);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    mockApplyTemplateToResume.mockResolvedValue({});
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      return null;
    });
  });

  it('sets user_chose_style_{email} = "true" when a catalogue template is applied', async () => {
    render(<TemplatesTab resumeId="resume-1" />);

    // Wait for profile to load so userEmail state is set
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());

    // Click a default style template card to open the preview modal
    // Cards render their subtitle ("Modern"), not the full name ("Compact Professional")
    const compactCard = await waitFor(() => screen.getAllByText('Modern')[0]);
    fireEvent.click(compactCard);

    // Confirm modal is open and click Apply
    await waitFor(() => expect(screen.getByText('Apply This Template')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        `user_chose_style_${USER_EMAIL}`,
        'true',
      );
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

    fireEvent.click(screen.getByText('Software Engineering Early Career Template'));

    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      `user_chose_style_${USER_EMAIL}`,
    );
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
    fireEvent.click(screen.getByText('Software Engineering Early Career Template'));

    // Apply the career-level template
    await waitFor(() => expect(screen.getByText('Apply This Template')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        `user_chose_style_${USER_EMAIL}`,
      );
    });
  });
});

describe('TemplatesTab — no career-level data (PR #96 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ email: USER_EMAIL });
    mockGetTemplatesByCategory.mockResolvedValue([]);
    mockGetTemplateCategories.mockResolvedValue(['All']);
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'userEmail') return USER_EMAIL;
      if (key === `user_chose_style_${USER_EMAIL}`) return 'true';
      return null;
    });
  });

  it('shows the template grid instead of a spinner that never resolves', async () => {
    render(<TemplatesTab resumeId="resume-1" />);
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText('Modern').length).toBeGreaterThan(0));
    expect(screen.queryByText('Loading career level templates...')).not.toBeInTheDocument();
  });
});
