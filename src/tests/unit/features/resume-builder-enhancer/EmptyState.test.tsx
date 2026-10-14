import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from '@/app/(resume)/builder/start/_components/EmptyState';
import { createResumeWithAuth, getAllResumesUnified } from '@/api/resumeApi';
import { toast } from 'sonner';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/api/resumeApi', () => ({
  createResumeWithAuth: vi.fn(),
  getAllResumesUnified: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock('@/app/(resume)/builder/start/_components/UploadResumeModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Upload resume modal">
        <button onClick={onClose}>Close upload</button>
      </div>
    ) : null,
}));

const mockCreateResumeWithAuth = vi.mocked(createResumeWithAuth);
const mockGetAllResumesUnified = vi.mocked(getAllResumesUnified);
const mockToast = vi.mocked(toast);

const onSelect = vi.fn();

const renderEmptyState = (selected: string | null = null) =>
  render(<EmptyState selected={selected} onSelect={onSelect} />);

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [],
    } as never);
    mockCreateResumeWithAuth.mockResolvedValue({ id: 'created-resume-1' } as never);
  });

  it('renders both entry cards and core feature bullets', () => {
    renderEmptyState();

    expect(screen.getByText('Build from Scratch')).toBeInTheDocument();
    expect(screen.getByText('Upload Existing Resume')).toBeInTheDocument();
    expect(screen.getByText('ATS-friendly formatting')).toBeInTheDocument();
    expect(screen.getByText('AI-powered enhancement')).toBeInTheDocument();
    expect(screen.getByText('PDF · DOCX')).toBeInTheDocument();
  });

  it('reuses an existing builder resume and routes to templates', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'existing-builder-1', name: 'Existing Resume' }],
      enhanced_resumes: [],
    } as never);

    renderEmptyState();

    fireEvent.click(screen.getByText('Build from Scratch').closest('div') as HTMLElement);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/templates');
    });
    expect(mockCreateResumeWithAuth).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith('builder');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'existing-builder-1');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'cached_resume_data',
      expect.stringContaining('"resumeId":"existing-builder-1"')
    );
  });

  it('creates a new resume when no builder resume exists and caches it', async () => {
    renderEmptyState();

    fireEvent.click(screen.getByText('Build from Scratch').closest('div') as HTMLElement);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/templates');
    });
    expect(mockCreateResumeWithAuth).toHaveBeenCalledTimes(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'created-resume-1');
  });

  it('shows creating state while resume creation is in flight', async () => {
    mockCreateResumeWithAuth.mockReturnValue(new Promise(() => undefined) as never);

    renderEmptyState();

    const buildCard = screen.getByText('Build from Scratch').closest('div') as HTMLElement;
    fireEvent.click(buildCard);

    expect(await screen.findByText('Creating your resume…')).toBeInTheDocument();
    expect(mockCreateResumeWithAuth).toHaveBeenCalledTimes(1);
  });

  it('routes unauthenticated users to signup on build failure', async () => {
    mockCreateResumeWithAuth.mockRejectedValue({ response: { status: 401 } });

    renderEmptyState();

    fireEvent.click(screen.getByText('Build from Scratch').closest('div') as HTMLElement);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please sign in to create a resume');
    });
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('shows Error messages for known build failures and resets creating state', async () => {
    mockCreateResumeWithAuth.mockRejectedValue(new Error('Creation quota reached'));

    renderEmptyState();

    fireEvent.click(screen.getByText('Build from Scratch').closest('div') as HTMLElement);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Creation quota reached');
    });
    expect(await screen.findByText('Step-by-step builder with AI assistance to craft a standout resume.')).toBeInTheDocument();
  });

  it('shows generic error for non-Error build failures', async () => {
    mockCreateResumeWithAuth.mockRejectedValue('bad response');

    renderEmptyState();

    fireEvent.click(screen.getByText('Build from Scratch').closest('div') as HTMLElement);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create resume. Please try again.');
    });
  });

  it('opens upload modal, marks upload selected, and clears selection on close', () => {
    renderEmptyState();

    fireEvent.click(screen.getByText('Upload Existing Resume').closest('div') as HTMLElement);

    expect(onSelect).toHaveBeenCalledWith('upload');
    expect(screen.getByRole('dialog', { name: 'Upload resume modal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close upload' }));

    expect(onSelect).toHaveBeenCalledWith('');
    expect(screen.queryByRole('dialog', { name: 'Upload resume modal' })).not.toBeInTheDocument();
  });

  it('applies selected styling to the chosen card', () => {
    const { rerender } = renderEmptyState('builder');

    expect(screen.getByText('Build from Scratch').closest('.relative')).toHaveClass('border-[#2557a7]');

    rerender(<EmptyState selected="upload" onSelect={onSelect} />);

    expect(screen.getByText('Upload Existing Resume').closest('.relative')).toHaveClass('border-[#2557a7]');
  });
});
