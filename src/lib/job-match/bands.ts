export type MatchBand = 'strong' | 'good' | 'fair' | 'needs-work';

// Descending thresholds are also used to draw the score gauge's segments.
export const BANDS: readonly { min: number; band: MatchBand }[] = [
  { min: 85, band: 'strong' },
  { min: 70, band: 'good' },
  { min: 55, band: 'fair' },
  { min: 0, band: 'needs-work' },
];

/** Classify finite scores without rounding across a band boundary. */
export function getBand(score: number): MatchBand {
  if (!Number.isFinite(score)) {
    throw new RangeError('A match band requires a finite score.');
  }
  const normalized = Math.min(100, Math.max(0, score));
  return BANDS.find(b => normalized >= b.min)!.band;
}

export const bandStyles: Record<MatchBand, { label: string; text: string; bg: string; bar: string }> = {
  strong: { label: 'Strong match', text: 'text-success-700', bg: 'bg-success-50', bar: 'bg-success-700' },
  good: { label: 'Good match', text: 'text-info-700', bg: 'bg-info-50', bar: 'bg-info-700' },
  fair: { label: 'Fair match', text: 'text-warning-700', bg: 'bg-warning-50', bar: 'bg-warning-700' },
  'needs-work': { label: 'Needs work', text: 'text-error-700', bg: 'bg-error-50', bar: 'bg-error-700' },
};

// Literal counterparts for PDF exports, standalone print previews and SVGs.
// Keep these in sync with the semantic tokens in styles/status-colors.css.
export const bandColors: Record<MatchBand, { text: string; bg: string }> = {
  strong: { text: '#067647', bg: '#ECFDF3' },
  good: { text: '#175CD3', bg: '#EFF8FF' },
  fair: { text: '#B54708', bg: '#FFFAEB' },
  'needs-work': { text: '#B42318', bg: '#FEF3F2' },
};
