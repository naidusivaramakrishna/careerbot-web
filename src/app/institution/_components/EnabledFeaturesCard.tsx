'use client';

import React from 'react';
import type { InstitutionContext } from '@/types/institution';
import { activityLabel } from '@/lib/institutionMessages';
import { Caption, SectionTitle } from './Typography';
import { CARD, INK } from './tokens';

/**
 * What this college has switched ON. The locked requirement is ENABLED only.
 *
 * DERIVED FROM THE DENY-LIST, NOT FROM AN ALLOW-LIST, because that is what the
 * server actually stores. `disabled_features` names what is OFF; everything
 * else is on. An allow-list here would mean a feature added after this code
 * was written silently stops appearing for every college -- the same trap the
 * backend model avoided for the same reason.
 *
 * DISABLED FEATURES ARE NOT SHOWN AT ALL, greyed out or otherwise. A student
 * cannot switch one on and cannot ask anybody to -- it is a commercial
 * decision between the college and the platform. Showing them a list of things
 * they are not allowed to have creates a question with no answer.
 */

/** The activities a student can actually be scored on. Ordered by how a
 *  student meets them, not alphabetically. */
const STUDENT_FEATURES = [
  'mock_test',
  'coding_test',
  'mock_interview',
  'english_assessment',
  'resume_tools',
  'job_matching',
] as const;

export function EnabledFeaturesCard({ context }: { context: InstitutionContext }) {
  const off = new Set(
    (context.disabled_features ?? []).map((f) => String(f).trim().toLowerCase()),
  );
  const on = STUDENT_FEATURES.filter((f) => !off.has(f));

  if (on.length === 0) {
    // Possible, and worth saying plainly rather than rendering an empty card.
    return (
      <section className={`${CARD} p-5`} aria-labelledby="features-heading">
        <SectionTitle id="features-heading">Available to you</SectionTitle>
        <Caption>
          Your college has not switched any activities on yet. Your placement
          officer can change this.
        </Caption>
      </section>
    );
  }

  return (
    <section className={`${CARD} p-5`} aria-labelledby="features-heading">
      <SectionTitle id="features-heading">Available to you</SectionTitle>
      <Caption>What your college has switched on.</Caption>
      <ul className="mt-3 flex flex-wrap gap-2">
        {on.map((feature) => (
          <li key={feature}
              className="rounded-md bg-[#eef4ff] px-2.5 py-1 text-xs font-medium"
              style={{ color: INK.body }}>
            {activityLabel(feature)}
          </li>
        ))}
      </ul>
    </section>
  );
}
