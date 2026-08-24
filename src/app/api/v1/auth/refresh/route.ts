import { NextRequest, NextResponse } from 'next/server';
import { sanitiseCookie } from '@/lib/cookieUtils';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';


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

    // Refresh is cookie-driven: the refresh_token cookie is forwarded in the
    // `cookie` header above. We deliberately do NOT relay a caller-supplied
    // body — accepting { refresh_token } from client JS would let a script
    // swap in an arbitrary token and mint cookies for another account.
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers,
      body: '{}',
    });

    const contentType = response.headers.get('content-type') ?? '';
    let body: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    // The backend returns the rotated access/refresh tokens in its JSON body.
    // They reach the browser as httpOnly Set-Cookie headers below; echoing them
    // in a readable body would hand any same-origin script the long-lived
    // refresh token and defeat the httpOnly design.
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const rest = { ...(body as Record<string, unknown>) };
      delete rest.access_token;
      delete rest.refresh_token;
      body = rest;
    }

    const res = NextResponse.json(body, { status: response.status });

    const setCookies = response.headers.getSetCookie();
    setCookies.forEach((cookie) => {
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest, request.headers.get('host')));
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
  }
}
