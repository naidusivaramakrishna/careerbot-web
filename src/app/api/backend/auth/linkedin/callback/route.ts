import { NextRequest, NextResponse } from 'next/server';
import { sanitiseCookie } from '@/lib/cookieUtils';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Set-Cookie rewriting comes from the shared helper in @/lib/cookieUtils, the
// same one signin, login, refresh and the Google callback use. This route
// briefly carried a private copy of it, which had drifted behind the shared
// version on two points that matter:
//
//   1. It forced Path=/ on every cookie, including refresh_token. The shared
//      helper scopes refresh_token to REFRESH_COOKIE_PATH ('/api') on purpose,
//      and middleware.ts is written around that scope -- its comment notes the
//      browser never sends the refresh cookie on a page navigation. Path=/ put
//      the long-lived token back on every same-origin request.
//   2. It dropped Secure whenever NODE_ENV !== 'production', without the
//      isLocalDevHost() guard the shared helper added. A staging box that does
//      not set NODE_ENV=production, or one behind a proxy that does not forward
//      x-forwarded-proto, had its auth cookies downgraded to cleartext HTTP.
//
// Both were reintroduced by the copy, so the copy is gone. If this route ever
// needs different behaviour, change the shared helper -- do not fork it again.

/**
 * Handle LinkedIn OAuth callback by proxying to backend and setting cookies properly.
 *
 * Flow:
 * 1. LinkedIn redirects to /api/backend/auth/linkedin/callback?code=...&state=...
 * 2. We forward to backend at /api/v1/auth/linkedin/callback
 * 3. Backend exchanges code, creates/updates user, sets tokens in httpOnly cookies
 * 4. We sanitize Set-Cookie headers for frontend domain
 * 5. We redirect to /auth/linkedin/success (no tokens in the query string)
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/error?message=missing_code', request.url)
      );
    }

    const tenantId = request.cookies.get('tenant_id')?.value || 'public';

    const backendUrl = new URL('/api/v1/auth/linkedin/callback', BACKEND_URL);
    backendUrl.searchParams.set('code', code);
    if (state) backendUrl.searchParams.set('state', state);

    // Never log backendUrl — it carries the live authorization code and state.
    console.info('[LinkedIn OAuth] Exchanging authorization code');

    const backendResponse = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Tenant-Id': tenantId,
        'accept': 'application/json',
      },
      redirect: 'manual',
    });

    console.log(`[LinkedIn OAuth] Backend response status: ${backendResponse.status}`);

    if (backendResponse.status === 302 || backendResponse.status === 307) {
      const location = backendResponse.headers.get('location');
      if (!location) {
        return NextResponse.redirect(new URL('/auth/error?message=no_redirect', request.url));
      }

      // The Location header can carry auth material; log only that we got one.
      console.info('[LinkedIn OAuth] Backend returned a redirect');

      // Redirect WITHOUT copying any token into the query string.
      //
      // This previously forwarded access_token / refresh_token from the backend
      // redirect "as backup". A token in a URL is persisted to browser history,
      // sent in the Referer of later requests from that page, and captured by
      // proxy and CDN logs — and the success page then treated whatever arrived
      // as a credential. The session is carried by the Set-Cookie headers
      // forwarded below, which is the mechanism the backend actually uses.
      const frontendUrl = new URL('/auth/linkedin/success', request.url);
      const response = NextResponse.redirect(frontendUrl);

      const isSecureRequest =
        request.nextUrl.protocol === 'https:' ||
        request.headers.get('x-forwarded-proto') === 'https';

      backendResponse.headers.getSetCookie().forEach((cookie) => {
        response.headers.append(
          'Set-Cookie',
          sanitiseCookie(cookie, isSecureRequest, request.headers.get('host')),
        );
      });

      console.log('[LinkedIn OAuth] Cookies set for frontend domain');
      return response;
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'OAuth failed' }));
      console.error('[LinkedIn OAuth] Backend error:', errorData);
      return NextResponse.redirect(new URL('/auth/error?message=oauth_failed', request.url));
    }

    return NextResponse.redirect(new URL('/auth/error?message=unexpected_response', request.url));

  } catch (error) {
    console.error('[LinkedIn OAuth] Callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?message=server_error', request.url));
  }
}
