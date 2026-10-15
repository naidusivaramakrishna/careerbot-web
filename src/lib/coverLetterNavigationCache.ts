/**
 * Short-lived in-memory hand-off between cover-letter generation and its
 * detail route. The generation response is already the persisted letter, so
 * the detail screen can render it immediately while its normal GET refreshes
 * in the background. Keeping this only in memory avoids putting the letter
 * contents in browser storage.
 */
import type { CoverLetterResponse } from "@/types/coverLetter";

const generatedLetters = new Map<string, CoverLetterResponse>();

export function cacheGeneratedCoverLetter(letter: CoverLetterResponse): void {
  generatedLetters.set(letter.letter_id, letter);
}

export function getCachedGeneratedCoverLetter(
  letterId: string | null | undefined,
): CoverLetterResponse | null {
  if (!letterId) return null;
  return generatedLetters.get(letterId) ?? null;
}

export function clearCachedGeneratedCoverLetter(letterId: string): void {
  generatedLetters.delete(letterId);
}
