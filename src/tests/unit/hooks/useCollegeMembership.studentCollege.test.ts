/**
 * Which college, if any, gets the STUDENT shell (college-first nav, "Provided
 * by <college>"). The college session is the authority; without one, only the
 * unambiguous case -- exactly one membership, and it is a student one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { InstitutionMembership } from '@/types/institution';

const listMemberships = vi.fn();
vi.mock('@/api/institutionApi', () => ({ listMemberships: () => listMemberships() }));

import {
  __resetCollegeMembershipCache,
  primeCollegeMemberships,
  useCollegeMembershipResolved,
  pickStudentCollege,
  useHasCollegeMembership,
  useIsStudentOnly,
  useStudentCollege,
} from '@/hooks/useCollegeMembership';
import { clearInstitutionSession, setInstitutionSession } from '@/lib/institutionSession';

const m = (id: string, college: string, role: InstitutionMembership['role']): InstitutionMembership => ({
  membership_id: id,
  institution_id: college,
  institution_name: `${college.toUpperCase()} University`,
  role,
  department_id: role === 'cpo' ? null : 'cse',
});
const session = (id: string, college: string, role: string) => ({
  membership_id: id, institution_id: college, role,
});

describe('pickStudentCollege', () => {
  it('no memberships (a jobseeker) -> null', () => {
    expect(pickStudentCollege([], null)).toBeNull();
  });

  it('no session + exactly one student membership -> that college', () => {
    expect(pickStudentCollege([m('m1', 'vit', 'student')], null))
      .toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' });
  });

  it('no session + one STAFF membership -> null (staff keep today\'s UI)', () => {
    expect(pickStudentCollege([m('m1', 'vit', 'faculty')], null)).toBeNull();
  });

  it('no session + student at A and faculty at B -> null (ambiguous)', () => {
    expect(pickStudentCollege([m('m1', 'a', 'student'), m('m2', 'b', 'faculty')], null)).toBeNull();
  });

  it('no session + student at two colleges -> null (ambiguous)', () => {
    expect(pickStudentCollege([m('m1', 'a', 'student'), m('m2', 'c', 'student')], null)).toBeNull();
  });

  it('THE P0 CASE: faculty session at B, student at A -> null, never "Provided by A"', () => {
    const rows = [m('m1', 'a', 'student'), m('m2', 'b', 'faculty')];
    expect(pickStudentCollege(rows, session('m2', 'b', 'faculty'))).toBeNull();
  });

  it('student session matching a membership -> that college', () => {
    const rows = [m('m1', 'a', 'student'), m('m2', 'b', 'faculty')];
    expect(pickStudentCollege(rows, session('m1', 'a', 'student'))).toEqual({ id: 'a', name: 'A University', membershipId: 'm1' });
  });

  it('student session the account does not own (another account\'s token) -> null', () => {
    expect(pickStudentCollege([m('m1', 'a', 'student')], session('mX', 'a', 'student'))).toBeNull();
  });

  it('student session whose college does not match the membership row -> null', () => {
    expect(pickStudentCollege([m('m1', 'a', 'student')], session('m1', 'z', 'student'))).toBeNull();
  });
});

describe('useStudentCollege / useHasCollegeMembership', () => {
  beforeEach(() => {
    __resetCollegeMembershipCache();
    clearInstitutionSession();
    listMemberships.mockReset();
  });
  afterEach(() => clearInstitutionSession());

  // Each "negative" case first proves the hook DID apply a resolved answer
  // (a positive control rendered against the same cache), so a null/false
  // read cannot pass merely because the request had not come back yet.
  it('a jobseeker: no college, no student shell', async () => {
    let settled = false;
    listMemberships.mockImplementation(async () => { settled = true; return []; });
    const has = renderHook(() => useHasCollegeMembership());
    const student = renderHook(() => useStudentCollege());
    await waitFor(() => expect(settled).toBe(true));
    await act(async () => { await Promise.resolve(); });
    expect(has.result.current).toBe(false);
    expect(student.result.current).toBeNull();
  });

  it('a failed call is NOT cached: the next mount asks again', async () => {
    listMemberships.mockRejectedValueOnce(new Error('401')).mockResolvedValue([m('m1', 'vit', 'student')]);
    const first = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(listMemberships).toHaveBeenCalledTimes(1));
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(first.result.current).toBe(false);
    const second = renderHook(() => useStudentCollege());
    await waitFor(() => expect(second.result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' }));
    expect(listMemberships).toHaveBeenCalledTimes(2);
  });

  it('useIsStudentOnly mirrors the backend rule', async () => {
    listMemberships.mockResolvedValue([m('m1', 'a', 'student'), m('m2', 'b', 'faculty')]);
    const mixed = renderHook(() => useIsStudentOnly());
    const has = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(has.result.current).toBe(true));
    expect(mixed.result.current).toBe(false);
  });

  it('a failed membership call is treated as "no college", as before', async () => {
    listMemberships.mockRejectedValue(new Error('down'));
    const has = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(listMemberships).toHaveBeenCalled());
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(has.result.current).toBe(false);
  });

  it('control: the same flow DOES turn true once memberships resolve', async () => {
    listMemberships.mockResolvedValue([m('m1', 'vit', 'faculty')]);
    const has = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(has.result.current).toBe(true));
  });

  it('one student membership, no session yet -> the college', async () => {
    listMemberships.mockResolvedValue([m('m1', 'vit', 'student')]);
    const { result } = renderHook(() => useStudentCollege());
    await waitFor(() => expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' }));
  });

  it('follows a college switch in this tab', async () => {
    listMemberships.mockResolvedValue([m('m1', 'a', 'student'), m('m2', 'b', 'faculty')]);
    const { result } = renderHook(() => useStudentCollege());
    const has = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(has.result.current).toBe(true)); // rows applied
    expect(result.current).toBeNull(); // ambiguous without a session

    act(() => setInstitutionSession({
      access_token: 't1', token_type: 'bearer', institution_id: 'a', role: 'student', membership_id: 'm1',
    }));
    await waitFor(() => expect(result.current).toEqual({ id: 'a', name: 'A University', membershipId: 'm1' }));

    act(() => setInstitutionSession({
      access_token: 't2', token_type: 'bearer', institution_id: 'b', role: 'faculty', membership_id: 'm2',
    }));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('one request per page load, however many hooks mount', async () => {
    listMemberships.mockResolvedValue([m('m1', 'vit', 'student')]);
    renderHook(() => useStudentCollege());
    renderHook(() => useHasCollegeMembership());
    renderHook(() => useStudentCollege());
    await waitFor(() => expect(listMemberships).toHaveBeenCalledTimes(1));
  });


  it('THE JOIN FLOW: rows primed by the college context reach hooks that cached []', async () => {
    listMemberships.mockResolvedValue([]); // before the invite is claimed
    const { result } = renderHook(() => useStudentCollege());
    const has = renderHook(() => useHasCollegeMembership());
    await waitFor(() => expect(listMemberships).toHaveBeenCalledTimes(1));
    expect(result.current).toBeNull();
    act(() => primeCollegeMemberships([m('m1', 'vit', 'student')])); // InstitutionContext after the claim
    await waitFor(() => expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' }));
    expect(has.result.current).toBe(true);
    expect(listMemberships).toHaveBeenCalledTimes(1); // no extra request
  });

  // A request that started BEFORE a prime (Header/Sidebar on a fresh load, or
  // the join page's pre-claim call) must not overwrite the primed rows.
  it('a late SUCCESS from before the prime does not overwrite the primed rows', async () => {
    let release: (rows: InstitutionMembership[]) => void = () => {};
    listMemberships.mockImplementation(() => new Promise((r) => { release = r; }));
    const { result } = renderHook(() => useStudentCollege());
    await waitFor(() => expect(listMemberships).toHaveBeenCalledTimes(1));
    act(() => primeCollegeMemberships([m('m1', 'vit', 'student')]));
    await waitFor(() => expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' }));
    await act(async () => { release([]); await Promise.resolve(); await Promise.resolve(); });
    expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' });
    const later = renderHook(() => useStudentCollege()); // a fresh mount reads the primed rows
    expect(later.result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' });
  });

  it('a late FAILURE from before the prime neither wipes the rows nor forces a new request', async () => {
    let fail: (e: Error) => void = () => {};
    listMemberships.mockImplementation(() => new Promise((_, rej) => { fail = rej; }));
    const { result } = renderHook(() => useStudentCollege());
    await waitFor(() => expect(listMemberships).toHaveBeenCalledTimes(1));
    act(() => primeCollegeMemberships([m('m1', 'vit', 'student')]));
    await waitFor(() => expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' }));
    await act(async () => { fail(new Error('down')); await Promise.resolve(); await Promise.resolve(); });
    expect(result.current).toEqual({ id: 'vit', name: 'VIT University', membershipId: 'm1' });
    renderHook(() => useHasCollegeMembership());
    await act(async () => { await Promise.resolve(); });
    expect(listMemberships).toHaveBeenCalledTimes(1);
  });

  it('resolved is false until the answer arrives, then true', async () => {
    let release: (rows: InstitutionMembership[]) => void = () => {};
    listMemberships.mockImplementation(() => new Promise((r) => { release = r; }));
    const { result } = renderHook(() => useCollegeMembershipResolved());
    expect(result.current).toBe(false);
    await act(async () => { release([]); });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
