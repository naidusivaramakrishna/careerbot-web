import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
    '/dashboard/profile',
    '/dashboard/resume',
    '/dashboard/atsscan',
    '/dashboard/jobs',
    '/dashboard/job-match',
];

// Define auth routes (login/signup pages)
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies or check if it exists
    const token = request.cookies.get('access_token')?.value;

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if the current route is an auth route
    const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If user is not logged in and trying to access protected route
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/signup', request.url);
        loginUrl.searchParams.set('redirect', pathname); // Save the intended destination
        return NextResponse.redirect(loginUrl);
    }

    // If user is logged in and trying to access auth routes (login/signup)
    // Redirect them to dashboard
    if (isAuthRoute && token) {
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