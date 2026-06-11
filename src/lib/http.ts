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

// True if the user logged in (or last refreshed) within the past 2 minutes.
// A failed refresh within this window is almost certainly a transient backend
// issue, not real session expiry — so we skip the logout redirect.
const LAST_REFRESH_KEY = 'token_last_refreshed_at';
const isSessionFresh = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ts = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
  return ts > 0 && Date.now() - ts < 2 * 60 * 1000;
};

const clearAllTokens = () => {
  if (typeof window === 'undefined') return;
  // ✅ Backend clears httpOnly cookies automatically
  // Works for both user and admin requests
  sessionStorage.clear();
  localStorage.removeItem('token_last_refreshed_at');
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

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAdmin = isAdminRequest(originalRequest?.url);
    const skipAuthRedirect =
      originalRequest?.headers?.get?.('X-Skip-Auth-Redirect') === 'true' ||
      originalRequest?.headers?.['X-Skip-Auth-Redirect'] === 'true';

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
      if (isSessionFresh()) {
        return Promise.reject(error);
      }
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
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
      const endpoint = isAdmin
        ? '/admin/auth/refresh'
        : '/auth/refresh';
      await client.post(endpoint, {});
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
      if (isRefreshBackendCrash || isSessionFresh()) {
        processQueue(refreshError, null, isAdmin);
        return Promise.reject(refreshError);
      }

      processQueue(refreshError, null, isAdmin);
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
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
