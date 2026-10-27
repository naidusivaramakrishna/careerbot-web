/**
 * '/support/tickets/new' (the guest Support Ticket Portal) must stay in the
 * middleware's publicRoutes -- the whole point is that a guest reaches it
 * from the chatbot's "Raise a support ticket" link without being bounced
 * to sign-in first. The backend's own guest-ticket gate is email OTP
 * verification (see escalateToSupport's 403 handling), not auth.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('/support/tickets/new in middleware', () => {
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

  it('lets a signed-out request through instead of bouncing it to sign-in', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(
      new NextRequest('http://localhost:3000/support/tickets/new'),
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
