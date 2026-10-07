/**
 * Prometheus registry for the web layer (roadmap B8). SERVER ONLY.
 *
 * Import this from route handlers (nodejs runtime) only. Never from a client
 * component and never from src/middleware.ts: the edge runtime has no
 * prom-client (it needs process, perf_hooks, v8).
 *
 * WHY globalThis: `next dev` re-evaluates modules on HMR, and Next can load
 * the same module in more than one server chunk. A module-level `new
 * Registry()` would then be created twice and registering a metric name a
 * second time throws ("A metric with the name ... has already been
 * registered"). Keying the singleton on a global Symbol makes every copy of
 * this module share one registry for the life of the process.
 *
 * A PRIVATE Registry, not prom-client's global `register`, so nothing else
 * that happens to import prom-client can collide with or leak into this
 * exposition.
 */
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

import { CLIENT_ERROR_KINDS } from './clientErrorKind';

export interface WebMetrics {
  registry: Registry;
  apiRequests: Counter<'route' | 'method' | 'status'>;
  apiDuration: Histogram<'route' | 'method'>;
  clientErrors: Counter<'kind'>;
  clientErrorsRejected: Counter<'reason'>;
  buildInfo: Gauge<'version' | 'commit'>;
}

// Upper buckets reach next.config.ts experimental.proxyTimeout (240 s): the
// slow mock-test generation path is exactly what this should make visible.
export const API_DURATION_BUCKETS = [
  0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 240,
];

export const CLIENT_ERROR_REJECT_REASONS = ['too_large', 'bad_request', 'rate_limited'] as const;

const GLOBAL_KEY = Symbol.for('careerbot.web.metrics.v1');

// Build labels come from the environment, so bound them: an unexpected value
// must not become an arbitrary (or huge) label.
const SAFE_LABEL = /^[A-Za-z0-9._+-]{1,64}$/;

export function buildLabel(value: string | undefined): string {
  if (!value) return 'unknown';
  return SAFE_LABEL.test(value) ? value : 'invalid';
}

function create(): WebMetrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: 'web_' });

  const apiRequests = new Counter({
    name: 'web_api_requests_total',
    help: 'Requests handled by careerbot-web route handlers (src/app/api/**).',
    labelNames: ['route', 'method', 'status'] as const,
    registers: [registry],
  });

  const apiDuration = new Histogram({
    name: 'web_api_request_duration_seconds',
    help: 'Time until a careerbot-web route handler returned its Response.',
    labelNames: ['route', 'method'] as const,
    buckets: API_DURATION_BUCKETS,
    registers: [registry],
  });

  const clientErrors = new Counter({
    name: 'web_client_errors_total',
    help: 'Browser-side errors reported to /api/internal/client-error.',
    labelNames: ['kind'] as const,
    registers: [registry],
  });

  const clientErrorsRejected = new Counter({
    name: 'web_client_error_reports_rejected_total',
    help: 'Client error reports refused by /api/internal/client-error.',
    labelNames: ['reason'] as const,
    registers: [registry],
  });

  const buildInfo = new Gauge({
    name: 'web_build_info',
    help: 'careerbot-web build metadata; value is always 1.',
    labelNames: ['version', 'commit'] as const,
    registers: [registry],
  });

  // Pre-initialise bounded series so rate() and absent() work from the
  // first scrape instead of the first occurrence.
  for (const kind of CLIENT_ERROR_KINDS) clientErrors.inc({ kind }, 0);
  for (const reason of CLIENT_ERROR_REJECT_REASONS) clientErrorsRejected.inc({ reason }, 0);

  buildInfo.set(
    {
      // npm_package_version is set by `npm run start`, which is how the image runs.
      version: buildLabel(process.env.APP_VERSION || process.env.npm_package_version),
      commit: buildLabel(process.env.GIT_COMMIT || process.env.SOURCE_COMMIT),
    },
    1,
  );

  return { registry, apiRequests, apiDuration, clientErrors, clientErrorsRejected, buildInfo };
}

export function getWebMetrics(): WebMetrics {
  const g = globalThis as unknown as Record<symbol, WebMetrics | undefined>;
  let metrics = g[GLOBAL_KEY];
  if (!metrics) {
    metrics = create();
    g[GLOBAL_KEY] = metrics;
  }
  return metrics;
}

/** Test-only: drop the singleton so each test starts from zero. */
export function resetWebMetricsForTests(): void {
  const g = globalThis as unknown as Record<symbol, WebMetrics | undefined>;
  g[GLOBAL_KEY]?.registry.clear();
  delete g[GLOBAL_KEY];
}
