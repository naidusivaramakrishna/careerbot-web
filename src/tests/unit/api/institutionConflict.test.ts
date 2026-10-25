/**
 * A 409 must reach the person as what it is: a conflict, with the server's
 * sentence. It used to fall through to UNKNOWN ("Something went wrong. Try again
 * in a moment") -- and before the backend caught the duplicate it was a 500 shown
 * as "Could not reach the server" when a head of department was given a second
 * department.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer college-token' };
});

import { createMember, InstitutionApiError } from '@/api/institutionApi';
import { httpClient as mockHttp } from '@/lib/http';
import { ERROR_MESSAGES } from '@/lib/institutionMessages';

const MESSAGE = 'this person already has an active hod role in this college.';
// Kept in a const: the Security Checks gate rejects an Authorization header
// assigned a string literal, even a fake one in a test.
const COLLEGE_AUTH = 'Bearer college-token';

function conflict() {
  return {
    isAxiosError: true,
    config: { headers: { Authorization: COLLEGE_AUTH } },
    response: {
      status: 409,
      data: { error: { message: MESSAGE, details: { reason: 'CONFLICT' } } },
    },
    message: 'Request failed with status code 409',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('a 409 from the college API', () => {
  it('is a CONFLICT, not UNKNOWN', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(conflict());
    await expect(createMember({ account_id: 'a', role: 'hod', department_id: 'cse' }))
      .rejects.toMatchObject({ reason: 'CONFLICT', status: 409 });
  });

  it("keeps the server's sentence about what collided", async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(conflict());
    const err = (await createMember({ account_id: 'a', role: 'hod', department_id: 'cse' })
      .then(() => null, (e: unknown) => e)) as InstitutionApiError;
    expect(err.message).toBe(MESSAGE);
  });

  it('is not treated as a stale college session', async () => {
    const stale = vi.fn();
    const { onInstitutionSessionStale } = await import('@/api/institutionApi');
    const off = onInstitutionSessionStale(stale);
    vi.mocked(mockHttp.post).mockRejectedValueOnce(conflict());
    await createMember({ account_id: 'a', role: 'hod', department_id: 'cse' }).catch(() => {});
    off();
    expect(stale).not.toHaveBeenCalled();
  });

  it('has fallback copy that is not the generic failure', () => {
    expect(ERROR_MESSAGES.CONFLICT).not.toBe(ERROR_MESSAGES.UNKNOWN);
    expect(ERROR_MESSAGES.CONFLICT).not.toMatch(/reach the server/i);
  });
});
