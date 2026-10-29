'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Building2, GraduationCap, Layers, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInstitution } from '@/contexts/InstitutionContext';
import {
  useBatches,
  useCohortComparison,
  useDepartments,
  useLeaderboard,
  useSections,
  useStudentsPaged,
} from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { CohortComparisonGroup, Department, Student } from '@/types/institution';
import { DataTable, StackedCell, OptionalCell } from './DataTable';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { LeaderboardCard } from './LeaderboardCard';
import { rankDepartments } from './StaffReadiness';
import { PageHeader, SectionTitle } from './Typography';
import { StatCard } from './StatCard';
import { StatGridSkeleton, TableSkeleton, LoadingAnnouncement } from './Skeletons';
import { StudentStatusPill } from './StatusPill';
import { WriteGuard } from './WriteGuard';

/**
 * The placement officer's dashboard. College scope, read-all.
 *
 * Its own component, not a scope prop on a shared one. P1 is LOCKED:
 * "Each role has its OWN dashboard. Admin, CPO, HOD, Faculty, and College
 * Student never share one screen with role toggles." The two screens were
 * one component because the CONTENT was the same, and the content was the
 * same only because neither had been built yet. Section 3.2 locks institution
 * rankings, department comparison, onboarding entry and reports/export for
 * this screen; 3.3 locks a faculty list and department progress for the HOD.
 * They diverge from here, and a shared component would have had to grow a
 * second `scope ===` branch for every one of those.
 *
 * READINESS AND RANK. 3.2 locks both. They were withheld until the owner
 * approved the 25/25/20/20/10 readiness weights (2026-10-26); they now come
 * from GET /reports/comparison (department average and median, aggregates
 * only) and GET /leaderboard (top students, opt-in names only). Rank is the
 * department's position by average among departments that HAVE an average --
 * a department below the ten-scored-student floor shows its count and no
 * rank, because the server withholds its average for privacy.
 */
const RECENT_LIMIT = 8;

/**
 * One department's true student count.
 *
 * Its own component because it holds a hook, and asking the server per
 * department is the only honest way to do this: counting the rows on a page
 * of `GET /students` reports whatever fitted on that page. `limit: 1` because
 * nothing here reads the rows -- only `total`.
 */
function DepartmentStudentCount({ departmentId }: { departmentId: string }) {
  const count = useStudentsPaged({ limit: 1, department_id: departmentId });
  if (count.isLoading && !count.data) {
    return <span className="text-[#94a3b8]">—</span>;
  }
  return <span className="tabular-nums">{count.data?.total ?? 0}</span>;
}

export function CpoOverview() {
  const { readOnlyReason, canWrite, allows } = useInstitution();
  // Only the rows this screen actually SHOWS. The headline count comes from
  // the server's `total`, not from the length of this list: reading the count
  // off a page of results told a placement officer who had just uploaded a
  // thousand students that they had fifty.
  const students = useStudentsPaged({ limit: RECENT_LIMIT });
  const departments = useDepartments(true);
  const batches = useBatches(true);
  const sections = useSections(undefined, true);

  // Asked for as a COUNT, not as rows to tally. A student in no class group is
  // invisible to every faculty roster, which is exactly the outlier that must
  // stay true at a thousand students.
  const unplaced = useStudentsPaged({ limit: 1, without_section: true });

  // Readiness, aggregate only -- one request for every department.
  const comparison = useCohortComparison(true);
  // The college's top students. Names only students who opted in.
  const board = useLeaderboard(10, true);

  const rows = students.data?.items;
  const studentTotal = students.data?.total ?? 0;
  const withoutSection = unplaced.data?.total ?? 0;
  const departmentRows = useMemo(() => departments.data ?? [], [departments.data]);

  // Counted from the list already loaded for the stat card above, NOT with a
  // request per department: GET /sections returns the college's sections whole
  // (Section[], not a page), and every row carries its department_id. One
  // request answers the whole column.
  const comparisonByDepartment = useMemo(() => {
    const map = new Map<string, CohortComparisonGroup>();
    (comparison.data?.groups ?? []).forEach((g) => map.set(g.group, g));
    return map;
  }, [comparison.data]);

  // Ranked only among the departments this table shows, so "unassigned" or a
  // department deleted since cannot take a place.
  const departmentRanks = useMemo(() => {
    const shown = new Set(departmentRows.map((d) => d.id));
    return rankDepartments(
      (comparison.data?.groups ?? []).filter((g) => shown.has(g.group)),
    );
  }, [comparison.data, departmentRows]);

  const sectionsByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    (sections.data ?? []).forEach((row) => {
      counts.set(row.department_id, (counts.get(row.department_id) ?? 0) + 1);
    });
    return counts;
  }, [sections.data]);

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
        title="College overview"
        description="Everything across your college — counts first, then the students who need attention."
        actions={
          allows('add_people') ? (
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
          <StatGridSkeleton tiles={4} />
          <LoadingAnnouncement label="Loading college figures" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={studentTotal}
            caption="Across the college"
            href="/institution/students"
          />
          <StatCard
            label="Sections"
            value={sections.data?.length ?? 0}
            caption="Class groups"
            href="/institution/sections"
          />
          <StatCard
            label="Departments"
            value={departmentRows.length}
            caption="Academic units"
            href="/institution/departments"
          />
          <StatCard
            label="Batches"
            value={batches.data?.length ?? 0}
            caption="Academic years"
            href="/institution/batches"
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

      {departmentRows.length > 0 ? (
        <section className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <SectionTitle>Department comparison</SectionTitle>
            <Link
              href="/institution/departments"
              className="rounded-sm text-[12px] font-medium text-[#2557a7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
            >
              View all departments
            </Link>
          </div>
          <DataTable<Department>
            caption="Department comparison"
            rows={departmentRows}
            rowKey={(d) => d.id}
            maxHeightClass="max-h-none"
            columns={[
              {
                key: 'name',
                header: 'Department',
                render: (d) => <StackedCell primary={d.name} />,
              },
              {
                key: 'students',
                header: 'Students',
                align: 'right',
                width: 'w-[110px]',
                render: (d) => <DepartmentStudentCount departmentId={d.id} />,
              },
              {
                key: 'sections',
                header: 'Sections',
                align: 'right',
                width: 'w-[110px]',
                secondary: true,
                render: (d) => (
                  <span className="tabular-nums">
                    {sectionsByDepartment.get(d.id) ?? 0}
                  </span>
                ),
              },
              {
                key: 'readiness',
                header: 'Avg readiness',
                align: 'right',
                width: 'w-[150px]',
                render: (d) => {
                  if (comparison.isLoading && !comparison.data) {
                    return <span className="text-[#94a3b8]">—</span>;
                  }
                  const g = comparisonByDepartment.get(d.id);
                  if (!g || g.scored === 0) {
                    return <span className="text-[12px] text-[#94a3b8]">No scores yet</span>;
                  }
                  if (!g.available) {
                    return (
                      <span className="text-[12px] text-[#94a3b8]">
                        {g.scored} scored, too few to show
                      </span>
                    );
                  }
                  return (
                    <span className="tabular-nums">
                      <span className="font-medium text-[#0f172a]">{g.average}</span>
                      <span className="ml-1 text-[11px] text-[#94a3b8]">
                        median {g.median}
                      </span>
                    </span>
                  );
                },
              },
              {
                key: 'rank',
                header: 'Rank',
                align: 'right',
                width: 'w-[80px]',
                render: (d) => {
                  const rank = departmentRanks.get(d.id);
                  return rank ? (
                    <span className="tabular-nums">
                      {rank}
                      <span className="text-[11px] text-[#94a3b8]"> of {departmentRanks.size}</span>
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  );
                },
              },
            ]}
          />
          {comparison.error ? (
            <ErrorNotice error={comparison.error} onRetry={comparison.refetch} className="mt-2" />
          ) : (
            <p className="mt-2 text-[12px] leading-relaxed text-[#64748b]">
              Readiness is out of 100 (mock test 25, coding test 25, mock
              interview 20, English 20, resume ATS 10). The average and median
              are over students with at least one score. A department with
              fewer than ten scored students shows its count only, and is not
              ranked.
            </p>
          )}
        </section>
      ) : null}

      {board.error ? (
        <ErrorNotice error={board.error} onRetry={board.refetch} className="mt-6" />
      ) : board.data ? (
        <div className="mt-6">
          <LeaderboardCard board={board.data} audience="staff" />
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <SectionTitle>Recently added students</SectionTitle>
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
          <TableSkeleton rows={5} columns={4} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            body="Once you add departments and start onboarding students, they appear here. Add your first department, then add people."
            action={
              <Link href="/institution/departments">
                <Button variant="outline" size="sm">
                  <Building2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Set up departments
                </Button>
              </Link>
            }
          />
        ) : (
          <DataTable<Student>
            caption="Recently added students"
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
                key: 'department',
                header: 'Department',
                render: (s) => <OptionalCell value={s.department_id} />,
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

      {sections.data?.length === 0 && !sections.isLoading ? (
        <section className="mt-6">
          <SectionTitle className="mb-2.5">Set up your college</SectionTitle>
          <EmptyState
            icon={Layers}
            title="No class groups yet"
            body="Departments, batches and sections are the structure everything else hangs off. Create a department first, then a batch for the academic year, then the sections inside it."
            action={
              canWrite('manage_org') ? (
                <Link href="/institution/departments">
                  <Button variant="default" size="sm">
                    Start with departments
                  </Button>
                </Link>
              ) : null
            }
          />
        </section>
      ) : null}
    </>
  );
}
