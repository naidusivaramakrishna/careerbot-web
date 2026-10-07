/**
 * Abuse bounds for POST /api/internal/client-error. Kept out of route.ts
 * because Next only allows its own named exports (GET, POST, runtime, ...)
 * from a route file.
 */
export const MAX_BODY_BYTES = 1024;
export const RATE_LIMIT_PER_WINDOW = 300;
export const RATE_LIMIT_WINDOW_MS = 60_000;

// Secondary circuit breaker, charged only for VALID reports (the route checks
// size, JSON, kind and Sec-Fetch-Site first), so malformed floods cannot spend
// it. The per-source limit is enforced upstream (nginx limit_req per IP on
// /api/internal/client-error). Process-wide here on purpose: a per-client key
// would mean holding an IP or other identifier in memory.
const rateWindow = { startedAt: 0, count: 0 };

export function allowClientErrorReport(now: number): boolean {
  if (now - rateWindow.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateWindow.startedAt = now;
    rateWindow.count = 0;
  }
  rateWindow.count += 1;
  return rateWindow.count <= RATE_LIMIT_PER_WINDOW;
}

/** Test-only. */
export function resetClientErrorRateLimitForTests(): void {
  rateWindow.startedAt = 0;
  rateWindow.count = 0;
}

export type CappedBody = { ok: true; text: string } | { ok: false };

/**
 * Reads at most `limit` bytes. Enforced on the bytes actually received, so a
 * missing or lying Content-Length header cannot get a larger body buffered.
 */
export async function readCappedBody(req: Request, limit: number): Promise<CappedBody> {
  if (!req.body) return { ok: true, text: '' };
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(buf) };
}
