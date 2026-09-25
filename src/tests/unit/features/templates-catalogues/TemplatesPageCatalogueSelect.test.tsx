/**
 * PR #96 ai-review (1a8259c1) P2: choosing a style on /templates POSTed the
 * catalogue to `localStorage.current_resume_id` (whichever resume was opened
 * last) when the page had no ?resumeId, and unlike CatalogueTab did not
 * order fast clicks. The page says the style "will apply automatically when
 * you open the builder" (the builder reads `selected_catalogue`), so without
 * ?resumeId the choice stays local, as on develop2.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

const { params } = vi.hoisted(() => ({ params: { value: new URLSearchParams() } }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => params.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
const { mockApply } = vi.hoisted(() => ({ mockApply: vi.fn() }));
vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: vi.fn().mockResolvedValue([]),
  getTemplateCategories: vi.fn().mockResolvedValue([]),
  applyCatalogueToResume: (...args: unknown[]) => mockApply(...args),
}));
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({ catalogues: [], loading: false, error: null, getCatalogue: vi.fn(), getCataloguesMap: () => ({}) }),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy: { label: 'Galaxy', swatches: ['#111'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
    ocean: { label: 'Ocean', swatches: ['#222'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
  },
  CATALOGUE_LAYOUT_MAP: {},
}));
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: () => null,
  CATALOGUE_PALETTES: {},
  CODE_THUMBNAIL_CATALOGUES: new Set<string>(),
}));
vi.mock('@/app/(resume)/templates/_components/CategorySidebar', () => ({ default: () => null }));
vi.mock('@/app/(resume)/templates/_components/DomainTemplatesModal', () => ({ default: () => null }));
vi.mock('@/app/(resume)/templates/_components/DomainCard', () => ({ default: () => null }));
vi.mock('@/app/(resume)/templates/Template1', () => ({ default: () => null }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import TemplatesPage from '@/app/(resume)/templates/page';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockApply.mockResolvedValue(undefined);
});

describe('/templates style selection', () => {
  it('does not write to the last-opened resume when the page has no ?resumeId', async () => {
    params.value = new URLSearchParams();
    window.localStorage.setItem('current_resume_id', 'last-opened');
    render(<TemplatesPage />);
    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    await act(async () => {});
    expect(window.localStorage.getItem('selected_catalogue')).toBe('ocean');
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('applies to the ?resumeId resume, in click order', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    window.localStorage.setItem('current_resume_id', 'last-opened');
    const resolvers: Array<() => void> = [];
    mockApply.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));
    render(<TemplatesPage />);

    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    fireEvent.click(screen.getByTestId('catalogue-card-galaxy'));
    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
    // The second request waits for the first.
    expect(mockApply).toHaveBeenLastCalledWith('r9', 'ocean');
    await act(async () => { resolvers[0](); });
    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
    expect(mockApply).toHaveBeenLastCalledWith('r9', 'galaxy');
  });
});
