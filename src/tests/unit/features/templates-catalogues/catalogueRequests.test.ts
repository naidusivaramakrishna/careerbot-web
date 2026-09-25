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

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));
vi.mock('@/lib/http', () => {
  const client = { get: mockGet, post: mockPost, put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: {} };
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
