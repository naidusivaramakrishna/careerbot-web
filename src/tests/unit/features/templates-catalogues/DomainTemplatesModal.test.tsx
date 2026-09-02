/**
 * Component tests for DomainTemplatesModal — template selection and close behaviour.
 *
 * Covers:
 *   - Renders domain name, subtitle, ATS badge, feature bullets
 *   - All career level labels appear (sorted: Fresher → Mid-Level → Senior-Level)
 *   - Clicking a career level card updates the selected template details
 *   - Checkmark (✓) appears on the selected card and moves when selection changes
 *   - Cancel button and X close button both call onClose
 *
 * The "Apply This Template" button flow is covered separately in
 * handleApplyTemplate.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';

// ─── API mocks (imported by component even when not invoked in these tests) ───
vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/api/resumeApi', () => ({
  getAllResumes: vi.fn().mockResolvedValue([]),
  createResumeWithAuth: vi.fn().mockResolvedValue({ id: 'new-resume' }),
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

// ─── Component under test ─────────────────────────────────────────────────────
import DomainTemplatesModal from '@/app/(resume)/templates/_components/DomainTemplatesModal';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// Intentionally supplied out of career-level order to verify sorting
const TEMPLATES = [
  {
    id: 'tmpl-senior',
    _id: 'tmpl-senior',
    name: 'Healthcare Senior-Level Template',
    preview_url: '/senior.png',
    description: 'For experienced professionals',
    ats_friendly: true,
  },
  {
    id: 'tmpl-fresher',
    _id: 'tmpl-fresher',
    name: 'Healthcare Fresher Template',
    preview_url: '/fresher.png',
    description: 'ATS-optimised for fresh graduates',
    ats_friendly: true,
  },
  {
    id: 'tmpl-mid',
    _id: 'tmpl-mid',
    name: 'Healthcare Mid-Level Template',
    preview_url: '/mid.png',
    description: 'For mid-career professionals',
    ats_friendly: true,
  },
];

const mockOnClose = vi.fn();

const defaultProps = {
  domainName: 'Healthcare',
  domainFamily: 'healthcare',
  templates: TEMPLATES,
  onClose: mockOnClose,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DomainTemplatesModal — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the domain name in the header', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('renders the "Select your career level" subtitle', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Select your career level')).toBeInTheDocument();
  });

  it('renders all three career level labels', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Fresher')).toBeInTheDocument();
    expect(screen.getByText('Mid-Level')).toBeInTheDocument();
    expect(screen.getByText('Senior-Level')).toBeInTheDocument();
  });

  it('shows the "100% ATS Friendly" badge', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText(/100% ATS Friendly/i)).toBeInTheDocument();
  });

  it('shows all four feature bullets', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Professional layout')).toBeInTheDocument();
    expect(screen.getByText('Easy to customize')).toBeInTheDocument();
    expect(screen.getByText('ATS optimized')).toBeInTheDocument();
    expect(screen.getByText('Print friendly')).toBeInTheDocument();
  });

  it('displays the description of the initially selected (Fresher) template', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    // Templates are sorted; Fresher ends up at index 0 and is selected by default
    expect(screen.getByText('ATS-optimised for fresh graduates')).toBeInTheDocument();
  });

  it('shows the combined "Domain + Career Level + Template" title for the selected card', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Healthcare Fresher Template')).toBeInTheDocument();
  });
});

describe('DomainTemplatesModal — template card selection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking the Mid-Level card updates the title to Mid-Level', async () => {
    render(<DomainTemplatesModal {...defaultProps} />);

    // Fresher is selected by default after sort
    expect(screen.getByText('Healthcare Fresher Template')).toBeInTheDocument();

    // The career level card buttons are identified by the alt text of their contained image
    fireEvent.click(screen.getByRole('button', { name: /mid-level/i }));

    await waitFor(() => {
      expect(screen.getByText('Healthcare Mid-Level Template')).toBeInTheDocument();
    });
  });

  it('clicking the Senior-Level card updates the description', async () => {
    render(<DomainTemplatesModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /senior-level/i }));

    await waitFor(() => {
      expect(screen.getByText('For experienced professionals')).toBeInTheDocument();
    });
  });

  it('the initially selected (Fresher) card has a ✓ checkmark inside it', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    const fresherBtn = screen.getByRole('button', { name: /fresher/i });
    expect(within(fresherBtn).getByText('✓')).toBeInTheDocument();
  });

  it('checkmark moves from Fresher to Mid-Level after selecting Mid-Level', async () => {
    render(<DomainTemplatesModal {...defaultProps} />);

    const fresherBtn = screen.getByRole('button', { name: /fresher/i });
    const midLevelBtn = screen.getByRole('button', { name: /mid-level/i });

    fireEvent.click(midLevelBtn);

    await waitFor(() => {
      expect(within(midLevelBtn).getByText('✓')).toBeInTheDocument();
      expect(within(fresherBtn).queryByText('✓')).not.toBeInTheDocument();
    });
  });
});

describe('DomainTemplatesModal — close behaviour', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Cancel button calls onClose', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('X close button (top-right) calls onClose', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    // The close button is the first button rendered in the modal (absolute top-right)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('DomainTemplatesModal — edge cases', () => {
  it('renders correctly with a single template', () => {
    const single = [{
      id: 'tmpl-1',
      _id: 'tmpl-1',
      name: 'Healthcare Fresher Template',
      preview_url: '/fresher.png',
      description: 'Fresh graduate template',
      ats_friendly: true,
    }];
    render(<DomainTemplatesModal {...defaultProps} templates={single} />);
    expect(screen.getByText('Healthcare Fresher Template')).toBeInTheDocument();
  });
});
