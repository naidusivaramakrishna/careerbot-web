'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  AdminInstitutionError,
  KNOWN_FEATURES,
  setCollegeFeatures,
} from '@/api/adminInstitutionsApi';

const LABEL: Record<string, string> = {
  mock_test: 'Mock tests',
  coding_test: 'Coding tests',
  mock_interview: 'Mock interviews',
  english_assessment: 'English assessment',
  resume_tools: 'Resume tools',
  job_matching: 'Job matching',
  rankings: 'Rankings and leaderboards',
};

/**
 * Which features this college may use.
 *
 * SWITCHES READ AS "ON", THOUGH THE SERVER STORES WHAT IS OFF. The stored
 * value is a DENY-list -- naming what is switched off, so a feature added
 * later arrives on for every college rather than silently missing. But an
 * operator thinks in terms of what a college HAS, so the checkboxes are
 * inverted here and the deny-list is reconstructed on save. Showing the raw
 * deny-list would have somebody tick a box to take something away.
 *
 * CHECKBOXES, NOT A TEXT FIELD. The list is matched exactly, so a typed
 * "mock-test" with a hyphen disables nothing while looking like it worked.
 * The server refuses unknown names; this makes it impossible to type one.
 *
 * A NAME THE CODE NO LONGER KNOWS IS SHOWN AND PRESERVED. If a feature is
 * ever renamed, a college still storing the old name would otherwise have it
 * silently dropped the first time somebody saved this form -- switching a
 * feature back on for them without anyone deciding to.
 */
export function FeatureToggles({
  collegeId,
  disabled,
  onSaved,
}: {
  collegeId: string;
  disabled: string[];
  onSaved: (next: string[]) => void;
}) {
  const [off, setOff] = useState<string[]>(disabled);
  const [saved, setSaved] = useState<string[]>(disabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { setOff(disabled); setSaved(disabled); }, [disabled]);

  // Names stored on this college that this build does not know about. Kept so
  // saving cannot quietly re-enable something.
  const unknown = saved.filter((f) => !(KNOWN_FEATURES as readonly string[]).includes(f));
  const dirty = [...off].sort().join() !== [...saved].sort().join();

  const toggle = (feature: string) =>
    setOff((current) => current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature]);

  const save = async () => {
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      // `saved` -- what we were last told is stored -- is the precondition.
      // If somebody else changed it since, the server refuses rather than
      // letting this write silently re-enable what they switched off.
      const result = await setCollegeFeatures(collegeId, off, saved);
      setSaved(result.disabled_features);
      setOff(result.disabled_features);
      onSaved(result.disabled_features);
      setNotice(result.changed ? 'Saved.' : 'No change.');
    } catch (err) {
      setError(err instanceof AdminInstitutionError
        ? (err.isConflict
            ? 'Somebody else changed this college’s features while you were editing. Reload and try again.'
            : err.message)
        : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">Features</h2>
      <p className="mt-1 text-xs text-gray-500">
        What this college&apos;s students and staff can use. Anything not
        listed here is on by default.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {KNOWN_FEATURES.map((feature) => {
          const on = !off.includes(feature);
          return (
            <label key={feature}
                   className="flex items-center gap-2.5 rounded-lg px-2 py-1.5
                              text-sm hover:bg-gray-50">
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(feature)}
                className="h-4 w-4"
              />
              <span className="text-gray-800">{LABEL[feature] ?? feature}</span>
            </label>
          );
        })}
      </div>

      {unknown.length > 0 ? (
        <p className="mt-3 text-xs text-amber-700">
          Also switched off, and not recognised by this version:{' '}
          {unknown.join(', ')}. Saving keeps them off.
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900
                     px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save features
        </button>
        {notice ? <span className="text-sm text-emerald-700">{notice}</span> : null}
        {error ? <span role="alert" className="text-sm text-red-600">{error}</span> : null}
      </div>
    </section>
  );
}
