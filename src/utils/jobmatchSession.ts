// Shared by Overview.tsx (fresh analysis) and JobCard.tsx (jobslogin's
// "Fix Resume" shortcut) — both seed the same four sessionStorage keys that
// Overview.tsx restores on mount. Writing them one sessionStorage.setItem()
// call at a time meant a mid-sequence failure (e.g. quota exceeded) could
// leave some keys holding this run's data and others still holding the
// previous run's — silently pairing the wrong resume/JD with a new match's
// results for the rest of the tab's lifetime. Capture each key's prior value
// up front and restore it (not just delete) for whatever this attempt did
// write if any step fails, so a failure leaves the previous consistent set
// intact instead of a mismatched mix. Returns whether the write succeeded,
// so a caller that's about to hard-navigate on the strength of this snapshot
// (JobCard.tsx) can detect a failure and skip the navigation instead of
// landing on a page with no way to recover the mismatched state.
export function writeJobmatchSessionSnapshot(fields: {
  matchResults: unknown;
  parsedResumeData: unknown;
  parsedJDData: unknown;
  jdText: string;
  resumeName?: string;
  jobDescriptionName?: string;
  resumeSizeMB?: number;
  jdSizeMB?: number;
  analyzedAt?: string;
}): boolean {
  const entries: [string, string][] = [
    ["jm_matchResults", JSON.stringify(fields.matchResults)],
    ["jm_parsedResumeData", JSON.stringify(fields.parsedResumeData)],
    ["jm_parsedJDData", JSON.stringify(fields.parsedJDData)],
    ["jm_jdText", fields.jdText],
    ["jm_resumeName", fields.resumeName ?? ""],
    ["jm_jdName", fields.jobDescriptionName ?? ""],
    ["jm_resumeSizeMB", fields.resumeSizeMB != null ? String(fields.resumeSizeMB) : ""],
    ["jm_jdSizeMB", fields.jdSizeMB != null ? String(fields.jdSizeMB) : ""],
    ["jm_analyzedAt", fields.analyzedAt ?? ""],
  ];
  const priorValues = entries.map(([key]) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  });

  const written = new Set<string>();
  try {
    for (const [key, value] of entries) {
      sessionStorage.setItem(key, value);
      written.add(key);
    }
    return true;
  } catch {
    entries.forEach(([key], i) => {
      if (!written.has(key)) return; // untouched this attempt — still holds the prior run's value
      try {
        const prior = priorValues[i];
        if (prior === null) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, prior);
      } catch { /* best-effort rollback */ }
    });
    return false;
  }
}
