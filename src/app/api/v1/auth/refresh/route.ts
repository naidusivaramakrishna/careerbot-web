import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Sanitize Set-Cookie headers from the backend.
 * Strips Domain (backend sets its own IP/hostname, which the browser rejects),
 * strips Secure on non-HTTPS dev requests, forces Path=/, adds SameSite=Lax.
 */
function sanitiseCookie(cookie: string, isSecureRequest: boolean): string {
  const parts = cookie.split(';').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return cookie;

  const [pair, ...attrs] = parts;
  let hasSameSite = false;
  const kept: string[] = [];

  for (const attr of attrs) {
    const name = attr.split('=')[0].trim().toLowerCase();
    if (name === 'domain') continue;
    if (name === 'secure' && !isSecureRequest && process.env.NODE_ENV !== 'production') continue;
    if (name === 'path') continue;
    if (name === 'samesite') hasSameSite = true;
    kept.push(attr);
  }

  kept.push('Path=/');
  if (!hasSameSite) kept.push('SameSite=Lax');

  return [pair, ...kept].join('; ');
}

export async function POST(request: NextRequest) {
  try {
    const isSecureRequest =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    const tenantId = request.headers.get('X-Tenant-Id') || 'public';
    const correlationId = request.headers.get('X-Correlation-ID');
    const cookieHeader = request.headers.get('cookie') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'X-Tenant-Id': tenantId,
      'cookie': cookieHeader,
    };
    if (correlationId) headers['X-Correlation-ID'] = correlationId;

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers,
      body: '{}',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    const res = NextResponse.json(body, { status: response.status });

    const setCookies = response.headers.getSetCookie();
    setCookies.forEach((cookie) => {
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest));
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
  }
}
