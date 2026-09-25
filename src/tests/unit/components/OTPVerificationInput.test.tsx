/**
 * OTPVerificationInput — contract tests against the careerbot-api response
 * shapes (develop2):
 *
 *   POST /auth/email/verify  200 -> {"message": "Email verified successfully"}
 *     (app/api/v1/endpoints/auth.py verify_email: `return {"message": ...}` —
 *      there is NO `success` field on the success body)
 *   POST /auth/email/verify  400 -> {"success": false, "error": {"message", "error_code",
 *      "details": {"error": "OTP_INVALID", "remaining_attempts": N}}}
 *     (app/services/user_service/service.py verify_email raises
 *      HTTPException(detail={"error", "message", "remaining_attempts"}), and
 *      app/core/exception_handler.py http_exception_handler moves every key
 *      other than message/error_code under error.details)
 *
 * The real authApi + real axios instance run; only the axios transport
 * adapter is replaced, so the AxiosError objects are the ones axios builds
 * (with `config.data` holding the serialized request body).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { inspect } from 'util';
import type { AxiosAdapter, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { httpClient } from '@/lib/http';
import OTPVerificationInput from '@/components/OTPVerificationInput';

const OTP = '482913';
const PASSWORD = 'S3cret-Passw0rd!';
const PENDING_KEY = 'pendingEmailVerification';

type Route = (config: InternalAxiosRequestConfig) => { status: number; data: unknown };

const calls: InternalAxiosRequestConfig[] = [];
let routes: Record<string, Route> = {};
const originalAdapter = httpClient.defaults.adapter;
const originalLocation = window.location;

const fakeAdapter: AxiosAdapter = async (config) => {
  calls.push(config);
  const key = Object.keys(routes).find((k) => (config.url ?? '').includes(k));
  if (!key) throw new Error(`unrouted request ${config.url}`);
  const { status, data } = routes[key](config);
  const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 200 && status < 300) return response;
  // Same construction axios' own settle() uses for a non-2xx status.
  throw new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    response,
  );
};

function typeOtp(code: string) {
  code.split('').forEach((d, i) => {
    fireEvent.change(screen.getByTestId(`otp-input-${i}`), { target: { value: d } });
  });
}

function consoleText(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls
    .map((args: unknown[]) => args.map((a) => (typeof a === 'string' ? a : inspect(a, { depth: 8 }))).join(' '))
    .join('\n');
}

describe('OTPVerificationInput (careerbot-api contract)', () => {
  let errorSpy: MockInstance<Parameters<typeof console.error>, void>;
  let logSpy: MockInstance<Parameters<typeof console.log>, void>;

  beforeEach(() => {
    calls.length = 0;
    routes = {};
    httpClient.defaults.adapter = fakeAdapter;
    localStorage.clear();
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ userId: 'u1', email: 'a@b.co', pendingVerification: true, timestamp: Date.now() }),
    );
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { href: '' } });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('treats the real 200 body {"message": ...} (no `success` field) as a successful verification', async () => {
    routes['/auth/email/verify'] = () => ({ status: 200, data: { message: 'Email verified successfully' } });
    routes['/auth/signin'] = () => ({ status: 200, data: { tenant_id: 'public' } });

    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    expect(await screen.findByText(/Email Verified!/)).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    // Request contract: POST {user_id, otp} to /auth/email/verify
    const verifyCall = calls.find((c) => c.url?.includes('/auth/email/verify'))!;
    expect(verifyCall.method).toBe('post');
    expect(JSON.parse(verifyCall.data)).toEqual({ user_id: 'u1', otp: OTP });
  });

  it('clears the pending-verification record once the backend verifies, even if auto sign-in then fails', async () => {
    routes['/auth/email/verify'] = () => ({ status: 200, data: { message: 'Email verified successfully' } });
    // e.g. SIGNUP_MODE=approval: verified but PENDING_APPROVAL -> signin refuses with 403
    routes['/auth/signin'] = () => ({ status: 403, data: { success: false, error: { message: 'Account pending approval' } } });
    const onClose = vi.fn();

    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} onClose={onClose} />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 4000 });
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
    expect(window.location.href).toBe('/?showLogin=true&verified=true');
  });

  it('does not attempt sign-in with an empty password (recovery flow) and sends the user to sign in', async () => {
    routes['/auth/email/verify'] = () => ({ status: 200, data: { message: 'Email verified successfully' } });
    routes['/auth/signin'] = () => ({ status: 401, data: {} });

    render(<OTPVerificationInput userId="u1" email="a@b.co" password="" />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    expect(await screen.findByText('Redirecting...')).toBeInTheDocument();
    await waitFor(() => expect(window.location.href).toBe('/?showLogin=true&verified=true'), { timeout: 4000 });
    expect(calls.some((c) => c.url?.includes('/auth/signin'))).toBe(false);
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('reads the OTP error code and remaining attempts from error.details (backend envelope)', async () => {
    routes['/auth/email/verify'] = () => ({
      status: 400,
      data: {
        success: false,
        error: {
          message: 'Invalid verification code',
          error_code: 'HTTP_400',
          details: { error: 'OTP_INVALID', remaining_attempts: 3 },
        },
      },
    });

    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    expect(await screen.findByText('Invalid OTP. 3 attempts remaining.')).toBeInTheDocument();
    // OTP_INVALID resets the boxes
    expect((screen.getByTestId('otp-input-0') as HTMLInputElement).value).toBe('');
  });

  it('never writes the OTP to the console when verification fails', async () => {
    routes['/auth/email/verify'] = () => ({
      status: 400,
      data: { success: false, error: { message: 'Invalid', error_code: 'HTTP_400', details: { error: 'OTP_INVALID' } } },
    });

    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(consoleText(errorSpy)).not.toContain(OTP);
  });

  it('never writes the password to the console when auto sign-in fails', async () => {
    routes['/auth/email/verify'] = () => ({ status: 200, data: { message: 'Email verified successfully' } });
    routes['/auth/signin'] = () => ({ status: 403, data: { success: false, error: { message: 'pending' } } });

    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} />);
    typeOtp(OTP);
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    await waitFor(() => expect(window.location.href).toBe('/?showLogin=true&verified=true'), { timeout: 4000 });
    expect(errorSpy).toHaveBeenCalled();
    const text = consoleText(errorSpy) + consoleText(logSpy);
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toContain(OTP);
  });

  it('starts the resend countdown at the backend cooldown (OTP_RESEND_COOLDOWN_SECONDS = 60)', () => {
    render(<OTPVerificationInput userId="u1" email="a@b.co" password={PASSWORD} />);
    expect(screen.getByTestId('resend-otp-btn')).toHaveTextContent('Resend in 01:00');
  });
});
