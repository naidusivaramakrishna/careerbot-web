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
];

const RECRUITER_PREFIX = '/recruiter';
const ADMIN_PREFIX = '/admin';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    logger.info(`[${request.method}] ${pathname}`);

    // Allow public routes without authentication
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    );
    if (isPublicRoute) {
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
            : '/?showLogin=true';
        return NextResponse.redirect(new URL(loginUrl, request.url));
    };

    // Role claim must match the area being entered.
    const roleAllows = (role: string | undefined): boolean => {
        if (pathname.startsWith(ADMIN_PREFIX)) return role === 'admin';
        if (pathname.startsWith(RECRUITER_PREFIX)) return role === 'recruiter' || role === 'admin';
        return true;
    };

    // No credentials at all → login.
    if (!token && !refreshToken) {
        return loginRedirect();
    }

    // Role-protected areas REQUIRE a working verifier. If JWT_SECRET is absent
    // the server is misconfigured — deny rather than fail open.
    if (isProtectedArea && !process.env.JWT_SECRET) {
        return NextResponse.redirect(new URL('/403', request.url));
    }

    // 1) Verify the access token if we have one.
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

    // 2) No verified token. Non-protected pages: a refresh cookie is enough —
    //    let the request through; the client HTTP interceptor refreshes on the
    //    first 401.
    if (!isProtectedArea) {
        return refreshToken ? NextResponse.next() : loginRedirect();
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
            // refresh failed — fall through to the login redirect
        }
    }

    return loginRedirect();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|api).*)',
    ],
};
