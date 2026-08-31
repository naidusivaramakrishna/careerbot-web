import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const completeTask = vi.fn();
vi.mock('@/api/institutionApi', () => ({
  completeTask: (...a: unknown[]) => completeTask(...a),
  setTasks: vi.fn(),
}));

import { MyTasksCard } from '@/app/institution/_components/MyTasksCard';
import { MyPeopleCard } from '@/app/institution/_components/MyPeopleCard';
import type { StudentTask } from '@/types/institution';

const DAY = 86_400_000;
const task = (over: Partial<StudentTask> = {}): StudentTask => ({
  id: 't1', student_id: 's1', title: 'Finish the mock test', details: null,
  due_at: new Date(Date.now() + 3 * DAY).toISOString(),
  status: 'pending', completed_at: null, set_by: 'f1', ...over,
});

beforeEach(() => completeTask.mockReset().mockResolvedValue({ changed: true }));

describe('the student task list', () => {
  it('shows what to do and when', () => {
    render(<MyTasksCard tasks={[task()]} />);
    expect(screen.getByText('Finish the mock test')).toBeInTheDocument();
    expect(screen.getByText(/due in 3 days/i)).toBeInTheDocument();
  });

  it('says OVERDUE for a passed deadline', () => {
    /** Computed from the date, never a stored flag -- a stored one is wrong
     *  from the moment the clock passes it until something fixes it, and a
     *  page left open overnight would still say "due tomorrow". */
    render(<MyTasksCard tasks={[task({
      due_at: new Date(Date.now() - 2 * DAY).toISOString(),
    })]} />);
    expect(screen.getByText(/overdue by 2 days/i)).toBeInTheDocument();
  });

  it('uses relative wording near the deadline and a date further out', () => {
    /** "Due tomorrow" is what a student acts on; a date three weeks away
     *  tells them nothing as "in 21 days". */
    render(<MyTasksCard tasks={[
      task({ id: 'a', title: 'Soon', due_at: new Date(Date.now() + DAY).toISOString() }),
      task({ id: 'b', title: 'Later', due_at: new Date(Date.now() + 40 * DAY).toISOString() }),
    ]} />);
    expect(screen.getByText(/due tomorrow/i)).toBeInTheDocument();
    expect(screen.queryByText(/due in 40 days/i)).not.toBeInTheDocument();
  });

  it('handles a task with NO deadline', () => {
    /** "Read chapter 4" is a real thing to set. Requiring a date would have
     *  staff invent one that then shows as overdue. */
    render(<MyTasksCard tasks={[task({ due_at: null })]} />);
    expect(screen.getByText(/no deadline/i)).toBeInTheDocument();
  });

  it('lets the STUDENT tick their own work off', async () => {
    /** It is a to-do list, not an assessment: nothing about readiness depends
     *  on it, so there is nothing worth lying about -- and a list somebody
     *  cannot mark only ever grows. */
    render(<MyTasksCard tasks={[task()]} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark .* as done/i }));
    });
    await waitFor(() => expect(completeTask).toHaveBeenCalledWith('t1'));
  });

  it('puts the tick BACK when saving fails', async () => {
    /** A student who believes they recorded something they did not is worse
     *  off than one who saw it fail. */
    completeTask.mockRejectedValueOnce(new Error('offline'));
    render(<MyTasksCard tasks={[task()]} />);
    // act(), matching the pattern the other component tests here use for a
    // rejecting async handler: without it the state update lands outside
    // React's batch and the rejection is reported before the component's own
    // catch has run.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark .* as done/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/could not save/i)).toBeInTheDocument());
    // still offers to mark it, rather than showing it as done
    expect(screen.getByRole('button', { name: /mark .* as done/i })).toBeEnabled();
  });

  it('does not offer to tick something already done', () => {
    render(<MyTasksCard tasks={[task({ status: 'done',
                                       completed_at: new Date().toISOString() })]} />);
    expect(screen.queryByRole('button', { name: /mark .* as done/i }))
      .not.toBeInTheDocument();
  });

  it('says so plainly when there is nothing set', () => {
    render(<MyTasksCard tasks={[]} />);
    expect(screen.getByText(/nothing set for you/i)).toBeInTheDocument();
  });
});

describe('my people', () => {
  const people = {
    faculty: [{ name: 'Dr Meera Iyer', role: 'faculty' as const }],
    hods: [{ name: 'Prof Rao', role: 'hod' as const }],
    placement_officers: [{ name: 'Ms Devi', role: 'cpo' as const }],
  };

  it('shows the three groups in the student’s words', () => {
    render(<MyPeopleCard people={people} />);
    expect(screen.getByText('Your faculty')).toBeInTheDocument();
    expect(screen.getByText('Placement cell')).toBeInTheDocument();
    expect(screen.getByText('Dr Meera Iyer')).toBeInTheDocument();
  });

  it('says WHY a group is empty rather than showing a blank', () => {
    /** "No faculty assigned yet" is a real state worth seeing -- it is why
     *  nobody is tracking them, and their placement officer can fix it. */
    render(<MyPeopleCard people={{ ...people, faculty: [] }} />);
    expect(screen.getByText(/no faculty assigned to you yet/i))
      .toBeInTheDocument();
  });

  it('shows a role rather than a blank for an unnamed staff member', () => {
    render(<MyPeopleCard people={{
      ...people, hods: [{ name: null, role: 'hod' as const }],
    }} />);
    expect(screen.getByText(/name not recorded/i)).toBeInTheDocument();
  });
});
