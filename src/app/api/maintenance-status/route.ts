import { NextRequest, NextResponse } from 'next/server';

// Node.js process-level cache — persists across requests within the same server instance.
// Re-probes the Python backend every 15 s so client-side checks (ClientLayout poll)
// always reflect the real maintenance state within one TTL window.
let cache: { enabled: boolean; updatedAt: number } = { enabled: false, updatedAt: 0 };
const CACHE_TTL_MS = 15_000;
// Back off on repeated failures to avoid a probe storm when the backend is unreachable.
let lastFailedProbeAt = 0;
const FAILED_PROBE_BACKOFF_MS = 10_000;
// In-flight deduplication: concurrent requests share one probe promise.
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
            const data = await res.json().catch(() => null);
            // error_code is nested under data.error, not at the top level.
            // Return null for an unparseable body (data===null) so the caller
            // treats it as ambiguous and preserves the prior cache state instead
            // of caching false and potentially flipping the gate open while
            // maintenance is genuinely active.
            if (String(data?.error?.error_code ?? '').toUpperCase() === 'MAINTENANCE_MODE') return true;
            return data ? false : null;
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
    // Probe when: (a) cold start or stale cache (15 s TTL, both states), AND (b) backoff window has cleared.
    const stale = cache.updatedAt === 0 || Date.now() - cache.updatedAt > CACHE_TTL_MS;
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
            // Backend unreachable — keep the current enabled state so a POST-set
            // enabled:true isn't silently erased when the probe can't reach the backend.
            // On cold start (updatedAt===0) leave updatedAt at 0 so the next request
            // re-probes after just the 10 s backoff rather than the full 15 s TTL —
            // this shrinks the window where a cold-start failure keeps maintenance
            // mode undetected. On a warm cache, stamp updatedAt normally.
            lastFailedProbeAt = Date.now();
            cache = { enabled: cache.enabled, updatedAt: cache.updatedAt === 0 ? 0 : Date.now() };
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
