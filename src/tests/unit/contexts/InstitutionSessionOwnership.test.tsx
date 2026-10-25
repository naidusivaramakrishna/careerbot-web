/**
 * A stored college session must belong to the account that is signed in.
 *
 * THE BUG: the college token lives in sessionStorage under
 * careerbot_institution_session and is sent as the Authorization header on every
 * college call. sessionStorage survives logout -> login in the same tab, so
 * account B, signing in after account A, was handed A's college session: the
 * switcher showed A's college, writes were accepted in a college B has no
 * membership in, and a head of department appeared as a placement officer.
 *
 * THE RULE: a stored session is only trusted once the signed-in account's OWN
 * memberships contain the membership it was minted from. Otherwise it is dropped.
 */
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/institutionApi', async () => {
  const actual = await vi.importActual<typeof import('@/api/institutionApi')>('@/api/institutionApi');
  return {
    ...actual,
    listMemberships: vi.fn(),
    createInstitutionSession: vi.fn(),
    getInstitutionContext: vi.fn().mockResolvedValue({ writable: true }),
    onInstitutionReadOnly: vi.fn(() => () => {}),
    onInstitutionSessionStale: vi.fn(() => () => {}),
  };
});

import { InstitutionProvider, useInstitution } from '@/contexts/InstitutionContext';
import { listMemberships } from '@/api/institutionApi';
import { getInstitutionSession, setInstitutionSession } from '@/lib/institutionSession';

const KEY = 'careerbot_institution_session';

function membership(id: string, institution: string, role = 'cpo') {
  return { membership_id: id, institution_id: institution, role } as never;
}

function Probe() {
  const { session, isLoadingMemberships } = useInstitution();
  return (
    <div>
      <span data-testid="loading">{String(isLoadingMemberships)}</span>
      <span data-testid="college">{session?.institution_id ?? 'none'}</span>
    </div>
  );
}

function storeAccountASession() {
  setInstitutionSession({
    access_token: 'token-of-account-A', token_type: 'bearer',
    institution_id: 'lbrce', role: 'cpo', membership_id: 'm-a-lbrce',
  });
}

async function mount() {
  render(<InstitutionProvider><Probe /></InstitutionProvider>);
  await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
}

describe('a stored college session is checked against the signed-in account', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(listMemberships).mockReset();
  });
  afterEach(cleanup);

  it("drops the previous account's college when this account has no membership in it", async () => {
    storeAccountASession();
    // Account B: an officer of svce only.
    vi.mocked(listMemberships).mockResolvedValue([membership('m-b-svce', 'svce')]);

    await mount();

    expect(screen.getByTestId('college').textContent).toBe('none');
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(getInstitutionSession()).toBeNull();
  });

  it('keeps the session when it belongs to this account (a plain page reload)', async () => {
    storeAccountASession();
    vi.mocked(listMemberships).mockResolvedValue([
      membership('m-a-lbrce', 'lbrce'), membership('m-a-svce', 'svce'),
    ]);

    await mount();

    expect(screen.getByTestId('college').textContent).toBe('lbrce');
    expect(getInstitutionSession()?.membership_id).toBe('m-a-lbrce');
  });

  it('drops it for an account that is not a college user at all', async () => {
    storeAccountASession();
    vi.mocked(listMemberships).mockResolvedValue([]);

    await mount();

    expect(screen.getByTestId('college').textContent).toBe('none');
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('fails closed when memberships cannot be read: an unverifiable token is not kept', async () => {
    storeAccountASession();
    vi.mocked(listMemberships).mockRejectedValue(new Error('network'));

    await mount();

    expect(screen.getByTestId('college').textContent).toBe('none');
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('never exposes an unchecked session while memberships are still loading', async () => {
    storeAccountASession();
    let release: (rows: never[]) => void = () => {};
    vi.mocked(listMemberships).mockReturnValue(new Promise((res) => { release = res as never; }));

    render(<InstitutionProvider><Probe /></InstitutionProvider>);

    // Before the check has run the context must not hand out A's college.
    expect(screen.getByTestId('college').textContent).toBe('none');
    release([] as never[]);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });
});
