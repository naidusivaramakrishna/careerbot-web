/**
 * T8/T23 (owner 2026-10-28): student intake and invite codes are the
 * placement officer's alone; the CPO may also add faculty. Mirrors
 * careerbot-api policy.py.
 */
import { describe, expect, it } from 'vitest';

import { navGroupsForRole } from '@/app/institution/_components/nav';
import { can } from '@/lib/institutionPermissions';

const ids = (role: Parameters<typeof navGroupsForRole>[0]) =>
  navGroupsForRole(role).flatMap((g) => g.items.map((i) => i.id));

describe('who adds students', () => {
  it('only the CPO holds onboard_student', () => {
    expect(can('cpo', 'onboard_student')).toBe(true);
    expect(can('hod', 'onboard_student')).toBe(false);
    expect(can('faculty', 'onboard_student')).toBe(false);
    expect(can('student', 'onboard_student')).toBe(false);
  });

  it('the CPO may also add faculty', () => {
    expect(can('cpo', 'onboard_faculty')).toBe(true);
  });
});

describe('navigation', () => {
  it('the CPO sees Add people and Import from a file', () => {
    expect(ids('cpo')).toEqual(expect.arrayContaining(['onboarding', 'import']));
  });

  it('the HOD sees Add people (for faculty) but not Import', () => {
    expect(ids('hod')).toContain('onboarding');
    expect(ids('hod')).not.toContain('import');
  });

  it('faculty see neither', () => {
    expect(ids('faculty')).not.toContain('onboarding');
    expect(ids('faculty')).not.toContain('import');
  });
});
