// Google OAuth via expo-auth-session.
//
// Per docs/design/2026-06-03-oauth-providers.md Option 2 (ACCEPT-AS-IS round 5).
//
// Flow:
//   1. mobile calls backend GET /api/v1/auth/google/login-url (existing endpoint)
//      to obtain the prepared authorization URL + state (backend generates state).
//      OR mobile generates state itself via expo-auth-session.
//   2. expo-web-browser opens the URL in a system browser.
//   3. user signs in; Google redirects back to our redirect URI.
//   4. expo-auth-session captures the response (code + state).
//   5. mobile validates returned state matches what it sent (CSRF check).
//   6. mobile POSTs { code, state } to backend /auth/google/callback.
//   7. backend exchanges code for Google tokens, verifies id_token against
//      Google's JWKS, creates/links user, returns CareerBot session tokens.
//   8. mobile commits the session via useAuthStore.setSession() (which triggers
//      the authLifecycle scheduler subscriber automatically).
//
// MOBILE BOUNDARY (per ADR-0009 + the OAuth design's §11.b):
//   - Mobile generates state, validates state on return.
//   - Mobile does NOT verify any Google JWT — backend does that server-side.
//
// Phase 1 task 1.15 (per 04_PHASE_PLAYBOOK.md).

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { httpClient } from '@/api/client/http';
import { setAuthToken } from '@/api/client/http';
import { useAuthStore } from '@/features/auth/authStore';
import { saveAuthSession } from '@/features/auth/tokenStorage';
import { logger } from '@/utils/logger';

import { summarizeOAuthError } from './errors';

// Required for the browser session to resolve correctly on web/native.
WebBrowser.maybeCompleteAuthSession();

interface GoogleLoginUrlResponse {
  url: string;
  state: string;
}

interface CallbackResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  username: string;
}

/**
 * Open the system browser to sign in with Google, wait for the redirect,
 * exchange the code via backend, and commit the resulting session.
 *
 * Returns the new access token on success, or null on user-cancel / failure.
 * On failure the caller (signin screen) shows an error toast and stays put.
 */
export async function signInWithGoogle(): Promise<string | null> {
  try {
    // STEP 1: ask backend for the prepared OAuth URL + state.
    const { data: prep } = await httpClient.get<GoogleLoginUrlResponse>(
      '/api/v1/auth/google/login-url',
    );

    // STEP 2: redirect URI for the in-app browser response.
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'careerbot',
      path: 'auth/google/callback',
    });

    // STEP 3-4: open browser + wait for redirect.
    const result = await WebBrowser.openAuthSessionAsync(prep.url, redirectUri);
    if (result.type !== 'success') {
      // user cancelled or browser closed; not an error
      return null;
    }

    // STEP 5: parse the returned URL for code + state.
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');

    if (!code || !returnedState) {
      logger.error('[oauth/google] callback URL missing code or state');
      return null;
    }

    // STEP 5: CSRF check — state must match what backend issued.
    if (returnedState !== prep.state) {
      logger.error('[oauth/google] state mismatch — possible CSRF; rejecting');
      return null;
    }

    // STEP 6: exchange via backend.
    const { data: tokens } = await httpClient.post<CallbackResponse>(
      '/api/v1/auth/google/callback',
      { code, state: returnedState },
    );

    // STEP 8: commit the session.
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    const session = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type,
      expiresAt,
      username: tokens.username,
    };
    await saveAuthSession(session);
    useAuthStore.getState().setSession(session);
    setAuthToken(tokens.access_token, tokens.token_type);

    return tokens.access_token;
  } catch (error) {
    // PII-safe summary only — see oauth/errors.ts for why (Codex round-1 finding).
    logger.error('[oauth/google] sign-in failed', summarizeOAuthError(error));
    return null;
  }
}
