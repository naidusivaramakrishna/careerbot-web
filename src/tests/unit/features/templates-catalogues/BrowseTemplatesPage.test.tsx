/**
 * Component tests for BrowseTemplatesPage (/browse-templates).
 *
 * Covers the behaviours unique to this page:
 *   - Hero, step indicators, trust badges, and search section render
 *   - Domain cards are shown for all families by default
 *   - Typing in the search input filters visible domain cards
 *   - "No templates found" empty state appears for unmatched queries
 *   - Clear (✕) button empties the search
 *   - Quick-search buttons populate the search field
 *   - Clicking a domain card navigates to /browse-templates/<family>/<domain>
 *   - Clicking a catalogue card saves selected_catalogue to localStorage
 *   - Colour swatch click saves selected_colour to localStorage
 *   - "Get Started Free" opens AuthModal with signup form
 *   - "Sign in" opens AuthModal with signin form
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Router capture ────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  useParams: () => ({}),
}));

// ─── Heavy sub-component mocks ────────────────────────────────────────────────
vi.mock('@/components/SignUpModal', () => ({
  default: ({ open, initialFormType }: { open: boolean; initialFormType: string }) =>
    open
      ? React.createElement('div', { 'data-testid': 'auth-modal', 'data-form-type': initialFormType }, `Auth Modal - ${initialFormType}`)
      : null,
}));

vi.mock('@/app/(resume)/templates/_components/CategorySidebar', () => ({
  default: ({ categories, selectedCategory, onSelectCategory }: {
    categories: string[]; selectedCategory: string; onSelectCategory: (c: string) => void;
  }) =>
    React.createElement('div', { 'data-testid': 'category-sidebar' },
      categories.map((cat: string) =>
        React.createElement('button', {
          key: cat,
          onClick: () => onSelectCategory(cat),
          'data-selected': String(cat === selectedCategory),
        }, cat)
      )
    ),
}));

// ─── CatalogueThumbnail mock ──────────────────────────────────────────────────
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: ({ catalogueKey }: { catalogueKey: string }) =>
    React.createElement('div', { 'data-testid': `thumbnail-${catalogueKey}` }),
  CATALOGUE_PALETTES: {
    galaxy:  { palette: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'], defaultColor: '#ff0000' },
    eclipse: { palette: ['#111111', '#222222', '#333333', '#444444', '#555555'], defaultColor: '#111111' },
    ocean:   { palette: ['#0369a1', '#0c4a6e', '#1e40af', '#1d4ed8', '#2563eb'], defaultColor: '#0369a1' },
  },
  CODE_THUMBNAIL_CATALOGUES: new Set(['galaxy', 'eclipse', 'ocean']),
}));

// ─── STYLE_CATALOGUES mock ────────────────────────────────────────────────────
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy:  { label: 'Galaxy',  swatches: ['#1a1a1a', '#4b5563'], description: 'Dark professional', style: { fontFamily: 'arial' } },
    eclipse: { label: 'Eclipse', swatches: ['#ececec', '#d1d5db'], description: 'Light minimal',     style: { fontFamily: 'helvetica' } },
    ocean:   { label: 'Ocean',   swatches: ['#0369a1', '#0c4a6e'], description: 'Blue calm',         style: { fontFamily: 'arial' } },
  },
}));

// ─── Data constants mock ──────────────────────────────────────────────────────
// Small controlled dataset so filter/search tests are predictable
vi.mock('@/app/browse-templates/_data/constants', () => ({
  FAMILY_TEMPLATES: {
    software_engineering: { id: 1, image: '/assets/software.png', description: 'Tech template' },
    healthcare:           { id: 2, image: '/assets/healthcare.png', description: 'Healthcare template' },
  },
  FAMILY_DOMAINS: {
    software_engineering: ['software_engineering', 'web_development'],
    healthcare:           ['doctor_physician', 'clinical_nurse'],
  },
  DOMAIN_NAMES: {
    software_engineering: 'Software Engineering',
    healthcare:           'Healthcare',
  },
  DOMAIN_DISPLAY_NAMES: {
    software_engineering: 'Software Engineering',
    web_development:      'Web Development',
    doctor_physician:     'Doctor / Physician',
    clinical_nurse:       'Clinical Nurse',
  },
  CAREER_LEVELS: ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Manager'],
  FALLBACK_IMAGE: '/assets/fallback.jpg',
}));

// ─── Component under test ─────────────────────────────────────────────────────
import BrowseTemplatesPage from '@/app/browse-templates/page';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BrowseTemplatesPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the hero heading', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/find your/i)).toBeInTheDocument();
    expect(screen.getByText(/perfect resume style/i)).toBeInTheDocument();
  });

  it('renders the "Choose a Style" section heading', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('Choose a Style')).toBeInTheDocument();
  });

  it('renders the step indicators', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByPlaceholderText(/search by role, industry/i)).toBeInTheDocument();
  });

  it('renders trust badges', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('100% ATS Friendly')).toBeInTheDocument();
    expect(screen.getByText('14+ Industries')).toBeInTheDocument();
    expect(screen.getByText('Free to browse')).toBeInTheDocument();
  });

  it('renders all catalogue labels', () => {
    render(<BrowseTemplatesPage />);
    // Each label may appear twice (card label + selected-indicator span), so use getAllByText
    expect(screen.getAllByText('Galaxy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Eclipse').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ocean').length).toBeGreaterThan(0);
  });
});

describe('BrowseTemplatesPage — domain cards', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders domain cards for all families by default', () => {
    render(<BrowseTemplatesPage />);
    // Use unique domain display names (not family headings) to verify both families render
    expect(screen.getByText('Web Development')).toBeInTheDocument();   // software_engineering family
    expect(screen.getByText('Doctor / Physician')).toBeInTheDocument(); // healthcare family
    expect(screen.getByText('Clinical Nurse')).toBeInTheDocument();
  });

  it('clicking a domain card navigates to /browse-templates/<family>/<domain>', () => {
    render(<BrowseTemplatesPage />);
    // DomainCard accessible name = alt text + h3 text combined; use regex to match
    fireEvent.click(screen.getByRole('button', { name: /doctor \/ physician/i }));
    expect(mockPush).toHaveBeenCalledWith('/browse-templates/healthcare/doctor_physician');
  });

  it('clicking a software domain card navigates correctly', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: /web development/i }));
    expect(mockPush).toHaveBeenCalledWith('/browse-templates/software_engineering/web_development');
  });
});

describe('BrowseTemplatesPage — search', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('typing "healthcare" shows only healthcare domain cards', async () => {
    render(<BrowseTemplatesPage />);
    fireEvent.change(screen.getByPlaceholderText(/search by role, industry/i), {
      target: { value: 'healthcare' },
    });

    await waitFor(() => {
      expect(screen.getByText('Doctor / Physician')).toBeInTheDocument();
      expect(screen.getByText('Clinical Nurse')).toBeInTheDocument();
      expect(screen.queryByText('Web Development')).not.toBeInTheDocument();
    });
  });

  it('typing "software" shows only software engineering domain cards', async () => {
    render(<BrowseTemplatesPage />);
    fireEvent.change(screen.getByPlaceholderText(/search by role, industry/i), {
      target: { value: 'software' },
    });

    await waitFor(() => {
      // "Web Development" is unique to the software_engineering family
      expect(screen.getByText('Web Development')).toBeInTheDocument();
      expect(screen.queryByText('Doctor / Physician')).not.toBeInTheDocument();
      expect(screen.queryByText('Clinical Nurse')).not.toBeInTheDocument();
    });
  });

  it('typing an unmatched query shows "No templates found" empty state', async () => {
    render(<BrowseTemplatesPage />);
    fireEvent.change(screen.getByPlaceholderText(/search by role, industry/i), {
      target: { value: 'xyzzznothing' },
    });

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });
  });

  it('Clear (✕) button appears only when search has text', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search by role, industry/i), {
      target: { value: 'healthcare' },
    });

    expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
  });

  it('clicking the Clear button empties the search and restores all cards', async () => {
    render(<BrowseTemplatesPage />);
    const input = screen.getByPlaceholderText(/search by role, industry/i);

    fireEvent.change(input, { target: { value: 'healthcare' } });
    await waitFor(() => expect(screen.queryByText('Web Development')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    await waitFor(() => {
      expect(screen.getByText('Web Development')).toBeInTheDocument();
      expect(screen.getByText('Doctor / Physician')).toBeInTheDocument();
    });
  });

  it('quick-search "Healthcare" button populates the search field', async () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Healthcare' }));

    const input = screen.getByPlaceholderText(/search by role, industry/i) as HTMLInputElement;
    expect(input.value).toBe('Healthcare');
  });

  it('quick-search "Finance" button filters to show no cards (not in mock data)', async () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });
  });
});

describe('BrowseTemplatesPage — catalogue selection', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('clicking a catalogue card saves it to localStorage', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByTestId('thumbnail-ocean'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_catalogue', 'ocean');
  });

  it('clicking a colour swatch saves the colour to localStorage', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByLabelText('Select colour #0369a1'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_color_ocean', '#0369a1');
  });

  it('clicking a catalogue also saves it when a domain card is clicked afterwards', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByTestId('thumbnail-eclipse'));
    fireEvent.click(screen.getByRole('button', { name: /doctor \/ physician/i }));

    // handleDomainSelect re-saves the current catalogue before navigating
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_catalogue', 'eclipse');
    expect(mockPush).toHaveBeenCalledWith('/browse-templates/healthcare/doctor_physician');
  });
});

describe('BrowseTemplatesPage — auth modal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('auth modal is not visible initially', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
  });

  it('"Get Started Free" opens the auth modal with signup form', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: /get started free/i }));
    const modal = screen.getByTestId('auth-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.getAttribute('data-form-type')).toBe('signup');
  });

  it('"Sign in" opens the auth modal with signin form', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    const modal = screen.getByTestId('auth-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.getAttribute('data-form-type')).toBe('signin');
  });
});
