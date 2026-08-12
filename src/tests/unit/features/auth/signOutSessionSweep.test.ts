import { describe, it, expect, beforeEach } from 'vitest';

/**
 * signOut() must not leave Job Match session state behind for the next user.
 *
 * THE REGRESSION: signOut() cleared sessionStorage by an explicit ALLOW-LIST of
 * jm_* keys, so a newly added key was RETAINED BY DEFAULT. `jm_analysisDraft`
 * was added with the analysis-draft feature and never registered, so a draft
 * derived from one user's resume and JD survived sign-out and was restored on
 * mount for the next user signing in to the SAME TAB
 * (AnalysisContent.tsx reads it on mount).
 *
 * sessionStorage is per-tab, which bounds the blast radius — but it explicitly
 * survives logout -> login in the same tab, which is exactly the shared-machine
 * case.
 *
 * This asserts the PREFIX SWEEP, not a list. A list is what drifted.
 */

// The loop under test, mirrored from src/api/authApi.ts signOut().
// Kept as a pure function so it can be asserted without standing up the whole
// signOut() flow (which navigates via window.location and calls fetch).
function sweepJobMatchSessionKeys(store: Storage): void {
  for (let i = store.length - 1; i >= 0; i--) {
    const k = store.key(i);
    if (k?.startsWith('jm_')) store.removeItem(k);
  }
}

describe('signOut sessionStorage sweep', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('removes every jm_* key, including ones added after the sweep was written', () => {
    // The four that were always in the allow-list...
    sessionStorage.setItem('jm_matchResults', 'A');
    sessionStorage.setItem('jm_parsedResumeData', 'A');
    sessionStorage.setItem('jm_parsedJDData', 'A');
    sessionStorage.setItem('jm_jdText', 'A');
    // ...the one that was missed...
    sessionStorage.setItem('jm_analysisDraft', 'A');
    // ...and one nobody has written yet.
    sessionStorage.setItem('jm_somethingAddedNextQuarter', 'A');

    sweepJobMatchSessionKeys(sessionStorage);

    const leaked = Object.keys(sessionStorage).filter((k) => k.startsWith('jm_'));
    expect(leaked).toEqual([]);
  });

  it('leaves non-Job-Match session keys alone', () => {
    sessionStorage.setItem('jm_matchResults', 'A');
    sessionStorage.setItem('__signing_out', '123');
    sessionStorage.setItem('uploaded_resume_filename', 'cv.pdf');

    sweepJobMatchSessionKeys(sessionStorage);

    expect(sessionStorage.getItem('jm_matchResults')).toBeNull();
    expect(sessionStorage.getItem('__signing_out')).toBe('123');
    expect(sessionStorage.getItem('uploaded_resume_filename')).toBe('cv.pdf');
  });

  it('iterates backwards so removeItem re-indexing cannot skip a key', () => {
    // A forward loop skips every other match, because removeItem() shifts the
    // remaining keys down while the index keeps advancing.
    for (let i = 0; i < 6; i++) sessionStorage.setItem(`jm_k${i}`, 'A');

    sweepJobMatchSessionKeys(sessionStorage);

    expect(sessionStorage.length).toBe(0);
  });

  it('is a no-op on an empty store', () => {
    expect(() => sweepJobMatchSessionKeys(sessionStorage)).not.toThrow();
    expect(sessionStorage.length).toBe(0);
  });
});
