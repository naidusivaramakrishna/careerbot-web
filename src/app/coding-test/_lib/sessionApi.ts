import { isAxiosError } from 'axios';
import { httpClient } from '@/lib/http';
import type { CodingTestLanguage } from './types';

const BASE = '/coding-test/sessions';

const INLINE_AUTH_CONFIG = {
  headers: { 'X-Skip-Login-Redirect': 'true' },
} as const;

export class SessionApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SessionApiError';
    this.status = status;
  }
}

function toSessionError(err: unknown, fallback: string): SessionApiError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail ?? err.message;
    return new SessionApiError(detail || fallback, status);
  }
  return new SessionApiError(fallback);
}

export type AssessmentSessionStatus = 'active' | 'submitted' | 'expired';

export interface AssessmentSession {
  session_id: string;
  problem_slug: string;
  language: CodingTestLanguage;
  expires_at: string; // ISO 8601
  status: AssessmentSessionStatus;
}

/** POST /coding-test/sessions — start a new timed assessment session. */
export async function createSession(
  problemSlug: string,
  language: CodingTestLanguage,
): Promise<AssessmentSession> {
  try {
    const { data } = await httpClient.post<AssessmentSession>(
      BASE,
      { problem_slug: problemSlug, language },
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toSessionError(err, 'Failed to start assessment session.');
  }
}

/** PATCH /coding-test/sessions/{id}/draft — persist the current editor state. Silent fire-and-forget. */
export async function patchDraft(
  sessionId: string,
  code: string,
  language: CodingTestLanguage,
): Promise<void> {
  try {
    await httpClient.patch(
      `${BASE}/${sessionId}/draft`,
      { code, language },
      INLINE_AUTH_CONFIG,
    );
  } catch (err) {
    throw toSessionError(err, 'Failed to save draft.');
  }
}

/** POST /coding-test/sessions/{id}/submit — force-submit at timer expiry. */
export async function submitSession(sessionId: string): Promise<AssessmentSession> {
  try {
    const { data } = await httpClient.post<AssessmentSession>(
      `${BASE}/${sessionId}/submit`,
      {},
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toSessionError(err, 'Failed to submit session.');
  }
}

/** GET /coding-test/sessions/{id} — check current session status. */
export async function getSession(sessionId: string): Promise<AssessmentSession> {
  try {
    const { data } = await httpClient.get<AssessmentSession>(
      `${BASE}/${sessionId}`,
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toSessionError(err, 'Failed to fetch session.');
  }
}
