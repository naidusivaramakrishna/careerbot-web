// PR #150 P1: /mock-test/generate was retried by TWO independent layers — the
// AI_SERVICE_UNAVAILABLE retry in lib/http.ts's response interceptor AND
// handleStartSection's own visible retry — which MULTIPLY (4 x 4 = 16 POSTs,
// each able to create a session and spend credits).
//
// These tests pin the HTTP half of the fix: the interceptor still retries by
// default, and `_skipAiRetry: true` in request config turns it off, so a caller
// that owns a visible retry loop can be the only layer retrying.
//
// The real lib/http.ts client is exercised; only the TRANSPORT is replaced, by
// installing a counting adapter on axios.defaults from inside the `axios` module
// mock factory — which runs before http.ts calls axios.create(), so the created
// instance inherits it and every real interceptor still runs on top.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const transport = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('axios', async (importOriginal) => {
  const mod = await importOriginal<typeof import('axios')>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod.default.defaults as any).adapter = (config: any) => {
    const url = String(config.url ?? '');
    transport.calls.push(`${String(config.method).toUpperCase()} ${url}`);
    if (url.includes('/mock-test/generate')) {
      return Promise.reject(
        Object.assign(new Error('Request failed with status code 503'), {
          isAxiosError: true,
          config,
          response: {
            status: 503,
            statusText: 'Service Unavailable',
            data: { error: { error_code: 'AI_SERVICE_UNAVAILABLE', message: 'AI service unavailable' } },
            headers: {},
            config,
          },
        })
      );
    }
    return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
  };
  return mod;
});

import { httpClient } from '@/lib/http';

const generateCalls = () => transport.calls.filter(c => c.includes('/mock-test/generate')).length;

describe('lib/http AI_SERVICE_UNAVAILABLE retry opt-out', { timeout: 60_000 }, () => {
  beforeEach(() => { transport.calls.length = 0; });

  it('retries 3 times by default (4 attempts total) — the behaviour that was multiplying', async () => {
    await expect(httpClient.post('/mock-test/generate', {})).rejects.toBeTruthy();
    // 1 initial + 3 interceptor retries. This is the layer the page must opt out of.
    expect(generateCalls()).toBe(4);
  });

  it('makes exactly ONE attempt when the caller sets _skipAiRetry', async () => {
    await expect(
      httpClient.post('/mock-test/generate', {}, { _skipAiRetry: true })
    ).rejects.toBeTruthy();
    expect(generateCalls()).toBe(1);
  });

  it('still surfaces the AI_SERVICE_UNAVAILABLE body to the caller when retry is skipped', async () => {
    // handleStartSection reads response.data.error.error_code to decide whether to
    // retry, so opting out of the HTTP retry must not swallow or reshape the body.
    await httpClient.post('/mock-test/generate', {}, { _skipAiRetry: true }).then(
      () => { throw new Error('expected rejection'); },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => {
        expect(err.response.status).toBe(503);
        expect(err.response.data.error.error_code).toBe('AI_SERVICE_UNAVAILABLE');
      }
    );
  });
});
