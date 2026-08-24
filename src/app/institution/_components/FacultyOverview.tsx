'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardPen, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useStudentsPaged } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { Student } from '@/types/institution';
import { DataTable, OptionalCell, StackedCell } from './DataTable';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { PageHeader } from './Typography';
import { LoadingAnnouncement, TableSkeleton } from './Skeletons';
import { StudentStatusPill } from './StatusPill';
import { WriteGuard } from './WriteGuard';

/**
 * The faculty screen.
 *
 * A faculty member has a short list and one job, so this is deliberately NOT a
 * control panel: no stat tiles, no coverage figures, nothing to scan past. The
 * list is the page, and "Record progress" is the only primary action — they do
 * it many times in a row, so it is one click from here and one click from every
 * student row.
 *
 * `GET /students` already returns only their assigned students (the server
 * resolves the assignment set per request), so there is no client-side filter
 * to get wrong.
 */
const ROSTER_LIMIT = 200;

export function FacultyOverview() {
  const { readOnlyReason } = useInstitution();
  // 200 is the route's maximum page. A faculty roster is tens of students, so
  // one page is the whole thing -- but `total` is read rather than assumed, so
  // a roster that outgrows a page says so instead of quietly ending at 50,
  // which is where the default left it.
  const students = useStudentsPaged({ limit: ROSTER_LIMIT });
  const rows = students.data?.items;
  const total = students.data?.total ?? 0;
  const truncated = total > (rows?.length ?? 0);

  const recordButton = (
    <Link href="/institution/progress" tabIndex={readOnlyReason ? -1 : undefined}>
      <Button variant="default" size="sm" disabled={Boolean(readOnlyReason)}>
        <ClipboardPen className="mr-1.5 h-4 w-4" aria-hidden />
        Record progress
      </Button>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="My students"
        description="The students assigned to you. Record what they have completed as you go."
        actions={
          rows && rows.length > 0 ? (
            readOnlyReason ? (
              <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                {recordButton}
              </WriteGuard>
            ) : (
              recordButton
            )
          ) : null
        }
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch} className="mb-4" />
      ) : null}

      {truncated ? (
        <p className="mb-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[13px] leading-5 text-[#475569]">
          Showing {rows?.length} of {total}. Use the roster to search the rest.
        </p>
      ) : null}

      {students.isLoading && !rows ? (
        <>
          <TableSkeleton rows={6} columns={4} />
          <LoadingAnnouncement label="Loading your students" />
        </>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students assigned to you yet"
          body="Your head of department or placement officer decides which students you monitor. Once they assign them, the students appear here and you can start recording progress."
        />
      ) : rows ? (
        <DataTable<Student>
          caption="Students assigned to you"
          rows={rows}
          rowKey={(s) => s.id}
          rowHref={(s) => `/institution/students/${s.id}`}
          columns={[
            {
              key: 'name',
              header: 'Student',
              render: (s) => (
                <StackedCell primary={s.full_name} secondary={s.admission_number ?? undefined} />
              ),
            },
            {
              key: 'section',
              header: 'Section',
              secondary: true,
              render: (s) => <OptionalCell value={s.section_id} />,
            },
            {
              key: 'batch',
              header: 'Batch',
              align: 'right',
              width: 'w-[90px]',
              render: (s) =>
                s.batch_year ? (
                  <span className="tabular-nums">{s.batch_year}</span>
                ) : (
                  <span className="text-[#94a3b8]">—</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              width: 'w-[130px]',
              render: (s) => <StudentStatusPill status={s.status} />,
            },
          ]}
        />
      ) : null}
    </>
  );
}
