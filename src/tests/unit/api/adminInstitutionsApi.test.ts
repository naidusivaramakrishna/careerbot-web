/**
 * The admin provisioning client.
 *
 * These routes authenticate as an ADMIN, not as a college member, which is why
 * this client exists separately from institutionApi: that one refuses to call
 * anything without a college session token, and an admin has no college.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import {
  AdminInstitutionError,
  appointOfficer,
  createCollege,
  getCollege,
  listColleges,
  markCollegePaid,
  renameCollege,
  renewCollege,
  revokeOfficer,
  setCollegePaidUntil,
  setCollegeStatus,
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

describe('renameCollege', () => {
  it('PUTs only the name to the encoded college path — never the id', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({
      data: { id: 'srr', name: 'SRR Institute', previous_name: 'SR Institue', changed: true },
    });
    const res = await renameCollege('srr', 'SRR Institute');
    expect(vi.mocked(mockHttp.put).mock.calls[0][0]).toBe('/admin/institutions/srr');
    expect(vi.mocked(mockHttp.put).mock.calls[0][1]).toEqual({ name: 'SRR Institute' });
    expect(res.changed).toBe(true);
  });

  it('encodes the college id into the path', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({ data: {} });
    await renameCollege('vit chennai', 'VIT');
    expect(vi.mocked(mockHttp.put).mock.calls[0][0]).toBe('/admin/institutions/vit%20chennai');
  });

  it('reports a rename lost to someone else as a conflict', async () => {
    vi.mocked(mockHttp.put).mockRejectedValueOnce(
      apiError(409, 'CONFLICT', 'this college\'s name was changed by someone else'));
    await expect(renameCollege('srr', 'SRR Institute'))
      .rejects.toMatchObject({ status: 409, isConflict: true });
  });
});

describe('paid period', () => {
  it('marking paid sends no body unless a period is chosen', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await markCollegePaid('vit');
    expect(vi.mocked(mockHttp.post).mock.calls[0][0]).toBe('/admin/institutions/vit/mark-paid');
    expect(vi.mocked(mockHttp.post).mock.calls[0][1]).toBeUndefined();
  });

  it('marking paid sends only the period when one is chosen — never a tier', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await markCollegePaid('vit', 12);
    expect(vi.mocked(mockHttp.post).mock.calls[0][1]).toEqual({ paid_months: 12 });
  });

  it('creating a paid college can carry the paid period', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await createCollege({ id: 'srr', name: 'SRR', tier: 'paid', paid_months: 6 });
    expect(vi.mocked(mockHttp.post).mock.calls[0][1]).toEqual(
      { id: 'srr', name: 'SRR', tier: 'paid', paid_months: 6 });
  });

  it('renewing POSTs the months to the encoded renew path', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { id: 'vit', paid_until: '2027-10-19T00:00:00+00:00',
              previous_paid_until: null, months: 12, changed: true },
    });
    const res = await renewCollege('vit chennai', 12);
    expect(vi.mocked(mockHttp.post).mock.calls[0][0])
      .toBe('/admin/institutions/vit%20chennai/renew');
    expect(vi.mocked(mockHttp.post).mock.calls[0][1]).toEqual({ months: 12 });
    expect(res.paid_until).toBe('2027-10-19T00:00:00+00:00');
  });

  it('correcting PUTs the exact date to the paid-until path (it sets, renewing adds)', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({
      data: { id: 'lbrce', paid_until: '2027-03-19T23:59:59+00:00',
              previous_paid_until: '2029-12-19T23:59:59+00:00', changed: true },
    });
    const res = await setCollegePaidUntil('lbrce', '2027-03-19');
    expect(vi.mocked(mockHttp.put).mock.calls[0][0])
      .toBe('/admin/institutions/lbrce/paid-until');
    expect(vi.mocked(mockHttp.put).mock.calls[0][1]).toEqual({ paid_until: '2027-03-19' });
    expect(vi.mocked(mockHttp.post)).not.toHaveBeenCalled();
    expect(res.changed).toBe(true);
  });

  it('a refused date (past, or too far ahead) surfaces the server message', async () => {
    vi.mocked(mockHttp.put).mockRejectedValueOnce(
      apiError(422, 'VALIDATION_ERROR', 'the paid-until date must be today or later'));
    await expect(setCollegePaidUntil('lbrce', '2020-01-01'))
      .rejects.toMatchObject({ status: 422 });
  });

  it('reports a renewal lost to someone else as a conflict', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(
      apiError(409, 'CONFLICT', 'paid period was changed by someone else'));
    await expect(renewCollege('vit', 1)).rejects.toMatchObject({ isConflict: true });
  });
});

describe('setCollegeStatus', () => {
  it('PUTs the status to the billing route — not the pause route', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({
      data: { id: 'vit', subscription_status: 'expired', previous_status: 'active', changed: true },
    });
    const res = await setCollegeStatus('vit', 'expired');
    expect(vi.mocked(mockHttp.put).mock.calls[0][0])
      .toBe('/admin/institutions/vit/subscription-status');
    expect(vi.mocked(mockHttp.put).mock.calls[0][1]).toEqual({ status: 'expired' });
    expect(vi.mocked(mockHttp.post)).not.toHaveBeenCalled();
    expect(res.changed).toBe(true);
  });

  it('can take an expired college back to active', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({
      data: { id: 'vit', subscription_status: 'active', previous_status: 'expired', changed: true },
    });
    await setCollegeStatus('vit', 'active');
    expect(vi.mocked(mockHttp.put).mock.calls[0][1]).toEqual({ status: 'active' });
  });

  it('a missing billing permission is reported as forbidden', async () => {
    vi.mocked(mockHttp.put).mockRejectedValueOnce(apiError(403, 'FORBIDDEN', 'no'));
    await expect(setCollegeStatus('vit', 'grace'))
      .rejects.toMatchObject({ isForbidden: true });
  });

  it('a lost race is a conflict', async () => {
    vi.mocked(mockHttp.put).mockRejectedValueOnce(apiError(409, 'CONFLICT', 'changed'));
    await expect(setCollegeStatus('vit', 'grace'))
      .rejects.toMatchObject({ isConflict: true });
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
