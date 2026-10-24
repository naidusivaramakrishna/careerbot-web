/**
 * Rewrite a backend-issued Set-Cookie so the browser accepts it for the
 * Next.js origin (localhost:3000 / production domain) instead of silently
 * dropping it. The two failure modes this fixes:
 *
 *   1. Backend sets `Domain=172.31.237.194` (the WSL IP). The browser
 *      rejects that domain when the response came from localhost:3000.
 *      We strip Domain — cookie defaults to the response's host.
 *
 *   2. Backend sets `Secure` but the dev request is plain HTTP.
 *      The browser rejects Secure cookies over HTTP. We strip Secure
 *      when the inbound request isn't HTTPS.
 *
 * SameSite is normalised to Lax if absent so post-refresh same-site navs
 * still carry the cookie. Path is normalised to '/' so middleware sees
 * the cookie on every route, not just /api/*.
 */
/**
 * Refresh tokens are long-lived, so they are NOT given site-wide scope.
 *
 * The API deliberately scopes refresh_token to '/api/v1/auth/refresh' as
 * defense in depth (careerbot-api app/core/security.py:266-295), and
 * middleware.ts is written around that -- its own comment notes the browser
 * never sends the refresh cookie on a page navigation. Rewriting it to Path=/
 * would put the long-lived token on every same-origin request and invalidate
 * that assumption.
 *
 * The browser refreshes through /api/backend/auth/refresh (src/lib/http.ts),
 * and the backend itself scopes the cookie to '/api' (careerbot-api #442).
 * '/api' covers that route while keeping the token off every page route.
 *
 * A DELETION keeps the path the backend gave it. The backend expires the
 * cookie under its old path (/api/v1/auth/refresh) right after setting the new
 * one; rewritten to '/api', that deletion would arrive last and remove the
 * fresh refresh_token, and the user would be signed out at the next refresh.
 */
const REFRESH_COOKIE_PATH = '/api';
const isRefreshCookie = (pair: string): boolean =>
  pair.split('=')[0].trim().toLowerCase().endsWith('refresh_token');

const isDeletion = (attrs: string[]): boolean =>
  attrs.some((attr) => {
    const [rawName, ...rest] = attr.split('=');
    const name = rawName.trim().toLowerCase();
    const value = rest.join('=').trim();
    if (name === 'max-age') return Number(value) <= 0;
    if (name === 'expires') {
      const when = Date.parse(value);
      return !Number.isNaN(when) && when <= Date.now();
    }
    return false;
  });

const originalPath = (attrs: string[]): string | undefined => {
  const path = attrs.find((attr) => attr.split('=')[0].trim().toLowerCase() === 'path');
  const value = path?.split('=').slice(1).join('=').trim();
  return value && value.startsWith('/') ? value : undefined;
};

/**
 * Stripping Secure is a LOCAL-DEVELOPMENT affordance only. Keying it off
 * NODE_ENV alone was too loose: a staging box that does not set
 * NODE_ENV=production, or one behind a proxy that does not forward the
 * protocol, would have had auth cookies downgraded to cleartext HTTP. Require
 * a loopback host as well.
 */
function isLocalDevHost(host: string | null): boolean {
  if (!host) return false;
  const trimmed = host.trim().toLowerCase();
  // A bracketed IPv6 authority ('[::1]:3000') has to be unwrapped BEFORE the
  // port is stripped. `host.split(':')[0]` yields '[' for it, so the '[::1]'
  // entry this list used to carry could never match and an IPv6 loopback dev
  // server was treated as a remote host.
  const close = trimmed.indexOf(']');
  const hostname =
    trimmed.startsWith('[') && close > 1 ? trimmed.slice(1, close) : trimmed.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function sanitiseCookie(cookie: string, isSecureRequest: boolean, host?: string | null): string {
  const parts = cookie.split(';').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return cookie;

  const [pair, ...attrs] = parts;
  let hasSameSite = false;
  const kept: string[] = [];
  const mayDropSecure =
    !isSecureRequest && process.env.NODE_ENV !== 'production' && isLocalDevHost(host ?? null);

  for (const attr of attrs) {
    const name = attr.split('=')[0].trim().toLowerCase();
    if (name === 'domain') continue;
    if (name === 'secure' && mayDropSecure) continue;
    if (name === 'path') continue;
    if (name === 'samesite') hasSameSite = true;
    kept.push(attr);
  }

  if (isRefreshCookie(pair)) {
    const path = isDeletion(attrs) ? originalPath(attrs) ?? REFRESH_COOKIE_PATH : REFRESH_COOKIE_PATH;
    kept.push(`Path=${path}`);
  } else {
    kept.push('Path=/');
  }
  if (!hasSameSite) kept.push('SameSite=Lax');

  return [pair, ...kept].join('; ');
}
