import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { logger } from '@/lib/logger';

// Public routes — no auth required
const publicRoutes = [
    '/',
    '/admin/login',
    // The college front door at {college}.careerbot.com. It is reached by
    // someone who is NOT signed in -- that is its whole job -- and it reads
    // only the public branding endpoint (id and name). Gating it sent a
    // student who typed their college's address to the CONSUMER marketing
    // page, with no way to tell they were in the right place, which is the
    // exact failure its own page comment warns about.
    //
    // Only this one path. /institution/join stays gated: claiming a code
    // needs a user account, and the redirect already preserves `next`, so a
    // student lands back on it after signing in. Every other /institution
    // screen must stay behind the gate.
    '/institution/login',
    '/recruiter/auth',
    '/auth/google/success',
    '/auth/linkedin/success',
    '/auth/error',
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

    const response = NextResponse.redirect(target);

    // Add no-cache headers when redirecting from protected admin pages
    if (pathname.startsWith(ADMIN_PREFIX)) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

// `platform_admin` is here deliberately. The claim is that `actor` is always the
// literal "admin" and never a role, in which case this entry is inert -- but the
// other four entries only make sense if that claim is false, and the minting code
// lives in careerbot-api where this repo cannot check it. If `actor` ever does
// carry a role, omitting `platform_admin` redirects the first person ever granted
// it to /admin/login on every /admin/* route, after a successful login, with no
// error. Inert if the claim holds, the entire fix if it does not.
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'platform_admin', 'moderator', 'support']);

// Logged at most once per process — this is a deployment fault, not a
// per-request event, and it would otherwise repeat on every navigation.
let warnedMissingJwtSecret = false;

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

// x-pathname must ride on the REQUEST headers: `headers()` in a Server
// Component returns the INCOMING request headers, so setting it on the
// response (as this previously did) was invisible to (user)/layout.tsx and it
// always fell back to '/dashboard'. It also leaked the path to the browser.
function nextWithPathname(request: NextRequest, pathname: string) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Add no-cache headers for admin/recruiter routes to prevent browser caching
    // This ensures that after logout, cached pages cannot be accessed
    if (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(RECRUITER_PREFIX)) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

/**
 * The signing key, under EITHER name the deployment might use.
 *
 * This frontend reads JWT_SECRET. The backend that MINTS the token reads
 * JWT_SECRET_KEY. They are the same secret with two names, and nothing made
 * them meet: a compose file passing one env file to both services set the
 * backend's key and left this one empty, so every admin session failed
 * verification and bounced back to /admin/login after a SUCCESSFUL login.
 *
 * Accepting both names is the fix that cannot be undone by a deployment: a
 * stack that sets either one now works, and one that sets both still prefers
 * the explicit JWT_SECRET.
 *
 * It does NOT fall open. A stack setting neither still verifies nothing and
 * still refuses -- see the warning further down, which is what makes that
 * state visible instead of silent.
 */
function signingSecret(): string | undefined {
    return process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || undefined;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    logger.info(`[${request.method}] ${pathname}`);

    // Maintenance mode — checked before public-route bail-outs so it applies to
    // ALL routes including /, /browse-templates, /blog, etc.
    // Admin/recruiter bypass so they can reach the dashboard to turn it off.
    // /maintenance itself is always let through to avoid an infinite redirect loop.
    const isAdminOrRecruiter =
        pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(RECRUITER_PREFIX);
    if (!isAdminOrRecruiter && pathname !== '/maintenance' && !pathname.startsWith('/maintenance/')) {
        if (await isMaintenanceMode(request.url)) {
            return NextResponse.redirect(new URL('/maintenance', request.url));
        }
    }

    // Allow public routes without authentication
    const isPublicRoute =
        publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
    if (isPublicRoute) {
        // nextWithPathname, not a bare next(): a public page nested under a
        // guarded layout still needs x-pathname to identify itself. Without
        // it /institution/login fell back to the layout's default of
        // '/institution' and was redirected as though it were the gated area.
        return nextWithPathname(request, pathname);
    }

    // Landing pages accessible without auth (exact path only — sub-paths remain protected).
    // Add a path here to make ONLY that exact URL public; /path/anything stays protected.
    const publicLandingPages = ['/ats', '/jobmatch', '/jobs', '/payments', '/mock-interview', '/builder', '/communication'];
    if (publicLandingPages.includes(pathname)) {
        return NextResponse.next();
    }

    // Token selection is scoped to the route type.
    // Admin paths: prefer admin cookies, fall back to user cookies.
    // User paths: prefer user cookies, fall back to admin cookies so admins can access user areas.
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
    const secret = signingSecret();
    if (token && secret) {
        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(secret)
            );
            if (!roleAllows(pathname, payload.actor as string | undefined)) {
                return NextResponse.redirect(new URL('/403', request.url));
            }
            return nextWithPathname(request, pathname);
        } catch {
            // Access token present but invalid/expired — fall through to refresh.
        }
    }

    // 2) No verified token.
    // For Admin/Recruiter paths: require valid token or proceed to refresh attempt
    // For User paths: either auth cookie is enough — let the request through;
    //    the client HTTP interceptor refreshes on the first 401 and the backend
    //    re-validates the token on every API call.
    //
    // For user paths, `token` must be accepted here, not just `refreshToken`.
    // The refresh cookie is scoped to Path=/api/v1/auth/refresh, so the browser
    // never sends it on a page navigation — gating on it alone bounced freshly
    // signed-in users straight back to login whenever the access token
    // could not be verified here (JWT_SECRET unset, or token simply expired).

    if (!isAdminOrRecruiter) {
        if (token || refreshToken) {
            return nextWithPathname(request, pathname);
        }
        return redirectToLogin(request);
    }

    // 3) Role-gated area with no verified token (access token missing OR
    //    invalid). Attempt a server-side refresh, re-verify the NEW token's
    //    role, then bounce through a redirect so the page renders with a valid
    //    cookie. Every failure path falls through to the login redirect
    //    (fail-safe) — a forged/expired refresh cookie can never reach a
    //    role-gated page.
    if (refreshToken && secret) {
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
                        new TextEncoder().encode(secret)
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

    // We are about to bounce a role-gated request back to login. If JWT_SECRET
    // is simply ABSENT, both verification branches above were skipped -- not
    // because the session was bad, but because there was no key to check it
    // with. The result is an unbreakable loop: signing in succeeds and sets
    // valid cookies, then the very next navigation lands here and redirects to
    // /admin/login, with nothing logged anywhere to say why.
    //
    // Staying closed is the correct call -- an unverified token must never
    // reach an admin page, so this deliberately does NOT fall open. What it
    // fixes is the silence.
    if (isAdminOrRecruiter && !secret && !warnedMissingJwtSecret) {
        warnedMissingJwtSecret = true;
        logger.error(
            '[middleware] JWT_SECRET is not set, so no session can be verified: ' +
            'every /admin and /recruiter route will redirect to login even with ' +
            'valid credentials. Set JWT_SECRET (or JWT_SECRET_KEY) to the same ' +
            'value the backend signs with.'
        );
    }

    return redirectToLogin(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|images|api).*)',
    ],
};
