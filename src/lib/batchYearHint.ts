/**
 * The Batch year field is ONE number (the year the batch starts), but a batch is
 * named by an academic-year RANGE ("2020-2024"). Showing the range alone as the
 * hint invited typing it, which the number field refuses. The hint now says
 * what to type and uses the first batch's start year as the example.
 */
export function batchYearHint(batchYears: string[]): string {
  const startYears = batchYears
    .map((y) => /^\s*(\d{4})/.exec(y)?.[1])
    .filter((y): y is string => Boolean(y));
  if (startYears.length === 0) return 'Optional — the year the batch starts, e.g. 2026.';
  return `Enter the year the batch starts, e.g. ${startYears[0]}. Your batches: ${batchYears
    .slice(0, 3)
    .join(', ')}.`;
}
