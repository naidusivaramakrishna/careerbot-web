// Hydrate the in-memory auth store from SecureStore on app launch.
//
// Per auth-lifecycle Note (ACCEPT-AS-IS round 7).
//
// Called exactly ONCE from app/_layout.tsx before authLifecycle.start().
// Idempotent — calling again after the first call is a no-op.

import { setAuthToken } from '@/api/client/http';

import { useAuthStore } from './authStore';
import { getAuthSession } from './tokenStorage';

let restored = false;

export async function restoreSession(): Promise<void> {
  if (restored) return;
  restored = true;

  try {
    const session = await getAuthSession();
    if (session?.accessToken && session.refreshToken) {
      useAuthStore.getState().setSession(session);
      setAuthToken(session.accessToken, session.tokenType);
    }
  } finally {
    // ALWAYS mark hydrated, even if SecureStore read failed.
    // Otherwise the UI gate never releases.
    useAuthStore.getState().markHydrated();
  }
}
