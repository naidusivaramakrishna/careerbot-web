'use client';

import React from 'react';
import type { Standing } from '@/types/institution';
import { Caption, MicroLabel, SectionTitle } from './Typography';
import { CARD, INK, TABULAR } from './tokens';

/**
 * Where this student comes in their year group.
 *
 * THE UNAVAILABLE CASES ARE NOT ERRORS, and this component's main job is
 * saying so in words a student can act on. Each has a different cause and a
 * different next step, and collapsing them into "no data" leaves somebody
 * refreshing a page that will never change:
 *
 *   cohort_too_small   nothing is wrong with them or the college. There are
 *                      simply not enough scored classmates yet for a position
 *                      to mean anything -- and publishing one in a group of
 *                      three would tell them what two named people scored.
 *   no_batch_year      the college has not recorded which year they graduate,
 *                      so there is no cohort. The fix belongs to the college.
 *   not_scored_yet     they have taken nothing. The fix is theirs, and it is
 *                      the encouraging one.
 */
const ordinal = (n: number): string => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

export function StandingCard({ standing }: { standing: Standing }) {
  if (!standing.available) {
    const message =
      standing.reason === 'no_batch_year'
        ? 'Your college has not recorded which year you graduate, so there is no year group to compare you with yet. Your placement officer can add it.'
        : standing.reason === 'not_scored_yet'
          ? 'Take a mock test, a coding test or an interview and your position appears here.'
          : 'Not enough of your year group have taken anything yet. Your position appears once more of them have.';

    return (
      <section className={`${CARD} p-5`} aria-labelledby="standing-heading">
        <SectionTitle id="standing-heading">Your position</SectionTitle>
        <Caption>{message}</Caption>
      </section>
    );
  }

  return (
    <section className={`${CARD} p-5`} aria-labelledby="standing-heading">
      <SectionTitle id="standing-heading">Your position</SectionTitle>
      <Caption>Among your department and year.</Caption>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <div>
          <div className={`text-3xl font-semibold ${TABULAR}`}
               style={{ color: INK.strong }}>
            {ordinal(standing.rank)}
          </div>
          {/* SAID PLAINLY when a place is shared. Showing "3rd" to four
              students on the same score, with no note, reads to each of them
              as a different position from the others. */}
          <MicroLabel>
            {standing.tied_with > 0
              ? `joint, with ${standing.tied_with} other${standing.tied_with === 1 ? '' : 's'}`
              : `of ${standing.cohort_size}`}
          </MicroLabel>
        </div>

        <div>
          <div className={`text-xl font-semibold ${TABULAR}`}
               style={{ color: INK.body }}>
            {standing.percentile}%
          </div>
          <MicroLabel>scored below you</MicroLabel>
        </div>
      </div>

      {/* THE HONEST READING OF A PERCENTILE, because "top 10%" is what people
          hear and is not what this number says. */}
      <Caption className="mt-4">
        Your position moves as your year group takes more. It is not a mark.
      </Caption>
    </section>
  );
}
