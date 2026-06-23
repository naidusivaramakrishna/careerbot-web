import { CODING_TEST_API } from '@/config/codingTest';
import type {
  CodingProblemDetail,
  CodingProblemListFilters,
  CodingProblemListResponse,
} from './types';

class CodingTestApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CodingTestApiError';
    this.status = status;
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new CodingTestApiError(
      'Unable to reach the coding-test service. Is the API running?',
    );
  }

  if (res.status === 404) {
    throw new CodingTestApiError('Not found', 404);
  }
  if (!res.ok) {
    throw new CodingTestApiError(
      `Request failed (${res.status})`,
      res.status,
    );
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new CodingTestApiError('Received an invalid response from the server.');
  }
}

export async function fetchProblems(
  filters: CodingProblemListFilters = {},
  signal?: AbortSignal,
): Promise<CodingProblemListResponse> {
  const params = new URLSearchParams();
  if (filters.language) params.set('language', filters.language);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.tag) params.set('tag', filters.tag);

  const qs = params.toString();
  const url = qs ? `${CODING_TEST_API.problems}?${qs}` : CODING_TEST_API.problems;
  return getJson<CodingProblemListResponse>(url, signal);
}

export async function fetchProblem(
  slug: string,
  signal?: AbortSignal,
): Promise<CodingProblemDetail> {
  return getJson<CodingProblemDetail>(CODING_TEST_API.problem(slug), signal);
}

export { CodingTestApiError };
