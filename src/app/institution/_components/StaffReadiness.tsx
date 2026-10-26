'use client';

import React, { useMemo } from 'react';
import { useRosterReport } from '@/hooks/useInstitutionResource';
import { activityLabel } from '@/lib/institutionMessages';
import type { CohortComparisonGroup, Readiness, RosterReportRow } from '@/types/institution';
import { INK, TABULAR } from './tokens';

/**
 * Readiness and last activity for staff screens (CPO, HOD, faculty).
 *
 * ONE REQUEST FOR THE WHOLE LIST. Every screen here joins its rows against
 * GET /reports/roster, which returns every student the caller may read with
 * their readiness and last activity -- never a request per row. The report is
 * scoped exactly like the roster (an HOD gets their department, a faculty
 * member their assigned students), so joining it adds no student the screen
 * could not already show.
 *
 * The score is the owner-approved 25/25/20/20/10 placement readiness
 * (2026-10-26), computed by the server; nothing here recomputes it.
 */
export function useRosterIndex(enabled = true) {
  const report = useRosterReport(enabled);
  const index = useMemo(() => {
    const map = new Map<string, RosterReportRow>();
    (report.data?.items ?? []).forEach((row) => map.set(row.student_id, row));
    return map;
  }, [report.data]);
  return { report, index };
}

/**
 * A student's readiness in a table cell.
 *
 * "Not scored yet" rather than 0 when nothing has a score: the number really
 * is 0 by definition, but a column of zeros reads as a column of failures,
 * and the student who has done nothing yet is a different case from one who
 * scored badly.
 */
export function ReadinessCell({
  row,
  loading,
}: {
  row: RosterReportRow | undefined;
  loading?: boolean;
}) {
  if (!row) {
    return (
      <span className="text-[#94a3b8]" aria-label={loading ? 'Loading' : 'Not available'}>
        —
      </span>
    );
  }
  if (row.activities_scored === 0) {
    return <span className="text-[12px] text-[#94a3b8]">Not scored yet</span>;
  }
  return (
    <span className={TABULAR}>
      <span className="font-medium" style={{ color: INK.strong }}>{row.readiness}</span>
      <span className="ml-1 text-[11px]" style={{ color: INK.faint }}>
        {row.activities_scored}/{row.activities_total}
      </span>
    </span>
  );
}

/** A date a person can read, or null when the value is not a real date. */
export function formatActivityDate(at: string | null | undefined): string | null {
  if (!at) return null;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * When progress was last RECORDED for a student -- engine results and faculty
 * entries alike. Not a login time, and the column header says "Last activity"
 * rather than "Last seen" for that reason.
 */
export function LastActivityCell({
  row,
  loading,
}: {
  row: RosterReportRow | undefined;
  loading?: boolean;
}) {
  // `undefined` is a server that does not send the field yet -- unknown, not
  // "nothing recorded", so it gets the same dash as a missing row.
  if (!row || row.last_activity_at === undefined) {
    return (
      <span className="text-[#94a3b8]" aria-label={loading ? 'Loading' : 'Not available'}>
        —
      </span>
    );
  }
  const shown = formatActivityDate(row.last_activity_at);
  if (!shown) {
    return <span className="text-[12px] text-[#94a3b8]">Nothing yet</span>;
  }
  return (
    <time dateTime={row.last_activity_at ?? undefined} className={`text-[13px] ${TABULAR}`}>
      {shown}
    </time>
  );
}

/**
 * Competition-style rank ("1224") of each department by average readiness,
 * over the groups that report one. Ties share a rank; withheld groups get none.
 */
export function rankDepartments(groups: CohortComparisonGroup[]): Map<string, number> {
  const ranked = groups
    .filter((g): g is Extract<CohortComparisonGroup, { available: true }> => g.available)
    .map((g) => ({ group: g.group, average: g.average }));
  const ranks = new Map<string, number>();
  ranked.forEach((g) => {
    ranks.set(g.group, 1 + ranked.filter((o) => o.average > g.average).length);
  });
  return ranks;
}

/**
 * A student's CURRENT readiness for the faculty Mark screen, staff-voiced.
 *
 * Not ReadinessCard: that one speaks to the student ("Your readiness"). This
 * one sits beside the form so a faculty member sees where the student stands
 * before and after an entry -- the parts that are still 0 are the ones a new
 * entry can move.
 */
export function CurrentReadiness({ readiness }: { readiness: Readiness }) {
  return (
    <section
      aria-labelledby="current-readiness-heading"
      className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="current-readiness-heading" className="text-[13px] font-semibold text-[#0f172a]">
          Current readiness
        </h3>
        <span className={TABULAR}>
          <span className="text-[20px] font-semibold text-[#0f172a]">{readiness.readiness}</span>
          <span className="ml-1 text-[12px] text-[#94a3b8]">/ {readiness.max}</span>
        </span>
      </div>
      <p className="mt-0.5 text-[12px] text-[#64748b]">
        {readiness.scored === 0
          ? 'Nothing scored yet.'
          : `${readiness.scored} of ${readiness.of} activities scored. The best attempt at each counts.`}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {readiness.breakdown.map((part) => (
          <li
            key={part.activity}
            className={`rounded-md border border-[#e2e8f0] px-2 py-0.5 text-[12px] ${TABULAR}`}
            style={{ color: part.scored ? INK.body : INK.faint }}
          >
            {activityLabel(part.activity)} {part.earned}/{part.weight}
          </li>
        ))}
      </ul>
    </section>
  );
}
