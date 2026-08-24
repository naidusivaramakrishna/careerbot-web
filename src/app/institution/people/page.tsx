'use client';

import React, { useEffect, useState } from 'react';
import { GraduationCap, Loader2, UserPlus } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import { Button } from '@/components/ui/Button';
import { createMember, createStudent, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useBatches, useDepartments, useSections } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT, ROLE_LABELS } from '@/lib/institutionMessages';
import { onboardableRoles } from '@/lib/institutionPermissions';
import type { OnboardableRole } from '@/types/institution';
import { ErrorNotice, FormError } from '../_components/ErrorNotice';
import { SelectField, TextField, fieldErrorMap } from '../_components/FormField';
import { RoleGuard } from '../_components/RoleGuard';
import { Body, MicroLabel, PageHeader } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { CARD } from '../_components/tokens';

/**
 * Onboarding.
 *
 * Two genuinely different jobs, so two tabs rather than one overloaded form:
 *
 *   ACCESS  — POST /members gives an existing CareerBOT account a role in this
 *             college. This is what makes someone an HOD or a faculty member.
 *   STUDENT — POST /students creates the college persona: the name, admission
 *             number and class group that progress is recorded against.
 *
 * A student needs BOTH, and the copy says so rather than leaving a placement
 * officer to discover it when the roster comes back empty.
 *
 * The role picker only offers what THIS role may create: a CPO onboards heads
 * of department, an HOD onboards faculty. That mirrors the server's delegation
 * chain, so the UI never offers a choice that ends in a 403.
 */
function AddPeople() {
  const { readOnlyReason, role, canWrite, activeMembership } = useInstitution();
  const departments = useDepartments();
  const batches = useBatches();
  const [activeTab, setActiveTab] = useState('access');

  if (!role) return null;
  const allowedRoles = onboardableRoles(role);

  return (
    <>
      <PageHeader
        title="Add people"
        description="Give someone a role in this college, or create a student's college record."
      />

      {departments.error ? (
        <ErrorNotice error={departments.error} onRetry={departments.refetch} className="mb-4" />
      ) : null}

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            label: 'access',
            text: 'Give access',
            icon: <UserPlus className="h-4 w-4" aria-hidden />,
            content: (
              <MemberForm
                allowedRoles={allowedRoles}
                departments={departments.data ?? []}
                defaultDepartmentId={activeMembership?.department_id ?? ''}
                writable={canWrite('onboard_student')}
                readOnlyHint={readOnlyReason ? READ_ONLY_CONTROL_HINT[readOnlyReason] : null}
              />
            ),
          },
          {
            label: 'student',
            text: 'Create a student record',
            icon: <GraduationCap className="h-4 w-4" aria-hidden />,
            content: (
              <StudentForm
                departments={departments.data ?? []}
                batchYears={(batches.data ?? []).map((b) => b.academic_year)}
                defaultDepartmentId={activeMembership?.department_id ?? ''}
                writable={canWrite('onboard_student')}
                readOnlyHint={readOnlyReason ? READ_ONLY_CONTROL_HINT[readOnlyReason] : null}
              />
            ),
          },
        ]}
      />
    </>
  );
}

function SubmitButton({
  submitting,
  disabled,
  label,
  busyLabel,
  readOnlyHint,
}: {
  submitting: boolean;
  disabled: boolean;
  label: string;
  busyLabel: string;
  readOnlyHint: string | null;
}) {
  const button = (
    <Button type="submit" variant="default" size="md" disabled={submitting || disabled}>
      {submitting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {busyLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );

  return readOnlyHint ? (
    <WriteGuard active hint={readOnlyHint}>
      {button}
    </WriteGuard>
  ) : (
    button
  );
}

function MemberForm({
  allowedRoles,
  departments,
  defaultDepartmentId,
  writable,
  readOnlyHint,
}: {
  allowedRoles: OnboardableRole[];
  departments: { id: string; name: string }[];
  defaultDepartmentId: string;
  writable: boolean;
  readOnlyHint: string | null;
}) {
  const [accountId, setAccountId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [memberRole, setMemberRole] = useState<OnboardableRole>(allowedRoles[0] ?? 'student');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentId && departments.length === 1) setDepartmentId(departments[0].id);
  }, [departmentId, departments]);

  const fieldErrors = fieldErrorMap(error);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      await createMember({
        account_id: accountId.trim(),
        role: memberRole,
        department_id: departmentId,
        display_name: displayName.trim() || undefined,
      });
      setDone(`${ROLE_LABELS[memberRole]} access granted.`);
      setAccountId('');
      setDisplayName('');
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (allowedRoles.length === 0) {
    return (
      <div className={`${CARD} p-4`}>
        <Body>Your role in this college does not include granting access to others.</Body>
      </div>
    );
  }

  return (
    <form className={`${CARD} max-w-[560px] p-4`} onSubmit={submit}>
      <MicroLabel as="legend" className="mb-1 block">
        Give access
      </MicroLabel>
      <Body className="mb-4">
        The person needs a CareerBOT account already. This links that account to your college with a
        role. For a student, also create their student record on the next tab.
      </Body>

      <FormError error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            label="CareerBOT account id"
            required
            value={accountId}
            disabled={!writable}
            error={fieldErrors.account_id}
            hint="The id of the existing account you are adding."
            onChange={(e) => setAccountId(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="Their name"
            value={displayName}
            disabled={!writable}
            error={fieldErrors.display_name}
            hint="How they appear when you assign students to them. Without it the list can only show the account id."
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <SelectField
          label="Role"
          required
          value={memberRole}
          disabled={!writable}
          error={fieldErrors.role}
          onChange={(e) => setMemberRole(e.target.value as OnboardableRole)}
          options={allowedRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <SelectField
          label="Department"
          required
          value={departmentId}
          placeholder="Choose a department"
          disabled={!writable || departments.length === 0}
          error={fieldErrors.department_id}
          hint={
            departments.length === 0
              ? 'Create a department first — every role here belongs to one.'
              : undefined
          }
          onChange={(e) => setDepartmentId(e.target.value)}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <div className="mt-4">
        <SubmitButton
          submitting={submitting}
          disabled={!writable || departments.length === 0}
          label="Grant access"
          busyLabel="Granting"
          readOnlyHint={readOnlyHint}
        />
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-[1rem]">
        {done ? <span className="text-[12px] font-medium text-green-700">{done}</span> : null}
      </p>
    </form>
  );
}

function StudentForm({
  departments,
  batchYears,
  defaultDepartmentId,
  writable,
  readOnlyHint,
}: {
  departments: { id: string; name: string }[];
  batchYears: string[];
  defaultDepartmentId: string;
  writable: boolean;
  readOnlyHint: string | null;
}) {
  
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);
  const [sectionId, setSectionId] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const sections = useSections(departmentId || undefined, Boolean(departmentId));

  useEffect(() => {
    if (!departmentId && departments.length === 1) setDepartmentId(departments[0].id);
  }, [departmentId, departments]);

  const fieldErrors = fieldErrorMap(error);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    const parsedYear = batchYear.trim() === '' ? undefined : Number(batchYear);
    try {
      const student = await createStudent({
        // No account_id. Staff put a student on the roster; they do not say
        // which login owns that row. The student binds their own account by
        // redeeming an invite code -- if staff could name it, anyone able to
        // onboard could point a row at any account and take over that
        // student's record, scores and placement history.
        department_id: departmentId,
        full_name: fullName.trim(),
        admission_number: admissionNumber.trim(),
        ...(collegeEmail.trim() ? { college_email: collegeEmail.trim() } : {}),
        ...(sectionId ? { section_id: sectionId } : {}),
        ...(parsedYear !== undefined && Number.isFinite(parsedYear)
          ? { batch_year: parsedYear }
          : {}),
      });
      setDone(
        student.faculty_assignment_pending
          // The student WAS created. Only the automatic assignment to the
          // faculty member who added them did not complete, which means they
          // will not appear on that person's own list until somebody assigns
          // them. Saying nothing would leave a faculty member looking for a
          // student they had just added and concluding it had not saved.
          ? `${student.full_name} added to the roster, but could not be put ` +
            `on your list of students. Ask your head of department or ` +
            `placement officer to assign them to you.`
          : `${student.full_name} added to the roster. They will appear as ` +
            `"not yet claimed" until they redeem an invite code and sign in.`);
      setFullName('');
      setAdmissionNumber('');
      setCollegeEmail('');
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`${CARD} max-w-[720px] p-4`} onSubmit={submit}>
      <MicroLabel as="legend" className="mb-1 block">
        Create a student record
      </MicroLabel>
      <Body className="mb-4">
        This is the record progress is recorded against. Give the student access on the previous tab
        as well, so they can sign in and see it.
      </Body>

      <FormError error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          required
          value={fullName}
          disabled={!writable}
          error={fieldErrors.full_name}
          onChange={(e) => setFullName(e.target.value)}
        />
        <TextField
          label="Admission number"
          required
          value={admissionNumber}
          disabled={!writable}
          error={fieldErrors.admission_number}
          hint="Unique in your college and fixed for the whole enrolment."
          onChange={(e) => setAdmissionNumber(e.target.value)}
        />
        <TextField
          label="College email"
          type="email"
          value={collegeEmail}
          disabled={!writable}
          error={fieldErrors.college_email}
          hint="Optional."
          onChange={(e) => setCollegeEmail(e.target.value)}
        />
        <SelectField
          label="Department"
          required
          value={departmentId}
          placeholder="Choose a department"
          disabled={!writable || departments.length === 0}
          error={fieldErrors.department_id}
          hint={departments.length === 0 ? 'Create a department first.' : undefined}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setSectionId('');
          }}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
        <SelectField
          label="Section"
          value={sectionId}
          placeholder={departmentId ? 'No section yet' : 'Pick a department first'}
          disabled={!writable || !departmentId || (sections.data?.length ?? 0) === 0}
          error={fieldErrors.section_id}
          hint="Optional — you can place them in a class group later."
          onChange={(e) => setSectionId(e.target.value)}
          options={[
            { value: '', label: 'No section yet' },
            ...(sections.data ?? []).map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <TextField
          label="Batch year"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          value={batchYear}
          disabled={!writable}
          error={fieldErrors.batch_year}
          hint={
            batchYears.length > 0
              ? `Your batches: ${batchYears.slice(0, 3).join(', ')}`
              : 'Optional — the intake year, e.g. 2026.'
          }
          onChange={(e) => setBatchYear(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <SubmitButton
          submitting={submitting}
          disabled={!writable || departments.length === 0}
          label="Add student"
          busyLabel="Adding"
          readOnlyHint={readOnlyHint}
        />
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-[1rem]">
        {done ? <span className="text-[12px] font-medium text-green-700">{done}</span> : null}
      </p>
    </form>
  );
}

export default function AddPeoplePage() {
  return (
    <RoleGuard capability="onboard_student">
      <AddPeople />
    </RoleGuard>
  );
}
