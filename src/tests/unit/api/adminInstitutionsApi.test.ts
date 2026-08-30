/**
 * The admin provisioning client.
 *
 * These routes authenticate as an ADMIN, not as a college member, which is why
 * this client exists separately from institutionApi: that one refuses to call
 * anything without a college session token, and an admin has no college.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));

import {
  AdminInstitutionError,
  appointOfficer,
  createCollege,
  getCollege,
  listColleges,
  markCollegePaid,
  revokeOfficer,
  slugProblem,
} from '@/api/adminInstitutionsApi';
import { httpClient as mockHttp } from '@/lib/http';

function apiError(status: number, reason: string, message: string) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: { error: { message, details: { reason } } },
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('paths', () => {
  it('talks to the admin tree, not the college tree', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({ data: { items: [], total: 0, skip: 0, limit: 25 } });
    await listColleges();
    expect(vi.mocked(mockHttp.get).mock.calls[0][0]).toBe('/admin/institutions');
  });

  it('encodes a college id into the path', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({ data: {} });
    await getCollege('vit chennai');
    expect(vi.mocked(mockHttp.get).mock.calls[0][0]).toBe('/admin/institutions/vit%20chennai');
  });

  it('encodes both ids when revoking', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await revokeOfficer('vit', 'm/1');
    expect(vi.mocked(mockHttp.post).mock.calls[0][0])
      .toBe('/admin/institutions/vit/cpo/m%2F1/revoke');
  });
});

describe('errors', () => {
  it('reads the reason from where the app actually puts it', async () => {
    // The global handler reshapes every HTTPException, so the machine-readable
    // reason is at error.details.reason -- not at detail.reason where FastAPI
    // put it. A client parsing the raw shape finds nothing.
    vi.mocked(mockHttp.post).mockRejectedValueOnce(
      apiError(409, 'CONFLICT', "a college already exists with the id 'vit'"));
    await expect(createCollege({ id: 'vit', name: 'VIT' }))
      .rejects.toMatchObject({ reason: 'CONFLICT', status: 409 });
  });

  it('marks a taken id as a conflict, not a permission problem', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(
      apiError(409, 'CONFLICT', 'taken'));
    try {
      await createCollege({ id: 'vit', name: 'VIT' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AdminInstitutionError);
      expect((e as AdminInstitutionError).isConflict).toBe(true);
      expect((e as AdminInstitutionError).isForbidden).toBe(false);
    }
  });

  it('treats 401 and 403 the same — the console cannot tell them apart', async () => {
    for (const status of [401, 403]) {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        apiError(status, 'FORBIDDEN', 'no'));
      try {
        await listColleges();
      } catch (e) {
        expect((e as AdminInstitutionError).isForbidden).toBe(true);
      }
    }
  });

  it('survives an error shape it does not recognise', async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(new Error('network down'));
    await expect(listColleges()).rejects.toBeInstanceOf(AdminInstitutionError);
  });
});

describe('appointOfficer', () => {
  it('never sends a role — the server hard-codes it', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await appointOfficer('vit', { account_id: 'acct-1', display_name: 'P M' });
    const body = vi.mocked(mockHttp.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ account_id: 'acct-1', display_name: 'P M' });
    expect(body.role).toBeUndefined();
    expect(body.institution_id).toBeUndefined();
  });
});

describe('slugProblem', () => {
  it('accepts a real slug', () => {
    expect(slugProblem('vit-chennai')).toBeNull();
  });

  it('rejects what the server would reject, so the message lands on the field', () => {
    expect(slugProblem('')).toBeTruthy();
    expect(slugProblem('   ')).toBeTruthy();
    expect(slugProblem('VIT')).toBeTruthy();
    expect(slugProblem('vit chennai')).toBeTruthy();
    expect(slugProblem('vit_chennai')).toBeTruthy();
    expect(slugProblem('x'.repeat(51))).toBeTruthy();
  });
});

describe('marking a college paid', () => {
  it('posts to mark-paid with NO body', async () => {
    /**
     * The route accepts none, and that is what stops it being asked for
     * "trial" -- which would mint a second fourteen-day trial for a college
     * that has already had one.
     */
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { id: 'vit', tier: 'paid', changed: true },
    } as never);
    await markCollegePaid('vit');
    const [url, body] = vi.mocked(mockHttp.post).mock.calls[0];
    expect(url).toBe('/admin/institutions/vit/mark-paid');
    expect(body).toBeUndefined();
  });

  it('encodes the college id', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} } as never);
    await markCollegePaid('a/b');
    expect(vi.mocked(mockHttp.post).mock.calls[0][0])
      .toBe('/admin/institutions/a%2Fb/mark-paid');
  });

  it('returns changed:false rather than throwing when already paid', async () => {
    /**
     * A double click, or a retry after a timeout, gets a 200 on purpose. If
     * this client turned that into an error the operator would press the
     * button again -- which is exactly what the idempotence is for.
     */
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { id: 'vit', tier: 'paid', changed: false },
    } as never);
    await expect(markCollegePaid('vit')).resolves.toMatchObject({
      tier: 'paid', changed: false,
    });
  });

  it('still surfaces a real refusal as an AdminInstitutionError', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(
      apiError(403, 'FORBIDDEN', 'You cannot do that.'));
    await expect(markCollegePaid('vit')).rejects.toBeInstanceOf(AdminInstitutionError);
  });
});

describe('creating a college', () => {
  it('sends the chosen tier', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} } as never);
    await createCollege({ id: 'vit', name: 'VIT', tier: 'trial' });
    expect(vi.mocked(mockHttp.post).mock.calls[0][1])
      .toMatchObject({ tier: 'trial' });
  });
});
