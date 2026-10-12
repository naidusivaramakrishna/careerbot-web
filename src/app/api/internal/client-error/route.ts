/**
 * POST /api/internal/client-error — browser error beacon (roadmap B8).
 *
 * Called by src/components/ClientErrorReporter.tsx. Increments
 * web_client_errors_total{kind} and NOTHING else: no message, stack, URL,
 * user agent, cookie, user id or IP is read into a label, logged or stored.
 * The only field consumed is `kind`, which must be one of CLIENT_ERROR_KINDS.
 *
 * Abuse bounds (the endpoint is public and unauthenticated by design):
 *   - body capped at MAX_BODY_BYTES (413), checked on Content-Length AND on
 *     the bytes actually read, so a lying or absent header does not help;
 *   - cross-site browser posts refused (Sec-Fetch-Site: cross-site);
 *   - a process-wide fixed-window cap (429), charged ONLY for reports that
 *     passed every check above, so malformed traffic cannot exhaust it. It is
 *     a secondary circuit breaker, not the abuse control: the per-source
 *     limit is enforced upstream (nginx limit_req, per IP, on this path).
 *     Global here so no client identifier is ever held in memory.
 */
import { NextRequest, NextResponse } from 'next/server';

import { isClientErrorKind } from '@/lib/observability/clientErrorKind';
import {
  MAX_BODY_BYTES,
  allowClientErrorReport,
  readCappedBody,
} from '@/lib/observability/clientErrorLimits';
import { getWebMetrics } from '@/lib/observability/registry';
import { withApiMetrics } from '@/lib/observability/withApiMetrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reject(reason: 'too_large' | 'bad_request' | 'rate_limited', status: number) {
  getWebMetrics().clientErrorsRejected.inc({ reason });
  return new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function handlePOST(req: NextRequest) {
  // Validate first; only a well-formed report is charged against the cap.
  if (req.headers.get('sec-fetch-site') === 'cross-site') return reject('bad_request', 403);

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return reject('too_large', 413);

  const body = await readCappedBody(req, MAX_BODY_BYTES);
  if (!body.ok) return reject('too_large', 413);

  let kind: unknown;
  try {
    kind = (JSON.parse(body.text) as { kind?: unknown } | null)?.kind;
  } catch {
    // SyntaxError only: JSON.parse on a string throws nothing else.
    return reject('bad_request', 400);
  }
  if (!isClientErrorKind(kind)) return reject('bad_request', 400);

  if (!allowClientErrorReport(Date.now())) return reject('rate_limited', 429);

  getWebMetrics().clientErrors.inc({ kind });
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

export const POST = withApiMetrics('/api/internal/client-error', 'POST', handlePOST);
