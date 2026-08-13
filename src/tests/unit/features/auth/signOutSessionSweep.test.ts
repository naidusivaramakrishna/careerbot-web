import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signOut } from '@/api/authApi';

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
 * This asserts the PREFIX SWEEP through signOut(), not a list. A list is what
 * drifted.
 */

const originalLocation = window.location;

describe('signOut sessionStorage sweep', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('removes every jm_* key, including ones added after the sweep was written', async () => {
    // The four that were always in the allow-list...
    sessionStorage.setItem('jm_matchResults', 'A');
    sessionStorage.setItem('jm_parsedResumeData', 'A');
    sessionStorage.setItem('jm_parsedJDData', 'A');
    sessionStorage.setItem('jm_jdText', 'A');
    // ...the one that was missed...
    sessionStorage.setItem('jm_analysisDraft', 'A');
    // ...and one nobody has written yet.
    sessionStorage.setItem('jm_somethingAddedNextQuarter', 'A');

    await signOut();

    const leaked = Object.keys(sessionStorage).filter((k) => k.startsWith('jm_'));
    expect(leaked).toEqual([]);
  });

  it('leaves non-Job-Match session keys alone', async () => {
    sessionStorage.setItem('jm_matchResults', 'A');
    sessionStorage.setItem('unrelated_session_state', '123');
    sessionStorage.setItem('uploaded_resume_filename', 'cv.pdf');

    await signOut();

    expect(sessionStorage.getItem('jm_matchResults')).toBeNull();
    expect(sessionStorage.getItem('unrelated_session_state')).toBe('123');
    expect(sessionStorage.getItem('uploaded_resume_filename')).toBe('cv.pdf');
  });

  it('iterates backwards so removeItem re-indexing cannot skip a key', async () => {
    // A forward loop skips every other match, because removeItem() shifts the
    // remaining keys down while the index keeps advancing.
    for (let i = 0; i < 6; i++) sessionStorage.setItem(`jm_k${i}`, 'A');

    await signOut();

    expect(Object.keys(sessionStorage).filter((k) => k.startsWith('jm_'))).toEqual([]);
  });

  it('handles an empty store', async () => {
    await expect(signOut()).resolves.not.toThrow();
    expect(Object.keys(sessionStorage).filter((k) => k.startsWith('jm_'))).toEqual([]);
  });
});
