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
 * It cannot keep the backend's exact path either: refresh is proxied through
 * BOTH /api/v1/auth/refresh and /api/backend/auth/refresh, which share only
 * the '/api' prefix. '/api' covers both endpoints while still keeping the
 * token off every page route.
 */
const REFRESH_COOKIE_PATH = '/api';
const isRefreshCookie = (pair: string): boolean =>
  pair.split('=')[0].trim().toLowerCase().endsWith('refresh_token');

/**
 * Stripping Secure is a LOCAL-DEVELOPMENT affordance only. Keying it off
 * NODE_ENV alone was too loose: a staging box that does not set
 * NODE_ENV=production, or one behind a proxy that does not forward the
 * protocol, would have had auth cookies downgraded to cleartext HTTP. Require
 * a loopback host as well.
 */
function isLocalDevHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0].toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
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

  kept.push(isRefreshCookie(pair) ? `Path=${REFRESH_COOKIE_PATH}` : 'Path=/');
  if (!hasSameSite) kept.push('SameSite=Lax');

  return [pair, ...kept].join('; ');
}
