// LinkedIn OAuth via expo-auth-session.
//
// Per docs/design/2026-06-03-oauth-providers.md Option 2 (ACCEPT-AS-IS round 5).
//
// Same flow shape as google.ts (see that file for the step-by-step).
// LinkedIn endpoints from src/types/contracts/endpoints.ts:
//   GET  /api/v1/auth/linkedin/login-url   → returns { url, state }
//   POST /api/v1/auth/linkedin/callback    → returns Token
//
// Phase 1 task 1.16 (per 04_PHASE_PLAYBOOK.md).

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { httpClient } from '@/api/client/http';
import { setAuthToken } from '@/api/client/http';
import { useAuthStore } from '@/features/auth/authStore';
import { saveAuthSession } from '@/features/auth/tokenStorage';
import { logger } from '@/utils/logger';

import { summarizeOAuthError } from './errors';

WebBrowser.maybeCompleteAuthSession();

interface LinkedInLoginUrlResponse {
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

export async function signInWithLinkedIn(): Promise<string | null> {
  try {
    const { data: prep } = await httpClient.get<LinkedInLoginUrlResponse>(
      '/api/v1/auth/linkedin/login-url',
    );

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'careerbot',
      path: 'auth/linkedin/callback',
    });

    const result = await WebBrowser.openAuthSessionAsync(prep.url, redirectUri);
    if (result.type !== 'success') return null;

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');

    if (!code || !returnedState) {
      logger.error('[oauth/linkedin] callback URL missing code or state');
      return null;
    }
    if (returnedState !== prep.state) {
      logger.error('[oauth/linkedin] state mismatch — possible CSRF; rejecting');
      return null;
    }

    const { data: tokens } = await httpClient.post<CallbackResponse>(
      '/api/v1/auth/linkedin/callback',
      { code, state: returnedState },
    );

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
    // PII-safe summary only — see oauth/errors.ts (Codex round-1 finding).
    logger.error('[oauth/linkedin] sign-in failed', summarizeOAuthError(error));
    return null;
  }
}
