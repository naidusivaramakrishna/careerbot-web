'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useInstitution } from '@/contexts/InstitutionContext';
import { useMyTasks } from '@/hooks/useInstitutionResource';
import { MyTasksCard } from '../../_components/MyTasksCard';
import { ErrorNotice } from '../../_components/ErrorNotice';
import { CardListSkeleton } from '../../_components/Skeletons';
import { PageHeader } from '../../_components/Typography';

/**
 * A student's tasks: what their college has asked them to do.
 *
 * Its own screen, reached from the college group in the Sidebar (spec: student
 * section, "Tasks"). It is the only thing in the college area that asks the
 * student to do something, so it does not sit at the bottom of another page.
 *
 * STUDENTS ONLY, at render time: the page renders nothing for anyone else, so
 * the tasks request is never made for a member of staff.
 * Staff set work at /institution/tasks, which is a different screen.
 */
function MyTasksScreen() {
  const { role } = useInstitution();
  const tasks = useMyTasks(role === 'student');

  return (
    <>
      <PageHeader
        title="Tasks"
        description="What your college has asked you to do."
      />
      {tasks.error ? (
        <ErrorNotice error={tasks.error} onRetry={tasks.refetch} className="mb-4" />
      ) : null}
      {tasks.isLoading && !tasks.data ? <CardListSkeleton items={3} /> : null}
      {tasks.data ? (
        // MyTasksCard renders its own empty state for [].
        <MyTasksCard tasks={tasks.data} onChanged={tasks.refetch} />
      ) : null}
    </>
  );
}

/**
 * Anyone who is not a student is sent to their own college overview, and sees
 * nothing of this screen on the way: a member of staff who opens this URL is
 * not shown a refusal page that did not exist before (staff screens are
 * unchanged), and no student request is made for them.
 */
export default function MyTasksPage() {
  const { role } = useInstitution();
  const router = useRouter();

  useEffect(() => {
    if (role && role !== 'student') router.replace('/institution');
  }, [role, router]);

  if (role !== 'student') return null;
  return <MyTasksScreen />;
}
