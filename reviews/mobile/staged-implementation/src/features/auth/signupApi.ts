// Sign-up mutation.
//
// Phase 1 task 1.11 helper (per 04_PHASE_PLAYBOOK.md).
//
// Backend contract (per careerbot-api develop2):
//   POST /api/v1/auth/signup
//   body: { email, password, username, full_name }
//   returns: { access_token, refresh_token, expires_in, token_type, username }
//
// On success: commits the new session (same as signin).
// On 4xx: caller (signup screen) extracts error.response.data via
//         getApiErrorMessage from @/api/client/errors and shows toast.

import { useMutation } from '@tanstack/react-query';

import { httpClient, setAuthToken } from '@/api/client/http';
import { useAuthStore } from '@/features/auth/authStore';
import { saveAuthSession } from '@/features/auth/tokenStorage';

export interface SignUpVariables {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  username?: string;
}

async function signUp(vars: SignUpVariables): Promise<TokenResponse> {
  const { data } = await httpClient.post<TokenResponse>('/api/v1/auth/signup', {
    email: vars.email.trim().toLowerCase(),
    password: vars.password,
    username: vars.username.trim(),
    full_name: vars.full_name.trim(),
  });
  return data;
}

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
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
