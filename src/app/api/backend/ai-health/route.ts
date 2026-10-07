import { NextResponse } from 'next/server';
import { evaluateAiServiceStatus } from '@/lib/aiHealthCheck';
import { withApiMetrics } from '@/lib/observability/withApiMetrics';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

async function handleGET() {
  const checks: Record<string, { ok: boolean; status?: number; latencyMs: number; error?: string }> = {};

  // Check if backend at port 8000 is reachable (use a lightweight GET endpoint)
  const t0 = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/mock-test/companies`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.backend_8000 = { ok: res.ok, status: res.status, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    checks.backend_8000 = { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }

  // Read the AI service's status from the backend's own health check instead of
  // inferring it from a /mock-test/generate call. That approach never worked:
  // /generate needs an authenticated user (httpOnly cookies this server-side
  // fetch doesn't have), so it 401/403'd before ever reaching the AI service —
  // this route would report "healthy" during a real outage. /health/detailed
  // requires no auth and does this check server-side already.
  const t1 = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/health/detailed`, {
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => ({}));
    const { ok, error } = evaluateAiServiceStatus(body);
    checks.ai_service = { ok, status: res.status, latencyMs: Date.now() - t1, ...(error ? { error } : {}) };
  } catch (e: any) {
    checks.ai_service = { ok: false, latencyMs: Date.now() - t1, error: e.message };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}

export const GET = withApiMetrics('/api/backend/ai-health', 'GET', handleGET);
