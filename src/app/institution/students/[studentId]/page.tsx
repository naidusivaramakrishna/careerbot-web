'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardPen, KeyRound, PencilLine, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStudent } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useInstitutionResource, useStudentProgress } from '@/hooks/useInstitutionResource';
import { useStructureNames } from '@/hooks/useStructureNames';
import { activityLabel, claimStatusLabel, READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { ProgressRecord, Student } from '@/types/institution';
import { DataTable, OptionalCell } from '../../_components/DataTable';
import { EditStudentDialog } from '../../_components/EditStudentDialog';
import { EmptyState } from '../../_components/EmptyState';
import { InviteCodeDialog } from '../../_components/InviteCodeDialog';
import { ErrorNotice } from '../../_components/ErrorNotice';
import { RecordProgressForm } from '../../_components/RecordProgressForm';
import { RoleGuard } from '../../_components/RoleGuard';
import { CardListSkeleton, LoadingAnnouncement, TableSkeleton } from '../../_components/Skeletons';
import { ProgressStatusPill, ScoreCell, StudentStatusPill } from '../../_components/StatusPill';
import { MicroLabel, PageHeader, SectionTitle } from '../../_components/Typography';
import { CARD, FOCUS_RING } from '../../_components/tokens';
import { WriteGuard } from '../../_components/WriteGuard';

/**
 * One student.
 *
 * The same page for every staff role, because the server already decides who is
 * allowed to open it — a faculty member reaching a student outside their
 * assignment gets a 403, which lands here as the not-found state rather than a
 * blank screen.
 *
 * A FACULTY member also gets the entry form inline. That is the whole point of
 * the screen for them: look at what is recorded, add the next one, without
 * navigating away and losing their place in the roster.
 */
function StudentDetail({ studentId }: { studentId: string }) {
  const { allows, readOnlyReason } = useInstitution();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const fetchStudent = useCallback(() => getStudent(studentId), [studentId]);
  const student = useInstitutionResource<Student>(fetchStudent);
  const progress = useStudentProgress(studentId);
  const { departmentName, sectionName } = useStructureNames();

  const refetchProgress = useCallback(() => {
    void progress.refetch();
  }, [progress]);

  const backLink = (
    <Link
      href="/institution/students"
      className={`inline-flex items-center gap-1.5 rounded-sm text-[12px] font-medium text-[#64748b] hover:text-[#2557a7] ${FOCUS_RING}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      All students
    </Link>
  );

  // A refresh that fails while a student is already on screen (the refetch
  // after a code is issued) keeps the page and reports the error inline:
  // replacing the page would unmount the invite dialog and lose a code that
  // is shown only once. A student who is GONE (404/403 on the refresh) still
  // gets the not-in-view screen, once no dialog is open.
  const gone = student.error?.reason === 'NOT_FOUND' || student.error?.reason === 'FORBIDDEN';
  if (student.error && (!student.data || (gone && !inviteOpen && !editOpen))) {
    const notFound = student.error.reason === 'NOT_FOUND' || student.error.reason === 'FORBIDDEN';
    return (
      <>
        <div className="mb-4">{backLink}</div>
        {notFound ? (
          <EmptyState
            icon={SearchX}
            title="That student is not in your view"
            body="They may have been removed, or they may sit outside the part of the college you can see. Go back to the list and pick from there."
            action={
              <Link href="/institution/students">
                <Button variant="outline" size="sm">
                  Back to students
                </Button>
              </Link>
            }
          />
        ) : (
          <ErrorNotice error={student.error} onRetry={student.refetch} />
        )}
      </>
    );
  }

  if (student.isLoading && !student.data) {
    return (
      <>
        <div className="mb-4">{backLink}</div>
        <CardListSkeleton items={1} />
        <div className="mt-4">
          <TableSkeleton rows={4} columns={4} />
        </div>
        <LoadingAnnouncement label="Loading student" />
      </>
    );
  }

  const s = student.data;
  if (!s) return null;

  const canRecord = allows('write_progress');
  // The same capability the roster's Invite button uses, so whoever may issue
  // a code there may issue it here -- an officer who has just added a student
  // lands on this page, and it used to offer them no way to send the code.
  // Not for a student who has left: the server refuses a code for anyone not
  // enrolled (it could never be claimed).
  const canInvite = allows('onboard_student') && s.claim_status !== 'claimed'
    && (s.status ?? 'enrolled') === 'enrolled';
  // The placement officer alone corrects the row and records who has left
  // (EDIT_STUDENT). Offered whatever the sign-up state: a signed-up student's
  // name can be misspelt too.
  const canEdit = allows('edit_student');
  const editButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={Boolean(readOnlyReason)}
      onClick={() => setEditOpen(true)}
    >
      <PencilLine className="mr-1.5 h-4 w-4" aria-hidden />
      Edit
    </Button>
  );
  const inviteButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={Boolean(readOnlyReason)}
      onClick={() => setInviteOpen(true)}
    >
      <KeyRound className="mr-1.5 h-4 w-4" aria-hidden />
      {s.claim_status === 'invited' ? 'Reissue code' : 'Invite'}
    </Button>
  );

  return (
    <>
      <div className="mb-3">{backLink}</div>

      {student.error ? (
        <ErrorNotice error={student.error} onRetry={student.refetch} className="mb-4" />
      ) : null}

      <PageHeader
        title={s.full_name}
        description={s.college_email ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StudentStatusPill status={s.status} />
            {canEdit ? (
              readOnlyReason ? (
                <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                  {editButton}
                </WriteGuard>
              ) : (
                editButton
              )
            ) : null}
            {canInvite ? (
              readOnlyReason ? (
                <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                  {inviteButton}
                </WriteGuard>
              ) : (
                inviteButton
              )
            ) : null}
          </div>
        }
      />

      <div className={`${CARD} mb-5 grid grid-cols-2 gap-x-6 gap-y-4 p-4 sm:grid-cols-5`}>
        <div>
          <MicroLabel as="div">Admission no.</MicroLabel>
          <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
            {s.admission_number ?? '—'}
          </p>
        </div>
        <div>
          <MicroLabel as="div">Department</MicroLabel>
          <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{departmentName(s.department_id)}</p>
        </div>
        <div>
          <MicroLabel as="div">Section</MicroLabel>
          <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{sectionName(s.section_id) ?? '—'}</p>
        </div>
        <div>
          <MicroLabel as="div">Batch</MicroLabel>
          <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
            {s.batch_year ?? '—'}
          </p>
        </div>
        <div>
          <MicroLabel as="div">Sign-up</MicroLabel>
          <p className="mt-1 text-[13px] font-medium text-[#0f172a]">
            {claimStatusLabel(s.claim_status)}
          </p>
        </div>
      </div>

      {editOpen ? (
        <EditStudentDialog
          student={s}
          writable={!readOnlyReason}
          onClose={() => setEditOpen(false)}
          onSaved={() => void student.refetch()}
        />
      ) : null}

      {inviteOpen ? (
        <InviteCodeDialog
          student={s}
          writable={!readOnlyReason}
          onClose={() => setInviteOpen(false)}
          onIssued={() => void student.refetch()}
        />
      ) : null}

      <div className={canRecord ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]' : ''}>
        <section className="min-w-0">
          <SectionTitle className="mb-2.5">Progress</SectionTitle>

          {progress.error ? (
            <ErrorNotice error={progress.error} onRetry={progress.refetch} />
          ) : progress.isLoading && !progress.data ? (
            <TableSkeleton rows={4} columns={4} />
          ) : progress.data && progress.data.length === 0 ? (
            <EmptyState
              icon={ClipboardPen}
              title="Nothing recorded yet"
              body={
                canRecord
                  ? 'Log their first mock test, coding test, interview, English assessment or resume scan using the form beside this.'
                  : 'Their assigned faculty records each completed activity. Nothing has been logged for them so far.'
              }
            />
          ) : progress.data ? (
            <DataTable<ProgressRecord>
              caption={`Progress for ${s.full_name}`}
              rows={progress.data}
              rowKey={(r) => r.id ?? `${r.activity_type}-${r.status}-${r.score ?? 'x'}`}
              columns={[
                {
                  key: 'activity',
                  header: 'Activity',
                  render: (r) => (
                    <span className="font-medium text-[#0f172a]">
                      {activityLabel(r.activity_type)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Result',
                  width: 'w-[140px]',
                  render: (r) => <ProgressStatusPill status={r.status} />,
                },
                {
                  key: 'score',
                  header: 'Score',
                  align: 'right',
                  width: 'w-[120px]',
                  render: (r) => <ScoreCell score={r.score} maxScore={r.max_score} />,
                },
                {
                  key: 'ref',
                  header: 'Reference',
                  secondary: true,
                  render: (r) => <OptionalCell value={r.activity_ref} />,
                },
              ]}
            />
          ) : null}
        </section>

        {canRecord ? (
          <aside className="min-w-0">
            <SectionTitle className="mb-2.5">Record progress</SectionTitle>
            <RecordProgressForm fixedStudent={s} onRecorded={refetchProgress} />
          </aside>
        ) : null}
      </div>
    </>
  );
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = typeof params?.studentId === 'string' ? params.studentId : '';

  if (!studentId) return null;

  return (
    <RoleGuard capability="read_students">
      <StudentDetail studentId={studentId} />
    </RoleGuard>
  );
}
