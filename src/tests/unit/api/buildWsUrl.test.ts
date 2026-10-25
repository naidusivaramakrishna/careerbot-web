/**
 * buildWsUrl: where the live-interview socket connects.
 *
 * Same-origin build (NEXT_PUBLIC_BASE_URL=/api/v1) -> the page's own address,
 * which is what a college address (vit.<domain>) needs. Absolute build -> the
 * backend address, unchanged. Anything else -> the dev NEXT_PUBLIC_WS_HOST
 * fallback, unchanged.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/http', () => ({ httpClient: {} }));

// Env is stubbed BEFORE the module loads, as a real build inlines NEXT_PUBLIC_*
// before any code runs.
async function buildWsUrl(wsPath: string): Promise<string> {
  vi.resetModules();
  const mod = await import('@/api/mockInterviewApi');
  return mod.buildWsUrl(wsPath);
}

const WS_PATH = '/api/v1/mock-interview/live/s1?ticket=t';

function setPage(href: string) {
  const url = new URL(href);
  vi.stubGlobal('location', { protocol: url.protocol, host: url.host });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('buildWsUrl', () => {
  it('same-origin build on a college address uses that address over wss', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1');
    setPage('https://vit.intelicoreai.com/mock-interview/live/s1');
    expect(await buildWsUrl(WS_PATH)).toBe(`wss://vit.intelicoreai.com${WS_PATH}`);
  });

  it('same-origin build on plain http keeps the port and uses ws', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1');
    setPage('http://localhost:3000/mock-interview/live/s1');
    expect(await buildWsUrl(WS_PATH)).toBe(`ws://localhost:3000${WS_PATH}`);
  });

  it('absolute https build uses the backend address (unchanged)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://careerbot-staging.southindia.cloudapp.azure.com/api/v1');
    setPage('https://vit.intelicoreai.com/');
    expect(await buildWsUrl(WS_PATH)).toBe(
      `wss://careerbot-staging.southindia.cloudapp.azure.com${WS_PATH}`,
    );
  });

  it('absolute http build uses ws and keeps the port (unchanged)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://host:8000/api/v1');
    setPage('http://localhost:3000/');
    expect(await buildWsUrl(WS_PATH)).toBe(`ws://host:8000${WS_PATH}`);
  });

  it('returns a full ws URL as-is', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1');
    setPage('https://vit.intelicoreai.com/');
    expect(await buildWsUrl('wss://elsewhere.example/x')).toBe('wss://elsewhere.example/x');
  });

  it('no base falls back to NEXT_PUBLIC_WS_HOST (dev, unchanged)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_WS_HOST', 'h:9');
    setPage('http://localhost:3000/');
    expect(await buildWsUrl(WS_PATH)).toBe(`ws://h:9${WS_PATH}`);
  });

  it('only the exact /api/v1 value is same-origin (trailing slash is not)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1/');
    vi.stubEnv('NEXT_PUBLIC_WS_HOST', 'h:9');
    setPage('https://vit.intelicoreai.com/');
    expect(await buildWsUrl(WS_PATH)).toBe(`wss://h:9${WS_PATH}`);
  });
});
