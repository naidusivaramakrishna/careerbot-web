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
const mockVerifyEmail = vi.fn();
const mockResendVerificationEmail = vi.fn();
vi.mock('@/api/authApi', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
  resendVerificationEmail: (...args: unknown[]) => mockResendVerificationEmail(...args),
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
import { VerificationRecovery } from '@/components/VerificationRecovery';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderSignup = (props = {}) =>
  render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signup" {...props} />);

const renderSignin = (props = {}) =>
  render(<AuthModal open={true} onClose={vi.fn()} initialFormType="signin" {...props} />);

// Everything written to web storage during the test. vitest.setup.ts replaces
// localStorage with a plain object of vi.fn methods (values live in a closure),
// so spreading it (`{ ...localStorage }`) yields only functions -> "{}".
// Read the setItem calls instead; sessionStorage is jsdom's real Storage.
const storageWrites = (): string => {
  const local = JSON.stringify(vi.mocked(localStorage.setItem).mock.calls);
  const session = Array.from({ length: sessionStorage.length }, (_, i) => {
    const key = sessionStorage.key(i) as string;
    return [key, sessionStorage.getItem(key)];
  });
  return local + JSON.stringify(session);
};

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

// develop2 showed this notice under the submit button of both forms
// (SignUpModal.tsx:434-439 at ae16eaa). It covers every way of continuing from
// the modal, so it must sit after both the submit button and the Google /
// LinkedIn buttons.
describe('AuthModal — Terms / Privacy Policy notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const consentNotice = () =>
    screen.getByText(
      (_content, el) =>
        el?.tagName === 'P' &&
        el.textContent === 'By continuing, you agree to our Terms and Privacy Policy',
    );

  const follows = (later: Element, earlier: Element) =>
    (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  it.each([
    ['signup', renderSignup],
    ['signin', renderSignin],
  ])('shows the notice on the %s form, after the submit and social buttons', (_form, renderForm) => {
    renderForm();
    const notice = consentNotice();
    expect(notice).toBeInTheDocument();
    expect(follows(notice, screen.getByTestId('auth-submit-btn'))).toBe(true);
    expect(follows(notice, screen.getByTestId('social-login-mock'))).toBe(true);
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

  it('calls signUp with form values', async () => {
    mockSignUp.mockResolvedValue({ id: 'user-123', success: true });
    renderSignup();

    fireEvent.change(screen.getByTestId('signup-username-input'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'jdoe', email: 'j@example.com', password: 'Secret1!' })
      );
    });
  });

  it('shows success toast and displays OTP verification after successful signup', async () => {
    mockSignUp.mockResolvedValue({ id: 'user-123' });
    renderSignup();

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Account created! Verification email sent.');
      // OTPVerificationInput should be shown
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  it('stores the pending-verification record (without the password) after signup', async () => {
    localStorage.clear();
    mockSignUp.mockResolvedValue({ id: 'user-123' });
    renderSignup();

    fireEvent.change(screen.getByTestId('signup-username-input'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await screen.findByTestId('otp-input-0');
    const record = JSON.parse(localStorage.getItem('pendingEmailVerification') as string);
    expect(record).toEqual({
      userId: 'user-123',
      email: 'j@example.com',
      pendingVerification: true,
      timestamp: expect.any(Number),
    });
    expect(record).not.toHaveProperty('password');
    expect(storageWrites()).not.toContain('Secret1!');
    // Signup no longer signs the user in; the OTP step comes first.
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('reports a failure and stores nothing when the signup response has no id', async () => {
    localStorage.clear();
    mockSignUp.mockResolvedValue({});
    renderSignup();

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Account creation failed. Please try again.')
    );
    expect(localStorage.getItem('pendingEmailVerification')).toBeNull();
    expect(screen.queryByTestId('otp-input-0')).not.toBeInTheDocument();
  });

  it('shows "Creating account..." while the request is in flight', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {}));
    renderSignup();

    fireEvent.click(screen.getByTestId('auth-submit-btn'));
    expect(await screen.findByText('Creating account...')).toBeInTheDocument();
  });
});

// ClientLayout mounts VerificationRecovery once and keeps it mounted across
// client-side navigation, next to whatever page opened the modal.
describe('AuthModal — recovery banner after closing the modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const Layout = () => {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <VerificationRecovery />
        <AuthModal open={open} onClose={() => setOpen(false)} initialFormType="signup" />
      </>
    );
  };

  it('shows the banner, without a remount, once the user closes the modal mid-verification', async () => {
    mockSignUp.mockResolvedValue({ id: 'user-123' });
    render(<Layout />);
    expect(screen.queryByText('Resume Email Verification')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('signup-username-input'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));
    await screen.findByTestId('otp-input-0');

    fireEvent.click(screen.getByTestId('auth-modal-close-btn'));
    expect(screen.queryByTestId('auth-modal-close-btn')).not.toBeInTheDocument();

    expect(await screen.findByText('Resume Email Verification')).toBeInTheDocument();
    expect(screen.getByText('j@example.com')).toBeInTheDocument();
  });

  it('shows the banner again for a new signup after an earlier one was dismissed', async () => {
    localStorage.setItem(
      'pendingEmailVerification',
      JSON.stringify({ userId: 'old', email: 'old@example.com', pendingVerification: true, timestamp: Date.now() }),
    );
    mockSignUp.mockResolvedValue({ id: 'user-123' });
    render(<Layout />);
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Resume Email Verification')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: 'j@example.com' } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: 'Secret1!' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));
    await screen.findByTestId('otp-input-0');
    fireEvent.click(screen.getByTestId('auth-modal-close-btn'));

    expect(await screen.findByText('Resume Email Verification')).toBeInTheDocument();
    expect(screen.getByText('j@example.com')).toBeInTheDocument();
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

// careerbot-api develop2 user_service/service.py:479-491 raises 403 with
// detail {error: "EMAIL_NOT_VERIFIED", message, user_id} AFTER the password
// check; core/exception_handler.py:216-236 moves every detail key other than
// message/error_code into error.details. So a user signing in from a browser
// with no pendingEmailVerification record still gets their user_id here.
const emailNotVerified403 = (userId: string) => ({
  isAxiosError: true,
  response: {
    status: 403,
    data: {
      success: false,
      error: {
        message: 'Your email address has not been verified. Please check your inbox for the verification code, or request a new one.',
        error_code: 'HTTP_403',
        details: { error: 'EMAIL_NOT_VERIFIED', user_id: userId },
      },
    },
  },
});

describe('AuthModal — sign in with an unverified email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockIsAxiosError.mockReturnValue(true);
  });

  const signInAs = (email: string, password: string) => {
    renderSignin();
    fireEvent.change(screen.getByTestId('signup-email-input'), { target: { value: email } });
    fireEvent.change(screen.getByTestId('signup-password-input'), { target: { value: password } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));
  };

  it('opens the OTP step with the user_id from the 403, with no local pending record', async () => {
    mockSignIn.mockRejectedValueOnce(emailNotVerified403('user-42'));
    mockVerifyEmail.mockResolvedValue({ message: 'Email verified successfully' });

    signInAs('late@example.com', 'Secret123!');

    expect(await screen.findByTestId('otp-input-0')).toBeInTheDocument();
    expect(screen.getByText('late@example.com')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('otp-input-0'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('verify-email-btn'));

    await waitFor(() =>
      expect(mockVerifyEmail).toHaveBeenCalledWith({ user_id: 'user-42', otp: '123456' })
    );
  });

  it('lets the user request a new code straight away', async () => {
    mockSignIn.mockRejectedValueOnce(emailNotVerified403('user-42'));
    mockResendVerificationEmail.mockResolvedValue({ message: 'sent' });

    signInAs('late@example.com', 'Secret123!');

    const resend = await screen.findByTestId('resend-otp-btn');
    expect(resend).not.toBeDisabled();
    fireEvent.click(resend);

    await waitFor(() =>
      expect(mockResendVerificationEmail).toHaveBeenCalledWith({ email: 'late@example.com' })
    );
  });

  it('never writes the password to web storage', async () => {
    mockSignIn.mockRejectedValueOnce(emailNotVerified403('user-42'));

    signInAs('late@example.com', 'Secret123!');
    await screen.findByTestId('otp-input-0');

    expect(storageWrites()).not.toContain('Secret123!');
  });

  it('keeps the plain error for a 403 that is not EMAIL_NOT_VERIFIED', async () => {
    mockSignIn.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: { success: false, error: { message: 'Account is suspended', error_code: 'HTTP_403' } },
      },
    });

    signInAs('someone@example.com', 'Secret123!');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Account is suspended'));
    expect(screen.queryByTestId('otp-input-0')).not.toBeInTheDocument();
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
