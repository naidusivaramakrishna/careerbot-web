/**
 * Per-scope store of question IDs the user has already seen, persisted in
 * localStorage so the backend can be asked to *not* serve them again on the
 * next /mock-test/generate call (the `exclude_question_ids` field).
 *
 * Scope is typically the companyId (e.g. 'tcs', 'infosys', 'custom-test') so
 * a user's TCS history doesn't suppress their Infosys pool and vice versa.
 *
 * Capped at MAX_IDS_PER_SCOPE to keep both localStorage and the outbound
 * request payload bounded. Oldest IDs are dropped first.
 */

const STORAGE_PREFIX = 'careerbot:seen_q:';
// Backend caps exclude_question_ids at 50 items per /mock-test/generate
// request. Storing more locally would be dead weight since we couldn't
// forward them anyway — so the storage cap matches the backend cap.
// Oldest IDs are dropped first, so the user may re-encounter their very
// earliest questions once they've seen 50+ unique ones.
const MAX_IDS_PER_SCOPE = 50;

const keyFor = (scope: string) => `${STORAGE_PREFIX}${scope || 'default'}`;

const readRaw = (scope: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const writeRaw = (scope: string, ids: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(scope), JSON.stringify(ids));
  } catch {
    // quota exceeded or storage disabled — fail silently, dedup is best-effort
  }
};

export function getSeenQuestionIds(scope: string): string[] {
  return readRaw(scope);
}

export function addSeenQuestionIds(scope: string, ids: Array<string | number | null | undefined>): void {
  const cleaned = ids
    .filter((v): v is string | number => v != null && v !== '')
    .map(v => String(v));
  if (cleaned.length === 0) return;

  const existing = readRaw(scope);
  // Preserve insertion order, drop dupes against the existing tail (most
  // recently seen IDs sit at the end of the array).
  const seen = new Set(existing);
  const merged = existing.slice();
  for (const id of cleaned) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  // Trim oldest entries if we blew past the cap.
  const trimmed = merged.length > MAX_IDS_PER_SCOPE
    ? merged.slice(merged.length - MAX_IDS_PER_SCOPE)
    : merged;
  writeRaw(scope, trimmed);
}

export function clearSeenQuestionIds(scope: string): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(keyFor(scope)); } catch { /* ignore */ }
}
