/**
 * A college's own address opens on its sign-in page. Only the bare root
 * redirects: the sign-in page links to /?showLogin=true&next=..., so
 * redirecting that as well would loop.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

function req(url: string, host: string = new URL(url).host) {
  return new NextRequest(url, { headers: { host } });
}

describe('college host routing in middleware', () => {
  beforeEach(() => {
    vi.stubEnv('INSTITUTION_BASE_DOMAIN', 'intelicoreai.com');
    // isMaintenanceMode() fetches /api/maintenance-status on the first call.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ maintenance: false }), { status: 200 })),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the root of a college address to /institution/login', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(req('https://vit.intelicoreai.com/'));
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/institution/login');
  });

  it('does not redirect the sign-in link the login page sends people to', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(req('https://vit.intelicoreai.com/?showLogin=true&next=%2Finstitution'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('still redirects a college root that carries an unrelated query (utm, email links)', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(req('https://vit.intelicoreai.com/?utm_source=email'));
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/institution/login');
  });

  it('does not redirect when the proxy rewrites Host to the upstream name', async () => {
    // Deploy contract: nginx must send `Host $host` to the web app as well
    // (location / in nginx/wildcard-subdomains.conf). If it does not, the
    // college is invisible here and the visitor sees the normal home page.
    // x-forwarded-host is deliberately NOT trusted: anyone can send it.
    const { middleware } = await import('@/middleware');
    const res = await middleware(
      new NextRequest('https://vit.intelicoreai.com/', {
        headers: { host: 'web:3000', 'x-forwarded-host': 'vit.intelicoreai.com' },
      }),
    );
    expect(res.headers.get('location')).toBeNull();
  });

  it.each([
    'https://app.intelicoreai.com/',
    'https://www.intelicoreai.com/',
    'https://intelicoreai.com/',
  ])('leaves the root of a non-college host alone: %s', async (url) => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(req(url));
    expect(res.headers.get('location')).toBeNull();
  });

  it('does nothing when no base domain is configured', async () => {
    vi.stubEnv('INSTITUTION_BASE_DOMAIN', '');
    const { middleware } = await import('@/middleware');
    const res = await middleware(req('https://vit.intelicoreai.com/'));
    expect(res.headers.get('location')).toBeNull();
  });
});
