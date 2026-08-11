import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

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
 * SameSite is normalised to Lax if absent so post-login same-site navs
 * still carry the cookie. Path is normalised to '/' so middleware sees
 * the cookie on every route, not just /api/*.
 */
function sanitiseCookie(cookie: string, isSecureRequest: boolean): string {
  const parts = cookie.split(';').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return cookie;

  const [pair, ...attrs] = parts;
  let hasSameSite = false;
  const kept: string[] = [];

  for (const attr of attrs) {
    const name = attr.split('=')[0].trim().toLowerCase();
    if (name === 'domain') continue;          // strip — browser will scope to host
    // Only ever drop Secure in non-production. In prod, keep Secure even if the
    // proxy didn't advertise https — a downgraded auth cookie is worse than a
    // dropped one.
    if (name === 'secure' && !isSecureRequest && process.env.NODE_ENV !== 'production') continue;
    // Discard whatever path the backend set (e.g. /api/v1/auth/refresh).
    // The browser would honour that restriction and not send the cookie to
    // /dashboard, making the middleware unable to detect a valid session.
    // Since all cookies are httpOnly, forcing Path=/ is safe.
    if (name === 'path') { continue; }
    if (name === 'samesite') hasSameSite = true;
    kept.push(attr);
  }

  kept.push('Path=/');
  if (!hasSameSite) kept.push('SameSite=Lax');

  return [pair, ...kept].join('; ');
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const tenantId = request.headers.get('X-Tenant-Id') || 'public';

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 85000);
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/v1/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: formData.toString(),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(fetchTimeout);
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Authentication service timeout' },
          { status: 504 }
        );
      }
      throw err;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      clearTimeout(fetchTimeout);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    clearTimeout(fetchTimeout);
    // Tokens live in the httpOnly cookies forwarded below; never expose them
    // in the JS-readable body (authApi.ts:30 — "never accessible to JavaScript").
    const { access_token, refresh_token, ...safeBody } = data ?? {};
    void access_token; void refresh_token;
    const res = NextResponse.json(safeBody);

    const isSecureRequest =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    // Forward Set-Cookie headers from backend, rewriting per sanitiseCookie
    // so the browser actually accepts them.
    response.headers.getSetCookie().forEach((cookie) => {
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest));
    });

    return res;

  } catch {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 502 }
    );
  }
}
