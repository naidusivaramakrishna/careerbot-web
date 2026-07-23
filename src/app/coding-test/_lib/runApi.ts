import { isAxiosError } from 'axios';

import { httpClient } from '@/lib/http';
import type { CodingTestLanguage, JudgeResponse } from './types';

const BASE = '/coding-test';

// Prevent shared httpClient from redirecting to the login page on 401.
// Practice mode pages render their own inline "sign in to run" message.
const INLINE_AUTH_CONFIG = {
  headers: { 'X-Skip-Login-Redirect': 'true' },
} as const;

export class RunApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RunApiError';
    this.status = status;
  }
}

function toRunError(err: unknown, fallback: string): RunApiError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return new RunApiError('Please sign in to run code.', 401);
    if (status === 404) return new RunApiError('Problem not found.', 404);
    if (status === 503) return new RunApiError('Code execution is temporarily unavailable. Please try again later.', 503);
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail ?? err.message;
    return new RunApiError(detail || fallback, status);
  }
  return new RunApiError(fallback);
}

/** Run against sample (visible) test cases only — always free, no credits. */
export async function runCode(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  timeoutMs = 5000,
): Promise<JudgeResponse> {
  try {
    const { data } = await httpClient.post<JudgeResponse>(
      `${BASE}/run`,
      { problem_slug: problemSlug, language, code, timeout_ms: timeoutMs },
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toRunError(err, 'Failed to run your code.');
  }
}

/** Submit — run against ALL test cases (sample + hidden). Free, no AI grading, no credits. */
export async function submitCode(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  timeoutMs = 5000,
): Promise<JudgeResponse> {
  try {
    const { data } = await httpClient.post<JudgeResponse>(
      `${BASE}/submit`,
      { problem_slug: problemSlug, language, code, timeout_ms: timeoutMs },
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toRunError(err, 'Failed to submit your solution.');
  }
}
