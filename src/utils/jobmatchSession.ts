// Shared by Overview.tsx (fresh analysis) and JobCard.tsx (jobslogin's
// "Fix Resume" shortcut) — both seed the same four sessionStorage keys that
// Overview.tsx restores on mount. Writing them one sessionStorage.setItem()
// call at a time meant a mid-sequence failure (e.g. quota exceeded) could
// leave some keys holding this run's data and others still holding the
// previous run's — silently pairing the wrong resume/JD with a new match's
// results for the rest of the tab's lifetime. Roll back whatever this
// attempt did write if any step fails, so a failure leaves the previous
// consistent set intact instead of a mismatched mix.
export function writeJobmatchSessionSnapshot(fields: {
  matchResults: unknown;
  parsedResumeData: unknown;
  parsedJDData: unknown;
  jdText: string;
}): void {
  const entries: [string, string][] = [
    ["jm_matchResults", JSON.stringify(fields.matchResults)],
    ["jm_parsedResumeData", JSON.stringify(fields.parsedResumeData)],
    ["jm_parsedJDData", JSON.stringify(fields.parsedJDData)],
    ["jm_jdText", fields.jdText],
  ];
  const written: string[] = [];
  try {
    for (const [key, value] of entries) {
      sessionStorage.setItem(key, value);
      written.push(key);
    }
  } catch {
    written.forEach((key) => {
      try { sessionStorage.removeItem(key); } catch {}
    });
  }
}
