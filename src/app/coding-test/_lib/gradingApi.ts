/**
 * Authenticated grading calls (submit + history).
 *
 * Unlike the PUBLIC catalog client (_lib/api.ts, plain fetch to the API), these
 * require the signed-in user. They go through the shared httpClient, which
 * sends the httpOnly auth cookie (withCredentials), the X-Tenant-Id header, and
 * the access-token refresh flow — and is proxied to careerbot-api via the
 * next.config rewrite (/api/v1/* -> backend). The browser never calls the AI
 * layer directly; careerbot-api is the gateway.
 */
import { isAxiosError } from 'axios';

import { httpClient } from '@/lib/http';
import type {
  CodingProblemListFilters,
  CodingTestLanguage,
  HistoryResponse,
  ProblemWithStatus,
  QuotaResponse,
  SubmitSolutionResponse,
  UserProgressResponse,
} from './types';

const BASE = '/coding-test';

// Still attempt a token refresh on 401, but DON'T let the shared httpClient
// navigate away to the login page — these pages render their own inline
// sign-in prompt on an unauthenticated 401 (see http.ts skipLoginRedirect).
const INLINE_AUTH_CONFIG = {
  headers: { 'X-Skip-Login-Redirect': 'true' },
} as const;

export class GradingApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GradingApiError';
    this.status = status;
  }
}

function toGradingError(err: unknown, fallback: string): GradingApiError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) {
      return new GradingApiError('Please sign in to submit your solution.', 401);
    }
    if (status === 402) {
      return new GradingApiError('You have no grading submissions remaining. Please upgrade your plan.', 402);
    }
    if (status === 404) {
      return new GradingApiError('This problem no longer exists.', 404);
    }
    if (status === 502 || status === 503) {
      return new GradingApiError(
        'The grading service is temporarily unavailable. Please try again.',
        status,
      );
    }
    const detail =
      (err.response?.data as { detail?: string } | undefined)?.detail ||
      err.message;
    return new GradingApiError(detail || fallback, status);
  }
  return new GradingApiError(fallback);
}

export async function fetchProblemsAnnotated(
  filters?: CodingProblemListFilters,
  signal?: AbortSignal,
): Promise<ProblemWithStatus[]> {
  try {
    const { data } = await httpClient.get<ProblemWithStatus[]>(
      `${BASE}/problems/annotated`,
      {
        ...INLINE_AUTH_CONFIG,
        params: {
          ...(filters?.language ? { language: filters.language } : {}),
          ...(filters?.difficulty ? { difficulty: filters.difficulty } : {}),
          ...(filters?.tag ? { tag: filters.tag } : {}),
        },
        signal,
      },
    );
    return data;
  } catch (err) {
    throw toGradingError(err, 'Failed to load annotated problems.');
  }
}

export async function fetchProgress(): Promise<UserProgressResponse> {
  try {
    const { data } = await httpClient.get<UserProgressResponse>(
      `${BASE}/progress`,
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toGradingError(err, 'Failed to load your progress.');
  }
}

export async function mockGrade(
  problemSlug: string,
  language: CodingTestLanguage,
  code: string,
  problemTitle?: string,
): Promise<SubmitSolutionResponse> {
  try {
    const { data } = await httpClient.post<SubmitSolutionResponse>(
      `${BASE}/mock-grade`,
      {
        problem_slug: problemSlug,
        language,
        code,
        ...(problemTitle ? { problem_title: problemTitle } : {}),
      },
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toGradingError(err, 'Failed to get AI grading.');
  }
}

export async function fetchQuota(): Promise<QuotaResponse> {
  try {
    const { data } = await httpClient.get<QuotaResponse>(
      `${BASE}/quota`,
      INLINE_AUTH_CONFIG,
    );
    return data;
  } catch (err) {
    throw toGradingError(err, 'Failed to load quota.');
  }
}

export async function fetchSubmissions(
  page = 1,
  pageSize = 20,
): Promise<HistoryResponse> {
  try {
    const { data } = await httpClient.get<HistoryResponse>(
      `${BASE}/submissions`,
      { ...INLINE_AUTH_CONFIG, params: { page, page_size: pageSize } },
    );
    return data;
  } catch (err) {
    throw toGradingError(err, 'Failed to load submission history.');
  }
}
