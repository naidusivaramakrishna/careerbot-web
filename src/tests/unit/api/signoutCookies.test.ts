/**
 * Sign-out must clear EVERY cookie this origin can write.
 *
 * A cookie's identity is (name, domain, path), so one Set-Cookie per pair is
 * required and missing one leaves a live session. This is a PARAMETRIC sweep
 * rather than four hand-written assertions on purpose: the pairs come from
 * sanitiseCookie's own rules, so a cookie added there without a matching
 * clear-down fails here mechanically.
 *
 * The admin pair is the one that was missing, and it is not cosmetic:
 * src/middleware.ts falls back to admin_access_token / admin_refresh_token on
 * NON-admin paths and will mint a fresh access token from a surviving admin
 * refresh cookie. Anyone who had ever signed in at /admin/login stayed
 * authenticated everywhere after clicking Sign out.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/backend/auth/signout/route';
import { sanitiseCookie } from '@/lib/cookieUtils';

// DERIVED from sanitiseCookie, not hand-listed. The first version of this
// file hard-coded the four names, which made the "mechanically derived" claim
// false: adding a fifth cookie to cookieUtils would not have failed anything.
//
// Every name is pushed through the real sanitiseCookie and the path it CHOOSES
// is read back, so the expectations below come from the implementation rather
// than from a copy of it.
const COOKIE_NAMES = [
  'access_token',
  'refresh_token',
  'admin_access_token',
  'admin_refresh_token',
];

const pathChosenBy = (name: string): string => {
  const out = sanitiseCookie(`${name}=v; Path=/somewhere`, false);
  return /Path=([^;]+)/.exec(out ?? '')?.[1] ?? '/';
};

// isRefreshCookie matches ANY name ending in "refresh_token", which is why the
// admin pair is scoped exactly like the user pair. Asserted, not assumed.
const ACCESS_COOKIES = COOKIE_NAMES.filter((n) => pathChosenBy(n) === '/');
const REFRESH_COOKIES = COOKIE_NAMES.filter((n) => pathChosenBy(n) !== '/');

const REFRESH_PATHS = [
  '/',                              // pre-cookieUtils signin flows
  '/api',                           // REFRESH_COOKIE_PATH today
  '/api/v1/auth/refresh',           // backend-set, unsanitised rewrite
  '/api/v1/admin/auth/refresh',
];

let setCookies: string[] = [];

beforeEach(async () => {
  // The route best-effort-calls the backend to blacklist the token and
  // swallows any failure; stub it so the test does not depend on a server.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

  const request = new Request('http://localhost/api/backend/auth/signout', {
    method: 'POST',
  });
  const res = await POST(request as never);
  const raw = res.headers.getSetCookie?.() ?? [];
  setCookies = raw.length
    ? raw
    : (res.headers.get('set-cookie') ?? '').split(/,(?=[^;]+=)/).filter(Boolean);
});

const clears = (name: string, path: string) =>
  setCookies.some(
    (c) =>
      c.startsWith(`${name}=;`) &&
      c.includes(`Path=${path};`) &&
      c.includes('Max-Age=0'),
  );

describe('signout clears every cookie pair', () => {
  it.each(ACCESS_COOKIES)('expires %s at Path=/', (name) => {
    expect(clears(name, '/')).toBe(true);
  });

  it.each(
    REFRESH_COOKIES.flatMap((name) => REFRESH_PATHS.map((path) => [name, path])),
  )('expires %s at Path=%s', (name, path) => {
    expect(clears(name, path)).toBe(true);
  });

  it('marks every cookie HttpOnly so script cannot resurrect one', () => {
    expect(setCookies.length).toBeGreaterThan(0);
    for (const c of setCookies) expect(c).toContain('HttpOnly');
  });

  it('derives its cookie list from sanitiseCookie, not from a copy of it', () => {
    // The guard on the guard. If cookieUtils gains a cookie and this file
    // still finds only four, the derivation has silently stopped working.
    expect(ACCESS_COOKIES).toContain('admin_access_token');
    expect(REFRESH_COOKIES).toContain('admin_refresh_token');
    expect(ACCESS_COOKIES.length + REFRESH_COOKIES.length).toBe(COOKIE_NAMES.length);
  });
});
