import { describe, expect, it } from 'vitest';
import { normalizeResumeScanError } from '@/app/(resume)/ats/utils/scanFlow';

describe('normalizeResumeScanError', () => {
  it('returns a readable message for backend failure payloads', () => {
    expect(
      normalizeResumeScanError({ success: false, error: 'Parse failed on server' })
    ).toBe('Parse failed on server');
  });

  it('converts quota and credit failures to the user-facing message', () => {
    expect(
      normalizeResumeScanError({ success: false, error: 'You have insufficient credits.' })
    ).toBe("You don't have enough credits to analyze this resume. Please upgrade your plan or purchase credits.");
  });

  it('does not claim the resume was parsed for a raw 500 (the failing step is unknown here)', () => {
    expect(
      normalizeResumeScanError({ success: false, error: 'Internal Server Error' })
    ).not.toMatch(/after your resume was parsed/i);
  });
});
