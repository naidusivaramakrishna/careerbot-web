import { describe, expect, it } from 'vitest';
import { resolveResumeRoute, toTestRouteSlug, sectionConfigFor, STANDARD_TEST_TOTALS, STANDARD_SECTIONS, parseSubcategoriesParam } from '@/lib/mockTestConstants';

describe('resolveResumeRoute', () => {
  // Every session currently comes back with a falsy company_id (see the
  // function's own comment) — these are the cases that have twice produced a
  // broken link (`/mock-test/undefined`, `/mock-test/null`, `/mock-test/`)
  // when this logic was written inline instead of as a tested function.
  it.each([
    ['undefined (the real-world case — careerbot-api never stores company_id)', undefined, '/mock-test/custom'],
    ['null', null, '/mock-test/custom'],
    ['empty string', '', '/mock-test/custom'],
    ["the literal 'custom'", 'custom', '/mock-test/custom'],
    ["a real company id ('tcs')", 'tcs', '/mock-test/tcs'],
  ])('%s resolves to %s', (_label, companyId, expected) => {
    expect(resolveResumeRoute(companyId)).toBe(expected);
  });
});

describe('toTestRouteSlug', () => {
  it("maps 'custom' to the runner's 'custom-test' slug", () => {
    expect(toTestRouteSlug('custom')).toBe('custom-test');
  });
  it('passes any other id through unchanged', () => {
    expect(toTestRouteSlug('tcs')).toBe('tcs');
  });
});

describe('sectionConfigFor', () => {
  it('returns the configured size for a known section', () => {
    expect(sectionConfigFor('arithmetic')).toEqual({ questions: 20, minutes: 25 });
  });
  it('falls back to the standard size for an unknown category', () => {
    expect(sectionConfigFor('made_up_category')).toEqual({ questions: 20, minutes: 25 });
  });
  it('is case-insensitive', () => {
    expect(sectionConfigFor('Arithmetic')).toEqual({ questions: 20, minutes: 25 });
  });
});

describe('parseSubcategoriesParam', () => {
  const valid = ['percentages', 'ratios', 'algebra'];

  it('returns [] for a missing/null param', () => {
    expect(parseSubcategoriesParam(null, 0, valid)).toEqual([]);
    expect(parseSubcategoriesParam(undefined, 0, valid)).toEqual([]);
  });

  it('parses one "+"-joined segment at the given positional index', () => {
    const raw = 'percentages+ratios|algebra';
    expect(parseSubcategoriesParam(raw, 0, valid)).toEqual(['percentages', 'ratios']);
    expect(parseSubcategoriesParam(raw, 1, ['algebra'])).toEqual(['algebra']);
  });

  it('returns [] for an index beyond the number of segments', () => {
    expect(parseSubcategoriesParam('percentages', 5, valid)).toEqual([]);
  });

  it('filters out slugs not in the valid list for this section (stale/hand-edited URL)', () => {
    expect(parseSubcategoriesParam('percentages+not_a_real_slug', 0, valid)).toEqual(['percentages']);
  });

  it('returns [] when every picked slug is invalid, not a list of garbage', () => {
    expect(parseSubcategoriesParam('not_real+also_fake', 0, valid)).toEqual([]);
  });

  it('treats an empty segment (narrowed-to-nothing category) as no picks', () => {
    expect(parseSubcategoriesParam('|percentages', 0, valid)).toEqual([]);
  });
});

describe('STANDARD_TEST_TOTALS', () => {
  it('sums every standard section to 80 questions / 100 minutes / 4 sections', () => {
    expect(STANDARD_TEST_TOTALS).toEqual({ questions: 80, minutes: 100, sections: 4 });
  });
  it('matches STANDARD_SECTIONS length', () => {
    expect(STANDARD_TEST_TOTALS.sections).toBe(STANDARD_SECTIONS.length);
  });
});
