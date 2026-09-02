// Axios HTTP client + production HTTPS guard + 401-refresh interceptor.
//
// Ported from POC:
//   src/API/http/httpClient.js (axios instance + setAuthToken)
//   src/uri/uri.js             (the production HTTPS guard — top-1% defensive code)
//
// NEW vs POC:
//   - Response interceptor handles 401 → refresh → retry (single-flight).
//     The POC handled refresh at the screen layer via App.js's useEffect.
//     Centralising in the http layer means every call benefits without
//     screens explicitly knowing about refresh.
//
// SECURITY GUARD (from POC uri.js): in production builds refuse to send
// credentials over plaintext HTTP. A forgotten EXPO_PUBLIC_API_BASE_URL must
// fail loudly, not silently leak tokens.

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

import { logger } from '@/utils/logger';

// ── base URL resolution ─────────────────────────────────────────────────────

const apiPort = process.env.EXPO_PUBLIC_API_PORT ?? '8000';

function getHostFromUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const candidate = value.includes('://') ? value : `http://${value}`;
  const match = candidate.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^/:]+)/);
  return match?.[1] ?? null;
}

function getDevServerHost(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceUrl = (NativeModules as any).SourceCode?.scriptURL;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expoConfig = Constants.expoConfig as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manifest = (Constants as any).manifest;
  const candidates: unknown[] = [
    sourceUrl,
    expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    manifest?.debuggerHost,
    manifest?.hostUri,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  for (const candidate of candidates) {
    const host = getHostFromUrl(candidate);
    if (host) return host;
  }
  return null;
}

function normalizeHostForDevice(host: string): string {
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
  }
  return host;
}

function getDefaultBaseUrl(): string {
  const devHost = __DEV__ ? getDevServerHost() : null;
  const fallback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${normalizeHostForDevice(devHost ?? fallback)}:${apiPort}`;
}

function resolveBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultBaseUrl()).replace(
    /\/+$/,
    '',
  );

  // Production HTTPS guard. In a release build (__DEV__ === false) refuse to
  // send credentials over cleartext — a forgotten EXPO_PUBLIC_API_BASE_URL
  // must fail loudly, not silently leak tokens over http://.
  // (Ported verbatim from POC src/uri/uri.js — top-1% defensive code.)
  const isProduction = typeof __DEV__ !== 'undefined' && !__DEV__;
  if (isProduction && configured.startsWith('http://')) {
    throw new Error(
      `EXPO_PUBLIC_API_BASE_URL must use https:// in production builds. Refusing to send requests over plaintext HTTP (${configured}).`,
    );
  }
  return configured;
}

export const baseUrl = resolveBaseUrl();
export const tenantId = process.env.EXPO_PUBLIC_API_TENANT_ID ?? 'public';

// ── axios instance ──────────────────────────────────────────────────────────

const parsedTimeout = parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT ?? '', 10);
const REQUEST_TIMEOUT =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 10000;

export const httpClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    'X-Tenant-Id': tenantId,
  },
  timeout: REQUEST_TIMEOUT,
});

export function setAuthToken(accessToken: string | null, tokenType: string = 'bearer'): void {
  if (!accessToken) {
    delete httpClient.defaults.headers.common.Authorization;
    return;
  }
  const normalized = tokenType
    ? tokenType.charAt(0).toUpperCase() + tokenType.slice(1)
    : 'Bearer';
  httpClient.defaults.headers.common.Authorization = `${normalized} ${accessToken}`;
}

// ── single-flight 401 → refresh → retry interceptor ─────────────────────────
//
// onUnauthorized is wired in by the auth bootstrap (sessionRestore.ts) so the
// http layer does not import auth code directly (avoids a cycle).

type RefreshFn = () => Promise<string | null>;

let refreshFn: RefreshFn | null = null;
let inFlightRefresh: Promise<string | null> | null = null;

export function registerRefreshHandler(fn: RefreshFn | null): void {
  refreshFn = fn;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = (error.config ?? {}) as RetryConfig;

    if (status && status >= 500) {
      logger.error('[HttpClient] Server error:', status);
    } else if (error.code === 'ECONNABORTED') {
      logger.warn('[HttpClient] Request timed out after', REQUEST_TIMEOUT, 'ms');
    } else if (!error.response) {
      logger.error('[HttpClient] Network error:', error.code ?? error.message);
    }

    // Refresh-on-401 (skip if no handler, already retried, or refresh call itself).
    if (
      status === 401 &&
      refreshFn &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/signin')
    ) {
      original._retry = true;
      inFlightRefresh = inFlightRefresh ?? refreshFn();
      try {
        const newToken = await inFlightRefresh;
        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return httpClient(original);
        }
      } catch {
        // fall through to reject below
      } finally {
        inFlightRefresh = null;
      }
    }

    return Promise.reject(error);
  },
);

export default httpClient;
