import { describe, it, expect } from 'vitest';
import { sanitiseCookie } from '@/lib/cookieUtils';

/**
 * These lock in the two invariants a private copy of sanitiseCookie in the
 * LinkedIn OAuth callback route had drifted away from:
 *
 *   1. refresh_token is scoped to Path=/api, never Path=/. middleware.ts is
 *      written around that scope.
 *   2. Secure is only ever dropped for a loopback host in a non-production
 *      build. A staging box that forgets NODE_ENV=production, or one behind a
 *      proxy that does not forward x-forwarded-proto, must keep Secure.
 *
 * NODE_ENV is 'test' under vitest, so every case below exercises the
 * non-production branch — the one where the guard actually has to hold.
 */

const attrs = (cookie: string) =>
  cookie.split(';').map((p) => p.trim()).filter(Boolean).slice(1);

const attr = (cookie: string, name: string) =>
  attrs(cookie).find((a) => a.split('=')[0].trim().toLowerCase() === name.toLowerCase());

describe('sanitiseCookie — cookie path scoping', () => {
  it('scopes refresh_token to /api, not the whole site', () => {
    const out = sanitiseCookie(
      'refresh_token=abc; Domain=172.31.237.194; Path=/api/v1/auth/refresh; HttpOnly',
      false,
      'localhost:3000',
    );
    expect(attr(out, 'Path')).toBe('Path=/api');
  });

  it('gives access_token site-wide scope', () => {
    const out = sanitiseCookie('access_token=abc; Path=/api/v1; HttpOnly', false, 'localhost:3000');
    expect(attr(out, 'Path')).toBe('Path=/');
  });

  it('scopes admin_refresh_token to /api as well', () => {
    const out = sanitiseCookie('admin_refresh_token=abc; Path=/x', false, 'localhost:3000');
    expect(attr(out, 'Path')).toBe('Path=/api');
  });

  it('strips Domain so the cookie binds to the responding host', () => {
    const out = sanitiseCookie('access_token=abc; Domain=172.31.237.194', false, 'localhost:3000');
    expect(attr(out, 'Domain')).toBeUndefined();
  });

  it('preserves the name=value pair verbatim', () => {
    const out = sanitiseCookie('access_token=a.b-c_d; Path=/x', false, 'localhost:3000');
    expect(out.split(';')[0]).toBe('access_token=a.b-c_d');
  });
});

describe('sanitiseCookie — Secure downgrade guard', () => {
  it('drops Secure for a plain-HTTP request from loopback (local dev)', () => {
    const out = sanitiseCookie('access_token=abc; Secure; HttpOnly', false, 'localhost:3000');
    expect(attr(out, 'Secure')).toBeUndefined();
  });

  it('keeps Secure for a non-loopback host even when NODE_ENV is not production', () => {
    const out = sanitiseCookie('access_token=abc; Secure; HttpOnly', false, 'staging.careerbot.ai');
    expect(attr(out, 'Secure')).toBe('Secure');
  });

  it('keeps Secure when the host header is absent (proxy did not forward it)', () => {
    const out = sanitiseCookie('access_token=abc; Secure; HttpOnly', false, null);
    expect(attr(out, 'Secure')).toBe('Secure');
  });

  it('keeps Secure whenever the inbound request is already HTTPS', () => {
    const out = sanitiseCookie('access_token=abc; Secure; HttpOnly', true, 'localhost:3000');
    expect(attr(out, 'Secure')).toBe('Secure');
  });

  it('treats 127.0.0.1 as loopback', () => {
    const out = sanitiseCookie('access_token=abc; Secure', false, '127.0.0.1:3000');
    expect(attr(out, 'Secure')).toBeUndefined();
  });

  it('treats a bracketed IPv6 loopback as loopback', () => {
    // '[::1]:3000'.split(':')[0] is '[', so this needs the brackets unwrapped
    // before the port is stripped.
    expect(attr(sanitiseCookie('access_token=abc; Secure', false, '[::1]:3000'), 'Secure')).toBeUndefined();
    expect(attr(sanitiseCookie('access_token=abc; Secure', false, '[::1]'), 'Secure')).toBeUndefined();
  });

  it('does not treat a non-loopback IPv6 host as loopback', () => {
    const out = sanitiseCookie('access_token=abc; Secure', false, '[2001:db8::1]:3000');
    expect(attr(out, 'Secure')).toBe('Secure');
  });

  it('ignores host casing and surrounding whitespace', () => {
    const out = sanitiseCookie('access_token=abc; Secure', false, '  LocalHost:3000  ');
    expect(attr(out, 'Secure')).toBeUndefined();
  });
});

describe('sanitiseCookie — SameSite', () => {
  it('adds SameSite=Lax when the backend omitted it', () => {
    const out = sanitiseCookie('access_token=abc; HttpOnly', false, 'localhost:3000');
    expect(attr(out, 'SameSite')).toBe('SameSite=Lax');
  });

  it("does not override the backend's own SameSite", () => {
    const out = sanitiseCookie('access_token=abc; SameSite=None; Secure', true, 'x.example.com');
    expect(attrs(out).filter((a) => a.toLowerCase().startsWith('samesite'))).toEqual(['SameSite=None']);
  });
});
