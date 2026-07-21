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
    "/blog",
    "/terms-of-service",
    "/privacy-policy",
    // Cover-letter creation flow remain public. Cover-letter
    // export/download handles auth at the action level.
    "/cover-letter",
    // Coding-test practice (list + problem detail) is a public preview slice;
    // the backing API is public/no-auth. Submit/grading will gate at the
    // action level when wired up.
    "/coding-test",
    // Maintenance page — always accessible
    "/maintenance",
];

// Edge-runtime module-level maintenance cache.
// TTL is intentionally short (5 s) so that when an admin enables maintenance
// the change propagates to users within 5 s instead of 30 s. The Node.js
// route handler at /api/maintenance-status is updated synchronously by
// useSystemConfig on every save, so it always has the latest value.
let maintenanceEdgeCache: { enabled: boolean; checkedAt: number } = {
    enabled: false,
    checkedAt: 0,
};

async function isMaintenanceMode(requestUrl: string): Promise<boolean> {
    const now = Date.now();
    if (now - maintenanceEdgeCache.checkedAt < 5_000) {
        return maintenanceEdgeCache.enabled;
    }
    try {
        const url = new URL('/api/maintenance-status', requestUrl);
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
            const data: { maintenance: boolean } = await res.json();
            maintenanceEdgeCache = { enabled: Boolean(data.maintenance), checkedAt: now };
        }
    } catch {
        // keep stale value on error — fail open is safer than blocking all traffic
    }
    return maintenanceEdgeCache.enabled;
}

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

function redirectToLogin(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const target = pathname.startsWith(ADMIN_PREFIX)
        ? new URL('/admin/login', request.url)
        : pathname.startsWith(RECRUITER_PREFIX)
        ? new URL('/recruiter/auth', request.url)
        : buildUserLoginUrl(request);
    return NextResponse.redirect(target);
}

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'moderator', 'support']);

function roleAllows(pathname: string, actor: string | undefined): boolean {
    const a = actor?.toLowerCase();
    if (pathname.startsWith(ADMIN_PREFIX)) {
        return !!(a && ADMIN_ROLES.has(a));
    }
    if (pathname.startsWith(RECRUITER_PREFIX)) {
        return a === 'recruiter' || !!(a && ADMIN_ROLES.has(a));
    }
    return true;
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

    // Landing pages accessible without auth (exact path only — sub-paths remain protected).
    // Add a path here to make ONLY that exact URL public; /path/anything stays protected.
    const publicLandingPages = ['/jobmatch', '/ats', '/payments', '/mock-interview', '/builder', '/communication'];
    if (publicLandingPages.includes(pathname)) {
        return NextResponse.next();
    }

    // Maintenance mode — only for regular user routes (admin/recruiter bypass so
    // admins can always reach the dashboard to turn maintenance off)
    const isAdminOrRecruiter =
        pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(RECRUITER_PREFIX);
    if (!isAdminOrRecruiter && await isMaintenanceMode(request.url)) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // For admin paths, prefer admin_access_token to avoid stale user session
    // cookies causing false 403s when both cookies coexist in the browser.
    const isAdminPath = pathname.startsWith(ADMIN_PREFIX);
    const token = isAdminPath
        ? (request.cookies.get('admin_access_token')?.value || request.cookies.get('access_token')?.value)
        : (request.cookies.get('access_token')?.value || request.cookies.get('admin_access_token')?.value);
    const refreshToken = isAdminPath
        ? (request.cookies.get('admin_refresh_token')?.value || request.cookies.get('refresh_token')?.value)
        : (request.cookies.get('refresh_token')?.value || request.cookies.get('admin_refresh_token')?.value);

    if (!token && !refreshToken) {
        return redirectToLogin(request);
    }

    // JWT role enforcement — decode access_token to check role claim
    if (token && process.env.JWT_SECRET) {
        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            if (!roleAllows(pathname, payload.actor as string | undefined)) {
                return NextResponse.redirect(new URL('/403', request.url));
            }
            return NextResponse.next();
        } catch {
            // Access token present but invalid/expired — fall through to refresh.
        }
    }

    // 2) No verified access token. Attempt a server-side refresh for ALL
    //    routes — not just admin/recruiter. This prevents unauthenticated users
    //    from ever seeing a protected page (even briefly) when they have a
    //    stale refresh_token cookie from a previous session.
    if (refreshToken && process.env.JWT_SECRET) {
        try {
            // Keep the refresh on a SAME-ORIGIN relative path. It forwards the
            // raw httpOnly Cookie header, so the target must never be a
            // client-exposed/absolute base (e.g. NEXT_PUBLIC_BASE_URL) — that
            // would exfiltrate tokens to whatever host that var points at.
            // Next's rewrite (`/api/:path*` -> server-only BACKEND_URL in
            // next.config.ts) proxies this to the trusted backend.
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
                    if (!roleAllows(pathname, payload.actor as string | undefined)) {
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

    return redirectToLogin(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|images|api).*)',
    ],
};
