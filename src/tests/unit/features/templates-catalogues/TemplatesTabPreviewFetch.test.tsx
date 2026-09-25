/**
 * PR #96 ai-review (58ef79ee) P2 — TemplatesTab fetched GET /templates/{id}
 * for every career card on every mount: the enrichment cache lived in a ref
 * (per mount) and the fetched preview_html/preview_css were never stored.
 * The enrichment result was also set on an unmounted component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import React from 'react';

const { mockGetProfile, mockGetTemplateById } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
  mockGetTemplateById: vi.fn(),
}));
vi.mock('@/api/userApi', () => ({ getProfile: () => mockGetProfile() }));
vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: vi.fn().mockResolvedValue([]),
  applyTemplateToResume: vi.fn(),
  getTemplateCategories: vi.fn().mockResolvedValue(['All']),
  getTemplateById: (id: string) => mockGetTemplateById(id),
}));
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    selectedTemplate: null,
    setSelectedTemplate: vi.fn(),
    setResumeStyle: vi.fn(),
    setSectionOrder: vi.fn(),
    sectionOrder: [],
    previewCatalogueKey: null,
  }),
}));
vi.mock('@/app/(resume)/templates/_utils/domainSectionOrder', () => ({
  getSectionOrderByDomainAndCareer: () => ['Skills'],
}));
vi.mock('@/app/(resume)/templates/_constants/templateImages', () => ({
  DOMAIN_FAMILY_IMAGES: {},
  FALLBACK_TEMPLATE_IMAGE: '/fallback.jpg',
}));
vi.mock('@/lib/imageUtils', () => ({ resolveTemplateImageUrl: (url: string) => url }));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  TEMPLATE_DEFAULT_STYLES: {},
  STYLE_CATALOGUES: {},
}));
vi.mock('@/app/(resume)/builder/creation/_components/templates/CatalogueTab', () => ({
  default: () => null,
}));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import TemplatesTab from '@/app/(resume)/builder/creation/_components/templates/TemplatesTab';

const EMAIL = 'test@example.com';
const LEVELS = ['se-ec', 'se-ml'].map((id) => ({
  id,
  name: `Software Engineering - ${id === 'se-ec' ? 'Early Career' : 'Mid-Level'}`,
  preview_url: `/${id}.jpg`,
  subtitle: 'Template',
  domain_family: 'software_engineering',
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockGetProfile.mockResolvedValue({ email: EMAIL });
  mockGetTemplateById.mockImplementation(async (id: string) => ({
    id,
    preview_html: `<p>${id}</p>`,
    preview_css: 'p{}',
  }));
  window.localStorage.setItem('userEmail', EMAIL);
  window.localStorage.setItem(`selectedTemplateId_${EMAIL}`, 'se-ec');
  window.localStorage.setItem(`careerLevelTemplates_${EMAIL}`, JSON.stringify(LEVELS));
});

describe('TemplatesTab career card previews', () => {
  it('fetches each missing preview once, then reuses it on the next mount', async () => {
    const first = render(<TemplatesTab resumeId="r1" />);
    await waitFor(() => expect(mockGetTemplateById).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(window.localStorage.getItem(`careerLevelTemplates_${EMAIL}`)).toContain('preview_html'),
    );
    first.unmount();

    render(<TemplatesTab resumeId="r1" />);
    await screen.findAllByTitle(/Early Career|Mid-Level/);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGetTemplateById).toHaveBeenCalledTimes(2);
  });

  it('does not fetch a preview the stored card already carries', async () => {
    const withPreview = LEVELS.map((l) => ({ ...l, preview_html: '<p/>', preview_css: 'p{}' }));
    window.localStorage.setItem(`careerLevelTemplates_${EMAIL}`, JSON.stringify(withPreview));
    render(<TemplatesTab resumeId="r1" />);
    await screen.findAllByTitle(/Early Career|Mid-Level/);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGetTemplateById).not.toHaveBeenCalled();
  });
});
