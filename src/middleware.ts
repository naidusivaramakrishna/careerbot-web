import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
    '/dashboard/profile',
    '/builder/start',
    '/atslogin',
    '/enhancer',
    '/jobmatch',
    '/jobs',
    '/communication',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies or check if it exists
    const token = request.cookies.get('access_token')?.value;

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If user is not logged in and trying to access protected route
    // Redirect them to home page (landing page with login modal)
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If user is logged in and on root path (landing page), redirect to dashboard
    if (pathname === '/' && token) {
        return NextResponse.redirect(new URL('/dashboard/profile', request.url));
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