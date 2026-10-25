'use client';

import { useMemo } from 'react';
import { nameLookup } from '@/lib/structureNames';
import { useDepartments, useSections } from './useInstitutionResource';

/**
 * Readable names for the department and section ids on a student row.
 *
 * departmentName falls back to the department code: that is a short human slug
 * (e.g. "civil"), so it still reads fine while the list loads or if the
 * department is missing. sectionName falls back to NULL, never the id: a section
 * id is a 32-character generated string that means nothing to a reader, so the
 * caller shows a dash instead.
 *
 * Staff roles only. A student cannot list departments or sections; the student's
 * own profile carries department_name / section_name from the server instead.
 */
export function useStructureNames() {
  const departments = useDepartments();
  const sections = useSections();
  const departmentData = departments.data;
  const sectionData = sections.data;

  return useMemo(() => {
    const lookupDepartment = nameLookup(departmentData);
    const lookupSection = nameLookup(sectionData);
    return {
      departmentName: (id: string | null | undefined): string | null =>
        lookupDepartment(id) ?? id ?? null,
      sectionName: (id: string | null | undefined): string | null => lookupSection(id),
    };
  }, [departmentData, sectionData]);
}
