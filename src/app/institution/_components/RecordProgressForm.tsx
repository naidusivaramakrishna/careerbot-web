'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InstitutionApiError, recordProgress } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import {
  ACTIVITY_LABELS,
  PROGRESS_STATUS_LABELS,
  READ_ONLY_CONTROL_HINT,
} from '@/lib/institutionMessages';
import {
  ACTIVITY_TYPES,
  PROGRESS_STATUSES,
  type ActivityType,
  type ProgressStatus,
  type Student,
} from '@/types/institution';
import { FormError } from './ErrorNotice';
import { SelectField, TextField, fieldErrorMap } from './FormField';
import { MicroLabel } from './Typography';
import { WriteGuard } from './WriteGuard';
import { CARD } from './tokens';

/**
 * Record one progress entry. FACULTY ONLY — a CPO or HOD reading the same rows
 * is refused by the server, so this form is never rendered for them.
 *
 * Tuned for REPEATED entry, because that is how it is used — a faculty member
 * sits with a list and logs twenty in a row:
 *
 *   - after a successful save the student and activity stay selected and focus
 *     returns to the field most likely to change next, so the next entry is
 *     typing, not re-picking;
 *   - the score fields clear, because carrying a stale score forward is the one
 *     mistake that silently produces wrong data;
 *   - success is confirmed inline and politely announced — no modal, no toast
 *     that steals the pointer, nothing to dismiss before entry twenty-one;
 *   - Cmd/Ctrl+Enter submits from anywhere in the form.
 */
export function RecordProgressForm({
  students,
  fixedStudent,
  initialStudentId,
  onStudentChange,
  onRecorded,
}: {
  /** Choosable students. Ignored when `fixedStudent` is set. */
  students?: Student[];
  /** Locks the form to one student (used on a student's own page). */
  fixedStudent?: Student;
  /** Preselects a student while leaving the picker usable. Distinct from
   *  `fixedStudent`, which LOCKS it: arriving from [Mark] on a roster row
   *  should save the faculty a selection, not take one away -- they may have
   *  clicked the wrong row. */
  initialStudentId?: string;
  /** Fires when the chosen student changes, so a sibling panel can follow it. */
  onStudentChange?: (studentId: string) => void;
  onRecorded?: () => void;
}) {
  const { readOnlyReason } = useInstitution();
  const readOnly = Boolean(readOnlyReason);

  const [studentId, setStudentId] = useState(
    fixedStudent?.id ?? initialStudentId ?? '');
  const [activityType, setActivityType] = useState<ActivityType>('mock_test');
  const [status, setStatus] = useState<ProgressStatus>('completed');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [activityRef, setActivityRef] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const scoreRef = useRef<HTMLInputElement>(null);
  const studentRef = useRef<HTMLSelectElement>(null);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    },
    [],
  );

  const fieldErrors = fieldErrorMap(error);

  const submit = useCallback(async () => {
    if (readOnly || submitting) return;
    const targetId = fixedStudent?.id ?? studentId;
    if (!targetId) {
      setError(
        new InstitutionApiError({
          reason: 'INVALID_REQUEST',
          message: 'Pick a student first.',
          fieldErrors: [{ field: 'student_id', message: 'Pick a student first.' }],
        }),
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setConfirmation(null);

    // Only send score / max_score when they were actually filled in — an empty
    // box means "not scored", which is different from a score of zero.
    const parsedScore = score.trim() === '' ? undefined : Number(score);
    const parsedMax = maxScore.trim() === '' ? undefined : Number(maxScore);

    try {
      await recordProgress({
        student_id: targetId,
        activity_type: activityType,
        status,
        ...(parsedScore !== undefined && Number.isFinite(parsedScore)
          ? { score: parsedScore }
          : {}),
        ...(parsedMax !== undefined && Number.isFinite(parsedMax)
          ? { max_score: parsedMax }
          : {}),
        ...(activityRef.trim() ? { activity_ref: activityRef.trim() } : {}),
      });

      const name =
        fixedStudent?.full_name ??
        students?.find((s) => s.id === targetId)?.full_name ??
        'this student';
      setConfirmation(`${ACTIVITY_LABELS[activityType]} saved for ${name}.`);
      setScore('');
      setMaxScore('');
      setActivityRef('');
      onRecorded?.();

      // Land the caret where the next entry starts.
      if (fixedStudent) scoreRef.current?.focus();
      else studentRef.current?.focus();

      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
      confirmationTimer.current = setTimeout(() => setConfirmation(null), 6000);
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    readOnly,
    submitting,
    fixedStudent,
    studentId,
    activityType,
    status,
    score,
    maxScore,
    activityRef,
    students,
    onRecorded,
  ]);

  const submitButton = (
    <Button type="submit" variant="default" size="md" disabled={submitting || readOnly}>
      {submitting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Saving
        </>
      ) : (
        'Save entry'
      )}
    </Button>
  );

  return (
    <form
      ref={formRef}
      className={`${CARD} p-4`}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          void submit();
        }
      }}
    >
      <MicroLabel as="legend" className="mb-3 block">
        New entry
      </MicroLabel>

      <FormError error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        {fixedStudent ? (
          <div className="sm:col-span-2">
            <MicroLabel as="div">Student</MicroLabel>
            <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{fixedStudent.full_name}</p>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <SelectField
              ref={studentRef}
              label="Student"
              required
              value={studentId}
              placeholder="Choose a student"
              error={fieldErrors.student_id}
              disabled={readOnly}
              onChange={(e) => {
                setStudentId(e.target.value);
                onStudentChange?.(e.target.value);
              }}
              options={(students ?? []).map((s) => ({
                value: s.id,
                label: s.admission_number ? `${s.full_name} · ${s.admission_number}` : s.full_name,
              }))}
            />
          </div>
        )}

        <SelectField
          label="Activity"
          required
          value={activityType}
          disabled={readOnly}
          error={fieldErrors.activity_type}
          onChange={(e) => setActivityType(e.target.value as ActivityType)}
          options={ACTIVITY_TYPES.map((a) => ({ value: a, label: ACTIVITY_LABELS[a] }))}
        />

        <SelectField
          label="Result"
          required
          value={status}
          disabled={readOnly}
          error={fieldErrors.status}
          onChange={(e) => setStatus(e.target.value as ProgressStatus)}
          options={PROGRESS_STATUSES.map((s) => ({
            value: s,
            label: PROGRESS_STATUS_LABELS[s],
          }))}
        />

        <TextField
          ref={scoreRef}
          label="Score"
          type="number"
          inputMode="decimal"
          min={0}
          value={score}
          disabled={readOnly}
          error={fieldErrors.score}
          hint="Leave blank if this activity was not scored."
          onChange={(e) => setScore(e.target.value)}
        />

        <TextField
          label="Out of"
          type="number"
          inputMode="decimal"
          min={1}
          value={maxScore}
          disabled={readOnly}
          error={fieldErrors.max_score}
          onChange={(e) => setMaxScore(e.target.value)}
        />

        <div className="sm:col-span-2">
          <TextField
            label="Reference"
            value={activityRef}
            disabled={readOnly}
            error={fieldErrors.activity_ref}
            hint="Optional — a test id or attempt link, so this entry can be traced back."
            onChange={(e) => setActivityRef(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {readOnlyReason ? (
          <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
            {submitButton}
          </WriteGuard>
        ) : (
          submitButton
        )}
        <span className="text-[12px] text-[#94a3b8]">
          Ctrl + Enter saves. The student and activity stay selected for the next entry.
        </span>
      </div>

      {/* Polite, non-blocking confirmation. Nothing to dismiss. */}
      <p role="status" aria-live="polite" className="mt-3 min-h-[1rem]">
        {confirmation ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-700">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {confirmation}
          </span>
        ) : null}
      </p>
    </form>
  );
}
