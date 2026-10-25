/**
 * An expired college token must be recognised as stale so the UI can recover.
 *
 * The college token is not refreshed like the login token. When it lapsed, every
 * college call answered 401 with a message the stale-session check did not
 * recognise, so nothing cleared the stored session: panels stayed at zero under
 * "Your session ended" until the tab was closed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer college-token' };
});

import {
  listDepartments,
  listMemberships,
  onInstitutionSessionStale,
} from '@/api/institutionApi';
import { httpClient as mockHttp } from '@/lib/http';
import { ERROR_MESSAGES } from '@/lib/institutionMessages';

function axiosError(status: number, message: string, authorization?: string) {
  return {
    isAxiosError: true,
    config: { headers: authorization ? { Authorization: authorization } : {} },
    response: {
      status,
      data: { error: { message, details: { reason: 'INVALID_TOKEN' } } },
    },
    message: `Request failed with status code ${status}`,
  };
}

let stale: () => void;
let unsubscribe: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  unsubscribe?.();
  stale = vi.fn();
  unsubscribe = onInstitutionSessionStale(stale);
});

describe('expired / refused college token', () => {
  it('a 401 on a college call (college token sent) is published as stale', async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(
      axiosError(401, 'Invalid authentication token', 'Bearer college-token'));
    await expect(listDepartments()).rejects.toMatchObject({ reason: 'INVALID_TOKEN' });
    expect(stale).toHaveBeenCalledTimes(1);
  });

  it('works whatever the 401 message says (the old phrase list missed it)', async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(
      axiosError(401, 'Could not validate credentials', 'Bearer college-token'));
    await expect(listDepartments()).rejects.toBeDefined();
    expect(stale).toHaveBeenCalledTimes(1);
  });

  it('a 401 on the consumer call (no college token) is NOT a stale college session', async () => {
    // Memberships authenticate with the login cookie. A 401 there means the
    // LOGIN expired, which is a different recovery and must not wipe the college.
    vi.mocked(mockHttp.get).mockRejectedValueOnce(axiosError(401, 'Invalid authentication token'));
    await expect(listMemberships()).rejects.toBeDefined();
    expect(stale).not.toHaveBeenCalled();
  });

  it('an ordinary role refusal (403, other message) is not stale', async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(
      axiosError(403, 'operation not permitted for this role', 'Bearer college-token'));
    await expect(listDepartments()).rejects.toBeDefined();
    expect(stale).not.toHaveBeenCalled();
  });

  it('the existing membership-gone recovery still works', async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(
      axiosError(403, 'no active institution membership', 'Bearer college-token'));
    await expect(listDepartments()).rejects.toBeDefined();
    expect(stale).toHaveBeenCalledTimes(1);
  });
});

describe('the message', () => {
  it('does not tell a signed-in user to sign in again', () => {
    expect(ERROR_MESSAGES.INVALID_TOKEN).not.toMatch(/sign in/i);
    expect(ERROR_MESSAGES.INVALID_TOKEN).toMatch(/college/i);
  });
});
