/**
 * GET /api/internal/metrics token gate — same contract as the backend's
 * /internal/metrics: unset/short -> 404, wrong -> 401, right -> 200.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/internal/metrics/route';
import { resetWebMetricsForTests } from '@/lib/observability/registry';
import { MIN_SCRAPE_TOKEN_LENGTH, checkScrapeAuth } from '@/lib/observability/scrapeAuth';

const GOOD = 'a'.repeat(MIN_SCRAPE_TOKEN_LENGTH) + '-staging';

function req(authorization?: string) {
  return new Request('http://careerbot-web:3000/api/internal/metrics', {
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('GET /api/internal/metrics', () => {
  beforeEach(() => resetWebMetricsForTests());
  afterEach(() => {
    vi.unstubAllEnvs();
    resetWebMetricsForTests();
  });

  it('404 when METRICS_SCRAPE_TOKEN is unset (closed by default)', async () => {
    vi.stubEnv('METRICS_SCRAPE_TOKEN', '');
    const res = await GET(req(`Bearer ${GOOD}`));
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('web_');
  });

  it('404 when the token is shorter than 32 chars, even if presented correctly', async () => {
    const short = 'x'.repeat(MIN_SCRAPE_TOKEN_LENGTH - 1);
    vi.stubEnv('METRICS_SCRAPE_TOKEN', short);
    expect((await GET(req(`Bearer ${short}`))).status).toBe(404);
  });

  it.each([
    ['wrong token', `Bearer ${'b'.repeat(40)}`],
    ['missing header', undefined],
    ['wrong scheme', `Basic ${GOOD}`],
    ['empty bearer', 'Bearer '],
    ['token prefix only', `Bearer ${GOOD.slice(0, -1)}`],
    ['non-ascii token', 'Bearer cafécafécafécafécafécafécafécafé'],
  ])('401 on %s', async (_label, auth) => {
    vi.stubEnv('METRICS_SCRAPE_TOKEN', GOOD);
    const res = await GET(req(auth));
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).not.toContain('web_');
  });

  it('200 with Prometheus exposition on the right token', async () => {
    vi.stubEnv('METRICS_SCRAPE_TOKEN', GOOD);
    vi.stubEnv('GIT_COMMIT', 'abc1234');
    vi.stubEnv('APP_VERSION', '0.1.0');
    const res = await GET(req(`Bearer ${GOOD}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.text();
    expect(body).toContain('# TYPE web_api_requests_total counter');
    expect(body).toContain('# TYPE web_api_request_duration_seconds histogram');
    expect(body).toContain('web_client_errors_total{kind="chunk_load"} 0');
    expect(body).toContain('web_build_info{version="0.1.0",commit="abc1234"} 1');
    expect(body).toMatch(/^web_process_cpu_user_seconds_total /m);
    expect(body).toMatch(/^web_nodejs_heap_size_used_bytes /m);
  });

  it('scheme is case-insensitive', async () => {
    vi.stubEnv('METRICS_SCRAPE_TOKEN', GOOD);
    expect((await GET(req(`bearer ${GOOD}`))).status).toBe(200);
  });
});

describe('checkScrapeAuth', () => {
  it('reads the env at call time', () => {
    vi.stubEnv('METRICS_SCRAPE_TOKEN', '');
    expect(checkScrapeAuth(`Bearer ${GOOD}`)).toBe('disabled');
    vi.stubEnv('METRICS_SCRAPE_TOKEN', GOOD);
    expect(checkScrapeAuth(`Bearer ${GOOD}`)).toBe('ok');
    vi.unstubAllEnvs();
  });

  it('bounds build labels from env', async () => {
    const { buildLabel } = await import('@/lib/observability/registry');
    expect(buildLabel(undefined)).toBe('unknown');
    expect(buildLabel('1.2.3')).toBe('1.2.3');
    expect(buildLabel('a b"c')).toBe('invalid');
    expect(buildLabel('x'.repeat(65))).toBe('invalid');
  });
});
