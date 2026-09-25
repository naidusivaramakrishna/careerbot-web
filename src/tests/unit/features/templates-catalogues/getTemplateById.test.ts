/**
 * PR #96 — TemplatesTab imports getTemplateById from @/api/resumeApi, which
 * did not exist on the PR head (cc916e25). It must call the backend's
 * GET /api/v1/templates/{template_id} (careerbot-api
 * app/api/v1/endpoints/templates.py `get_template`), whose TemplateOut
 * response carries preview_html / preview_css.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
vi.mock('@/lib/http', () => ({
  httpClient: { get: (...args: unknown[]) => mockGet(...args) },
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import * as resumeApi from '@/api/resumeApi';

describe('getTemplateById', () => {
  beforeEach(() => mockGet.mockClear());

  it('GETs /templates/{id} and returns the template with preview html/css', async () => {
    mockGet.mockResolvedValue({
      data: { id: '691343f036780d3128eec4a9', name: 'SE - Early Career', preview_html: '<p>x</p>', preview_css: 'p{}' },
    });
    expect(typeof resumeApi.getTemplateById).toBe('function');
    const tpl = await resumeApi.getTemplateById('691343f036780d3128eec4a9');
    expect(mockGet).toHaveBeenCalledWith('/templates/691343f036780d3128eec4a9');
    expect(tpl.preview_html).toBe('<p>x</p>');
    expect(tpl.preview_css).toBe('p{}');
  });

  it('encodes the id into the path', async () => {
    mockGet.mockResolvedValue({ data: { id: 'a/b', name: 'n' } });
    await resumeApi.getTemplateById('a/b');
    expect(mockGet).toHaveBeenCalledWith('/templates/a%2Fb');
  });
});
