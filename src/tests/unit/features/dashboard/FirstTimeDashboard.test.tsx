import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardContent from '@/app/(user)/dashboard/_components/FirstTimeDashboard';
import { useResumeProfileFill } from '@/hooks/useResumeProfileFill';
import type { DashboardSummary } from '@/types/dashboard.types';

// ── useDashboard ─────────────────────────────────────────────────────────────
const mockRefreshDashboard = vi.fn();
vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: mockRefreshDashboard }),
}));

// ── useResumeProfileFill ─────────────────────────────────────────────────────
vi.mock('@/hooks/useResumeProfileFill', () => ({
  useResumeProfileFill: vi.fn(),
}));
const mockUseResumeProfileFill = vi.mocked(useResumeProfileFill);

// ── sonner toast ─────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

// ── ProfileFillModal — stub avoids focus-trap errors in jsdom ─────────────────
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
      <div role="dialog" aria-label="Profile fill dialog">
        <span data-testid="modal-step">{step}</span>
        {error ? <span data-testid="modal-error">{error}</span> : null}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// ── Hook helpers ──────────────────────────────────────────────────────────────
const fill = vi.fn();
const reset = vi.fn();

const setHookState = (overrides: Partial<ReturnType<typeof useResumeProfileFill>> = {}) => {
  mockUseResumeProfileFill.mockReturnValue({
    step: 'idle',
    error: null,
    result: null,
    resumeId: null,
    fill,
    reset,
    ...overrides,
  });
};

// ── Fixture factory ───────────────────────────────────────────────────────────
const makeData = (
  overrides: Partial<{
    user: Partial<DashboardSummary['user']>;
    plan: Partial<DashboardSummary['plan']>;
    profile: Partial<DashboardSummary['profile']>;
    recommended_step: Partial<DashboardSummary['recommended_step']>;
    progress: Partial<DashboardSummary['progress']>;
    usage_counts: Partial<DashboardSummary['usage_counts']>;
    best_scores: Partial<DashboardSummary['best_scores']>;
    recent_activity: DashboardSummary['recent_activity'];
    trending_roles: DashboardSummary['trending_roles'];
  }> = {}
): DashboardSummary => {
  const base: DashboardSummary = {
    user: { id: 'u1', name: 'John Doe', email: 'john@example.com' },
    plan: { plan_id: 'FREE', plan_name: 'Free', credits_total: 500, credits_remaining: 375 },
    profile: { completeness: 45, missing_fields: ['Skills', 'Work Experience'] },
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
    best_scores: { ats_score: undefined, job_match_score: undefined, interview_score: undefined },
    recent_activity: [
      {
        id: 'a1',
        feature: 'ats_scan',
        feature_label: 'ATS Scan',
        credits_used: 3,
        timestamp: new Date(Date.now() - 60_000).toISOString(),
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
        job_count: 100,
        vacancies: 0,
      },
      {
        title: 'Product Designer',
        growth: '+12%',
        tag: 'Rising',
        tag_color: '#2557a7',
        tag_bg: '#eef3fb',
        dot: '#2557a7',
        job_count: 80,
        vacancies: 0,
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    user: { ...base.user, ...(overrides.user ?? {}) },
    plan: { ...base.plan, ...(overrides.plan ?? {}) },
    profile: { ...base.profile, ...(overrides.profile ?? {}) },
    recommended_step: { ...base.recommended_step, ...(overrides.recommended_step ?? {}) },
    progress: { ...base.progress, ...(overrides.progress ?? {}) },
    usage_counts: { ...base.usage_counts, ...(overrides.usage_counts ?? {}) },
    best_scores: { ...base.best_scores, ...(overrides.best_scores ?? {}) },
    recent_activity: overrides.recent_activity ?? base.recent_activity,
    trending_roles: overrides.trending_roles ?? base.trending_roles,
  };
};

const renderDash = (overrides?: Parameters<typeof makeData>[0]) =>
  render(<DashboardContent data={makeData(overrides)} />);

// ─────────────────────────────────────────────────────────────────────────────

describe('FirstTimeDashboard (DashboardContent)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHookState();
    vi.stubGlobal('location', { href: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Header ──────────────────────────────────────────────────────────────────

  describe('Header', () => {
    it('shows "Welcome back" greeting for a returning user', () => {
      // base fixture has 1 recent_activity item → not a new user
      renderDash();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back, John');
    });

    it('shows "Welcome" greeting for a new user with no activity, progress, or usage', () => {
      renderDash({
        recent_activity: [],
        usage_counts: {
          resumes_created: 0, resumes_parsed: 0, ats_scans: 0,
          resumes_enhanced: 0, job_matches: 0, job_applications: 0, assessments_taken: 0,
        },
      });
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Welcome, John');
      expect(h1).not.toHaveTextContent('Welcome back');
    });

    it('displays only the first word of a multi-word name', () => {
      renderDash({ user: { name: 'Ada Lovelace' } });
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Ada');
      expect(h1).not.toHaveTextContent('Lovelace');
    });

    it('renders plan name and Manage link to /payments', () => {
      renderDash({ plan: { plan_name: 'Pro' } });
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Manage' })).toHaveAttribute('href', '/payments');
    });
  });

  // ── Career readiness tracker ────────────────────────────────────────────────

  describe('Career readiness tracker', () => {
    it('renders the "Career readiness" label', () => {
      renderDash();
      expect(screen.getByText('Career readiness')).toBeInTheDocument();
    });

    it('shows 0/4 steps complete when all progress flags are false', () => {
      renderDash();
      expect(screen.getByText('0/4 steps complete')).toBeInTheDocument();
    });

    it('shows 1/4 steps complete when resume is uploaded', () => {
      renderDash({ progress: { resume_uploaded: true } });
      expect(screen.getByText('1/4 steps complete')).toBeInTheDocument();
    });

    it('shows 2/4 steps complete when resume uploaded and profile complete', () => {
      renderDash({ progress: { resume_uploaded: true, profile_completed: true } });
      expect(screen.getByText('2/4 steps complete')).toBeInTheDocument();
    });

    it('shows 4/4 steps complete when all four tracked progress flags are true', () => {
      renderDash({
        progress: {
          resume_uploaded: true,
          profile_completed: true,
          ats_scan_done: true,
          job_applied: true,
        },
      });
      expect(screen.getByText('4/4 steps complete')).toBeInTheDocument();
    });

    it('renders labels for all four journey steps', () => {
      renderDash();
      // "Upload Resume" also appears in the active h2, so use getAllByText
      for (const label of ['Upload Resume', 'Complete Profile', 'ATS Scan', 'Browse & Apply']) {
        expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ── Primary action: step 1 – Upload Resume ──────────────────────────────────

  describe('Primary action — Upload Resume (step 1)', () => {
    it('shows the Upload Resume heading and CTA button', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Upload Resume' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upload resume/i })).toBeInTheDocument();
    });

    it('hidden file input accepts .pdf, .doc, and .docx', () => {
      const { container } = renderDash();
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx');
    });

    it('clicking the CTA triggers the hidden file input', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderDash();
      fireEvent.click(screen.getByRole('button', { name: /Upload resume/i }));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it('calls fill() with the selected file', () => {
      const { container } = renderDash();
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(fill).toHaveBeenCalledWith(file);
    });

    it('does not render a meta pill for the upload step (meta is empty)', () => {
      renderDash();
      // Old "~15 seconds" pill was removed; meta="" so no pill is rendered
      expect(screen.queryByText(/seconds/i)).not.toBeInTheDocument();
    });
  });

  // ── Primary action: step 2 – Complete Profile ───────────────────────────────

  describe('Primary action — Complete Profile (step 2)', () => {
    const step2 = { progress: { resume_uploaded: true, profile_completed: false } };

    it('shows the Complete Profile heading', () => {
      renderDash({ ...step2, profile: { completeness: 55 } });
      expect(screen.getByRole('heading', { level: 2, name: 'Complete Profile' })).toBeInTheDocument();
    });

    it('shows the completeness percentage as a meta pill', () => {
      renderDash({ ...step2, profile: { completeness: 55 } });
      expect(screen.getByText('55% complete')).toBeInTheDocument();
    });

    it('links the CTA to /profile', () => {
      renderDash(step2);
      expect(screen.getByRole('link', { name: /Complete profile/i })).toHaveAttribute('href', '/profile');
    });
  });

  // ── Primary action: step 3 – ATS Scan ──────────────────────────────────────

  describe('Primary action — ATS Scan (step 3)', () => {
    const step3 = {
      progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: false },
      best_scores: { ats_score: undefined },
    };

    it('shows the ATS Scan heading and Run ATS scan button', () => {
      renderDash(step3);
      expect(screen.getByRole('heading', { level: 2, name: 'ATS Scan' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run ATS scan/i })).toBeInTheDocument();
    });

    it('navigates to /atslogin when there is no resumeId', async () => {
      setHookState({ resumeId: null });
      renderDash(step3);
      fireEvent.click(screen.getByRole('button', { name: /Run ATS scan/i }));
      await waitFor(() => expect(window.location.href).toBe('/atslogin'));
    });

    it('navigates to /atslogin/report?resume_id=... when a resumeId is available', async () => {
      setHookState({ resumeId: 'res-abc123' });
      renderDash(step3);
      fireEvent.click(screen.getByRole('button', { name: /Run ATS scan/i }));
      await waitFor(() =>
        expect(window.location.href).toBe('/atslogin/report?resume_id=res-abc123')
      );
    });
  });

  // ── Primary action: step 4 – Browse & Apply ─────────────────────────────────

  describe('Primary action — Browse & Apply (step 4)', () => {
    it('shows Browse & Apply when all prerequisite steps are done', () => {
      renderDash({ progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: true } });
      expect(screen.getByRole('heading', { level: 2, name: 'Browse & Apply' })).toBeInTheDocument();
    });

    it('links the Browse jobs CTA to /jobs', () => {
      renderDash({ progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: true } });
      // Both the primary action CTA and the OperationsTable row link to /jobs
      const links = screen.getAllByRole('link', { name: /Browse jobs/i });
      expect(links.length).toBeGreaterThanOrEqual(1);
      links.forEach((link) => expect(link).toHaveAttribute('href', '/jobs'));
    });

    it('advances to step 4 when best_scores.ats_score is non-null (optimistic override)', () => {
      // ats_scan_done is false in backend data, but existing score overrides it
      renderDash({
        progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: false },
        best_scores: { ats_score: 72 },
      });
      expect(screen.getByRole('heading', { level: 2, name: 'Browse & Apply' })).toBeInTheDocument();
    });
  });

  // ── Primary action: low credits – Upgrade Plan ──────────────────────────────

  describe('Primary action — Upgrade Plan (low credits)', () => {
    it('shows Upgrade Plan heading when credits are at 20% of total', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 20 } });
      expect(screen.getByRole('heading', { level: 2, name: 'Upgrade Plan' })).toBeInTheDocument();
    });

    it('links the Upgrade plan CTA to /payments', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 20 } });
      expect(screen.getByRole('link', { name: /Upgrade plan/i })).toHaveAttribute('href', '/payments');
    });

    it('does not show Upgrade Plan when credits are above 20%', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 21 } });
      expect(screen.queryByRole('heading', { level: 2, name: 'Upgrade Plan' })).not.toBeInTheDocument();
    });
  });

  // ── ProfileFillModal ────────────────────────────────────────────────────────

  describe('ProfileFillModal', () => {
    it('does not render the modal when step is idle', () => {
      setHookState({ step: 'idle' });
      renderDash();
      expect(screen.queryByRole('dialog', { name: 'Profile fill dialog' })).not.toBeInTheDocument();
    });

    it('renders the modal when step is parsing', () => {
      setHookState({ step: 'parsing' });
      renderDash();
      expect(screen.getByRole('dialog', { name: 'Profile fill dialog' })).toBeInTheDocument();
      expect(screen.getByTestId('modal-step')).toHaveTextContent('parsing');
    });

    it('renders the modal when step is saving', () => {
      setHookState({ step: 'saving' });
      renderDash();
      expect(screen.getByTestId('modal-step')).toHaveTextContent('saving');
    });

    it('renders the modal when step is done', () => {
      setHookState({ step: 'done' });
      renderDash();
      expect(screen.getByTestId('modal-step')).toHaveTextContent('done');
    });

    it('shows the error message inside the modal when step is error', () => {
      setHookState({ step: 'error', error: 'Parse failed' });
      renderDash();
      expect(screen.getByTestId('modal-error')).toHaveTextContent('Parse failed');
    });

    it('calls reset() when the modal Close button is clicked', () => {
      setHookState({ step: 'parsing' });
      renderDash();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  // ── Optimistic step advancement ─────────────────────────────────────────────

  describe('Optimistic step advancement after upload', () => {
    it('calls refreshDashboard when step transitions to done', async () => {
      setHookState({ step: 'idle' });
      const { rerender } = render(<DashboardContent data={makeData()} />);

      setHookState({ step: 'done' });
      rerender(<DashboardContent data={makeData()} />);

      await waitFor(() => expect(mockRefreshDashboard).toHaveBeenCalledTimes(1));
    });

    it('advances to step 2 immediately after upload completes without waiting for a backend refresh', async () => {
      // Hook says done; backend data still says resume_uploaded=false.
      // The component sets resumeJustUploaded=true → effectiveData patches resume_uploaded → step 2 shows.
      setHookState({ step: 'done' });
      renderDash({ progress: { resume_uploaded: false, profile_completed: false } });
      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 2, name: 'Complete Profile' })).toBeInTheDocument()
      );
    });
  });

  // ── Readiness details sidebar ───────────────────────────────────────────────

  describe('Readiness details', () => {
    it('shows Profile score with the completeness percentage', () => {
      renderDash({ profile: { completeness: 60 } });
      expect(screen.getByText('Profile score')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('shows "Not scanned" for ATS score when no scan has been run', () => {
      renderDash({ best_scores: { ats_score: undefined } });
      expect(screen.getByText('ATS score')).toBeInTheDocument();
      expect(screen.getAllByText('Not scanned').length).toBeGreaterThanOrEqual(1);
    });

    it('shows the numeric ATS score when a previous scan exists', () => {
      renderDash({
        progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: true },
        best_scores: { ats_score: 78 },
      });
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('shows "No match" for job match when none has been run', () => {
      renderDash({ best_scores: { job_match_score: undefined } });
      expect(screen.getByText('Job match')).toBeInTheDocument();
      expect(screen.getByText('No match')).toBeInTheDocument();
    });

    it('shows the numeric job match score when available', () => {
      renderDash({ best_scores: { job_match_score: 85 } });
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  // ── Career operations ───────────────────────────────────────────────────────

  describe('Career operations', () => {
    it('renders the Career operations heading', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Career operations' })).toBeInTheDocument();
    });

    it('renders all operation links with the correct hrefs', () => {
      renderDash();
      // Check unique names directly
      const byName: [RegExp, string][] = [
        [/Resume Builder/i, '/builder/start'],
        [/Browse Jobs/i, '/jobs'],
        [/Interview Prep/i, '/mock-interview'],
        [/Mock Test/i, '/mock-test'],
        [/Coding Practice/i, '/coding-test'],
      ];
      for (const [name, href] of byName) {
        expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
      }
      // "Job Match" link name also matches "Job Match Extension" (ExtensionsPanel), so assert by href
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.some((el) => el.getAttribute('href') === '/jobmatch')).toBe(true);
    });

    it('renders an ATS Scan link in the operations table pointing to /atslogin', () => {
      renderDash();
      const atsLinks = screen
        .getAllByRole('link')
        .filter((el) => el.getAttribute('href') === '/atslogin');
      expect(atsLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Activity ledger ─────────────────────────────────────────────────────────

  describe('Activity ledger', () => {
    it('renders the Work completed heading', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Work completed' })).toBeInTheDocument();
    });

    it('links View all to /dashboard/recent-activity', () => {
      renderDash();
      expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute(
        'href',
        '/dashboard/recent-activity'
      );
    });

    it('shows the empty state when there is no recent activity', () => {
      renderDash({ recent_activity: [] });
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });

    it('renders activity items from the data', () => {
      renderDash({
        recent_activity: [
          {
            id: 'a1',
            feature: 'ats_scan',
            feature_label: 'ATS Scan Result',
            credits_used: 3,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'a2',
            feature: 'resume_parse',
            feature_label: 'Resume Parsed',
            credits_used: 2,
            timestamp: new Date().toISOString(),
          },
        ],
      });
      expect(screen.getByText('ATS Scan Result')).toBeInTheDocument();
      expect(screen.getByText('Resume Parsed')).toBeInTheDocument();
    });

    it('renders at most 4 activity items', () => {
      renderDash({
        recent_activity: [1, 2, 3, 4, 5, 6].map((n) => ({
          id: `a${n}`,
          feature: 'ats_scan',
          feature_label: `Activity ${n}`,
          credits_used: n,
          timestamp: new Date().toISOString(),
        })),
      });
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 4')).toBeInTheDocument();
      expect(screen.queryByText('Activity 5')).not.toBeInTheDocument();
      expect(screen.queryByText('Activity 6')).not.toBeInTheDocument();
    });
  });

  // ── Plan usage ──────────────────────────────────────────────────────────────

  describe('Plan usage (Credits)', () => {
    it('renders the Credits heading', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Credits' })).toBeInTheDocument();
    });

    it('shows credits used and remaining', () => {
      renderDash({ plan: { credits_total: 500, credits_remaining: 375 } });
      // creditsUsed = 500 - 375 = 125
      expect(screen.getByText('125 used, 375 remaining')).toBeInTheDocument();
    });

    it('clamps credits used to zero when remaining exceeds total', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 150 } });
      expect(screen.getByText('0 used, 150 remaining')).toBeInTheDocument();
    });
  });

  // ── UpgradeNote ─────────────────────────────────────────────────────────────

  describe('UpgradeNote', () => {
    it('shows "Credits are running low" when credits are at or below 20% of total', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 20 } });
      expect(screen.getByText('Credits are running low')).toBeInTheDocument();
    });

    it('links the Manage plan button in UpgradeNote to /payments', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 10 } });
      expect(screen.getByRole('link', { name: /Manage plan/i })).toHaveAttribute('href', '/payments');
    });

    it('does not show the upgrade note when credits are above 20%', () => {
      renderDash({ plan: { credits_total: 100, credits_remaining: 21 } });
      expect(screen.queryByText('Credits are running low')).not.toBeInTheDocument();
    });
  });

  // ── Trending roles ──────────────────────────────────────────────────────────

  describe('TrendsPanel', () => {
    it('renders the Trending roles heading', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Trending roles' })).toBeInTheDocument();
    });

    it('shows roles and growth rates from the data', () => {
      renderDash();
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('+24%')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
    });

    it('falls back to built-in roles when trending_roles is empty', () => {
      renderDash({ trending_roles: [] });
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    });

    it('renders at most 3 roles', () => {
      renderDash({
        trending_roles: [
          { title: 'Role A', growth: '+5%', tag: '', tag_color: '', tag_bg: '', dot: '', vacancies: 0 },
          { title: 'Role B', growth: '+4%', tag: '', tag_color: '', tag_bg: '', dot: '', vacancies: 0 },
          { title: 'Role C', growth: '+3%', tag: '', tag_color: '', tag_bg: '', dot: '', vacancies: 0 },
          { title: 'Role D', growth: '+2%', tag: '', tag_color: '', tag_bg: '', dot: '', vacancies: 0 },
        ],
      });
      expect(screen.getByText('Role A')).toBeInTheDocument();
      expect(screen.getByText('Role C')).toBeInTheDocument();
      expect(screen.queryByText('Role D')).not.toBeInTheDocument();
    });
  });

  // ── Profile gaps ────────────────────────────────────────────────────────────

  describe('ProfileGaps', () => {
    it('renders the Profile gaps heading', () => {
      renderDash();
      expect(screen.getByRole('heading', { level: 2, name: 'Profile gaps' })).toBeInTheDocument();
    });

    it('shows each missing field from the data', () => {
      renderDash({ profile: { completeness: 45, missing_fields: ['Skills', 'Work Experience'] } });
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
    });

    it('renders the Fix link pointing to /profile', () => {
      renderDash();
      expect(screen.getByRole('link', { name: 'Fix' })).toHaveAttribute('href', '/profile');
    });

    it('shows "No critical gaps" when missing_fields is empty', () => {
      renderDash({ profile: { completeness: 100, missing_fields: [] } });
      expect(screen.getByText('No critical gaps')).toBeInTheDocument();
    });

    it('renders at most 8 missing fields', () => {
      const missing_fields = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9'];
      renderDash({ profile: { completeness: 0, missing_fields } });
      expect(screen.getByText('F8')).toBeInTheDocument();
      expect(screen.queryByText('F9')).not.toBeInTheDocument();
    });
  });
});
