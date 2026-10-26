import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobMatchTab from '@/app/(resume)/builder/creation/_components/job/JobMatchTab';
import FindMatchingJobsPanel from '@/app/(resume)/builder/creation/_components/job/FindMatchingJobsPanel';
import { getSmartMatchedJobs } from '@/api/jobsApi';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/api/jobsApi', () => ({
  getSmartMatchedJobs: vi.fn(),
}));

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    resumeData: {
      personalInfo: { location: 'Hyderabad' },
      workExperience: [{ company: 'Acme' }],
      education: [],
      categorizedSkills: { programming_languages: ['Python'] },
    },
    completionStatus: { A: true, B: true, C: true, D: false },
    lastUpdated: new Date(2026, 9, 18, 10, 30),
  }),
}));

vi.mock('@/app/(resume)/builder/creation/_hooks/useSavedResumeSnapshot', () => ({
  useSavedResumeSnapshot: (data: unknown) => data,
}));

const mockGetJobs = vi.mocked(getSmartMatchedJobs);

const item = (id: string, title: string, score: number) => ({
  job: { id, title, company: 'Acme', location: 'Hyderabad' },
  match: { job_id: id, score, band: 'good', breakdown: {}, matched_skills: [], missing_skills: [], scorer_version: 1, computed_at: '' },
});

const response = (jobs: unknown[], profileVersion = 1) =>
  ({ jobs, total: jobs.length, skip: 0, limit: 50, cache_hit: false, computed_in_ms: 1, scorer_version: 1, profile_version: profileVersion }) as never;

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('JobMatchTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetJobs.mockResolvedValue(response([
      item('1', 'UI/UX Designer', 92),
      item('2', 'Frontend Developer', 78),
      item('3', 'ui/ux designer', 60),
      item('4', 'Product Designer', 45),
    ]));
  });

  it('shows readiness, what we match on and the real match tiles', async () => {
    render(<JobMatchTab />);

    expect(screen.getByText('Resume Readiness')).toBeInTheDocument();
    // the bar is sections filled (3 of 4 = 75%) and the chip describes that same figure
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('3 of 4 sections filled')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Resume Readiness' })).toHaveAttribute('aria-valuenow', '75');

    // "What we match on" is ticked from what the resume contains
    expect(screen.getByLabelText('Skills & Technologies found in your resume')).toBeInTheDocument();
    expect(screen.getByLabelText('Role & Experience found in your resume')).toBeInTheDocument();
    expect(screen.getByLabelText('Education & Domain missing from your resume')).toBeInTheDocument();
    expect(screen.getByLabelText('Location Preferences found in your resume')).toBeInTheDocument();

    // tiles: distinct roles (case-insensitive), best score, data status
    await waitFor(() => expect(within(tile('Data Status')).getByText('Ready')).toBeInTheDocument());
    expect(within(tile('Matched Roles')).getByText('3')).toBeInTheDocument();
    expect(within(tile('Top Match')).getByText('92%')).toBeInTheDocument();
  });

  it('has no View All link, role breakdown or matching jobs list', async () => {
    render(<JobMatchTab />);
    await waitFor(() => expect(screen.queryByText(/Loading match data/)).not.toBeInTheDocument());

    expect(screen.queryByText(/View All/)).not.toBeInTheDocument();
    expect(screen.queryByText('Matching Jobs')).not.toBeInTheDocument();
    expect(screen.queryByText('Role Breakdown')).not.toBeInTheDocument();
  });

  it('shows when the resume was last updated, in the readiness card', async () => {
    render(<JobMatchTab />);
    expect(screen.getByText('Updated Oct 18, 2026')).toBeInTheDocument();
  });

  it('has no Find button of its own: that action is the right-hand card now', async () => {
    render(<JobMatchTab />);
    await waitFor(() => expect(screen.queryByText(/Loading match data/)).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Find My Matching Jobs/ })).not.toBeInTheDocument();
  });

  it('sends the user to the Jobs page from the right-hand card', async () => {
    render(<FindMatchingJobsPanel />);
    expect(screen.getByText('Find Your Matching Jobs')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Find My Matching Jobs/ }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/jobslogin');
  });

  it('quietly retries an empty first answer while the server is still matching', async () => {
    vi.useFakeTimers();
    try {
      mockGetJobs.mockReset();
      mockGetJobs.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([item('1', 'UI/UX Designer', 92)]));
      render(<JobMatchTab />);

      await vi.advanceTimersByTimeAsync(0);
      expect(within(tile('Data Status')).getByText('Checking…')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(4000);
      expect(mockGetJobs).toHaveBeenCalledTimes(2);
      expect(within(tile('Top Match')).getByText('92%')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('says a profile is needed when the server reports profile_version 0', async () => {
    vi.useFakeTimers();
    try {
      mockGetJobs.mockReset();
      mockGetJobs.mockResolvedValue(response([], 0));
      render(<JobMatchTab />);

      await vi.advanceTimersByTimeAsync(4000 + 8000 + 15000 + 25000 + 40000 + 100);

      expect(mockGetJobs).toHaveBeenCalledTimes(6);
      expect(within(tile('Data Status')).getByText('Profile needed')).toBeInTheDocument();
      expect(within(tile('Top Match')).getByText('None yet')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows Unavailable with a Try again button when matching fails, and retries on click', async () => {
    mockGetJobs.mockRejectedValueOnce(new Error('boom'));
    render(<JobMatchTab />);

    await waitFor(() => expect(within(tile('Data Status')).getByText('Unavailable')).toBeInTheDocument());
    expect(screen.getByText("We couldn't load your job matches right now.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));

    await waitFor(() => expect(within(tile('Top Match')).getByText('92%')).toBeInTheDocument());
    expect(within(tile('Data Status')).getByText('Ready')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument();
    expect(mockGetJobs).toHaveBeenCalledTimes(2);
  });

  it('does not offer Try again when the problem is not a failure (no saved resume, profile needed)', async () => {
    mockGetJobs.mockRejectedValue({ response: { status: 404 } });
    render(<JobMatchTab />);

    await waitFor(() => expect(within(tile('Data Status')).getByText('Save resume')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument();
  });

  it('asks for a saved resume when the server has none (404)', async () => {
    mockGetJobs.mockRejectedValue({ response: { status: 404 } });
    render(<JobMatchTab />);

    await waitFor(() => expect(within(tile('Data Status')).getByText('Save resume')).toBeInTheDocument());
  });
});
