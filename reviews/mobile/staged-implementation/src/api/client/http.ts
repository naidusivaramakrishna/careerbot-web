// Axios HTTP client + production HTTPS guard + 401-refresh-via-shared-module + onSignOut hook.
//
// CHANGES vs original (per auth-lifecycle Note round 6-7 fixes):
//   - REMOVED local `inFlightRefresh` + `registerRefreshHandler`.
//     Single-flight refresh now lives in @/features/auth/refreshSession.
//   - ADDED `registerSignOutHandler` hook. On 401 + failed refresh, the
//     interceptor calls onSignOut() to trigger canonical sign-out. This makes
//     the "next 401 triggers canonical sign-out" policy mechanically enforced.
//
// PRESERVED:
//   - HTTPS-only production guard (top-1% defensive code from POC).
//   - Dev-server host resolution (Android emulator → 10.0.2.2).
//   - Tenant header.
//
// Ported from:
//   carerbot POC: src/API/http/httpClient.js + src/uri/uri.js HTTPS guard.
// Reference:
//   docs/design/notes/2026-06-03-auth-lifecycle-orchestration.md §5.b + §3 Option D.

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

import { refreshSession } from '@/features/auth/refreshSession';
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

// ── 401-refresh-via-shared-module + onSignOut hook ──────────────────────────
//
// Round-6 fix: on refresh failure, invoke onSignOut() to trigger canonical
// sign-out via the registered handler. Eliminates the contract gap where the
// doc said "next 401 triggers canonical sign-out" but the code only rejected.

let onSignOut: (() => Promise<void>) | null = null;

/**
 * Wired ONCE at app bootstrap from app/_layout.tsx, after authActions.signOut
 * exists. Best practice: pass the actual signOut function from
 * '@/features/auth/authActions' so the interceptor and the signOut composition
 * are guaranteed to use the same canonical path.
 */
export function registerSignOutHandler(fn: (() => Promise<void>) | null): void {
  onSignOut = fn;
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

    // Refresh-on-401 via shared single-flight module. Skip self-recursive
    // paths (refresh itself + signin which authenticates without an existing
    // session).
    if (
      status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/signin') &&
      !original.url?.includes('/auth/signout')
    ) {
      original._retry = true;
      const newToken = await refreshSession();
      if (newToken) {
        // Retry the original request with the fresh token explicitly attached
        // (axios default header is also updated by refreshSession's commit,
        // but we set it on the retry to be safe).
        original.headers = original.headers ?? {};
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return httpClient(original);
      }

      // Refresh failed → canonical sign-out. The interceptor closes the loop
      // that the scheduler/AppState handlers leave open (they log + wait for
      // the next 401, which is this).
      if (onSignOut) {
        try {
          await onSignOut();
        } catch (signOutError) {
          logger.error('[HttpClient] onSignOut handler threw:', signOutError);
          // Best-effort — proceed to reject. Local state might be inconsistent
          // but the user will be forced to sign in again on the next app open.
        }
      }
    }

    return Promise.reject(error);
  },
);

export default httpClient;
