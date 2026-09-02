import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/(user)/dashboard/page';
import { useDashboard } from '@/contexts/DashboardContext';
import { toast } from 'sonner';
import type { DashboardSummary } from '@/types/dashboard.types';

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('@/app/(user)/dashboard/_components/FirstTimeDashboard', () => ({
  default: ({ data }: { data: DashboardSummary }) => (
    <section data-testid="first-time-dashboard">Dashboard for {data.user.name}</section>
  ),
}));

const mockUseDashboard = vi.mocked(useDashboard);
const mockToast = vi.mocked(toast);

const dashboardSummary: DashboardSummary = {
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  plan: {
    plan_id: 'free',
    plan_name: 'Free',
    credits_total: 100,
    credits_remaining: 25,
  },
  profile: {
    completeness: 40,
    missing_fields: ['experience'],
  },
  recommended_step: {
    step_number: 1,
    step_name: 'upload_resume',
    title: 'Upload Resume',
    description: 'Upload your resume',
    credit_cost: 5,
    cta_text: 'Upload Resume',
    cta_path: '/builder/start',
  },
  progress: {
    resume_uploaded: false,
    profile_completed: false,
    ats_scan_done: false,
    resume_enhanced: false,
    job_applied: false,
  },
  usage_counts: {
    resumes_created: 0,
    resumes_parsed: 0,
    ats_scans: 0,
    resumes_enhanced: 0,
    job_matches: 0,
    job_applications: 0,
    assessments_taken: 0,
  },
  best_scores: {},
  recent_activity: [],
  trending_roles: [],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      data: dashboardSummary,
      loading: false,
      error: null,
      creditsRemaining: dashboardSummary.plan.credits_remaining,
      refreshDashboard: vi.fn(),
    });
  });

  it('renders the production dashboard component when summary data is available', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('first-time-dashboard')).toHaveTextContent('Dashboard for John Doe');
  });

  it('renders skeleton loading blocks while dashboard data is loading', () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      creditsRemaining: null,
      refreshDashboard: vi.fn(),
    });

    const { container } = render(<DashboardPage />);

    expect(container.firstElementChild).toHaveClass('animate-pulse');
    expect(screen.queryByText(/Failed to Load Dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('first-time-dashboard')).not.toBeInTheDocument();
  });

  it('shows the error panel when the dashboard request fails', () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network down'),
      creditsRemaining: null,
      refreshDashboard: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /Failed to Load Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/We couldn't load your dashboard data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('shows the same error panel when loading completes without data', () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      creditsRemaining: null,
      refreshDashboard: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /Failed to Load Dashboard/i })).toBeInTheDocument();
  });

  it('dismisses toasts and reloads the page when retry is clicked', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    mockUseDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network down'),
      creditsRemaining: null,
      refreshDashboard: vi.fn(),
    });

    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    expect(mockToast.dismiss).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('prefers the loading state when loading is true even if stale data exists', () => {
    mockUseDashboard.mockReturnValue({
      data: dashboardSummary,
      loading: true,
      error: null,
      creditsRemaining: dashboardSummary.plan.credits_remaining,
      refreshDashboard: vi.fn(),
    });

    const { container } = render(<DashboardPage />);

    expect(container.firstElementChild).toHaveClass('animate-pulse');
    expect(screen.queryByTestId('first-time-dashboard')).not.toBeInTheDocument();
  });
});
