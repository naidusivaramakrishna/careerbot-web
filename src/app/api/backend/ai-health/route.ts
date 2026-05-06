import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  // Try to hit the generate endpoint with a dry-run to see if AI service responds
  // (we expect a validation or auth error, NOT AI_SERVICE_UNAVAILABLE — that tells us it's working)
  const t1 = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/mock-test/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 1, time_limit: 5, type: 'mcq',
        company_context: 'health-check', category: ['arithmetic'],
        subcategory: ['percentages'], difficulty: 'easy',
        cross_verify: false, exclude_question_ids: [],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    const isAiDown = body?.error_code === 'AI_SERVICE_UNAVAILABLE';
    checks.ai_service_8001 = {
      ok: !isAiDown,
      status: res.status,
      latencyMs: Date.now() - t1,
      ...(isAiDown ? { error: `AI_SERVICE_UNAVAILABLE — error_id: ${body?.error_id}` } : {}),
    };
  } catch (e: any) {
    checks.ai_service_8001 = { ok: false, latencyMs: Date.now() - t1, error: e.message };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
