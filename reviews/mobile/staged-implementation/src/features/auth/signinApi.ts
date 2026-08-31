// Sign-in mutation (email/password).
//
// Phase 1 task 1.10 helper (per 04_PHASE_PLAYBOOK.md).
//
// Backend contract (per careerbot-api develop2):
//   POST /api/v1/auth/signin
//   form-data (OAuth2PasswordRequestForm): username, password
//   returns: { access_token, refresh_token, expires_in, token_type, username }
//
// On success: commits the new session to all 4 surfaces, same as OAuth flows.

import { useMutation } from '@tanstack/react-query';

import { httpClient, setAuthToken } from '@/api/client/http';
import { useAuthStore } from '@/features/auth/authStore';
import { saveAuthSession } from '@/features/auth/tokenStorage';

export interface SignInVariables {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  username?: string;
}

async function signIn({ email, password }: SignInVariables): Promise<TokenResponse> {
  // Backend uses OAuth2PasswordRequestForm → form-encoded with username field
  const body = new URLSearchParams();
  body.set('username', email.trim().toLowerCase());
  body.set('password', password);

  const { data } = await httpClient.post<TokenResponse>(
    '/api/v1/auth/signin',
    body.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );
  return data;
}

export function useSignIn() {
  return useMutation({
    mutationFn: signIn,
    onSuccess: async (data) => {
      const expiresAt = Date.now() + data.expires_in * 1000;
      const session = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresAt,
        username: data.username ?? '',
      };
      await saveAuthSession(session);
      useAuthStore.getState().setSession(session);
      setAuthToken(data.access_token, data.token_type);
    },
  });
}
