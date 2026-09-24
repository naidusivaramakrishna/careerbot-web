import { httpClient } from "@/lib/http";
import { getTenantId, setTenantForEmail, getTenantByEmail } from '@/lib/tenantStorage';
import { clearUnscopedJobTrackingData } from '@/utils/jobTracking';

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
  id: string;
  success?: boolean;
  message?: string;
  tenant_id?: string;
}

// ✅ Tokens are now httpOnly cookies - never accessible to JavaScript
// ❌ Removed getAccessToken() - browser manages cookies automatically

export const isAuthenticated = async (options?: {
  skipAuthRedirect?: boolean;
  skipRefresh?: boolean;
}): Promise<boolean> => {
  try {
    // TWO DIFFERENT HEADERS, and they are not interchangeable. This function
    // mapped skipAuthRedirect onto X-Skip-Auth-Redirect, which short-circuits a
    // 401 BEFORE the refresh block runs (src/lib/http.ts) -- so a signed-in
    // user whose 30-minute access token had expired was reported as signed
    // OUT, even with a perfectly valid refresh cookie. On the pricing page that
    // showed a paying subscriber the "Get Started Free" signup CTA.
    //
    // skipAuthRedirect -> X-Skip-Login-Redirect: still refreshes an expired
    //   token; only suppresses the redirect to login when the refresh ALSO
    //   fails. This is what a public page an anonymous visitor can land on
    //   actually needs.
    // skipRefresh      -> X-Skip-Auth-Redirect: no refresh attempt at all.
    //   Only for "am I really logged out?" checks, e.g. straight after signout.
    //
    // Same mapping as getProfile() in src/api/userApi.ts. The two must agree:
    // one option name meaning opposite things in two files is what caused this.
    const headers = options?.skipRefresh
      ? { "X-Skip-Auth-Redirect": "true" }
      : options?.skipAuthRedirect
      ? { "X-Skip-Login-Redirect": "true" }
      : undefined;
    await httpClient.get("/auth/profile", headers ? { headers } : undefined);
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

  // Store the actual token expiry from backend for accurate refresh timing
  // Validate expires_in: must be a positive number (clamp to reasonable range: 5 min - 24 hours)
  if (response.data.expires_in && !isNaN(response.data.expires_in) && response.data.expires_in > 0) {
    const expirySeconds = Math.max(5 * 60, Math.min(24 * 60 * 60, response.data.expires_in));
    localStorage.setItem('token_expires_in_seconds', expirySeconds.toString());
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
  localStorage.removeItem('token_expires_in_seconds');
  localStorage.removeItem('uploaded_resume_filename');

  // Job tracking's unscoped savedJobs/appliedJobs buckets are shared across
  // every account on this browser (see jobTracking.ts's scopedKey) — must be
  // cleared here or a leftover record can get folded into the next account
  // that signs in, since the scoped buckets (savedJobs:<userId>) are per-user
  // and correctly left alone.
  clearUnscopedJobTrackingData();

  ['last_resume_path', 'builder_fresh_start'].forEach((key) => sessionStorage.removeItem(key));

  // Job Match session state: sweep by PREFIX, not by allow-list.
  //
  // This used to name each jm_* key explicitly, which meant a newly added key
  // was RETAINED BY DEFAULT. jm_analysisDraft was added with the analysis-draft
  // feature and never registered here, so an analysis draft built from one
  // user's resume and JD survived sign-out and was restored on mount for the
  // next user signing in to the SAME TAB (AnalysisContent.tsx reads it on
  // mount). sessionStorage is per-tab but explicitly survives logout -> login.
  //
  // A prefix sweep cannot drift the way the list did. Every jm_* key is Job
  // Match session state and none of them may outlive the session.
  // Iterate backwards: removeItem() re-indexes the store as it goes.
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i);
    if (k?.startsWith('jm_')) sessionStorage.removeItem(k);
  }
  window.location.href = "/";
};

export const getGoogleLoginUrl = async (): Promise<string> => {
  const response = await httpClient.get<{ auth_url: string }>("/auth/google/login-url", {
    params: {
      prompt: "select_account",
      access_type: "offline",
    },
  });
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
  user_id: string;
  otp: string;
}

// careerbot-api POST /auth/email/verify answers 200 {"message": "..."} with no
// `success` field (app/api/v1/endpoints/auth.py verify_email); failures are
// non-2xx. `success` stays optional for forward compatibility only.
export interface VerifyEmailResponse {
  success?: boolean;
  message: string;
}

/**
 * Verify user email address with OTP
 *
 * Confirms email verification using the 6-digit OTP sent to user's email during signup.
 *
 * @param data - User ID and OTP code
 * @returns Success status and message
 * @throws Error with code OTP_EXPIRED, OTP_INVALID, OTP_MAX_ATTEMPTS, or USER_NOT_FOUND
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
    // Use Next.js proxy route which properly forwards Set-Cookie headers
    // This ensures the new refresh_token reaches the browser correctly
    const response = await httpClient.post<TokenRefreshResponse>(
      "/api/backend/auth/refresh",
      {},
      {
        baseURL: "",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": getTenantId(),
        },
      }
    );
    // ✅ Backend reads refresh_token from httpOnly cookie automatically
    // Backend sets new access_token as httpOnly cookie in response
    // Store the actual token expiry from backend for accurate refresh timing
    // Validate expires_in: must be a positive number (clamp to reasonable range: 5 min - 24 hours)
    if (response.data.expires_in && !isNaN(response.data.expires_in) && response.data.expires_in > 0) {
      const expirySeconds = Math.max(5 * 60, Math.min(24 * 60 * 60, response.data.expires_in));
      localStorage.setItem('token_expires_in_seconds', expirySeconds.toString());
    }
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Token refresh failed";
    throw new Error(errorMessage);
  }
};
