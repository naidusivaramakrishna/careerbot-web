// PR #150 P1: TWO retry layers were stacked on POST /mock-test/generate — the
// AI_SERVICE_UNAVAILABLE retry inside lib/http.ts's response interceptor (3
// retries, 2s/4s/6s) AND handleStartSection's own visible retry (3 retries,
// 2s/4s/6s). They MULTIPLY: up to 16 POSTs over ~60s, and each POST can create a
// session and spend the candidate's credits.
//
// This test counts ACTUAL POST attempts reaching the transport. The page keeps
// its retry loop (it is the one with a toast and a Skip affordance); the HTTP
// layer opts out via _skipAiRetry (set in api/mockTestApi.ts). Expected total
// is therefore 4 (1 initial + 3 page retries), not 16.
//
// Nothing between the component and the socket is stubbed: the real
// generateMockTest, the real httpClient and all of its real interceptors run.
// Only the TRANSPORT is replaced, by installing a counting adapter on
// axios.defaults from inside the `axios` module mock factory — that factory runs
// before lib/http.ts calls axios.create(), so the instance inherits it.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const transport = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('axios', async (importOriginal) => {
  const mod = await importOriginal<typeof import('axios')>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod.default.defaults as any).adapter = (config: any) => {
    const url = String(config.url ?? '');
    transport.calls.push(`${String(config.method).toUpperCase()} ${url}`);
    if (url.includes('/mock-test/generate')) {
      // A persistently unavailable AI service. 503 (not 500) keeps this clear of
      // http.ts's "backend crashed with a plain-text 500" auth-failure branch.
      return Promise.reject(
        Object.assign(new Error('Request failed with status code 503'), {
          isAxiosError: true,
          config,
          response: {
            status: 503,
            statusText: 'Service Unavailable',
            // Shape matters: handleStartSection reads data.error.error_code, and
            // http.ts's interceptor substring-matches the serialised body.
            data: { error: { error_code: 'AI_SERVICE_UNAVAILABLE', message: 'AI service unavailable' } },
            headers: {},
            config,
          },
        })
      );
    }
    // Everything else the page touches on mount (GET /mock-test/active-session).
    return Promise.resolve({ data: { data: null }, status: 200, statusText: 'OK', headers: {}, config });
  };
  return mod;
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'custom-test' }),
  useSearchParams: () => new URLSearchParams('categories=arithmetic&difficulty=easy&parentSessionId=parent-1'),
}));
vi.mock('@/hooks/useAttemptRecorder', () => ({
  useAttemptRecorder: () => ({
    isRecording: true, status: 'recording', fileExtension: 'webm',
    start: vi.fn(async () => {}), stop: vi.fn(async () => null),
  }),
}));

import MockTestPage from '@/app/(interview)/mock-test/[id]/page';

const generateCalls = () => transport.calls.filter(c => c.includes('/mock-test/generate')).length;

describe('mock-test runner: generate retry layers do not multiply', { timeout: 90_000 }, () => {
  beforeEach(() => {
    transport.calls.length = 0;
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('makes at most 4 POSTs to /mock-test/generate against a persistently failing AI service (not 16)', async () => {
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));

    // The page's three retries are scheduled at 2s, 4s and 6s after each failure,
    // so the 4th and final attempt lands ~12s in. Wait for it to settle.
    await waitFor(() => expect(generateCalls()).toBe(4), { timeout: 40_000, interval: 250 });

    // Then hold still well past the longest backoff (6s) to prove nothing else is
    // queued. If the HTTP interceptor were still retrying, each of the page's 4
    // attempts would fan out to 4 transport calls and this would climb toward 16.
    await new Promise(resolve => setTimeout(resolve, 9_000));
    expect(generateCalls()).toBe(4);
    expect(generateCalls()).toBeLessThanOrEqual(4);
  });
});
