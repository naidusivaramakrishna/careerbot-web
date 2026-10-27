import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeListPage from '@/app/(resume)/builder/start/list/page';
import {
  createResumeWithAuth,
  downloadResume,
  getAllResumesUnified,
  getBuilderScore,
  getResumeById,
} from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import { downloadEnhancedResume, getEnhancedResume } from '@/api/enhancerApi';
import { toast } from 'sonner';
import { computePreviewScore } from '@/app/(resume)/builder/creation/_lib/computePreviewScore';
import { enhancedReadBudget } from '@/app/(resume)/builder/start/_components/enhancedReadQueue';

const { mockPush, search } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  search: { params: new URLSearchParams() },
}));

const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => search.params,
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn(),
}));

vi.mock('@/api/resumeApi', () => ({
  createResumeWithAuth: vi.fn(),
  downloadResume: vi.fn(),
  getAllResumesUnified: vi.fn(),
  getBuilderScore: vi.fn(),
  getResumeById: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  downloadEnhancedResume: vi.fn(),
  getEnhancedResume: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../app/(resume)/builder/start/_components/ResumeCard', () => ({
  default: ({
    resume,
    onDownload,
    onSetPrimary,
    downloading,
  }: {
    resume: { id: string; name: string; source?: string; score: number; primary?: boolean; completion?: number | null; job?: string };
    onDownload: () => void;
    onSetPrimary: () => void;
    downloading: boolean;
  }) => (
    <div data-testid={`resume-row-${resume.id}`} data-primary={String(!!resume.primary)} data-completion={String(resume.completion)} data-job={resume.job ?? ''}>
      <button type="button" onClick={onSetPrimary}>
        Set primary {resume.id}
      </button>
      <span>{resume.name}</span>
      <span>{resume.source || 'builder'}</span>
      <span>{resume.score}%</span>
      <span>{String(downloading)}</span>
      <button type="button" onClick={onDownload}>
        Download {resume.id}
      </button>
    </div>
  ),
}));

vi.mock('../../../../app/(resume)/builder/start/_components/ResumeTableRow', () => ({
  default: ({ resume, creationUrl }: { resume: { id: string; name: string }; creationUrl?: string }) => (
    <tr data-testid={`resume-table-row-${resume.id}`} data-creation-url={creationUrl ?? ''}>
      <td>{resume.name}</td>
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
const mockGetResumeById = vi.mocked(getResumeById);
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
  // Some persisted enhancer summaries expose current_score instead of
  // final_score. The list must use the same compatibility resolver as the
  // enhancer editor rather than displaying 0%.
  ats_score: { current_score: 82 },
  updated_at: '2026-01-16T10:00:00.000Z',
  created_at: '2026-01-11T10:00:00.000Z',
};

describe('ResumeListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.params = new URLSearchParams();
    enhancedReadBudget.reset();
    // an earlier test may leave a never-resolving implementation behind (clearAllMocks keeps it)
    vi.mocked(getEnhancedResume).mockReset();
    mockGetProfile.mockResolvedValue({ full_name: 'Profile Name', username: 'profile' } as never);
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [builderResume],
      enhanced_resumes: [enhancedResume],
    } as never);
    mockGetResumeById.mockResolvedValue(builderResume as never);
    mockGetBuilderScore.mockRejectedValue(new Error('No current server score'));
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

  it('merges builder and enhanced resumes, then updates the builder score from the full resume', async () => {
    const persistedBuilderResume = {
      ...builderResume,
      professional_summary: {
        summary: builderResume.professionalSummary.summary,
        target_role: builderResume.professionalSummary.targetRole,
      },
      skills: {
        programmingLanguages: [{ name: 'TypeScript' }, { name: 'Node.js' }],
        frameworks: [{ name: 'React' }, { name: 'FastAPI' }],
        softSkills: [{ name: 'Communication' }],
      },
    };
    mockGetResumeById.mockResolvedValueOnce(persistedBuilderResume as never);

    render(<ResumeListPage />);

    expect(await screen.findByTestId('resume-row-builder-1')).toHaveTextContent('Avery Builder');
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveTextContent('Uploaded Resume');
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveTextContent('82%');

    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1')).toHaveTextContent(`${computePreviewScore(persistedBuilderResume as never).score}%`);
    });
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockGetResumeById).toHaveBeenCalledWith('builder-1');
  });

  it('uses a fresh server score for the same resume snapshot', async () => {
    mockGetBuilderScore.mockResolvedValueOnce({
      resume_id: 'builder-1',
      score: 74,
      calculated_at: '2026-01-16T10:00:00.000Z',
    } as never);

    render(<ResumeListPage />);

    expect(await screen.findByTestId('resume-row-builder-1')).toHaveTextContent('74%');
  });

  it('ignores a server score older than the resume content', async () => {
    mockGetBuilderScore.mockResolvedValueOnce({
      resume_id: 'builder-1',
      score: 99,
      calculated_at: '2026-01-14T10:00:00.000Z',
    } as never);

    render(<ResumeListPage />);

    expect(await screen.findByTestId('resume-row-builder-1'))
      .toHaveTextContent(`${computePreviewScore(builderResume as never).score}%`);
  });

  it('does not display stale builder_score values attached to compact or detail payloads', async () => {
    const staleCompactResume = { ...builderResume, builder_score: { score: 99 } };
    const staleDetailResume = { ...builderResume, builder_score: { score: 98 } };
    mockGetAllResumesUnified.mockResolvedValueOnce({
      builder_resumes: [staleCompactResume],
      enhanced_resumes: [],
    } as never);
    mockGetResumeById.mockResolvedValueOnce(staleDetailResume as never);

    render(<ResumeListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1'))
        .toHaveTextContent(`${computePreviewScore(staleDetailResume as never).score}%`);
    });
    expect(screen.getByTestId('resume-row-builder-1')).not.toHaveTextContent('99%');
    expect(screen.getByTestId('resume-row-builder-1')).not.toHaveTextContent('98%');
  });
  it('keeps the compact preview when the full resume cannot be loaded', async () => {
    mockGetResumeById.mockRejectedValueOnce(new Error('Resume is not ready'));

    render(<ResumeListPage />);

    expect(await screen.findByTestId('resume-row-builder-1')).not.toHaveTextContent('0%');
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

  it('shows card view by default and switches to the original list view from the view dropdown', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    expect(screen.queryByTestId('resume-table-row-builder-1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change view' })).toHaveTextContent('Card view');

    fireEvent.click(screen.getByRole('button', { name: 'Change view' }));
    fireEvent.click(screen.getByRole('option', { name: /List view/ }));

    expect(screen.getByTestId('resume-table-row-builder-1')).toBeInTheDocument();
    expect(screen.queryByTestId('resume-row-builder-1')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Target Role' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Change view' }));
    fireEvent.click(screen.getByRole('option', { name: /Card view/ }));
    expect(screen.getByTestId('resume-row-builder-1')).toBeInTheDocument();
  });

  it('marks one resume as primary and remembers it', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Set primary enhanced-1' }));

    expect(window.localStorage.setItem).toHaveBeenCalledWith('primary_resume_id', 'enhanced-1');
    // primary is only a label: the resume the interview and prep pages use is not changed
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith('current_resume_id', expect.anything());
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('primary resume'));
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-primary', 'true');
    expect(screen.getByTestId('resume-row-builder-1')).toHaveAttribute('data-primary', 'false');

    // switching primary moves the flag - only one resume is primary at a time
    fireEvent.click(screen.getByRole('button', { name: 'Set primary builder-1' }));
    expect(screen.getByTestId('resume-row-builder-1')).toHaveAttribute('data-primary', 'true');
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-primary', 'false');
  });

  it('sorts by recently updated by default and from the sort dropdown, and filters by the search box', async () => {
    window.localStorage.clear(); // an earlier test may have chosen a primary resume, which is always listed first
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    const order = () => screen.getAllByTestId(/^resume-row-/).map((el) => el.getAttribute('data-testid'));
    expect(screen.queryByRole('button', { name: 'Filter by resume type' })).not.toBeInTheDocument();

    // default: most recently updated first (the enhanced one is newer)
    expect(screen.getByRole('button', { name: 'Sort resumes' })).toHaveTextContent('Sort by: Recently updated');
    expect(order()).toEqual(['resume-row-enhanced-1', 'resume-row-builder-1']);

    // a primary resume is flagged but not pinned: it follows the sort like the others
    fireEvent.click(screen.getByRole('button', { name: 'Set primary builder-1' }));
    expect(order()).toEqual(['resume-row-enhanced-1', 'resume-row-builder-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Sort resumes' }));
    fireEvent.click(screen.getByRole('option', { name: 'Oldest updated' }));
    expect(order()).toEqual(['resume-row-builder-1', 'resume-row-enhanced-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Sort resumes' }));
    fireEvent.click(screen.getByRole('option', { name: 'Name (A-Z)' }));
    expect(screen.getByRole('button', { name: 'Sort resumes' })).toHaveTextContent('Sort by: Name (A-Z)');
    expect(order()).toEqual(['resume-row-builder-1', 'resume-row-enhanced-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Sort resumes' }));
    fireEvent.click(screen.getByRole('option', { name: 'Highest ATS score' }));
    expect(order()).toEqual(['resume-row-enhanced-1', 'resume-row-builder-1']);

    // search
    fireEvent.change(screen.getByRole('textbox', { name: 'Search resumes' }), { target: { value: 'avery' } });
    expect(screen.getByTestId('resume-row-builder-1')).toBeInTheDocument();
    expect(screen.queryByTestId('resume-row-enhanced-1')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search resumes' }), { target: { value: 'zzz-nothing' } });
    expect(screen.getByText('No matching resumes')).toBeInTheDocument();
  });

  it('does not match the "No Target Role" placeholder when searching', async () => {
    const noRole = { ...builderResume, professionalSummary: undefined };
    mockGetAllResumesUnified.mockResolvedValue({ builder_resumes: [noRole], enhanced_resumes: [] } as never);
    mockGetResumeById.mockResolvedValue(noRole as never);

    render(<ResumeListPage />);
    await screen.findByTestId('resume-row-builder-1');

    fireEvent.change(screen.getByRole('textbox', { name: 'Search resumes' }), { target: { value: 'target' } });
    expect(screen.queryByTestId('resume-row-builder-1')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search resumes' }), { target: { value: 'avery' } });
    expect(screen.getByTestId('resume-row-builder-1')).toBeInTheDocument();
  });

  it('keeps the search box mounted (and focused) while typing', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    const input = screen.getByRole('textbox', { name: 'Search resumes' });
    input.focus();
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search resumes' }), { target: { value: 'av' } });

    expect(screen.getByRole('textbox', { name: 'Search resumes' })).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  it('gives each resume a % complete from its filled core sections, once the full record is read', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: {
        headline: ['Senior Platform Engineer'],
        personalInfo: { fullname: 'Uploaded Person', email: 'u@example.com', phone: '123' },
        professionalSummary: { summary: 'Summary text' },
        education: [{ degree: 'B.Tech' }],
        workExperience: [{ company: 'Acme' }],
      },
    } as never);

    render(<ResumeListPage />);

    // 4 of the 8 core sections are filled in the enhanced record -> 50%
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '50');
    });
    // an enhanced resume without a target role shows the parser headline in its place
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-job', 'Senior Platform Engineer');
    });
    // the builder resume gets a number from its full record too
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1').getAttribute('data-completion')).toMatch(/^\d+$/);
    });
  });

  it('counts an uploaded resume saved in the parser field names the same way the editor does', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: {
        contact: { name: 'Uploaded Person', email: 'u@example.com', phone: '123' },
        summary: 'A summary of the candidate',
        education: [{ degree: 'B.Tech', institution: 'JNTU' }],
        skills: { programming_languages: [{ id: 's1', name: 'TypeScript' }, { id: 's2', name: 'Python' }] },
        experience: [{ company: 'Acme', position: 'Engineer' }],
        project_details: [{ title: 'Portfolio', description: 'A site' }],
        certificates: [{ name: 'AWS Cloud Practitioner' }],
      },
    } as never);

    render(<ResumeListPage />);

    // personal info, summary, education, skills, work, projects and certifications are filled: 7 of 8 core sections
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '88');
    });
  });

  it('does not count the list placeholder name as the candidate name', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    // the list summary row says "Uploaded Resume" when it has no display_name; the record has none either
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: { contact: { email: 'u@example.com', phone: '123' } },
    } as never);
    mockGetAllResumesUnified.mockResolvedValue({
      builder_resumes: [],
      enhanced_resumes: [{ id: 'enhanced-1', ats_score: 60, updated_at: '2026-01-16T10:00:00.000Z', created_at: '2026-01-11T10:00:00.000Z' }],
    } as never);

    render(<ResumeListPage />);

    // no name anywhere -> Personal Info is not complete, as in the editor
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '0');
    });
  });

  it('counts the record display name as the name when the parser found none, as the editor does', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    vi.mocked(getEnhancedResume).mockResolvedValue({
      display_name: 'Jane Doe',
      enhanced_data: { contact: { email: 'u@example.com', phone: '123' }, summary: 'A summary' },
    } as never);

    render(<ResumeListPage />);

    // personal info (name from display_name) + summary = 2 of 8
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '25');
    });
  });

  it('uses the enhancer state copy when the saved certifications are empty shells, as the editor does', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: { contact: { name: 'Jane', email: 'u@example.com', phone: '123' }, certifications: [{}, {}] },
      enhancer_state: { resume: { certifications: [{ name: 'AWS Cloud Practitioner' }] } },
    } as never);

    render(<ResumeListPage />);

    // personal info + certifications = 2 of 8
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '25');
    });
  });

  it('shows completion as unknown for a builder resume whose full record could not be loaded', async () => {
    mockGetResumeById.mockRejectedValueOnce(new Error('Resume is not ready'));

    render(<ResumeListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1')).toHaveAttribute('data-completion', 'null');
    });
  });

  it('shows each uploaded resume completion as soon as its own read finishes', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    const summaries = Array.from({ length: 12 }, (_, i) => ({
      id: `enhanced-${i + 1}`,
      display_name: `Upload ${i + 1}`,
      ats_score: 60,
      updated_at: '2026-01-16T10:00:00.000Z',
      created_at: '2026-01-11T10:00:00.000Z',
    }));
    mockGetAllResumesUnified.mockResolvedValue({ builder_resumes: [], enhanced_resumes: summaries } as never);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const record = { enhanced_data: { contact: { name: 'A', email: 'a@b.c', phone: '1' } } };
    vi.mocked(getEnhancedResume).mockImplementation((async (id: string) => {
      if (Number(id.replace('enhanced-', '')) > 4) await gate;
      return record;
    }) as never);

    render(<ResumeListPage />);

    // the first reads are done, the rest are still waiting: the finished cards must not wait for them
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '13');
    });
    expect(screen.getByTestId('resume-row-enhanced-12')).toHaveAttribute('data-completion', 'undefined');
    release();
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-12')).toHaveAttribute('data-completion', '13');
    });
  });

  it('reads uploaded resumes a few at a time instead of all at once', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    const summaries = Array.from({ length: 12 }, (_, i) => ({
      id: `enhanced-${i + 1}`,
      display_name: `Upload ${i + 1}`,
      ats_score: 60,
      updated_at: '2026-01-16T10:00:00.000Z',
      created_at: '2026-01-11T10:00:00.000Z',
    }));
    mockGetAllResumesUnified.mockResolvedValue({ builder_resumes: [], enhanced_resumes: summaries } as never);
    let inFlight = 0;
    let peak = 0;
    vi.mocked(getEnhancedResume).mockImplementation((async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return { enhanced_data: { personalInfo: { fullname: 'A', email: 'a@b.c', phone: '1' } } };
    }) as never);

    render(<ResumeListPage />);

    // every upload still gets its completion in the end
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-12')).toHaveAttribute('data-completion', '13');
    });
    expect(vi.mocked(getEnhancedResume)).toHaveBeenCalledTimes(12);
    expect(peak).toBeLessThanOrEqual(4);
  });

  it('links back to the Resume Management start page', async () => {
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: /Back to Resume Management/ }));

    expect(mockPush).toHaveBeenCalledWith('/builder/start');
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
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/created-resume-1');
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
  }, 20000);
  it('reads no more than the per-minute budget (50) at once, and fills those cards without waiting for the rest', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    const many = Array.from({ length: 55 }, (_, i) => ({
      ...enhancedResume,
      id: `enhanced-${i + 1}`,
      display_name: `Uploaded ${i + 1}`,
    }));
    mockGetAllResumesUnified.mockResolvedValue({ builder_resumes: [], enhanced_resumes: many } as never);
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: { personalInfo: { fullname: 'U', email: 'u@example.com', phone: '1' } },
    } as never);

    render(<ResumeListPage />);

    await waitFor(() => expect(vi.mocked(getEnhancedResume)).toHaveBeenCalledTimes(50));
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-50')).toHaveAttribute('data-completion', '13');
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(vi.mocked(getEnhancedResume)).toHaveBeenCalledTimes(50);
    expect(screen.getByTestId('resume-row-enhanced-51')).toHaveAttribute('data-completion', 'undefined');
  });

  it('starts no new enhanced reads after the page is left', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    const many = Array.from({ length: 10 }, (_, i) => ({ ...enhancedResume, id: `enhanced-${i + 1}` }));
    mockGetAllResumesUnified.mockResolvedValue({ builder_resumes: [], enhanced_resumes: many } as never);
    const pending: Array<() => void> = [];
    vi.mocked(getEnhancedResume).mockImplementation(() => new Promise((resolve) => {
      pending.push(() => resolve({ enhanced_data: {} } as never));
    }));

    const { unmount } = render(<ResumeListPage />);
    await waitFor(() => expect(pending.length).toBe(4));
    unmount();
    pending.splice(0).forEach((release) => release());
    await new Promise((r) => setTimeout(r, 50));

    expect(vi.mocked(getEnhancedResume)).toHaveBeenCalledTimes(4);
  });

  it('keeps the enhanced completion when the builder hydration lands after it', async () => {
    const { getEnhancedResume } = await import('@/api/enhancerApi');
    vi.mocked(getEnhancedResume).mockResolvedValue({
      enhanced_data: {
        personalInfo: { fullname: 'Uploaded Person', email: 'u@example.com', phone: '123' },
        professionalSummary: { summary: 'Summary text' },
        education: [{ degree: 'B.Tech' }],
        workExperience: [{ company: 'Acme' }],
      },
    } as never);
    let releaseBuilder: () => void = () => undefined;
    mockGetResumeById.mockImplementationOnce(() => new Promise((resolve) => {
      releaseBuilder = () => resolve(builderResume as never);
    }));

    render(<ResumeListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '50');
    });
    releaseBuilder();
    await waitFor(() => {
      expect(screen.getByTestId('resume-row-builder-1').getAttribute('data-completion')).toMatch(/^\d+$/);
    });
    expect(screen.getByTestId('resume-row-enhanced-1')).toHaveAttribute('data-completion', '50');
  });

  it('passes the same creation link (with return_to) to list-view rows as to cards', async () => {
    search.params = new URLSearchParams({ return_to: '/cover-letter/new' });
    render(<ResumeListPage />);

    await screen.findByTestId('resume-row-builder-1');
    fireEvent.click(screen.getByRole('button', { name: 'Change view' }));
    fireEvent.click(screen.getByRole('option', { name: /List view/ }));

    expect(screen.getByTestId('resume-table-row-builder-1'))
      .toHaveAttribute('data-creation-url', '/builder/creation/builder-1?return_to=%2Fcover-letter%2Fnew');
    expect(screen.getByTestId('resume-table-row-enhanced-1'))
      .toHaveAttribute('data-creation-url', '/builder/creation/enhanced-1?source=enhanced&return_to=%2Fcover-letter%2Fnew');
  });
});
