/**
 * Unit tests for ForgotPasswordPage.
 *
 * Covers:
 *   Rendering
 *     - Renders email input and submit button
 *     - Renders "Back to Sign In" button
 *   Validation
 *     - Shows error for empty email
 *     - Shows error for email without @
 *   Happy path
 *     - Shows "Sending..." while in flight
 *     - Calls requestPasswordReset with the entered email
 *     - Shows success state ("Check Your Email") after request
 *     - Shows success toast
 *   Error handling
 *     - Shows mapped error message from mapAuthError on API failure
 *   Navigation
 *     - "Back to Sign In" navigates to /?showLogin=true
 *     - "Go to Sign In" on success state navigates to /?showLogin=true
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRequestPasswordReset = vi.fn();
vi.mock('@/api/authApi', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
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

import ForgotPasswordPage from '@/app/forgot-password/page';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ForgotPasswordPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('forgot-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-reset-link-btn')).toHaveTextContent('Send Reset Link');
  });

  it('renders "Back to Sign In" button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('back-to-signin-btn')).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage — validation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows validation error when submitted with empty email', () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
  });

  it('shows validation error when email has no @', () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
  });
});

describe('ForgotPasswordPage — happy path', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows "Sending..." while the request is in flight', async () => {
    mockRequestPasswordReset.mockReturnValue(new Promise(() => {}));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    expect(await screen.findByText('Sending...')).toBeInTheDocument();
  });

  it('calls requestPasswordReset with the entered email', async () => {
    mockRequestPasswordReset.mockResolvedValue({ message: 'Reset email sent' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({ email: 'user@example.com' });
    });
  });

  it('shows success state ("Check Your Email") after successful request', async () => {
    mockRequestPasswordReset.mockResolvedValue({ message: 'Reset email sent' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByTestId('goto-signin-btn')).toBeInTheDocument();
    });
  });

  it('shows success toast after successful request', async () => {
    mockRequestPasswordReset.mockResolvedValue({ message: 'Reset email sent' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Reset email sent');
    });
  });
});

describe('ForgotPasswordPage — error handling', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows mapped error message on API failure', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('Network error'));
    mockMapAuthError.mockReturnValue('Too many requests. Please try again later.');
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Too many requests. Please try again later.');
    });
  });
});

describe('ForgotPasswordPage — navigation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('"Back to Sign In" button navigates to /?showLogin=true', () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByTestId('back-to-signin-btn'));
    expect(mockPush).toHaveBeenCalledWith('/?showLogin=true');
  });

  it('"Go to Sign In" on success state navigates to /?showLogin=true', async () => {
    mockRequestPasswordReset.mockResolvedValue({ message: 'Reset email sent' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByTestId('forgot-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('send-reset-link-btn'));
    await waitFor(() => expect(screen.getByTestId('goto-signin-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('goto-signin-btn'));
    expect(mockPush).toHaveBeenCalledWith('/?showLogin=true');
  });
});
