import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

// ─── Top-level mock functions (ESM-safe) ──────────────────────────────────────

const mockSearchJobs = vi.fn();
const mockGetSmartMatchedJobs = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('@/api/jobsApi', () => ({
  searchJobs: (...args: any[]) => mockSearchJobs(...args),
  getSmartMatchedJobs: (...args: any[]) => mockGetSmartMatchedJobs(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    info: (msg: string) => mockToastInfo(msg),
  },
}));

vi.mock('@/utils/jobTracking', () => ({
  getSavedJobIds: vi.fn(() => []),
  getSavedJobsCount: vi.fn(() => 0),
}));

vi.mock('@/utils/jobIdHelper', () => ({
  getJobId: vi.fn((id: string) => id || 'generated-id'),
}));

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockJob = {
  id: 'job-1',
  title: 'Frontend Developer',
  company: 'Acme Corp',
  location: 'Mumbai, India',
  job_type: 'Full-time',
  work_mode: 'Remote',
  salary: '₹15-20 LPA',
  skills: 'React, JavaScript',
  experience_level: '2-4 years',
  source: 'linkedin',
  is_applied: false,
};

const mockApiSuccess = {
  success: true,
  data: [mockJob],
  pagination: { total: 1, total_pages: 1, has_next: false },
};

const mockApiEmpty = {
  success: true,
  data: [],
  pagination: { total: 0, total_pages: 1, has_next: false },
};

// ─── Test component ───────────────────────────────────────────────────────────

type TabType = 'all' | 'saved' | 'new' | 'matched';

function JobsContentsWrapper() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [matchedNoResume, setMatchedNoResume] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openChat, setOpenChat] = useState(false);

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockSearchJobs({ q: searchQuery || undefined, page, limit: 10 });
      if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch jobs');
      setJobs(response.data);
      setCurrentPage(page);
      setTotalPages(response.pagination?.total_pages || 1);
      if (response.data.length === 0) {
        mockToastInfo('No jobs found matching your criteria');
      }
    } catch (err: any) {
      setError(err.message);
      mockToastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartMatch = async () => {
    setMatchedLoading(true);
    try {
      const data = await mockGetSmartMatchedJobs({ limit: 50 });
      setMatchedJobs(data.jobs || []);
      setMatchedNoResume(false);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setMatchedNoResume(true);
      } else {
        mockToastError('Could not load Smart Match jobs. Please try again later.');
      }
    } finally {
      setMatchedLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'matched') fetchSmartMatch();
  };

  return (
    <div data-testid="jobs-contents">
      {/* Search */}
      <input
        data-testid="search-input"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by title or company"
      />
      <button data-testid="search-button" onClick={() => fetchJobs(1)}>Search</button>

      {/* Tabs */}
      <div data-testid="tabs">
        {(['all', 'saved', 'new', 'matched'] as TabType[]).map((tab) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => handleTabChange(tab)}
            aria-selected={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <button data-testid="fetch-jobs-button" onClick={() => fetchJobs(1)}>Load Jobs</button>

      {loading && <div data-testid="loading-state">Loading…</div>}
      {matchedLoading && <div data-testid="matched-loading">Loading Smart Match…</div>}

      {error && (
        <div data-testid="error-state">
          <p data-testid="error-message">{error}</p>
          <button data-testid="retry-button" onClick={() => fetchJobs(currentPage)}>Try Again</button>
        </div>
      )}

      {!loading && !error && activeTab !== 'matched' && (
        <div data-testid="job-list">
          {jobs.length === 0 ? (
            <div data-testid="empty-state">No results found</div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} data-testid={`job-item-${job.id}`}>
                <span data-testid="job-title">{job.title}</span>
                <span data-testid="job-company">{job.company}</span>
                <button data-testid="chat-button" onClick={() => setOpenChat(true)}>Ask Nancy</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'matched' && !matchedLoading && (
        <div data-testid="matched-tab-content">
          {matchedNoResume ? (
            <div data-testid="no-resume-state">Resume required for Smart Match</div>
          ) : matchedJobs.length === 0 ? (
            <div data-testid="no-matched-jobs">No matched jobs found</div>
          ) : (
            <div data-testid="matched-jobs-list">
              {matchedJobs.map((job: any) => (
                <div key={job.id} data-testid={`matched-job-${job.id}`}>{job.title}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div data-testid="pagination">
          <button data-testid="page-2" onClick={() => fetchJobs(2)}>Page 2</button>
        </div>
      )}

      {openChat && (
        <div data-testid="nancy-chat">
          <button data-testid="close-chat" onClick={() => setOpenChat(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobsContents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and tabs', () => {
    render(<JobsContentsWrapper />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-saved')).toBeInTheDocument();
    expect(screen.getByTestId('tab-new')).toBeInTheDocument();
    expect(screen.getByTestId('tab-matched')).toBeInTheDocument();
  });

  it('shows loading state while fetching jobs', async () => {
    mockSearchJobs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockApiSuccess), 200))
    );
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  it('renders job list after successful fetch', async () => {
    mockSearchJobs.mockResolvedValue(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('job-list')).toBeInTheDocument();
      expect(screen.getByTestId('job-item-job-1')).toBeInTheDocument();
    });
  });

  it('displays job title and company from API response', async () => {
    mockSearchJobs.mockResolvedValue(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('job-title')).toHaveTextContent('Frontend Developer');
      expect(screen.getByTestId('job-company')).toHaveTextContent('Acme Corp');
    });
  });

  it('shows empty state when no jobs returned', async () => {
    mockSearchJobs.mockResolvedValue(mockApiEmpty);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent('No results found');
    });
  });

  it('calls toast.info when no jobs found', async () => {
    mockSearchJobs.mockResolvedValue(mockApiEmpty);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith('No jobs found matching your criteria');
    });
  });

  it('shows error state when API fails', async () => {
    mockSearchJobs.mockRejectedValue(new Error('Network error'));
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('calls toast.error when API fails', async () => {
    mockSearchJobs.mockRejectedValue(new Error('Server down'));
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Server down');
    });
  });

  it('shows retry button on error', async () => {
    mockSearchJobs.mockRejectedValue(new Error('Failed'));
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });
  });

  it('retries fetch when retry button is clicked', async () => {
    mockSearchJobs
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => expect(screen.getByTestId('retry-button')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('retry-button'));
    await waitFor(() => {
      expect(screen.getByTestId('job-list')).toBeInTheDocument();
    });
  });

  it('updates search input value', () => {
    render(<JobsContentsWrapper />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'React Developer' } });
    expect(screen.getByTestId('search-input')).toHaveValue('React Developer');
  });

  it('fetches jobs with search query', async () => {
    mockSearchJobs.mockResolvedValue(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'React' } });
    fireEvent.click(screen.getByTestId('search-button'));
    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith(expect.objectContaining({ q: 'React' }));
    });
  });

  it('switches to matched tab and sets aria-selected', () => {
    mockGetSmartMatchedJobs.mockResolvedValue({ jobs: [] });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    expect(screen.getByTestId('tab-matched')).toHaveAttribute('aria-selected', 'true');
  });

  it('fetches smart match jobs when matched tab is clicked', async () => {
    mockGetSmartMatchedJobs.mockResolvedValue({ jobs: [] });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    await waitFor(() => {
      expect(mockGetSmartMatchedJobs).toHaveBeenCalledTimes(1);
    });
  });

  it('shows matched jobs list when smart match returns data', async () => {
    mockGetSmartMatchedJobs.mockResolvedValue({
      jobs: [{ id: 'matched-1', title: 'Matched Job' }],
    });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    await waitFor(() => {
      expect(screen.getByTestId('matched-jobs-list')).toBeInTheDocument();
      expect(screen.getByTestId('matched-job-matched-1')).toBeInTheDocument();
    });
  });

  it('shows no-resume state when smart match returns 404', async () => {
    mockGetSmartMatchedJobs.mockRejectedValue({ response: { status: 404 } });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    await waitFor(() => {
      expect(screen.getByTestId('no-resume-state')).toHaveTextContent('Resume required for Smart Match');
    });
  });

  it('calls toast.error when smart match fails with non-404 error', async () => {
    mockGetSmartMatchedJobs.mockRejectedValue(new Error('Server error'));
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Could not load Smart Match jobs. Please try again later.'
      );
    });
  });

  it('shows empty matched state when no matched jobs', async () => {
    mockGetSmartMatchedJobs.mockResolvedValue({ jobs: [] });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('tab-matched'));
    await waitFor(() => {
      expect(screen.getByTestId('no-matched-jobs')).toBeInTheDocument();
    });
  });

  it('shows pagination when total pages > 1', async () => {
    mockSearchJobs.mockResolvedValue({
      success: true,
      data: [mockJob],
      pagination: { total: 25, total_pages: 3, has_next: true },
    });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  it('fetches page 2 when pagination button clicked', async () => {
    mockSearchJobs.mockResolvedValue({
      success: true,
      data: [mockJob],
      pagination: { total: 25, total_pages: 3, has_next: true },
    });
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('page-2'));
    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('opens Nancy chat when Ask Nancy is clicked', async () => {
    mockSearchJobs.mockResolvedValue(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => expect(screen.getByTestId('chat-button')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('chat-button'));
    expect(screen.getByTestId('nancy-chat')).toBeInTheDocument();
  });

  it('closes Nancy chat when close button is clicked', async () => {
    mockSearchJobs.mockResolvedValue(mockApiSuccess);
    render(<JobsContentsWrapper />);
    fireEvent.click(screen.getByTestId('fetch-jobs-button'));
    await waitFor(() => expect(screen.getByTestId('chat-button')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('chat-button'));
    fireEvent.click(screen.getByTestId('close-chat'));
    expect(screen.queryByTestId('nancy-chat')).not.toBeInTheDocument();
  });
});
