/**
 * /verify-email?token=... was the landing page of the link-style verification
 * emails. careerbot-api now verifies by 6-digit code only (POST verify-email
 * takes {user_id, otp}), so those tokens can no longer be redeemed, but emails
 * already sent still carry the link. The route must stay public and send the
 * user to sign-in, where an unverified account is taken to the code step
 * (SignUpModal: sign-in 403 EMAIL_NOT_VERIFIED -> OTPVerificationInput, with
 * "Resend" available immediately) instead of a 404.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe('/verify-email (legacy link landing)', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('redirects to the sign-in entry point, dropping the dead token', async () => {
    const { default: LegacyVerifyEmailPage } = await import('@/app/verify-email/page');
    LegacyVerifyEmailPage();
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith('/?showLogin=true');
  });
});
