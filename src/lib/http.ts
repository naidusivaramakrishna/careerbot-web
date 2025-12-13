// import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// import Cookies from 'js-cookie';

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

// const getToken = (): string | null => {
//   if (typeof window !== 'undefined') {
//     return Cookies.get('access_token') || localStorage.getItem('access_token');
//   }
//   return null;
// };

// const getRefreshToken = (): string | null => {
//   if (typeof window !== 'undefined') {
//     return Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
//   }
//   return null;
// };

// const clearAllTokens = () => {
//   if (typeof window !== 'undefined') {
//     localStorage.clear(); // Clear everything
//     Cookies.remove('access_token');
//     Cookies.remove('refresh_token');
//     // Clear any cached data
//     sessionStorage.clear();
//   }
// };

// const client: AxiosInstance = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// let isRefreshing = false;
// let failedQueue: Array<{
//   resolve: (value?: any) => void;
//   reject: (reason?: any) => void;
// }> = [];

// const processQueue = (error: any, token: string | null = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// // Request interceptor - CRITICAL: Add cache busting for GET requests
// client.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = getToken();
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // CACHE BUSTING: Add timestamp to GET requests to prevent caching
//     if (config.method?.toLowerCase() === 'get') {
//       const separator = config.url?.includes('?') ? '&' : '?';
//       config.url = `${config.url}${separator}_t=${Date.now()}`;
//     }

//     // Disable axios cache
//     if (config.headers) {
//       config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
//       config.headers['Pragma'] = 'no-cache';
//       config.headers['Expires'] = '0';
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor
// client.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/signin')) {
//         clearAllTokens();
//         if (typeof window !== 'undefined') {
//           window.location.href = '/auth/login';
//         }
//         return Promise.reject(error);
//       }

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(() => {
//             originalRequest._retry = true;
//             return client(originalRequest);
//           })
//           .catch(err => {
//             return Promise.reject(err);
//           });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       const refreshToken = getRefreshToken();

//       if (!refreshToken) {
//         clearAllTokens();
//         if (typeof window !== 'undefined') {
//           window.location.href = '/auth/login';
//         }
//         return Promise.reject(error);
//       }

//       try {
//         const response = await axios.post(`${BASE_URL}/auth/refresh`, {
//           refresh_token: refreshToken
//         });

//         const { access_token, refresh_token: new_refresh_token } = response.data;

//         if (typeof window !== 'undefined') {
//           localStorage.setItem('access_token', access_token);
//           localStorage.setItem('refresh_token', new_refresh_token);

//           Cookies.set('access_token', access_token, {
//             expires: 7,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict'
//           });
//           Cookies.set('refresh_token', new_refresh_token, {
//             expires: 30,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict'
//           });

//           window.dispatchEvent(new Event('tokenUpdated'));
//         }

//         processQueue(null, access_token);
//         isRefreshing = false;

//         originalRequest.headers.Authorization = `Bearer ${access_token}`;
//         return client(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         isRefreshing = false;
//         clearAllTokens();
//         if (typeof window !== 'undefined') {
//           window.location.href = '/auth/login';
//         }
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export const httpClient = {
//   get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
//     return client.get<T>(url, config);
//   },
//   post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
//     return client.post<T>(url, data, config);
//   },
//   put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
//     return client.put<T>(url, data, config);
//   },
//   patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
//     return client.patch<T>(url, data, config);
//   },
//   delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
//     return client.delete<T>(url, config);
//   },
// };

// export default httpClient;



import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return Cookies.get('access_token') || localStorage.getItem('access_token');
  }
  return null;
};

const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
  }
  return null;
};

const clearAllTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
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
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CACHE BUSTING: Add timestamp to GET requests
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

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/signin')) {
        clearAllTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
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
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAllTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', new_refresh_token);

          Cookies.set('access_token', access_token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          Cookies.set('refresh_token', new_refresh_token, {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          window.dispatchEvent(new Event('tokenUpdated'));
        }

        processQueue(null, access_token);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAllTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Export httpClient with all methods AND defaults
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
  // ✅ ADD THIS: Expose defaults for debugging
  defaults: client.defaults,
};

export default httpClient;
