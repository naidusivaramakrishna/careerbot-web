/**
 * "Give access" must offer only roles POST /members accepts.
 *
 * The server takes role hod or faculty only (a student membership exists only
 * once the student claims an invite code). The picker listed Student because
 * every role holds the onboard_student capability -- which is about creating a
 * student RECORD -- so choosing it failed with the raw validation text
 * "String should match pattern '^(hod|faculty)$'".
 */
import { describe, it, expect } from 'vitest';
import { onboardableRoles } from '@/lib/institutionPermissions';

describe('onboardableRoles', () => {
  it('a placement officer can grant Head of Department and Faculty (T23)', () => {
    expect(onboardableRoles('cpo')).toEqual(['hod', 'faculty']);
  });

  it('a head of department can grant Faculty only', () => {
    expect(onboardableRoles('hod')).toEqual(['faculty']);
  });

  it('faculty and students grant nothing here', () => {
    expect(onboardableRoles('faculty')).toEqual([]);
    expect(onboardableRoles('student')).toEqual([]);
  });

  it('never offers student or cpo to anyone', () => {
    for (const role of ['cpo', 'hod', 'faculty', 'student'] as const) {
      const offered: string[] = onboardableRoles(role);
      expect(offered).not.toContain('student');
      expect(offered).not.toContain('cpo');
    }
  });

  it('the head of department still adds faculty (the usual path)', () => {
    expect(onboardableRoles('hod')).toContain('faculty');
  });
});
