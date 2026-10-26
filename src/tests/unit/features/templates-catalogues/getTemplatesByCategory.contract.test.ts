/**
 * PR #227 ai-review (da27bab1) P0: getTemplatesByCategory started returning a
 * `{ templates, total, ... }` object, while TemplatesTab (3 call sites) and
 * useTemplateRedirect still use the result as an array, so `.filter` threw and
 * `Array.isArray` was always false. It also sent `domain_family`/`search`/
 * `offset`/`limit=12`, which develop2's GET /templates/ ignores (it accepts
 * only `category` and returns every template), while careerbot-api PR #387
 * honours them with a default page of 12 and a cap of 100 -- below the 109
 * seeded templates -- so an unpaged caller would silently get a truncated list.
 *
 * The function keeps develop2's contract (an array of every template) and
 * works against both servers by following `total` across pages.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
vi.mock('@/lib/http', () => ({
  httpClient: { get: (...args: unknown[]) => mockGet(...args), defaults: { baseURL: '' } },
  default: { get: (...args: unknown[]) => mockGet(...args), defaults: { baseURL: '' } },
}));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getTemplatesByCategory } from '@/api/resumeApi';

const CATALOGUE = Array.from({ length: 109 }, (_, i) => ({ template_id: `t${i}`, name: `T${i}` }));

function query(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] || '');
}

// develop2's list_templates: only `category`; every template, total = len.
function develop2Server() {
  return Promise.resolve({ data: { templates: CATALOGUE, total: CATALOGUE.length, categories: [] } });
}

// careerbot-api #387's list_templates: offset/limit honoured, limit 12 by default, max 100.
function pr387Server(url: string) {
  const q = query(url);
  const limit = Number(q.get('limit') ?? 12);
  if (limit < 1 || limit > 100) return Promise.reject({ response: { status: 422 } });
  const offset = Number(q.get('offset') ?? 0);
  return Promise.resolve({
    data: { templates: CATALOGUE.slice(offset, offset + limit), total: CATALOGUE.length, offset, limit, categories: [] },
  });
}

describe('getTemplatesByCategory', () => {
  beforeEach(() => { mockGet.mockReset(); });

  it('returns every template as an array against develop2\'s api', async () => {
    mockGet.mockImplementation(develop2Server);
    const result = await getTemplatesByCategory();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(109);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('returns every template, in order, against #387\'s paginated api', async () => {
    mockGet.mockImplementation(pr387Server);
    const result = await getTemplatesByCategory();
    expect(Array.isArray(result)).toBe(true);
    expect(result.map((t) => t.template_id)).toEqual(CATALOGUE.map((t) => t.template_id));
  });

  it('keeps the callers\' array operations working (TemplatesTab / useTemplateRedirect)', async () => {
    mockGet.mockImplementation(pr387Server);
    const all = await getTemplatesByCategory();
    expect(all.filter((t) => t.name === 'T105')).toHaveLength(1);
  });

  it('still accepts a bare array and the `data` wrapper', async () => {
    mockGet.mockResolvedValueOnce({ data: CATALOGUE.slice(0, 3) });
    expect(await getTemplatesByCategory()).toHaveLength(3);
    mockGet.mockResolvedValueOnce({ data: { data: CATALOGUE.slice(0, 2) } });
    expect(await getTemplatesByCategory()).toHaveLength(2);
  });

  it('sends a domain family filter as `domain_family`', async () => {
    mockGet.mockImplementation(pr387Server);
    await getTemplatesByCategory('software_engineering');
    expect(query(mockGet.mock.calls[0][0]).get('domain_family')).toBe('software_engineering');
    expect(query(mockGet.mock.calls[0][0]).get('category')).toBeNull();
  });

  it('stops on an empty page even when `total` overstates the list', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { templates: CATALOGUE.slice(0, 100), total: 500 } })
      .mockResolvedValueOnce({ data: { templates: [], total: 500 } });
    const result = await getTemplatesByCategory();
    expect(result).toHaveLength(100);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
