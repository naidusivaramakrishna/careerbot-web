import { NextRequest, NextResponse } from 'next/server';

// Node.js process-level cache — persists across requests within the same server instance.
// updatedAt === 0 means cache was never explicitly set (cold start / server restart).
// When enabled:true the cache is sticky until a POST arrives (expected path for turning maintenance OFF).
// When enabled:false the cache re-probes after CACHE_TTL_MS so backend-side toggles are eventually picked up.
let cache: { enabled: boolean; updatedAt: number } = { enabled: false, updatedAt: 0 };
// Re-probe every 5 minutes when maintenance is off — catches backend-side toggles that bypass the POST.
const CACHE_TTL_MS = 5 * 60 * 1000;
// Back off on repeated failures to avoid a probe storm when the backend is unreachable.
let lastFailedProbeAt = 0;
const FAILED_PROBE_BACKOFF_MS = 10_000;
// In-flight deduplication: concurrent cold-start requests share one probe promise.
let probeInFlight: Promise<boolean | null> | null = null;

// On cold start, probe the Python backend directly to read the real maintenance state.
// The Python maintenance middleware runs before auth, so maintenance=ON returns 503.
async function fetchMaintenanceFromBackend(): Promise<boolean | null> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${backendUrl}/api/v1/`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(1500),
        });
        if (res.status === 503) {
            // Confirm it's a maintenance 503 (not a generic server error)
            const data = await res.json().catch(() => null);
            const isMaintenance =
                data?.type === 'maintenance' ||
                data?.error?.type === 'maintenance' ||
                String(data?.error_code ?? '').toLowerCase().includes('maintenance') ||
                String(data?.detail ?? '').toLowerCase().includes('maintenance');
            return isMaintenance ? true : null;
        }
        // 200, 404, 401 etc. → backend is up, maintenance is off
        return false;
    } catch {
        // Backend unreachable — return null so the banner fails open (maintenance=false).
        // Actual requests still hit the Python middleware which returns real 503s when
        // maintenance is ON, so the fail-open direction only affects the UI banner.
        return null;
    }
}

export async function GET() {
    // Probe when: (a) cold start or stale cache, AND (b) backoff window has cleared.
    // We only TTL-refresh the false state — enabled:true stays sticky until a POST arrives.
    // Folding the backoff gate into shouldProbe keeps the guard in one place.
    const stale = cache.updatedAt === 0 || (!cache.enabled && Date.now() - cache.updatedAt > CACHE_TTL_MS);
    const backoffClear = Date.now() - lastFailedProbeAt >= FAILED_PROBE_BACKOFF_MS;
    const shouldProbe = stale && backoffClear;

    if (shouldProbe) {
        // Deduplicate concurrent cold-start probes — all callers share one in-flight request
        if (!probeInFlight) {
            probeInFlight = fetchMaintenanceFromBackend().finally(() => {
                probeInFlight = null;
            });
        }
        const fromBackend = await probeInFlight;
        if (fromBackend !== null) {
            cache = { enabled: fromBackend, updatedAt: Date.now() };
        } else {
            lastFailedProbeAt = Date.now();
        }
    }
    return NextResponse.json({ maintenance: cache.enabled });
}

// Called by the admin settings page after a successful system config save.
// Gate: requires any authenticated session cookie (admin_access_token preferred,
// access_token as fallback) — mirrors the middleware.ts admin-route fallback pattern
// so sessions that carry only access_token are not silently rejected.
// This is a cookie-presence check only (no role or token validity verification).
// Low-risk: this route only updates the in-memory UI banner cache; the Python
// middleware independently enforces real maintenance mode.
export async function POST(req: NextRequest) {
    const adminToken =
        req.cookies.get('admin_access_token')?.value ||
        req.cookies.get('access_token')?.value;

    if (!adminToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        cache = { enabled: Boolean(body.enabled), updatedAt: Date.now() };
        return NextResponse.json({ success: true, maintenance: cache.enabled });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
