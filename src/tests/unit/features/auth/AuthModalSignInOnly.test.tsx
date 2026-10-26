/**
 * The college front door's sign-in: no "Sign up", no social buttons, and
 * Forgot password keeps the way back to the college door. Default mode is
 * unchanged.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('@/api/authApi', () => ({
  signUp: vi.fn(), signIn: vi.fn(), verifyEmail: vi.fn(), resendVerificationEmail: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() } }));
vi.mock('@/lib/authRedirect', () => ({ sanitizeAuthRedirect: (r: string | undefined) => r || '/dashboard' }));
vi.mock('@/components/SocialLoginButtons', () => ({
  default: () => React.createElement('div', { 'data-testid': 'social-login-mock' }),
}));
vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

import AuthModal from '@/components/SignUpModal';

beforeEach(() => { mockPush.mockReset(); sessionStorage.clear(); });

describe('AuthModal signInOnly (college front door)', () => {
  it('shows the sign-in form without "Sign up" or social buttons', () => {
    render(<AuthModal open onClose={vi.fn()} initialFormType="signin" signInOnly />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByTestId('switch-to-signup-link')).not.toBeInTheDocument();
    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-login-mock')).not.toBeInTheDocument();
    expect(screen.queryByText(/or continue with/i)).not.toBeInTheDocument();
  });

  it('cannot be opened on the signup form, even if asked to', () => {
    render(<AuthModal open onClose={vi.fn()} initialFormType="signup" signInOnly />);
    expect(screen.queryByText('Create your account')).not.toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('Forgot password keeps the way back to the college door', () => {
    render(<AuthModal open onClose={vi.fn()} initialFormType="signin" signInOnly />);
    fireEvent.click(screen.getByTestId('forgot-password-link'));
    expect(mockPush).toHaveBeenCalledWith('/forgot-password?return=%2Finstitution%2Flogin');
  });
});

describe('AuthModal default mode (unchanged)', () => {
  it('still offers "Sign up" and social buttons', () => {
    render(<AuthModal open onClose={vi.fn()} initialFormType="signin" />);
    expect(screen.getByTestId('switch-to-signup-link')).toBeInTheDocument();
    expect(screen.getByTestId('social-login-mock')).toBeInTheDocument();
  });

  it('Forgot password goes to the plain page', () => {
    render(<AuthModal open onClose={vi.fn()} initialFormType="signin" />);
    fireEvent.click(screen.getByTestId('forgot-password-link'));
    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
  });
});
