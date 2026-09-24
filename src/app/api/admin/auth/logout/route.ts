import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/app/api/_lib/clearAuthCookies';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  // Best-effort: blacklist the token on the backend. 3s timeout so a slow/hung
  // backend never delays the cookie-clear response that the browser is waiting on.
  await fetch(`${BACKEND_URL}/api/v1/admin/auth/logout`, {
    method: 'POST',
    signal: AbortSignal.timeout(3000),
    headers: {
      'Content-Type': 'application/json',
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
