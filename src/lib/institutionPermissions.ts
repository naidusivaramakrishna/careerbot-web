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
  | 'onboard_student'      // student records AND their invite codes: CPO only
  | 'edit_student'         // correct a student's details, change their status
  | 'add_people'           // web-only: may open "Add people" (any onboarding)
  | 'assign_faculty'
  | 'read_students'
  | 'write_progress'
  | 'read_self';

const ROLE_CAPABILITIES: Record<InstitutionRole, readonly InstitutionCapability[]> = {
  // policy.py CPO: ONBOARD_HOD, ONBOARD_FACULTY (T23: optional, the HOD is
  // the usual path), ONBOARD_STUDENT, EDIT_STUDENT, READ_STUDENTS. Student
  // intake, invite codes and corrections are the CPO's alone (T5/T8, owner
  // 2026-10-28: the officer holds the paid list).
  cpo: ['manage_org', 'onboard_hod', 'onboard_faculty', 'onboard_student', 'edit_student',
    'add_people', 'assign_faculty', 'read_students'],
  // policy.py HOD: ONBOARD_FACULTY, READ_STUDENTS. No longer ONBOARD_STUDENT
  // (T8); "Add people" still opens for them, for faculty only.
  hod: ['manage_org', 'onboard_faculty', 'add_people', 'assign_faculty', 'read_students'],
  // policy.py FACULTY: WRITE_PROGRESS, READ_STUDENTS. No longer ONBOARD_STUDENT
  // (T8). WRITE_PROGRESS stops here: reads widen up the hierarchy, this write
  // does not.
  faculty: ['read_students', 'write_progress'],
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
  // NOT 'student', though the CPO holds the onboard_student capability. That
  // capability is for creating a student RECORD (POST /students). A student
  // MEMBERSHIP is not something staff grant here: it exists only when the
  // student claims an invite code, so POST /members refuses role 'student'
  // (pattern ^(hod|faculty)$) and offering it produced a raw validation error.
  return roles;
}
