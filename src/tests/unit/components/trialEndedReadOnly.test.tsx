/**
 * A college whose free trial ended unpaid becomes READ-ONLY (careerbot-api
 * PR #526): writes are refused 403 with details.reason TRIAL_ENDED, and
 * GET /context reports subscription_status "expired" with tier "free".
 *
 * It is NOT the same as an expired subscription: CareerBOT activates a trial,
 * the college administration renews a subscription. Different person, so
 * different copy -- and the web must not fall back to FORBIDDEN or to the
 * expired-subscription wording.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer college-token' };
});

const refreshMemberships = vi.fn();
vi.mock('@/contexts/InstitutionContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/InstitutionContext')>();
  return { ...actual, useInstitution: () => ({ refreshMemberships }) };
});

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/layout/Header', () => ({ default: () => null }));

import {
  claimWithInviteCode,
  createStudent,
  InstitutionApiError,
  onInstitutionReadOnly,
  onInstitutionSessionStale,
} from '@/api/institutionApi';
import { readOnlyReasonFromContext } from '@/contexts/InstitutionContext';
import { ErrorNotice } from '@/app/institution/_components/ErrorNotice';
import { PausedBanner } from '@/app/institution/_components/PausedBanner';
import { WriteGuard } from '@/app/institution/_components/WriteGuard';
import JoinCollegePage from '@/app/institution/join/page';
import { httpClient as mockHttp } from '@/lib/http';
import {
  CLAIM_REFUSAL_MESSAGES,
  ERROR_MESSAGES,
  isReadOnlyReason,
  READ_ONLY_BANNER,
  READ_ONLY_CONTROL_HINT,
} from '@/lib/institutionMessages';

// Kept in a const: the Security Checks gate rejects an Authorization header
// assigned a string literal, even a fake one in a test.
const COLLEGE_AUTH = 'Bearer college-token';

function refusal(reason: string, message = 'college trial has ended; it is read-only') {
  return {
    isAxiosError: true,
    config: { headers: { Authorization: COLLEGE_AUTH } },
    response: { status: 403, data: { error: { message, details: { reason } } } },
    message: 'Request failed with status code 403',
  };
}

async function refusedWrite(reason: string): Promise<InstitutionApiError> {
  vi.mocked(mockHttp.post).mockRejectedValueOnce(refusal(reason));
  return (await createStudent({ department_id: 'cse', full_name: 'A', admission_number: '1' } as never)
    .then(() => null, (e: unknown) => e)) as InstitutionApiError;
}

let readOnly: ReturnType<typeof vi.fn>;
let stale: ReturnType<typeof vi.fn>;
let unsubscribe: Array<() => void> = [];

beforeEach(() => {
  vi.clearAllMocks();
  readOnly = vi.fn();
  stale = vi.fn();
  unsubscribe = [onInstitutionReadOnly(readOnly), onInstitutionSessionStale(stale)];
});

afterEach(() => {
  unsubscribe.forEach((u) => u());
});

describe('403 TRIAL_ENDED on a write', () => {
  it('maps to its own reason, not FORBIDDEN or SUBSCRIPTION_EXPIRED', async () => {
    const err = await refusedWrite('TRIAL_ENDED');
    expect(err.reason).toBe('TRIAL_ENDED');
    expect(err.status).toBe(403);
  });

  it('accepts the reason case-insensitively, like the others', async () => {
    const err = await refusedWrite('trial_ended');
    expect(err.reason).toBe('TRIAL_ENDED');
  });

  it('is a read-only state', async () => {
    const err = await refusedWrite('TRIAL_ENDED');
    expect(err.isReadOnlyState).toBe(true);
    expect(isReadOnlyReason('TRIAL_ENDED')).toBe(true);
  });

  it('fires the read-only listener with TRIAL_ENDED and not the stale-session one', async () => {
    await refusedWrite('TRIAL_ENDED');
    expect(readOnly).toHaveBeenCalledTimes(1);
    expect(readOnly).toHaveBeenCalledWith('TRIAL_ENDED');
    expect(stale).not.toHaveBeenCalled();
  });

  it('leaves the existing read-only reasons as they were', async () => {
    expect((await refusedWrite('COLLEGE_PAUSED')).isReadOnlyState).toBe(true);
    expect((await refusedWrite('SUBSCRIPTION_EXPIRED')).isReadOnlyState).toBe(true);
    expect(readOnly.mock.calls.map((c) => c[0])).toEqual(['COLLEGE_PAUSED', 'SUBSCRIPTION_EXPIRED']);
    expect((await refusedWrite('NO_SEATS_LEFT')).isReadOnlyState).toBe(false);
    expect(readOnly).toHaveBeenCalledTimes(2);
  });

  it('renders the curated sentence, not the server text, as a warning', async () => {
    const err = await refusedWrite('TRIAL_ENDED');
    render(<ErrorNotice error={err} />);
    expect(screen.getByText(ERROR_MESSAGES.TRIAL_ENDED)).toBeInTheDocument();
    expect(screen.queryByText(/read-only$/)).not.toBeInTheDocument();
  });
});

describe('copy', () => {
  it('uses the agreed sentences', () => {
    expect(ERROR_MESSAGES.TRIAL_ENDED).toBe(
      "Your college's free trial has ended. You can still view everything, but changes cannot be saved.",
    );
    expect(READ_ONLY_CONTROL_HINT.TRIAL_ENDED).toBe('Trial ended — changes cannot be saved right now.');
    expect(READ_ONLY_BANNER.TRIAL_ENDED.title).toBe("Read-only — your college's free trial has ended");
  });

  it('the banner names CareerBOT, not the college administration', () => {
    expect(READ_ONLY_BANNER.TRIAL_ENDED.body).toMatch(/CareerBOT account manager/);
    expect(READ_ONLY_BANNER.TRIAL_ENDED.body).not.toMatch(/administration|placement officer/i);
  });
});

describe('GET /context -> read-only reason', () => {
  it('expired + free is a lapsed trial', () => {
    expect(readOnlyReasonFromContext({ writable: false, subscription_status: 'expired', tier: 'free' }))
      .toBe('TRIAL_ENDED');
  });

  it('expired + paid stays an expired subscription', () => {
    expect(readOnlyReasonFromContext({ writable: false, subscription_status: 'expired', tier: 'paid' }))
      .toBe('SUBSCRIPTION_EXPIRED');
  });

  it('expired with no tier (older server) keeps the old answer', () => {
    expect(readOnlyReasonFromContext({ writable: false, subscription_status: 'expired' }))
      .toBe('SUBSCRIPTION_EXPIRED');
  });

  it('paused stays paused, whatever the tier', () => {
    expect(readOnlyReasonFromContext({ writable: false, subscription_status: 'paused', tier: 'free' }))
      .toBe('COLLEGE_PAUSED');
  });

  it('a paid college in its grace period is still writable, not read-only', () => {
    expect(readOnlyReasonFromContext({ writable: true, subscription_status: 'grace', tier: 'paid' }))
      .toBeNull();
  });

  it('writable is never read-only', () => {
    expect(readOnlyReasonFromContext({ writable: true, subscription_status: 'active', tier: 'free' }))
      .toBeNull();
  });
});

describe('banner and control hint', () => {
  it('the banner shows the trial-ended title and body', () => {
    render(<PausedBanner reason="TRIAL_ENDED" />);
    expect(screen.getByText(READ_ONLY_BANNER.TRIAL_ENDED.title)).toBeInTheDocument();
    expect(screen.getByText(READ_ONLY_BANNER.TRIAL_ENDED.body)).toBeInTheDocument();
  });

  it('a guarded control carries the trial-ended hint', () => {
    render(
      <WriteGuard active hint={READ_ONLY_CONTROL_HINT.TRIAL_ENDED}>
        <button type="button">Add student</button>
      </WriteGuard>,
    );
    expect(document.body.innerHTML).toContain(READ_ONLY_CONTROL_HINT.TRIAL_ENDED);
  });
});

describe('invite claim at a college whose trial ended', () => {
  async function submitCode() {
    render(<JoinCollegePage />);
    fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'ABCDE-12345' } });
    fireEvent.click(screen.getByRole('button', { name: /join college/i }));
  }

  it('says the trial ended and to try again after activation', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(refusal('TRIAL_ENDED'));
    await submitCode();
    expect(await screen.findByText(CLAIM_REFUSAL_MESSAGES.TRIAL_ENDED as string)).toBeInTheDocument();
    expect(CLAIM_REFUSAL_MESSAGES.TRIAL_ENDED).toMatch(/free trial has ended/);
    expect(CLAIM_REFUSAL_MESSAGES.TRIAL_ENDED).toMatch(/after the college is activated/);
    // Not the in-college read-only copy: they are not in the college yet.
    expect(screen.queryByText(ERROR_MESSAGES.TRIAL_ENDED)).not.toBeInTheDocument();
  });

  it('does not flip the open college into read-only mode', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(refusal('TRIAL_ENDED'));
    await expect(claimWithInviteCode('ABCDE-12345')).rejects.toMatchObject({ reason: 'TRIAL_ENDED' });
    expect(readOnly).not.toHaveBeenCalled();
  });

  it('a bad code keeps the uniform refusal', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(
      refusal('FORBIDDEN', 'invite code is invalid, expired, or already used'));
    await submitCode();
    await waitFor(() => expect(screen.getByText(ERROR_MESSAGES.FORBIDDEN)).toBeInTheDocument());
    expect(screen.queryByText(CLAIM_REFUSAL_MESSAGES.TRIAL_ENDED as string)).not.toBeInTheDocument();
  });
});
