/**
 * /browse-templates/[family]/[domain] was a public template-detail page
 * (middleware publicRoutes: '/browse-templates' and its sub-paths). PR #90
 * replaced /browse-templates with a static page and deleted the detail route,
 * so bookmarked or indexed detail URLs must land on /browse-templates instead
 * of a 404.
 */
import { describe, it, expect, vi } from 'vitest';

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe('/browse-templates/[family]/[domain]', () => {
  it('redirects to /browse-templates', async () => {
    const { default: LegacyTemplateDetailPage } = await import(
      '@/app/browse-templates/[family]/[domain]/page'
    );
    LegacyTemplateDetailPage();
    expect(mockRedirect).toHaveBeenCalledWith('/browse-templates');
  });
});
