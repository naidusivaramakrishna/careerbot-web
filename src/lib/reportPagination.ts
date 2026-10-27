/** One PDF page's slice of a tall rendered image, in the image's own units. */
export interface PageSlice {
  /** Where on the image this page starts. */
  offset: number;
  /** How much of the image this page shows, starting at `offset`. */
  height: number;
}

/**
 * Split an image `imgH` tall into pages at most `pageH` tall. Each page ends at
 * the last break point (a child element's top edge) that fits on it, and the
 * next page starts at that same point, so pages never overlap or skip content
 * and a child is only cut when it alone is taller than a page (or no break
 * point falls inside the page), in which case the page is cut at `pageH`
 * rather than leaving the page mostly empty in front of that child.
 */
export function paginateImage(imgH: number, pageH: number, breakPoints: number[]): PageSlice[] {
  // The loop below advances `offset` by at most `pageH` per turn and stops at
  // `imgH`, so it only terminates when both are finite and positive. The call
  // site derives `imgH` from a division (rendered height / natural width) and
  // `pageH` from the PDF page size, so a degenerate render must not be allowed
  // to spin the UI thread forever building an unbounded slice array.
  if (!Number.isFinite(imgH) || imgH <= 0) return [];
  if (!Number.isFinite(pageH) || pageH <= 0) return [{ offset: 0, height: imgH }];
  const breaks = [...breakPoints].sort((a, b) => a - b).filter(Number.isFinite);
  const slices: PageSlice[] = [];
  let offset = 0;
  while (offset < imgH) {
    const pageEnd = offset + pageH;
    let end: number;
    if (pageEnd >= imgH) {
      end = imgH;
    } else {
      const last = breaks.filter(y => y > offset && y <= pageEnd).pop();
      // The child starting at `last` runs to the next break (or the image end).
      // If it is itself taller than a page it gets cut anyway, so breaking in
      // front of it would only waste the rest of this page.
      const childEnd = last === undefined ? undefined : (breaks.find(y => y > last) ?? imgH);
      end = last !== undefined && childEnd !== undefined && childEnd - last <= pageH ? last : pageEnd;
    }
    slices.push({ offset, height: end - offset });
    offset = end;
  }
  return slices;
}
