import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getCorrelationId,
  clearCorrelationId,
} from './correlationId';
import { getTenantId, clearTenantId } from './tenantStorage';

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BASE_URL) {
  console.warn('[careerbot] NEXT_PUBLIC_BASE_URL is not set — falling back to proxy. Set this in production.');
}
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || '/api/v1';

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

const isAdminRequest = (url?: string): boolean =>
  url?.includes('/admin/') || false;

const getUserLoginHref = (): string => {
  if (typeof window === 'undefined') return '/?showLogin=true';

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ showLogin: 'true' });
  if (currentPath && currentPath !== '/') {
    params.set('next', currentPath);
  }

  return `/?${params.toString()}`;
};

const bodyContains = (data: unknown, str: string): boolean => {
  if (typeof data === 'string') return data.includes(str);
  if (data && typeof data === 'object') {
    try { return JSON.stringify(data).includes(str); } catch { /* ignore */ }
  }
  return false;
};

// True if the user logged in (or last refreshed successfully) within the past 35 minutes,
// or if a refresh attempt is currently in progress (within 3 minutes).
// A failed refresh within this window is almost certainly a transient backend
// issue, not real session expiry — so we skip the logout redirect.
// This window must be larger than the token refresh interval to avoid logging out
// users during refresh retries when token expires but refresh fails.
const LAST_REFRESH_KEY = 'token_last_refreshed_at';
const LAST_ATTEMPT_KEY = 'token_last_refresh_attempt_at';
const REFRESH_ATTEMPT_WINDOW_MS = 3 * 60 * 1000; // 3 minutes for retry window
const isSessionFresh = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lastRefreshed = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
  const lastAttempted = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY) || '0', 10);
  const lastRefreshedRecently = lastRefreshed > 0 && Date.now() - lastRefreshed < 35 * 60 * 1000;  // 35 minutes = 30 min token + 5 min buffer
  const retryInProgress = lastAttempted > 0 && Date.now() - lastAttempted < REFRESH_ATTEMPT_WINDOW_MS;  // 3 min retry window
  return lastRefreshedRecently || retryInProgress;
};

/**
 * True when the backend has definitively rejected the session, as opposed to
 * failing transiently.
 *
 * isSessionFresh() suppresses the logout redirect for 35 minutes so a flaky
 * backend does not bounce a working session to the login page. But the API
 * also returns 401 for reasons that will NEVER succeed on retry -- a revoked
 * or already-used refresh token, a suspended account, a failed rotation
 * (careerbot-api app/services/user_service/service.py:445-490). Suppressing
 * those left the user in a half-logged-in state, every request 401ing, for up
 * to 35 minutes. Definitive rejections must bypass the freshness window.
 */
const isDefinitiveAuthRejection = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const response = (err as { response?: { status?: number; data?: { detail?: unknown } } }).response;
  if (response?.status !== 401 && response?.status !== 403) return false;
  const detail = response?.data?.detail;
  if (typeof detail !== 'string') return false;
  return /revoked|already used|suspended|rotation failed|sign in again/i.test(detail);
};

const clearAllTokens = () => {
  if (typeof window === 'undefined') return;
  // ✅ Backend clears httpOnly cookies automatically
  // Works for both user and admin requests
  sessionStorage.clear();
  localStorage.removeItem('token_last_refreshed_at');
  localStorage.removeItem('token_last_refresh_attempt_at');
  clearCorrelationId();
  clearTenantId();
};

/* --------------------------------------------------
   Axios Instance
-------------------------------------------------- */

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Enable httpOnly cookie sending/receiving
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});


/* --------------------------------------------------
   Refresh State & Queues
-------------------------------------------------- */

let isRefreshingUser = false;
let isRefreshingAdmin = false;

interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let userQueue: QueueItem[] = [];
let adminQueue: QueueItem[] = [];

const processQueue = (
  error: unknown,
  token: string | null,
  isAdmin: boolean
) => {
  const queue = isAdmin ? adminQueue : userQueue;

  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );

  if (isAdmin) adminQueue = [];
  else userQueue = [];
};

/* --------------------------------------------------
   Request Interceptor
-------------------------------------------------- */

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No Authorization header is set from localStorage.
    //
    // This used to read 'access_token_backup' and attach it as a Bearer token
    // on every request, described as "a backup for httpOnly cookies in case
    // they don't work across domains". Nothing legitimate ever wrote that key:
    // both OAuth callbacks establish the session as httpOnly cookies and put
    // nothing in the query string (verified against careerbot-api
    // origin/integration/develop2_072026_pr: google_oauth.py and
    // linkedin_oauth.py). The only writer was a success page copying whatever
    // happened to be in a public URL — so this line replayed an
    // attacker-supplied token as the caller's credential on every API call.
    //
    // Cookies are sent by withCredentials; that is the auth path.

    const correlationId = getCorrelationId();
    if (correlationId && config.headers) {
      config.headers['X-Correlation-ID'] = correlationId;
    }

    // Only add X-Tenant-Id if not already set (signup/signin set it explicitly)
    if (!config.headers.get('X-Tenant-Id')) {
      const tenantId = getTenantId();
      if (tenantId) {
        config.headers.set('X-Tenant-Id', tenantId);
      }
    }

    // DO NOT attach a service credential here.
    //
    // A hardcoded `Authorization: Bearer <AI_LAYER_API_KEY>` was added at this
    // point in 8277690 ("add Bearer token authentication to AI service
    // requests"). It was removed because:
    //
    //   1. This is client code. Anything here ships in the JS bundle and is
    //      readable by every visitor in DevTools. A key in the browser is not
    //      a key.
    //   2. This client does not talk to the AI layer. BASE_URL is
    //      NEXT_PUBLIC_BASE_URL || '/api/v1' — i.e. careerbot-api. The only
    //      code that reaches the AI layer directly is
    //      src/app/api/backend/ai-health/route.ts, which is a Next.js SERVER
    //      route and can hold secrets safely.
    //   3. It sat in the GLOBAL request interceptor, so every request without
    //      an Authorization header received it — including calls to
    //      careerbot-api, which authenticates with httpOnly cookies and did
    //      not expect a bearer token.
    //
    // If the browser ever needs AI-layer data, proxy it through the backend or
    // a Next.js route handler so the credential stays server-side.

    if (config.method?.toLowerCase() === 'get') {
      const sep = config.url?.includes('?') ? '&' : '?';
      config.url = `${config.url}${sep}_t=${Date.now()}`;
    }

    if (config.headers) {
      config.headers['Cache-Control'] =
        'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }

    return config;
  },
  Promise.reject
);

/* --------------------------------------------------
   Backend error message extractor
   Handles: { error: { message } }, { message }, { detail: string },
            { detail: [{ msg }] } (FastAPI validation)
-------------------------------------------------- */

function extractBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  if (d.error && typeof d.error === 'object') {
    const msg = (d.error as Record<string, unknown>).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.detail === 'string' && d.detail) return d.detail;
  if (Array.isArray(d.detail) && d.detail.length > 0) {
    const first = d.detail[0] as Record<string, unknown>;
    if (typeof first?.msg === 'string' && first.msg) return first.msg;
  }
  return null;
}

/* --------------------------------------------------
   Response Interceptor
-------------------------------------------------- */

/* --------------------------------------------------
   Credit sync helper — fires on any response that carries
   credits_remaining or user_credits_remaining so the
   DashboardContext can update without a full re-fetch.
-------------------------------------------------- */

let _creditsBc: BroadcastChannel | null = null;
const getCreditsBc = (): BroadcastChannel | null => {
  if (typeof window === 'undefined') return null;
  if (!_creditsBc) {
    try { _creditsBc = new BroadcastChannel('careerbot_credits'); } catch { /* unsupported */ }
  }
  return _creditsBc;
};

const maybeSyncCredits = (data: unknown): void => {
  if (!data || typeof data !== 'object') return;
  const d = data as Record<string, unknown>;
  const remaining =
    typeof d.credits_remaining === 'number' ? d.credits_remaining :
    typeof d.user_credits_remaining === 'number' ? d.user_credits_remaining :
    null;
  if (remaining === null) return;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('credits-updated', { detail: { credits_remaining: remaining } })
    );
    getCreditsBc()?.postMessage({ credits_remaining: remaining });
  }
};

client.interceptors.response.use(
  (response) => {
    maybeSyncCredits(response.data);
    // For non-GET requests, if the response didn't carry credits_remaining,
    // signal the hook to re-fetch so the header stays in sync immediately.
    const method = response.config?.method?.toLowerCase();
    if (method && method !== 'get') {
      const d = response.data as Record<string, unknown> | null;
      const hasCredits =
        d && typeof d === 'object' &&
        (typeof d.credits_remaining === 'number' || typeof d.user_credits_remaining === 'number');
      if (!hasCredits && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('credits-fetch-required'));
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAdmin = isAdminRequest(originalRequest?.url);
    const skipAuthRedirect =
      originalRequest?.headers?.get?.('X-Skip-Auth-Redirect') === 'true' ||
      originalRequest?.headers?.['X-Skip-Auth-Redirect'] === 'true' ||
      originalRequest?.headers?.['x-skip-auth-redirect'] === 'true';
    // skipLoginRedirect: still attempts token refresh on 401, but does NOT
    // redirect to login if the refresh also fails (user is unauthenticated).
    const skipLoginRedirect =
      originalRequest?.headers?.get?.('X-Skip-Login-Redirect') === 'true' ||
      originalRequest?.headers?.['X-Skip-Login-Redirect'] === 'true' ||
      originalRequest?.headers?.['x-skip-login-redirect'] === 'true';

    // 403 = tenant mismatch — do NOT attempt token refresh, just reject
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && skipAuthRedirect) {
      return Promise.reject(error);
    }

    // 500/503 with AI_SERVICE_UNAVAILABLE = AI/LLM service is temporarily down.
    // Retry up to 3 times with increasing delay — uses separate _aiRetryCount
    // so it does not interfere with the 401 token-refresh _retry flag.
    const AI_MAX_RETRIES = 3;
    const isAiServiceError =
      (error.response?.status === 500 || error.response?.status === 503) &&
      bodyContains(error.response?.data, 'AI_SERVICE_UNAVAILABLE') &&
      (originalRequest._aiRetryCount ?? 0) < AI_MAX_RETRIES &&
      !originalRequest.url?.includes('/auth/') &&
      !originalRequest.url?.includes('/admin/auth/');

    if (isAiServiceError) {
      originalRequest._aiRetryCount = (originalRequest._aiRetryCount ?? 0) + 1;
      const delaySec = originalRequest._aiRetryCount * 2; // 2s, 4s, 6s
      console.warn(
        `[http] AI_SERVICE_UNAVAILABLE — retry ${originalRequest._aiRetryCount}/${AI_MAX_RETRIES} in ${delaySec}s`,
        { url: originalRequest.url, status: error.response?.status }
      );
      await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
      return client(originalRequest);
    }

    // Backend sometimes crashes with 500 (plain text) instead of returning 401
    // when it receives an expired/invalid token. Treat this as an auth failure.
    const isBackendCrash =
      error.response?.status === 500 &&
      typeof error.response?.data === 'string' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/') &&
      !originalRequest.url?.includes('/admin/auth/');

    if ((error.response?.status !== 401 && !isBackendCrash) || originalRequest._retry) {
      // Replace the generic axios message with the actual backend message
      const backendMessage = extractBackendMessage(error.response?.data);
      if (backendMessage && error instanceof Error) {
        error.message = backendMessage;
      }
      return Promise.reject(error);
    }

    // Signin/login 401 = wrong credentials — just reject so the form can show inline error
    if (
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/admin/auth/login')
    ) {
      return Promise.reject(error);
    }

    // Refresh token 401 = session expired — clear tokens and redirect to login.
    // Exception: if the user just signed in (tokens are fresh), the 401 is almost
    // certainly a transient backend crash, not real expiry — skip the redirect.
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/admin/auth/refresh')
    ) {
      if ((isSessionFresh() && !isDefinitiveAuthRejection(error)) || skipLoginRedirect) {
        return Promise.reject(error);
      }
      const signingOutTimestamp = sessionStorage.getItem('__signing_out');
      const isSigningOut = signingOutTimestamp && Date.now() - parseInt(signingOutTimestamp, 10) < 5000;
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else if (!isSigningOut) {
        window.location.href = getUserLoginHref();
      }
      return Promise.reject(error);
    }

    const isRefreshing = isAdmin
      ? isRefreshingAdmin
      : isRefreshingUser;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        (isAdmin ? adminQueue : userQueue).push({
          resolve,
          reject,
        });
      }).then(() => client(originalRequest));
    }

    originalRequest._retry = true;
    if (isAdmin) {
      isRefreshingAdmin = true;
    } else {
      isRefreshingUser = true;
    }

    try {
      // Use proxy routes that properly forward Set-Cookie headers
      const endpoint = isAdmin
        ? '/api/backend/admin/auth/refresh'
        : '/api/backend/auth/refresh';
      await client.post(
        endpoint,
        {},
        {
          baseURL: "",
          headers: {
            'X-Skip-Login-Redirect': skipLoginRedirect ? 'true' : undefined,
            'X-Tenant-Id': getTenantId(),
          },
        }
      );
      window.dispatchEvent(
        new Event(isAdmin ? 'adminTokenUpdated' : 'tokenUpdated')
      );

      processQueue(null, 'token-refreshed', isAdmin);

      // ✅ Retry original request with new httpOnly cookie
      return client(originalRequest);
    } catch (refreshError: unknown) {
      const refreshStatus =
        (refreshError as { response?: { status?: number } })?.response?.status;
      const refreshBody =
        (refreshError as { response?: { data?: unknown } })?.response?.data;
      // 500 with a plain-string body = backend maintenance_mode crash (not real auth failure)
      const isRefreshBackendCrash =
        refreshStatus === 500 && typeof refreshBody === 'string';

      // Don't redirect if the failure is a transient backend crash OR if the tokens
      // are fresh (user just logged in) — in both cases the session is still valid.
      if (
        (isRefreshBackendCrash || isSessionFresh()) &&
        !isDefinitiveAuthRejection(refreshError)
        || skipLoginRedirect
      ) {
        processQueue(refreshError, null, isAdmin);
        return Promise.reject(refreshError);
      }

      processQueue(refreshError, null, isAdmin);
      const signingOutTimestamp = sessionStorage.getItem('__signing_out');
      const isSigningOut = signingOutTimestamp && Date.now() - parseInt(signingOutTimestamp, 10) < 5000;
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else if (!isSigningOut) {
        window.location.href = getUserLoginHref();
      }
      return Promise.reject(refreshError);
    } finally {
      if (isAdmin) {
        isRefreshingAdmin = false;
      } else {
        isRefreshingUser = false;
      }
    }
  }
);

/* --------------------------------------------------
   Public API
-------------------------------------------------- */

export const httpClient = {
  get: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => client.get<T>(url, config),

  post: <T = unknown>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> =>
    client.post<T>(url, data, config),

  put: <T = unknown>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> =>
    client.put<T>(url, data, config),

  patch: <T = unknown>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> =>
    client.patch<T>(url, data, config),

  delete: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> =>
    client.delete<T>(url, config),

  defaults: client.defaults,
};

export default httpClient;
