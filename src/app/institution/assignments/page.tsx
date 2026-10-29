'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  assignStudentsToFaculty,
  InstitutionApiError,
  listFacultyAssignments,
  moveStudentsBetweenFaculty,
  removeStudentsFromFaculty,
} from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import {
  useActiveInstitutionId,
  useDepartments,
  useMembers,
  useSections,
  useStudentsPaged,
} from '@/hooks/useInstitutionResource';
import { useStructureNames } from '@/hooks/useStructureNames';
import {
  assignmentOutcomeMessage,
  facultyOptionLabel,
  ROSTER_WARNING_SIZE,
} from '@/lib/facultyAssignment';
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

  const [facultyMembershipId, setFacultyMembershipId] = useState('');
  // One class group at a time: a branch of 60-100+ students is split by
  // section, and ticking a whole section by hand is the job this replaces.
  const [sectionFilter, setSectionFilter] = useState('');
  // Who is ALREADY on the chosen faculty member's roster, as ids from the
  // server, so the table can say it and Remove/Move act on real rows.
  const [roster, setRoster] = useState<Set<string> | null>(null);
  const [rosterError, setRosterError] = useState<InstitutionApiError | null>(null);
  const [moveTo, setMoveTo] = useState('');
  // THE ROSTER BELONGS TO ONE VISIT OF ONE COLLEGE. Switching college in the
  // shell does not remount this page, and college A's membership ids and
  // student ids mean nothing in college B. Every await below checks the visit
  // before writing. A counter, not the college id: A -> B -> A is a new
  // visit, and an answer from the first one must not land in the third.
  const institutionId = useActiveInstitutionId();
  const [rosterCollege, setRosterCollege] = useState(institutionId);
  const [collegeVisit, setCollegeVisit] = useState(0);
  const visitRef = useRef(collegeVisit);
  visitRef.current = collegeVisit;
  // What is on screen NOW, for a write that settles after a college switch.
  const collegeRef = useRef(institutionId);
  collegeRef.current = institutionId;
  const facultyRef = useRef(facultyMembershipId);
  facultyRef.current = facultyMembershipId;
  // A faculty member teaches in ONE department and the server refuses the whole
  // request if any ticked student is in another. So the table is limited to the
  // chosen faculty member's department: the mistake cannot be made, rather than
  // reported after nothing was assigned.
  const facultyDepartmentId =
    (faculty.data ?? []).find((m) => m.membership_id === facultyMembershipId)?.department_id ??
    undefined;
  const sections = useSections(facultyDepartmentId, Boolean(facultyDepartmentId));
  const students = useStudentsPaged({
    q: search || undefined,
    department_id: facultyDepartmentId,
    section_id: sectionFilter || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  // ONLY THE LATEST REQUEST MAY WRITE THE ROSTER. Switching from one faculty
  // member to another quickly would otherwise let the first answer arrive
  // last and label the second faculty member's table with the first one's
  // roster -- and Remove/Move would then act on that wrong list.
  const rosterRequest = useRef(0);
  const loadRoster = async (membershipId: string) => {
    const ticket = ++rosterRequest.current;
    const visit = visitRef.current;
    setRosterError(null);
    setRoster(null);
    if (!membershipId) return;
    try {
      const out = await listFacultyAssignments(membershipId);
      if (ticket !== rosterRequest.current || visit !== visitRef.current) return;
      setRoster(new Set(out.student_ids));
    } catch (err) {
      if (ticket !== rosterRequest.current || visit !== visitRef.current) return;
      setRosterError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    }
  };
  useEffect(() => {
    void loadRoster(facultyMembershipId);
  }, [facultyMembershipId]);
  // A write from an EARLIER visit still changed the server. Its message and
  // ticks are dropped, but if it was in this same college (A -> B -> A) the
  // roster on screen now may predate it, so read that roster again.
  const afterStaleWrite = (college: string | null) => {
    if (college === collegeRef.current && facultyRef.current) {
      void loadRoster(facultyRef.current);
    }
  };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // A college switch starts this screen afresh: the faculty member, section,
  // roster and ticks were all college A's. Cleared DURING RENDER, the way
  // useInstitutionResource clears its data, so no frame shows A's roster
  // count or Yes/No column under B's name.
  if (rosterCollege !== institutionId) {
    setRosterCollege(institutionId);
    setCollegeVisit((v) => v + 1);
    setFacultyMembershipId('');
    setSectionFilter('');
    setMoveTo('');
    setRoster(null);
    setRosterError(null);
    setSelected(new Set());
    setPage(0);
    setError(null);
    setDone(null);
    // An action still in flight belongs to the previous visit; its answer is
    // dropped below, and its `finally` no longer touches this flag, so it
    // can neither keep these controls disabled nor unlock a newer action.
    setSubmitting(false);
  }

  const rows = students.data?.items;
  // The rows on screen belong to the PREVIOUS page, search or section while
  // the next answer loads, and after it fails: they cannot be ticked then.
  const rowsStale = students.isLoading || Boolean(students.error);
  const total = students.data?.total ?? 0;
  const shownFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const shownTo = Math.min(page * PAGE_SIZE + (rows?.length ?? 0), total);
  const hasPrev = page > 0;
  const hasNext = shownTo < total;
  const departmentName = (id: string | null) =>
    departments.data?.find((d) => d.id === id)?.name ?? id ?? '';
  const { sectionName } = useStructureNames();

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
          label: facultyOptionLabel(
            m,
            m.department_id ? departmentName(m.department_id) : null,
          ),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faculty.data, departments.data],
  );
  // Switching to a faculty member in ANOTHER department drops the ticks and goes
  // back to page one: ticked students from the old department would make the
  // server refuse the whole request, and the table no longer shows them.
  const changeFaculty = (membershipId: string) => {
    const nextDepartment = (faculty.data ?? []).find(
      (m) => m.membership_id === membershipId,
    )?.department_id;
    if (nextDepartment !== facultyDepartmentId) {
      setSelected(new Set());
    }
    // Any change of faculty starts the table afresh: a section chosen for the
    // previous faculty member is not a choice about this one.
    setPage(0);
    setSectionFilter('');
    setMoveTo('');
    setDone(null);
    setFacultyMembershipId(membershipId);
  };
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

  // Move targets: other faculty in the SAME department (assignments are per
  // department; the server refuses anything else).
  const moveOptions = facultyOptions.filter((o) => {
    if (o.value === facultyMembershipId) return false;
    const m = (faculty.data ?? []).find((x) => x.membership_id === o.value);
    return m?.department_id === facultyDepartmentId;
  });
  const selectedOnRoster = roster ? Array.from(selected).filter((id) => roster.has(id)) : [];
  const rosterCount = roster?.size ?? 0;
  const newlyAdded = roster ? Array.from(selected).filter((id) => !roster.has(id)).length : 0;
  const overWarning = roster !== null && rosterCount + newlyAdded > ROSTER_WARNING_SIZE;

  const runRosterAction = async (kind: 'remove' | 'move') => {
    if (!writable || submitting || selectedOnRoster.length === 0) return;
    if (kind === 'move' && !moveTo) return;
    const visit = visitRef.current;
    const college = collegeRef.current;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      if (kind === 'remove') {
        const out = await removeStudentsFromFaculty({
          faculty_membership_id: facultyMembershipId,
          student_ids: selectedOnRoster,
        });
        if (visit !== visitRef.current) return afterStaleWrite(college);
        setDone(`${out.removed} ${out.removed === 1 ? 'student' : 'students'} removed from this faculty member.`);
      } else {
        const out = await moveStudentsBetweenFaculty({
          from_membership_id: facultyMembershipId,
          to_membership_id: moveTo,
          student_ids: selectedOnRoster,
        });
        if (visit !== visitRef.current) return afterStaleWrite(college);
        setDone(`${out.removed} ${out.removed === 1 ? 'student' : 'students'} moved.`);
      }
      setSelected(new Set());
      await loadRoster(facultyMembershipId);
    } catch (err) {
      if (visit !== visitRef.current) return afterStaleWrite(college);
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
      // A FAILED action can still have changed the roster: Move assigns before
      // it removes, and Remove stops part-way when a row cannot be removed
      // (careerbot-api #508). Show what is on the roster now, not before.
      await loadRoster(facultyMembershipId);
    } finally {
      if (visit === visitRef.current) setSubmitting(false);
    }
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

    const visit = visitRef.current;
    const college = collegeRef.current;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      const requested = selected.size;
      const created = await assignStudentsToFaculty({
        faculty_membership_id: facultyMembershipId,
        student_ids: Array.from(selected),
      });
      if (visit !== visitRef.current) return afterStaleWrite(college);
      // From the RESPONSE, not from the number of ticked rows: students already on
      // this roster are skipped by the server and are not in the list it returns.
      // The endpoint returns the rows it CREATED (an array); no fallback to `requested`, which
      // would report every tick as newly assigned if the shape ever changed.
      setDone(assignmentOutcomeMessage(requested, created.length));
      setSelected(new Set());
      await loadRoster(facultyMembershipId);
    } catch (err) {
      if (visit !== visitRef.current) return afterStaleWrite(college);
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
      // Same as Remove/Move: the roster count must not stay at its old value.
      await loadRoster(facultyMembershipId);
    } finally {
      if (visit === visitRef.current) setSubmitting(false);
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
      ) : rows && rows.length === 0 && !search && !sectionFilter && !facultyMembershipId ? (
        // Only for a college with no students at all. With a faculty member or
        // a section chosen, an empty table keeps the form, so those choices
        // can still be changed (it used to replace the whole form).
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
              disabled={!writable || submitting || faculty.isLoading || facultyOptions.length === 0}
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
              onChange={(e) => changeFaculty(e.target.value)}
            />
            {facultyMembershipId ? (
              <div className="mt-3" aria-live="polite">
                {rosterError ? (
                  <ErrorNotice error={rosterError} onRetry={() => void loadRoster(facultyMembershipId)} />
                ) : roster ? (
                  <p className="text-[13px] text-[#334155]">
                    {rosterCount} {rosterCount === 1 ? 'student' : 'students'} on this roster
                    {newlyAdded > 0 ? `, ${newlyAdded} more ticked to add` : ''}.
                  </p>
                ) : null}
                {overWarning ? (
                  <p className="mt-1 rounded-lg bg-[#fffbeb] px-3 py-2 text-[12px] text-[#92400e]">
                    More than {ROSTER_WARNING_SIZE} students for one faculty member makes close
                    monitoring hard. Consider sharing this section with another faculty member.
                  </p>
                ) : null}
              </div>
            ) : null}
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
            <div className="flex flex-wrap items-center gap-2">
              {facultyDepartmentId ? (
                <select
                  value={sectionFilter}
                  onChange={(e) => {
                    setSectionFilter(e.target.value);
                    setPage(0);
                  }}
                  aria-label="Filter by section"
                  className={cn(
                    'rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[13px] leading-5',
                    FOCUS_RING,
                  )}
                >
                  <option value="">All sections</option>
                  {/* While a department's sections load, and after a failed
                      load, the list may still be the PREVIOUS department's,
                      so offer none (and a retry after a failure). */}
                  {(sections.error || sections.isLoading ? [] : sections.data ?? []).map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {facultyDepartmentId && sections.error ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void sections.refetch()}
                >
                  Retry sections
                </Button>
              ) : null}
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
              {/* Disabled while the next page, search or section loads (or
                  failed): the rows on screen are still the previous ones. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={rowsStale}
                onClick={toggleAllVisible}
              >
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
                  {['Student', 'Admission no.', 'Section', 'On this roster', 'Status'].map((h) => (
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
                          disabled={!writable || rowsStale}
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
                        {sectionName(s.section_id) ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#334155]">
                        {roster === null ? '—' : roster.has(s.id) ? 'Yes' : 'No'}
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
            {roster && selectedOnRoster.length > 0 ? (
              <WriteGuard
                active={Boolean(readOnlyReason)}
                hint={readOnlyReason ? READ_ONLY_CONTROL_HINT[readOnlyReason] : ''}
              >
                <span className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={submitting || !writable}
                  onClick={() => void runRosterAction('remove')}
                >
                  Remove {selectedOnRoster.length} from this faculty member
                </Button>
                {moveOptions.length > 0 ? (
                  <span className="flex items-center gap-2">
                    <select
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      aria-label="Move to faculty member"
                      disabled={submitting || !writable}
                      className={cn(
                        'rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[13px] leading-5',
                        FOCUS_RING,
                      )}
                    >
                      <option value="">Move to…</option>
                      {moveOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={submitting || !writable || !moveTo}
                      onClick={() => void runRosterAction('move')}
                    >
                      Move {selectedOnRoster.length}
                    </Button>
                  </span>
                ) : null}
                </span>
              </WriteGuard>
            ) : null}
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
