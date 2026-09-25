/**
 * Companion to VerifyEmailLegacyRoute.test.ts: '/verify-email' must stay in the
 * middleware's publicRoutes. Otherwise a signed-out click on an old
 * verification link is bounced to /?showLogin=true&next=/verify-email?token=...,
 * which copies the token into the URL and, after sign-in, sends the user back
 * to /verify-email instead of letting the legacy page redirect them.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('/verify-email in middleware', () => {
  beforeEach(() => {
    // isMaintenanceMode() fetches /api/maintenance-status on the first call.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ maintenance: false }), { status: 200 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets a signed-out /verify-email?token=... request through instead of bouncing it to login with the token in `next`', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(
      new NextRequest('http://localhost:3000/verify-email?token=abc123'),
    );

    // A pass-through carries x-middleware-next; a redirect carries Location.
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('(harness guard) still bounces a signed-out protected route to sign-in', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(new NextRequest('http://localhost:3000/dashboard'));

    const location = res.headers.get('location');
    expect(location).not.toBeNull();
    expect(new URL(location as string).searchParams.get('showLogin')).toBe('true');
  });
});
