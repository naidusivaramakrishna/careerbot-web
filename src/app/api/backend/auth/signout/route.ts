import { NextRequest, NextResponse } from 'next/server';

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

  // Clear EVERY (name, path) pair this origin can have written.
  //
  // A cookie's identity is (name, domain, path), so one Set-Cookie per pair is
  // required and missing one leaves a live session. The full writer set is
  // sanitiseCookie (src/lib/cookieUtils.ts), whose isRefreshCookie matches ANY
  // name ending in "refresh_token" -- so it scopes admin_refresh_token exactly
  // like refresh_token, and admin_access_token exactly like access_token.
  //
  // THE ADMIN PAIR MATTERS ON USER ROUTES. src/middleware.ts falls back to
  // admin_access_token / admin_refresh_token on non-admin paths, and will even
  // mint a fresh access token from a surviving admin refresh cookie. So a user
  // who had ever signed in at /admin/login stayed authenticated everywhere
  // after clicking Sign out -- the session did not end.
  //
  // The paths, per name:
  //   Path=/                       access tokens (sanitiseCookie forces it),
  //                                and refresh tokens from pre-cookieUtils flows
  //   Path=/api                    refresh tokens today (REFRESH_COOKIE_PATH)
  //   Path=/api/v1/auth/refresh    backend-set, when a rewrite forwards the
  //   Path=/api/v1/admin/auth/refresh   response without sanitising it
  const res = NextResponse.json({ success: true });
  const expire = (name: string, path: string) =>
    res.headers.append(
      'Set-Cookie',
      `${name}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0`,
    );

  for (const name of ['access_token', 'admin_access_token']) {
    expire(name, '/');
  }
  for (const name of ['refresh_token', 'admin_refresh_token']) {
    expire(name, '/');
    expire(name, '/api');
    expire(name, '/api/v1/auth/refresh');
    expire(name, '/api/v1/admin/auth/refresh');
  }
  return res;
}
