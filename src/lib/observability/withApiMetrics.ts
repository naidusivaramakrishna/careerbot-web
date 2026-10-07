/**
 * Route-handler wrapper that records web_api_requests_total and
 * web_api_request_duration_seconds. SERVER ONLY (imports prom-client).
 *
 *   async function handlePOST(req: NextRequest) { ... }
 *   export const POST = withApiMetrics('/api/backend/auth/refresh', 'POST', handlePOST);
 *
 * `route` is the route FILE template (e.g. /api/backend/enhance-keywords/[resumeId]),
 * never the request URL, so label cardinality is bounded by the number of
 * route files. A sweep test (withApiMetrics.test.ts) checks every route file
 * passes its own template.
 *
 * Not done in src/middleware.ts on purpose: middleware runs on the edge
 * runtime, which cannot load prom-client, and the matcher excludes /api.
 *
 * Duration is measured until the handler resolves its Response. For a
 * streamed body that is time-to-headers, not time-to-last-byte.
 */
import { getWebMetrics } from './registry';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Next's redirect()/notFound() helpers throw control-flow errors carrying a
// digest; they are not failures and must not be counted as 500.
//   NEXT_REDIRECT;<type>;<url>;<status>;   NEXT_HTTP_ERROR_FALLBACK;<status>   NEXT_NOT_FOUND
export function statusFromThrown(err: unknown): string {
  const digest = (err as { digest?: unknown } | null)?.digest;
  if (typeof digest === 'string') {
    const parts = digest.split(';');
    if (parts[0] === 'NEXT_REDIRECT') return /^\d{3}$/.test(parts[3] ?? '') ? parts[3] : '307';
    if (parts[0] === 'NEXT_HTTP_ERROR_FALLBACK' && /^\d{3}$/.test(parts[1] ?? '')) return parts[1];
    if (parts[0] === 'NEXT_NOT_FOUND') return '404';
  }
  return '500';
}

function statusOf(res: unknown): string {
  const status = (res as { status?: unknown } | null | undefined)?.status;
  // Only a real 3-digit HTTP status becomes a label; anything else is bounded to "unknown".
  return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599
    ? String(status)
    : 'unknown';
}

export function withApiMetrics<A extends unknown[], R>(
  route: string,
  method: HttpMethod,
  handler: (...args: A) => R | Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    const { apiRequests, apiDuration } = getWebMetrics();
    const endTimer = apiDuration.startTimer({ route, method });
    try {
      const res = await handler(...args);
      apiRequests.inc({ route, method, status: statusOf(res) });
      return res;
    } catch (err) {
      apiRequests.inc({ route, method, status: statusFromThrown(err) });
      throw err;
    } finally {
      endTimer();
    }
  };
}
