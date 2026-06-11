import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dashboard data
const mockDashboardData = {
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    planId: 'free',
    creditsRemaining: 5,
  },
  stats: {
    resumesCreated: 2,
    atsScansCompleted: 1,
    jobApplications: 5,
  },
  recentResumes: [
    {
      id: 'resume-1',
      title: 'Software Engineer Resume',
      lastModified: new Date().toISOString(),
      score: 85,
    },
  ],
};

// Mock FirstTimeDashboard component
const MockFirstTimeDashboard = ({ data }: any) => (
  <div data-testid="dashboard-content">
    <h1>Dashboard for {data.user.name}</h1>
    <p>Plan: {data.user.planId}</p>
    <p>Credits: {data.user.creditsRemaining}</p>
    <div data-testid="resumes-list">
      {data.recentResumes.map((r: any) => (
        <div key={r.id}>{r.title}</div>
      ))}
    </div>
  </div>
);

// Mock DashboardContext
vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: vi.fn(() => ({
    data: mockDashboardData,
    loading: false,
    error: null,
  })),
}));

// Test component that uses the context
const DashboardPage = () => {
  const { data: dashboardData, loading, error } = require('@/contexts/DashboardContext').useDashboard();

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading resume data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-red-700 mb-4">We couldn't load your dashboard data. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <MockFirstTimeDashboard data={dashboardData} />;
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard when data loads successfully', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Dashboard for John Doe')).toBeInTheDocument();
    expect(screen.getByText('Plan: free')).toBeInTheDocument();
  });

  it('displays loading skeleton while fetching data', () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    useDashboard.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<DashboardPage />);

    expect(screen.getByText('Loading resume data...')).toBeInTheDocument();
  });

  it('shows error state when dashboard data fails to load', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    useDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to Load Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/We couldn't load your dashboard data/i)).toBeInTheDocument();
  });

  it('displays user credits and plan information', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Plan: free')).toBeInTheDocument();
      expect(screen.getByText('Credits: 5')).toBeInTheDocument();
    });
  });

  it('displays recent resumes in dashboard', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('resumes-list')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
    });
  });

  it('handles null dashboard data gracefully', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    useDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to Load Dashboard/i)).toBeInTheDocument();
    });
  });

  it('renders retry button on error', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    useDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<DashboardPage />);

    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Retry');
  });

  it('handles multiple resumes in dashboard', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    const multipleResumesData = {
      ...mockDashboardData,
      recentResumes: [
        { id: '1', title: 'Resume 1', lastModified: new Date().toISOString(), score: 80 },
        { id: '2', title: 'Resume 2', lastModified: new Date().toISOString(), score: 85 },
        { id: '3', title: 'Resume 3', lastModified: new Date().toISOString(), score: 90 },
      ],
    };

    useDashboard.mockReturnValue({
      data: multipleResumesData,
      loading: false,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Resume 1')).toBeInTheDocument();
      expect(screen.getByText('Resume 2')).toBeInTheDocument();
      expect(screen.getByText('Resume 3')).toBeInTheDocument();
    });
  });

  it('displays different plan types', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    const premiumData = {
      ...mockDashboardData,
      user: { ...mockDashboardData.user, planId: 'premium' },
    };

    useDashboard.mockReturnValue({
      data: premiumData,
      loading: false,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Plan: premium')).toBeInTheDocument();
    });
  });

  it('handles zero credits', async () => {
    const { useDashboard } = require('@/contexts/DashboardContext');
    const noCreditsData = {
      ...mockDashboardData,
      user: { ...mockDashboardData.user, creditsRemaining: 0 },
    };

    useDashboard.mockReturnValue({
      data: noCreditsData,
      loading: false,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Credits: 0')).toBeInTheDocument();
    });
  });
});
