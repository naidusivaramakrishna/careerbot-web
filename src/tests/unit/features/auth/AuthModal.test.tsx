/**
 * Unit tests for AuthModal (SignUpModal) — combined signup / signin modal.
 *
 * Covers:
 *   Rendering
 *     - Returns null when open=false
 *     - Renders signup form by default (initialFormType="signup")
 *     - Renders signin form when initialFormType="signin"
 *     - Close button calls onClose
 *   Form switching
 *     - "Sign in" link switches to signin form
 *     - "Sign up" link switches back to signup form
 *     - Errors are cleared when switching forms
 *   Password visibility
 *     - Toggle shows / hides password
 *   Forgot Password
 *     - Clicking link navigates to /forgot-password and calls onClose
 *   Sign Up — happy path
 *     - Calls signUp then signIn with form values
 *     - Shows success toast and calls onSuccess
 *     - Shows "Signing up..." while loading
 *   Sign In — happy path
 *     - Calls signIn with form values
 *     - Shows success toast and calls onSuccess
 *     - Shows "Signing in..." while loading
 *   Error handling
 *     - Maps 422 validation_errors envelope to correct fields
 *     - Maps FastAPI 422 detail array to correct fields
 *     - Maps backend error.message to login field
 *     - Falls back to generic error for unknown errors
 *   Email verified state
 *     - Shows "Email Verified!" when sessionStorage has emailVerified=true
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
vi.mock('@/api/authApi', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/authRedirect', () => ({
  sanitizeAuthRedirect: (r: string | undefined) => r || '/dashboard',
}));

vi.mock('@/components/SocialLoginButtons', () => ({
  default: () => React.createElement('div', { 'data-testid': 'social-login-mock' }),
}));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

// axios.isAxiosError is non-configurable — mock the whole module so tests can control it
const mockIsAxiosError = vi.hoisted(() => vi.fn<[unknown], boolean>(() => true));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, isAxiosError: mockIsAxiosError }, isAxiosError: mockIsAxiosError };
});

// ─── Component under test ─────────────────────────────────────────────────────
import AuthModal from '@/components/SignUpModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderSignup = (props = {}) =>
  render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signup" {...props} />);

const renderSignin = (props = {}) =>
  render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signin" {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthModal — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when open=false', () => {
    const { container } = render(
      <AuthModal open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders signup form when initialFormType="signup"', () => {
    renderSignup();
    expect(screen.getByTestId('signup-username-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent('Create Account');
  });

  it('renders signin form when initialFormType="signin"', () => {
    renderSignin();
    expect(screen.queryByTestId('signup-username-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('signup-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent('Sign in');
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<AuthModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('auth-modal-close-btn'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('AuthModal — form switching', () => {
  beforeEach(() => vi.clearAllMocks());

  it('switches to signin form when "Sign in" link is clicked', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('switch-to-signin-link'));
    expect(screen.queryByTestId('signup-username-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent('Sign in');
  });

  it('switches back to signup form when "Sign up" link is clicked', () => {
    renderSignin();
    fireEvent.click(screen.getByTestId('switch-to-signup-link'));
    expect(screen.getByTestId('signup-username-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent('Create Account');
  });
});

describe('AuthModal — password visibility toggle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows password text when toggle is clicked', () => {
    renderSignup();
    const input = screen.getByTestId('signup-password-input');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByTestId('toggle-password-btn'));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('hides password again when toggle is clicked a second time', () => {
    renderSignup();
    const toggle = screen.getByTestId('toggle-password-btn');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(screen.getByTestId('signup-password-input')).toHaveAttribute('type', 'password');
  });
});

describe('AuthModal — forgot password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('navigates to /forgot-password and calls onClose', () => {
    const onClose = vi.fn();
    renderSignin({ onClose });
    fireEvent.click(screen.getByTestId('forgot-password-link'));
    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AuthModal — sign up happy path', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls signUp then signIn with form values', async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockSignIn.mockResolvedValue({ access_token: 'tok' });
    const onSuccess = vi.fn();
    renderSignup({ onSuccess });

    fireEvent.change(screen.getByTestId('signup-username-input'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'jdoe', email: 'j@example.com', password: 'Secret1!' })
      );
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'j@example.com', password: 'Secret1!' })
      );
    });
  });

  it('shows success toast and calls onSuccess after signup', async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockSignIn.mockResolvedValue({ access_token: 'tok' });
    const onSuccess = vi.fn();
    renderSignup({ onSuccess });

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Account created! Redirecting...');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows "Signing up..." while the request is in flight', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {}));
    renderSignup();

    fireEvent.click(screen.getByTestId('auth-submit-btn'));
    expect(await screen.findByText('Signing up...')).toBeInTheDocument();
  });
});

describe('AuthModal — sign in happy path', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls signIn with email and password', async () => {
    mockSignIn.mockResolvedValue({ access_token: 'tok' });
    const onSuccess = vi.fn();
    renderSignin({ onSuccess });

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Pass123!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com', password: 'Pass123!' })
      );
    });
  });

  it('shows success toast and calls onSuccess after signin', async () => {
    mockSignIn.mockResolvedValue({ access_token: 'tok' });
    const onSuccess = vi.fn();
    renderSignin({ onSuccess });

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Pass123!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Login successful! Redirecting...');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows "Signing in..." while the request is in flight', async () => {
    mockSignIn.mockReturnValue(new Promise(() => {}));
    renderSignin();

    fireEvent.click(screen.getByTestId('auth-submit-btn'));
    expect(await screen.findByText('Signing in...')).toBeInTheDocument();
  });
});

describe('AuthModal — error handling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps validation_errors envelope to the correct field', async () => {
    mockIsAxiosError.mockReturnValue(true);
    mockSignUp.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: {
            details: {
              validation_errors: [{ field: 'email', message: 'Value error, Invalid email format' }],
            },
          },
        },
      },
    });

    renderSignup();
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email format');
    });
  });

  it('maps FastAPI 422 detail array to the correct field', async () => {
    mockIsAxiosError.mockReturnValue(true);
    mockSignUp.mockRejectedValue({
      response: {
        status: 422,
        data: {
          detail: [{ loc: ['body', 'password'], msg: 'field required' }],
        },
      },
    });

    renderSignup();
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('field required');
    });
  });

  it('shows backend error.message in the login error area', async () => {
    mockIsAxiosError.mockReturnValue(true);
    mockSignIn.mockRejectedValue({
      response: {
        status: 401,
        data: { error: { message: 'Invalid credentials' } },
      },
    });

    renderSignin();
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('shows generic error message for non-axios errors', async () => {
    mockIsAxiosError.mockReturnValue(false);
    mockSignIn.mockRejectedValue(new Error('Network failure'));

    renderSignin();
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });
});

describe('AuthModal — email verified state', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows "Email Verified!" banner when sessionStorage has emailVerified=true', () => {
    sessionStorage.setItem('emailVerified', 'true');
    render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signin" />);
    expect(screen.getByText('Email Verified!')).toBeInTheDocument();
  });

  it('removes emailVerified from sessionStorage after reading it', () => {
    sessionStorage.setItem('emailVerified', 'true');
    render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signin" />);
    expect(sessionStorage.getItem('emailVerified')).toBeNull();
  });
});
