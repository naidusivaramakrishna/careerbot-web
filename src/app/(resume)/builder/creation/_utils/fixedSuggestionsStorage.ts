/**
 * The browser keeps each enhanced resume's recommendation list (green "fixed" cards
 * included) under its saved-record ID. Kept in its own module so the upload flows
 * can clear it without importing the whole resume context.
 */
export const FIXED_SUGGESTIONS_STORAGE_PREFIX = "careerbot:enhanced-fixed-suggestions:";

/** Forget the recommendations this browser kept for a saved resume. */
export function clearStoredFixedSuggestions(resumeId?: string): void {
  if (!resumeId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${FIXED_SUGGESTIONS_STORAGE_PREFIX}${resumeId}`);
  } catch {
    // storage unavailable: nothing was kept
  }
}

/** Key under which the preview keeps the text each fix added, per resume (see useFixedTextHighlights). */
export const FIXED_TEXT_STORAGE_PREFIX = "ats-fixed-text:";

/** Forget the green text highlights this browser kept for a saved resume. */
export function clearStoredFixedText(resumeKey?: string): void {
  if (!resumeKey || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${FIXED_TEXT_STORAGE_PREFIX}${resumeKey}`);
  } catch {
    // storage unavailable: nothing was kept
  }
}
