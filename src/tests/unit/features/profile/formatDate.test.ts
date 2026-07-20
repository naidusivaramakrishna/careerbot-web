/**
 * Unit tests for formatDateRange (src/utils/formatDate.ts)
 *
 * Covers:
 *   - Normal start/end dates → "MMM yyyy – MMM yyyy"
 *   - Missing end date → "MMM yyyy – Present"
 *   - End date is the string "present" (case-insensitive) → "MMM yyyy – Present"
 *   - Start date is "present" (any case) → normalized to "Present"
 *   - Invalid/unparseable start date → echoes raw string instead of "Invalid Date"
 *   - Invalid/unparseable end date → echoes raw string instead of "Invalid Date"
 *   - Missing start date → empty string
 */
import { describe, it, expect } from 'vitest';
import { formatDateRange } from '@/utils/formatDate';

// Use mid-month dates (day 15) so UTC-midnight parsing never crosses a month
// boundary regardless of the runner's local timezone offset (up to ±14 hours).
describe('formatDateRange', () => {
    it('formats normal start and end dates', () => {
        expect(formatDateRange('2022-01-15', '2023-06-15')).toBe('Jan 2022 – Jun 2023');
    });

    it('returns "Present" when end date is omitted', () => {
        expect(formatDateRange('2022-01-15')).toBe('Jan 2022 – Present');
        expect(formatDateRange('2022-01-15', undefined)).toBe('Jan 2022 – Present');
    });

    it('returns "Present" when end date is the string "present" (case-insensitive)', () => {
        expect(formatDateRange('2022-01-15', 'present')).toBe('Jan 2022 – Present');
        expect(formatDateRange('2022-01-15', 'Present')).toBe('Jan 2022 – Present');
        expect(formatDateRange('2022-01-15', 'PRESENT')).toBe('Jan 2022 – Present');
    });

    it('normalizes "present" (any case) to "Present" when used as start date', () => {
        expect(formatDateRange('present', '2023-06-15')).toBe('Present – Jun 2023');
        expect(formatDateRange('PRESENT', '2023-06-15')).toBe('Present – Jun 2023');
    });

    it('echoes raw start string when start date is unparseable (no "Invalid Date")', () => {
        const result = formatDateRange('not-a-date', '2023-01-15');
        expect(result).not.toContain('Invalid Date');
        expect(result).toBe('not-a-date – Jan 2023');
    });

    it('echoes raw end string when end date is unparseable (no "Invalid Date")', () => {
        const result = formatDateRange('2022-01-15', 'not-a-date');
        expect(result).not.toContain('Invalid Date');
        expect(result).toBe('Jan 2022 – not-a-date');
    });

    it('returns empty string when start date is missing', () => {
        expect(formatDateRange()).toBe('');
        expect(formatDateRange(undefined, '2023-01-15')).toBe('');
    });

    it('accepts Date objects directly', () => {
        const start = new Date('2021-03-15');
        const end = new Date('2022-09-15');
        expect(formatDateRange(start, end)).toBe('Mar 2021 – Sep 2022');
    });

    it('drops invalid Date objects gracefully — no "Invalid Date", no orphaned separator', () => {
        const invalid = new Date('garbage');
        // invalid start → bail out early, return ""
        expect(formatDateRange(invalid, new Date('2023-01-15'))).toBe('');
        // invalid end → fall back to "Present" so range reads as open/ongoing
        expect(formatDateRange(new Date('2022-01-15'), invalid)).toBe('Jan 2022 – Present');
    });
});
