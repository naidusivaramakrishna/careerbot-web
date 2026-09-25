import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/app/api/_lib/clearAuthCookies';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  // Forward to backend so the token gets blacklisted server-side.
  // Ignore errors — even if the backend call fails we still clear cookies.
  // Best-effort: blacklist the token on the backend. 3 s timeout so a slow/hung
  // backend never delays the cookie-clear response that the browser is waiting on.
  await fetch(`${BACKEND_URL}/api/v1/auth/signout`, {
    method: 'POST',
    signal: AbortSignal.timeout(3000),
    headers: {
      'accept': 'application/json',
      'Cookie': request.headers.get('cookie') ?? '',
      ...(request.headers.get('X-Tenant-Id')
        ? { 'X-Tenant-Id': request.headers.get('X-Tenant-Id')! }
        : {}),
    },
  }).catch(() => {});

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return res;
}
