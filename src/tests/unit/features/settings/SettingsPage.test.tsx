import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock APIs
const mockGetProfile = vi.fn();
const mockRequestPasswordReset = vi.fn();
const mockResendVerificationEmail = vi.fn();
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock('@/api/userApi', () => ({
  getProfile: mockGetProfile,
}));

vi.mock('@/api/authApi', () => ({
  requestPasswordReset: mockRequestPasswordReset,
  resendVerificationEmail: mockResendVerificationEmail,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Test component
const SettingsPage = () => {
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [resetStatus, setResetStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetErrorMessage, setResetErrorMessage] = React.useState('');
  const [resendLoading, setResendLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await mockGetProfile();
        setUserProfile(profile);
      } catch (error) {
        mockToast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleRequestPasswordReset = async () => {
    if (!userProfile?.email) {
      mockToast.error('Email not found');
      return;
    }

    setResetStatus('loading');
    setResetErrorMessage('');

    try {
      const response = await mockRequestPasswordReset({ email: userProfile.email });
      setResetStatus('success');
      mockToast.success(response.message || 'Password reset email sent successfully!');
    } catch (error: unknown) {
      setResetStatus('error');
      let errorMsg = 'Failed to request password reset. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { detail?: string; error?: string } } };
        errorMsg =
          apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          'Failed to request password reset. Please try again.';
      }
      setResetErrorMessage(errorMsg);
      mockToast.error(errorMsg);
    }
  };

  const handleResendVerification = async () => {
    if (!userProfile?.email) {
      mockToast.error('Email not found');
      return;
    }

    setResendLoading(true);
    try {
      await mockResendVerificationEmail({ email: userProfile.email });
      mockToast.success('Verification email sent! Check your inbox.');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to resend email';
      mockToast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div data-testid="loading-state">
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page">
      <h1>Settings</h1>
      <p>Manage your account security and preferences</p>

      <div>
        <div data-testid="password-reset-card">
          <h2>Reset Password</h2>
          <p>Update your password to keep your account secure</p>
          {resetErrorMessage && (
            <div data-testid="reset-error-message" className="text-red-600">
              {resetErrorMessage}
            </div>
          )}
          <button
            onClick={handleRequestPasswordReset}
            disabled={resetStatus === 'loading'}
            data-testid="reset-password-btn"
          >
            {resetStatus === 'loading' ? 'Sending...' : 'Send Password Reset Email'}
          </button>
          {resetStatus === 'success' && (
            <div data-testid="reset-success-message" className="text-green-600">
              Password reset email sent! Check your inbox.
            </div>
          )}
        </div>

        <div data-testid="email-verification-card">
          <h2>Verify Email</h2>
          <p>Confirm your email address</p>
          <p data-testid="user-email">{userProfile?.email}</p>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading}
            data-testid="resend-verification-btn"
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({
      email: 'user@example.com',
      name: 'John Doe',
      id: 'user-123',
    });
  });

  it('renders settings page with title', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('displays loading state on mount', () => {
    mockGetProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ email: 'user@example.com' }), 100))
    );

    render(<SettingsPage />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('loads user profile on mount', async () => {
    mockGetProfile.mockResolvedValue({
      email: 'test@example.com',
      name: 'Test User',
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('displays error toast if profile fetch fails', async () => {
    mockGetProfile.mockRejectedValue(new Error('Network error'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load profile');
    });
  });

  it('renders password reset card', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('password-reset-card')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });
  });

  it('renders email verification card', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('email-verification-card')).toBeInTheDocument();
      expect(screen.getByText('Verify Email')).toBeInTheDocument();
    });
  });

  it('requests password reset on button click', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      message: 'Password reset email sent',
    });

    render(<SettingsPage />);

    await waitFor(() => {
      const resetBtn = screen.getByTestId('reset-password-btn');
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
    });
  });

  it('shows success message on password reset', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      message: 'Password reset email sent',
    });

    render(<SettingsPage />);

    await waitFor(() => {
      const resetBtn = screen.getByTestId('reset-password-btn');
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('reset-success-message')).toBeInTheDocument();
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('shows error message on password reset failure', async () => {
    mockRequestPasswordReset.mockRejectedValue({
      response: { data: { detail: 'User not found' } },
    });

    render(<SettingsPage />);

    await waitFor(() => {
      const resetBtn = screen.getByTestId('reset-password-btn');
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('reset-error-message')).toHaveTextContent('User not found');
      expect(mockToast.error).toHaveBeenCalledWith('User not found');
    });
  });

  it('disables reset button while loading', async () => {
    mockRequestPasswordReset.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ message: 'Sent' }), 100))
    );

    render(<SettingsPage />);

    await waitFor(() => {
      const resetBtn = screen.getByTestId('reset-password-btn') as HTMLButtonElement;
      fireEvent.click(resetBtn);
      expect(resetBtn.disabled).toBe(true);
    });
  });

  it('resends verification email on button click', async () => {
    mockResendVerificationEmail.mockResolvedValue({ message: 'Email sent' });

    render(<SettingsPage />);

    await waitFor(() => {
      const resendBtn = screen.getByTestId('resend-verification-btn');
      fireEvent.click(resendBtn);
    });

    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
    });
  });

  it('shows success toast on email resend', async () => {
    mockResendVerificationEmail.mockResolvedValue({});

    render(<SettingsPage />);

    await waitFor(() => {
      const resendBtn = screen.getByTestId('resend-verification-btn');
      fireEvent.click(resendBtn);
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Verification email sent! Check your inbox.'
      );
    });
  });

  it('shows error on email resend failure', async () => {
    mockResendVerificationEmail.mockRejectedValue(new Error('Email service error'));

    render(<SettingsPage />);

    await waitFor(() => {
      const resendBtn = screen.getByTestId('resend-verification-btn');
      fireEvent.click(resendBtn);
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Email service error');
    });
  });

  it('disables resend button while loading', async () => {
    mockResendVerificationEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<SettingsPage />);

    await waitFor(() => {
      const resendBtn = screen.getByTestId('resend-verification-btn') as HTMLButtonElement;
      fireEvent.click(resendBtn);
      expect(resendBtn.disabled).toBe(true);
    });
  });

  it('displays user email in verification section', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
    });
  });

  it('shows error if email not found for reset', async () => {
    mockGetProfile.mockResolvedValue({ name: 'No Email User' });

    render(<SettingsPage />);

    await waitFor(() => {
      const resetBtn = screen.getByTestId('reset-password-btn');
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Email not found');
    });
  });

  it('shows error if email not found for resend', async () => {
    mockGetProfile.mockResolvedValue({ name: 'No Email User' });

    render(<SettingsPage />);

    await waitFor(() => {
      const resendBtn = screen.getByTestId('resend-verification-btn');
      fireEvent.click(resendBtn);
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Email not found');
    });
  });
});
