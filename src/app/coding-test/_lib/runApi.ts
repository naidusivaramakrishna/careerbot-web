import type { CodingTestLanguage, RunResult } from './types';

// Proxied through our own Next.js API route (/app/api/run-code/route.ts),
// which calls Wandbox server-side and returns a normalised RunResult.
const RUN_PROXY = '/api/run-code';

export class RunApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunApiError';
  }
}

export async function runCode(
  language: CodingTestLanguage,
  code: string,
  examples?: { input: string; output: string }[],
  signal?: AbortSignal,
): Promise<RunResult> {
  let res: Response;
  try {
    res = await fetch(RUN_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, examples }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new RunApiError('Could not reach the code execution service.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RunApiError(
      (body as { error?: string }).error ?? `Code execution service returned ${res.status}.`,
    );
  }

  return res.json() as Promise<RunResult>;
}
