/**
 * Unit tests for /api/maintenance-status GET handler
 *
 * Covers:
 *   - Cold start: probes backend and returns correct maintenance state
 *   - Warm cache: does not re-probe within TTL when enabled:false
 *   - TTL re-probe: re-probes after 5 minutes when enabled:false
 *   - Sticky enabled:true: does NOT re-probe even after TTL (POST-driven design)
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

    it('returns maintenance:true when backend responds 503 with maintenance type', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 503,
            json: async () => ({ type: 'maintenance' }),
        });
        const GET = await importGET();
        const res = await GET();
        expect(res._data).toEqual({ maintenance: true });
    });

    it('does not re-probe when cache is fresh (enabled:false, within TTL)', async () => {
        mockFetch.mockResolvedValue({ status: 200 });
        const GET = await importGET();
        await GET(); // warm cache
        await GET(); // should use cached value
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('re-probes when cache is stale (enabled:false, older than 5 minutes)', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        mockFetch.mockResolvedValue({ status: 200 });

        const GET = await importGET();
        await GET(); // warm cache (enabled:false)

        vi.setSystemTime(new Date('2024-01-01T00:06:00Z')); // 6 min later — past TTL
        await GET(); // should re-probe

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does NOT re-probe when cache is enabled:true even after TTL (sticky until POST)', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        mockFetch.mockResolvedValueOnce({
            status: 503,
            json: async () => ({ type: 'maintenance' }),
        });

        const GET = await importGET();
        await GET(); // warm cache (enabled:true)

        vi.setSystemTime(new Date('2024-01-01T00:06:00Z')); // 6 min later
        const res = await GET(); // should NOT re-probe

        expect(mockFetch).toHaveBeenCalledTimes(1);
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
