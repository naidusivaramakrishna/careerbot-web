/**
 * PR #96 ai-review (f0a7d952) P2 — the career-level cards moved from
 * `<Image src={resolveTemplateImageUrl(template.preview_url) || domainFallback}>`
 * (develop2) to TemplatePreviewRenderer with `fallbackImage={domainFallback}`,
 * so a template without preview_html/preview_css (both optional in the list
 * payload, careerbot-api TemplateOut) showed the generic domain image instead
 * of its own preview_url.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn().mockResolvedValue(null) }));
vi.mock('@/api/resumeApi', () => ({
  getAllResumes: vi.fn().mockResolvedValue([]),
  createResumeWithAuth: vi.fn().mockResolvedValue({ id: 'new-resume' }),
  applyTemplateToResume: vi.fn().mockResolvedValue({}),
}));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import DomainTemplatesModal from '@/app/(resume)/templates/_components/DomainTemplatesModal';

const TEMPLATES = [
  { id: 't-fresher', _id: 't-fresher', name: 'Healthcare Fresher Template', preview_url: '/assets/templates/hc-fresher.png', description: 'd' },
  { id: 't-mid', _id: 't-mid', name: 'Healthcare Mid-Level Template', preview_url: '/assets/templates/hc-mid.png', description: 'd' },
];

const cardImage = (index: number) =>
  within(screen.getByTestId(`career-level-btn-${index}`)).getByRole('img') as HTMLImageElement;

describe('DomainTemplatesModal career-level thumbnails', () => {
  const renderModal = () =>
    render(
      <DomainTemplatesModal
        domainName="Healthcare"
        domainFamily="healthcare"
        templates={TEMPLATES as never}
        onClose={vi.fn()}
      />,
    );

  it("shows each level's own preview_url when it has no preview HTML", () => {
    renderModal();
    expect(cardImage(0).getAttribute('src')).toBe('/assets/templates/hc-fresher.png');
    expect(cardImage(1).getAttribute('src')).toBe('/assets/templates/hc-mid.png');
  });

  it('falls back to the domain image when the preview_url fails to load', () => {
    renderModal();
    fireEvent.error(cardImage(1));
    expect(cardImage(1).getAttribute('src')).toBe('/assets/templates/healthcare.png');
  });
});
