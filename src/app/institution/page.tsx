'use client';

import React from 'react';
import { useInstitution } from '@/contexts/InstitutionContext';
import { CpoOverview } from './_components/CpoOverview';
import { HodOverview } from './_components/HodOverview';
import { FacultyOverview } from './_components/FacultyOverview';
import { StudentOverview } from './_components/StudentOverview';

/**
 * The college landing screen, dispatched on role.
 *
 * The four roles do not get the same page with things hidden — they get four
 * genuinely different screens, because they are four different jobs. A CPO gets
 * a control panel over the college, an HOD one over their department, a faculty
 * member a short worklist, and a student a personal record.
 *
 * This comment used to say that while the CPO and HOD branches both rendered
 * ONE component with a `scope` prop. P1 is LOCKED -- "never share one screen
 * with role toggles" -- and the two screens are specified with different
 * content, not merely different scope (3.2 vs 3.3).
 */
export default function InstitutionOverviewPage() {
  const { role } = useInstitution();

  // The gate guarantees a session before this renders, so `role` is set.
  if (!role) return null;

  switch (role) {
    case 'cpo':
      return <CpoOverview />;
    case 'hod':
      return <HodOverview />;
    case 'faculty':
      return <FacultyOverview />;
    case 'student':
      return <StudentOverview />;
  }
}
