'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

import { completeTask } from '@/api/institutionApi';
import type { StudentTask } from '@/types/institution';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK } from './tokens';

/**
 * What this student has been asked to do, and by when.
 *
 * OVERDUE IS COMPUTED HERE, NOT STORED. A stored flag is wrong from the moment
 * the clock passes a deadline until something remembers to fix it -- the same
 * reason the trial tier is derived rather than written down. It also means a
 * page left open overnight is right in the morning.
 *
 * THE STUDENT TICKS THEIR OWN WORK OFF. It is a to-do list, not an
 * assessment: no score or readiness depends on it, so there is nothing here
 * worth lying about, and a list somebody cannot mark is one that only ever
 * grows.
 *
 * OPTIMISTIC, AND HONEST WHEN IT FAILS. The tick appears immediately because
 * waiting on a round trip to acknowledge a checkbox feels broken -- but a
 * failure puts it back rather than leaving a student believing they had
 * recorded something they had not.
 */
const isOverdue = (task: StudentTask): boolean =>
  task.status === 'pending'
  && Boolean(task.due_at)
  && new Date(task.due_at as string).getTime() < Date.now();

const dueLabel = (task: StudentTask): string => {
  if (!task.due_at) return 'No deadline';
  const due = new Date(task.due_at);
  if (Number.isNaN(due.getTime())) return 'No deadline';

  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (task.status === 'done') return `Due ${due.toLocaleDateString()}`;
  // RELATIVE NEAR THE DEADLINE, absolute further out. "Due tomorrow" is what
  // a student acts on; "due 14 Nov" is what they plan around, and a date three
  // weeks away tells them nothing as "in 21 days".
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${due.toLocaleDateString()}`;
};

export function MyTasksCard({
  tasks,
  onChanged,
}: {
  tasks: StudentTask[];
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const tick = async (task: StudentTask) => {
    if (busy || task.status === 'done' || done.has(task.id)) return;
    setBusy(task.id);
    setError(null);
    setDone((current) => new Set(current).add(task.id));
    try {
      await completeTask(task.id);
      onChanged?.();
    } catch {
      // Put it back. A student who thinks they recorded something they did
      // not is worse off than one who saw it fail.
      setDone((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
      setError('Could not save that. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <section className={`${CARD} p-5`} aria-labelledby="tasks-heading">
        <SectionTitle id="tasks-heading">Your tasks</SectionTitle>
        <Caption>
          Nothing set for you right now. Your faculty will add work here.
        </Caption>
      </section>
    );
  }

  const outstanding = tasks.filter(
    (t) => t.status !== 'done' && !done.has(t.id)).length;

  return (
    <section className={`${CARD} p-5`} aria-labelledby="tasks-heading">
      <SectionTitle id="tasks-heading">Your tasks</SectionTitle>
      <Caption>
        {outstanding === 0
          ? 'All done. Nothing outstanding.'
          : `${outstanding} still to do.`}
      </Caption>

      <ul className="mt-4 divide-y divide-[#f0f0f0]">
        {tasks.map((task) => {
          const complete = task.status === 'done' || done.has(task.id);
          const late = !complete && isOverdue(task);
          return (
            <li key={task.id} className="flex items-start gap-3 py-3">
              <button
                type="button"
                onClick={() => tick(task)}
                disabled={complete || busy === task.id}
                aria-label={complete ? `${task.title}, done`
                                     : `Mark ${task.title} as done`}
                className="mt-0.5 shrink-0 disabled:cursor-default"
              >
                {busy === task.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#64748b]" />
                ) : complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-[#94a3b8]" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className={`text-sm ${complete ? 'line-through' : ''}`}
                     style={{ color: complete ? INK.faint : INK.body }}>
                  {task.title}
                </div>
                {task.details ? (
                  <div className="mt-0.5 text-xs" style={{ color: INK.muted }}>
                    {task.details}
                  </div>
                ) : null}
                <div className="mt-1 text-xs"
                     style={{ color: late ? '#b91c1c' : INK.faint }}>
                  {dueLabel(task)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <Caption className="mt-3 text-red-600">{error}</Caption>
      ) : null}
    </section>
  );
}
