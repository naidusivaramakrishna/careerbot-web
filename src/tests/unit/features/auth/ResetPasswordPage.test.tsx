/**
 * Unit tests for ResetPasswordPage.
 *
 * Covers:
 *   No token
 *     - Shows error state when no token in URL
 *     - Shows "Reset Failed" heading
 *   Form with token
 *     - Renders password form (new-password, confirm-password, submit)
 *     - Shows "Passwords do not match" when passwords differ
 *     - Shows password strength error from validatePassword
 *     - Shows "Resetting..." while in flight
 *     - Calls confirmPasswordReset with token and password
 *     - Shows success state ("Password Reset!") after successful reset
 *     - Shows inline field error for PASSWORD_REUSE code
 *     - Shows error state ("Reset Failed") on generic API failure
 *     - Toggles new password visibility
 *     - Toggles confirm password visibility
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockConfirmPasswordReset = vi.fn();
vi.mock('@/api/authApi', () => ({
  confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
}));

const mockValidatePassword = vi.fn();
vi.mock('@/lib/passwordPolicy', () => ({
  validatePassword: (...args: unknown[]) => mockValidatePassword(...args),
}));

vi.mock('@/components/PasswordRequirements', () => ({
  PasswordRequirements: () => null,
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

import ResetPasswordPage from '@/app/reset-password/page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setWindowLocation = (search: string) => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { search, pathname: '/reset-password', href: '' },
  });
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResetPasswordPage — no token in URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWindowLocation('');
    mockValidatePassword.mockReturnValue({ valid: true, message: '' });
  });

  it('shows "Reset Failed" heading when no token in URL', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText('Reset Failed')).toBeInTheDocument();
  });

  it('shows error message about missing token', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('No reset token found');
  });
});

describe('ResetPasswordPage — form with token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWindowLocation('?token=valid-token-abc');
    mockValidatePassword.mockReturnValue({ valid: true, message: '' });
  });

  it('renders the password form when token is present', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-submit-btn')).toHaveTextContent('Reset Password');
  });

  it('shows "Passwords do not match" when passwords differ', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Different1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    });
  });

  it('shows password strength error from validatePassword', async () => {
    mockValidatePassword.mockReturnValue({ valid: false, message: 'Password must be at least 8 characters' });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters');
    });
  });

  it('shows "Resetting..." while the request is in flight', async () => {
    mockConfirmPasswordReset.mockReturnValue(new Promise(() => {}));
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    expect(await screen.findByText('Resetting...')).toBeInTheDocument();
  });

  it('calls confirmPasswordReset with the token and new password', async () => {
    mockConfirmPasswordReset.mockResolvedValue({ message: 'Password reset successfully', success: true });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith({
        token: 'valid-token-abc',
        new_password: 'Secret1!',
      });
    });
  });

  it('shows success state ("Password Reset!") after successful reset', async () => {
    mockConfirmPasswordReset.mockResolvedValue({ message: 'Password reset successfully', success: true });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(screen.getByText('Password Reset!')).toBeInTheDocument();
      expect(screen.getByTestId('goto-signin-btn')).toBeInTheDocument();
    });
  });

  it('shows inline field error for PASSWORD_REUSE error code', async () => {
    mockConfirmPasswordReset.mockRejectedValue({
      response: { data: { error: { code: 'PASSWORD_REUSE', message: 'Must be different' } } },
    });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('must be different from your current password');
    });
  });

  it('shows "Reset Failed" error state on generic API failure', async () => {
    mockConfirmPasswordReset.mockRejectedValue({
      response: { data: { error: { message: 'Token expired' } } },
    });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('reset-password-submit-btn'));
    await waitFor(() => {
      expect(screen.getByText('Reset Failed')).toBeInTheDocument();
    });
  });

  it('toggles new password field visibility', () => {
    render(<ResetPasswordPage />);
    const input = screen.getByTestId('new-password-input');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByTestId('toggle-new-password-btn'));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('toggles confirm password field visibility', () => {
    render(<ResetPasswordPage />);
    const input = screen.getByTestId('confirm-password-input');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByTestId('toggle-confirm-password-btn'));
    expect(input).toHaveAttribute('type', 'text');
  });
});
