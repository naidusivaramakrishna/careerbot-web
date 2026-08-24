import { NextRequest, NextResponse } from 'next/server';
import { sanitiseCookie } from '@/lib/cookieUtils';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const url = `${BACKEND_URL}/api/v1/auth/signin`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        // The API requires a tenant on every call; this proxy was omitting it.
        'X-Tenant-Id': request.headers.get('X-Tenant-Id') || 'public',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      const errorPayload = contentType.includes('application/json') ? await response.json() : await response.text();
      return NextResponse.json(typeof errorPayload === 'string' ? { error: errorPayload } : errorPayload, { status: response.status });
    }
    const data = await response.json();

    // The backend returns access_token and refresh_token in the signin body
    // (careerbot-api app/api/v1/endpoints/auth.py:315-320). Relaying that body
    // verbatim hands both tokens to client JavaScript and defeats the
    // httpOnly-cookie design. Strip them and forward the Set-Cookie headers,
    // which is how the session is actually meant to travel.
    const { access_token: _a, refresh_token: _b, ...safeBody } = data ?? {};
    void _a; void _b;
    const res = NextResponse.json(safeBody, { status: response.status });

    const isSecureRequest =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';
    response.headers.getSetCookie().forEach((cookie) => {
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest, request.headers.get('host')));
    });
    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
