/**
 * The "pending email verification" record (written by SignUpModal after
 * signup, rendered by VerificationRecovery on every route via ClientLayout)
 * must not outlive a session change.
 *
 * careerbot-api only issues a session to a verified account: signin raises
 * 403 EMAIL_NOT_VERIFIED after the password matches
 * (app/services/user_service/service.py:476-491, develop2). So once signIn
 * succeeds, a record left in this browser is either for the account that is
 * now verified, or for someone else's signup on a shared browser -- neither
 * should be shown to the signed-in user. Sign-out is the same hand-over point.
 *
 * The real authApi and axios instance run; only the transport is stubbed.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { AxiosError } from 'axios';
import { httpClient } from '@/lib/http';
import { signIn, signOut } from '@/api/authApi';
import { VerificationRecovery } from '@/components/VerificationRecovery';

const PENDING_KEY = 'pendingEmailVerification';
const originalAdapter = httpClient.defaults.adapter;
let signinStatus = 200;

const fakeAdapter: AxiosAdapter = async (config) => {
  const ok = signinStatus === 200;
  const response: AxiosResponse = {
    data: ok
      ? { access_token: 'a', refresh_token: 'r', token_type: 'bearer', expires_in: 1800 }
      : {
          success: false,
          error: {
            message: 'Your email address has not been verified.',
            error_code: 'HTTP_403',
            details: { error: 'EMAIL_NOT_VERIFIED', user_id: 'u-other' },
          },
        },
    status: signinStatus,
    statusText: String(signinStatus),
    headers: {},
    config,
  };
  if (ok) return response;
  throw new AxiosError(`Request failed with status code ${signinStatus}`, AxiosError.ERR_BAD_REQUEST, config, null, response);
};

const seedPending = (email = 'other@example.com') =>
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ userId: 'u-other', email, pendingVerification: true, timestamp: Date.now() }),
  );

describe('pending email verification record across sign-in / sign-out', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    signinStatus = 200;
    httpClient.defaults.adapter = fakeAdapter;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })));
  });
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it('a successful sign-in clears the record', async () => {
    seedPending();
    await signIn({ email: 'me@example.com', password: 'pw' });
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('a 403 EMAIL_NOT_VERIFIED sign-in keeps the record (the account still needs its code)', async () => {
    seedPending('me@example.com');
    signinStatus = 403;
    await expect(signIn({ email: 'me@example.com', password: 'pw' })).rejects.toBeInstanceOf(AxiosError);
    expect(localStorage.getItem(PENDING_KEY)).not.toBeNull();
  });

  it('sign-out clears the record', async () => {
    seedPending();
    await signOut();
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('an already-mounted recovery banner disappears when sign-in succeeds', async () => {
    // ClientLayout keeps VerificationRecovery mounted across client-side
    // navigation, so clearing storage alone would leave the banner on screen.
    seedPending();
    render(<VerificationRecovery />);
    expect(await screen.findByText('other@example.com')).toBeInTheDocument();

    await act(async () => {
      await signIn({ email: 'me@example.com', password: 'pw' });
    });

    expect(screen.queryByText('other@example.com')).not.toBeInTheDocument();
  });
});
