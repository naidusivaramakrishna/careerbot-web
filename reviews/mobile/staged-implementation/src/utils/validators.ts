// Shared form validators (TS port of POC src/utils/validators.js).
// Used by SignIn, SignUp, ForgotPassword, ResetPassword.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// At least 8 chars, one letter and one number.
const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

export function isStrongPassword(value: unknown): boolean {
  return typeof value === 'string' && STRONG_PASSWORD_PATTERN.test(value);
}

export const PASSWORD_REQUIREMENT_TEXT =
  'Password must be at least 8 characters and include a letter and a number.';
