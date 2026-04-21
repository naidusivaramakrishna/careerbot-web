import { httpClient } from "@/lib/http";
import { getTenantId, generateTenantId, setTenantForEmail, getTenantByEmail } from '@/lib/tenantStorage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  tenant_id?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignUpResponse {
  success: boolean;
  message?: string;
  tenant_id?: string;
}

// ✅ Tokens are now httpOnly cookies - never accessible to JavaScript
// ❌ Removed getAccessToken() - browser manages cookies automatically

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await httpClient.get("/auth/profile");
    return true;
  } catch {
    return false;
  }
};

export const signIn = async (data: LoginRequest): Promise<LoginResponse> => {
  // Try to get tenant from email mapping (multi-account support)
  let tenantId = getTenantByEmail(data.email);

  // Fallback to active tenant if email not found in map
  if (!tenantId) {
    tenantId = getTenantId();
  }

  const response = await httpClient.post<LoginResponse>(
    "/auth/signin",
    new URLSearchParams({
      username: data.email,
      password: data.password,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Tenant-Id": tenantId,
      },
    }
  );

  // Update email → tenant mapping from backend response
  if (response.data.tenant_id) {
    setTenantForEmail(data.email, response.data.tenant_id);
  }

  return response.data;
};

export const signOut = async () => {
  await httpClient.post("/auth/signout").catch(() => {});

  // ✅ KEEP tenant_id in localStorage
  // User belongs to this tenant across sessions (per backend Option C)
  // Backend clears httpOnly cookies automatically - we don't need to clear tenant_id
  // clearTenantId() removed - allows re-login to same tenant

  ['jm_matchResults', 'jm_parsedResumeData', 'jm_parsedJDData', 'jm_jdText'].forEach(
    (key) => sessionStorage.removeItem(key)
  );
  window.location.href = "/";
};

export const getGoogleLoginUrl = async (): Promise<string> => {
  const response = await httpClient.get<{ auth_url: string }>("/auth/google/login-url");
  return response.data.auth_url;
};

export const getLinkedInLoginUrl = async (): Promise<string> => {
  const response = await httpClient.get<{ auth_url: string }>("/auth/linkedin/login-url");
  return response.data.auth_url;
};

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  // Generate new tenant_id for this signup
  const tenantId = generateTenantId();

  const response = await httpClient.post<SignUpResponse>(
    "/auth/signup",
    data,
    {
      headers: {
        "X-Tenant-Id": tenantId,
        "Content-Type": "application/json",
      },
    }
  );

  // Store email → tenant mapping for multi-account support
  if (response.data.tenant_id) {
    setTenantForEmail(data.email, response.data.tenant_id);
  }

  return response.data;
};

// ==================== EMAIL VERIFICATION ENDPOINTS ====================

export interface ResendEmailRequest {
  email: string;
}

export interface ResendEmailResponse {
  message: string;
}

/**
 * Resend verification email
 *
 * Use this if user didn't receive the original verification email.
 *
 * @param data - User email address
 * @returns Message confirming email was sent
 */
export const resendVerificationEmail = async (
  data: ResendEmailRequest
): Promise<ResendEmailResponse> => {
  const response = await httpClient.post<ResendEmailResponse>(
    "/auth/email/resend",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Verify user email address
 *
 * Confirms email verification using the token sent to the user's email.
 *
 * @param data - Verification token from email
 * @returns Success status and message
 */
export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<VerifyEmailResponse> => {
  const response = await httpClient.post<VerifyEmailResponse>(
    "/auth/email/verify",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// ==================== PASSWORD RESET ENDPOINTS ====================

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  message: string;
}

/**
 * Request password reset
 *
 * Sends a password reset email to the user with a unique token.
 * Includes rate limiting to prevent abuse.
 *
 * @param data - User email address
 * @returns Message confirming reset email was sent
 */
export const requestPasswordReset = async (
  data: RequestPasswordResetRequest
): Promise<RequestPasswordResetResponse> => {
  const response = await httpClient.post<RequestPasswordResetResponse>(
    "/auth/password/reset",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export interface ConfirmPasswordResetRequest {
  token: string;
  new_password: string;
}

export interface ConfirmPasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Confirm password reset
 *
 * Completes the password reset process using the token from the reset email.
 * Password must meet security requirements.
 *
 * @param data - Reset token and new password
 * @returns Success status and message
 */
export const confirmPasswordReset = async (
  data: ConfirmPasswordResetRequest
): Promise<ConfirmPasswordResetResponse> => {
  const response = await httpClient.patch<ConfirmPasswordResetResponse>(
    "/auth/password/reset",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// ==================== TOKEN REFRESH ====================

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

/**
 * Refresh access token using refresh token
 *
 * Called automatically when access token is about to expire.
 * Tokens are stored in httpOnly cookies - this endpoint just refreshes them.
 *
 * @returns New access token and expiry information
 */
export const refreshAccessToken = async (): Promise<TokenRefreshResponse> => {
  try {
    const response = await httpClient.post<TokenRefreshResponse>(
      "/auth/refresh",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // ✅ Backend reads refresh_token from httpOnly cookie automatically
    // Backend sets new access_token as httpOnly cookie in response
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Token refresh failed";
    throw new Error(errorMessage);
  }
};
