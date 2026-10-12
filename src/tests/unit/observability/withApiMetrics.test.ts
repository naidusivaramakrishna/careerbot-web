/**
 * withApiMetrics: labels, status, duration, thrown errors — plus a sweep over
 * every route file so a new handler cannot ship unwrapped or mislabelled.
 */
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getWebMetrics, resetWebMetricsForTests } from '@/lib/observability/registry';
import { statusFromThrown, withApiMetrics } from '@/lib/observability/withApiMetrics';

async function counterValue(labels: Record<string, string>): Promise<number> {
  const m = await getWebMetrics().apiRequests.get();
  const hit = m.values.find((v) => Object.entries(labels).every(([k, val]) => (v.labels as Record<string, unknown>)[k] === val));
  return hit?.value ?? 0;
}

async function histogram(route: string, method: string) {
  const m = await getWebMetrics().apiDuration.get();
  const pick = (name: string) =>
    m.values.find(
      (v) => v.metricName === name && v.labels.route === route && v.labels.method === method,
    )?.value ?? 0;
  return {
    count: pick('web_api_request_duration_seconds_count'),
    sum: pick('web_api_request_duration_seconds_sum'),
  };
}

describe('withApiMetrics', () => {
  beforeEach(() => resetWebMetricsForTests());
  afterEach(() => resetWebMetricsForTests());

  it('labels by route TEMPLATE, method and response status', async () => {
    const wrapped = withApiMetrics(
      '/api/backend/enhance-keywords/[resumeId]',
      'POST',
      async (req: Request, ctx: { params: Promise<{ resumeId: string }> }) => {
        // the handler still receives Next's (request, context) unchanged
        expect(req.url).toContain((await ctx.params).resumeId);
        return new Response(null, { status: 201 });
      },
    );
    const res = await wrapped(new Request('http://x/api/backend/enhance-keywords/abc123'), {
      params: Promise.resolve({ resumeId: 'abc123' }),
    });

    expect(res.status).toBe(201);
    expect(
      await counterValue({ route: '/api/backend/enhance-keywords/[resumeId]', method: 'POST', status: '201' }),
    ).toBe(1);
    // the raw id never becomes a label
    const text = await getWebMetrics().registry.metrics();
    expect(text).not.toContain('abc123');
  });

  it('records duration in seconds', async () => {
    const wrapped = withApiMetrics('/api/slow', 'GET', async () => {
      await new Promise((r) => setTimeout(r, 60));
      return new Response('ok');
    });
    await wrapped();
    const h = await histogram('/api/slow', 'GET');
    expect(h.count).toBe(1);
    expect(h.sum).toBeGreaterThanOrEqual(0.05);
    expect(h.sum).toBeLessThan(5);
  });

  it('counts a thrown handler as 500, still observes duration, and rethrows', async () => {
    const boom = new Error('boom');
    const wrapped = withApiMetrics('/api/x', 'POST', async () => {
      throw boom;
    });
    await expect(wrapped()).rejects.toBe(boom);
    expect(await counterValue({ route: '/api/x', method: 'POST', status: '500' })).toBe(1);
    expect((await histogram('/api/x', 'POST')).count).toBe(1);
  });

  it('maps Next control-flow throws to their HTTP status, not 500', () => {
    expect(statusFromThrown({ digest: 'NEXT_REDIRECT;replace;/login;307;' })).toBe('307');
    expect(statusFromThrown({ digest: 'NEXT_REDIRECT;push;/login;308;' })).toBe('308');
    expect(statusFromThrown({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })).toBe('404');
    expect(statusFromThrown({ digest: 'NEXT_NOT_FOUND' })).toBe('404');
    expect(statusFromThrown(new Error('x'))).toBe('500');
    expect(statusFromThrown(null)).toBe('500');
  });

  it('bounds a non-HTTP status value to "unknown"', async () => {
    const wrapped = withApiMetrics('/api/odd', 'GET', async () => ({ status: 'teapot' }));
    await wrapped();
    expect(await counterValue({ route: '/api/odd', method: 'GET', status: 'unknown' })).toBe(1);
  });

  it('survives module re-evaluation (HMR): one registry per process', async () => {
    const a = getWebMetrics();
    vi.resetModules();
    const fresh = await import('@/lib/observability/registry');
    // a re-evaluated module would throw "already registered" or split series
    // if the singleton were module-scoped
    expect(fresh.getWebMetrics()).toBe(a);
  });
});

// ─── Sweep: every route handler is wrapped with its own file template ────────

const API_ROOT = path.resolve(__dirname, '../../../app/api');
// The scrape endpoint is the only intentional exception (would count itself).
const UNWRAPPED = new Set(['/api/internal/metrics']);

const routeFiles = (readdirSync(API_ROOT, { recursive: true }) as string[])
  .map((p) => p.split(path.sep).join('/'))
  .filter((p) => /(^|\/)route\.tsx?$/.test(p))
  .sort();

describe('route handler sweep', () => {
  it('finds the route files', () => {
    expect(routeFiles.length).toBeGreaterThan(20);
  });

  it.each(routeFiles)('%s', (rel) => {
    const template = '/api/' + path.posix.dirname(rel);
    const src = readFileSync(path.join(API_ROOT, rel), 'utf8');

    if (UNWRAPPED.has(template)) {
      expect(src).not.toMatch(/withApiMetrics\(/);
      return;
    }
    // no bare exported handler left behind
    expect(src).not.toMatch(/^export (async )?function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/m);

    const exported = [...src.matchAll(/^export const (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) = withApiMetrics\('([^']+)', '([A-Z]+)'/gm)];
    expect(exported.length).toBeGreaterThan(0);
    for (const [, name, route, method] of exported) {
      expect(route).toBe(template);
      expect(method).toBe(name);
    }
  });
});
