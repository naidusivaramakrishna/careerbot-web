'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { setTasks } from '@/api/institutionApi';
import type { SetTasksResult } from '@/types/institution';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK } from './tokens';

/**
 * Set one piece of work for the students a faculty member has selected.
 *
 * PER-STUDENT RESULTS ARE SHOWN, NOT SWALLOWED. A section of forty always
 * contains somebody who transferred out last week. The server sets the other
 * thirty-nine and names who it could not reach; hiding that would leave a
 * faculty member believing everybody has the task, and the one student who
 * does not is exactly the one who then misses it.
 *
 * A DEADLINE IS OPTIONAL. "Read chapter 4" is a real thing to set, and
 * requiring a date would have staff invent one that then shows as overdue on
 * a student's screen.
 *
 * THE DATE INPUT IS A DATE, not a datetime. Nobody sets work for 14:30, and
 * asking for a time somebody does not care about is a field they get wrong.
 */
export function SetTaskForm({
  studentIds,
  onDone,
}: {
  studentIds: string[];
  onDone?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SetTasksResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && studentIds.length > 0 && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = await setTasks({
        student_ids: studentIds,
        title: title.trim(),
        details: details.trim() || null,
        // End of the chosen day, so a task due "today" is not already overdue
        // at nine in the morning. A bare date parses as midnight.
        due_at: due ? new Date(`${due}T23:59:59`).toISOString() : null,
      });
      setResult(out);
      setTitle('');
      setDetails('');
      setDue('');
      onDone?.();
    } catch {
      setError('Could not set the task. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${CARD} flex flex-col gap-4 p-5`}>
      <div>
        <SectionTitle>Set a task</SectionTitle>
        <Caption>
          {studentIds.length === 0
            ? 'Select students first.'
            : `For ${studentIds.length} student${studentIds.length === 1 ? '' : 's'}.`}
        </Caption>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: INK.body }}>
          What to do
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Finish the mock test"
          className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: INK.body }}>
          Details (optional)
        </span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
          rows={2}
          className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: INK.body }}>
          Due date (optional)
        </span>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-fit rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
        />
        <Caption>Leave blank if there is no deadline.</Caption>
      </label>

      {error ? <Caption className="text-red-600">{error}</Caption> : null}

      {result ? (
        <div className="rounded-lg bg-[#f8fafc] p-3">
          <Caption>
            Set for {result.created} student{result.created === 1 ? '' : 's'}.
          </Caption>
          {result.refused.length > 0 ? (
            /* NAMED, not counted. "3 failed" tells a faculty member nothing
               they can act on; the ids tell them which students to look at. */
            <Caption className="mt-1 text-amber-700">
              Could not set for {result.refused.length}:{' '}
              {result.refused.map((r) => r.student_id).join(', ')}
            </Caption>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button type="submit" disabled={!canSubmit} size="sm">
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Set task
        </Button>
      </div>
    </form>
  );
}
