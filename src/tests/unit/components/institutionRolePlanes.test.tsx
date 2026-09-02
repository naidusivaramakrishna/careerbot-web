/**
 * P1 is LOCKED: "Each role has its OWN dashboard. Admin, CPO, HOD, Faculty, and
 * College Student never share one screen with role toggles."
 *
 * The CPO and HOD branches used to render ONE component with a `scope` prop.
 * These tests hold the split in place and check that each screen carries the
 * content its own section of the wireframe locks -- 3.2 department comparison
 * for the CPO, 3.3 faculty list for the HOD.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useInstitution: vi.fn(),
  useStudentsPaged: vi.fn(),
  useDepartments: vi.fn(),
  useBatches: vi.fn(),
  useSections: vi.fn(),
  useMembers: vi.fn(),
}));

vi.mock('@/contexts/InstitutionContext', () => ({
  useInstitution: mocks.useInstitution,
}));

vi.mock('@/hooks/useInstitutionResource', () => ({
  useStudentsPaged: mocks.useStudentsPaged,
  useDepartments: mocks.useDepartments,
  useBatches: mocks.useBatches,
  useSections: mocks.useSections,
  useMembers: mocks.useMembers,
}));

import { CpoOverview } from '@/app/institution/_components/CpoOverview';
import { HodOverview } from '@/app/institution/_components/HodOverview';

function state<T>(data: T) {
  return { data, isLoading: false, error: null, refetch: vi.fn() };
}

function setup({ role }: { role: 'cpo' | 'hod' }) {
  mocks.useInstitution.mockReturnValue({
    role,
    readOnlyReason: null,
    canWrite: () => true,
    allows: () => true,
  });
  mocks.useStudentsPaged.mockImplementation((params: { limit?: number }) =>
    // limit:1 calls are COUNT probes (total only); the limit:8/12 call is the list
    params?.limit === 1
      ? state({ items: [], total: 0, skip: 0, limit: 1 })
      : state({
          items: [
            {
              id: 's1', account_id: null, claim_status: 'unclaimed',
              institution_id: 'i1', department_id: 'CSE', full_name: 'R Nair',
              admission_number: 'A2201', college_email: null, batch_year: 2026,
              section_id: null, status: 'active', created_at: '2026-08-01',
            },
          ],
          total: 1, skip: 0, limit: params?.limit ?? 8,
        }),
  );
  mocks.useDepartments.mockReturnValue(
    state([
      { id: 'CSE', institution_id: 'i1', name: 'Computer Science' },
      { id: 'ECE', institution_id: 'i1', name: 'Electronics' },
    ]),
  );
  mocks.useBatches.mockReturnValue(state([{ id: 'b1', institution_id: 'i1', year: 2026 }]));
  mocks.useSections.mockReturnValue(
    state([
      { id: 'sec1', institution_id: 'i1', department_id: 'CSE', batch_id: 'b1', name: 'A' },
      { id: 'sec2', institution_id: 'i1', department_id: 'CSE', batch_id: 'b1', name: 'B' },
      { id: 'sec3', institution_id: 'i1', department_id: 'ECE', batch_id: 'b1', name: 'A' },
    ]),
  );
  mocks.useMembers.mockReturnValue(
    state([
      { membership_id: 'm1', account_id: 'acc-1', institution_id: 'i1', role: 'faculty', department_id: 'CSE', display_name: 'A Rao', active: true },
      { membership_id: 'm2', account_id: 'acc-2', institution_id: 'i1', role: 'faculty', department_id: 'CSE', display_name: 'S Khan', active: true },
      { membership_id: 'm3', account_id: 'acc-3', institution_id: 'i1', role: 'faculty', department_id: 'CSE', display_name: 'Left Last Year', active: false },
    ]),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the CPO and HOD have separate screens', () => {
  it('the CPO screen is titled for the college, not the department', async () => {
    setup({ role: 'cpo' });
    render(<CpoOverview />);
    expect(await screen.findByText('College overview')).toBeInTheDocument();
    expect(screen.queryByText('Department overview')).not.toBeInTheDocument();
  });

  it('the HOD screen is titled for the department, not the college', async () => {
    setup({ role: 'hod' });
    render(<HodOverview />);
    expect(await screen.findByText('Department overview')).toBeInTheDocument();
    expect(screen.queryByText('College overview')).not.toBeInTheDocument();
  });

  it('department comparison is on the CPO screen (3.2) and not the HOD screen (3.3)', async () => {
    setup({ role: 'cpo' });
    const cpo = render(<CpoOverview />);
    // Matches twice by design: the section heading and the table's accessible
    // <caption>. Presence is the assertion, not uniqueness.
    await waitFor(() =>
      expect(screen.getAllByText('Department comparison').length).toBeGreaterThan(0),
    );
    cpo.unmount();

    setup({ role: 'hod' });
    render(<HodOverview />);
    await waitFor(() => expect(screen.getByText('Department overview')).toBeInTheDocument());
    expect(screen.queryAllByText('Department comparison')).toHaveLength(0);
  });

  it('the faculty list is on the HOD screen (3.3) and not the CPO screen (3.2)', async () => {
    setup({ role: 'hod' });
    const hod = render(<HodOverview />);
    expect(await screen.findByText('A Rao')).toBeInTheDocument();
    expect(screen.getByText('S Khan')).toBeInTheDocument();
    hod.unmount();

    setup({ role: 'cpo' });
    render(<CpoOverview />);
    await waitFor(() => expect(screen.getByText('College overview')).toBeInTheDocument());
    expect(screen.queryByText('A Rao')).not.toBeInTheDocument();
  });

  it('a faculty member who has left is not counted as teaching staff', async () => {
    setup({ role: 'hod' });
    render(<HodOverview />);
    expect(await screen.findByText('A Rao')).toBeInTheDocument();
    expect(screen.queryByText('Left Last Year')).not.toBeInTheDocument();
  });

  it('section counts per department come from the loaded list, not a request each', async () => {
    setup({ role: 'cpo' });
    render(<CpoOverview />);
    await waitFor(() =>
      expect(screen.getAllByText('Department comparison').length).toBeGreaterThan(0),
    );
    // Three sections across two departments: CSE has 2, ECE has 1. A request
    // per department would have been useSections(departmentId) -- assert every
    // call asked for the whole college instead.
    mocks.useSections.mock.calls.forEach((call) => {
      expect(call[0]).toBeUndefined();
    });
  });

  it('the CPO screen states that readiness is absent rather than showing a placeholder', async () => {
    setup({ role: 'cpo' });
    render(<CpoOverview />);
    expect(
      await screen.findByText(/Readiness and rank are not shown/i),
    ).toBeInTheDocument();
  });
});
