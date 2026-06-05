export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { valid: false, message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long` };
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least one digit" };
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }

  return { valid: true, message: "" };
}

export function getPasswordRequirements() {
  return [
    {
      label: "At least 8 characters",
      key: "length",
      test: (pwd: string) => pwd.length >= PASSWORD_REQUIREMENTS.minLength,
    },
    {
      label: "One uppercase letter",
      key: "uppercase",
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: "One lowercase letter",
      key: "lowercase",
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: "One number",
      key: "number",
      test: (pwd: string) => /\d/.test(pwd),
    },
    {
      label: "One special character",
      key: "special",
      test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    },
  ];
}
