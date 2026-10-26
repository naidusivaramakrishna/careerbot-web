/**
 * useStudentRecord: mint a college session ONLY when needed and outside
 * /institution, THEN fetch; nothing for staff or jobseekers; a failed piece is
 * null; a session change re-loads.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

let pathname = '/dashboard';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

let college: { id: string; name: string; membershipId: string } | null = null;
vi.mock('@/hooks/useCollegeMembership', () => ({ useStudentCollege: () => college }));

const stale = vi.hoisted(() => new Set<() => void>());
const api = vi.hoisted(() => ({
  onInstitutionSessionStale: (l: () => void) => { stale.add(l); return () => stale.delete(l); },
  createInstitutionSession: vi.fn(),
  getMyStudentProfile: vi.fn(),
  getStudentReadiness: vi.fn(),
  getMyStanding: vi.fn(),
  getMyPeople: vi.fn(),
}));
vi.mock('@/api/institutionApi', () => api);

import { __resetStudentRecordCache, useStudentRecord } from '@/hooks/useStudentRecord';
import { announceAccountChanged } from '@/lib/accountChange';
import {
  clearInstitutionSession,
  getInstitutionSession,
  setInstitutionSession,
  type StoredInstitutionSession,
} from '@/lib/institutionSession';
import type { InstitutionRole } from '@/types/institution';

const VIT = { id: 'vit', name: 'VIT Chennai', membershipId: 'm1' };
const session = (
  token: string, membership = 'm1', role: InstitutionRole = 'student',
): StoredInstitutionSession => ({
  access_token: token, token_type: 'bearer', institution_id: 'vit', role, membership_id: membership,
});

beforeEach(() => {
  __resetStudentRecordCache();
  clearInstitutionSession();
  pathname = '/dashboard';
  college = null;
  for (const fn of Object.values(api)) if ('mockReset' in fn) fn.mockReset();
  api.createInstitutionSession.mockResolvedValue({ access_token: 'minted', token_type: 'bearer', institution_id: 'vit', role: 'student' });
  api.getMyStudentProfile.mockResolvedValue({ id: 's1', admission_number: '22CSE118' });
  api.getStudentReadiness.mockResolvedValue({ readiness: 81, max: 100 });
  api.getMyStanding.mockResolvedValue({ available: true, rank: 4 });
  api.getMyPeople.mockResolvedValue({ faculty: [], hods: [], placement_officers: [] });
});
afterEach(() => clearInstitutionSession());

describe('useStudentRecord', () => {
  it('not a student: nothing minted, nothing fetched', async () => {
    const { result } = renderHook(() => useStudentRecord());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('none');
    expect(api.createInstitutionSession).not.toHaveBeenCalled();
    expect(api.getMyStudentProfile).not.toHaveBeenCalled();
  });

  it('student, no session, on an app page: mints once, THEN fetches the four', async () => {
    college = VIT;
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.createInstitutionSession).toHaveBeenCalledTimes(1);
    expect(api.createInstitutionSession).toHaveBeenCalledWith({ membership_id: 'm1' });
    expect(getInstitutionSession()?.membership_id).toBe('m1');
    // Order: the mint resolved before any scoped read started.
    const mintOrder = api.createInstitutionSession.mock.invocationCallOrder[0];
    for (const fn of [api.getMyStudentProfile, api.getStudentReadiness, api.getMyStanding, api.getMyPeople]) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn.mock.invocationCallOrder[0]).toBeGreaterThan(mintOrder);
    }
    expect(api.getStudentReadiness).toHaveBeenCalledWith('me');
  });

  it('inside /institution the gate owns selection: no mint from here', async () => {
    college = VIT;
    pathname = '/institution/me/tasks';
    const { result } = renderHook(() => useStudentRecord());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('loading');
    expect(api.createInstitutionSession).not.toHaveBeenCalled();
    act(() => setInstitutionSession(session('gate-token')));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.createInstitutionSession).not.toHaveBeenCalled();
  });

  it('session already present: no mint, fetches', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.createInstitutionSession).not.toHaveBeenCalled();
  });

  it('a failed piece is null, the rest still shows', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    api.getMyStanding.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') throw new Error('not ready');
    expect(result.current.record.standing).toBeNull();
    expect(result.current.record.readiness).toEqual({ readiness: 81, max: 100 });
  });

  it('a failed mint shows nothing and can be retried', async () => {
    college = VIT;
    api.createInstitutionSession.mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledTimes(1));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).not.toBe('ready');
    expect(getInstitutionSession()).toBeNull();
  });

  it('a session for another membership shows nothing', async () => {
    college = VIT;
    setInstitutionSession(session('t1', 'm-other', 'student'));
    const { result } = renderHook(() => useStudentRecord());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('none');
    expect(api.getMyStudentProfile).not.toHaveBeenCalled();
  });

  it('a new session re-loads (no reuse across sessions)', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.getMyStudentProfile).toHaveBeenCalledTimes(1);
    act(() => setInstitutionSession(session('t2')));
    await waitFor(() => expect(api.getMyStudentProfile).toHaveBeenCalledTimes(2));
  });

  // What institutionApi's fail() does for a refused college token: publish
  // "stale session", then throw.
  const refused = () => { stale.forEach((l) => l()); return Promise.reject(Object.assign(new Error('401'), { status: 401 })); };

  it('P1: an expired college token outside /institution is not "no details": it is flagged, cleared and re-minted', async () => {
    college = VIT;
    setInstitutionSession(session('expired'));
    for (const fn of [api.getMyStudentProfile, api.getStudentReadiness, api.getMyStanding, api.getMyPeople]) {
      fn.mockImplementationOnce(refused);
    }
    const { result } = renderHook(() => useStudentRecord());
    // The refused token is dropped and a new one minted for the same membership...
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledTimes(1));
    expect(api.createInstitutionSession).toHaveBeenCalledWith({ membership_id: 'm1' });
    // ...and the record then loads with the new token.
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
      if (result.current.status === 'ready') expect(result.current.record.student).toEqual({ id: 's1', admission_number: '22CSE118' });
    });
    expect(getInstitutionSession()?.access_token).toBe('minted');
  });

  it('P1 recovery re-mints for the SAME membership even when the account has several (no session -> no college)', async () => {
    college = VIT;
    setInstitutionSession(session('expired'));
    api.getMyStudentProfile.mockImplementationOnce(() => {
      // With several memberships, useStudentCollege is null while no session exists.
      college = null;
      return refused();
    });
    renderHook(() => useStudentRecord());
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledWith({ membership_id: 'm1' }));
    await waitFor(() => expect(getInstitutionSession()?.membership_id).toBe('m1'));
    expect(getInstitutionSession()?.access_token).toBe('minted');
  });

  it('P1: reads that fail are flagged as failed, a real "no record" (null) is not', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    api.getMyStudentProfile.mockRejectedValueOnce(new Error('500'));
    const failed = renderHook(() => useStudentRecord());
    await waitFor(() => expect(failed.result.current.status).toBe('ready'));
    if (failed.result.current.status !== 'ready') throw new Error('not ready');
    expect(failed.result.current.record.student).toBeNull();
    expect(failed.result.current.record.failed).toBe(true);
    failed.unmount();

    __resetStudentRecordCache();
    api.getMyStudentProfile.mockResolvedValueOnce(null); // 404: genuinely no record
    const none = renderHook(() => useStudentRecord());
    await waitFor(() => expect(none.result.current.status).toBe('ready'));
    if (none.result.current.status !== 'ready') throw new Error('not ready');
    expect(none.result.current.record.student).toBeNull();
    expect(none.result.current.record.failed).toBe(false);
  });

  it('stale recovery is attempted once: a re-minted token that is refused again does not loop', async () => {
    college = VIT;
    setInstitutionSession(session('expired'));
    api.getMyStudentProfile.mockImplementation(refused);
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(api.createInstitutionSession.mock.calls.length).toBeLessThanOrEqual(1);
    if (result.current.status === 'ready') expect(result.current.record.failed).toBe(true);
  });

  it('inside /institution a refused token is left to the college area (no clear, no mint from here)', async () => {
    college = VIT;
    pathname = '/institution';
    window.history.pushState({}, '', '/institution');
    setInstitutionSession(session('expired'));
    api.getMyStudentProfile.mockImplementationOnce(refused);
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getInstitutionSession()?.access_token).toBe('expired');
    expect(api.createInstitutionSession).not.toHaveBeenCalled();
    window.history.pushState({}, '', '/');
  });

  it("a mint still in flight for the previous account is dropped after an account change", async () => {
    college = VIT;
    let release: (v: unknown) => void = () => {};
    api.createInstitutionSession.mockReturnValueOnce(new Promise((r) => { release = r; }));
    renderHook(() => useStudentRecord());
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledTimes(1));
    college = null;
    act(() => announceAccountChanged()); // signIn as B (signIn also cleared the session)
    await act(async () => {
      release({ access_token: 'A-token', token_type: 'bearer', institution_id: 'vit', role: 'student' });
      await Promise.resolve(); await Promise.resolve();
    });
    expect(getInstitutionSession()).toBeNull();
  });

  it('control: a mint for the same account still lands', async () => {
    college = VIT;
    let release: (v: unknown) => void = () => {};
    api.createInstitutionSession.mockReturnValueOnce(new Promise((r) => { release = r; }));
    renderHook(() => useStudentRecord());
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledTimes(1));
    await act(async () => {
      release({ access_token: 'A-token', token_type: 'bearer', institution_id: 'vit', role: 'student' });
      await Promise.resolve(); await Promise.resolve();
    });
    expect(getInstitutionSession()?.access_token).toBe('A-token');
  });

  it('a load with a failed read is not cached: the next mount asks again', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    api.getMyStanding.mockRejectedValueOnce(new Error('500'));
    const first = renderHook(() => useStudentRecord());
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    first.unmount();
    const second = renderHook(() => useStudentRecord());
    await waitFor(() => {
      expect(second.result.current.status).toBe('ready');
      if (second.result.current.status === 'ready') expect(second.result.current.record.standing).toEqual({ available: true, rank: 4 });
    });
    expect(api.getMyStanding).toHaveBeenCalledTimes(2);
  });

  it('control: a complete load IS cached for the session', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    const first = renderHook(() => useStudentRecord());
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    first.unmount();
    const second = renderHook(() => useStudentRecord());
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
    expect(api.getMyStudentProfile).toHaveBeenCalledTimes(1);
  });

  it('after the session is cleared (left the college), a new mint happens', async () => {
    college = VIT;
    const { result } = renderHook(() => useStudentRecord());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.createInstitutionSession).toHaveBeenCalledTimes(1);
    act(() => clearInstitutionSession());
    await waitFor(() => expect(api.createInstitutionSession).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('a route change with the same session keeps the bar ready (no flash to loading)', async () => {
    college = VIT;
    setInstitutionSession(session('t1'));
    const seen: string[] = [];
    const { result, rerender } = renderHook(() => { const s = useStudentRecord(); seen.push(s.status); return s; });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    seen.length = 0;
    pathname = '/profile';
    rerender();
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((st) => st === 'ready')).toBe(true);
  });
});
