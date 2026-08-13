import { describe, it, expect } from 'vitest';
import { getMatchBand, type MatchBand } from '@/app/cover-letter/_utils/matchLabel';

/**
 * THE REGRESSION: RING_TONE_COLOR in CoverLetterView was a Record over a
 * SUBSET of MatchBand — it omitted "excellent". getMatchBand returns
 * "excellent" for any score >= 85, so the colour lookup missed and the ring
 * rendered `conic-gradient(undefined ...)` on exactly the best-scoring cover
 * letters. tsc would have caught it, but this repo runs `tsc --noEmit || true`
 * and sets typescript.ignoreBuildErrors, so nothing did.
 */
const RING_TONE_COLOR: Record<MatchBand, string> = {
  excellent: '#16a34a',
  good: '#22c55e',
  moderate: '#d97706',
  low: '#ea580c',
  'very-low': '#b91c1c',
};

describe('score ring tone', () => {
  it.each([100, 95, 85])('resolves a colour at the excellent boundary (%i)', (score) => {
    expect(RING_TONE_COLOR[getMatchBand(score)]).toBeDefined();
  });

  it.each([84, 70, 50, 20, 0])('resolves a colour across every other band (%i)', (score) => {
    expect(RING_TONE_COLOR[getMatchBand(score)]).toBeDefined();
  });

  it('covers every band the classifier can emit', () => {
    const emitted = new Set([0, 20, 50, 70, 85, 100].map(getMatchBand));

    for (const band of emitted) {
      expect(RING_TONE_COLOR[band]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
