/**
 * T8/T23 (web): who sees what on "Add people". The CPO gets both tabs (staff
 * and student record); the HOD gets the staff tab only, for faculty; faculty
 * are refused the page.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { can, type InstitutionCapability } from '@/lib/institutionPermissions';

const mocks = vi.hoisted(() => ({ useInstitution: vi.fn() }));

vi.mock('@/contexts/InstitutionContext', () => ({ useInstitution: mocks.useInstitution }));
vi.mock('@/hooks/useInstitutionResource', () => {
  const state = (data: unknown) => ({ data, isLoading: false, error: null, refetch: vi.fn() });
  return {
    useDepartments: () => state([{ id: 'cse', name: 'CSE' }]),
    useBatches: () => state([]),
    useSections: () => state([]),
  };
});
vi.mock('@/api/institutionApi', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/api/institutionApi')>();
  return { ...real, createMember: vi.fn(), createStudent: vi.fn(), lookupStaff: vi.fn() };
});

import AddPeoplePage from '@/app/institution/people/page';

function as(role: 'cpo' | 'hod' | 'faculty', readOnlyReason: string | null = null) {
  mocks.useInstitution.mockReturnValue({
    role,
    readOnlyReason,
    allows: (cap: InstitutionCapability) => can(role, cap),
    canWrite: (cap: InstitutionCapability) => can(role, cap) && !readOnlyReason,
    activeMembership: { department_id: 'cse' },
  });
  render(<AddPeoplePage />);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('Add people by role', () => {
  it('the CPO sees both tabs', () => {
    as('cpo');
    expect(screen.getAllByText('Give access').length).toBeGreaterThan(0);
    expect(screen.getByText('Create a student record')).toBeInTheDocument();
  });

  it('the HOD sees only the staff tab, and is told who adds students', () => {
    as('hod');
    expect(screen.getAllByText('Give access').length).toBeGreaterThan(0);
    expect(screen.queryByText('Create a student record')).not.toBeInTheDocument();
    expect(screen.getByText(/added by your placement officer/i)).toBeInTheDocument();
    expect(screen.queryByText(/use the next tab/i)).not.toBeInTheDocument();
  });

  it('the CPO is pointed to the student tab', () => {
    as('cpo');
    expect(screen.getByText(/use the next tab/i)).toBeInTheDocument();
  });

  it('faculty are refused the page', () => {
    as('faculty');
    expect(screen.getByText(/not part of your role here/i)).toBeInTheDocument();
    expect(screen.queryByText('Give access')).not.toBeInTheDocument();
  });
});
