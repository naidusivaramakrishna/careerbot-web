'use client';

import React from 'react';
import { useInstitution } from '@/contexts/InstitutionContext';
import { AdminOverview } from './_components/AdminOverview';
import { FacultyOverview } from './_components/FacultyOverview';
import { StudentOverview } from './_components/StudentOverview';

/**
 * The college landing screen, dispatched on role.
 *
 * The four roles do not get the same page with things hidden — they get four
 * genuinely different screens, because they are four different jobs. A CPO gets
 * a control panel, an HOD the same at department scale, a faculty member a
 * short worklist, and a student a personal record.
 */
export default function InstitutionOverviewPage() {
  const { role } = useInstitution();

  // The gate guarantees a session before this renders, so `role` is set.
  if (!role) return null;

  switch (role) {
    case 'cpo':
      return <AdminOverview scope="cpo" />;
    case 'hod':
      return <AdminOverview scope="hod" />;
    case 'faculty':
      return <FacultyOverview />;
    case 'student':
      return <StudentOverview />;
  }
}
