import { httpClient } from "@/lib/http";
import { getTenantId, setTenantForEmail, getTenantByEmail } from '@/lib/tenantStorage';

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
  username?: string;
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

  // Use server-side route to avoid sending stale browser cookies to the backend
  const response = await httpClient.post<LoginResponse>(
    "/api/backend/auth/signin",
    { username: data.email, password: data.password },
    {
      baseURL: "",
      // Backend /auth/signin currently takes ~25s to reject a bad password and
      // longer to accept a good one, which overran the previous 45s timeout and
      // failed logins outright. Stopgap until the auth-path latency is fixed.
      timeout: 90000,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": tenantId,
      },
    }
  );

  // Update email → tenant mapping from backend response
  if (response.data.tenant_id) {
    setTenantForEmail(data.email, response.data.tenant_id);
  }

  // Clear the signout guard so future 401s can redirect to login normally.
  sessionStorage.removeItem('__signing_out');

  // Clear user-scoped session data from previous login
  sessionStorage.removeItem('uploaded_resume_filename');

  return response.data;
};

export const signOut = async () => {
  // Signal to the axios interceptor that signout is in progress so that any
  // concurrent 401s don't trigger a /?showLogin=true redirect that races with
  // our own navigation to /. Store timestamp for self-expiring flag (5 seconds).
  sessionStorage.setItem('__signing_out', Date.now().toString());

  // Use native fetch (not httpClient) so the axios interceptor cannot intercept
  // a pre-expired token and navigate away before the Set-Cookie clear headers land.
  // The Next.js proxy route clears cookies on the correct origin (localhost:3000).
  await fetch("/api/backend/auth/signout", { method: "POST", credentials: "include", headers: { 'X-Tenant-Id': getTenantId() } }).catch(() => {});

  // ✅ KEEP tenant_id in localStorage
  // User belongs to this tenant across sessions (per backend Option C)
  // Backend clears httpOnly cookies automatically - we don't need to clear tenant_id
  // clearTenantId() removed - allows re-login to same tenant

  // Clear coding-test drafts so the next user starts with a clean slate.
  // Keys are scoped per user (code:{userId}:{slug}:{lang}) so this only
  // affects entries from this session, but we clear all to avoid bloat.
  const codingKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('code:')) codingKeys.push(k);
  }
  codingKeys.forEach((k) => localStorage.removeItem(k));

  localStorage.removeItem('token_last_refreshed_at');
  localStorage.removeItem('uploaded_resume_filename');

  ['jm_matchResults', 'jm_parsedResumeData', 'jm_parsedJDData', 'jm_jdText', 'last_resume_path', 'builder_fresh_start'].forEach(
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
  // Use "public" tenant for all signups (temporary - will generate random tenant_id in future)
  const tenantId = "public";

  const response = await httpClient.post<SignUpResponse>(
    "/api/backend/auth/signup",
    data,
    {
      baseURL: "",
      // Signup is followed immediately by a signin, so it inherits the same
      // slow auth path. See the timeout note in signIn above.
      timeout: 90000,
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
