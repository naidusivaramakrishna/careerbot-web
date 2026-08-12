// Composed signOut() — ordered best-effort teardown across all auth surfaces.
//
// Per auth-lifecycle Note (ACCEPT-AS-IS round 7) §4 / §3 sign-out block.
//
// NOT atomic — SecureStore writes are async and can fail. try/finally ensures
// in-memory cleanup AND navigation happen even on SecureStore failure.
//
// Ordering (DO NOT REORDER — Codex round 4-6 caught bugs in earlier versions):
//   1. queryClient.cancelQueries()    — cancel in-flight protected requests
//   2. queryClient.clear()            — drop server cache (no stale-data flash)
//   3. authLifecycle.stop()           — cancel timer, drop AppState listener
//   4. useAuthStore.getState().reset() — clear token state in memory
//   5. setAuthToken(null)             — clear axios default Authorization header
//   6. try { clearAuthSession() }     — clear SecureStore (async, may fail)
//   7. finally { router.replace('/(auth)/signin') } — navigate regardless
//
// If POST /auth/signout (backend signout) is reachable, call it BEFORE step 1
// to invalidate the refresh token server-side. If unreachable (offline), local
// teardown still proceeds — backend blacklisting catches up on next refresh.

import { router } from 'expo-router';

import { httpClient, setAuthToken } from '@/api/client/http';
import { logger } from '@/utils/logger';

import { authLifecycle } from './authLifecycle';
import { useAuthStore } from './authStore';
import { clearAuthSession } from './tokenStorage';
import type { QueryClient } from '@tanstack/react-query';

export interface SignOutDeps {
  queryClient: QueryClient;
}

let deps: SignOutDeps | null = null;

/**
 * Wire the QueryClient (and any future deps) at app bootstrap, before any
 * signOut() call can happen.
 */
export function configureAuthActions(d: SignOutDeps): void {
  deps = d;
}

export async function signOut(): Promise<void> {
  if (!deps) {
    logger.warn('[authActions] signOut called before configureAuthActions; proceeding without QueryClient teardown');
  }

  // 0. (Best-effort) tell backend to blacklist the refresh token.
  //    Catch + swallow — we sign out locally regardless.
  try {
    await httpClient.post('/api/v1/auth/signout');
  } catch {
    // Network/offline/backend-down: skip. Local teardown still proceeds.
  }

  // 1-2. Query teardown — cancel in-flight + clear cache.
  if (deps?.queryClient) {
    await deps.queryClient.cancelQueries();
    deps.queryClient.clear();
  }

  // 3. Lifecycle service — cancel timer + AppState listener + drop refresh promise.
  authLifecycle.stop();

  // 4. Auth store — clear token state in memory.
  useAuthStore.getState().reset();

  // 5. Axios default header — clear so subsequent requests aren't authenticated.
  setAuthToken(null);

  // 6-7. SecureStore + navigate. SecureStore is wrapped in try/finally so
  //      navigation happens even if SecureStore write fails.
  try {
    await clearAuthSession();
  } finally {
    router.replace('/(auth)/signin');
  }
}
