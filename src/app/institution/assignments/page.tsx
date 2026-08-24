'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { assignStudentsToFaculty, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import {
  useDepartments,
  useMembers,
  useStudentsPaged,
} from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice, FormError } from '../_components/ErrorNotice';
import { SelectField, fieldErrorMap } from '../_components/FormField';
import { RoleGuard } from '../_components/RoleGuard';
import { LoadingAnnouncement, TableSkeleton } from '../_components/Skeletons';
import { StudentStatusPill } from '../_components/StatusPill';
import { Body, MicroLabel, PageHeader, SectionTitle } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { CARD, FOCUS_RING } from '../_components/tokens';

/**
 * Assign students to a faculty member.
 *
 * This is what decides whose roster a faculty member sees and whose progress
 * they may write, so the screen is explicit about the consequence rather than
 * being a bare multi-select.
 *
 * The faculty member is PICKED, not typed. This screen used to ask for an
 * internal account id that no page anywhere displays, which nobody enters
 * correctly -- and a typo silently hands a cohort to the wrong person or to
 * nobody at all. The list comes from GET /members?role=faculty, already scoped
 * to the caller, so an HOD is offered only their own department's staff.
 *
 * The roster is a checkbox table rather than a tag input: a placement officer
 * assigns a whole section at once, and checkboxes support "select all shown"
 * after a search, which is the actual motion.
 *
 * The search and paging are SERVER-side. They used to be neither: the page
 * loaded one default page of the roster and filtered that in the browser, so
 * at a college of a thousand students the box searched the first fifty and
 * answered "no students match" for the other nine hundred and fifty. A silent
 * wrong answer is worse than an error, and it looks exactly like a student who
 * has not been added yet.
 *
 * Ticks survive paging and searching, because they are held as a set of ids
 * rather than derived from the rows on screen. Assigning a section, then
 * searching for two more students, then submitting is one motion and must not
 * quietly drop the section.
 */
const PAGE_SIZE = 100;
function FacultyAssignments() {
  const { readOnlyReason, canWrite } = useInstitution();
  const faculty = useMembers('faculty');
  const departments = useDepartments();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  // Debounced so a five-letter name is one request, not five.
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);        // a new search starts at the beginning, not page 7
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const students = useStudentsPaged({
    q: search || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const [facultyMembershipId, setFacultyMembershipId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const rows = students.data?.items;
  const total = students.data?.total ?? 0;
  const shownFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const shownTo = Math.min(page * PAGE_SIZE + (rows?.length ?? 0), total);
  const hasPrev = page > 0;
  const hasNext = shownTo < total;
  const departmentName = (id: string | null) =>
    departments.data?.find((d) => d.id === id)?.name ?? id ?? '';

  // Sorted by the thing a human reads, so the list does not reorder itself
  // between visits the way an id-ordered one does.
  const facultyOptions = useMemo(
    () =>
      (faculty.data ?? [])
        .map((m) => ({
          value: m.membership_id,
          // The account id is ALWAYS shown, never replaced by the name.
          //
          // display_name is typed by whoever onboarded this person and is
          // never verified against the account behind it, so on its own it is
          // a label anyone able to add staff can choose. Someone could add
          // their own account as "Prof Meera Iyer" and collect another
          // officer's students. The name makes the list readable; the id is
          // what actually identifies the row, so both are on screen.
          label: [
            m.display_name?.trim(),
            m.department_id ? departmentName(m.department_id) : null,
            m.account_id,
          ]
            .filter(Boolean)
            .join(' · '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faculty.data, departments.data],
  );
  const writable = canWrite('assign_faculty');
  const fieldErrors = fieldErrorMap(error);

  // The server already applied the search. Filtering again here is what made
  // the box lie about the students it had not loaded.
  const visible = rows ?? [];

  // Ticks on other pages are still going to be submitted, so say so. Without
  // this the count on the button looks wrong to anyone who has paged away
  // from where they made the selection.
  const offPageSelected = selected.size - visible.filter((s) => selected.has(s.id)).length;

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((s) => next.delete(s.id));
      else visible.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    if (!facultyMembershipId) {
      setError(
        new InstitutionApiError({
          reason: 'INVALID_REQUEST',
          message: 'Choose a faculty member.',
          fieldErrors: [
            { field: 'faculty_membership_id', message: 'Choose a faculty member.' },
          ],
        }),
      );
      return;
    }
    if (selected.size === 0) {
      setError(
        new InstitutionApiError({
          reason: 'INVALID_REQUEST',
          message: 'Pick at least one student to assign.',
        }),
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      const count = selected.size;
      await assignStudentsToFaculty({
        faculty_membership_id: facultyMembershipId,
        student_ids: Array.from(selected),
      });
      setDone(`${count} ${count === 1 ? 'student' : 'students'} assigned.`);
      setSelected(new Set());
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const saveButton = (
    <Button type="submit" variant="default" size="md" disabled={submitting || !writable}>
      {submitting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Assigning
        </>
      ) : selected.size > 0 ? (
        `Assign ${selected.size} ${selected.size === 1 ? 'student' : 'students'}`
      ) : (
        'Assign students'
      )}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Faculty assignments"
        description="Decide which students a faculty member monitors. They see only these students, and record progress only for them."
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch} className="mb-4" />
      ) : null}

      {faculty.error ? (
        <ErrorNotice error={faculty.error} onRetry={faculty.refetch} className="mb-4" />
      ) : null}

      {students.isLoading && !rows ? (
        <>
          <TableSkeleton rows={6} columns={4} />
          <LoadingAnnouncement label="Loading students" />
        </>
      ) : rows && rows.length === 0 && !search ? (
        <EmptyState
          icon={Users}
          title="No students to assign yet"
          body="Add students to your college first. Once they are on the roster you can hand them to a faculty member here."
        />
      ) : rows ? (
        <form onSubmit={submit}>
          <div className={`${CARD} mb-4 max-w-[520px] p-4`}>
            <MicroLabel as="legend" className="mb-1 block">
              Faculty member
            </MicroLabel>
            <Body className="mb-3">
              Assignments are added to whatever this faculty member already has.
            </Body>
            <FormError error={error} />
            <SelectField
              label="Faculty member"
              required
              value={facultyMembershipId}
              disabled={!writable || faculty.isLoading || facultyOptions.length === 0}
              error={fieldErrors.faculty_membership_id}
              options={facultyOptions}
              placeholder={
                faculty.isLoading
                  ? 'Loading staff…'
                  : facultyOptions.length === 0
                    ? 'No faculty members yet'
                    : 'Choose a faculty member'
              }
              hint={
                facultyOptions.length === 0 && !faculty.isLoading
                  ? 'A head of department adds faculty before students can be assigned to them.'
                  : 'Names are entered by your college and are not verified. Check the account id.'
              }
              onChange={(e) => setFacultyMembershipId(e.target.value)}
            />
          </div>

          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <SectionTitle>Students</SectionTitle>
              <span className="text-[12px] leading-4 tabular-nums text-[#64748b]">
                {students.isLoading
                  ? 'Searching…'
                  : total === 0
                    ? 'No matches'
                    : `${shownFrom}–${shownTo} of ${total}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or admission number"
                aria-label="Search students"
                className={cn(
                  'w-[260px] rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-[13px] leading-5',
                  'placeholder:text-[#94a3b8]',
                  FOCUS_RING,
                )}
              />
              <Button type="button" variant="outline" size="sm" onClick={toggleAllVisible}>
                {allVisibleSelected ? 'Clear page' : 'Select page'}
              </Button>
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">Students available to assign</caption>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="w-10 border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
                    <span className="sr-only">Selected</span>
                  </th>
                  {['Student', 'Admission no.', 'Section', 'Status'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#64748b]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const checked = selected.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        'border-b border-[#f1f5f9] last:border-b-0',
                        'transition-colors duration-150 motion-reduce:transition-none',
                        checked ? 'bg-[#eef4ff]' : 'hover:bg-[#f8fafc]',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!writable}
                          onChange={() => toggle(s.id)}
                          aria-label={`Assign ${s.full_name}`}
                          className={cn('h-4 w-4 accent-[#2557a7]', FOCUS_RING)}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-[#0f172a]">
                        {s.full_name}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] tabular-nums text-[#334155]">
                        {s.admission_number ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#334155]">
                        {s.section_id ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <StudentStatusPill status={s.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE ? (
            <nav
              className="mt-2.5 flex items-center justify-between gap-3"
              aria-label="Student roster pages"
            >
              <span className="text-[12px] leading-4 text-[#64748b]">
                Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              <span className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev || students.isLoading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || students.isLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </span>
            </nav>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {readOnlyReason ? (
              <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                {saveButton}
              </WriteGuard>
            ) : (
              saveButton
            )}
            {offPageSelected > 0 ? (
              <span className="text-[12px] leading-4 text-[#64748b]">
                {offPageSelected} selected on other pages
              </span>
            ) : null}
            <p role="status" aria-live="polite" className="min-h-[1rem]">
              {done ? <span className="text-[12px] font-medium text-green-700">{done}</span> : null}
            </p>
          </div>
        </form>
      ) : null}
    </>
  );
}

export default function FacultyAssignmentsPage() {
  return (
    <RoleGuard capability="assign_faculty">
      <FacultyAssignments />
    </RoleGuard>
  );
}
