import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeStartPage from '@/app/(resume)/builder/start/page';
import { getAllResumesUnified, getResumeById } from '@/api/resumeApi';
import { computePreviewScore } from '@/app/(resume)/builder/creation/_lib/computePreviewScore';
import { toast } from 'sonner';

const { mockPush, mockSearchParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchParams: vi.fn(),
}));

const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams(),
}));

vi.mock('@/api/resumeApi', () => ({
  getAllResumesUnified: vi.fn(),
  getResumeById: vi.fn(),
  createResumeWithAuth: vi.fn(),
}));

vi.mock('../../../../app/(resume)/builder/start/_components/EmptyState', () => ({
  default: ({
    selected,
    onSelect,
  }: {
    selected: string | null;
    onSelect: (value: string) => void;
  }) => (
    <section data-testid="empty-state">
      <p>Selected option: {selected || 'none'}</p>
      <button type="button" onClick={() => onSelect('upload')}>
        Upload Existing Resume
      </button>
    </section>
  ),
}));

const mockGetAllResumesUnified = vi.mocked(getAllResumesUnified);
const mockGetResumeById = vi.mocked(getResumeById);
const mockToast = vi.mocked(toast);

describe('ResumeStartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockGetResumeById.mockRejectedValue(new Error('not found'));
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [],
    } as never);
  });

  it('shows loading state while checking for existing resumes', () => {
    mockGetAllResumesUnified.mockReturnValue(new Promise(() => undefined) as never);

    render(<ResumeStartPage />);

    expect(screen.getByText('Resume Management')).toBeInTheDocument();
    expect(screen.getByText('Loading your resumes…')).toBeInTheDocument();
  });

  it('shows empty state when no builder or enhanced resumes exist', async () => {
    render(<ResumeStartPage />);

    expect(await screen.findByText('Choose how you\'d like to get started')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Selected option: none')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('lists saved builder resumes under the creation choices instead of redirecting', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1', personalInfo: { fullname: 'Jane Dev' }, updatedAt: '2024-09-28T00:00:00Z', builder_score: { score: 78 } }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeStartPage />);

    expect(await screen.findByText('Your Resumes')).toBeInTheDocument();
    expect(screen.getByText('Jane Dev')).toBeInTheDocument();
    // the compact payload's builder_score is unverified, so the card scores the content instead
    expect(screen.queryByText('78% score')).not.toBeInTheDocument();
    expect(screen.getByText(/^\d+% score$/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('scores a builder resume from its full record, because the compact list leaves out sections', async () => {
    const full = {
      id: 'builder-1',
      personalInfo: { fullname: 'Jane Dev', email: 'jane@example.com', phone: '123' },
      professionalSummary: 'Backend engineer with eight years of experience building reliable payment systems.',
      skills: { programming_languages: [{ id: '1', name: 'Go' }, { id: '2', name: 'SQL' }] },
      updatedAt: '2024-09-28T00:00:00Z',
    };
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1', personalInfo: { fullname: 'Jane Dev' }, updatedAt: '2024-09-28T00:00:00Z' }],
      enhanced_resumes: [],
    } as never);
    mockGetResumeById.mockResolvedValue(full as never);
    const expected = computePreviewScore({ ...full, builder_score: undefined } as never).score;
    const compact = computePreviewScore({ id: 'builder-1', personalInfo: { fullname: 'Jane Dev' } } as never).score;
    expect(expected).toBeGreaterThan(compact);

    render(<ResumeStartPage />);

    expect(await screen.findByText(`${expected}% score`)).toBeInTheDocument();
    expect(mockGetResumeById).toHaveBeenCalledWith('builder-1');
  });

  it('reads in full only the resumes that are shown', async () => {
    const row = (n: number) => ({ id: `builder-${n}`, personalInfo: { fullname: `Person ${n}` }, updatedAt: `2024-09-${10 + n}T00:00:00Z` });
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [row(1), row(2), row(3), row(4), row(5)],
      enhanced_resumes: [],
    } as never);

    render(<ResumeStartPage />);
    await screen.findByText('Your Resumes');

    expect(mockGetResumeById.mock.calls.map((c) => c[0]).sort()).toEqual(['builder-3', 'builder-4', 'builder-5']);
  });

  it('keeps the compact score when the full record cannot be read', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1', personalInfo: { fullname: 'Jane Dev' }, updatedAt: '2024-09-28T00:00:00Z' }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeStartPage />);

    expect(await screen.findByText('Jane Dev')).toBeInTheDocument();
    expect(screen.getByText(/^\d+% score$/)).toBeInTheDocument();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('lists enhanced resumes when only enhanced resumes exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [{ id: 'enhanced-1', display_name: 'Uploaded CV', ats_score: 60, updated_at: '2024-09-10T00:00:00Z' }],
    } as never);

    render(<ResumeStartPage />);

    expect(await screen.findByText('Uploaded CV')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the active builder resume directly when returning to Cover Letter', async () => {
    localStorage.setItem('current_resume_id', 'builder-2');
    mockSearchParams.mockReturnValue(new URLSearchParams('return_to=/cover-letter/new'));
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1' }, { id: 'builder-2' }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeStartPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/builder-2?return_to=%2Fcover-letter%2Fnew');
    });
  });

  it('shows creation choices when Cover Letter has no builder resume', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('return_to=/cover-letter/new'));
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [{ id: 'enhanced-1' }],
    } as never);

    render(<ResumeStartPage />);

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps empty state visible for auth failures without showing an error toast', async () => {
    mockGetAllResumesUnified.mockRejectedValue({
      response: { status: 401, data: { detail: 'Unauthorized' } },
    });

    render(<ResumeStartPage />);

    expect(await screen.findByText('Choose how you\'d like to get started')).toBeInTheDocument();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('shows a toast for non-auth resume check failures', async () => {
    mockGetAllResumesUnified.mockRejectedValue({
      response: { status: 500, data: { detail: 'Resume lookup failed' } },
    });

    render(<ResumeStartPage />);

    expect(await screen.findByText('Choose how you\'d like to get started')).toBeInTheDocument();
    expect(mockToast.error).toHaveBeenCalledWith('Resume lookup failed');
  });

  it('allows the embedded EmptyState upload choice to open the upload modal', async () => {
    render(<ResumeStartPage />);

    expect(await screen.findByText('Choose how you\'d like to get started')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload Existing Resume' }));

    expect(screen.getByText('Selected option: upload')).toBeInTheDocument();
  });
});
