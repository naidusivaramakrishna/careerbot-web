'use client';

import React from 'react';
import { CheckCircle2, Circle, X } from 'lucide-react';

import { useStudentTasks } from '@/hooks/useInstitutionResource';
import type { StudentTask } from '@/types/institution';
import { CardListSkeleton } from './Skeletons';
import { ErrorNotice } from './ErrorNotice';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK } from './tokens';

/**
 * One student's tasks, for the faculty member who set them.
 *
 * ANSWERS "HAS RAVI DONE IT", which is the question a faculty member actually
 * has -- and the one the tasks page promises. A roster-wide "who has finished
 * everything" view would need a request per student, so this loads ONE
 * student's tasks when somebody asks about that student, which is when the
 * answer is wanted.
 *
 * READ-ONLY HERE. A faculty member CAN tick a task off through the API -- it
 * is a to-do list, not an assessment -- but doing it from a roster is one
 * misclick away from marking work somebody has not done, and the student's own
 * screen is where it belongs. Showing state without offering to change it is
 * the honest shape for this panel.
 *
 * OVERDUE IS COMPUTED, as everywhere else. A stored flag is wrong from the
 * moment the clock passes it.
 */
const isOverdue = (task: StudentTask): boolean =>
  task.status === 'pending'
  && Boolean(task.due_at)
  && new Date(task.due_at as string).getTime() < Date.now();

export function StudentTasksPanel({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const tasks = useStudentTasks(studentId);
  const rows = tasks.data ?? [];
  const done = rows.filter((t) => t.status === 'done').length;

  return (
    <section className={`${CARD} p-5`} aria-labelledby="student-tasks-heading">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionTitle id="student-tasks-heading">{studentName}</SectionTitle>
          <Caption>
            {tasks.isLoading && !tasks.data
              ? 'Loading…'
              : rows.length === 0
                ? 'No tasks set yet.'
                : `${done} of ${rows.length} done.`}
          </Caption>
        </div>
        <button type="button" onClick={onClose} aria-label="Close"
                className="shrink-0 rounded-md p-1 hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" style={{ color: INK.muted }} />
        </button>
      </div>

      {tasks.error ? (
        <ErrorNotice error={tasks.error} onRetry={tasks.refetch}
                     className="mt-3" />
      ) : null}

      {tasks.isLoading && !tasks.data ? (
        <div className="mt-4"><CardListSkeleton items={2} /></div>
      ) : rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#f0f0f0]">
          {rows.map((task) => {
            const complete = task.status === 'done';
            const late = isOverdue(task);
            return (
              <li key={task.id} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5 shrink-0">
                  {complete
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    : <Circle className="h-4 w-4 text-[#94a3b8]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm"
                       style={{ color: complete ? INK.faint : INK.body }}>
                    {task.title}
                  </div>
                  <div className="mt-0.5 text-xs"
                       style={{ color: late ? '#b91c1c' : INK.faint }}>
                    {complete && task.completed_at
                      /* WHEN, not just that it is done. The first question
                         about a late submission is when it actually arrived. */
                      ? `Done ${new Date(task.completed_at).toLocaleDateString()}`
                      : late
                        ? 'Overdue'
                        : task.due_at
                          ? `Due ${new Date(task.due_at).toLocaleDateString()}`
                          : 'No deadline'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
