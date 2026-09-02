/**
 * Unit tests for ResendVerificationPage.
 *
 * Covers:
 *   Rendering
 *     - Renders email input and submit button
 *     - Renders "Back to Sign In" button
 *   Validation
 *     - Shows error for empty email submission
 *     - Shows error for email without @
 *   Happy path
 *     - Shows "Sending..." while in flight
 *     - Calls resendVerificationEmail with the entered email
 *     - Shows success state ("Email Sent!") after successful send
 *     - Shows success toast
 *   Error handling
 *     - Shows mapped error message from mapAuthError on API failure
 *   Navigation
 *     - "Back to Sign In" navigates to /?showLogin=true
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockResendVerificationEmail = vi.fn();
vi.mock('@/api/authApi', () => ({
  resendVerificationEmail: (...args: unknown[]) => mockResendVerificationEmail(...args),
}));

const mockMapAuthError = vi.fn(() => 'Something went wrong');
vi.mock('@/lib/authMessages', () => ({
  mapAuthError: (...args: unknown[]) => mockMapAuthError(...args),
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

import ResendVerificationPage from '@/app/resend-verification/page';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResendVerificationPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders email input and submit button', () => {
    render(<ResendVerificationPage />);
    expect(screen.getByTestId('resend-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('resend-submit-btn')).toHaveTextContent('Resend Verification Email');
  });

  it('renders "Back to Sign In" button', () => {
    render(<ResendVerificationPage />);
    expect(screen.getByTestId('back-to-signin-btn')).toBeInTheDocument();
  });
});

describe('ResendVerificationPage — validation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows validation error for empty email submission', () => {
    render(<ResendVerificationPage />);
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
  });

  it('shows validation error for email without @', () => {
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
  });
});

describe('ResendVerificationPage — happy path', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows "Sending..." while the request is in flight', async () => {
    mockResendVerificationEmail.mockReturnValue(new Promise(() => {}));
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    expect(await screen.findByText('Sending...')).toBeInTheDocument();
  });

  it('calls resendVerificationEmail with the entered email', async () => {
    mockResendVerificationEmail.mockResolvedValue({ message: 'Verification email sent' });
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith({ email: 'user@example.com' });
    });
  });

  it('shows success state ("Email Sent!") after successful send', async () => {
    mockResendVerificationEmail.mockResolvedValue({ message: 'Verification email sent' });
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    await waitFor(() => {
      expect(screen.getByText('Email Sent!')).toBeInTheDocument();
      expect(screen.getByTestId('goto-signin-btn')).toBeInTheDocument();
    });
  });

  it('shows success toast after successful send', async () => {
    mockResendVerificationEmail.mockResolvedValue({ message: 'Verification email sent' });
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Verification email sent');
    });
  });
});

describe('ResendVerificationPage — error handling', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows mapped error message on API failure', async () => {
    mockResendVerificationEmail.mockRejectedValue(new Error('Rate limited'));
    mockMapAuthError.mockReturnValue('Too many requests. Try again later.');
    render(<ResendVerificationPage />);
    fireEvent.change(screen.getByTestId('resend-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('resend-submit-btn'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Too many requests. Try again later.');
    });
  });
});

describe('ResendVerificationPage — navigation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('"Back to Sign In" button navigates to /?showLogin=true', () => {
    render(<ResendVerificationPage />);
    fireEvent.click(screen.getByTestId('back-to-signin-btn'));
    expect(mockPush).toHaveBeenCalledWith('/?showLogin=true');
  });
});
