/**
 * The consent call names NO student. The server resolves the caller's own
 * row; a client that sent an id would be asking to choose whose consent it is.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer test-token' };
});

import { InstitutionApiError, setMyLeaderboardConsent } from '@/api/institutionApi';
import { httpClient as mockHttpClient } from '@/lib/http';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('setMyLeaderboardConsent', () => {
  it.each([true, false])('PUTs {opt_in: %s} to the caller\'s own route', async (optIn) => {
    vi.mocked(mockHttpClient.put).mockResolvedValueOnce({
      data: { opt_in: optIn, changed: true },
    } as never);
    await expect(setMyLeaderboardConsent(optIn))
      .resolves.toEqual({ opt_in: optIn, changed: true });
    const [url, body, config] = vi.mocked(mockHttpClient.put).mock.calls[0];
    expect(url).toMatch(/\/institution\/students\/me\/leaderboard$/);
    expect(body).toEqual({ opt_in: optIn });
    // The college session, and no consumer-login redirect on a 401.
    expect(config).toMatchObject({
      headers: {
        Authorization: 'Bearer test-token',
        'X-Skip-Auth-Redirect': 'true',
      },
    });
  });

  it('throws on a refusal, so the switch can put itself back', async () => {
    vi.mocked(mockHttpClient.put).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: {} },
      message: 'Request failed with status code 403',
    });
    await expect(setMyLeaderboardConsent(true))
      .rejects.toBeInstanceOf(InstitutionApiError);
  });
});
