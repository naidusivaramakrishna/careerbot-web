'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { GraduationCap, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInstitution } from '@/contexts/InstitutionContext';
import {
  useMembers,
  useSections,
  useStudentsPaged,
} from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { MemberRecord, Student } from '@/types/institution';
import { DataTable, StackedCell } from './DataTable';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { PageHeader, SectionTitle } from './Typography';
import { StatCard } from './StatCard';
import { StatGridSkeleton, TableSkeleton, LoadingAnnouncement } from './Skeletons';
import { StudentStatusPill } from './StatusPill';
import { WriteGuard } from './WriteGuard';

/**
 * The head of department's dashboard. Department scope, read-only.
 *
 * Its own component, not a scope prop on a shared one -- P1 is LOCKED and
 * section 3.3 locks different content to the placement officer's 3.2: a
 * FACULTY LIST and department student progress, where the CPO gets department
 * comparison and institution rankings.
 *
 * The department is NOT chosen here and there is no picker. The server reads
 * it from this HOD's own membership, so `GET /students` already returns their
 * department and nothing else. Offering a department control on this screen
 * would imply an authority they do not have.
 *
 * TWO THINGS THE SPEC LOCKS THAT ARE NOT HERE, and why:
 *   - Faculty "Assigned" and "Avg readiness" columns. No endpoint reports
 *     either. Assignment counts are not returned by GET /members, and the
 *     readiness formula is marked OPEN. The faculty list ships without them
 *     rather than with invented numbers.
 *   - Student readiness and last-active. Same reason.
 * The list itself is the part that is real, and it was previously reachable
 * only as a picker inside the assignments screen.
 */
const RECENT_LIMIT = 12;

export function HodOverview() {
  const { readOnlyReason, allows } = useInstitution();
  const students = useStudentsPaged({ limit: RECENT_LIMIT });
  const sections = useSections(undefined, true);
  const faculty = useMembers('faculty', true);

  const unplaced = useStudentsPaged({ limit: 1, without_section: true });

  const rows = students.data?.items;
  const studentTotal = students.data?.total ?? 0;
  const withoutSection = unplaced.data?.total ?? 0;

  // Inactive staff are excluded: an HOD reading "who teaches here" should not
  // be counting people who have left. `active` is optional in the contract, so
  // only an explicit false removes a row.
  const facultyRows = useMemo(
    () => (faculty.data ?? []).filter((m) => m.active !== false),
    [faculty.data],
  );

  const recent = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, RECENT_LIMIT);
  }, [rows]);

  const addPeopleButton = (
    <Link href="/institution/people" tabIndex={readOnlyReason ? -1 : undefined}>
      <Button variant="default" size="sm" disabled={Boolean(readOnlyReason)}>
        <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
        Add people
      </Button>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Department overview"
        description="Your department at a glance — the staff who teach in it, and the students in it."
        actions={
          allows('onboard_student') ? (
            readOnlyReason ? (
              <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                {addPeopleButton}
              </WriteGuard>
            ) : (
              addPeopleButton
            )
          ) : null
        }
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch} className="mb-4" />
      ) : null}

      {students.isLoading && !rows ? (
        <>
          <StatGridSkeleton tiles={3} />
          <LoadingAnnouncement label="Loading department figures" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={studentTotal}
            caption="In your department"
            href="/institution/students"
          />
          <StatCard
            label="Faculty"
            value={facultyRows.length}
            caption="Teaching staff"
            href="/institution/people"
          />
          <StatCard
            label="Sections"
            value={sections.data?.length ?? 0}
            caption="Class groups"
            href="/institution/sections"
          />
          {withoutSection > 0 ? (
            <StatCard
              label="No section yet"
              value={withoutSection}
              caption="Not in any class group"
              href="/institution/students?without_section=1"
              emphasis
            />
          ) : null}
        </div>
      )}

      <section className="mt-6">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <SectionTitle>Faculty</SectionTitle>
          <Link
            href="/institution/assignments"
            className="rounded-sm text-[12px] font-medium text-[#2557a7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
          >
            Assign students
          </Link>
        </div>

        {faculty.error ? (
          <ErrorNotice error={faculty.error} onRetry={faculty.refetch} className="mb-3" />
        ) : faculty.isLoading && !faculty.data ? (
          <TableSkeleton rows={3} columns={2} />
        ) : facultyRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No faculty in your department yet"
            body="Add a faculty member from “Add people”. Once they are here you can assign students to them, and they can record progress."
          />
        ) : (
          <DataTable<MemberRecord>
            caption="Faculty in your department"
            rows={facultyRows}
            rowKey={(m) => m.membership_id}
            maxHeightClass="max-h-none"
            columns={[
              {
                key: 'name',
                header: 'Faculty',
                render: (m) => (
                  <StackedCell
                    // A member added by account id alone has no name the college
                    // ever typed. Showing the raw id is more use than "Unnamed":
                    // it is what the college has to search on to find them.
                    primary={m.display_name?.trim() || m.account_id}
                    secondary={m.display_name?.trim() ? m.account_id : undefined}
                  />
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <SectionTitle>Students in your department</SectionTitle>
          {studentTotal > recent.length ? (
            <Link
              href="/institution/students"
              className="rounded-sm text-[12px] font-medium text-[#2557a7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
            >
              View all {studentTotal}
            </Link>
          ) : null}
        </div>

        {students.isLoading && !rows ? (
          <TableSkeleton rows={5} columns={3} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            body="No students have been added to your department yet. Add them from “Add people”, or ask your placement officer to onboard them."
          />
        ) : (
          <DataTable<Student>
            caption="Students in your department"
            rows={recent}
            rowKey={(s) => s.id}
            rowHref={(s) => `/institution/students/${s.id}`}
            maxHeightClass="max-h-none"
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (s) => (
                  <StackedCell primary={s.full_name} secondary={s.admission_number ?? undefined} />
                ),
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
        )}
      </section>
    </>
  );
}
