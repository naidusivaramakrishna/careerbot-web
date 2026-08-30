'use client';

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import {
  useInstitutionContext,
  useMyStudentProfile,
  useStudentProgress,
  useStudentReadiness,
} from '@/hooks/useInstitutionResource';
import { activityLabel } from '@/lib/institutionMessages';
import { ACTIVITY_TYPES, type ProgressRecord } from '@/types/institution';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { Caption, MicroLabel, PageHeader, SectionTitle } from './Typography';
import { CardListSkeleton, LoadingAnnouncement } from './Skeletons';
import { ProgressStatusPill, ScoreCell } from './StatusPill';
import { EnabledFeaturesCard } from './EnabledFeaturesCard';
import { ReadinessCard } from './ReadinessCard';
import { CARD } from './tokens';

/**
 * The student's own record.
 *
 * One person looking at themselves, so this is a calm column of cards rather
 * than a table: a table is a tool for comparing many rows, and there is only
 * one person here. Copy is second-person and forward-looking — a student
 * reading "0 records" feels judged; "nothing recorded yet" is just a fact with
 * a next step.
 *
 * CONTRACT NOTE: there is no `GET /students/me`. A student's `GET /students` is
 * ASKS FOR ITS OWN RECORD, not for the roster.
 *
 * This used to call the roster endpoint and take the first row, assuming the
 * server had scoped it to one. It failed outright the first time a real
 * student opened it: students are not permitted to read the roster at all, so
 * the screen showed "role student may not perform read_students" instead of
 * their progress.
 *
 * Even with permission it was wrong in a quieter way -- if that call ever
 * returned more than one row, a student would silently be shown somebody
 * else's record. /students/me answers the question this screen is actually
 * asking, and refuses rather than guessing when an account resolves to more
 * than one student.
 */
export function StudentOverview() {
  const self = useMyStudentProfile();
  const student = self.data ?? null;
  const progress = useStudentProgress(student?.id, Boolean(student));
  // "me", not student.id. A student's scope reaches only their own record, so
  // the server resolves it -- and passing the id would be a request naming a
  // subject on a route where the subject is never the caller's to choose.
  const readiness = useStudentReadiness('me', Boolean(student));
  const context = useInstitutionContext(Boolean(student));

  /**
   * Group by activity so the five activity types each get a place, including
   * the ones with nothing recorded. Showing only what exists would hide from a
   * student that a whole activity is still ahead of them.
   */
  const byActivity = useMemo(() => {
    const map = new Map<string, ProgressRecord[]>();
    (progress.data ?? []).forEach((row) => {
      const list = map.get(row.activity_type) ?? [];
      list.push(row);
      map.set(row.activity_type, list);
    });
    return map;
  }, [progress.data]);

  const total = progress.data?.length ?? 0;
  const completed = (progress.data ?? []).filter(
    (r) => r.status?.toLowerCase() === 'completed',
  ).length;

  if (self.error) {
    return (
      <>
        <PageHeader title="My progress" />
        <ErrorNotice error={self.error} onRetry={self.refetch} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={student ? `Hello, ${student.full_name.split(' ')[0]}` : 'My progress'}
        description={
          student
            ? 'Everything your college has recorded for you so far.'
            : undefined
        }
      />

      {self.isLoading && !student ? (
        <>
          <CardListSkeleton items={3} />
          <LoadingAnnouncement label="Loading your record" />
        </>
      ) : null}

      {student ? (
        <>
          <div className={`${CARD} mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 p-4`}>
            <div>
              <MicroLabel as="div">Admission number</MicroLabel>
              <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
                {student.admission_number ?? '—'}
              </p>
            </div>
            <div>
              <MicroLabel as="div">Department</MicroLabel>
              <p className="mt-1 text-[13px] font-medium text-[#0f172a]">{student.department_id}</p>
            </div>
            {/* SECTION. Locked in the wireframe alongside department, batch
                and admission number, and the only one of the four that was
                missing -- a student could see their department but not which
                class group they are in, which is the thing their timetable and
                their faculty are organised by.

                Rendered even when absent, unlike batch above: "not in a class
                group yet" is a real state a student should be able to see,
                because it is why no faculty member has them on a roster. */}
            <div>
              <MicroLabel as="div">Section</MicroLabel>
              <p className="mt-1 text-[13px] font-medium text-[#0f172a]">
                {student.section_id ?? (
                  <span className="font-normal text-[#94a3b8]">
                    Not assigned yet
                  </span>
                )}
              </p>
            </div>
            {student.batch_year ? (
              <div>
                <MicroLabel as="div">Batch</MicroLabel>
                <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
                  {student.batch_year}
                </p>
              </div>
            ) : null}
            <div>
              <MicroLabel as="div">Completed</MicroLabel>
              <p className="mt-1 text-[13px] font-medium tabular-nums text-[#0f172a]">
                {completed}
                <span className="font-normal text-[#94a3b8]">{` of ${total}`}</span>
              </p>
            </div>
          </div>

          {/* READINESS FIRST, above the per-activity detail.
              It is the one number a student is actually looking for, and the
              breakdown inside it doubles as the to-do list -- the rows with
              nothing scored are exactly what to do next. Putting the raw
              activity log first would make them assemble that themselves.

              Its own failure is NOT allowed to take down the progress list
              below: the two are separate requests, and a readiness call that
              fails is a missing summary, not a missing record. */}
          {readiness.data ? (
            <div className="mb-5">
              <ReadinessCard readiness={readiness.data} />
            </div>
          ) : null}

          {context.data ? (
            <div className="mb-5">
              <EnabledFeaturesCard context={context.data} />
            </div>
          ) : null}

          {progress.error ? (
            <ErrorNotice error={progress.error} onRetry={progress.refetch} className="mb-4" />
          ) : null}

          {progress.isLoading && !progress.data ? (
            <CardListSkeleton items={4} />
          ) : total === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nothing recorded yet"
              body="Finish a mock test, a coding test, a mock interview or an English assessment and the result appears here on its own. Your faculty can also add a record by hand."
            />
          ) : (
            <div className="space-y-2">
              {ACTIVITY_TYPES.map((activity) => {
                const records = byActivity.get(activity) ?? [];
                return (
                  <section key={activity} className={`${CARD} p-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <SectionTitle as="h3">{activityLabel(activity)}</SectionTitle>
                      {records.length === 0 ? (
                        <Caption>Not recorded yet</Caption>
                      ) : (
                        <Caption>
                          {records.length} {records.length === 1 ? 'entry' : 'entries'}
                        </Caption>
                      )}
                    </div>

                    {records.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {records.map((record, i) => (
                          <li
                            key={record.id ?? `${record.activity_type}-${i}`}
                            className="flex items-center justify-between gap-4 rounded-lg bg-[#f8fafc] px-3 py-2"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <ProgressStatusPill status={record.status} />
                              {record.activity_ref ? (
                                <span className="truncate text-[12px] text-[#64748b]">
                                  {record.activity_ref}
                                </span>
                              ) : null}
                            </span>
                            <ScoreCell score={record.score} maxScore={record.max_score} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : !self.isLoading ? (
        <EmptyState
          icon={Sparkles}
          title="Your college record is not set up yet"
          body="Your placement office creates your student record before progress can be tracked. Once they do, everything you complete shows up on this page."
        />
      ) : null}
    </>
  );
}
