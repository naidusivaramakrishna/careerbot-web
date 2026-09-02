'use client';

import React from 'react';
import type { CohortComparison } from '@/types/institution';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK, TABULAR } from './tokens';

/**
 * How each department is doing. NUMBERS ABOUT GROUPS, never a student.
 *
 * That is what makes this readable by everybody -- a student, a faculty
 * member looking at a department they could never list, an HOD comparing
 * theirs with the rest. There is no row here that belongs to a person, so
 * there is nothing to withhold from anyone.
 *
 * THE MEDIAN IS SHOWN BESIDE THE AVERAGE, not instead of it. One exceptional
 * student lifts a mean and tells an HOD their department is fine when most of
 * it is not; the two side by side is where that shows.
 *
 * A SMALL DEPARTMENT SHOWS A COUNT AND NOTHING ELSE, and the row says why
 * rather than rendering blanks. In a group of three, an average plus a known
 * roster is close to the three scores.
 */
export function ComparisonCard({
  comparison,
  highlight,
}: {
  comparison: CohortComparison;
  /** The reader's own department, so they can find it without hunting. */
  highlight?: string | null;
}) {
  const groups = comparison.groups ?? [];

  if (groups.length === 0) {
    return (
      <section className={`${CARD} p-5`} aria-labelledby="comparison-heading">
        <SectionTitle id="comparison-heading">Departments</SectionTitle>
        <Caption>No departments with scores yet.</Caption>
      </section>
    );
  }

  return (
    <section className={`${CARD} p-5`} aria-labelledby="comparison-heading">
      <SectionTitle id="comparison-heading">Departments</SectionTitle>
      <Caption>Averages only. No individual student appears here.</Caption>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide"
                style={{ color: INK.muted }}>
              <th className="pb-2 pr-4 font-medium">Department</th>
              <th className="pb-2 pr-4 font-medium">Scored</th>
              <th className="pb-2 pr-4 font-medium">Average</th>
              <th className="pb-2 font-medium">Median</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {groups.map((g) => {
              const mine = highlight && g.group === highlight;
              return (
                <tr key={g.group}
                    style={mine ? { background: '#eef4ff' } : undefined}>
                  <td className="py-2 pr-4" style={{ color: INK.body }}>
                    {g.group}
                    {mine ? (
                      <span className="ml-2 text-xs" style={{ color: INK.muted }}>
                        yours
                      </span>
                    ) : null}
                  </td>
                  <td className={`py-2 pr-4 ${TABULAR}`} style={{ color: INK.body }}>
                    {g.scored}
                  </td>
                  {g.available ? (
                    <>
                      <td className={`py-2 pr-4 font-medium ${TABULAR}`}
                          style={{ color: INK.strong }}>
                        {g.average}
                      </td>
                      <td className={`py-2 ${TABULAR}`} style={{ color: INK.body }}>
                        {g.median}
                      </td>
                    </>
                  ) : (
                    /* WHY, not two empty cells. A blank reads as missing data
                       and sends somebody looking for a bug. */
                    <td colSpan={2} className="py-2 text-xs"
                        style={{ color: INK.faint }}>
                      too few scores to show an average
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
