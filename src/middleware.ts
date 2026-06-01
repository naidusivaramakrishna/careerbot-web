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
    "/browse-templates"
];

const publicExactRoutes = ['/builder', '/builder/start', '/cover-letter'];

const RECRUITER_PREFIX = '/recruiter';
const ADMIN_PREFIX = '/admin';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    logger.info(`[${request.method}] ${pathname}`);

    // Allow public routes without authentication
    const isPublicRoute =
        publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/')) ||
        publicExactRoutes.includes(pathname);
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

    if (!token && !refreshToken) {
        const loginUrl = pathname.startsWith(ADMIN_PREFIX)
            ? '/admin/login'
            : pathname.startsWith(RECRUITER_PREFIX)
            ? '/recruiter/auth'
            : '/?showLogin=true';
        return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // JWT role enforcement — decode access_token to check role claim
    if (token && process.env.JWT_SECRET) {
        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            const role = payload.role as string | undefined;

            if (pathname.startsWith(RECRUITER_PREFIX) && role !== 'recruiter' && role !== 'admin') {
                return NextResponse.redirect(new URL('/403', request.url));
            }
            if (pathname.startsWith(ADMIN_PREFIX) && role !== 'admin') {
                return NextResponse.redirect(new URL('/403', request.url));
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
                : '/?showLogin=true';
            return NextResponse.redirect(new URL(loginUrl, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|api).*)',
    ],
};
