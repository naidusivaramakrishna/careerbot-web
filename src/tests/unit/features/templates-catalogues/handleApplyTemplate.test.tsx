/**
 * Component-level tests for DomainTemplatesModal — "Apply This Template" button.
 *
 * Tests the full handleApplyTemplate flow:
 *   - Shows loading state while processing
 *   - Navigates to /builder/creation/<id> using an existing resume
 *   - Creates a new resume and navigates when no resumes exist
 *   - Resets loading and does NOT navigate on API error
 *   - Stores the selected template ID under the correct scoped localStorage key
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Router capture ────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  useParams: () => ({}),
}));

// ─── API mocks ─────────────────────────────────────────────────────────────────
const mockGetProfile = vi.fn();
const mockGetAllResumes = vi.fn();
const mockCreateResumeWithAuth = vi.fn();

vi.mock('@/api/userApi', () => ({
  getProfile: () => mockGetProfile(),
}));

vi.mock('@/api/resumeApi', () => ({
  getAllResumes: () => mockGetAllResumes(),
  createResumeWithAuth: () => mockCreateResumeWithAuth(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// ─── Component under test ──────────────────────────────────────────────────────
import DomainTemplatesModal from '@/app/(resume)/templates/_components/DomainTemplatesModal';

// ─── Fixtures ──────────────────────────────────────────────────────────────────
const FRESHER_TEMPLATE = {
  id: 'tmpl-1',
  _id: 'tmpl-1',
  name: 'Healthcare Fresher Template',
  preview_url: '/assets/templates/healthcare.png',
  description: 'ATS-optimised for fresh graduates',
  ats_friendly: true,
};

const defaultProps = {
  domainName: 'Healthcare',
  domainFamily: 'healthcare',
  templates: [FRESHER_TEMPLATE],
  onClose: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DomainTemplatesModal — Apply This Template button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: logged-in user with one existing resume
    mockGetProfile.mockResolvedValue({ email: 'user@example.com' });
    mockGetAllResumes.mockResolvedValue([{ id: 'resume-123', _id: 'resume-123' }]);
  });

  it('renders the Apply This Template button', () => {
    render(<DomainTemplatesModal {...defaultProps} />);
    expect(screen.getByText('Apply This Template')).toBeInTheDocument();
  });

  it('shows loading state while processing', async () => {
    // Make getProfile hang briefly so we can see the loading state
    mockGetProfile.mockReturnValue(new Promise(resolve => setTimeout(() => resolve({ email: 'user@example.com' }), 50)));
    mockGetAllResumes.mockResolvedValue([{ id: 'resume-123' }]);

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(screen.getByText('Applying Template...')).toBeInTheDocument();
    });
  });

  it('navigates to /builder/creation/<id> using the first existing resume', async () => {
    mockGetAllResumes.mockResolvedValue([{ id: 'resume-abc' }]);

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/resume-abc');
    });
  });

  it('falls back to _id when resume.id is absent', async () => {
    mockGetAllResumes.mockResolvedValue([{ _id: 'resume-xyz' }]);

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/resume-xyz');
    });
  });

  it('creates a new resume and navigates when no resumes exist', async () => {
    mockGetAllResumes.mockResolvedValue([]);
    mockCreateResumeWithAuth.mockResolvedValue({ id: 'new-resume-456' });

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockCreateResumeWithAuth).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/new-resume-456');
    });
  });

  it('creates a new resume when getAllResumes returns null', async () => {
    mockGetAllResumes.mockResolvedValue(null);
    mockCreateResumeWithAuth.mockResolvedValue({ id: 'new-resume-789' });

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/new-resume-789');
    });
  });

  it('stores template ID under email-scoped key when user is logged in', async () => {
    mockGetProfile.mockResolvedValue({ email: 'user@example.com' });
    mockGetAllResumes.mockResolvedValue([{ id: 'resume-123' }]);

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'selectedTemplateId_user@example.com',
      'tmpl-1',
    );
  });

  it('stores template ID under generic key when user is not logged in', async () => {
    mockGetProfile.mockResolvedValue(null);
    mockGetAllResumes.mockResolvedValue([{ id: 'resume-123' }]);

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('selectedTemplateId', 'tmpl-1');
  });

  it('does NOT navigate and resets loading when createResumeWithAuth fails', async () => {
    // getAllResumes returns empty — component falls through to createResumeWithAuth
    mockGetAllResumes.mockResolvedValue([]);
    // createResumeWithAuth rejects — this reaches the outer catch and calls setIsLoading(false)
    mockCreateResumeWithAuth.mockRejectedValue(new Error('Create resume failed'));

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(screen.queryByText('Applying Template...')).not.toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Apply This Template')).toBeInTheDocument();
  });

  it('button is disabled while loading', async () => {
    mockGetProfile.mockReturnValue(new Promise(() => {})); // never resolves

    render(<DomainTemplatesModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply This Template'));

    await waitFor(() => {
      expect(screen.getByText('Applying Template...')).toBeInTheDocument();
    });

    // The cancel button should be disabled too
    const cancelBtn = screen.getByText('Cancel');
    expect(cancelBtn).toBeDisabled();
  });
});
