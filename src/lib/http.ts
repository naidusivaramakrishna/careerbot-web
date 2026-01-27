import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';
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

const getToken = (isAdmin = false): string | null => {
  if (typeof window === 'undefined') return null;
  const key = isAdmin ? 'admin_access_token' : 'access_token';
  return Cookies.get(key) || localStorage.getItem(key);
};

const getRefreshToken = (isAdmin = false): string | null => {
  if (typeof window === 'undefined') return null;
  const key = isAdmin ? 'admin_refresh_token' : 'refresh_token';
  return Cookies.get(key) || localStorage.getItem(key);
};

const clearAllTokens = (isAdmin = false) => {
  if (typeof window === 'undefined') return;

  if (isAdmin) {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_role');
    Cookies.remove('admin_access_token');
    Cookies.remove('admin_refresh_token');
  } else {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  }

  sessionStorage.clear();
  clearCorrelationId();
};

/* --------------------------------------------------
   Axios Instance
-------------------------------------------------- */

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
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
    const isAdmin = isAdminRequest(config.url);
    const token = getToken(isAdmin);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

    // Block auth endpoints from retry
    if (
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/admin/auth/login') ||
      originalRequest.url?.includes('/admin/auth/refresh')
    ) {
      clearAllTokens(isAdmin);
      window.location.href = isAdmin
        ? '/admin/login'
        : '/auth/login';
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

    const refreshToken = getRefreshToken(isAdmin);
    if (!refreshToken) {
      clearAllTokens(isAdmin);
      window.location.href = isAdmin
        ? '/admin/login'
        : '/auth/login';
      return Promise.reject(error);
    }

    try {
      const endpoint = isAdmin
        ? '/admin/auth/refresh'
        : '/auth/refresh';

      const res = await axios.post(`${BASE_URL}${endpoint}`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = res.data;

      const accessKey = isAdmin
        ? 'admin_access_token'
        : 'access_token';
      const refreshKey = isAdmin
        ? 'admin_refresh_token'
        : 'refresh_token';

      localStorage.setItem(accessKey, access_token);
      localStorage.setItem(refreshKey, refresh_token);

      Cookies.set(accessKey, access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      Cookies.set(refreshKey, refresh_token, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      window.dispatchEvent(
        new Event(isAdmin ? 'adminTokenUpdated' : 'tokenUpdated')
      );

      processQueue(null, access_token, isAdmin);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null, isAdmin);
      clearAllTokens(isAdmin);
      window.location.href = isAdmin
        ? '/admin/login'
        : '/auth/login';
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
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> =>
    client.post<T>(url, data, config),

  put: <T = unknown>(
    url: string,
    data?: Record<string, unknown>,
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
