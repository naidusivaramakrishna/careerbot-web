import { NextRequest, NextResponse } from 'next/server';

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

  // Clear EVERY (name, path) pair this origin can have written.
  // A cookie's identity is (name, domain, path), so one Set-Cookie per pair is
  // required and missing one leaves a live session.
  //
  // The paths, per name:
  //   Path=/                       access tokens and refresh tokens from pre-cookieUtils flows
  //   Path=/api                    refresh tokens today (REFRESH_COOKIE_PATH)
  //   Path=/api/v1/auth/refresh    backend-set, when a rewrite forwards the response without sanitising it
  //   Path=/api/v1/admin/auth/refresh   same for admin auth endpoints
  const res = NextResponse.json({ success: true });
  const expire = (name: string, path: string) =>
    res.headers.append(
      'Set-Cookie',
      `${name}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0`,
    );

  for (const name of ['admin_access_token', 'access_token']) {
    expire(name, '/');
  }
  for (const name of ['admin_refresh_token', 'refresh_token']) {
    expire(name, '/');
    expire(name, '/api');
    expire(name, '/api/v1/auth/refresh');
    expire(name, '/api/v1/admin/auth/refresh');
  }
  return res;
}
