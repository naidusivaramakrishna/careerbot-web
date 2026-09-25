/**
 * PR #96 ai-review (58ef79ee) P2 — CatalogueTab persisted the catalogue with a
 * raw fetch() on every click AND on every mouse-leave, unordered, so fast
 * clicks could land on the server out of order.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    setResumeStyle: vi.fn(),
    sectionOrder: [],
    setSectionOrder: vi.fn(),
    setPreviewCatalogueKey: vi.fn(),
    resumeId: 'r1',
  }),
}));
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: ({ catalogueKey }: { catalogueKey: string }) =>
    React.createElement('div', { 'data-testid': `thumbnail-${catalogueKey}` }),
  CATALOGUE_PALETTES: {},
  CODE_THUMBNAIL_CATALOGUES: new Set<string>(),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy: { label: 'Galaxy', swatches: ['#111'], style: { fontFamily: 'arial' } },
    ocean: { label: 'Ocean', swatches: ['#222'], style: { fontFamily: 'arial' } },
  },
}));
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({ catalogues: [], loading: false, error: null, getCatalogue: vi.fn(), getCataloguesMap: () => ({}) }),
}));
const { mockApply } = vi.hoisted(() => ({ mockApply: vi.fn() }));
vi.mock('@/api/resumeApi', () => ({
  applyCatalogueToResume: (...args: unknown[]) => mockApply(...args),
}));

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('CatalogueTab catalogue persistence', () => {
  it('persists via applyCatalogueToResume on click, not on mouse-leave, and in click order', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    const resolvers: Array<() => void> = [];
    mockApply.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));

    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('catalogue-card-ocean'));
    fireEvent.click(screen.getByTestId('catalogue-card-galaxy'));
    fireEvent.mouseLeave(screen.getByTestId('catalogue-card-galaxy'));

    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
    expect(mockApply).toHaveBeenLastCalledWith('r1', 'ocean');
    // The second click waits for the first request to finish.
    await act(async () => { resolvers[0](); });
    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
    expect(mockApply).toHaveBeenLastCalledWith('r1', 'galaxy');
    await act(async () => { resolvers[1](); });
    // Mouse-leave only restores the selected style locally.
    expect(mockApply).toHaveBeenCalledTimes(2);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
