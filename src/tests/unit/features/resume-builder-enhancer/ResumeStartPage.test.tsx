import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeStartPage from '@/app/(resume)/builder/start/page';
import { getAllResumesUnified } from '@/api/resumeApi';
import { toast } from 'sonner';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/api/resumeApi', () => ({
  getAllResumesUnified: vi.fn(),
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
const mockToast = vi.mocked(toast);

describe('ResumeStartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('redirects to the resume list when builder resumes exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [{ id: 'builder-1' }],
      enhanced_resumes: [],
    } as never);

    render(<ResumeStartPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start/list');
    });
  });

  it('redirects to the resume list when only enhanced resumes exist', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [{ id: 'enhanced-1' }],
    } as never);

    render(<ResumeStartPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/start/list');
    });
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
