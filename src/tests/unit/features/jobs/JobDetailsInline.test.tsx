import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockRecordJobApplication = vi.fn();

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/utils/jobTracking', () => ({
  isJobSaved: vi.fn(() => false),
  toggleJobSaved: vi.fn(() => true),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordJobApplication: (...args: any[]) => mockRecordJobApplication(...args),
}));

vi.mock('@/utils/jobApplication', () => ({ applyToJob: vi.fn() }));
vi.mock('@/hooks/useCurrentUserId', () => ({ useCurrentUserId: () => ({ userId: 'test-user' }) }));
vi.mock('@/api/insightsApi', () => ({ getMatchExplanation: vi.fn(() => new Promise(() => {})) }));

import JobDetailsInline from '@/app/(jobs)/jobslogin/_components/JobDetailsInline';
import type { NormalizedJob } from '@/app/(jobs)/jobslogin/_components/JobsContents';

const externalJob: NormalizedJob = {
  id: 'job-ext-1',
  title: 'Frontend Engineer',
  company: 'Acme',
  location: 'Remote',
  logo: '',
  type: 'Full-time',
  mode: 'Remote',
  salary: '',
  time: '',
  url: 'https://careers.example.com/job/1',
  application_url: '',
  recruiter_id: '',
  matchScore: 0,
  matchText: '',
  roleTrending: false,
  highHiring: false,
  description: 'Build UIs.',
  created_at: null,
  posted_date: null,
  company_website: '',
  skills: 'React',
  experience: '',
  experience_level: '',
  education: '',
  source: 'Acme Careers',
  is_applied: false,
  remote: true,
  requirements: [],
  responsibilities: '',
};

describe('JobDetailsInline — external Apply Now', () => {
  beforeEach(() => {
    mockRecordJobApplication.mockClear();
  });

  // Regression: the inline panel used to call recordJobApplication (and flip
  // to "Applied") the moment the external link was clicked, before the
  // "Did you apply?" confirmation. "No, I didn't apply" only clears the
  // pending prompt, so the phantom record stayed in the Applied history.
  // JobCard's external path only calls onApplyClick; the record is written by
  // JobsContents.handleConfirmApplied when the user answers "Yes".
  it('defers recording to the "Did you apply?" confirmation, like JobCard', () => {
    const onApplyClick = vi.fn();
    render(<JobDetailsInline job={externalJob} onBack={vi.fn()} onApplyClick={onApplyClick} />);

    const applyLink = screen.getByRole('link', { name: /apply now/i });
    // jsdom does not implement navigation; stop the default so the test only
    // exercises the React onClick handler.
    applyLink.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(applyLink);

    expect(onApplyClick).toHaveBeenCalledTimes(1);
    expect(mockRecordJobApplication).not.toHaveBeenCalled();
    // Still offers the external link (not flipped to a disabled "Applied" button).
    expect(screen.getByRole('link', { name: /apply now/i })).toBeInTheDocument();
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();
  });

  // After "Yes, I applied!", JobsContents re-passes the open job with
  // is_applied: true; the panel must switch to its Applied state.
  it('shows Applied once the parent marks the job is_applied', () => {
    const { rerender } = render(<JobDetailsInline job={externalJob} onBack={vi.fn()} />);
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();

    rerender(<JobDetailsInline job={{ ...externalJob, is_applied: true }} onBack={vi.fn()} />);

    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /apply now/i })).not.toBeInTheDocument();
  });
});
