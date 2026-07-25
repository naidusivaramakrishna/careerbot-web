/**
 * Unit tests for /api/maintenance-status GET handler
 *
 * Covers:
 *   - Cold start: probes backend and returns correct maintenance state
 *   - Warm cache: does not re-probe within 15 s TTL
 *   - TTL re-probe: re-probes after 15 s for both enabled:true and enabled:false
 *   - Probe failure: preserves prior cache.enabled instead of resetting to false
 *   - Failure backoff: does not re-probe within 10s after a failed probe
 *   - In-flight dedup: concurrent cold-start requests share one probe promise
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/server before any dynamic imports — persists across vi.resetModules()
vi.mock('next/server', () => ({
    NextResponse: { json: (data: unknown) => ({ _data: data }) },
    NextRequest: class {},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RouteResponse = { _data: { maintenance: boolean } };

async function importGET(): Promise<() => Promise<RouteResponse>> {
    const mod = await import('@/app/api/maintenance-status/route');
    return mod.GET as unknown as () => Promise<RouteResponse>;
}

function make503(errorCode = 'MAINTENANCE_MODE') {
    return {
        status: 503,
        json: async () => ({ error: { error_code: errorCode } }),
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('maintenance-status GET handler', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Fresh module-level state (cache, lastFailedProbeAt, probeInFlight) for each test
        vi.resetModules();
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('probes backend on cold start and returns maintenance:false on HTTP 200', async () => {
        mockFetch.mockResolvedValueOnce({ status: 200 });
        const GET = await importGET();
        const res = await GET();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(res._data).toEqual({ maintenance: false });
    });

    it('returns maintenance:true when backend responds 503 with MAINTENANCE_MODE error_code', async () => {
        mockFetch.mockResolvedValueOnce(make503());
        const GET = await importGET();
        const res = await GET();
        expect(res._data).toEqual({ maintenance: true });
    });

    it('returns maintenance:true when error_code is lowercase maintenance_mode (case-insensitive)', async () => {
        mockFetch.mockResolvedValueOnce(make503('maintenance_mode'));
        const GET = await importGET();
        const res = await GET();
        expect(res._data).toEqual({ maintenance: true });
    });

    it('returns maintenance:false when backend responds 503 with a non-maintenance error_code', async () => {
        mockFetch.mockResolvedValueOnce(make503('SERVICE_UNAVAILABLE'));
        const GET = await importGET();
        const res = await GET();
        expect(res._data).toEqual({ maintenance: false });
    });

    it('preserves prior cache.enabled when 503 body is unparseable (ambiguous 503)', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

        // First probe: maintenance ON (valid 503 with MAINTENANCE_MODE code)
        mockFetch.mockResolvedValueOnce(make503());
        const GET = await importGET();
        await GET(); // cache.enabled = true

        // Advance past TTL so next GET re-probes
        vi.setSystemTime(new Date('2024-01-01T00:00:16Z'));
        // Second probe: 503 with unparseable body (json() rejects)
        mockFetch.mockResolvedValueOnce({
            status: 503,
            json: async () => { throw new Error('invalid json'); },
        });

        const res = await GET();
        // Ambiguous 503 → prior enabled:true must be preserved, not flipped to false
        expect(res._data).toEqual({ maintenance: true });
    });

    it('does not re-probe when cache is fresh (within 15 s TTL)', async () => {
        mockFetch.mockResolvedValue({ status: 200 });
        const GET = await importGET();
        await GET(); // warm cache
        await GET(); // should use cached value
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('re-probes when cache is stale (enabled:false, older than 15 s)', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        mockFetch.mockResolvedValue({ status: 200 });

        const GET = await importGET();
        await GET(); // warm cache (enabled:false)

        vi.setSystemTime(new Date('2024-01-01T00:00:16Z')); // 16 s later — past 15 s TTL
        await GET(); // should re-probe

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('re-probes when cache is stale (enabled:true, older than 15 s)', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        mockFetch.mockResolvedValue(make503());

        const GET = await importGET();
        await GET(); // warm cache (enabled:true)

        vi.setSystemTime(new Date('2024-01-01T00:00:16Z')); // 16 s later — past 15 s TTL
        await GET(); // should re-probe

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('preserves cache.enabled when backend probe is unreachable', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

        // First probe: maintenance ON (set via successful probe)
        mockFetch.mockResolvedValueOnce(make503());
        const GET = await importGET();
        await GET(); // cache.enabled = true

        // Advance past TTL so next GET re-probes
        vi.setSystemTime(new Date('2024-01-01T00:00:20Z'));
        // Second probe: backend unreachable
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        // Advance past backoff window so the GET actually attempts the probe
        vi.setSystemTime(new Date('2024-01-01T00:00:35Z'));
        const res = await GET();

        // cache.enabled should remain true (not reset to false)
        expect(res._data).toEqual({ maintenance: true });
    });

    it('backs off within 10 seconds after a failed probe', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const GET = await importGET();
        await GET(); // probe fails, sets lastFailedProbeAt
        await GET(); // within 10s backoff — should NOT probe again
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent cold-start probe requests', async () => {
        let resolveFetch!: (v: unknown) => void;
        mockFetch.mockReturnValueOnce(new Promise(r => { resolveFetch = r; }));

        const GET = await importGET();
        const p1 = GET(); // starts probe, sets probeInFlight
        const p2 = GET(); // shares existing probeInFlight
        resolveFetch({ status: 200 });
        await Promise.all([p1, p2]);

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
