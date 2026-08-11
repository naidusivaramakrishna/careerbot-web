// Single source of truth for refresh-token rotation.
//
// Per auth-lifecycle Note §5.b (ACCEPT-AS-IS round 7).
//
// Called by:
//   - http.ts 401 interceptor                (reactive — on 401 from any non-/auth/* request)
//   - authLifecycle scheduler timer          (proactive — ~60s before expiresAt)
//   - authLifecycle AppState 'active' handler (proactive — on app resume if near-expired)
//   - authLifecycle.start() snapshot-reconcile (on launch if restored token near-expired)
//
// All four paths await the SAME module-local `inFlight` promise. Single-flight guaranteed.
//
// On success: the rotated session is committed to ALL four auth surfaces via
// ordered awaits (NOT literally atomic — these are sequential JS operations):
//   1. SecureStore via saveAuthSession()
//   2. useAuthStore via setSession()  (triggers the scheduler subscriber automatically)
//   3. axios.defaults.headers.common.Authorization via setAuthToken()
//   4. resolves with the new accessToken (for the interceptor's immediate retry)
//
// Partial-failure semantics (per Note §5.b round 5/6):
//   - If step 1 (SecureStore) throws → entire refresh fails; in-memory stays on old session.
//     Caller sees null and applies its per-caller policy.
//   - If step 2 or 3 throws AFTER step 1 succeeded → SecureStore is ahead of memory.
//     On next session restore the new tokens hydrate correctly. Mid-session, the
//     next 401 retriggers refresh. No security regression — old token is invalid
//     server-side anyway, so stale-default-header requests just get 401 and retry.

import axios from 'axios';

import { httpClient, setAuthToken } from '@/api/client/http';

import { useAuthStore } from './authStore';
import { getAuthSession, saveAuthSession, type AuthSession } from './tokenStorage';

let inFlight: Promise<string | null> | null = null;

export async function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

async function doRefresh(): Promise<string | null> {
  const session = await getAuthSession();
  if (!session?.refreshToken) return null;

  try {
    // Direct axios call, bypassing the httpClient interceptor by design
    // (the interceptor skips /auth/refresh URLs, but we use raw axios so
    // we can't even accidentally re-enter the interceptor).
    const response = await axios.post<RefreshResponse>(
      `${httpClient.defaults.baseURL}/api/v1/auth/refresh`,
      { refresh_token: session.refreshToken },
      {
        headers: {
          'X-Tenant-Id': httpClient.defaults.headers.common['X-Tenant-Id'] as string,
        },
      },
    );

    const { access_token, refresh_token, expires_in, token_type } = response.data;
    const expiresAt = Date.now() + expires_in * 1000;

    const newSession: AuthSession = {
      ...session,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      tokenType: token_type,
    };

    // Commit to ALL four surfaces, in order. See Note §5.b round-4 fix.
    await saveAuthSession(newSession);                      // 1. SecureStore (await — async)
    useAuthStore.getState().setSession(newSession);         // 2. Zustand     (triggers scheduler)
    setAuthToken(access_token, token_type);                 // 3. axios default header
    return access_token;                                    // 4. interceptor retry token
  } catch {
    // Caller MUST handle null return per the per-caller policy documented
    // at the top of this file. Do not log refresh failures here — callers
    // log with their own context.
    return null;
  }
}
