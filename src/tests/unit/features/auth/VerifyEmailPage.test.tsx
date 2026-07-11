/**
 * Unit tests for VerifyEmailPage.
 *
 * Token is controlled via a module-level variable captured in the mock closure.
 * This avoids importing next/navigation directly (which loads the full Next.js
 * module graph and causes OOM in the test worker).
 *
 * Covers:
 *   No token
 *     - Shows "Verification Failed" heading when no token in URL
 *     - Shows error message about missing token
 *     - "Back to Sign In" navigates to /?showLogin=true
 *   With token
 *     - Shows loading state while verifying
 *     - Calls verifyEmail on mount with the token
 *     - Shows success state ("Email Verified!") after successful verification
 *     - Shows success toast
 *     - Treats "already verified" error as success
 *     - Shows error state ("Verification Failed") on failed verification
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Token state for useSearchParams mock ─────────────────────────────────────
// Closure variable — set per-test before rendering
let currentToken: string | null = null;

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
// IMPORTANT: VerifyEmailPage puts `router` in a useEffect dependency array.
// Returning a new object on every call would cause an infinite re-render loop
// inside act() because React sees a changed reference on every render cycle.
// Using a single stable object breaks that loop.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({ get: (_key: string) => currentToken }),
}));

const mockVerifyEmail = vi.fn();
vi.mock('@/api/authApi', () => ({
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
}));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

// ─── Component under test ─────────────────────────────────────────────────────

import VerifyEmailPage from '@/app/verify-email/page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockWindowLocation = () => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { href: '', pathname: '/verify-email' },
  });
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VerifyEmailPage — no token in URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentToken = null;
    mockWindowLocation();
  });

  it('shows "Verification Failed" heading when no token in URL', async () => {
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });
  });

  it('shows error message about missing token', async () => {
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No verification token found');
    });
  });

  it('"Back to Sign In" navigates to /?showLogin=true', async () => {
    render(<VerifyEmailPage />);
    await waitFor(() => expect(screen.getByTestId('back-to-signin-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('back-to-signin-btn'));
    expect(mockPush).toHaveBeenCalledWith('/?showLogin=true');
  });
});

describe('VerifyEmailPage — with token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentToken = 'verify-token-abc';
    mockWindowLocation();
  });

  it('shows loading state while verifying', async () => {
    mockVerifyEmail.mockReturnValue(new Promise(() => {}));
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText('Verifying Email')).toBeInTheDocument();
    });
  });

  it('calls verifyEmail on mount with the token', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verified successfully' });
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({ token: 'verify-token-abc' });
    });
  });

  it('shows success state ("Email Verified!") after successful verification', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verified successfully' });
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
    });
  });

  it('shows success toast after successful verification', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verified successfully' });
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Email verified successfully');
    });
  });

  it('treats "already verified" error as success', async () => {
    mockVerifyEmail.mockRejectedValue({
      response: { data: { error: { message: 'Email is already verified' } } },
    });
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
    });
  });

  it('shows "Verification Failed" state on failed verification', async () => {
    mockVerifyEmail.mockRejectedValue({
      response: { data: { error: { message: 'Token has expired' } } },
    });
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Token has expired');
    });
  });
});
