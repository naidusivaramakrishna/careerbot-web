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

    const response = await fetch(`${BACKEND_URL}/api/v1/admin/auth/refresh`, {
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
      res.headers.append('Set-Cookie', sanitiseCookie(cookie, isSecureRequest, request.headers.get('host')));
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
  }
}
