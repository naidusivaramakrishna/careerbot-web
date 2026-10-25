/**
 * resumeatsapi request address.
 *
 * Same-origin build (NEXT_PUBLIC_BASE_URL=/api/v1) -> relative /api/v1/...,
 * so a college address sends its own sign-in cookies. Otherwise the
 * NEXT_PUBLIC_SERVER_URL backend address, as before.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/http', () => ({ default: {}, httpClient: {} }));
vi.mock('@/api/authApi', () => ({ isAuthenticated: vi.fn().mockResolvedValue(true) }));
vi.mock('@/lib/correlationId', () => ({ getCorrelationId: () => 'corr-1' }));
vi.mock('@/lib/tracing', () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock('@/api/enhancerApi', () => ({ enhanceResume: vi.fn() }));
vi.mock('@/api/parserApi', () => ({ getResume: vi.fn() }));

// Env is stubbed BEFORE the module loads, as a real build inlines NEXT_PUBLIC_*
// before any code runs. Importing first would let an import-time read pass
// these tests for the wrong reason.
async function load() {
  vi.resetModules();
  return import('@/api/resumeatsapi');
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  // A fresh Response per call: a body can be read only once.
  fetchMock.mockImplementation(async () => new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function calledUrl(): string {
  return String(fetchMock.mock.calls[0][0]);
}

describe('resumeatsapi request address', () => {
  it('same-origin build calls the page address (relative), ignoring SERVER_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1');
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://careerbot-staging.southindia.cloudapp.azure.com');
    const { getAllResumes } = await load();
    await getAllResumes();
    expect(calledUrl()).toBe('/api/v1/resumes/');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('absolute build keeps the SERVER_URL backend address (unchanged)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://s.example/api/v1');
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://s.example');
    const { clearCacheForResume } = await load();
    await clearCacheForResume('r-1');
    expect(calledUrl()).toBe('https://s.example/api/v1/parser/clear-cache/r-1');
  });

  it('reads the env on every call, not once at import', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://s.example/api/v1');
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://s.example');
    const { getAllResumes } = await load();
    await getAllResumes();
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '/api/v1');
    await getAllResumes();
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      'https://s.example/api/v1/resumes/',
      '/api/v1/resumes/',
    ]);
  });

  it('nothing set -> relative path (unchanged fallback)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '');
    const { getAllResumes } = await load();
    await getAllResumes();
    expect(calledUrl()).toBe('/api/v1/resumes/');
  });
});
