// Password-reset mutations (request + confirm).
//
// Phase 1 tasks 1.12 + 1.13 helpers (per 04_PHASE_PLAYBOOK.md).
//
// Backend contract (per careerbot-api develop2):
//   POST  /api/v1/auth/password/reset  body: { email }
//                                      returns: { message }
//     → request a reset link; backend emails the link with a token
//
//   PATCH /api/v1/auth/password/reset  body: { token, new_password }
//                                      returns: { message }
//     → confirm reset with the token from the email link
//
// NOTE: backend uses PATCH for confirm (NOT POST). See
// BACKEND_REALITY_CHECK_2026-06-04.txt for the discovery.

import { useMutation } from '@tanstack/react-query';

import { httpClient } from '@/api/client/http';

// ── Request reset ────────────────────────────────────────────────────────────

export interface RequestResetVariables {
  email: string;
}

interface MessageResponse {
  message: string;
  success?: boolean;
}

async function requestPasswordReset(vars: RequestResetVariables): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>('/api/v1/auth/password/reset', {
    email: vars.email.trim().toLowerCase(),
  });
  return data;
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

// ── Confirm reset (PATCH — not POST) ─────────────────────────────────────────

export interface ConfirmResetVariables {
  token: string;
  new_password: string;
}

async function confirmPasswordReset(vars: ConfirmResetVariables): Promise<MessageResponse> {
  const { data } = await httpClient.patch<MessageResponse>('/api/v1/auth/password/reset', {
    token: vars.token,
    new_password: vars.new_password,
  });
  return data;
}

export function useConfirmPasswordReset() {
  return useMutation({ mutationFn: confirmPasswordReset });
}
