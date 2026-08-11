// Email-verification mutations.
//
// Phase 1 task 1.14 helper (per 04_PHASE_PLAYBOOK.md).
//
// Backend contract (per careerbot-api develop2):
//   POST /api/v1/auth/email/verify   body: { token }
//                                    returns: { message }
//
//   POST /api/v1/auth/email/resend   body: { email }   (reuses PasswordReset schema)
//                                    returns: { success, message }
//
// The verify endpoint accepts the token from the email verification link.
// The resend endpoint is a convenience — backend doesn't reveal whether the
// email is registered (returns success either way to avoid email enumeration).

import { useMutation } from '@tanstack/react-query';

import { httpClient } from '@/api/client/http';

// ── Verify (POST with token from email link) ─────────────────────────────────

export interface VerifyEmailVariables {
  token: string;
}

interface MessageResponse {
  message: string;
  success?: boolean;
}

async function verifyEmail(vars: VerifyEmailVariables): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>('/api/v1/auth/email/verify', {
    token: vars.token,
  });
  return data;
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail });
}

// ── Resend verification (POST with email) ────────────────────────────────────

export interface ResendVerificationVariables {
  email: string;
}

async function resendVerificationEmail(
  vars: ResendVerificationVariables,
): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>('/api/v1/auth/email/resend', {
    email: vars.email.trim().toLowerCase(),
  });
  return data;
}

export function useResendVerificationEmail() {
  return useMutation({ mutationFn: resendVerificationEmail });
}
