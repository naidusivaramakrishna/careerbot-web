import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeListPage from '@/app/(resume)/builder/start/list/page';
import {
  createResumeWithAuth,
  deleteResume,
  downloadResume,
  getAllResumesUnified,
  getBuilderScore,
} from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import { downloadEnhancedResume } from '@/api/enhancerApi';
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

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn(),
}));

vi.mock('@/api/resumeApi', () => ({
  createResumeWithAuth: vi.fn(),
  deleteResume: vi.fn(),
  downloadResume: vi.fn(),
  getAllResumesUnified: vi.fn(),
  getBuilderScore: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  downloadEnhancedResume: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../app/(resume)/builder/start/_components/ResumeTableRow', () => ({
  default: ({
    resume,
    onDelete,
    onDownload,
    downloading,
  }: {
    resume: { id: string; name: string; source?: string; score: number };
    onDelete: () => void;
    onDownload: () => void;
    downloading: boolean;
  }) => (
    <tr data-testid={`resume-row-${resume.id}`}>
      <td>{resume.name}</td>
      <td>{resume.source || 'builder'}</td>
      <td>{resume.score}%</td>
      <td>{String(downloading)}</td>
      <td>
        <button type="button" onClick={onDownload}>
          Download {resume.id}
        </button>
        <button type="button" onClick={onDelete}>
          Delete {resume.id}
        </button>
      </td>
    </tr>
  ),
}));

vi.mock('../../../../app/(resume)/builder/start/_components/AddResumeModal', () => ({
  default: ({
    isOpen,
    onCreateWithAI,
    onUploadExisting,
  }: {
    isOpen: boolean;
    onCreateWithAI: () => void;
    onUploadExisting: () => void;
  }) =>
    isOpen ? (
      <div role="menu" aria-label="Add resume menu">
        <button type="button" onClick={onCreateWithAI}>
          Create with AI
        </button>
        <button type="button" onClick={onUploadExisting}>
          Upload Existing
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../app/(resume)/builder/start/_components/UploadResumeModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Upload resume modal">
        <button type="button" onClick={onClose}>
          Close upload
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../app/(resume)/builder/start/_components/DeleteConfirmModal', () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
    deleting,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Delete resume modal">
        <p>Deleting: {String(deleting)}</p>
        <button type="button" onClick={onClose}>
          Cancel delete
        </button>
        <button type="button" onClick={onConfirm}>
          Confirm delete
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../app/(resume)/builder/start/_components/DownloadModal', () => ({
  default: ({
    isOpen,
    onClose,
    onDownload,
    downloading,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (format: 'pdf' | 'docx') => void;
    downloading: boolean;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Download resume modal">
        <p>Downloading: {String(downloading)}</p>
        <button type="button" onClick={() => onDownload('pdf')}>
          PDF
        </button>
        <button type="button" onClick={() => onDownload('docx')}>
          DOCX
        </button>
        <button type="button" onClick={onClose}>
          Cancel download
        </button>
      </div>
    ) : null,
}));

vi.mock('@/components/SignUpModal', () => ({
  default: () => null,
}));

const mockGetProfile = vi.mocked(getProfile);
const mockGetAllResumesUnified = vi.mocked(getAllResumesUnified);
const mockGetBuilderScore = vi.mocked(getBuilderScore);
const mockDeleteResume = vi.mocked(deleteResume);
const mockDownloadResume = vi.mocked(downloadResume);
const mockDownloadEnhancedResume = vi.mocked(downloadEnhancedResume);
const mockCreateResumeWithAuth = vi.mocked(createResumeWithAuth);
const mockToast = vi.mocked(toast);

const builderResume = {
  id: 'builder-1',
  personalInfo: { fullname: 'Avery Builder', email: 'avery@example.com' },
  professionalSummary: { summary: 'Summary', targetRole: 'Frontend Engineer' },
  updatedAt: '2026-01-15T10:00:00.000Z',
  createdAt: '2026-01-10T10:00:00.000Z',
};

const enhancedResume = {
  id: 'enhanced-1',
  display_name: 'Uploaded Resume',
  ats_score: { final_score: 82 },
  updated_at: '2026-01-16T10:00:00.000Z',
  created_at: '2026-01-11T10:00:00.000Z',
};

describe('ResumeListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ full_name: 'Profile Name', username: 'profile' } as never);
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [builderResume],
      enhanced_resumes: [enhancedResume],
    } as never);
    mockGetBuilderScore.mockResolvedValue({
      resume_id: 'builder-1',
      score: 74,
      calculated_at: '2026-01-17T10:00:00.000Z',
    } as never);
    mockDeleteResume.mockResolvedValue(undefined as never);
    mockDownloadResume.mockResolvedValue(new Blob(['builder']) as never);
    mockDownloadEnhancedResume.mockResolvedValue(new Blob(['enhanced']) as never);
    mockCreateResumeWithAuth.mockResolvedValue({ id: 'created-resume-1' } as never);
    if (!window.URL.createObjectURL) {
      Object.defineProperty(window.URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(),
      });
    }
    if (!window.URL.revokeObjectURL) {
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
      });
    }
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:resume');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('renders loading skeleton before resume data resolves', () => {
    mockGetAllResumesUnified.mockReturnValue(new Promise(() => undefined) as never);

    const { container } = render(<ResumeListPage />);

    expect(screen.getByRole('heading', { name: 'My Resumes' })).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('merges builder and enhanced resumes, then updates builder score in the background', async () => {
    render(<ResumeListPage />);

    expect(await screen.findByTestId('resume-row-builder-1')).toHaveTextContent('Avery Builder');
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveTextContent('Uploaded Resume');
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveTextContent('82%');

    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1')).toHaveTextContent('74%');
    });
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockGetBuilderScore).toHaveBeenCalledWith('builder-1');
  });

  it('shows an empty table state when the API returns no resumes', async () => {
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [],
    } as never);

    render(<ResumeListPage />);

    expect(await screen.findByText('No resumes yet')).toBeInTheDocument();
    expect(screen.getByText(/Click/)).toBeInTheDocument();
  });

  it('routes back to start on an expired session', async () => {
    mockGetAllResumesUnified.mockRejectedValue({ response: { status: 401 } });

    render(<ResumeListPage />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Session expired. Please log in again');
    });
    expect(mockPush).toHaveBeenCalledWith('/builder/start');
  });

  it('creates a builder resume from the add menu and caches the new resume id', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Add Resume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create with AI' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/templates');
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'created-resume-1');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'cached_resume_data',
      expect.stringContaining('"resumeId":"created-resume-1"')
    );
  });

  it('opens the upload modal from the add menu', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Add Resume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload Existing' }));

    expect(screen.getByRole('dialog', { name: 'Upload resume modal' })).toBeInTheDocument();
  });

  it('deletes a resume after confirmation and removes it from the list', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Delete builder-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => {
      expect(mockDeleteResume).toHaveBeenCalledWith('builder-1');
    });
    expect(mockToast.success).toHaveBeenCalledWith('Resume deleted successfully');
    expect(screen.queryByTestId('resume-row-builder-1')).not.toBeInTheDocument();
  });

  it('downloads builder and enhanced resumes through their correct APIs', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Download builder-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));

    await waitFor(() => {
      expect(mockDownloadResume).toHaveBeenCalledWith('builder-1', 'pdf');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Download enhanced-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'DOCX' }));

    await waitFor(() => {
      expect(mockDownloadEnhancedResume).toHaveBeenCalledWith('enhanced-1', 'docx');
    });
  });
});
