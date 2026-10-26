import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { DashboardSummary } from '@/types/dashboard.types';

// The dashboard's ATS step runs the real runAtsScan; only the HTTP layer underneath is mocked.
const mocks = vi.hoisted(() => ({ enhanceResume: vi.fn(), getResume: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ enhanceResume: mocks.enhanceResume }));
vi.mock('@/api/parserApi', () => ({ getResume: mocks.getResume }));
vi.mock('@/lib/tracing', () => ({ logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn() }));
vi.mock('@/lib/correlationId', () => ({ getCorrelationId: () => 'corr-1' }));
vi.mock('@/contexts/DashboardContext', () => ({ useDashboard: () => ({ refreshDashboard: vi.fn() }) }));
vi.mock('@/hooks/useResumeProfileFill', () => ({
  useResumeProfileFill: () => ({ step: 'idle', error: null, result: null, resumeId: 'r-1', fill: vi.fn(), reset: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

import DashboardContent from '@/app/(user)/dashboard/_components/FirstTimeDashboard';

// Only the fields the ATS step (step 3) reads; the rest of the page renders from these.
const data = {
  user: { id: 'u1', name: 'Asha', email: 'a@example.com' },
  plan: { plan_id: 'FREE', plan_name: 'Free', credits_total: 500, credits_remaining: 375 },
  profile: { completeness: 100, missing_fields: [] },
  recommended_step: { step_number: 3, step_name: 'ats_scan', title: 'ATS Scan', description: '', credit_cost: 3, cta_text: 'Run', cta_path: '/atslogin' },
  progress: { resume_uploaded: true, profile_completed: true, ats_scan_done: false, job_applied: false },
  usage_counts: {
    resumes_created: 0, resumes_parsed: 1, ats_scans: 0, job_matches: 0, job_applications: 0,
    assessments_taken: 0, mock_tests_taken: 0, mock_interviews_taken: 0, coding_tests_taken: 0,
  },
  best_scores: { ats_score: undefined, job_match_score: undefined, interview_score: undefined },
  recent_activity: [],
  trending_roles: [],
} as unknown as DashboardSummary;

const runScan = () => {
  render(<DashboardContent data={data} />);
  fireEvent.click(screen.getByRole('button', { name: /Run ATS scan/i }));
};

// Each test renders the whole dashboard and walks the role question: one took ~4.7s alone on the
// shared host, next to the 5s default, so these get the same 30s budget as other slow suites.
describe('dashboard ATS scan: a resume that names no role', { timeout: 30_000 }, () => {
  beforeEach(() => {
    mocks.enhanceResume.mockReset().mockResolvedValue({
      success: true, enhanced_resume_id: 'enh-1', ats_display: { score: 72, sections: [] }, enhancer_state: { resume: {} },
    });
    // A fresher's stored resume: no headline, no job, no target role.
    mocks.getResume.mockReset().mockResolvedValue({ _id: 'r-1', parsed_data: { contact: { name: 'Asha' }, headline: 'Fresher' } });
  });

  it('asks for the role and scores for the one typed', async () => {
    runScan();

    const input = await screen.findByLabelText('Target role');
    expect(screen.queryByText('Scan failed')).toBeNull();
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Software Developer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Scan my resume' }));

    expect(await screen.findByText('72')).toBeInTheDocument();
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: 'r-1', mode: 'auto', target_role: 'Software Developer' });
  });

  it('cancel closes the question without a scan; the next run asks again with an empty field', async () => {
    runScan();
    fireEvent.change(await screen.findByLabelText('Target role'), { target: { value: 'QA Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByLabelText('Target role')).toBeNull());
    expect(mocks.enhanceResume).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Run ATS scan/i }));
    expect(await screen.findByLabelText('Target role')).toHaveValue('');
  });

  it('moves focus into the role question, and back to "Run ATS scan" when it is cancelled', async () => {
    render(<DashboardContent data={data} />);
    const run = screen.getByRole('button', { name: /Run ATS scan/i });
    run.focus();
    fireEvent.click(run);

    const input = await screen.findByLabelText('Target role');
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Run ATS scan/i })).toHaveFocus());
  });

  it('asks again, keeping the typed role, when the API refuses it (target_role_required)', async () => {
    mocks.enhanceResume.mockRejectedValueOnce(Object.assign(new Error('We could not tell which role to score your resume for.'), {
      __raw: { success: false, error: { message: 'x', details: { error: 'target_role_required' } } },
    }));
    runScan();
    fireEvent.change(await screen.findByLabelText('Target role'), { target: { value: 'Software Developer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Scan my resume' }));

    await waitFor(() => expect(mocks.enhanceResume).toHaveBeenCalledTimes(1));
    expect(await screen.findByLabelText('Target role')).toHaveValue('Software Developer');
    expect(screen.queryByText('Scan failed')).toBeNull();
  });

  it('Try Again after another failure re-sends the role the user typed', async () => {
    mocks.enhanceResume.mockRejectedValueOnce(new Error('The scan service is down'));
    runScan();
    fireEvent.change(await screen.findByLabelText('Target role'), { target: { value: 'Software Developer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Scan my resume' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Try Again' }));
    expect(await screen.findByText('72')).toBeInTheDocument();
    expect(mocks.enhanceResume).toHaveBeenCalledTimes(2);
    expect(mocks.enhanceResume).toHaveBeenLastCalledWith({ resume_id: 'r-1', mode: 'auto', target_role: 'Software Developer' });
  });

  it('a resume that names its role is scored without asking (control)', async () => {
    mocks.getResume.mockResolvedValue({ _id: 'r-1', parsed_data: { contact: { name: 'Asha' }, headline: 'Data Analyst' } });
    runScan();

    expect(await screen.findByText('72')).toBeInTheDocument();
    expect(screen.queryByLabelText('Target role')).toBeNull();
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: 'r-1', mode: 'auto', target_role: 'Data Analyst' });
  });

  it('any other failure still shows the error with Try Again (control)', async () => {
    mocks.getResume.mockRejectedValue(new Error('Your session has expired.'));
    runScan();

    expect(await screen.findByText('Your session has expired.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Target role')).toBeNull();
  });
});
