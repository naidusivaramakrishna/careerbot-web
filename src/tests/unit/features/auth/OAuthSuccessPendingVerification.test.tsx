/**
 * An OAuth sign-in is a session hand-over, the same as a password sign-in:
 * lib/pendingVerification.ts says the unverified-signup record must be
 * cleared whenever a session is handed over. authApi.signIn/signOut do that;
 * the Google and LinkedIn success pages (where the backend's OAuth callback
 * lands with the session already set as httpOnly cookies) must do it too.
 *
 * Without it: sign up with email, close the OTP modal, then "Continue with
 * Google" -> the signed-in user keeps seeing "Resume Email Verification" on
 * every route (ClientLayout mounts VerificationRecovery) for up to 24h.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
// One router object, as Next's useRouter returns: the Google/LinkedIn pages
// list `router` as an effect dependency, and a fresh object per render would
// re-run the effect's cleanup (cancelled = true) mid-flow.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}));

const mockIsAuthenticated = vi.fn<[], Promise<boolean>>();
vi.mock('@/api/authApi', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  verifyEmail: vi.fn(),
  signIn: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/authRedirect', () => ({
  getStoredAuthRedirect: () => '/dashboard',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

import GoogleOAuthSuccess from '@/app/auth/google/success/page';
import LinkedInOAuthSuccess from '@/app/auth/linkedin/success/page';
import { OAuthSuccessPage } from '@/components/auth/OAuthSuccessPage';
import { VerificationRecovery } from '@/components/VerificationRecovery';

const PENDING_KEY = 'pendingEmailVerification';

const seedPending = () =>
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ userId: 'u-1', email: 'me@example.com', pendingVerification: true, timestamp: Date.now() }),
  );

const providers: Array<[string, () => React.ReactElement]> = [
  ['Google (/auth/google/success)', () => <GoogleOAuthSuccess />],
  ['LinkedIn (/auth/linkedin/success)', () => <LinkedInOAuthSuccess />],
  ['OAuthSuccessPage component', () => <OAuthSuccessPage provider="LinkedIn" />],
];

describe.each(providers)('%s: pending email verification record', (_name, renderPage) => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the record and hides a mounted banner once the OAuth session is verified', async () => {
    seedPending();
    mockIsAuthenticated.mockResolvedValue(true);

    // The banner is already mounted (ClientLayout keeps it across navigation).
    render(
      <>
        <VerificationRecovery />
        {renderPage()}
      </>,
    );
    expect(screen.getByText(/Resume Email Verification/i)).toBeInTheDocument();

    await waitFor(() => expect(localStorage.getItem(PENDING_KEY)).toBeNull());
    await waitFor(() => expect(screen.queryByText(/Resume Email Verification/i)).not.toBeInTheDocument());
  });

  it('keeps the record when the OAuth session could not be verified (no session was handed over)', async () => {
    seedPending();
    mockIsAuthenticated.mockResolvedValue(false);

    render(renderPage());

    await waitFor(() => expect(mockIsAuthenticated).toHaveBeenCalled());
    // Let the rejected-session branch run.
    await new Promise((r) => setTimeout(r, 0));
    expect(localStorage.getItem(PENDING_KEY)).not.toBeNull();
  });
});
