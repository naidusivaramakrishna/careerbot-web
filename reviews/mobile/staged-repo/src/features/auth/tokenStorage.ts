// SecureStore-backed token storage. iOS Keychain, Android EncryptedSharedPreferences.
//
// Ported from POC: src/storage/authStorage.js.
// IMPROVEMENT vs POC: single JSON blob under one key for atomicity. The POC
// used five separate SecureStore keys, which meant a crash between calls
// could leave the session in a half-written state.
//
// MIGRATION NOTE: when porting users from the POC, write a one-time read
// from the old 5-key format and migrate to the new single-key format on
// first launch of v1. (Only matters if the POC has shipped to users.)

import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'careerbot_auth_session';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number | null;
  username: string;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.refreshToken) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: parsed.tokenType ?? 'bearer',
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
      username: parsed.username ?? '',
    };
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
