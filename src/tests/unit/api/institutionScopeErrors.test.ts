/**
 * A scope refusal must be reported as a scope refusal.
 *
 * getMyStudentProfile used to collapse 403 into the same `null` it returns for
 * 404. A student whose membership was revoked, or whose college is
 * misconfigured, was told their record does not exist -- so they contact the
 * college about missing data while the college looks for a record that is
 * sitting right there.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer test-token' };
});

import { getMyStudentProfile, InstitutionApiError } from '@/api/institutionApi';
import { httpClient as mockHttpClient } from '@/lib/http';

function axiosError(status: number) {
  return {
    isAxiosError: true,
    response: { status, data: {} },
    message: `Request failed with status code ${status}`,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getMyStudentProfile', () => {
  it('returns null on 404 — this account genuinely has no student record here', async () => {
    vi.mocked(mockHttpClient.get).mockRejectedValueOnce(axiosError(404));
    await expect(getMyStudentProfile()).resolves.toBeNull();
  });

  it('THROWS on 403 rather than reporting "no record"', async () => {
    vi.mocked(mockHttpClient.get).mockRejectedValueOnce(axiosError(403));
    await expect(getMyStudentProfile()).rejects.toBeInstanceOf(InstitutionApiError);
  });

  it('reports the 403 as a scope refusal, not as an unknown failure', async () => {
    vi.mocked(mockHttpClient.get).mockRejectedValueOnce(axiosError(403));
    await expect(getMyStudentProfile()).rejects.toMatchObject({
      reason: 'FORBIDDEN',
    });
  });

  it('still returns the record on success', async () => {
    vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
      data: { id: 'student-1', full_name: 'A Student' },
    });
    await expect(getMyStudentProfile()).resolves.toMatchObject({ id: 'student-1' });
  });
});
