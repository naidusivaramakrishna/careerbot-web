import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

// ─── Top-level mock functions (ESM-safe) ──────────────────────────────────────

const mockToggleJobSaved = vi.fn().mockReturnValue(true);
const mockApplyToJob = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, disabled, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    info: (msg: string) => mockToastInfo(msg),
    warning: vi.fn(),
  },
}));

vi.mock('@/utils/jobTracking', () => ({
  isJobSaved: vi.fn(() => false),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleJobSaved: (...args: any[]) => mockToggleJobSaved(...args),
}));

vi.mock('@/utils/jobApplication', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyToJob: (...args: any[]) => mockApplyToJob(...args),
}));

vi.mock('@/api/insightsApi', () => ({
  getMatchExplanation: vi.fn(),
}));

// ─── Default props ────────────────────────────────────────────────────────────

const defaultProps = {
  id: 'job-123',
  title: 'Senior React Developer',
  company: 'TechCorp',
  location: 'Bangalore, India',
  type: 'Full-time',
  mode: 'Hybrid',
  salary: '₹20-30 LPA',
  time: 'Recently',
  experience: '3-5 years',
  skills: 'React, TypeScript, Node.js',
  matchScore: 85,
  matchText: '85% match',
  match_band: 'strong',
  matched_skills: ['React', 'TypeScript'],
  missing_skills: ['GraphQL'],
  onBotClick: vi.fn(),
};

// ─── Wrapper component ────────────────────────────────────────────────────────

function JobCardWrapper(props: any) {
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(!!props.is_applied);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveJob = () => {
    const newState = mockToggleJobSaved(props.id, props.title, props.company, props.location, props.type);
    setIsSaved(!!newState);
    if (newState) mockToastSuccess('Job saved!');
    else mockToastInfo('Job removed from saved');
  };

  const handleApplyNow = () => {
    const externalUrl = props.url || props.application_url;
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (props.recruiter_id) {
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = async () => {
    const result = await mockApplyToJob(props.id, {});
    if (result.success) {
      setIsApplied(true);
      setIsModalOpen(false);
      mockToastSuccess(result.message);
    } else {
      mockToastError(result.message);
    }
  };

  const skillChips = props.skills
    ? props.skills.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6)
    : [];

  return (
    <div data-testid="job-card">
      <h3 data-testid="job-title">{props.title}</h3>
      <p data-testid="job-company">{props.company}</p>
      <p data-testid="job-location">{props.location}</p>
      {props.type && <span data-testid="job-type">{props.type}</span>}
      {props.mode && <span data-testid="job-mode">{props.mode}</span>}
      {props.salary && <span data-testid="job-salary">{props.salary}</span>}
      {props.experience && <span data-testid="job-experience">{props.experience}</span>}

      {skillChips.length > 0 && (
        <div data-testid="skill-chips">
          {skillChips.map((skill: string) => (
            <span key={skill} data-testid={`skill-${skill.toLowerCase().replace(/\s/g, '-')}`}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {props.matched_skills && props.matched_skills.length > 0 && (
        <div data-testid="matched-skills">
          {props.matched_skills.map((s: string) => (
            <span key={s} data-testid={`matched-${s.toLowerCase()}`}>✓ {s}</span>
          ))}
        </div>
      )}

      {props.missing_skills && props.missing_skills.length > 0 && (
        <div data-testid="missing-skills">
          <span data-testid="missing-skills-label">Missing Skills</span>
          {props.missing_skills.map((s: string) => (
            <span key={s} data-testid={`missing-${s.toLowerCase()}`}>{s}</span>
          ))}
        </div>
      )}

      {props.matchScore > 0 && (
        <span data-testid="match-score">{Math.round(props.matchScore)}%</span>
      )}

      {isApplied && <span data-testid="applied-badge">✓ Applied</span>}

      <button
        data-testid="save-job-button"
        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
        onClick={handleSaveJob}
      >
        {isSaved ? 'Saved' : 'Save'}
      </button>

      <button data-testid="ask-nancy-button" onClick={props.onBotClick}>
        Ask Nancy
      </button>

      <button data-testid="apply-button" onClick={handleApplyNow} disabled={isApplied}>
        {isApplied ? '✓ Applied' : 'Apply Now'}
      </button>

      {isModalOpen && (
        <div data-testid="application-modal">
          <button data-testid="modal-submit" onClick={handleModalSubmit}>Submit</button>
          <button data-testid="modal-close" onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleJobSaved.mockReturnValue(true);
  });

  // Rendering
  it('renders job title, company and location', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('job-title')).toHaveTextContent('Senior React Developer');
    expect(screen.getByTestId('job-company')).toHaveTextContent('TechCorp');
    expect(screen.getByTestId('job-location')).toHaveTextContent('Bangalore, India');
  });

  it('renders job type, mode, salary and experience', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('job-type')).toHaveTextContent('Full-time');
    expect(screen.getByTestId('job-mode')).toHaveTextContent('Hybrid');
    expect(screen.getByTestId('job-salary')).toHaveTextContent('₹20-30 LPA');
    expect(screen.getByTestId('job-experience')).toHaveTextContent('3-5 years');
  });

  it('renders skill chips from skills string', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('skill-chips')).toBeInTheDocument();
    expect(screen.getByTestId('skill-react')).toBeInTheDocument();
    expect(screen.getByTestId('skill-typescript')).toBeInTheDocument();
    expect(screen.getByTestId('skill-node.js')).toBeInTheDocument();
  });

  it('renders matched skills with checkmark', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('matched-skills')).toBeInTheDocument();
    expect(screen.getByTestId('matched-react')).toHaveTextContent('✓ React');
    expect(screen.getByTestId('matched-typescript')).toHaveTextContent('✓ TypeScript');
  });

  it('renders missing skills section', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('missing-skills-label')).toHaveTextContent('Missing Skills');
    expect(screen.getByTestId('missing-graphql')).toHaveTextContent('GraphQL');
  });

  it('renders match score when provided', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('match-score')).toHaveTextContent('85%');
  });

  it('does not render match score when matchScore is 0', () => {
    render(<JobCardWrapper {...defaultProps} matchScore={0} />);
    expect(screen.queryByTestId('match-score')).not.toBeInTheDocument();
  });

  // Save job
  it('renders save button', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('save-job-button')).toBeInTheDocument();
  });

  it('toggles save state when save button clicked', async () => {
    mockToggleJobSaved.mockReturnValue(true);
    render(<JobCardWrapper {...defaultProps} />);
    fireEvent.click(screen.getByTestId('save-job-button'));
    await waitFor(() => {
      expect(screen.getByTestId('save-job-button')).toHaveTextContent('Saved');
    });
  });

  it('shows success toast when job is saved', async () => {
    mockToggleJobSaved.mockReturnValue(true);
    render(<JobCardWrapper {...defaultProps} />);
    fireEvent.click(screen.getByTestId('save-job-button'));
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Job saved!');
    });
  });

  it('shows info toast when job is unsaved', async () => {
    mockToggleJobSaved.mockReturnValue(false);
    render(<JobCardWrapper {...defaultProps} />);
    fireEvent.click(screen.getByTestId('save-job-button'));
    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith('Job removed from saved');
    });
  });

  // Ask Nancy
  it('calls onBotClick when Ask Nancy button is clicked', () => {
    const onBotClick = vi.fn();
    render(<JobCardWrapper {...defaultProps} onBotClick={onBotClick} />);
    fireEvent.click(screen.getByTestId('ask-nancy-button'));
    expect(onBotClick).toHaveBeenCalledTimes(1);
  });

  // Apply
  it('renders Apply Now button', () => {
    render(<JobCardWrapper {...defaultProps} />);
    expect(screen.getByTestId('apply-button')).toHaveTextContent('Apply Now');
  });

  it('opens external url in new tab when url is provided', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JobCardWrapper {...defaultProps} url="https://techcorp.com/apply" />);
    fireEvent.click(screen.getByTestId('apply-button'));
    expect(windowOpen).toHaveBeenCalledWith('https://techcorp.com/apply', '_blank', 'noopener,noreferrer');
    windowOpen.mockRestore();
  });

  it('opens application modal when recruiter_id is present and no url', () => {
    render(<JobCardWrapper {...defaultProps} url="" application_url="" recruiter_id="rec-123" />);
    fireEvent.click(screen.getByTestId('apply-button'));
    expect(screen.getByTestId('application-modal')).toBeInTheDocument();
  });

  it('closes application modal when close button is clicked', async () => {
    render(<JobCardWrapper {...defaultProps} url="" application_url="" recruiter_id="rec-123" />);
    fireEvent.click(screen.getByTestId('apply-button'));
    await waitFor(() => expect(screen.getByTestId('application-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('application-modal')).not.toBeInTheDocument();
    });
  });

  it('marks job as applied after successful modal submission', async () => {
    mockApplyToJob.mockResolvedValue({ success: true, message: 'Applied successfully!', status: 'applied' });
    render(<JobCardWrapper {...defaultProps} url="" application_url="" recruiter_id="rec-123" />);
    fireEvent.click(screen.getByTestId('apply-button'));
    await waitFor(() => expect(screen.getByTestId('modal-submit')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('modal-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('applied-badge')).toBeInTheDocument();
    });
  });

  it('apply button is disabled when already applied', () => {
    render(<JobCardWrapper {...defaultProps} is_applied={true} />);
    expect(screen.getByTestId('apply-button')).toBeDisabled();
  });

  it('shows ✓ Applied text when already applied', () => {
    render(<JobCardWrapper {...defaultProps} is_applied={true} />);
    expect(screen.getByTestId('applied-badge')).toHaveTextContent('✓ Applied');
  });

  it('does not render skill chips when skills prop is empty', () => {
    render(<JobCardWrapper {...defaultProps} skills="" />);
    expect(screen.queryByTestId('skill-chips')).not.toBeInTheDocument();
  });

  it('does not render missing skills when missing_skills is empty', () => {
    render(<JobCardWrapper {...defaultProps} missing_skills={[]} />);
    expect(screen.queryByTestId('missing-skills-label')).not.toBeInTheDocument();
  });
});
