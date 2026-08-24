import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * Resolves the current user id from the httpOnly access_token cookie.
 *
 * Consumed by useCurrentUserId() and useNotificationStream(). Both call this
 * route because the access token is httpOnly and therefore unreadable from
 * client JavaScript by design.
 *
 * The signature is verified here (the previous implementation only ran
 * decodeJwt, which trusts an unverified payload). JWT_SECRET is the same
 * secret middleware.ts verifies with.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!secret) {
    // Misconfiguration, not an auth failure — do not report it as a 401.
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (typeof payload.sub !== 'string' || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { user_id: payload.sub },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
