import { describe, expect, it } from 'vitest';
import { evaluateAiServiceStatus } from '@/lib/aiHealthCheck';

describe('evaluateAiServiceStatus (ai-health route decision logic)', () => {
  it('reports ok when the AI service is healthy', () => {
    const result = evaluateAiServiceStatus({ checks: { ai_service: { status: 'healthy' } } });
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('reports not ok when the AI service is unhealthy', () => {
    const result = evaluateAiServiceStatus({ checks: { ai_service: { status: 'unhealthy' } } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unhealthy/);
  });

  it('reports not ok when the AI service is unavailable', () => {
    const result = evaluateAiServiceStatus({ checks: { ai_service: { status: 'unavailable' } } });
    expect(result.ok).toBe(false);
  });

  it('reports not ok (not "healthy") when the status key is missing entirely', () => {
    const result = evaluateAiServiceStatus({ checks: { mongodb: { status: 'healthy' } } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/missing/);
  });

  it('reports not ok for a response with no checks at all (e.g. a non-2xx error body)', () => {
    const result = evaluateAiServiceStatus({});
    expect(result.ok).toBe(false);
  });

  it('falls back to a wrapped body.data.checks shape if the response is ever wrapped', () => {
    const result = evaluateAiServiceStatus({ data: { checks: { ai_service: { status: 'healthy' } } } });
    expect(result.ok).toBe(true);
  });
});
