import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from '@/app/(resume)/builder/start/_components/EmptyState';
import { createResumeWithAuth, getAllResumesUnified } from '@/api/resumeApi';
import { toast } from 'sonner';

const { mockPush, search } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  search: { params: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => search.params,
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
    search.params = new URLSearchParams();
    window.sessionStorage.clear();
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [],
    } as never);
    mockCreateResumeWithAuth.mockResolvedValue({ id: 'created-resume-1' } as never);
  });

  it('renders both entry cards and core feature bullets', () => {
    renderEmptyState();

    expect(screen.getByRole('heading', { name: 'Build from Scratch' })).toBeInTheDocument();
    expect(screen.getByText('Upload Existing Resume')).toBeInTheDocument();
    expect(screen.getByText('ATS-friendly formatting')).toBeInTheDocument();
    expect(screen.getByText('AI-powered enhancement')).toBeInTheDocument();
    expect(screen.getByText('PDF · DOCX')).toBeInTheDocument();
  });

  it('tells the user they already have a builder resume instead of opening or creating one', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'existing-builder-1', name: 'Existing Resume' }],
      enhanced_resumes: [],
    } as never);

    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('already have a resume in the builder'),
        expect.anything(),
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCreateResumeWithAuth).not.toHaveBeenCalled();
    // loading state ends
    expect(screen.queryByText('Creating your resume…')).not.toBeInTheDocument();
  });

  it('shows the same message when the backend rejects a second resume', async () => {
    mockCreateResumeWithAuth.mockRejectedValue({
      response: { status: 409, data: { detail: 'One resume already exists' } },
    });

    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('already have a resume in the builder'),
        expect.anything(),
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByText('Creating your resume…')).not.toBeInTheDocument();
  });

  // careerbot-api answers a POST /resumes/ 500 with detail as an object ({ error, message }) and a FastAPI 422 with an
  // array; the failure handler must not throw on them, or no toast shows and the card stays on "Creating your resume…".
  const requestFailed = (status: number, detail: unknown) =>
    Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { detail } } });

  it('shows the readable message of an object detail instead of the generic request error', async () => {
    mockCreateResumeWithAuth.mockRejectedValue(
      requestFailed(500, { error: 'internal_error', message: 'Could not create the resume' }),
    );

    renderEmptyState();
    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Could not create the resume');
    });
    expect(await screen.findByText('Create your resume step by step with AI assistance.')).toBeInTheDocument();
  });

  it('treats an object detail that says a resume already exists as the second-resume case', async () => {
    mockCreateResumeWithAuth.mockRejectedValue(
      requestFailed(400, { error: 'resume_exists', message: 'A resume already exists for this user' }),
    );

    renderEmptyState();
    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('already have a resume in the builder'),
        expect.anything(),
      );
    });
  });

  it.each([
    ['an array (422)', [{ loc: ['body', 'name'], msg: 'field required', type: 'missing' }]],
  ])('shows the error and leaves the creating state when the failure detail is %s', async (_label, detail) => {
    mockCreateResumeWithAuth.mockRejectedValue(requestFailed(detail instanceof Array ? 422 : 500, detail));

    renderEmptyState();
    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Request failed with status code'));
    });
    expect(await screen.findByText('Create your resume step by step with AI assistance.')).toBeInTheDocument();
    expect(screen.queryByText('Creating your resume…')).not.toBeInTheDocument();
  });

  it('does not tell a rate-limited user they already have a resume', async () => {
    mockCreateResumeWithAuth.mockRejectedValue(requestFailed(429, 'Rate limit exceeded, try again later'));

    renderEmptyState();
    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Request failed with status code 429');
    });
    expect(mockToast.info).not.toHaveBeenCalled();
    expect(await screen.findByText('Create your resume step by step with AI assistance.')).toBeInTheDocument();
  });

  it('only the buttons start an action, not the whole card', () => {
    renderEmptyState();

    fireEvent.click(screen.getByRole('heading', { name: 'Build from Scratch' }).closest('div') as HTMLElement);
    fireEvent.click(screen.getByRole('heading', { name: 'Upload Existing Resume' }).closest('div') as HTMLElement);

    expect(mockGetAllResumesUnified).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Upload resume modal' })).not.toBeInTheDocument();
  });

  it('creates a new resume when no builder resume exists and caches it', async () => {
    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/created-resume-1');
    });
    expect(mockCreateResumeWithAuth).toHaveBeenCalledTimes(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'created-resume-1');
    expect(window.sessionStorage.getItem('builder_fresh_start')).toBe('true');
  });

  it.each([
    ['/cover-letter/new', '/builder/creation/created-resume-1?return_to=%2Fcover-letter%2Fnew'],
    ['//evil.example', '/builder/creation/created-resume-1'],
    ['https://evil.example', '/builder/creation/created-resume-1'],
  ])('passes on return_to=%s only when it is a same-site path', async (returnTo, expected) => {
    search.params = new URLSearchParams({ return_to: returnTo });
    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expected);
    });
  });

  it('shows creating state while resume creation is in flight', async () => {
    mockCreateResumeWithAuth.mockReturnValue(new Promise(() => undefined) as never);

    renderEmptyState();

    const buildCard = screen.getByRole('button', { name: /Build from Scratch/ });
    fireEvent.click(buildCard);

    expect(await screen.findByText('Creating your resume…')).toBeInTheDocument();
    expect(mockCreateResumeWithAuth).toHaveBeenCalledTimes(1);
  });

  it('routes unauthenticated users to signup on build failure', async () => {
    mockCreateResumeWithAuth.mockRejectedValue({ response: { status: 401 } });

    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please sign in to create a resume');
    });
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('shows Error messages for known build failures and resets creating state', async () => {
    mockCreateResumeWithAuth.mockRejectedValue(new Error('Creation quota reached'));

    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Creation quota reached');
    });
    expect(await screen.findByText('Create your resume step by step with AI assistance.')).toBeInTheDocument();
  });

  it('shows generic error for non-Error build failures', async () => {
    mockCreateResumeWithAuth.mockRejectedValue('bad response');

    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Build from Scratch/ }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create resume. Please try again.');
    });
  });

  it('opens upload modal, marks upload selected, and clears selection on close', () => {
    renderEmptyState();

    fireEvent.click(screen.getByRole('button', { name: /Upload Resume/ }));

    expect(onSelect).toHaveBeenCalledWith('upload');
    expect(screen.getByRole('dialog', { name: 'Upload resume modal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close upload' }));

    expect(onSelect).toHaveBeenCalledWith('');
    expect(screen.queryByRole('dialog', { name: 'Upload resume modal' })).not.toBeInTheDocument();
  });

  it('applies selected styling to the chosen card', () => {
    const { rerender } = renderEmptyState('builder');

    expect(screen.getByRole('heading', { name: 'Build from Scratch' }).closest('.relative')).toHaveClass('border-[#2557a7]');

    rerender(<EmptyState selected="upload" onSelect={onSelect} />);

    expect(screen.getByText('Upload Existing Resume').closest('.relative')).toHaveClass('border-[#2557a7]');
  });
});
