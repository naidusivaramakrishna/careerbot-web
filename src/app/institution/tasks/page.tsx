'use client';

import React, { useMemo, useState } from 'react';
import { GraduationCap } from 'lucide-react';

import { useStudentsPaged } from '@/hooks/useInstitutionResource';
import { RoleGuard } from '../_components/RoleGuard';
import { SetTaskForm } from '../_components/SetTaskForm';
import { ErrorNotice } from '../_components/ErrorNotice';
import { EmptyState } from '../_components/EmptyState';
import { CardListSkeleton } from '../_components/Skeletons';
import { Caption, PageHeader } from '../_components/Typography';
import { CARD, INK } from '../_components/tokens';

/**
 * Where a faculty member sets work for their students.
 *
 * GATED ON write_progress, which is faculty-only and mirrors the backend
 * exactly -- setting work is the same authority as recording a result,
 * because both are a member of staff asserting something about a student they
 * are responsible for. A CPO who can READ these students still cannot set
 * them work, and the guard says so rather than letting them fill in a form
 * that comes back 403.
 *
 * THE ROSTER IS ALREADY SCOPED. A faculty member's students.list returns
 * their assigned set, so there is no "pick a department" step and no way to
 * reach somebody else's students -- the selection here can only be a subset of
 * what the server would have allowed anyway.
 */
export default function TasksPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const students = useStudentsPaged({ limit: 200 });
  const rows = useMemo(() => students.data?.items ?? [], [students.data]);

  const allSelected = rows.length > 0 && rows.every((s) => selected.has(s.id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((s) => s.id)));

  return (
    <RoleGuard capability="write_progress">
      <PageHeader
        title="Tasks"
        description="Set work for your students and see who has finished it."
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch}
                     className="mb-4" />
      ) : null}

      {students.isLoading && !students.data ? (
        <CardListSkeleton items={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          body="Students assigned to you appear here. Your placement officer or head of department assigns them."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b
                            border-[#e2e8f0] px-4 py-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allSelected}
                       onChange={toggleAll} className="h-4 w-4" />
                <span style={{ color: INK.body }}>
                  {selected.size > 0
                    ? `${selected.size} selected`
                    : 'Select all'}
                </span>
              </label>
              <Caption>{rows.length} students</Caption>
            </div>

            <ul className="divide-y divide-[#f0f0f0]">
              {rows.map((student) => (
                <li key={student.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4
                                    py-2.5 hover:bg-[#f8fafc]">
                    <input
                      type="checkbox"
                      checked={selected.has(student.id)}
                      onChange={() => toggle(student.id)}
                      className="h-4 w-4"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm"
                          style={{ color: INK.body }}>
                      {student.full_name}
                    </span>
                    <span className="shrink-0 font-mono text-xs"
                          style={{ color: INK.faint }}>
                      {student.admission_number}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <div>
            <SetTaskForm
              studentIds={[...selected]}
              /* CLEARED ON SUCCESS. Leaving the selection ticked after
                 setting work is how the same task gets set twice -- the
                 server de-duplicates within one request, not across two. */
              onDone={() => setSelected(new Set())}
            />
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
