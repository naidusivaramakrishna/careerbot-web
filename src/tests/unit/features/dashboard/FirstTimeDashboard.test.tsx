import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FirstTimeDashboard from '@/app/(user)/dashboard/_components/FirstTimeDashboard';
import { useResumeProfileFill } from '@/hooks/useResumeProfileFill';
import { enhanceResume } from '@/api/enhancerApi';
import { toast } from 'sonner';
import type { DashboardSummary } from '@/types/dashboard.types';

vi.mock('@/hooks/useResumeProfileFill', () => ({
  useResumeProfileFill: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  enhanceResume: vi.fn(),
}));

vi.mock('@/app/(user)/dashboard/_components/ProfileFillModal', () => ({
  default: ({
    isOpen,
    step,
    error,
    onClose,
  }: {
    isOpen: boolean;
    step: string;
    error?: string | null;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Profile fill modal">
        <p>Modal step: {step}</p>
        {error ? <p>{error}</p> : null}
        <button onClick={onClose}>Close modal</button>
      </div>
    ) : null,
}));

const mockUseResumeProfileFill = vi.mocked(useResumeProfileFill);
const mockEnhanceResume = vi.mocked(enhanceResume);
const mockToast = vi.mocked(toast);

const fill = vi.fn();
const reset = vi.fn();

type DashboardSummaryOverrides = Omit<
  Partial<DashboardSummary>,
  | 'user'
  | 'plan'
  | 'profile'
  | 'recommended_step'
  | 'progress'
  | 'usage_counts'
  | 'best_scores'
  | 'recent_activity'
  | 'trending_roles'
> & {
  user?: Partial<DashboardSummary['user']>;
  plan?: Partial<DashboardSummary['plan']>;
  profile?: Partial<DashboardSummary['profile']>;
  recommended_step?: Partial<DashboardSummary['recommended_step']>;
  progress?: Partial<DashboardSummary['progress']>;
  usage_counts?: Partial<DashboardSummary['usage_counts']>;
  best_scores?: Partial<DashboardSummary['best_scores']>;
  recent_activity?: Array<DashboardSummary['recent_activity'][number] & { type?: string }>;
  trending_roles?: DashboardSummary['trending_roles'];
};

const createDashboardSummary = (
  overrides: DashboardSummaryOverrides = {}
): DashboardSummary => {
  const base: DashboardSummary = {
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    plan: {
      plan_id: 'premium',
      plan_name: 'Premium',
      credits_total: 500,
      credits_remaining: 375,
    },
    profile: {
      completeness: 45,
      missing_fields: ['skills'],
    },
    recommended_step: {
      step_number: 1,
      step_name: 'upload_resume',
      title: 'Upload Resume',
      description: 'Upload a resume',
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
    recent_activity: [
      {
        id: 'activity-1',
        feature: 'ats_scan',
        feature_label: 'ATS Scan',
        credits_used: 3,
        timestamp: new Date(Date.now() - 60_000).toISOString(),
      },
      {
        id: 'activity-2',
        feature: 'resume_parse',
        feature_label: 'Resume Parsed',
        credits_used: 0,
        timestamp: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ],
    trending_roles: [
      {
        title: 'Frontend Engineer',
        growth: '+24%',
        tag: 'Hot',
        tag_color: '#2557a7',
        tag_bg: '#eef3fb',
        dot: '#2557a7',
      },
      {
        title: 'Product Designer',
        growth: '+12%',
        tag: 'Rising',
        tag_color: '#2557a7',
        tag_bg: '#eef3fb',
        dot: '#2557a7',
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    user: { ...base.user, ...overrides.user },
    plan: { ...base.plan, ...overrides.plan },
    profile: { ...base.profile, ...overrides.profile },
    recommended_step: { ...base.recommended_step, ...overrides.recommended_step },
    progress: { ...base.progress, ...overrides.progress },
    usage_counts: { ...base.usage_counts, ...overrides.usage_counts },
    best_scores: { ...base.best_scores, ...overrides.best_scores },
    recent_activity: overrides.recent_activity ?? base.recent_activity,
    trending_roles: overrides.trending_roles ?? base.trending_roles,
  };
};

const renderDashboard = (overrides: DashboardSummaryOverrides = {}) =>
  render(<FirstTimeDashboard data={createDashboardSummary(overrides)} />);

const setProfileFillState = (
  state: Partial<ReturnType<typeof useResumeProfileFill>> = {}
) => {
  mockUseResumeProfileFill.mockReturnValue({
    step: 'idle',
    error: null,
    result: null,
    resumeId: null,
    fill,
    reset,
    ...state,
  });
};

describe('FirstTimeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProfileFillState();
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
  });

  it('renders the real dashboard shell with user, credits, tools, activity, trends, and upgrade CTA', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /Welcome back,\s*John/i })).toBeInTheDocument();
    expect(screen.getAllByText('375').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('premium plan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Career Tools' })).toBeInTheDocument();
    expect(screen.getAllByText('ATS Scan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Resume Builder')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getAllByText('ATS Scan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Unlock unlimited access')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Upgrade to Pro/i })).toHaveAttribute('href', '/payments');
  });

  it('uses only the first word from a multi-word name in the header', () => {
    renderDashboard({ user: { name: 'Ada Lovelace' } });

    expect(screen.getByRole('heading', { name: /Welcome back,\s*Ada/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Lovelace/i })).not.toBeInTheDocument();
  });

  it('shows step 1 upload resume when no resume exists', () => {
    renderDashboard({
      profile: { completeness: 20 },
      usage_counts: { resumes_created: 0, resumes_parsed: 0, ats_scans: 0 },
    });

    expect(screen.getByRole('heading', { name: 'Upload Your Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Resume/i })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByText('80% remaining')).toBeInTheDocument();
    expect(screen.getByText('5 credits')).toBeInTheDocument();
  });

  it('opens the hidden file picker from the upload CTA and passes selected files to profile fill', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { container } = renderDashboard();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });

    expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx');

    fireEvent.click(screen.getByRole('button', { name: /Upload Resume/i }));
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(fill).toHaveBeenCalledWith(file);
    expect(fileInput.value).toBe('');
  });

  it('renders the profile fill modal for active parsing, saving, done, and error states', () => {
    setProfileFillState({ step: 'parsing' });
    const { rerender } = render(<FirstTimeDashboard data={createDashboardSummary()} />);
    expect(screen.getByRole('dialog', { name: 'Profile fill modal' })).toHaveTextContent('Modal step: parsing');

    setProfileFillState({ step: 'saving' });
    rerender(<FirstTimeDashboard data={createDashboardSummary()} />);
    expect(screen.getByRole('dialog', { name: 'Profile fill modal' })).toHaveTextContent('Modal step: saving');

    setProfileFillState({ step: 'done' });
    rerender(<FirstTimeDashboard data={createDashboardSummary()} />);
    expect(screen.getByRole('dialog', { name: 'Profile fill modal' })).toHaveTextContent('Modal step: done');

    setProfileFillState({ step: 'error', error: 'Parse failed' });
    rerender(<FirstTimeDashboard data={createDashboardSummary()} />);
    expect(screen.getByText('Parse failed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('treats a completed profile fill as having a resume and advances to complete profile', () => {
    setProfileFillState({ step: 'done' });
    renderDashboard({
      profile: { completeness: 79 },
      usage_counts: { resumes_created: 0, resumes_parsed: 0, ats_scans: 0 },
    });

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Complete Profile/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('21% remaining')).toBeInTheDocument();
  });

  it('keeps profile completeness 79 in step 2 and moves 80 to ATS scan step', () => {
    const resumeUsage = { resumes_parsed: 1, resumes_created: 0, ats_scans: 0 };
    const { rerender } = render(
      <FirstTimeDashboard
        data={createDashboardSummary({
          profile: { completeness: 79 },
          usage_counts: resumeUsage,
        })}
      />
    );

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument();

    rerender(
      <FirstTimeDashboard
        data={createDashboardSummary({
          profile: { completeness: 80 },
          usage_counts: resumeUsage,
        })}
      />
    );

    expect(screen.getByRole('heading', { name: 'Check Your ATS Score' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan Resume/i })).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('Not yet scanned')).toBeInTheDocument();
  });

  it('shows browse jobs step after resume, completed profile, and at least one ATS scan', () => {
    renderDashboard({
      profile: { completeness: 100 },
      usage_counts: { resumes_parsed: 1, ats_scans: 1 },
    });

    expect(screen.getByRole('heading', { name: 'Browse & Apply to Jobs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Jobs/i })).toHaveAttribute('href', '/jobs');
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('shows the right profile score helper text at 49, 50, 74, and 75 percent', () => {
    const { rerender } = render(
      <FirstTimeDashboard data={createDashboardSummary({ profile: { completeness: 49 } })} />
    );
    expect(screen.getByText('In progress')).toBeInTheDocument();

    rerender(<FirstTimeDashboard data={createDashboardSummary({ profile: { completeness: 50 } })} />);
    expect(screen.getByText('Good progress')).toBeInTheDocument();

    rerender(<FirstTimeDashboard data={createDashboardSummary({ profile: { completeness: 74 } })} />);
    expect(screen.getByText('Good progress')).toBeInTheDocument();

    rerender(<FirstTimeDashboard data={createDashboardSummary({ profile: { completeness: 75 } })} />);
    expect(screen.getByText('Almost complete')).toBeInTheDocument();
  });

  it('calculates credit stats, total usage, remaining credits, and feature usage rows', () => {
    renderDashboard({
      plan: { credits_total: 500, credits_remaining: 375 },
      usage_counts: {
        resumes_created: 2,
        resumes_parsed: 3,
        job_matches: 4,
        job_applications: 6,
        assessments_taken: 7,
        ats_scans: 8,
      },
    });

    expect(screen.getByText('75% of total plan')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('of 500 used')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('375 credits')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getAllByText('Jobs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('ATS Scans')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('handles zero credit totals without division errors', () => {
    renderDashboard({
      plan: { credits_total: 0, credits_remaining: 0 },
    });

    expect(screen.getByText('0% of total plan')).toBeInTheDocument();
    expect(screen.getByText('of 0 used')).toBeInTheDocument();
    expect(screen.getByText('0 credits')).toBeInTheDocument();
  });

  it('does not display negative credits used when remaining credits exceed the total', () => {
    renderDashboard({
      plan: { credits_total: 100, credits_remaining: 150 },
    });

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('of 100 used')).toBeInTheDocument();
    expect(screen.getByText('150% of total plan')).toBeInTheDocument();
  });

  it('renders activity empty state when there is no recent activity', () => {
    renderDashboard({ recent_activity: [] });

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Use any career tool to get started')).toBeInTheDocument();
    expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
  });

  it('limits visible activity to six items and hides zero-credit badges', () => {
    const recent_activity = Array.from({ length: 8 }, (_, index) => ({
      id: `activity-${index}`,
      feature: index === 0 ? 'unknown' : 'ats_scan',
      type: index === 0 ? 'unknown' : 'ats_scan',
      feature_label: `Activity ${index + 1}`,
      credits_used: index === 1 ? 0 : index + 1,
      timestamp: new Date(Date.now() - index * 60_000).toISOString(),
    }));

    renderDashboard({ recent_activity });

    expect(screen.getByText('Showing 6 of 8')).toBeInTheDocument();
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 6')).toBeInTheDocument();
    expect(screen.queryByText('Activity 7')).not.toBeInTheDocument();
    expect(screen.queryByText('0cr')).not.toBeInTheDocument();
    expect(screen.getByText('1cr')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Full history/i })).toHaveAttribute(
      'href',
      '/dashboard/recent-activity'
    );
  });

  it('renders job trends when present and gracefully handles an empty trends list', () => {
    const { rerender } = render(<FirstTimeDashboard data={createDashboardSummary()} />);

    expect(screen.getByText('Job Trends')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('+24%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore all jobs/i })).toHaveAttribute('href', '/jobs');

    rerender(<FirstTimeDashboard data={createDashboardSummary({ trending_roles: [] })} />);
    expect(screen.getByText('Job Trends')).toBeInTheDocument();
    expect(screen.queryByText('Frontend Engineer')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore all jobs/i })).toBeInTheDocument();
  });

  it('shows a toast if ATS scan is requested without a resume id in hook state or localStorage', () => {
    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    expect(mockToast.error).toHaveBeenCalledWith('Please upload your resume first.');
    expect(mockEnhanceResume).not.toHaveBeenCalled();
  });

  it('runs an ATS scan using hook resume id, persists score data, and opens a positive score popup', async () => {
    setProfileFillState({ resumeId: 'resume-hook-id' });
    mockEnhanceResume.mockResolvedValue({
      enhancer_state: {
        ats_breakdown: {
          FinalScore: 72,
          keyword_match: 80,
        },
      },
    } as never);

    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    expect(await screen.findByText('ATS Score Report')).toBeInTheDocument();
    expect(mockEnhanceResume).toHaveBeenCalledWith({ resume_id: 'resume-hook-id' });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('currentScore', '72');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('isImageBased', 'false');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'atsAnalysisData',
      expect.stringContaining('"resume_id":"resume-hook-id"')
    );
    expect(screen.getAllByText('ATS-Friendly').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Your resume is well-optimized for ATS screening systems.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('ATS Score Report')).not.toBeInTheDocument();
    });
  });

  it('falls back to localStorage resume id and supports alternate ATS score fields', async () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('stored-resume-id');
    mockEnhanceResume.mockResolvedValue({
      enhancer_state: {
        ats_breakdown: {
          percentage: 45,
        },
      },
    } as never);

    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    expect(await screen.findByText('Needs Improvement')).toBeInTheDocument();
    expect(mockEnhanceResume).toHaveBeenCalledWith({ resume_id: 'stored-resume-id' });
    expect(screen.getByText('A few targeted tweaks will significantly improve your score.')).toBeInTheDocument();
    expect(screen.getByText('Needs work')).toBeInTheDocument();
  });

  it('shows poor score messaging for low ATS scores and clamps popup scores above 100', async () => {
    setProfileFillState({ resumeId: 'resume-id' });
    mockEnhanceResume.mockResolvedValueOnce({
      enhancer_state: { ats_breakdown: { score: 39 } },
    } as never);

    const { rerender } = render(
      <FirstTimeDashboard
        data={createDashboardSummary({
          profile: { completeness: 90 },
          usage_counts: { resumes_parsed: 1, ats_scans: 0 },
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));
    expect(await screen.findByText('Poor Match')).toBeInTheDocument();
    expect(screen.getByText('Your resume needs optimization to pass ATS filters effectively.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    mockEnhanceResume.mockResolvedValueOnce({
      enhancer_state: { ats_breakdown: { TotalScore: 140 } },
    } as never);
    rerender(
      <FirstTimeDashboard
        data={createDashboardSummary({
          profile: { completeness: 90 },
          usage_counts: { resumes_parsed: 1, ats_scans: 0 },
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));
    expect(await screen.findByText('100')).toBeInTheDocument();
    expect(screen.getAllByText('ATS-Friendly').length).toBeGreaterThanOrEqual(1);
  });

  it('disables the scan button while the ATS request is in flight', async () => {
    setProfileFillState({ resumeId: 'resume-id' });
    let resolveScan: (value: unknown) => void = () => undefined;
    mockEnhanceResume.mockReturnValue(
      new Promise((resolve) => {
        resolveScan = resolve;
      }) as never
    );

    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    const processingButton = await screen.findByRole('button', { name: /Processing/i });
    expect(processingButton).toBeDisabled();

    resolveScan({ enhancer_state: { ats_breakdown: { FinalScore: 71 } } });
    expect(await screen.findByText('ATS Score Report')).toBeInTheDocument();
  });

  it('shows an error toast and clears loading state when ATS scan fails', async () => {
    setProfileFillState({ resumeId: 'resume-id' });
    mockEnhanceResume.mockRejectedValue(new Error('ATS service unavailable'));

    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('ATS service unavailable');
    });
    expect(screen.queryByText('ATS Score Report')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan Resume/i })).not.toBeDisabled();
  });

  it('uses the generic ATS error toast for non-Error rejections', async () => {
    setProfileFillState({ resumeId: 'resume-id' });
    mockEnhanceResume.mockRejectedValue('bad response');

    renderDashboard({
      profile: { completeness: 90 },
      usage_counts: { resumes_parsed: 1, ats_scans: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Scan Resume/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('ATS scan failed.');
    });
  });

  it('renders all career tool links with expected destinations', () => {
    renderDashboard();

    const tools = [
      ['ATS Scan', '/atslogin'],
      ['Resume Builder', '/builder/start'],
      ['Jobs', '/jobs'],
      ['Job Match', '/jobmatch'],
      ['AI Enhance', '/enhancer'],
      ['Interview Prep', '/communication'],
    ];

    for (const [title] of tools) {
      expect(screen.getAllByText(title).length).toBeGreaterThanOrEqual(1);
    }

    const getStartedLinks = screen.getAllByRole('link', { name: /Get started/i });
    expect(getStartedLinks.map((link) => link.getAttribute('href'))).toEqual(
      tools.map(([, href]) => href)
    );
  });
});
