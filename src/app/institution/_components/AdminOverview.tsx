'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Building2, GraduationCap, Layers, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useBatches, useDepartments, useSections, useStudents } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { Student } from '@/types/institution';
import { DataTable, StackedCell, OptionalCell } from './DataTable';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { PageHeader, SectionTitle } from './Typography';
import { StatCard } from './StatCard';
import { StatGridSkeleton, TableSkeleton, LoadingAnnouncement } from './Skeletons';
import { StudentStatusPill } from './StatusPill';
import { WriteGuard } from './WriteGuard';

/**
 * The control panel for a CPO and an HOD.
 *
 * Same shape for both, because the job is the same — it is the SCOPE that
 * differs, and the server already narrows the data: an HOD's `GET /students`
 * returns their department, a CPO's returns the college. Two near-identical
 * screens maintained separately would drift; one screen with scope-aware copy
 * will not.
 *
 * The difference that IS real is emphasis. A CPO reads counts and coverage
 * across thousands of students and needs the fast jump to a cohort. An HOD
 * works with a few hundred and looks at individuals sooner, so their recent
 * roster runs longer and their org tiles are dropped (they do not create
 * departments or batches).
 */
export function AdminOverview({ scope }: { scope: 'cpo' | 'hod' }) {
  const { readOnlyReason, canWrite, allows } = useInstitution();
  const students = useStudents();
  const departments = useDepartments(scope === 'cpo');
  const batches = useBatches(scope === 'cpo');
  const sections = useSections(undefined, true);

  const rows = students.data;

  /**
   * Coverage: a student with no section is invisible to a faculty roster, so
   * it is the outlier a placement officer actually needs surfaced. Computed
   * client-side because the contract has no aggregate endpoint (see report).
   */
  const withoutSection = useMemo(
    () => (rows ? rows.filter((s) => !s.section_id).length : 0),
    [rows],
  );

  const recent = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, scope === 'cpo' ? 8 : 12);
  }, [rows, scope]);

  const isCpo = scope === 'cpo';
  const title = isCpo ? 'College overview' : 'Department overview';
  const description = isCpo
    ? 'Everything across your college — counts first, then the students who need attention.'
    : 'Your department at a glance, and the students in it.';

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
        title={title}
        description={description}
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
          <StatGridSkeleton tiles={isCpo ? 4 : 2} />
          <LoadingAnnouncement label="Loading college figures" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={rows?.length ?? 0}
            caption={isCpo ? 'Across the college' : 'In your department'}
            href="/institution/students"
          />
          <StatCard
            label="Sections"
            value={sections.data?.length ?? 0}
            caption="Class groups"
            href="/institution/sections"
          />
          {isCpo ? (
            <>
              <StatCard
                label="Departments"
                value={departments.data?.length ?? 0}
                caption="Academic units"
                href="/institution/departments"
              />
              <StatCard
                label="Batches"
                value={batches.data?.length ?? 0}
                caption="Academic years"
                href="/institution/batches"
              />
            </>
          ) : null}
          {withoutSection > 0 ? (
            <StatCard
              label="No section yet"
              value={withoutSection}
              caption="Not in any class group"
              href="/institution/students"
              emphasis
            />
          ) : null}
        </div>
      )}

      <section className="mt-6">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <SectionTitle>Recently added students</SectionTitle>
          {rows && rows.length > recent.length ? (
            <Link
              href="/institution/students"
              className="rounded-sm text-[12px] font-medium text-[#2557a7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
            >
              View all {rows.length}
            </Link>
          ) : null}
        </div>

        {students.isLoading && !rows ? (
          <TableSkeleton rows={5} columns={4} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            body={
              isCpo
                ? 'Once you add departments and start onboarding students, they appear here. Add your first department, then add people.'
                : 'No students have been added to your department yet. Add them from “Add people”, or ask your placement officer to onboard them.'
            }
            action={
              isCpo ? (
                <Link href="/institution/departments">
                  <Button variant="outline" size="sm">
                    <Building2 className="mr-1.5 h-4 w-4" aria-hidden />
                    Set up departments
                  </Button>
                </Link>
              ) : null
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
                secondary: !isCpo,
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

      {isCpo && sections.data?.length === 0 && !sections.isLoading ? (
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
