// Explicit bootstrap lifecycle service for auth.
//
// Per auth-lifecycle Note (ACCEPT-AS-IS round 7) §3 Option D.
//
// Called once from app/_layout.tsx AFTER restoreSession() resolves:
//
//   await restoreSession();
//   registerSignOutHandler(signOut);                          // wire http.ts
//   configureAuthActions({ queryClient });                    // wire authActions
//   await authLifecycle.start({ queryClient, signOut });      // <-- this file
//   // Only NOW release the protected UI gate.
//
// Behavior:
//   - start() performs IMMEDIATE SNAPSHOT RECONCILIATION (read current
//     useAuthStore.expiresAt, schedule from it) BEFORE subscribing for future
//     changes. This closes the round-3 bug where naïve subscribe-only missed
//     the restore-time expiresAt.
//   - On launch with a near-expired token, awaits refreshSession() before
//     returning. On refresh-failure at launch, calls deps.signOut() and
//     returns WITHOUT releasing the UI gate.
//   - Scheduler timer + AppState 'active' listener both call refreshSession()
//     (the shared single-flight). On their failure: log + wait for next 401.
//   - stop() is idempotent and tears down ALL three subscriptions/timers.

import { AppState, type NativeEventSubscription } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';

import { logger } from '@/utils/logger';

import { useAuthStore } from './authStore';
import { refreshSession } from './refreshSession';

export interface StartDeps {
  queryClient: QueryClient;
  signOut: () => Promise<void>;
}

type ReconcileOutcome = 'ok' | 'refresh-failed';

const REFRESH_LEAD_TIME_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let storeUnsubscribe: (() => void) | null = null;
let started = false;

async function reconcileFromExpiresAt(expiresAt: number | null): Promise<ReconcileOutcome> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (!expiresAt) return 'ok';

  const now = Date.now();

  // Already expired or near-expired at the snapshot moment.
  if (expiresAt - now < REFRESH_LEAD_TIME_MS) {
    const newToken = await refreshSession();
    return newToken ? 'ok' : 'refresh-failed';
  }

  // Schedule for REFRESH_LEAD_TIME_MS before expiry.
  const delay = expiresAt - now - REFRESH_LEAD_TIME_MS;
  timer = setTimeout(async () => {
    const newToken = await refreshSession();
    if (!newToken) {
      // Scheduled mid-session refresh failed. Don't force sign-out — let the
      // next API call's 401 trigger the canonical sign-out path via the
      // interceptor's onSignOut hook (registered separately at bootstrap).
      logger.warn(
        '[authLifecycle] scheduled refresh failed; awaiting next 401 to trigger sign-out',
      );
    }
  }, delay);

  return 'ok';
}

async function start(deps: StartDeps): Promise<void> {
  if (started) return;
  started = true;

  // STEP 1: snapshot reconciliation — read current state BEFORE subscribing.
  const { expiresAt, accessToken } = useAuthStore.getState();
  if (accessToken) {
    const outcome = await reconcileFromExpiresAt(expiresAt);
    if (outcome === 'refresh-failed') {
      // Launch-time refresh failed. Sign out fully BEFORE the UI gate releases.
      // Reset `started` so a re-start after re-auth works.
      started = false;
      await deps.signOut();
      return;
    }
  }

  // STEP 2: subscribe to FUTURE expiresAt changes (e.g. after refresh, sign-in).
  // subscribeWithSelector returns an unsubscribe function.
  storeUnsubscribe = useAuthStore.subscribe(
    (state) => state.expiresAt,
    (newExpiresAt) => {
      void reconcileFromExpiresAt(newExpiresAt);
    },
  );

  // STEP 3: AppState listener — on resume, proactively refresh if near-expired.
  appStateSub = AppState.addEventListener('change', async (next) => {
    if (next !== 'active') return;
    const currentExpiresAt = useAuthStore.getState().expiresAt;
    if (!currentExpiresAt || currentExpiresAt - Date.now() >= REFRESH_LEAD_TIME_MS) {
      return;
    }
    const newToken = await refreshSession();
    if (!newToken) {
      // Proactive refresh on resume failed. Same policy as scheduler — log
      // + wait for next 401. UX: brief stale UI; canonical sign-out fires
      // via the interceptor's onSignOut.
      logger.warn(
        '[authLifecycle] AppState-active proactive refresh failed; awaiting next 401',
      );
    }
  });
}

function stop(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  appStateSub?.remove();
  appStateSub = null;
  started = false;
}

export const authLifecycle = {
  start,
  stop,
};
