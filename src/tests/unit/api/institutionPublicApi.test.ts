/**
 * The branding call must stay SAME-ORIGIN. The backend reads the college from
 * the Host header; httpClient's default baseURL is NEXT_PUBLIC_BASE_URL, an
 * absolute backend URL that never carries the college's host. Dropping
 * `baseURL: ''` brings back the bug where every college page was unbranded.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock('@/lib/http', () => {
  const client = { get: mockGet, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: {} };
  return { default: client, httpClient: client };
});

import { getCollegeBranding } from '@/api/institutionPublicApi';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCollegeBranding', () => {
  it('asks the same origin, with the full path, so the college host reaches the backend', async () => {
    mockGet.mockResolvedValue({ data: { institution: { id: 'vit', name: 'VIT University' } } });

    const out = await getCollegeBranding();

    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/institution/public/branding',
      expect.objectContaining({ baseURL: '' }),
    );
    expect(out).toEqual({ id: 'vit', name: 'VIT University' });
  });

  it('returns null for a host that is not a college', async () => {
    mockGet.mockResolvedValue({ data: { institution: null } });
    expect(await getCollegeBranding()).toBeNull();
  });

  it('returns null instead of throwing when the lookup fails, so sign-in still renders', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    expect(await getCollegeBranding()).toBeNull();
  });
});
