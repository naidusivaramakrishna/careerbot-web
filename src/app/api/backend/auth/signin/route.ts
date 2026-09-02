import { NextRequest, NextResponse } from 'next/server';
import { sanitiseCookie } from '@/lib/cookieUtils';

export const maxDuration = 60; // auth can be slow on cold backend starts

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';


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
    const setCookies = response.headers.getSetCookie();
    console.log(`[Auth Signin] Backend returned ${setCookies.length} Set-Cookie headers`);

    if (setCookies.length === 0) {
      console.warn('[Auth Signin] ⚠️ WARNING: Backend did not return any Set-Cookie headers!');
      console.warn('[Auth Signin] User will not be authenticated for subsequent requests');
    }

    setCookies.forEach((cookie) => {
      const sanitized = sanitiseCookie(cookie, isSecureRequest, request.headers.get('host'));
      // Do not log cookie values — the first 50 chars include the JWT header/payload.
      console.info('[Auth Signin] Setting authentication cookie');
      res.headers.append('Set-Cookie', sanitized);
    });

    console.log('[Auth Signin] ✅ Signin successful, cookies set, response returned');
    return res;

  } catch {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 502 }
    );
  }
}
