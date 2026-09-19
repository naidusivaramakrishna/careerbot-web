import { isAxiosError } from 'axios';

import { httpClient } from '@/lib/http';
import type {
  CodingTestLanguage, ExecuteJobQueued, ExecuteJobRecord,
  JudgeJobRecord, JudgeResponse, JudgeVerdict, SubmitAsyncQueued,
} from './types';

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
    // Abort / cancellation — surface as a distinct case so callers can ignore it.
    if (err.code === 'ERR_CANCELED') {
      return new RunApiError('Request cancelled.', 0);
    }
    // Connection timeout (axios timeout setting exceeded).
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new RunApiError(
        'The server is taking too long to respond. Please check your connection and try again.',
        408,
      );
    }
    // No response received (ERR_NETWORK, DNS failure, CORS, offline, etc.).
    if (!err.response) {
      return new RunApiError(
        'Could not reach the server. Please check your connection and try again.',
        0,
      );
    }
    const status = err.response.status;
    if (status === 401) return new RunApiError('Please sign in to run code.', 401);
    if (status === 404) return new RunApiError('Problem not found.', 404);
    if (status === 503) return new RunApiError('Code execution is temporarily unavailable. Please try again later.', 503);
    const detail = (err.response.data as { detail?: string } | undefined)?.detail ?? err.message;
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

/**
 * Runs visible test cases in parallel on the backend (POST /run-async).
 * The backend now executes all test cases concurrently via asyncio.gather(),
 * so this completes in ~3-5s regardless of test case count — no polling needed.
 */
export async function runAsync(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  timeoutMs = 10000,
): Promise<JudgeResponse> {
  try {
    const { data } = await httpClient.post<JudgeResponse>(
      `${BASE}/run-async`,
      { problem_slug: problemSlug, language, code, timeout_ms: timeoutMs },
      { ...INLINE_AUTH_CONFIG, timeout: 60000 },
    );
    return data;
  } catch (err) {
    throw toRunError(err, 'Failed to run your code.');
  }
}

/** Enqueue a free-form async execution job — no problem slug, no test cases. Returns job_id + stream_url. */
export async function executeCode(
  language: CodingTestLanguage,
  code: string,
  stdin = '',
  timeoutMs = 5000,
): Promise<ExecuteJobQueued> {
  try {
    const { data } = await httpClient.post<ExecuteJobQueued>(
      `${BASE}/execute`,
      { language, code, stdin, timeout_ms: timeoutMs },
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toRunError(err, 'Failed to start code execution.');
  }
}

/** Enqueue an async submit job — returns immediately with a poll URL. */
export async function submitAsync(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  timeoutMs = 5000,
): Promise<SubmitAsyncQueued> {
  try {
    const { data } = await httpClient.post<{ job_id: string; attempt_id: string; poll_url: string }>(
      `${BASE}/submit-async`,
      { problem_slug: problemSlug, language, code, timeout_ms: timeoutMs },
      { ...INLINE_AUTH_CONFIG, timeout: 60000 },
    );
    return {
      job_id: data.job_id,
      attempt_id: data.attempt_id,
      // Construct poll URL using the same base path as other API calls so that
      // httpClient's baseURL prefix is applied correctly (avoids double /api/v1).
      poll_url: `${BASE}/submit-result/${data.job_id}`,
    };
  } catch (err) {
    throw toRunError(err, 'Failed to queue submission.');
  }
}

/**
 * Poll GET /submit-result/{job_id} until status is 'completed' or 'failed'.
 * Calls onProgress on every tick. Resolves with a JudgeResponse built from the
 * flat verdict/passed/total fields returned by the backend.
 */
export async function pollJudgeResult(
  pollUrl: string,
  onProgress?: (record: JudgeJobRecord) => void,
  signal?: AbortSignal,
  intervalMs = 2000,
  maxAttempts = 45, // 45 × 2s = 90 seconds max wait
): Promise<JudgeResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) throw new RunApiError('Submission cancelled.', 0);
    try {
      const { data } = await httpClient.get<JudgeJobRecord>(pollUrl, {
        ...INLINE_AUTH_CONFIG,
        signal,
        timeout: 15000, // 15s per-request — don't let a single poll hang for 2 minutes
      });
      onProgress?.(data);
      if (data.status === 'completed') {
        return {
          verdict: (data.verdict ?? 'no_test_cases') as JudgeVerdict,
          passed:  data.passed ?? 0,
          total:   data.total  ?? 0,
          results: [], // async submit returns summary only — no per-case details
        };
      }
      if (data.status === 'failed') {
        throw new RunApiError(data.error ?? 'Judge job failed.');
      }
    } catch (err) {
      // Re-throw RunApiError (failed status or cancelled) immediately.
      if (err instanceof RunApiError) throw err;
      // A single poll request timed out or had a transient network error — retry.
      if (signal?.aborted) throw new RunApiError('Submission cancelled.', 0);
      // If it's the last attempt, surface the error; otherwise swallow and retry.
      if (attempt === maxAttempts - 1) throw toRunError(err, 'Judge result unavailable — please try again.');
    }
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, intervalMs);
      signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }
  throw new RunApiError('Submission timed out — the judge is taking longer than expected. Please try again.');
}

/** Poll a free-form execute job until done or error. */
export async function pollExecuteResult(
  pollUrl: string,
  signal?: AbortSignal,
  intervalMs = 1500,
): Promise<ExecuteJobRecord> {
  for (;;) {
    if (signal?.aborted) throw new RunApiError('Execution cancelled.', 0);
    const { data } = await httpClient.get<ExecuteJobRecord>(pollUrl, {
      ...INLINE_AUTH_CONFIG,
      signal,
    });
    if (data.status === 'done' || data.status === 'error') return data;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, intervalMs);
      signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }
}

/** Submit — run against ALL test cases (sample + hidden). Free, no AI grading, no credits. */
export async function submitCode(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  timeoutMs = 10000,
): Promise<JudgeResponse> {
  try {
    const { data } = await httpClient.post<JudgeResponse>(
      `${BASE}/submit`,
      { problem_slug: problemSlug, language, code, timeout_ms: timeoutMs },
      { ...INLINE_AUTH_CONFIG, timeout: 90000 },
    );
    return data;
  } catch (err) {
    throw toRunError(err, 'Failed to submit your solution.');
  }
}
