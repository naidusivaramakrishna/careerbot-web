import { describe, expect, it } from 'vitest';
import { paginateImage, type PageSlice } from '@/lib/reportPagination';

/** Pages must tile the image: no overlap, no gap, nothing past a page's height. */
function expectTiles(slices: PageSlice[], imgH: number, pageH: number) {
  expect(slices[0].offset).toBe(0);
  slices.forEach((s, i) => {
    expect(s.height).toBeGreaterThan(0);
    expect(s.height).toBeLessThanOrEqual(pageH);
    if (i > 0) {
      const prev = slices[i - 1];
      expect(s.offset).toBeCloseTo(prev.offset + prev.height);
    }
  });
  const last = slices[slices.length - 1];
  expect(last.offset + last.height).toBeCloseTo(imgH);
}

describe('paginateImage (results PDF report)', () => {
  it('keeps a group that fits on one page as a single page', () => {
    expect(paginateImage(200, 297, [50, 120])).toEqual([{ offset: 0, height: 200 }]);
  });

  it('cuts at the last element boundary that fits and never repeats content (ai-review #139 P1 trace)', () => {
    // pageH=297, imgH=445, children start at 100/250/350: page 1 must end at
    // 250 (not hard-cut at 297 through the 250–350 child), page 2 must start
    // at 250 (not at 53, which reprinted 53–297).
    const slices = paginateImage(445, 297, [100, 250, 350]);
    expect(slices).toEqual([
      { offset: 0, height: 250 },
      { offset: 250, height: 195 },
    ]);
    expectTiles(slices, 445, 297);
  });

  it('hard-cuts only when no boundary falls inside the page', () => {
    // One child spans 10–700: nothing to break on, so full-page cuts.
    const slices = paginateImage(700, 297, [10]);
    expect(slices.map(s => s.offset)).toEqual([0, 297, 594]);
    expectTiles(slices, 700, 297);
  });

  // Regression: the loop advances by at most `pageH` and stops at `imgH`, so a
  // non-finite `imgH` (the call site divides by img.naturalWidth) or a
  // non-positive `pageH` used to spin forever building an unbounded array —
  // freezing the tab the user clicked "Download Report" in.
  it('returns no slices instead of looping forever on a non-finite or empty height', () => {
    expect(paginateImage(Infinity, 297, [100, 250])).toEqual([]);
    expect(paginateImage(NaN, 297, [100])).toEqual([]);
    expect(paginateImage(0, 297, [100])).toEqual([]);
    expect(paginateImage(-5, 297, [100])).toEqual([]);
  });

  it('emits a single page instead of looping forever on a non-positive page height', () => {
    expect(paginateImage(445, 0, [100])).toEqual([{ offset: 0, height: 445 }]);
    expect(paginateImage(445, NaN, [100])).toEqual([{ offset: 0, height: 445 }]);
    expect(paginateImage(445, -10, [100])).toEqual([{ offset: 0, height: 445 }]);
  });

  it('ignores non-finite break points (a zero-height group makes every offsetTop*scale Infinity)', () => {
    const slices = paginateImage(445, 297, [Infinity, NaN, 250]);
    expect(slices).toEqual([
      { offset: 0, height: 250 },
      { offset: 250, height: 195 },
    ]);
    expectTiles(slices, 445, 297);
  });

  it('tiles a long group with many boundaries', () => {
    const breaks = [40, 180, 290, 310, 500, 620, 880, 1000, 1150];
    const slices = paginateImage(1234, 297, breaks);
    expectTiles(slices, 1234, 297);
    // Every cut except the image end lands on a boundary when one was available.
    slices.slice(0, -1).forEach(s => {
      expect(breaks).toContain(s.offset + s.height);
    });
  });
});
