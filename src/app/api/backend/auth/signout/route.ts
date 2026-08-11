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
  // refresh_token is cleared at BOTH paths because:
  //   - Path=/ comes from the signin proxy (sanitiseCookie forces Path=/)
  //   - Path=/api/v1/auth/refresh comes from subsequent refresh responses that
  //     go through the next.config.ts rewrite unsanitized (backend sets this path)
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', 'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.headers.append('Set-Cookie', 'refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.headers.append('Set-Cookie', 'refresh_token=; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Lax; Max-Age=0');
  return res;
}
