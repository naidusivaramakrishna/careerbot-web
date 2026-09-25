/**
 * PR #96 ai-review (58ef79ee) P2s — catalogue requests.
 *  - useCatalogues passed '/api/v1/templates/catalogues/all' to httpClient,
 *    whose baseURL is already '/api/v1' (src/lib/http.ts), so it requested
 *    /api/v1/api/v1/templates/catalogues/all and catalogues never loaded.
 *  - Applying a catalogue used raw fetch() with an unencoded key; it now goes
 *    through httpClient (401 refresh, NEXT_PUBLIC_BASE_URL) with query params.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockGet, mockPost, mockPatch } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn(), mockPatch: vi.fn() }));
vi.mock('@/lib/http', () => {
  const client = { get: mockGet, post: mockPost, put: vi.fn(), patch: mockPatch, delete: vi.fn(), defaults: {} };
  return { default: client, httpClient: client };
});
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { useCatalogues } from '@/hooks/useCatalogues';
import * as resumeApi from '@/api/resumeApi';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('useCatalogues', () => {
  it('requests the path relative to the /api/v1 baseURL (no doubled prefix)', async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderHook(() => useCatalogues());
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(mockGet).toHaveBeenCalledWith('/templates/catalogues/all');
  });
});

describe('applyCatalogueToResume', () => {
  it('POSTs through httpClient with an encoded resume id and the key as a query param', async () => {
    mockPost.mockResolvedValue({ data: {} });
    const apply = (resumeApi as Record<string, unknown>).applyCatalogueToResume as
      | ((resumeId: string, key: string) => Promise<void>)
      | undefined;
    expect(typeof apply).toBe('function');
    await apply!('r 1/x', 'a&b');
    expect(mockPost).toHaveBeenCalledWith('/templates/catalogues/r%201%2Fx/apply', undefined, {
      params: { catalogue_key: 'a&b' },
    });
  });
});

describe('applyCatalogueToEnhancedResume', () => {
  // careerbot-api: PATCH /resume/enhance/{enhanced_id} accepts a top-level
  // `applied_catalogue` (BulkUpdateEnhancedResumeRequest) and the enhanced
  // download falls back to it (resume_enhancer.py:1985).
  it('PATCHes applied_catalogue on the enhanced resume with an encoded id', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    const apply = (resumeApi as Record<string, unknown>).applyCatalogueToEnhancedResume as
      | ((enhancedId: string, key: string) => Promise<void>)
      | undefined;
    expect(typeof apply).toBe('function');
    await apply!('e 1/x', 'ocean');
    expect(mockPatch).toHaveBeenCalledWith('/resume/enhance/e%201%2Fx', { applied_catalogue: 'ocean' });
    expect(mockPost).not.toHaveBeenCalled();
  });
});
