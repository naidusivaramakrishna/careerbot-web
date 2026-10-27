import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeLandingPage from '@/app/(resume)/builder/page';
import { getAllResumesUnified, createResumeWithAuth } from '@/api/resumeApi';

const { mockPush, mockHttpGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockHttpGet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

// The page decides "signed in?" with a silent GET /auth/profile (checkAuthSilent).
// The header tells the 401 interceptor not to redirect to login (src/lib/http.ts),
// which is what lets a signed-out click open the sign-in modal instead.
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

const emptyResumeResponse = {
  builder_resumes: [],
  enhanced_resumes: [],
};

const AUTH_PROBE = ['/auth/profile', { headers: { 'X-Skip-Login-Redirect': 'true' } }] as const;

describe('ResumeLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: GET /auth/profile succeeds (signed in).
    mockHttpGet.mockResolvedValue({ data: {} });
    mockGetAllResumesUnified.mockResolvedValue(emptyResumeResponse as never);
    mockCreateResumeWithAuth.mockResolvedValue({
      id: 'new-resume-1',
      personalInfo: { fullname: 'John Doe' },
    } as never);
  });

  it('renders the real landing sections, navigation, hero preview, and footer', () => {
    render(<ResumeLandingPage />);

    expect(screen.getByRole('link', { name: 'CareerBOT home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: /Build or improve your resume/i })).toBeInTheDocument();
    expect(screen.getByText('AI Resume Builder & Enhancer')).toBeInTheDocument();
    expect(screen.getByText('12,400+')).toBeInTheDocument();
    expect(screen.getByText('job seekers')).toBeInTheDocument();
    // The enhance / build choice cards live on the Resume Management page now.
    expect(screen.queryByText('Start where your resume is today')).not.toBeInTheDocument();
    expect(screen.queryByText('Enhance an existing resume')).not.toBeInTheDocument();
    expect(screen.queryByText('Build a new resume')).not.toBeInTheDocument();
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

  it('routes Start Free to the start page', async () => {
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start');
    });
    expect(mockHttpGet).toHaveBeenCalledWith(...AUTH_PROBE);
  });

  it('routes Start Free to the start page even when resumes already exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1' }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start');
    });
    expect(mockPush).not.toHaveBeenCalledWith('/builder/start/list');
  });

  it('shows sign-in modal when Start Free is clicked while unauthenticated', async () => {
    mockHttpGet.mockRejectedValue(new Error('401'));
    render(<ResumeLandingPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Free/i })[0]);

    expect(await screen.findByRole('dialog', { name: 'Sign in modal' })).toBeInTheDocument();
    expect(mockHttpGet).toHaveBeenCalledWith(...AUTH_PROBE);
    expect(mockGetAllResumesUnified).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('registers and removes the navbar scroll listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    try {
      const { unmount } = render(<ResumeLandingPage />);
      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      const handler = addSpy.mock.calls.find(([type]) => type === 'scroll')?.[1];

      unmount();
      expect(removeSpy).toHaveBeenCalledWith('scroll', handler);
    } finally {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    }
  });
});
