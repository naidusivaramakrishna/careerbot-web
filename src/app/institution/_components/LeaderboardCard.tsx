'use client';

import React from 'react';
import type { Leaderboard } from '@/types/institution';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK, TABULAR } from './tokens';

/**
 * The top of the cohort.
 *
 * THE ROWS ARE NUMBERED HERE, NOT BY THE SERVER, and that is a privacy
 * decision rather than a rendering one. The API returns no rank on any entry,
 * because a true competition rank leaves a GAP where somebody opted out --
 * 1, 3, 4 says a person is missing and brackets their score between the two
 * names either side. What this list shows are POSITIONS IN THIS LIST, which
 * is what a leaderboard is for, and the caption says so rather than letting a
 * reader assume the numbering is a ranking.
 *
 * There is no total either. "Ten in the year, nine names" identifies the
 * tenth.
 */
export function LeaderboardCard({ board }: { board: Leaderboard }) {
  if (!board.available || board.entries.length === 0) {
    return (
      <section className={`${CARD} p-5`} aria-labelledby="board-heading">
        <SectionTitle id="board-heading">Top of your year</SectionTitle>
        <Caption>
          {board.available
            ? 'Nobody in your year has a score yet.'
            : 'Not enough of your year group have taken anything yet.'}
        </Caption>
      </section>
    );
  }

  return (
    <section className={`${CARD} p-5`} aria-labelledby="board-heading">
      <SectionTitle id="board-heading">Top of your year</SectionTitle>
      <Caption>Students who chose to be listed.</Caption>

      <ol className="mt-4 divide-y divide-[#f0f0f0]">
        {board.entries.map((entry, index) => (
          <li key={entry.student_id}
              className="flex items-center justify-between gap-4 py-2.5">
            <span className="flex min-w-0 items-center gap-3">
              <span className={`w-5 shrink-0 text-xs ${TABULAR}`}
                    style={{ color: INK.faint }}>
                {index + 1}
              </span>
              <span className="truncate text-sm" style={{ color: INK.body }}>
                {entry.name}
              </span>
            </span>
            <span className={`shrink-0 text-sm font-medium ${TABULAR}`}
                  style={{ color: INK.strong }}>
              {entry.readiness}
            </span>
          </li>
        ))}
      </ol>

      {/* WHY SOMEBODY THEY EXPECT MIGHT NOT BE HERE. Without this line, a
          student who knows the top of their year and cannot find them assumes
          the list is broken -- and starts working out who is missing, which is
          the thing the opt-out exists to prevent. */}
      <Caption className="mt-4">
        Anyone can choose not to appear here. This shows positions in this
        list, not everyone&apos;s rank.
      </Caption>
    </section>
  );
}
