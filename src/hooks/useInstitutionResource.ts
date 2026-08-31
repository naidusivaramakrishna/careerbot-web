'use client';

/**
 * Data-fetching hooks for the institution area.
 *
 * Same shape as the repo's other hooks (`useCoverLetterList`, `useCreditsBalance`):
 * `{ data, isLoading, error, refetch }`, a sequence guard so a stale response
 * cannot overwrite a newer one, and no external state library.
 *
 * `isLoading` is only true while a fetch is IN FLIGHT. Screens distinguish
 * "still loading" from "loaded and empty" with `data === null` vs `[]`, so an
 * empty result renders its designed empty state instead of a permanent skeleton.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { InstitutionApiError } from '@/api/institutionApi';
import {
  getActiveInstitutionId,
  getActiveInstitutionIdServer,
  subscribeToInstitutionSession,
} from '@/lib/institutionSession';
import {
  listBatches,
  listDepartments,
  listSections,
  getCohortComparison,
  getLeaderboard,
  getMyStanding,
  getRosterReport,
  getMyPeople,
  listMyTasks,
  listStudentTasks,
  getStudentReadiness,
  listStudentProgress,
  listStudents,
  getMyStudentProfile,
  getInstitutionContext,
  listMembers,
} from '@/api/institutionApi';
import type {
  Batch,
  Department,
  InstitutionContext,
  ListStudentsParams,
  MemberRecord,
  Paged,
  ProgressRecord,
  Readiness,
  Standing,
  Leaderboard,
  CohortComparison,
  RosterReport,
  MyPeople,
  StudentTask,
  Section,
  Student,
} from '@/types/institution';

export interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: InstitutionApiError | null;
  refetch: () => Promise<void>;
}

function toApiError(err: unknown): InstitutionApiError {
  return err instanceof InstitutionApiError
    ? err
    : new InstitutionApiError({
        reason: 'UNKNOWN',
        message: err instanceof Error ? err.message : undefined,
      });
}

/**
 * @param fetcher  must be stable (wrap in useCallback at the call site)
 * @param enabled  false keeps the hook idle — used when a prerequisite (an
 *                 institution session, a selected student) is not there yet
 */
export function useActiveInstitutionId(): string | null {
  return useSyncExternalStore(
    subscribeToInstitutionSession,
    getActiveInstitutionId,
    getActiveInstitutionIdServer,
  );
}

export function useInstitutionResource<T>(
  fetcher: () => Promise<T>,
  enabled: boolean = true,
): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const seqRef = useRef(0);

  // EVERY institution resource is keyed by the active college.
  //
  // Without this, switching colleges refetched nothing: `run` is memoised on
  // [fetcher, enabled], the fetchers are `useCallback(..., [])`, and selecting
  // a different membership changes neither. The screen kept college A's rows
  // under college B's name. The server was never fooled -- the next request
  // carried the new token and was scoped correctly -- but a screenshot of that
  // screen is a cross-tenant leak as far as a customer is concerned.
  const institutionId = useActiveInstitutionId();

  // Cleared DURING RENDER, not in an effect. The rule is "never render
  // out-of-scope data, even briefly while loading", and an effect runs after
  // the browser has already painted one frame of the old college's rows under
  // the new college's name. Adjusting state during render makes React discard
  // this render and start again with `data` already null, so that frame never
  // reaches the screen.
  const [renderedFor, setRenderedFor] = useState(institutionId);
  if (institutionId !== renderedFor) {
    setRenderedFor(institutionId);
    setData(null);
    setError(null);
    setIsLoading(enabled);
    // Any response already in flight belongs to the previous college.
    seqRef.current += 1;
  }

  const run = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    const mySeq = ++seqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mySeq !== seqRef.current) return; // superseded
      setData(result);
    } catch (err) {
      if (mySeq !== seqRef.current) return;
      setError(toApiError(err));
    } finally {
      if (mySeq === seqRef.current) setIsLoading(false);
    }
    // institutionId is not read in the body -- the token is attached by the
    // api client -- but it MUST stay in the dependency list: it is what makes
    // a college switch re-run the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, enabled, institutionId]);

  useEffect(() => {
    void run();
    return () => {
      // Invalidate any in-flight result so it cannot setState after unmount.
      seqRef.current += 1;
    };
  }, [run]);

  return { data, isLoading, error, refetch: run };
}

export function useDepartments(enabled = true): ResourceState<Department[]> {
  return useInstitutionResource(useCallback(() => listDepartments(), []), enabled);
}

export function useBatches(enabled = true): ResourceState<Batch[]> {
  return useInstitutionResource(useCallback(() => listBatches(), []), enabled);
}

export function useSections(departmentId?: string, enabled = true): ResourceState<Section[]> {
  return useInstitutionResource(
    useCallback(() => listSections(departmentId ? { department_id: departmentId } : {}), [departmentId]),
    enabled,
  );
}


/** Server-side search and paging.
 *
 *  Filtering the whole roster in the browser is fine at 400 students and
 *  unusable at a deemed university with 30,000 -- and it ships every student's
 *  record to the browser to answer a question about one person. */
export function useStudentsPaged(
  params: ListStudentsParams = {},
  enabled = true,
): ResourceState<Paged<Student>> {
  const { skip, limit, q, status, department_id, batch_year, without_section } =
    params;
  return useInstitutionResource(
    useCallback(
      () =>
        listStudents({
          skip, limit, q, status, department_id, batch_year, without_section,
        }),
      [skip, limit, q, status, department_id, batch_year, without_section],
    ),
    enabled,
  );
}

/** The caller's OWN student record, rather than "the first row of the roster
 *  and trust the server scoped it to one". */
export function useMyStudentProfile(enabled = true): ResourceState<Student | null> {
  return useInstitutionResource(
    useCallback(() => getMyStudentProfile(), []), enabled);
}

/** Whether this college is currently writable, and which features are on --
 *  knowable BEFORE the user loses work to a refused write. */
export function useInstitutionContext(enabled = true): ResourceState<InstitutionContext> {
  return useInstitutionResource(
    useCallback(() => getInstitutionContext(), []), enabled);
}

/** College staff, so a human can PICK a faculty member instead of typing an
 *  internal account id that no screen displays. */
export function useMembers(
  role?: 'cpo' | 'hod' | 'faculty' | 'student',
  enabled = true,
): ResourceState<MemberRecord[]> {
  return useInstitutionResource(useCallback(() => listMembers(role), [role]), enabled);
}

/** A student's readiness score with the working behind it.
 *
 *  Same permission as their progress -- the number is a sum of rows the caller
 *  can already read. */
export function useStudentReadiness(
  studentId: string | null | undefined,
  enabled = true,
): ResourceState<Readiness> {
  return useInstitutionResource(
    useCallback(() => getStudentReadiness(studentId as string), [studentId]),
    enabled && Boolean(studentId),
  );
}

/** Where the caller comes in their own year group. */
export function useMyStanding(enabled = true): ResourceState<Standing> {
  return useInstitutionResource(useCallback(() => getMyStanding(), []), enabled);
}

/** The top of the caller's cohort. */
export function useLeaderboard(limit = 10, enabled = true): ResourceState<Leaderboard> {
  return useInstitutionResource(
    useCallback(() => getLeaderboard(limit), [limit]), enabled);
}

/** Department-by-department averages. Aggregates only, never a student. */
export function useCohortComparison(enabled = true): ResourceState<CohortComparison> {
  return useInstitutionResource(
    useCallback(() => getCohortComparison(), []), enabled);
}

/** Every visible student with their readiness, for the officer's report. */
export function useRosterReport(enabled = true): ResourceState<RosterReport> {
  return useInstitutionResource(
    useCallback(() => getRosterReport(), []), enabled);
}

/** The caller's faculty, HOD and placement officers. */
export function useMyPeople(enabled = true): ResourceState<MyPeople> {
  return useInstitutionResource(useCallback(() => getMyPeople(), []), enabled);
}

/** The caller's own tasks. */
export function useMyTasks(enabled = true): ResourceState<StudentTask[]> {
  return useInstitutionResource(useCallback(() => listMyTasks(), []), enabled);
}

/** One student's tasks, for staff. */
export function useStudentTasks(
  studentId: string | null | undefined, enabled = true,
): ResourceState<StudentTask[]> {
  return useInstitutionResource(
    useCallback(() => listStudentTasks(studentId as string), [studentId]),
    enabled && Boolean(studentId),
  );
}

export function useStudentProgress(
  studentId: string | null | undefined,
  enabled = true,
): ResourceState<ProgressRecord[]> {
  return useInstitutionResource(
    useCallback(() => listStudentProgress(studentId as string), [studentId]),
    enabled && Boolean(studentId),
  );
}
