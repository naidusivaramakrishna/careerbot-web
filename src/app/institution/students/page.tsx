'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Search, UserPlus, KeyRound} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useStudents } from '@/hooks/useInstitutionResource';
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
 * `GET /institution/students` takes no query parameters and returns the caller's
 * whole scope in one response, so search and the status filter run client-side
 * over what was fetched. That is honest at department scale and at most college
 * scales; it is the first thing that will need a server-side `?q=` when a
 * college passes a few thousand students (see report).
 */
const STATUS_FILTERS = ['all', 'enrolled', 'graduated', 'withdrawn', 'suspended'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function StudentsRoster() {
  const { readOnlyReason, allows } = useInstitution();
  const students = useStudents();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  // Which student the invite dialog is open for, if any.
  const [inviteFor, setInviteFor] = useState<Student | null>(null);
  const writable = !readOnlyReason;
  const refetch = students.refetch;

  const rows = students.data;

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (!q) return true;
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_number ?? '').toLowerCase().includes(q) ||
        (s.college_email ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

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
            ? `${rows.length} ${rows.length === 1 ? 'student' : 'students'} in your view.`
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

      {rows && rows.length > 0 ? (
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
                  onClick={() => setStatus(value)}
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
      ) : rows && rows.length === 0 ? (
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
    </>
  );
}

export default function StudentsPage() {
  return (
    <RoleGuard capability="read_students">
      <StudentsRoster />
    </RoleGuard>
  );
}
