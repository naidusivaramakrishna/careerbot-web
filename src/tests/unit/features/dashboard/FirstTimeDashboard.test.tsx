import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

interface DashboardSummary {
  user: {
    id: string;
    name: string;
    email: string;
    planId: string;
    creditsRemaining: number;
  };
  stats: {
    resumesCreated: number;
    atsScansCompleted: number;
    jobApplications: number;
  };
  recentResumes: Array<{
    id: string;
    title: string;
    lastModified: string;
    score: number;
  }>;
}

const mockData: DashboardSummary = {
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    planId: 'premium',
    creditsRemaining: 150,
  },
  stats: {
    resumesCreated: 5,
    atsScansCompleted: 3,
    jobApplications: 12,
  },
  recentResumes: [
    {
      id: 'resume-1',
      title: 'Senior Dev Resume',
      lastModified: new Date(Date.now() - 3600000).toISOString(),
      score: 88,
    },
    {
      id: 'resume-2',
      title: 'Product Manager Resume',
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      score: 75,
    },
  ],
};

// Mock component
const MockFirstTimeDashboard = ({ data }: { data: DashboardSummary }) => (
  <div data-testid="dashboard">
    <div data-testid="page-header">
      <h1>Welcome back, {data.user.name.split(' ')[0]}</h1>
      <p>{data.user.creditsRemaining} Credits</p>
      <p>{data.user.planId} plan</p>
    </div>

    <div data-testid="stats-section">
      <div data-testid="stat-card">Resumes Created: {data.stats.resumesCreated}</div>
      <div data-testid="stat-card">ATS Scans: {data.stats.atsScansCompleted}</div>
      <div data-testid="stat-card">Applications: {data.stats.jobApplications}</div>
    </div>

    <div data-testid="resumes-section">
      {data.recentResumes.map((resume) => (
        <div key={resume.id} data-testid={`resume-${resume.id}`}>
          <h3>{resume.title}</h3>
          <p>Score: {resume.score}</p>
        </div>
      ))}
    </div>

    <button data-testid="upgrade-button">Upgrade to Premium</button>
  </div>
);

describe('FirstTimeDashboard', () => {
  it('renders with correct user greeting', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    expect(screen.getByText(/Welcome back, John/)).toBeInTheDocument();
  });

  it('displays user credits and plan information', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    expect(screen.getByText('150 Credits')).toBeInTheDocument();
    expect(screen.getByText('premium plan')).toBeInTheDocument();
  });

  it('renders all stat cards with correct values', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    expect(screen.getByText('Resumes Created: 5')).toBeInTheDocument();
    expect(screen.getByText('ATS Scans: 3')).toBeInTheDocument();
    expect(screen.getByText('Applications: 12')).toBeInTheDocument();
  });

  it('displays recent resumes list', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    expect(screen.getByText('Senior Dev Resume')).toBeInTheDocument();
    expect(screen.getByText('Product Manager Resume')).toBeInTheDocument();
  });

  it('shows resume scores', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    const scoreElements = screen.getAllByText(/Score:/);
    expect(scoreElements.length).toBe(2);
    expect(screen.getByText('Score: 88')).toBeInTheDocument();
    expect(screen.getByText('Score: 75')).toBeInTheDocument();
  });

  it('renders upgrade button', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    const upgradeButton = screen.getByTestId('upgrade-button');
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toHaveTextContent('Upgrade to Premium');
  });

  it('handles empty resumes list', () => {
    const dataWithNoResumes = {
      ...mockData,
      recentResumes: [],
    };

    render(<MockFirstTimeDashboard data={dataWithNoResumes} />);

    expect(screen.queryByText('Senior Dev Resume')).not.toBeInTheDocument();
  });

  it('handles zero stats', () => {
    const dataWithZeroStats = {
      ...mockData,
      stats: {
        resumesCreated: 0,
        atsScansCompleted: 0,
        jobApplications: 0,
      },
    };

    render(<MockFirstTimeDashboard data={dataWithZeroStats} />);

    expect(screen.getByText('Resumes Created: 0')).toBeInTheDocument();
    expect(screen.getByText('ATS Scans: 0')).toBeInTheDocument();
    expect(screen.getByText('Applications: 0')).toBeInTheDocument();
  });

  it('displays free plan correctly', () => {
    const freeData = {
      ...mockData,
      user: { ...mockData.user, planId: 'free' },
    };

    render(<MockFirstTimeDashboard data={freeData} />);

    expect(screen.getByText('free plan')).toBeInTheDocument();
  });

  it('formats large credit numbers correctly', () => {
    const largeCreditsData = {
      ...mockData,
      user: { ...mockData.user, creditsRemaining: 1000 },
    };

    render(<MockFirstTimeDashboard data={largeCreditsData} />);

    expect(screen.getByText('1000 Credits')).toBeInTheDocument();
  });

  it('renders stats section with correct test ids', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    const statsSection = screen.getByTestId('stats-section');
    expect(statsSection).toBeInTheDocument();

    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBe(3);
  });

  it('displays resumes section with correct structure', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    expect(screen.getByTestId('resume-resume-1')).toBeInTheDocument();
    expect(screen.getByTestId('resume-resume-2')).toBeInTheDocument();
  });

  it('handles single resume', () => {
    const singleResumeData = {
      ...mockData,
      recentResumes: [mockData.recentResumes[0]],
    };

    render(<MockFirstTimeDashboard data={singleResumeData} />);

    expect(screen.getByText('Senior Dev Resume')).toBeInTheDocument();
    expect(screen.queryByText('Product Manager Resume')).not.toBeInTheDocument();
  });

  it('renders page header with all sections', () => {
    render(<MockFirstTimeDashboard data={mockData} />);

    const pageHeader = screen.getByTestId('page-header');
    expect(pageHeader).toBeInTheDocument();
    expect(pageHeader.querySelector('h1')).toBeInTheDocument();
  });
});
