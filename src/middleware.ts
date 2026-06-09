import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { logger } from '@/lib/logger';
 
// Public routes — no auth required
const publicRoutes = [
    '/',
    '/admin/login',
    '/recruiter/auth',
    '/verify-email',
    '/reset-password',
    '/forgot-password',
    '/resend-verification',
    "/browse-templates",
    // Builder and cover-letter creation flow remain public. Cover-letter
    // export/download handles auth at the action level.
    "/builder",
    "/cover-letter",
];
 
const RECRUITER_PREFIX = '/recruiter';
const ADMIN_PREFIX = '/admin';

function buildUserLoginUrl(request: NextRequest): URL {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('showLogin', 'true');
    loginUrl.searchParams.set(
        'next',
        `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return loginUrl;
}
 
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    logger.info(`[${request.method}] ${pathname}`);
 
    // Allow public routes without authentication
    const isPublicRoute =
        publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Landing pages accessible without auth (exact path only — sub-paths remain protected)
    const publicLandingPages = ['/jobmatch', '/ats'];
    if (publicLandingPages.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for both regular and admin-prefixed token names
    const token = request.cookies.get('access_token')?.value ||
                  request.cookies.get('admin_access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value ||
                         request.cookies.get('admin_refresh_token')?.value;

    const isProtectedArea =
        pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(RECRUITER_PREFIX);

    const loginRedirect = () => {
        const loginUrl = pathname.startsWith(ADMIN_PREFIX)
            ? '/admin/login'
            : pathname.startsWith(RECRUITER_PREFIX)
            ? '/recruiter/auth'
            : buildUserLoginUrl(request);
        return NextResponse.redirect(
            typeof loginUrl === 'string' ? new URL(loginUrl, request.url) : loginUrl
        );
    };

    // Role claim must match the area being entered. Returns true for any
    // non-role-gated route, so the check is a no-op outside admin/recruiter.
    const roleAllows = (role: string | undefined): boolean => {
        if (pathname.startsWith(ADMIN_PREFIX))     return role === 'admin';
        if (pathname.startsWith(RECRUITER_PREFIX)) return role === 'recruiter' || role === 'admin';
        return true;
    };

    // JWT role enforcement — decode access_token to check role claim
    if (token && process.env.JWT_SECRET) {
        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            if (!roleAllows(payload.role as string | undefined)) {
                return NextResponse.redirect(new URL('/403', request.url));
            }
            return NextResponse.next();
        } catch {
            // Access token present but invalid/expired — fall through to refresh.
        }
    }

    // 2) No verified token. Non-role-protected pages: presence of EITHER an
    //    access_token or refresh_token cookie is enough to let the request
    //    through. The page's own API calls will revalidate against the backend
    //    on every request, and the HTTP interceptor handles refresh on the
    //    first 401. Falling back to refresh_token alone bounced real users to
    //    login when their backend hadn't issued a refresh cookie OR when the
    //    frontend JWT_SECRET didn't match the backend's signing key.
    if (!isProtectedArea) {
        return (token || refreshToken) ? NextResponse.next() : loginRedirect();
    }

    // 3) Protected area with no verified token — whether the access token is
    //    missing OR invalid. Attempt a server-side refresh, re-verify the NEW
    //    token's role, then bounce through a redirect so the page renders with a
    //    valid cookie. Every failure path falls through to the login redirect
    //    (fail-safe) — a forged/expired refresh cookie can never reach a
    //    role-gated page.
    if (refreshToken && process.env.JWT_SECRET) {
        try {
            const refreshPath = pathname.startsWith(ADMIN_PREFIX)
                ? '/api/v1/admin/auth/refresh'
                : '/api/v1/auth/refresh';
            const refreshRes = await fetch(new URL(refreshPath, request.url), {
                method: 'POST',
                headers: { cookie: request.headers.get('cookie') ?? '' },
            });
            if (refreshRes.ok) {
                const setCookies = refreshRes.headers.getSetCookie?.() ?? [];
                const newAccess = setCookies
                    .map((c) => /(?:access_token|admin_access_token)=([^;]+)/.exec(c)?.[1])
                    .find((v): v is string => !!v);
                if (newAccess) {
                    const { payload } = await jwtVerify(
                        newAccess,
                        new TextEncoder().encode(process.env.JWT_SECRET)
                    );
                    if (!roleAllows(payload.role as string | undefined)) {
                        return NextResponse.redirect(new URL('/403', request.url));
                    }
                    // Re-issue the navigation with the refreshed cookies; the
                    // middleware re-runs and verifies the new token (step 1).
                    const res = NextResponse.redirect(request.url);
                    setCookies.forEach((c) => res.headers.append('set-cookie', c));
                    return res;
                }
            }
        } catch {
            // Token invalid or expired.
            // If a refresh token exists, let the request through — the HTTP interceptor
            // on the client will detect the 401 and call /auth/refresh automatically.
            // Only redirect immediately when there is truly no way to recover the session.
            if (refreshToken) {
                return NextResponse.next();
            }
            const loginUrl = pathname.startsWith(ADMIN_PREFIX)
                ? '/admin/login'
                : pathname.startsWith(RECRUITER_PREFIX)
                ? '/recruiter/auth'
                : buildUserLoginUrl(request);
            return NextResponse.redirect(
                typeof loginUrl === 'string' ? new URL(loginUrl, request.url) : loginUrl
            );
        }
    }
 
    return NextResponse.next();
}
 
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|images|api).*)',
    ],
};
