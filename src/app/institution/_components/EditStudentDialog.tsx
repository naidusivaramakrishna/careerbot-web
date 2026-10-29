'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, PencilLine } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { InstitutionApiError, setStudentStatus, updateStudent } from '@/api/institutionApi';
import { useSections } from '@/hooks/useInstitutionResource';
import { STUDENT_STATUS_LABELS } from '@/lib/institutionMessages';
import type { Student, StudentStatus, UpdateStudentRequest } from '@/types/institution';
import { ErrorNotice } from './ErrorNotice';
import { SelectField, TextField, fieldErrorMap } from './FormField';
import { Body, Caption, SectionTitle } from './Typography';

/**
 * Correct a student's row, or change their status. Placement officer only.
 *
 * TWO SAVES, NOT ONE. A spelling fix and "this student has left" are different
 * acts with different consequences, so they are saved separately and the
 * status part says plainly what leaving does: unused codes are cancelled and
 * the student loses college access (their own CareerBOT account stays).
 *
 * ONLY CHANGED FIELDS ARE SENT. The server validates the whole row, but a
 * field the officer did not touch must not be rewritten from a stale copy.
 * Department is not editable: a student's faculty assignments belong to it.
 */
const STATUSES: StudentStatus[] = ['enrolled', 'graduated', 'withdrawn', 'suspended'];

export function EditStudentDialog({
  student,
  writable,
  onClose,
  onSaved,
}: {
  student: Student;
  writable: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const sections = useSections(student.department_id);
  // WHAT THE SERVER HOLDS NOW. Starts as the row the page passed in and is
  // replaced by each successful save's response, so "changed" is measured
  // against the saved row, not against a copy from before the save -- which
  // left Save enabled and able to send the same change twice.
  const [baseline, setBaseline] = useState<Student>(student);
  const [fullName, setFullName] = useState(student.full_name);
  const [admission, setAdmission] = useState(student.admission_number ?? '');
  const [email, setEmail] = useState(student.college_email ?? '');
  const [sectionId, setSectionId] = useState(student.section_id ?? '');
  const [batch, setBatch] = useState(student.batch_year ? String(student.batch_year) : '');
  const [status, setStatus] = useState<StudentStatus>(
    (student.status as StudentStatus) ?? 'enrolled',
  );
  const [busy, setBusy] = useState<'details' | 'status' | null>(null);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const fieldErrors = fieldErrorMap(error);

  // A FRESHER ROW FROM THE PAGE becomes the baseline. The page re-reads the
  // student after every save and after a 409 (onSaved), so a conflict is
  // retried against what the server holds now, not the row the dialog opened
  // with. Fields the officer has not touched follow the fresh row (else an
  // untouched field would now count as an edit and undo the other change);
  // the officer's own edits stay.
  const [rowFromPage, setRowFromPage] = useState<Student>(student);
  if (student !== rowFromPage) {
    setRowFromPage(student);
    if (fullName.trim() === baseline.full_name.trim()) setFullName(student.full_name);
    if (admission.trim() === (baseline.admission_number ?? '').trim()) {
      setAdmission(student.admission_number ?? '');
    }
    if (email.trim() === (baseline.college_email ?? '').trim()) {
      setEmail(student.college_email ?? '');
    }
    if (sectionId === (baseline.section_id ?? '')) setSectionId(student.section_id ?? '');
    if (batch.trim() === (baseline.batch_year ? String(baseline.batch_year) : '')) {
      setBatch(student.batch_year ? String(student.batch_year) : '');
    }
    if (status === (baseline.status ?? 'enrolled')) {
      setStatus((student.status as StudentStatus) ?? 'enrolled');
    }
    setBaseline(student);
  }

  const changes = useMemo<UpdateStudentRequest>(() => {
    // BOTH SIDES TRIMMED. A stored value with stray spaces must not count as
    // an edit the moment the dialog opens.
    const out: UpdateStudentRequest = {};
    if (fullName.trim() !== baseline.full_name.trim()) out.full_name = fullName.trim();
    if (admission.trim() !== (baseline.admission_number ?? '').trim()) {
      out.admission_number = admission.trim();
    }
    if (email.trim() !== (baseline.college_email ?? '').trim()) {
      out.college_email = email.trim() || null;
    }
    if (sectionId !== (baseline.section_id ?? '')) out.section_id = sectionId || null;
    const batchValue = batch.trim() ? Number(batch.trim()) : null;
    if (batchValue !== (baseline.batch_year ?? null)) out.batch_year = batchValue;
    return out;
  }, [fullName, admission, email, sectionId, batch, baseline]);

  const detailsChanged = Object.keys(changes).length > 0;
  const statusChanged = status !== (baseline.status ?? 'enrolled');
  // The API's range (1900-2100), not just "four digits".
  const batchInvalid = batch.trim() !== ''
    && !(/^\d{4}$/.test(batch.trim())
      && Number(batch.trim()) >= 1900 && Number(batch.trim()) <= 2100);

  // Escape closes, as on every other dialog a keyboard user meets.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (kind: 'details' | 'status') => {
    setBusy(kind);
    setError(null);
    setSaved(null);
    try {
      if (kind === 'details') {
        const updated = await updateStudent(student.id, changes);
        setBaseline((prev) => ({ ...prev, ...changes, ...(updated ?? {}) }));
        setSaved('Details saved.');
      } else {
        const result = await setStudentStatus(student.id, status);
        setBaseline((prev) => ({ ...prev, ...(result ?? {}), status: result?.status ?? status }));
        setSaved(
          status === 'enrolled'
            ? 'Status saved. College access is back on.'
            : `Status saved. ${result.invites_revoked ?? 0} unused code(s) cancelled; college access is off.`,
        );
      }
      onSaved?.();
    } catch (err) {
      const apiError = err instanceof InstitutionApiError ? err : null;
      setError(apiError);
      // A 409: the row changed under this dialog, a duplicate number or email,
      // or a status that WAS saved while access could not be switched back on
      // (careerbot-api #507). Have the page re-read the student so the next
      // attempt is measured against the stored row (see rowFromPage above).
      if (apiError?.reason === 'CONFLICT') onSaved?.();
    } finally {
      setBusy(null);
    }
  };

  const sectionOptions = [
    { value: '', label: 'No section' },
    ...(sections.data ?? []).map((sec) => ({ value: sec.id, label: sec.name })),
  ];
  // The student's own section stays an option while the list loads or if it
  // fails, so the select does not show "No section" for a student who has one.
  if (sectionId && !sectionOptions.some((o) => o.value === sectionId)) {
    sectionOptions.push({
      value: sectionId,
      label: sections.isLoading ? 'Loading sections…' : 'Current section',
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
            <PencilLine className="h-4 w-4 text-[#2557a7]" aria-hidden />
          </span>
          <div className="min-w-0">
            <span id="edit-student-title">
              <SectionTitle>Edit {student.full_name}</SectionTitle>
            </span>
            <Caption className="mt-1">Department cannot be changed here.</Caption>
          </div>
        </div>

        {error ? <ErrorNotice error={error} className="mt-4" /> : null}
        {saved ? (
          <p role="status" className="mt-4 rounded-lg bg-[#f0fdf4] px-3 py-2 text-[13px] text-[#166534]">
            {saved}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          <TextField
            label="Full name"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={200}
            error={fieldErrors.full_name}
          />
          <TextField
            label="Admission / roll number"
            required
            value={admission}
            onChange={(e) => setAdmission(e.target.value)}
            maxLength={64}
            error={fieldErrors.admission_number}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            hint="College or personal email. The sign-up code is sent here."
            error={fieldErrors.college_email}
          />
          <SelectField
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            options={sectionOptions}
            error={fieldErrors.section_id}
          />
          <TextField
            label="Batch (year)"
            inputMode="numeric"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            maxLength={4}
            error={batchInvalid ? 'Enter a year between 1900 and 2100.' : fieldErrors.batch_year}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => void run('details')}
              disabled={!writable || !detailsChanged || batchInvalid
                || !fullName.trim() || !admission.trim() || busy !== null}
            >
              {busy === 'details' ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Saving…</>
              ) : 'Save details'}
            </Button>
          </div>
        </div>

        <div className="mt-5 border-t border-[#e2e8f0] pt-4">
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StudentStatus)}
            options={STATUSES.map((v) => ({ value: v, label: STUDENT_STATUS_LABELS[v] }))}
          />
          {statusChanged && status !== 'enrolled' ? (
            <Body className="mt-2 text-[13px] text-[#92400e]">
              Unused sign-up codes are cancelled and the student loses access to
              the college pages. Their own CareerBOT account and results stay.
            </Body>
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void run('status')}
              disabled={!writable || !statusChanged || busy !== null}
            >
              {busy === 'status' ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Saving…</>
              ) : 'Save status'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
