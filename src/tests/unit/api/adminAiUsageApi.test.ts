/**
 * careerbot-web #78 (P0): httpClient's baseURL is already NEXT_PUBLIC_BASE_URL
 * || '/api/v1' (src/lib/http.ts), and axios joins baseURL + path even when the
 * path starts with '/'. adminAiUsageApi passed '/api/v1/admin/...', so both
 * AI-usage screens requested /api/v1/api/v1/admin/... and got a 404. Same bug
 * useCatalogues had (PR #96). (paymentApi's '/api/v1/...' paths are correct:
 * each of those calls overrides baseURL to ''.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock('@/lib/http', () => {
  const client = { get: mockGet, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: {} };
  return { default: client, httpClient: client };
});
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getUserAiUsage, getInstitutionAiUsage } from '@/api/adminAiUsageApi';

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ data: {} });
});

describe('adminAiUsageApi', () => {
  it('requests user usage relative to the /api/v1 baseURL', async () => {
    await getUserAiUsage('u 1/x', 7);
    expect(mockGet).toHaveBeenCalledWith('/admin/users/u%201%2Fx/ai-usage', { params: { days: 7 } });
  });

  it('requests institution usage relative to the /api/v1 baseURL', async () => {
    await getInstitutionAiUsage('c1', 30, 10);
    expect(mockGet).toHaveBeenCalledWith('/admin/institutions/c1/ai-usage', { params: { days: 30, limit: 10 } });
  });
});
