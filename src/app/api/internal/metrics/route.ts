/**
 * GET /api/internal/metrics — Prometheus exposition for careerbot-web (roadmap B8).
 *
 * Token-gated with METRICS_SCRAPE_TOKEN (see src/lib/observability/scrapeAuth.ts):
 *   unset / < 32 chars -> 404, wrong token -> 401, right token -> 200.
 * This path is reachable from the internet through nginx's catch-all, so the
 * token is the control, not the network.
 *
 * Scrape: GET http://careerbot-web:3000/api/internal/metrics
 *         Authorization: Bearer <METRICS_SCRAPE_TOKEN>
 *
 * Deliberately NOT wrapped in withApiMetrics: scrapes would count themselves.
 */
import { checkScrapeAuth } from '@/lib/observability/scrapeAuth';
import { getWebMetrics } from '@/lib/observability/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const auth = checkScrapeAuth(request.headers.get('authorization'));
  if (auth === 'disabled') {
    return new Response('Not Found', { status: 404, headers: NO_STORE });
  }
  if (auth === 'unauthorized') {
    return new Response('Invalid metrics token', {
      status: 401,
      headers: { ...NO_STORE, 'WWW-Authenticate': 'Bearer' },
    });
  }

  const { registry } = getWebMetrics();
  return new Response(await registry.metrics(), {
    status: 200,
    headers: { ...NO_STORE, 'Content-Type': registry.contentType },
  });
}
