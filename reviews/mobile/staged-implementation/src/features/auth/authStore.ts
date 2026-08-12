// Zustand store for auth/session client state.
//
// Per auth-lifecycle Note (ACCEPT-AS-IS round 7) Option D + ADR-007:
//   - This store holds TOKENS + SESSION LIFECYCLE state only.
//   - User identity / profile / plan tier lives in TanStack Query (server cache).
//   - Side effects (refresh timer, AppState listener) live in authLifecycle.ts,
//     NOT here. Store actions stay pure state transitions.
//
// Reference: docs/design/notes/2026-06-03-auth-lifecycle-orchestration.md §3 Option D.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { AuthSession } from './tokenStorage';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  expiresAt: number | null;
  username: string;

  /** True when SecureStore restore has resolved (regardless of session presence). */
  isHydrated: boolean;

  /** Derived: is the user signed in (token present)? */
  isSignedIn: boolean;
}

interface AuthActions {
  /** Replace the session in-memory (called by signin, refresh, restore). */
  setSession: (session: AuthSession) => void;

  /** Mark hydration complete (called by sessionRestore once on launch). */
  markHydrated: () => void;

  /** Clear all auth state in-memory (called by signOut). */
  reset: () => void;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  tokenType: 'bearer',
  expiresAt: null,
  username: '',
  isHydrated: false,
  isSignedIn: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setSession: (session) =>
      set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt,
        username: session.username,
        isSignedIn: Boolean(session.accessToken),
      }),

    markHydrated: () => set({ isHydrated: true }),

    reset: () =>
      set({
        accessToken: null,
        refreshToken: null,
        tokenType: 'bearer',
        expiresAt: null,
        username: '',
        isSignedIn: false,
        // NOTE: isHydrated stays true — once hydrated, we don't un-hydrate.
      }),
  })),
);
