/**
 * PR #96 ai-review (f0a7d952) P2 — with `?source=enhanced` the builder's
 * resumeId is an enhanced-resume id, but CatalogueTab POSTed it to
 * /templates/catalogues/{id}/apply, which only looks in the `resumes`
 * collection (careerbot-api templates.py:736-752) and answers 404; the error
 * was only logged. Enhanced resumes persist `applied_catalogue` through
 * PATCH /resume/enhance/{id} (BulkUpdateEnhancedResumeRequest), which their
 * download reads back (resume_enhancer.py:1985).
 *
 * That PATCH also re-scores the resume, so clicks made while a request is in
 * flight collapse to the latest one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

const { ctx } = vi.hoisted(() => ({ ctx: { resumeId: 'e1', resumeSource: 'enhanced' as string | null } }));
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    setResumeStyle: vi.fn(),
    sectionOrder: [],
    setSectionOrder: vi.fn(),
    setPreviewCatalogueKey: vi.fn(),
    resumeId: ctx.resumeId,
    resumeSource: ctx.resumeSource,
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
    slate: { label: 'Slate', swatches: ['#333'], style: { fontFamily: 'arial' } },
  },
}));
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({ catalogues: [], loading: false, error: null, getCatalogue: vi.fn(), getCataloguesMap: () => ({}) }),
}));
const { mockApply, mockApplyEnhanced } = vi.hoisted(() => ({ mockApply: vi.fn(), mockApplyEnhanced: vi.fn() }));
vi.mock('@/api/resumeApi', () => ({
  applyCatalogueToResume: (...args: unknown[]) => mockApply(...args),
  applyCatalogueToEnhancedResume: (...args: unknown[]) => mockApplyEnhanced(...args),
}));

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  ctx.resumeId = 'e1';
  ctx.resumeSource = 'enhanced';
  mockApply.mockResolvedValue(undefined);
  mockApplyEnhanced.mockResolvedValue(undefined);
});

describe('CatalogueTab persistence for enhanced resumes', () => {
  it('persists through the enhanced-resume endpoint, never the regular one', async () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('catalogue-card-ocean'));
    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledWith('e1', 'ocean'));
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('keeps regular resumes on the regular endpoint', async () => {
    ctx.resumeId = 'r1';
    ctx.resumeSource = null;
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('catalogue-card-ocean'));
    await waitFor(() => expect(mockApply).toHaveBeenCalledWith('r1', 'ocean'));
    expect(mockApplyEnhanced).not.toHaveBeenCalled();
  });

  it('sends only the latest of the clicks made while a request is in flight', async () => {
    const resolvers: Array<() => void> = [];
    mockApplyEnhanced.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('catalogue-card-ocean'));
    fireEvent.click(screen.getByTestId('catalogue-card-galaxy'));
    fireEvent.click(screen.getByTestId('catalogue-card-slate'));

    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledTimes(1));
    expect(mockApplyEnhanced).toHaveBeenLastCalledWith('e1', 'ocean');
    await act(async () => { resolvers[0](); });
    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledTimes(2));
    expect(mockApplyEnhanced).toHaveBeenLastCalledWith('e1', 'slate');
    await act(async () => { resolvers[1](); });
    expect(mockApplyEnhanced).toHaveBeenCalledTimes(2);
  });
});
