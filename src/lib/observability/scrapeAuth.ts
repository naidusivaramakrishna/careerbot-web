/**
 * Bearer-token gate for GET /api/internal/metrics. Same contract as the
 * backend's /internal/metrics (careerbot-api app/main.py):
 *
 *   METRICS_SCRAPE_TOKEN unset or < 32 chars -> 'disabled' (route answers 404,
 *       as if it did not exist). An unset secret must never mean "open", and
 *       a short one would be brute-forceable: nginx's catch-all makes this
 *       route reachable from the internet.
 *   wrong / missing / non-Bearer header       -> 'unauthorized' (401)
 *   correct token                             -> 'ok'
 *
 * Read at CALL time, not import time, so a rotated env var applies on restart
 * and tests can set it per case.
 */
import { createHash, timingSafeEqual } from 'crypto';

export const MIN_SCRAPE_TOKEN_LENGTH = 32;

export type ScrapeAuthResult = 'ok' | 'disabled' | 'unauthorized';

function digest(value: string): Buffer {
  // Hashing both sides gives equal-length buffers, so timingSafeEqual never
  // throws on a length mismatch and the length of the secret does not leak.
  return createHash('sha256').update(value, 'utf8').digest();
}

export function checkScrapeAuth(
  authorization: string | null,
  expected: string | undefined = process.env.METRICS_SCRAPE_TOKEN,
): ScrapeAuthResult {
  if (!expected || expected.length < MIN_SCRAPE_TOKEN_LENGTH) return 'disabled';

  const header = authorization ?? '';
  const space = header.indexOf(' ');
  const scheme = space === -1 ? header : header.slice(0, space);
  const presented = space === -1 ? '' : header.slice(space + 1);

  if (scheme.toLowerCase() !== 'bearer' || presented.length === 0) return 'unauthorized';
  return timingSafeEqual(digest(presented), digest(expected)) ? 'ok' : 'unauthorized';
}
