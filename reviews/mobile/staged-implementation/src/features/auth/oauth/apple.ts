// Apple Sign In via expo-apple-authentication (NATIVE on iOS).
//
// Per docs/design/2026-06-03-oauth-providers.md Option 2 (ACCEPT-AS-IS round 5).
//
// iOS-ONLY. The Apple button must be HIDDEN on Android per OAuth design §2.
// Use Platform.OS === 'ios' to gate the button rendering in SocialAuthButtons.
//
// Flow (different from Google/LinkedIn — uses the NATIVE Apple sheet):
//   1. mobile generates state + raw nonce (cryptographically random).
//   2. mobile calls AppleAuthentication.signInAsync() with state, nonce (SHA-256 hex),
//      and the requested scopes. Apple presents the native sheet (face/touch ID).
//   3. on success, Apple returns a credential with:
//        - identityToken     (signed JWT proving Apple identity; mobile does NOT
//                              verify it — backend A3 does)
//        - authorizationCode (single-use code for backend exchange)
//        - state             (echoed back; mobile validates it matches what it sent)
//        - fullName          (FIRST-TIME ONLY — null on subsequent sign-ins)
//        - email             (subject to user choice; may be a relay address)
//   4. mobile validates credential.state === sentState (CSRF check).
//   5. mobile POSTs { identityToken, authorizationCode, rawNonce, state, fullName? }
//      to backend /auth/apple/callback.
//   6. backend A3:
//        - verifies identityToken against Apple's JWKS (https://appleid.apple.com/auth/keys)
//        - validates aud claim matches our iOS bundle ID (com.careerbot.mobile)
//        - verifies the nonce claim INSIDE the token matches the raw nonce we sent
//        - exchanges authorizationCode for Apple refresh token (optional)
//        - creates/links user account (treats hide-my-email relay as canonical)
//        - persists fullName on FIRST sign-in only
//        - returns CareerBot session Token
//   7. mobile commits the session.
//
// SECURITY BOUNDARY (per ADR-0009 + OAuth design §11.b):
//   - Mobile generates state, validates state.
//   - Mobile generates raw nonce, forwards it to backend.
//   - Mobile does NOT verify any provider JWT.
//   - Backend A3 verifies nonce claim inside identityToken vs raw nonce.
//
// Phase 1 task 1.17 (per 04_PHASE_PLAYBOOK.md).

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { httpClient, setAuthToken } from '@/api/client/http';
import { useAuthStore } from '@/features/auth/authStore';
import { saveAuthSession } from '@/features/auth/tokenStorage';
import { logger } from '@/utils/logger';

import { summarizeOAuthError } from './errors';

interface CallbackResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  username: string;
}

/**
 * Generate a cryptographically random URL-safe string of `length` bytes
 * (base64-url encoded, no padding). Used for OAuth state and nonce.
 */
async function randomBase64Url(length: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  // Manual base64url encoding (no padding, URL-safe chars).
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = global.btoa
    ? global.btoa(bin)
    : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Compute SHA-256 hex digest. Apple expects the nonce hash, not the raw value.
 * Raw nonce is forwarded to backend; the SHA-256 goes to Apple.
 */
async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

/**
 * Returns true on iOS where Apple Sign In is supported. Android always returns false.
 * Used by SocialAuthButtons to hide the button on Android per OAuth design §2.
 */
export function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return Promise.resolve(false);
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    logger.warn('[oauth/apple] called on non-iOS platform; returning null');
    return null;
  }

  try {
    // STEP 1: generate state + raw nonce.
    const sentState = await randomBase64Url(32);
    const rawNonce = await randomBase64Url(32);
    const hashedNonce = await sha256Hex(rawNonce);

    // STEP 2: open the native Apple sheet.
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      state: sentState,
      nonce: hashedNonce,
    });

    // STEP 4: validate state.
    if (credential.state !== sentState) {
      logger.error('[oauth/apple] state mismatch — possible CSRF; rejecting');
      return null;
    }

    if (!credential.identityToken) {
      logger.error('[oauth/apple] no identityToken in credential');
      return null;
    }

    // STEP 5: forward to backend A3. Mobile sends the RAW nonce (backend
    // verifies the SHA-256 of this matches the nonce claim inside identityToken).
    const fullName = credential.fullName
      ? {
          givenName: credential.fullName.givenName ?? null,
          familyName: credential.fullName.familyName ?? null,
        }
      : null;

    const { data: tokens } = await httpClient.post<CallbackResponse>(
      '/api/v1/auth/apple/callback',
      {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        rawNonce,
        state: sentState,
        fullName,
      },
    );

    // STEP 7: commit the session.
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
    // expo-apple-authentication throws on user-cancel with code ERR_CANCELED.
    // Distinguishing that from real errors:
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'ERR_CANCELED'
    ) {
      // User cancelled — not an error
      return null;
    }
    // PII-safe summary only — see oauth/errors.ts (Codex round-1 finding).
    // CRITICAL for Apple: raw error.config.data contains identityToken,
    // authorizationCode, rawNonce, AND fullName — all sensitive.
    logger.error('[oauth/apple] sign-in failed', summarizeOAuthError(error));
    return null;
  }
}
