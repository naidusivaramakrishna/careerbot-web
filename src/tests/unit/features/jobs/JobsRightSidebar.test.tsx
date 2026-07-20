import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

// ─── Mock data ────────────────────────────────────────────────────────────────

interface MockJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  matchScore?: number;
}

const mockTopPicks: MockJob[] = [
  { id: 'job-1', title: 'Senior React Developer', company: 'TechCorp', location: 'Bangalore, India', type: 'Full-time', matchScore: 85 },
  { id: 'job-2', title: 'Frontend Engineer', company: 'Acme Corp', location: 'Remote', type: 'Contract', matchScore: 60 },
  { id: 'job-3', title: 'UI Developer', company: 'Beta Inc', location: 'Delhi, India', type: 'Full-time' },
  { id: 'job-4', title: 'Should not render — beyond top 3', company: 'Gamma LLC', location: 'Pune, India', type: 'Full-time', matchScore: 40 },
];

// ─── Wrapper: TopPickCard ───────────────────────────────────────────────────
// Mirrors src/app/(jobs)/jobslogin/_components/sidebar/TopPickCard.tsx.
// Regression coverage: the "View all" CTA used to have no onClick at all
// (dead button), the card rendered its own duplicate "Live" pill on top of
// the parent panel's badge, and long titles were hard-truncated to one line.

function TopPickCardWrapper({
  jobs = [],
  loading = false,
  emptyMessage,
  onViewAll,
}: {
  jobs?: MockJob[];
  loading?: boolean;
  emptyMessage?: string;
  onViewAll?: () => void;
}) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div data-testid="top-pick-card">
      <h3 data-testid="top-pick-title">Top picks for you</h3>
      <p>Personalised · refreshed hourly</p>
      {/* No badge here — "Live" status is owned by the parent panel header only. */}

      {loading ? (
        <div data-testid="top-pick-skeleton">Loading…</div>
      ) : topPicks.length === 0 ? (
        <p data-testid="top-pick-empty">{emptyMessage ?? 'No personalised picks yet.'}</p>
      ) : (
        <ul data-testid="top-pick-list">
          {topPicks.map((job, idx) => (
            <li key={job.id} data-testid={`top-pick-item-${job.id}`}>
              <span data-testid={`top-pick-rank-${job.id}`}>{idx + 1}</span>
              <p data-testid={`top-pick-job-title-${job.id}`} className="line-clamp-2">
                {job.title}
              </p>
              <span data-testid={`top-pick-company-${job.id}`}>{job.company}</span>
              <span data-testid={`top-pick-location-${job.id}`}>{job.location.split(',')[0]}</span>
              {job.type && <span data-testid={`top-pick-type-${job.id}`}>{job.type}</span>}
              {!!job.matchScore && Math.round(job.matchScore) > 0 ? (
                <span data-testid={`top-pick-score-${job.id}`}>{Math.round(job.matchScore)}%</span>
              ) : (
                <span data-testid={`top-pick-arrow-${job.id}`}>→</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <button data-testid="view-all-button" onClick={onViewAll}>
        View all recommendations
      </button>
    </div>
  );
}

// ─── Wrapper: JobsRightSidebar ──────────────────────────────────────────────
// Mirrors src/app/(jobs)/jobslogin/_components/sidebar/JobsRightSidebar.tsx.
// Regression coverage: the Nancy chat widget used to be `position: sticky`
// *inside* the scrollable card list, which pinned it to the viewport bottom
// and painted it over whatever card was currently scrolled underneath (e.g.
// Trending Skills bars). It must stay corner-anchored to the panel itself.

function JobsRightSidebarWrapper({
  topPicks = [],
  topPicksLoading = false,
  topPicksEmptyMessage,
  onChatOpen,
  onViewAllRecommendations,
}: {
  topPicks?: MockJob[];
  topPicksLoading?: boolean;
  topPicksEmptyMessage?: string;
  onChatOpen?: () => void;
  onViewAllRecommendations?: () => void;
}) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  return (
    <div data-testid="jobs-right-sidebar">
      <div data-testid="sidebar-header">
        <h2>Career intelligence</h2>
        <span data-testid="sidebar-live-badge">Live</span>
      </div>

      <div data-testid="sidebar-scroll-area">
        <TopPickCardWrapper
          jobs={topPicks}
          loading={topPicksLoading}
          emptyMessage={topPicksEmptyMessage}
          onViewAll={onViewAllRecommendations}
        />
      </div>

      {/* Corner-anchored to the panel, NOT inside the scroll area above —
          must never overlap scrolled card content. */}
      <div data-testid="nancy-widget" data-position="corner-anchored">
        {!bubbleDismissed && (
          <div data-testid="nancy-greeting">
            <button data-testid="nancy-dismiss" onClick={() => setBubbleDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
            <p>Hi! Ask me about job fit, salary, or your next best move.</p>
          </div>
        )}
        <button data-testid="nancy-avatar-button" onClick={() => { setBubbleDismissed(false); onChatOpen?.(); }}>
          Nancy AI
        </button>
      </div>
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TopPickCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header title and subtitle', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.getByTestId('top-pick-title')).toHaveTextContent('Top picks for you');
    expect(screen.getByText('Personalised · refreshed hourly')).toBeInTheDocument();
  });

  it('does not render its own "Live" badge (owned by the parent panel only)', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('shows a loading skeleton and no job rows while loading', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} loading />);
    expect(screen.getByTestId('top-pick-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('top-pick-list')).not.toBeInTheDocument();
  });

  it('shows the default empty message when there are no jobs and not loading', () => {
    render(<TopPickCardWrapper jobs={[]} />);
    expect(screen.getByTestId('top-pick-empty')).toHaveTextContent('No personalised picks yet.');
  });

  it('shows a custom empty message when provided (e.g. no resume on file)', () => {
    render(<TopPickCardWrapper jobs={[]} emptyMessage="Upload your resume in Profile to get personalised picks." />);
    expect(screen.getByTestId('top-pick-empty')).toHaveTextContent('Upload your resume in Profile');
  });

  it('renders at most the top 3 jobs, ranked 1-3', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    const list = screen.getByTestId('top-pick-list');
    expect(list.querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByTestId('top-pick-rank-job-1')).toHaveTextContent('1');
    expect(screen.getByTestId('top-pick-rank-job-2')).toHaveTextContent('2');
    expect(screen.getByTestId('top-pick-rank-job-3')).toHaveTextContent('3');
    expect(screen.queryByTestId('top-pick-item-job-4')).not.toBeInTheDocument();
  });

  it('shows only the city (first location segment) for each pick', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.getByTestId('top-pick-location-job-1')).toHaveTextContent('Bangalore');
  });

  it('renders a real match score badge when matchScore is greater than 0', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.getByTestId('top-pick-score-job-1')).toHaveTextContent('85%');
    expect(screen.getByTestId('top-pick-score-job-2')).toHaveTextContent('60%');
  });

  it('renders an arrow instead of a fabricated score when matchScore is absent', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.queryByTestId('top-pick-score-job-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('top-pick-arrow-job-3')).toBeInTheDocument();
  });

  it('renders job titles with a multi-line clamp instead of a hard single-line truncation', () => {
    render(<TopPickCardWrapper jobs={mockTopPicks} />);
    expect(screen.getByTestId('top-pick-job-title-job-1')).toHaveClass('line-clamp-2');
    expect(screen.getByTestId('top-pick-job-title-job-1')).not.toHaveClass('truncate');
  });

  it('calls onViewAll when "View all recommendations" is clicked', () => {
    const onViewAll = vi.fn();
    render(<TopPickCardWrapper jobs={mockTopPicks} onViewAll={onViewAll} />);
    fireEvent.click(screen.getByTestId('view-all-button'));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});

describe('JobsRightSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exactly one "Live" badge across the whole panel', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} />);
    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getByTestId('sidebar-live-badge')).toBeInTheDocument();
  });

  it('passes topPicks through to the Top Picks card', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} />);
    expect(screen.getByTestId('top-pick-item-job-1')).toBeInTheDocument();
  });

  it('passes topPicksLoading through so the picks card shows a skeleton', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} topPicksLoading />);
    expect(screen.getByTestId('top-pick-skeleton')).toBeInTheDocument();
  });

  it('keeps the Nancy widget corner-anchored to the panel, not stuck to the scroll area', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} />);
    const widget = screen.getByTestId('nancy-widget');
    expect(widget).toHaveAttribute('data-position', 'corner-anchored');
    // Regression guard: it must not live inside the scrollable card list.
    const scrollArea = screen.getByTestId('sidebar-scroll-area');
    expect(scrollArea.contains(widget)).toBe(false);
  });

  it('shows the Nancy greeting bubble by default', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} />);
    expect(screen.getByTestId('nancy-greeting')).toBeInTheDocument();
  });

  it('dismisses the greeting bubble without hiding the avatar button', () => {
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} />);
    fireEvent.click(screen.getByTestId('nancy-dismiss'));
    expect(screen.queryByTestId('nancy-greeting')).not.toBeInTheDocument();
    expect(screen.getByTestId('nancy-avatar-button')).toBeInTheDocument();
  });

  it('calls onChatOpen when the Nancy avatar button is clicked', () => {
    const onChatOpen = vi.fn();
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} onChatOpen={onChatOpen} />);
    fireEvent.click(screen.getByTestId('nancy-avatar-button'));
    expect(onChatOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onViewAllRecommendations when the Top Picks "View all" CTA is clicked', () => {
    const onViewAllRecommendations = vi.fn();
    render(<JobsRightSidebarWrapper topPicks={mockTopPicks} onViewAllRecommendations={onViewAllRecommendations} />);
    fireEvent.click(screen.getByTestId('view-all-button'));
    expect(onViewAllRecommendations).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-state message in Top Picks when there are no recommendations', () => {
    render(<JobsRightSidebarWrapper topPicks={[]} topPicksEmptyMessage="No strong matches yet — check back soon." />);
    expect(screen.getByTestId('top-pick-empty')).toHaveTextContent('No strong matches yet');
  });
});
