import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/builder/start',
    '/atslogin',
    '/enhancer',
    '/jobmatch',
    '/jobs',
    '/communication',
    '/settings'
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get tokens from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If user is not logged in and trying to access protected route
    // Check for both access_token AND refresh_token
    // - If access_token exists, allow (fresh session)
    // - If no access_token but refresh_token exists, allow (let interceptor refresh)
    // - If neither exists, redirect to home page (not authenticated)
    if (isProtectedRoute && !accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // TODO: Re-enable automatic redirect to dashboard for logged-in users
    // Disabled temporarily due to issues with login flows
    // if (pathname === '/' && token && !searchParams.has('showLogin')) {
    //     return NextResponse.redirect(new URL('/profile', request.url));
    // }

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