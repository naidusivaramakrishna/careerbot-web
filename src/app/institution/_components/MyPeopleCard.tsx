'use client';

import React from 'react';
import type { CollegePerson, MyPeople } from '@/types/institution';
import { Caption, MicroLabel, SectionTitle } from './Typography';
import { CARD, INK } from './tokens';

/**
 * Who to ask about your own results.
 *
 * A student knows their scores and does not know who to speak to about them.
 * That is the gap this closes, and it is the reason the card shows a NAME and
 * a ROLE and nothing else -- an account id would be an internal identifier
 * they cannot use, and an email would be a contact detail the college has not
 * agreed to publish.
 *
 * THREE GROUPS, LABELLED IN THE STUDENT'S WORDS. "Your faculty" is who marks
 * their work; "placement cell" is who runs the drives. A single list sorted
 * by role would make the student work out which is which.
 *
 * AN EMPTY GROUP SAYS SO. "No faculty assigned yet" is a real state a student
 * should be able to see, because it is why nobody is tracking them -- and it
 * is something their placement officer can fix.
 */
const GROUPS: Array<{
  key: keyof MyPeople;
  label: string;
  empty: string;
}> = [
  {
    key: 'faculty',
    label: 'Your faculty',
    empty: 'No faculty assigned to you yet.',
  },
  {
    key: 'hods',
    label: 'Head of department',
    empty: 'No head of department listed.',
  },
  {
    key: 'placement_officers',
    label: 'Placement cell',
    empty: 'No placement officer listed.',
  },
];

function People({ people }: { people: CollegePerson[] }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {people.map((person, index) => (
        <li key={`${person.name ?? 'unnamed'}-${index}`}
            className="text-sm" style={{ color: INK.body }}>
          {/* A staff member the college never named shows as their role, not
              as blank and not as an id. */}
          {person.name || 'Name not recorded'}
        </li>
      ))}
    </ul>
  );
}

export function MyPeopleCard({ people }: { people: MyPeople }) {
  return (
    <section className={`${CARD} p-5`} aria-labelledby="people-heading">
      <SectionTitle id="people-heading">Your college</SectionTitle>
      <Caption>Who to ask about your progress.</Caption>

      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {GROUPS.map(({ key, label, empty }) => {
          const list = people[key] ?? [];
          return (
            <div key={key}>
              <dt><MicroLabel>{label}</MicroLabel></dt>
              <dd>
                {list.length > 0 ? (
                  <People people={list} />
                ) : (
                  <p className="mt-1 text-sm" style={{ color: INK.faint }}>
                    {empty}
                  </p>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
