/**
 * Integration tests for the Auth API workflow.
 *
 * Uses vi.spyOn(httpClient, ...) to intercept real axios calls without MSW,
 * testing that each authApi function calls the correct endpoint and correctly
 * handles both success and error responses.
 *
 * Covers:
 *   - isAuthenticated: GETs /auth/profile, resolves true/false, optional skip-redirect header
 *   - signIn:   POSTs to /api/backend/auth/signin, returns tokens, stores tenant mapping
 *   - signUp:   POSTs to /api/backend/auth/signup, returns success, stores tenant mapping
 *   - signOut:  POSTs to /api/backend/auth/signout (fire-and-forget)
 *   - resendVerificationEmail: POSTs to /auth/email/resend
 *   - verifyEmail:             POSTs to /auth/email/verify
 *   - requestPasswordReset:    POSTs to /auth/password/reset
 *   - confirmPasswordReset:    PATCHes /auth/password/reset
 *   - refreshAccessToken:      POSTs to /api/backend/auth/refresh (via proxy), rethrows errors as Error
 *
 * Run: npx vitest run src/tests/integration/features/auth
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AxiosResponse } from 'axios';
import { httpClient } from '@/lib/http';
import {
  signIn,
  signUp,
  signOut,
  resendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  confirmPasswordReset,
  refreshAccessToken,
  isAuthenticated,
} from '@/api/authApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeResponse = <T>(data: T, status = 200): AxiosResponse<T> =>
  ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as never,
  }) as unknown as AxiosResponse<T>;

// ─── isAuthenticated ────────────────────────────────────────────────────────

describe('Auth API — isAuthenticated', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('GETs /auth/profile without a skip header by default', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(makeResponse({}));

    await isAuthenticated();

    expect(spy).toHaveBeenCalledWith('/auth/profile', undefined);
  });

  it('sends X-Skip-Login-Redirect when skipAuthRedirect is requested', async () => {
    // REGRESSION GUARD, and it used to pin the opposite header.
    //
    // A public page's probe must not bounce an anonymous visitor to login --
    // but it MUST still refresh an expired access token for a visitor who is
    // signed in. X-Skip-Login-Redirect does exactly that. X-Skip-Auth-Redirect
    // short-circuits the 401 BEFORE the refresh block (src/lib/http.ts), which
    // reported a signed-in subscriber as signed out on the pricing page.
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(makeResponse({}));

    await isAuthenticated({ skipAuthRedirect: true });

    expect(spy).toHaveBeenCalledWith('/auth/profile', {
      headers: { 'X-Skip-Login-Redirect': 'true' },
    });
  });

  it('sends X-Skip-Auth-Redirect only when skipRefresh is asked for', async () => {
    // The no-refresh-at-all case: "am I really logged out?", e.g. straight
    // after signout, where silently re-minting a token is the wrong answer.
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(makeResponse({}));

    await isAuthenticated({ skipRefresh: true });

    expect(spy).toHaveBeenCalledWith('/auth/profile', {
      headers: { 'X-Skip-Auth-Redirect': 'true' },
    });
  });

  it('resolves to true on a successful profile fetch', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(makeResponse({}));

    await expect(isAuthenticated()).resolves.toBe(true);
  });

  it('resolves to false (never rejects) on a failed profile fetch', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({ response: { status: 401 } });

    await expect(isAuthenticated({ skipAuthRedirect: true })).resolves.toBe(false);
  });
});

// ─── signIn ───────────────────────────────────────────────────────────────────

describe('Auth API — signIn', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /api/backend/auth/signin with username and password', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ access_token: 'at', refresh_token: 'rt', token_type: 'bearer' })
    );

    await signIn({ email: 'user@example.com', password: 'Secret1!' });

    expect(spy).toHaveBeenCalledWith(
      '/api/backend/auth/signin',
      expect.objectContaining({ username: 'user@example.com', password: 'Secret1!' }),
      expect.objectContaining({ baseURL: '' })
    );
  });

  it('returns access_token and refresh_token on success', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ access_token: 'my-token', refresh_token: 'my-refresh', token_type: 'bearer' })
    );

    const result = await signIn({ email: 'user@example.com', password: 'Secret1!' });

    expect(result.access_token).toBe('my-token');
    expect(result.refresh_token).toBe('my-refresh');
  });

  it('rethrows on invalid credentials (401)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 401 } });

    await expect(signIn({ email: 'bad@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ response: { status: 401 } });
  });

  it('rethrows on server error (500)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 500 } });

    await expect(signIn({ email: 'user@example.com', password: 'Secret1!' }))
      .rejects.toMatchObject({ response: { status: 500 } });
  });
});

// ─── signUp ───────────────────────────────────────────────────────────────────

describe('Auth API — signUp', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /api/backend/auth/signup with email, password, username', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Account created' })
    );

    await signUp({ email: 'new@example.com', password: 'Secret1!', username: 'newuser' });

    expect(spy).toHaveBeenCalledWith(
      '/api/backend/auth/signup',
      expect.objectContaining({ email: 'new@example.com', username: 'newuser' }),
      expect.objectContaining({ baseURL: '' })
    );
  });

  it('returns success:true on successful signup', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Account created' })
    );

    const result = await signUp({ email: 'new@example.com', password: 'Secret1!' });

    expect(result.success).toBe(true);
  });

  it('rethrows on duplicate email (409)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 409 } });

    await expect(signUp({ email: 'exists@example.com', password: 'Secret1!' }))
      .rejects.toMatchObject({ response: { status: 409 } });
  });

  it('rethrows on validation error (422)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email address' }] },
      },
    });

    await expect(signUp({ email: 'not-an-email', password: 'Secret1!' }))
      .rejects.toMatchObject({ response: { status: 422 } });
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe('Auth API — signOut', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /api/backend/auth/signout', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response);

    // signOut calls window.location.href — mock it to avoid jsdom navigation error
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    await signOut();

    expect(spy).toHaveBeenCalledWith(
      '/api/backend/auth/signout',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('does not throw even if the signout request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    await expect(signOut()).resolves.not.toThrow();
  });
});

// ─── resendVerificationEmail ──────────────────────────────────────────────────

describe('Auth API — resendVerificationEmail', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /auth/email/resend with email', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ message: 'Verification email sent' })
    );

    await resendVerificationEmail({ email: 'user@example.com' });

    expect(spy).toHaveBeenCalledWith(
      '/auth/email/resend',
      { email: 'user@example.com' },
      expect.any(Object)
    );
  });

  it('returns the message from the response', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ message: 'Verification email sent' })
    );

    const result = await resendVerificationEmail({ email: 'user@example.com' });

    expect(result.message).toBe('Verification email sent');
  });

  it('rethrows on rate limiting (429)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 429 } });

    await expect(resendVerificationEmail({ email: 'user@example.com' }))
      .rejects.toMatchObject({ response: { status: 429 } });
  });
});

// ─── verifyEmail ──────────────────────────────────────────────────────────────

describe('Auth API — verifyEmail', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /auth/email/verify with user_id and otp', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Email verified' })
    );

    await verifyEmail({ user_id: 'user-123', otp: '123456' });

    expect(spy).toHaveBeenCalledWith(
      '/auth/email/verify',
      { user_id: 'user-123', otp: '123456' },
      expect.any(Object)
    );
  });

  it('returns success:true and message on valid otp', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Email verified successfully' })
    );

    const result = await verifyEmail({ user_id: 'user-123', otp: '123456' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Email verified successfully');
  });

  it('rethrows on invalid/expired otp (400)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 400 } });

    await expect(verifyEmail({ user_id: 'user-123', otp: 'wrong' }))
      .rejects.toMatchObject({ response: { status: 400 } });
  });
});

// ─── requestPasswordReset ─────────────────────────────────────────────────────

describe('Auth API — requestPasswordReset', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /auth/password/reset with email', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ message: 'Reset email sent' })
    );

    await requestPasswordReset({ email: 'user@example.com' });

    expect(spy).toHaveBeenCalledWith(
      '/auth/password/reset',
      { email: 'user@example.com' },
      expect.any(Object)
    );
  });

  it('returns the message from the response', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ message: 'If that email exists, a reset link has been sent' })
    );

    const result = await requestPasswordReset({ email: 'user@example.com' });

    expect(result.message).toBe('If that email exists, a reset link has been sent');
  });

  it('rethrows on rate limiting (429)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 429 } });

    await expect(requestPasswordReset({ email: 'user@example.com' }))
      .rejects.toMatchObject({ response: { status: 429 } });
  });
});

// ─── confirmPasswordReset ─────────────────────────────────────────────────────

describe('Auth API — confirmPasswordReset', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PATCHes /auth/password/reset with token and new_password', async () => {
    const spy = vi.spyOn(httpClient, 'patch').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Password reset successful' })
    );

    await confirmPasswordReset({ token: 'reset-token', new_password: 'NewPass1!' });

    expect(spy).toHaveBeenCalledWith(
      '/auth/password/reset',
      { token: 'reset-token', new_password: 'NewPass1!' },
      expect.any(Object)
    );
  });

  it('returns success:true on valid reset', async () => {
    vi.spyOn(httpClient, 'patch').mockResolvedValueOnce(
      makeResponse({ success: true, message: 'Password updated' })
    );

    const result = await confirmPasswordReset({ token: 'valid-token', new_password: 'NewPass1!' });

    expect(result.success).toBe(true);
  });

  it('rethrows on expired token (400)', async () => {
    vi.spyOn(httpClient, 'patch').mockRejectedValueOnce({ response: { status: 400 } });

    await expect(confirmPasswordReset({ token: 'expired', new_password: 'NewPass1!' }))
      .rejects.toMatchObject({ response: { status: 400 } });
  });

  it('rethrows on weak password (422)', async () => {
    vi.spyOn(httpClient, 'patch').mockRejectedValueOnce({ response: { status: 422 } });

    await expect(confirmPasswordReset({ token: 'valid', new_password: 'weak' }))
      .rejects.toMatchObject({ response: { status: 422 } });
  });
});

// ─── refreshAccessToken ───────────────────────────────────────────────────────

describe('Auth API — refreshAccessToken', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /api/backend/auth/refresh via proxy', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ access_token: 'new-at', refresh_token: 'new-rt', token_type: 'bearer' })
    );

    await refreshAccessToken();

    expect(spy).toHaveBeenCalledWith(
      '/api/backend/auth/refresh',
      {},
      expect.objectContaining({ baseURL: '' })
    );
  });

  it('returns new access_token on success', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ access_token: 'refreshed-token', refresh_token: 'new-rt', token_type: 'bearer' })
    );

    const result = await refreshAccessToken();

    expect(result.access_token).toBe('refreshed-token');
  });

  it('rethrows as Error instance when refresh fails (401)', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(new Error('Token refresh failed'));

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(Error);
  });

  it('rethrows as Error with message when token is expired', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(new Error('Token expired'));

    await expect(refreshAccessToken()).rejects.toThrow('Token expired');
  });
});
