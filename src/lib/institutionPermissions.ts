/**
 * Client-side mirror of the server's institution policy gate.
 *
 * Source of truth is careerbot-api/app/core/institution/policy.py — the server
 * enforces this and will 403 regardless of what the UI renders. This copy
 * exists so the UI does not OFFER an action that is guaranteed to be refused,
 * which is a worse experience than not showing it at all.
 *
 * If the two ever disagree, the server wins. Keep this table in sync when
 * ROLE_ACTIONS changes on the backend.
 */
import type { InstitutionRole, OnboardableRole } from '@/types/institution';

export type InstitutionCapability =
  | 'manage_org'          // departments, batches, sections
  | 'onboard_hod'
  | 'onboard_faculty'
  | 'onboard_student'
  | 'assign_faculty'
  | 'read_students'
  | 'write_progress'
  | 'read_self';

const ROLE_CAPABILITIES: Record<InstitutionRole, readonly InstitutionCapability[]> = {
  // policy.py CPO: ONBOARD_HOD, ONBOARD_STUDENT, READ_STUDENTS.
  // Note it does NOT include ONBOARD_FACULTY — a CPO delegates that to the HOD.
  cpo: ['manage_org', 'onboard_hod', 'onboard_student', 'assign_faculty', 'read_students'],
  // policy.py HOD: ONBOARD_FACULTY, ONBOARD_STUDENT, READ_STUDENTS.
  hod: ['manage_org', 'onboard_faculty', 'onboard_student', 'assign_faculty', 'read_students'],
  // policy.py FACULTY: ONBOARD_STUDENT, WRITE_PROGRESS, READ_STUDENTS.
  // WRITE_PROGRESS stops here: reads widen up the hierarchy, this write does not.
  faculty: ['onboard_student', 'read_students', 'write_progress'],
  // policy.py STUDENT: READ_SELF, WRITE_SELF only.
  student: ['read_self'],
};

export function can(role: InstitutionRole, capability: InstitutionCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

/**
 * Roles this role may create through POST /members, in the order they should
 * appear in a picker. Empty means the role cannot onboard anyone.
 */
export function onboardableRoles(role: InstitutionRole): OnboardableRole[] {
  const roles: OnboardableRole[] = [];
  if (can(role, 'onboard_hod')) roles.push('hod');
  if (can(role, 'onboard_faculty')) roles.push('faculty');
  if (can(role, 'onboard_student')) roles.push('student');
  return roles;
}
