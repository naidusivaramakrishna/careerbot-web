import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that do NOT require authentication.
// Everything else is protected by default (denylist approach).
const publicRoutes = [
    '/',
    '/admin/login',
    '/recruiter/auth',
    '/verify-email',
    '/reset-password',
    '/forgot-password',
    '/resend-verification',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get tokens from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // Allow public routes without authentication
    const isPublicRoute = publicRoutes.some((route) =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // All other routes require authentication.
    // - If access_token exists, allow (fresh session)
    // - If no access_token but refresh_token exists, allow (interceptor will refresh)
    // - If neither exists, redirect to home page
    if (!accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|assets|api).*)',
    ],
};
