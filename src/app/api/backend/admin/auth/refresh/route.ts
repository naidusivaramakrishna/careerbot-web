import { NextRequest, NextResponse } from 'next/server';
import { sanitiseCookie } from '@/lib/cookieUtils';

export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-Id') || 'public';
  const controller = new AbortController();
  // Must stay under `maxDuration` above -- an 85s abort under a 60s route
  // limit means the platform kills the function before the intended 504
  // can ever be returned.
  const fetchTimeout = setTimeout(() => controller.abort(), 50000);

  try {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/v1/admin/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'X-Tenant-Id': tenantId,
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Admin token refresh timeout' },
          { status: 504 }
        );
      }
      throw err;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Admin token refresh failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Don't expose tokens in body - they're in httpOnly cookies
    const { access_token, refresh_token, ...safeBody } = data ?? {};
    void access_token; void refresh_token;
    const res = NextResponse.json(safeBody);

    const isSecureRequest =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    // Forward Set-Cookie headers from backend, rewriting per sanitiseCookie
    response.headers.getSetCookie().forEach((cookie) => {
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest, request.headers.get('host')));
    });

    return res;

  } catch {
    return NextResponse.json(
      { error: 'Admin token refresh service unavailable' },
      { status: 502 }
    );
  } finally {
    clearTimeout(fetchTimeout);
  }
}
