import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeLandingPage from '@/app/(resume)/builder/page';
import { getAllResumesUnified, createResumeWithAuth } from '@/api/resumeApi';
import { toast } from 'sonner';

const { mockPush, mockHttpGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockHttpGet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// The page decides "signed in?" with a silent GET /auth/profile (checkAuthSilent).
vi.mock('@/lib/http', () => ({
  default: { get: mockHttpGet },
}));

vi.mock('@/api/resumeApi', () => ({
  getAllResumesUnified: vi.fn(),
  createResumeWithAuth: vi.fn(),
}));

vi.mock('@/components/SignUpModal', () => ({
  default: ({
    open,
    onClose,
    initialFormType,
  }: {
    open: boolean;
    onClose: () => void;
    initialFormType: string;
  }) =>
    open ? (
      <div role="dialog" aria-label="Sign in modal">
        <p>Form: {initialFormType}</p>
        <button onClick={onClose}>Close sign in</button>
      </div>
    ) : null,
}));

vi.mock('@/app/(landing)/_components/LandingFooter', () => ({
  default: () => <footer>Landing footer</footer>,
}));

const mockGetAllResumesUnified = vi.mocked(getAllResumesUnified);
const mockCreateResumeWithAuth = vi.mocked(createResumeWithAuth);
const mockToast = vi.mocked(toast);

const emptyResumeResponse = {
  builder_resumes: [],
  enhanced_resumes: [],
};

describe('ResumeLandingPage', () => {
  const originalGetElementById = document.getElementById.bind(document);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated, not loading — mirrors the happy-path for most tests
    mockHttpGet.mockResolvedValue({ data: {} });
    mockGetAllResumesUnified.mockResolvedValue(emptyResumeResponse as never);
    mockCreateResumeWithAuth.mockResolvedValue({
      id: 'new-resume-1',
      personalInfo: { fullname: 'John Doe' },
    } as never);
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
  });

  it('renders the real landing sections, navigation, hero preview, and footer', () => {
    render(<ResumeLandingPage />);

    expect(screen.getByRole('link', { name: 'CareerBOT home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: /Build or improve your resume/i })).toBeInTheDocument();
    expect(screen.getByText('AI Resume Builder & Enhancer')).toBeInTheDocument();
    expect(screen.getByText('12,400+')).toBeInTheDocument();
    expect(screen.getByText('job seekers')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Start where your resume is today' })).toBeInTheDocument();
    expect(screen.getByText('Enhance an existing resume')).toBeInTheDocument();
    expect(screen.getByText('Build a new resume')).toBeInTheDocument();
    expect(screen.getByText('Resume workspace')).toBeInTheDocument();
    expect(screen.getByText('Landing footer')).toBeInTheDocument();
  });

  it('opens and closes the sign-in modal from the header', () => {
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByRole('dialog', { name: 'Sign in modal' })).toHaveTextContent('Form: signin');

    fireEvent.click(screen.getByRole('button', { name: 'Close sign in' }));

    expect(screen.queryByRole('dialog', { name: 'Sign in modal' })).not.toBeInTheDocument();
  });

  it('routes Start Free to the empty start page when the user has no resumes', async () => {
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start');
    });
    expect(mockGetAllResumesUnified).toHaveBeenCalledTimes(1);
  });

  it('routes Start Free to the resume list when builder resumes exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1' }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start/list');
    });
  });

  it('routes Start Free to the resume list when only enhanced resumes exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [{ id: 'enhanced-1' }],
    } as never);

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start/list');
    });
  });

  it('falls back to /builder/start when Start Free cannot check resumes', async () => {
    mockGetAllResumesUnified.mockRejectedValue(new Error('Network failed'));

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start');
    });
  });

  it('shows sign-in modal when Start Free is clicked while unauthenticated', async () => {
    mockHttpGet.mockRejectedValue(new Error('401'));
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    expect(await screen.findByRole('dialog', { name: 'Sign in modal' })).toBeInTheDocument();
    expect(mockGetAllResumesUnified).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('links enhance existing resume to the upload path', () => {
    render(<ResumeLandingPage />);

    expect(screen.getByRole('link', { name: /Enhance My Resume/i })).toHaveAttribute(
      'href',
      '/builder/start?action=enhance'
    );
  });

  it('creates a new builder resume, caches it, and routes to templates', async () => {
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Build New Resume/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/templates');
    });

    expect(mockCreateResumeWithAuth).toHaveBeenCalledTimes(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'new-resume-1');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'cached_resume_data',
      expect.stringContaining('"resumeId":"new-resume-1"')
    );
  });

  it('shows sign-in modal when Build New Resume is clicked while unauthenticated', async () => {
    mockHttpGet.mockRejectedValue(new Error('401'));
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Build New Resume/i }));

    expect(await screen.findByRole('dialog', { name: 'Sign in modal' })).toBeInTheDocument();
    expect(mockCreateResumeWithAuth).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles free-plan conflict by showing toast and routing to the existing resume list', async () => {
    mockCreateResumeWithAuth.mockRejectedValue({
      response: { status: 409, data: { detail: 'One resume already exists' } },
    });

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Build New Resume/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('already created a resume'),
        { duration: 6000 }
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/builder/start/list');
  });

  it('shows backend detail for generic resume creation failures', async () => {
    mockCreateResumeWithAuth.mockRejectedValue({
      response: { status: 500, data: { detail: 'Resume service unavailable' } },
    });

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Build New Resume/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Resume service unavailable');
    });
  });

  it('registers and removes the navbar scroll listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ResumeLandingPage />);
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
