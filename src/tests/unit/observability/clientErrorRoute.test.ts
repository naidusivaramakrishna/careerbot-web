/**
 * POST /api/internal/client-error: bounded kinds, size limit, rate limit,
 * no user data in the exposition.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/internal/client-error/route';
import {
  MAX_BODY_BYTES,
  RATE_LIMIT_PER_WINDOW,
  resetClientErrorRateLimitForTests,
} from '@/lib/observability/clientErrorLimits';
import { CLIENT_ERROR_KINDS } from '@/lib/observability/clientErrorKind';
import { getWebMetrics, resetWebMetricsForTests } from '@/lib/observability/registry';

const URL_ = 'http://localhost:3000/api/internal/client-error';

function post(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new NextRequest(URL_, {
    method: 'POST',
    body,
    headers: { 'content-type': 'text/plain', ...headers },
    // required by undici when body is a stream
    duplex: 'half',
  } as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

async function kinds(): Promise<Record<string, number>> {
  const m = await getWebMetrics().clientErrors.get();
  return Object.fromEntries(m.values.map((v) => [String(v.labels.kind), v.value]));
}

async function rejected(reason: string): Promise<number> {
  const m = await getWebMetrics().clientErrorsRejected.get();
  return m.values.find((v) => v.labels.reason === reason)?.value ?? 0;
}

describe('POST /api/internal/client-error', () => {
  beforeEach(() => {
    resetWebMetricsForTests();
    resetClientErrorRateLimitForTests();
  });
  afterEach(() => {
    resetWebMetricsForTests();
    resetClientErrorRateLimitForTests();
  });

  it.each(CLIENT_ERROR_KINDS)('accepts kind=%s with 204', async (kind) => {
    const res = await POST(post(JSON.stringify({ kind })));
    expect(res.status).toBe(204);
    expect((await kinds())[kind]).toBe(1);
  });

  it('exposes exactly the three bounded kinds, whatever is posted', async () => {
    for (const kind of ['TypeError', 'js_error ', '../../etc', '', 42, null]) {
      expect((await POST(post(JSON.stringify({ kind })))).status).toBe(400);
    }
    expect(Object.keys(await kinds()).sort()).toEqual([...CLIENT_ERROR_KINDS].sort());
    expect(Object.values(await kinds()).every((v) => v === 0)).toBe(true);
    expect(await rejected('bad_request')).toBe(6);
  });

  it('ignores every field except kind (stores no user data)', async () => {
    const secret = 'user@example.com-stack-at-/dashboard?token=abc';
    const res = await POST(post(JSON.stringify({ kind: 'js_error', message: secret, url: secret })));
    expect(res.status).toBe(204);
    const text = await getWebMetrics().registry.metrics();
    expect(text).not.toContain('example.com');
    expect(text).not.toContain('token=abc');
  });

  it('400 on invalid JSON', async () => {
    expect((await POST(post('{not json'))).status).toBe(400);
    expect((await POST(post(null))).status).toBe(400);
  });

  it('413 when Content-Length declares an oversized body', async () => {
    const big = JSON.stringify({ kind: 'js_error', pad: 'x'.repeat(MAX_BODY_BYTES) });
    const res = await POST(post(big, { 'content-length': String(big.length) }));
    expect(res.status).toBe(413);
    expect((await kinds()).js_error).toBe(0);
    expect(await rejected('too_large')).toBe(1);
  });

  it('413 when an oversized body arrives without a Content-Length (streamed)', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(600));
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(chunk);
        c.enqueue(chunk);
        c.close();
      },
    });
    const res = await POST(post(stream));
    expect(res.status).toBe(413);
    expect(await rejected('too_large')).toBe(1);
  });

  it('403 on a cross-site browser post', async () => {
    const res = await POST(post(JSON.stringify({ kind: 'js_error' }), { 'sec-fetch-site': 'cross-site' }));
    expect(res.status).toBe(403);
    expect((await kinds()).js_error).toBe(0);
  });

  it('429 once the process-wide window is exhausted', async () => {
    for (let i = 0; i < RATE_LIMIT_PER_WINDOW; i++) {
      expect((await POST(post(JSON.stringify({ kind: 'js_error' })))).status).toBe(204);
    }
    const res = await POST(post(JSON.stringify({ kind: 'js_error' })));
    expect(res.status).toBe(429);
    expect((await kinds()).js_error).toBe(RATE_LIMIT_PER_WINDOW);
    expect(await rejected('rate_limited')).toBe(1);
  });

  it('malformed requests do not consume the cap: a valid report still gets 204', async () => {
    const big = 'x'.repeat(MAX_BODY_BYTES + 1);
    for (let i = 0; i < RATE_LIMIT_PER_WINDOW + 50; i++) {
      const variant = i % 4;
      const res =
        variant === 0
          ? await POST(post('{not json'))
          : variant === 1
            ? await POST(post(JSON.stringify({ kind: 'bogus' })))
            : variant === 2
              ? await POST(post(big, { 'content-length': String(big.length) }))
              : await POST(post(JSON.stringify({ kind: 'js_error' }), { 'sec-fetch-site': 'cross-site' }));
      expect(res.status).not.toBe(429);
    }
    expect(await rejected('rate_limited')).toBe(0);
    expect((await POST(post(JSON.stringify({ kind: 'js_error' })))).status).toBe(204);
    expect((await kinds()).js_error).toBe(1);
  });

  it('is itself counted by withApiMetrics', async () => {
    await POST(post(JSON.stringify({ kind: 'chunk_load' })));
    const m = await getWebMetrics().apiRequests.get();
    expect(
      m.values.find(
        (v) => v.labels.route === '/api/internal/client-error' && v.labels.status === '204',
      )?.value,
    ).toBe(1);
  });
});
