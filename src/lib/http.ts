import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

// Determine if current request is for admin based on URL
const isAdminRequest = (url?: string): boolean => {
  return url?.includes('/admin/') || false;
};

const getToken = (isAdmin: boolean = false): string | null => {
  if (typeof window !== 'undefined') {
    const tokenKey = isAdmin ? 'admin_access_token' : 'access_token';
    return Cookies.get(tokenKey) || localStorage.getItem(tokenKey);
  }
  return null;
};

const getRefreshToken = (isAdmin: boolean = false): string | null => {
  if (typeof window !== 'undefined') {
    const tokenKey = isAdmin ? 'admin_refresh_token' : 'refresh_token';
    return Cookies.get(tokenKey) || localStorage.getItem(tokenKey);
  }
  return null;
};

const clearAllTokens = (isAdmin: boolean = false) => {
  if (typeof window !== 'undefined') {
    if (isAdmin) {
      // Clear admin tokens
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('admin_role');
      Cookies.remove('admin_access_token');
      Cookies.remove('admin_refresh_token');
    } else {
      // Clear user tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }
    sessionStorage.clear();
  }
};

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let isAdminRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];
let adminFailedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null, isAdmin: boolean = false) => {
  const queue = isAdmin ? adminFailedQueue : failedQueue;
  queue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  if (isAdmin) {
    adminFailedQueue = [];
  } else {
    failedQueue = [];
  }
};

// Request interceptor - Add appropriate token based on request type
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isAdmin = isAdminRequest(config.url);
    const token = getToken(isAdmin);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CACHE BUSTING: Add timestamp to GET requests to prevent caching
    if (config.method?.toLowerCase() === 'get') {
      const separator = config.url?.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }

    // Disable axios cache
    if (config.headers) {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh separately for user and admin
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAdmin = isAdminRequest(originalRequest.url);

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry on login/refresh endpoints
      if (originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/signin') ||
        originalRequest.url?.includes('/admin/auth/login') ||
        originalRequest.url?.includes('/admin/auth/refresh')) {
        clearAllTokens(isAdmin);
        if (typeof window !== 'undefined') {
          if (isAdmin) {
            window.location.href = '/admin/login';
          } else {
            window.dispatchEvent(new Event('openLoginModal'));
          }
        }
        return Promise.reject(error);
      }

      // Check if already refreshing
      const currentlyRefreshing = isAdmin ? isAdminRefreshing : isRefreshing;

      if (currentlyRefreshing) {
        return new Promise((resolve, reject) => {
          if (isAdmin) {
            adminFailedQueue.push({ resolve, reject });
          } else {
            failedQueue.push({ resolve, reject });
          }
        })
          .then(() => {
            originalRequest._retry = true;
            return client(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;

      if (isAdmin) {
        isAdminRefreshing = true;
      } else {
        isRefreshing = true;
      }

      const refreshToken = getRefreshToken(isAdmin);

      if (!refreshToken) {
        clearAllTokens(isAdmin);
        if (isAdmin) {
          isAdminRefreshing = false;
        } else {
          isRefreshing = false;
        }
        if (typeof window !== 'undefined') {
          if (isAdmin) {
            window.location.href = '/admin/login';
          } else {
            window.dispatchEvent(new Event('openLoginModal'));
          }
        }
        return Promise.reject(error);
      }

      try {
        const refreshEndpoint = isAdmin ? '/admin/auth/refresh' : '/auth/refresh';
        const response = await axios.post(`${BASE_URL}${refreshEndpoint}`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        if (typeof window !== 'undefined') {
          const accessTokenKey = isAdmin ? 'admin_access_token' : 'access_token';
          const refreshTokenKey = isAdmin ? 'admin_refresh_token' : 'refresh_token';

          localStorage.setItem(accessTokenKey, access_token);
          localStorage.setItem(refreshTokenKey, new_refresh_token);

          Cookies.set(accessTokenKey, access_token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          Cookies.set(refreshTokenKey, new_refresh_token, {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          const eventName = isAdmin ? 'adminTokenUpdated' : 'tokenUpdated';
          window.dispatchEvent(new Event(eventName));
        }

        processQueue(null, access_token, isAdmin);

        if (isAdmin) {
          isAdminRefreshing = false;
        } else {
          isRefreshing = false;
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null, isAdmin);

        if (isAdmin) {
          isAdminRefreshing = false;
        } else {
          isRefreshing = false;
        }

        clearAllTokens(isAdmin);

        if (typeof window !== 'undefined') {
          if (isAdmin) {
            window.location.href = '/admin/login';
          } else {
            window.dispatchEvent(new Event('openLoginModal'));
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const httpClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.get<T>(url, config);
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.post<T>(url, data, config);
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.put<T>(url, data, config);
  },
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.patch<T>(url, data, config);
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.delete<T>(url, config);
  },
};

export default httpClient;