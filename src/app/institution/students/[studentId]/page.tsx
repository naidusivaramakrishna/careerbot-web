'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardPen, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStudent } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useInstitutionResource, useStudentProgress } from '@/hooks/useInstitutionResource';
import { activityLabel } from '@/lib/institutionMessages';
import type { ProgressRecord, Student } from '@/types/institution';
import { DataTable, OptionalCell } from '../../_components/DataTable';
import { EmptyState } from '../../_components/EmptyState';
import { ErrorNotice } from '../../_components/ErrorNotice';
import { RecordProgressForm } from '../../_components/RecordProgressForm';
import { RoleGuard } from '../../_components/RoleGuard';
import { CardListSkeleton, LoadingAnnouncement, TableSkeleton } from '../../_components/Skeletons';
import { ProgressStatusPill, ScoreCell, StudentStatusPill } from '../../_components/StatusPill';
import { MicroLabel, PageHeader, SectionTitle } from '../../_components/Typography';
import { CARD, FOCUS_RING } from '../../_components/tokens';

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
  const { allows } = useInstitution();
  const fetchStudent = useCallback(() => getStudent(studentId), [studentId]);
  const student = useInstitutionResource<Student>(fetchStudent);
  const progress = useStudentProgress(studentId);

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

  if (student.error) {
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

  return (
    <>
      <div className="mb-3">{backLink}</div>

      <PageHeader
        title={s.full_name}
        description={s.college_email ?? undefined}
        actions={<StudentStatusPill status={s.status} />}
      />

      <div className={`${CARD} mb-5 grid grid-cols-2 gap-x-6 gap-y-4 p-4 sm:grid-cols-4`}>
        <div>
          <MicroLabel as="div">Admission no.</MicroLabel>
          <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
            {s.admission_number ?? '—'}
          </p>
        </div>
        <div>
          <MicroLabel as="div">Department</MicroLabel>
          <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{s.department_id}</p>
        </div>
        <div>
          <MicroLabel as="div">Section</MicroLabel>
          <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{s.section_id ?? '—'}</p>
        </div>
        <div>
          <MicroLabel as="div">Batch</MicroLabel>
          <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
            {s.batch_year ?? '—'}
          </p>
        </div>
      </div>

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
