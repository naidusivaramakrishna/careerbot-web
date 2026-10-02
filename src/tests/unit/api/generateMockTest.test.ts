import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { post: vi.fn(async () => ({ data: { session_id: 's1', sections: [] } })) },
}));

import { httpClient } from '@/lib/http';
import { generateMockTest, MAX_QUESTIONS_PER_GENERATE } from '@/api/mockTestApi';
import { CATEGORY_SUBCATEGORIES } from '@/lib/mockTestConstants';

const post = httpClient.post as unknown as ReturnType<typeof vi.fn>;

describe('generateMockTest payload', () => {
  beforeEach(() => { post.mockClear(); });

  it('sends category/subcategory as plain strings, never company_context or negative_marking', async () => {
    await generateMockTest('tcs', ['arithmetic'], ['percentages'], 'medium', undefined, 60000, 20, 25);
    const payload = post.mock.calls[0][1];
    expect(payload.category).toBe('arithmetic');
    expect(payload.subcategory).toBe('percentages');
    expect(typeof payload.category).toBe('string');
    expect(typeof payload.subcategory).toBe('string');
    expect(payload).not.toHaveProperty('company_context');
    expect(payload).not.toHaveProperty('company_id');
    expect(payload).not.toHaveProperty('negative_marking');
  });

  it('caps an oversized count at the actual computed limit (the largest SECTION_CONFIG value), not just "some" lower number', async () => {
    await generateMockTest('tcs', ['arithmetic'], ['percentages'], 'medium', undefined, 60000, 9999, 25);
    // 20 today (every section is uniformly 20Q) — asserted via the real
    // import, not a hardcoded guess, so this doesn't drift if SECTION_CONFIG does.
    expect(post.mock.calls[0][1].count).toBe(MAX_QUESTIONS_PER_GENERATE);
  });

  it('defaults count/time_limit from SECTION_CONFIG, not a stale hardcoded value, when omitted', async () => {
    await generateMockTest('tcs', ['arithmetic'], ['percentages'], 'medium');
    const payload = post.mock.calls[0][1];
    expect(payload.count).toBe(20);
    expect(payload.time_limit).toBe(25);
  });

  it('only includes parent_session_id when one is given', async () => {
    await generateMockTest('tcs', ['arithmetic'], ['percentages'], 'medium', undefined, 60000, 20, 25);
    expect(post.mock.calls[0][1]).not.toHaveProperty('parent_session_id');

    post.mockClear();
    await generateMockTest('tcs', ['arithmetic'], ['percentages'], 'medium', 'parent-1', 60000, 20, 25);
    expect(post.mock.calls[0][1].parent_session_id).toBe('parent-1');
  });

  it('falls back to a real subcategory slug (never the category name) when none is given', async () => {
    await generateMockTest('tcs', ['arithmetic'], [], 'medium', undefined, 60000, 20, 25);
    const sent = post.mock.calls[0][1].subcategory;
    // The backend rejects a category name as a subcategory value (documented
    // by the now-removed generateCustomTest's comment) — this must never be
    // the literal string 'arithmetic'.
    expect(sent).not.toBe('arithmetic');
    expect(CATEGORY_SUBCATEGORIES.arithmetic).toContain(sent);
  });
});
