/**
 * Auth Error Message Mapping
 *
 * Maps backend error codes and messages to safe, user-friendly messages.
 * Never exposes raw backend error details to prevent information leakage
 * and to avoid email enumeration attacks.
 *
 * TONE GUIDELINES:
 * - Use direct, conversational language (no excessive "Please")
 * - Include actionable next steps when possible
 * - Be specific about what went wrong (e.g., "locked" vs generic failure)
 * - Never expose backend paths, stack traces, or internal error details
 * - Email enumeration: Use generic messages that don't reveal if email exists
 * - Rate limiting: Include retry duration if available (e.g., "in 45s")
 */

export const AUTH_ERROR_MESSAGES = {
  // Login/Authentication errors (prevent email enumeration)
  INVALID_CREDENTIALS: "Email or password is incorrect",
  ACCOUNT_LOCKED: "Your account has been locked due to too many failed login attempts. Please reset your password to regain access.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
  ACCOUNT_DISABLED: "Your account has been disabled. Please contact support.",

  // Password reset errors
  PASSWORD_TOO_WEAK: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
  PASSWORD_REUSE: "Your new password must be different from your current password",
  PASSWORD_RESET_FAILED: "Unable to reset password. Please try again or request a new reset link.",
  INVALID_RESET_TOKEN: "This password reset link has expired or is invalid. Please request a new one.",
  RESET_TOKEN_EXPIRED: "This password reset link has expired. Please request a new one.",

  // Email verification errors
  EMAIL_VERIFICATION_FAILED: "Email verification failed. Please try again or request a new verification link.",
  INVALID_VERIFICATION_TOKEN: "This email verification link has expired or is invalid. Please request a new one.",
  EMAIL_ALREADY_VERIFIED: "Your email is already verified. You can sign in now.",
  EMAIL_ALREADY_IN_USE: "This email address is already associated with an account",

  // Signup errors
  SIGNUP_FAILED: "Unable to create account. Please try again.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Please sign in instead.",
  INVALID_EMAIL: "Please enter a valid email address",
  MISSING_REQUIRED_FIELDS: "Please fill in all required fields",

  // Rate limiting
  RATE_LIMITED: "Too many attempts. Please wait a few minutes before trying again.",
  RATE_LIMITED_WITH_RETRY: (retryAfter: number) =>
    `Too many attempts. Please try again in ${retryAfter} seconds.`,

  // OAuth errors
  OAUTH_FAILED: "Sign-in with Google failed. Please try again or use email sign-in.",
  OAUTH_UNAVAILABLE: "Google sign-in is temporarily unavailable. Please use email sign-in instead.",

  // Generic fallback
  GENERIC_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
};

interface AuthError {
  status?: number;
  code?: string;
  error_code?: string;
  error?: { code?: string; message?: string };
  message?: string;
  detail?: string;
  response?: { data?: Record<string, unknown> };
}

/**
 * Map backend error response to user-friendly message
 * Prevents information leakage and email enumeration attacks
 */
export function mapAuthError(
  error: unknown,
  context: 'login' | 'signup' | 'password_reset' | 'email_verify' = 'login'
): string {
  const authError = error as AuthError;
  if (!authError) return AUTH_ERROR_MESSAGES.GENERIC_ERROR;

  // Handle rate limiting
  if (authError.status === 429 || authError.message?.toLowerCase().includes('rate limit')) {
    return AUTH_ERROR_MESSAGES.RATE_LIMITED;
  }

  // Handle HTTP errors
  if (authError.status && authError.status >= 500) {
    return AUTH_ERROR_MESSAGES.SERVER_ERROR;
  }

  // Get error code from various possible locations
  const errorCode = authError.code || authError.error_code || authError.error?.code;

  // Check if we have a known error code mapping
  if (errorCode && typeof errorCode === 'string') {
    const message = AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES];
    if (typeof message === 'string') {
      return message;
    }
  }

  // Handle specific error message patterns (but sanitize them)
  const errorMessage = authError.message || authError.detail || authError.error?.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // For login, use generic message to prevent email enumeration
  if (context === 'login') {
    if (lowerMessage.includes('invalid') || lowerMessage.includes('incorrect') ||
        lowerMessage.includes('unauthorized') || lowerMessage.includes('not found')) {
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    }
    if (lowerMessage.includes('locked')) {
      return AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED;
    }
    if (lowerMessage.includes('verified')) {
      return AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
    }
  }

  // For signup
  if (context === 'signup') {
    if (lowerMessage.includes('already exists') || lowerMessage.includes('already in use')) {
      return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_IN_USE;
    }
    if (lowerMessage.includes('password')) {
      return AUTH_ERROR_MESSAGES.PASSWORD_TOO_WEAK;
    }
  }

  // For password reset
  if (context === 'password_reset') {
    if (lowerMessage.includes('expired') || lowerMessage.includes('invalid token')) {
      return AUTH_ERROR_MESSAGES.INVALID_RESET_TOKEN;
    }
    if (lowerMessage.includes('same as current')) {
      return AUTH_ERROR_MESSAGES.PASSWORD_REUSE;
    }
  }

  // For email verification
  if (context === 'email_verify') {
    if (lowerMessage.includes('already verified')) {
      return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED;
    }
    if (lowerMessage.includes('expired') || lowerMessage.includes('invalid token')) {
      return AUTH_ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN;
    }
  }

  // Default fallback - never expose raw error message
  return AUTH_ERROR_MESSAGES.GENERIC_ERROR;
}
