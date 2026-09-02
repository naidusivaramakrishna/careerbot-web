'use client';

import React from 'react';
import type { Readiness } from '@/types/institution';
import { activityLabel } from '@/lib/institutionMessages';
import { Caption, MicroLabel, SectionTitle } from './Typography';
import { CARD, INK, TABULAR } from './tokens';

/**
 * How ready this student is, out of 100, WITH the working.
 *
 * THE BREAKDOWN IS NOT OPTIONAL DECORATION. A single number a student cannot
 * take apart is a number they will not trust -- and the first thing anyone
 * asks on seeing 46 is "why 46". Showing the five parts answers that in the
 * same glance, and it turns a verdict into a to-do list: the rows with nothing
 * scored are exactly what to do next.
 *
 * ZERO IS A STARTING POINT, NOT A FAILURE. A student who has done nothing sees
 * 0 of 100 with five things to try, not an empty state implying something went
 * wrong. Copy is second-person and forward-looking throughout, for the same
 * reason the rest of this screen is.
 */
export function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const pct = Math.max(0, Math.min(100,
    (readiness.readiness / (readiness.max || 100)) * 100));

  return (
    <section className={`${CARD} p-5`} aria-labelledby="readiness-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionTitle id="readiness-heading">Your readiness</SectionTitle>
          <Caption>
            {readiness.scored === 0
              ? 'Nothing scored yet. Each activity below adds to your score.'
              : `Based on ${readiness.scored} of ${readiness.of} activities.`}
          </Caption>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-semibold ${TABULAR}`}
               style={{ color: INK.strong }}>
            {readiness.readiness}
          </div>
          <MicroLabel>out of {readiness.max}</MicroLabel>
        </div>
      </div>

      {/* A bar, not a dial or a ring. It reads at a glance, needs no legend,
          and does not imply precision the number does not have. */}
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#eef2fb]"
        role="progressbar"
        aria-valuenow={readiness.readiness}
        aria-valuemin={0}
        aria-valuemax={readiness.max}
        aria-labelledby="readiness-heading"
      >
        <div className="h-full rounded-full bg-[#2557a7]"
             style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-5 divide-y divide-[#f0f0f0]">
        {readiness.breakdown.map((part) => (
          <li key={part.activity}
              className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm" style={{ color: INK.body }}>
                {activityLabel(part.activity)}
              </div>
              {/* WHAT TO DO, not what is missing. "Not taken yet" is a fact
                  with a next step; "0 / 25" beside four other numbers reads
                  as a mark out of 25 that the student scored zero on. */}
              <div className="text-xs" style={{ color: INK.muted }}>
                {part.scored
                  ? `${Math.round((part.best_fraction ?? 0) * 100)}% of your best attempt`
                  : 'Not taken yet'}
              </div>
            </div>
            <div className={`shrink-0 text-sm ${TABULAR}`}
                 style={{ color: part.scored ? INK.strong : INK.faint }}>
              {part.earned} <span className="text-xs" style={{ color: INK.faint }}>
                / {part.weight}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* SAID OUT LOUD, because a student who practises and sees no change
          will otherwise assume the score is broken. */}
      <Caption className="mt-4">
        Your best attempt at each activity counts, so practising can only help.
      </Caption>
    </section>
  );
}
