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

  // Clear all auth cookies from the Next.js origin.
  // refresh_token must be cleared at ALL three paths it could have been written to:
  //   - Path=/   : set by old signin flows before cookieUtils was introduced
  //   - Path=/api : set by sanitiseCookie (cookieUtils.ts REFRESH_COOKIE_PATH)
  //                 for signin, OAuth callbacks, and token refresh responses
  //   - Path=/api/v1/auth/refresh : set by backend directly when the rewrite
  //                                 proxy forwards the response unsanitized
  // Missing any of these leaves a stale refresh_token that survives sign-out,
  // which allows a previous session's token to contaminate the next sign-in.
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', 'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.headers.append('Set-Cookie', 'refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.headers.append('Set-Cookie', 'refresh_token=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0');
  res.headers.append('Set-Cookie', 'refresh_token=; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Lax; Max-Age=0');
  return res;
}
