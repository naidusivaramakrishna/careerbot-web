/**
 * An in-page account switch (SignUpModal onSuccess, no reload) must not carry
 * the previous account's college over: account B asks for ITS memberships
 * again, shows none of A's college, and never mints for A's membership.
 * Real useCollegeMembership + useStudentRecord; only the API is mocked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { InstitutionMembership } from '@/types/institution';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

const api = vi.hoisted(() => ({
  onInstitutionSessionStale: () => () => {},
  listMemberships: vi.fn(),
  createInstitutionSession: vi.fn(),
  getMyStudentProfile: vi.fn(),
  getStudentReadiness: vi.fn(),
  getMyStanding: vi.fn(),
  getMyPeople: vi.fn(),
}));
vi.mock('@/api/institutionApi', () => api);

import {
  __resetCollegeMembershipCache,
  useCollegeMembershipResolved,
  useStudentCollege,
} from '@/hooks/useCollegeMembership';
import { __resetStudentRecordCache, useStudentRecord } from '@/hooks/useStudentRecord';
import { announceAccountChanged } from '@/lib/accountChange';
import { clearInstitutionSession } from '@/lib/institutionSession';

const A_ROW: InstitutionMembership = {
  membership_id: 'mA', institution_id: 'vit', institution_name: 'VIT Chennai', role: 'student', department_id: 'cse',
};

beforeEach(() => {
  __resetCollegeMembershipCache();
  __resetStudentRecordCache();
  clearInstitutionSession();
  for (const fn of Object.values(api)) if ('mockReset' in fn) fn.mockReset();
  // Never resolves: keeps account A without a session, so the hook stays at
  // "about to mint for mA" -- exactly what must not leak to account B.
  api.createInstitutionSession.mockReturnValue(new Promise(() => {}));
});
afterEach(() => clearInstitutionSession());

describe('college caches across an in-page account switch', () => {
  it('B re-asks, sees no A college, and nothing is minted for A after the switch', async () => {
    api.listMemberships.mockResolvedValueOnce([A_ROW]).mockResolvedValueOnce([]);
    const college = renderHook(() => useStudentCollege());
    await waitFor(() => expect(college.result.current?.membershipId).toBe('mA'));

    act(() => announceAccountChanged());

    await waitFor(() => expect(api.listMemberships).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(college.result.current).toBeNull());

    // A component mounted AFTER the switch reads the fresh answer, not A's.
    const mintsBefore = api.createInstitutionSession.mock.calls.length;
    const record = renderHook(() => useStudentRecord());
    const lateCollege = renderHook(() => useStudentCollege());
    await act(async () => { await Promise.resolve(); });
    expect(lateCollege.result.current).toBeNull();
    expect(record.result.current.status).toBe('none');
    expect(api.createInstitutionSession.mock.calls.length).toBe(mintsBefore);
    expect(api.listMemberships).toHaveBeenCalledTimes(2);
  });

  it('A answer still in flight at the switch is dropped, never shown to B', async () => {
    let resolveA: (rows: InstitutionMembership[]) => void = () => {};
    api.listMemberships
      .mockReturnValueOnce(new Promise<InstitutionMembership[]>((r) => { resolveA = r; }))
      .mockResolvedValueOnce([]);
    const college = renderHook(() => useStudentCollege());
    const resolved = renderHook(() => useCollegeMembershipResolved());

    act(() => announceAccountChanged());
    await waitFor(() => expect(api.listMemberships).toHaveBeenCalledTimes(2));
    await act(async () => { resolveA([A_ROW]); await Promise.resolve(); await Promise.resolve(); });

    expect(college.result.current).toBeNull();
    await waitFor(() => expect(resolved.result.current).toBe(true));
    expect(college.result.current).toBeNull();
  });
});
