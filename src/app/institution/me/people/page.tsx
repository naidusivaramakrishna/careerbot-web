'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useInstitution } from '@/contexts/InstitutionContext';
import { useMyPeople } from '@/hooks/useInstitutionResource';
import { MyPeopleCard } from '../../_components/MyPeopleCard';
import { ErrorNotice } from '../../_components/ErrorNotice';
import { CardListSkeleton } from '../../_components/Skeletons';
import { PageHeader } from '../../_components/Typography';

/**
 * A student's people: their faculty, head of department and placement cell.
 *
 * Its own screen, reached from the college group in the Sidebar (spec: student
 * section, "My people"). STUDENTS ONLY at render time, so the request is
 * never made for a member of staff; staff add people at
 * /institution/people, which is a different screen.
 */
function MyPeopleScreen() {
  const { role } = useInstitution();
  const people = useMyPeople(role === 'student');

  return (
    <>
      <PageHeader
        title="My people"
        description="Who to ask about your progress."
      />
      {people.error ? (
        <ErrorNotice error={people.error} onRetry={people.refetch} className="mb-4" />
      ) : null}
      {people.isLoading && !people.data ? <CardListSkeleton items={3} /> : null}
      {people.data ? <MyPeopleCard people={people.data} /> : null}
    </>
  );
}

/**
 * Anyone who is not a student is sent to their own college overview, and sees
 * nothing of this screen on the way: a member of staff who opens this URL is
 * not shown a refusal page that did not exist before (staff screens are
 * unchanged), and no student request is made for them.
 */
export default function MyPeoplePage() {
  const { role } = useInstitution();
  const router = useRouter();

  useEffect(() => {
    if (role && role !== 'student') router.replace('/institution');
  }, [role, router]);

  if (role !== 'student') return null;
  return <MyPeopleScreen />;
}
