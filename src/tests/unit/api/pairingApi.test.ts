/**
 * Pairing codes, client side.
 *
 * The code proves which account is signed in and authorises nothing. These
 * tests cover the contract the screens rely on, and the two things the client
 * must never do: send an account id, or hold on to a code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));

import { PairingError, issuePairingCode } from '@/api/pairingApi';
import { appointOfficerByCode, AdminInstitutionError } from '@/api/adminInstitutionsApi';
import { httpClient as mockHttp } from '@/lib/http';

beforeEach(() => vi.clearAllMocks());

describe('issuePairingCode', () => {
  it('asks the institution route, not an admin one', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { code: 'QWAP3-SXHZ2', expires_at: 'x', expires_in_minutes: 15 },
    });
    await issuePairingCode();
    expect(vi.mocked(mockHttp.post).mock.calls[0][0]).toBe('/institution/pairing-code');
  });

  it('sends no account id — the server takes it from the session', async () => {
    // A code that could name somebody else is a code that appoints somebody
    // else, so the request body must carry no identity at all.
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: { code: 'A', expires_at: 'x', expires_in_minutes: 15 } });
    await issuePairingCode();
    expect(vi.mocked(mockHttp.post).mock.calls[0][1]).toBeUndefined();
  });

  it('returns the code and how long it lasts', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { code: 'QWAP3-SXHZ2', expires_at: '2026-08-29T12:15:00Z', expires_in_minutes: 15 },
    });
    const issued = await issuePairingCode();
    expect(issued.code).toBe('QWAP3-SXHZ2');
    expect(issued.expires_in_minutes).toBe(15);
  });

  it('surfaces a refusal as a PairingError', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { error: { message: 'rate limited' } } },
    });
    await expect(issuePairingCode()).rejects.toBeInstanceOf(PairingError);
  });

  it('survives an error shape it does not recognise', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(new Error('offline'));
    await expect(issuePairingCode()).rejects.toBeInstanceOf(PairingError);
  });
});

describe('appointOfficerByCode', () => {
  it('posts the code to the pair route', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await appointOfficerByCode('vit', { code: 'QWAP3-SXHZ2' });
    expect(vi.mocked(mockHttp.post).mock.calls[0][0])
      .toBe('/admin/institutions/vit/cpo/pair');
  });

  it('never sends an account id or a role', async () => {
    // The code resolves the account server-side, and the role is hard-coded
    // there. A body that could name either would let this screen mint any
    // membership for anyone.
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await appointOfficerByCode('vit', { code: 'X', display_name: 'P M' });
    const body = vi.mocked(mockHttp.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ code: 'X', display_name: 'P M' });
    expect(body.account_id).toBeUndefined();
    expect(body.role).toBeUndefined();
  });

  it('encodes the college id', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: {} });
    await appointOfficerByCode('vit chennai', { code: 'X' });
    expect(vi.mocked(mockHttp.post).mock.calls[0][0])
      .toBe('/admin/institutions/vit%20chennai/cpo/pair');
  });

  it('reports a bad code as an error the screen can show', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: { message: 'that code is not usable; ask for a new one',
                         details: { reason: 'PAIRING_FAILED' } } },
      },
    });
    await expect(appointOfficerByCode('vit', { code: 'WRONG' }))
      .rejects.toMatchObject({ reason: 'PAIRING_FAILED' });
  });

  it('still distinguishes an already-appointed conflict', async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { error: { message: 'already', details: { reason: 'CONFLICT' } } } },
    });
    try {
      await appointOfficerByCode('vit', { code: 'X' });
    } catch (e) {
      expect((e as AdminInstitutionError).isConflict).toBe(true);
    }
  });
});
