// Pure decision logic for /api/backend/ai-health's AI-service check, pulled out
// of the route handler so it's testable without mocking fetch/NextResponse.
export function evaluateAiServiceStatus(body: unknown): { ok: boolean; aiStatus?: string; error?: string } {
  const b = body as { checks?: { ai_service?: { status?: string } }; data?: { checks?: { ai_service?: { status?: string } } } } | null;
  // 'healthy' | 'unhealthy' | 'unavailable'. Also check body?.data?.checks in
  // case this response is ever wrapped like other backend endpoints
  // (mockTestApi.ts: response.data?.data ?? response.data) — verified
  // unwrapped against the live backend as of this check, but reading only the
  // unwrapped shape would silently stop detecting outages if that changed.
  const aiStatus = b?.checks?.ai_service?.status ?? b?.data?.checks?.ai_service?.status;
  // A missing key is NOT treated as healthy — if the shape changes or the
  // field disappears, report the problem instead of silently going green.
  const ok = aiStatus === 'healthy';
  return {
    ok,
    aiStatus,
    ...(!ok ? { error: aiStatus ? `AI service status: ${aiStatus}` : 'ai_service status missing from /health/detailed response' } : {}),
  };
}
