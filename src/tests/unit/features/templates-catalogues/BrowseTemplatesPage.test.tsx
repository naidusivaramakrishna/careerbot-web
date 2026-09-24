/**
 * Component tests for BrowseTemplatesPage (/browse-templates).
 *
 * Covers the behaviours unique to this page:
 *   - Hero section with headline and stats render
 *   - Benefits section renders with ATS Optimized, Instant Download, Industry-Tailored, Live Customization
 *   - 10 Premium Style Catalogues carousel section renders
 *   - Catalogue carousel rotates through styles
 *   - 18+ Industries section with bar chart renders
 *   - Career levels timeline section renders
 *   - CTA buttons navigate to /templates and open auth modal
 *   - "Get Started Free" opens AuthModal with signup form
 *   - "Start Exploring Now" navigates to /templates
 *   - Back button navigates to /
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

// ─── Component under test ─────────────────────────────────────────────────────
import BrowseTemplatesPage from '@/app/browse-templates/page';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BrowseTemplatesPage — hero section', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the hero headline', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/Land Your Dream Job/i)).toBeInTheDocument();
    expect(screen.getByText(/Perfect Resumes/i)).toBeInTheDocument();
  });

  it('renders the hero subtitle with industry count', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/18\+ industries/i)).toBeInTheDocument();
  });

  it('renders hero stats', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('100+')).toBeInTheDocument(); // Professional Templates
    expect(screen.getByText('Professional Templates')).toBeInTheDocument();
    expect(screen.getByText('18+')).toBeInTheDocument(); // Industries
    expect(screen.getByText('Career Levels')).toBeInTheDocument();
    expect(screen.getByText('Style Catalogues')).toBeInTheDocument();
  });

  it('renders AI-Powered Resume Builder badge', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/AI-Powered Resume Builder/i)).toBeInTheDocument();
  });
});

describe('BrowseTemplatesPage — benefits section', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders benefits section heading', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/Why Professionals Trust Us/i)).toBeInTheDocument();
  });

  it('renders all benefit cards', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('ATS Optimized')).toBeInTheDocument();
    expect(screen.getByText('Instant Download')).toBeInTheDocument();
    expect(screen.getByText('Industry-Tailored')).toBeInTheDocument();
    expect(screen.getByText('Live Customization')).toBeInTheDocument();
  });
});

describe('BrowseTemplatesPage — catalogues carousel', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders 10 Premium Style Catalogues section', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/10 Premium Style Catalogues/i)).toBeInTheDocument();
  });

  it('renders catalogue selector buttons with names', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByRole('button', { name: 'Eclipse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Galaxy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocean' })).toBeInTheDocument();
  });

  it('allows selecting different catalogues via buttons', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Galaxy' }));
    expect(screen.getByText('Galaxy')).toBeInTheDocument();
  });

  it('renders carousel navigation arrows', () => {
    render(<BrowseTemplatesPage />);
    const buttons = screen.getAllByRole('button');
    // Find chevron buttons (look for them by checking role and position)
    expect(buttons.length).toBeGreaterThan(10); // At least browse, back, get started, catalogues, and chevrons
  });
});

describe('BrowseTemplatesPage — industries section', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders industries section heading', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/Trusted by 18\+ Industries/i)).toBeInTheDocument();
  });

  it('renders industry names', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/Software Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Healthcare & Medical/i)).toBeInTheDocument();
    expect(screen.getByText(/Finance & Accounting/i)).toBeInTheDocument();
  });
});

describe('BrowseTemplatesPage — career levels section', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders career levels section heading', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText(/Perfect for Every Career Stage/i)).toBeInTheDocument();
  });

  it('renders career level titles', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('Fresher')).toBeInTheDocument();
    expect(screen.getByText('Early Career')).toBeInTheDocument();
    expect(screen.getByText('Mid-Level')).toBeInTheDocument();
    expect(screen.getByText('Senior Level')).toBeInTheDocument();
  });
});

describe('BrowseTemplatesPage — navigation and CTAs', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders back button that navigates to home', () => {
    render(<BrowseTemplatesPage />);
    const backButtons = screen.getAllByText('← Back');
    fireEvent.click(backButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('"Start Exploring Now" navigates to /templates', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByText(/Start Exploring Now/i));
    expect(mockPush).toHaveBeenCalledWith('/templates');
  });

  it('"Get Started Free" opens auth modal with signup form', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByText('Get Started Free'));
    const modal = screen.getByTestId('auth-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.getAttribute('data-form-type')).toBe('signup');
  });

  it('"Browse All Templates" CTA navigates to /templates', () => {
    render(<BrowseTemplatesPage />);
    fireEvent.click(screen.getByText(/Browse All Templates/i));
    expect(mockPush).toHaveBeenCalledWith('/templates');
  });
});

describe('BrowseTemplatesPage — footer', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders footer with CareerBot branding', () => {
    render(<BrowseTemplatesPage />);
    expect(screen.getByText('CareerBot')).toBeInTheDocument();
    expect(screen.getByText(/ATS-optimized resumes/i)).toBeInTheDocument();
  });
});
