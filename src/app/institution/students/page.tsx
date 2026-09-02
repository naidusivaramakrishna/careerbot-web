'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, Search, UserPlus, KeyRound} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useStudentsPaged } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT, studentStatusLabel } from '@/lib/institutionMessages';
import type { Student } from '@/types/institution';
import { DataTable, OptionalCell, StackedCell } from '../_components/DataTable';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice } from '../_components/ErrorNotice';
import { RoleGuard } from '../_components/RoleGuard';
import { LoadingAnnouncement, TableSkeleton } from '../_components/Skeletons';
import { StudentStatusPill } from '../_components/StatusPill';
import { PageHeader } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { FOCUS_RING } from '../_components/tokens';
import { InviteCodeDialog } from '../_components/InviteCodeDialog';

/**
 * The roster.
 *
 * Search, the status filter and paging all run on the SERVER. They used to run
 * in the browser over whatever one default page had returned, which is honest
 * at forty students and a lie at a thousand: the box searched the first fifty
 * and answered "no students match that" for everyone else, and the header
 * announced "50 students in your view" to a college that had just uploaded a
 * thousand. Both look exactly like a student who was never added.
 */
const PAGE_SIZE = 50;
const STATUS_FILTERS = ['all', 'enrolled', 'graduated', 'withdrawn', 'suspended'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function StudentsRoster() {
  const { readOnlyReason, allows } = useInstitution();
  const params = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);

  // The dashboard's "no section yet" tile links here with the filter applied,
  // so the number it states and the list it opens are the same question.
  const withoutSection = params.get('without_section') === '1';

  // Debounced: a five-letter name is one request, not five.
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const students = useStudentsPaged({
    q: search || undefined,
    status: status === 'all' ? undefined : status,
    without_section: withoutSection || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  // Which student the invite dialog is open for, if any.
  const [inviteFor, setInviteFor] = useState<Student | null>(null);
  const writable = !readOnlyReason;
  const refetch = students.refetch;

  const rows = students.data?.items ?? null;
  const total = students.data?.total ?? 0;
  const filtering = Boolean(search) || status !== 'all' || withoutSection;
  const shownFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const shownTo = Math.min(page * PAGE_SIZE + (rows?.length ?? 0), total);

  // The server has already applied every filter. Re-applying them here is what
  // made the search box lie about the rows it had not loaded.
  const filtered = rows;

  const addButton = (
    <Link href="/institution/people" tabIndex={readOnlyReason ? -1 : undefined}>
      <Button variant="default" size="sm" disabled={Boolean(readOnlyReason)}>
        <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
        Add a student
      </Button>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Students"
        description={
          rows
            ? `${total} ${total === 1 ? 'student' : 'students'}${
                filtering ? ' match' : ' in your view'
              }.`
            : 'Everyone you can see, newest first.'
        }
        actions={
          allows('onboard_student') ? (
            readOnlyReason ? (
              <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                {addButton}
              </WriteGuard>
            ) : (
              addButton
            )
          ) : null
        }
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch} className="mb-4" />
      ) : null}

      {withoutSection ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-3 py-2">
          <span className="text-[13px] leading-5 text-[#78350f]">
            Showing only students who are in no class group. They are invisible
            to every faculty roster until they are placed in one.
          </span>
          <Link
            href="/institution/students"
            className="rounded-sm text-[12px] font-medium text-[#92400e] underline"
          >
            Show everyone
          </Link>
        </div>
      ) : null}

      {rows && (rows.length > 0 || filtering) ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, admission number or email"
              aria-label="Search students"
              className={cn(
                'w-full rounded-lg border border-[#cbd5e1] bg-white py-2 pl-8 pr-3 text-[13px] leading-5 text-[#0f172a]',
                'placeholder:text-[#94a3b8]',
                FOCUS_RING,
              )}
            />
          </div>

          <div
            role="group"
            aria-label="Filter by status"
            className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white p-0.5"
          >
            {STATUS_FILTERS.map((value) => {
              const active = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatus(value);
                    setPage(0);
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12px] font-medium',
                    'transition-colors duration-150 motion-reduce:transition-none',
                    active
                      ? 'bg-[#2557a7] text-white'
                      : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#2557a7]',
                    FOCUS_RING,
                  )}
                >
                  {value === 'all' ? 'All' : studentStatusLabel(value)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {students.isLoading && !rows ? (
        <>
          <TableSkeleton rows={8} columns={5} />
          <LoadingAnnouncement label="Loading students" />
        </>
      ) : rows && rows.length === 0 && !filtering ? (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          body="Students appear here once they are onboarded with a department and an admission number. You can add them one at a time from “Add people”."
          action={
            allows('onboard_student') && !readOnlyReason ? (
              <Link href="/institution/people">
                <Button variant="default" size="sm">
                  Add a student
                </Button>
              </Link>
            ) : null
          }
        />
      ) : filtered && filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No students match that"
          body="Try a shorter search, a different spelling, or clear the status filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setStatus('all');
                setPage(0);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : filtered ? (
        <DataTable<Student>
          caption="Students"
          rows={filtered}
          rowKey={(s) => s.id}
          rowHref={(s) => `/institution/students/${s.id}`}
          columns={[
            {
              key: 'name',
              header: 'Student',
              render: (s) => (
                <StackedCell primary={s.full_name} secondary={s.college_email ?? undefined} />
              ),
            },
            {
              key: 'admission',
              header: 'Admission no.',
              width: 'w-[150px]',
              render: (s) =>
                s.admission_number ? (
                  <span className="tabular-nums">{s.admission_number}</span>
                ) : (
                  <span className="text-[#94a3b8]">—</span>
                ),
            },
            {
              key: 'department',
              header: 'Department',
              secondary: true,
              render: (s) => <OptionalCell value={s.department_id} />,
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
            {
              // Whether the student can actually sign in yet. A roster row is
              // just a record until someone claims it, and an officer needs to
              // see at a glance who is still waiting.
              key: 'account',
              header: 'Account',
              width: 'w-[190px]',
              render: (s) =>
                s.claim_status === 'claimed' ? (
                  <span className="text-[12px] text-[#64748b]">Signed up</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      // The row is a link to the student page; issuing a code
                      // must not navigate away from the roster.
                      e.stopPropagation();
                      e.preventDefault();
                      setInviteFor(s);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-[12px] font-medium text-[#334155] hover:bg-[#f1f5f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2557a7]"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    {s.claim_status === 'invited' ? 'Reissue code' : 'Invite'}
                  </button>
                ),
            },
          ]}
        />
      ) : null}

      {inviteFor ? (
        <InviteCodeDialog
          student={inviteFor}
          writable={writable}
          onClose={() => setInviteFor(null)}
          onIssued={() => void refetch()}
        />
      ) : null}

      {total > PAGE_SIZE ? (
        <nav
          className="mt-3 flex flex-wrap items-center justify-between gap-3"
          aria-label="Roster pages"
        >
          <span className="text-[12px] leading-4 tabular-nums text-[#64748b]">
            {shownFrom}–{shownTo} of {total}
          </span>
          <span className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || students.isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={shownTo >= total || students.isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </span>
        </nav>
      ) : null}
    </>
  );
}

export default function StudentsPage() {
  return (
    <RoleGuard capability="read_students">
      {/* useSearchParams needs a Suspense boundary, or the build refuses to
          prerender this route at all. The fallback is the same skeleton the
          roster shows while it loads, so the boundary is invisible. */}
      <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
        <StudentsRoster />
      </Suspense>
    </RoleGuard>
  );
}
