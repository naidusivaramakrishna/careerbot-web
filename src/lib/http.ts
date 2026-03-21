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

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

const isAdminRequest = (url?: string): boolean =>
  url?.includes('/admin/') || false;

const clearAllTokens = () => {
  if (typeof window === 'undefined') return;
  // ✅ Backend clears httpOnly cookies automatically
  // Works for both user and admin requests
  sessionStorage.clear();
  localStorage.removeItem('token_last_refreshed_at');
  clearCorrelationId();
};

/* --------------------------------------------------
   Axios Instance
-------------------------------------------------- */

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Enable httpOnly cookie sending/receiving
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
   Response Interceptor
-------------------------------------------------- */

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAdmin = isAdminRequest(originalRequest?.url);

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Signin/login 401 = wrong credentials — just reject so the form can show inline error
    if (
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/admin/auth/login')
    ) {
      return Promise.reject(error);
    }

    // Refresh token 401 = session expired — clear tokens and redirect to login
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/admin/auth/refresh')
    ) {
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/?showLogin=true';
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
    isAdmin ? (isRefreshingAdmin = true) : (isRefreshingUser = true);

    try {
      const endpoint = isAdmin
        ? '/admin/auth/refresh'
        : '/auth/refresh';
      await client.post(endpoint);
      window.dispatchEvent(
        new Event(isAdmin ? 'adminTokenUpdated' : 'tokenUpdated')
      );

      processQueue(null, 'token-refreshed', isAdmin);

      // ✅ Retry original request with new httpOnly cookie
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null, isAdmin);
      clearAllTokens();
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/?showLogin=true';
      }
      return Promise.reject(refreshError);
    } finally {
      isAdmin
        ? (isRefreshingAdmin = false)
        : (isRefreshingUser = false);
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
    data?: Record<string, unknown>,
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
