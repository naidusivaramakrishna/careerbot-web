/**
 * PR #96 ai-review (f0a7d952) P2 — the style grids list the keys from
 * GET /templates/catalogues/all, but the builder style, the /templates
 * previews and the export's catalogue template_id all come from the local
 * STYLE_CATALOGUES. A key the API has and STYLE_CATALOGUES lacks could be
 * picked but would apply an empty style (CatalogueTab), render as galaxy
 * (/templates) and export without a catalogue (PreviewPanel). Today the API
 * serves the 10 seed keys, which are all local; the grids now list only keys
 * they can render, and fall back to the local list when none remain.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const { api } = vi.hoisted(() => ({ api: { keys: [] as string[] } }));
const apiCatalogue = (key: string) => ({
  key,
  label: `${key} (API)`,
  description: '',
  preview_url: '',
  template_id: key,
  header_layout: 'centered',
  ats_level: 'safe',
  default_color: '#000000',
  color_palette: [],
  accent_swatches: ['#123456'],
  typography: { font_family: 'Arial', name_font_size: '', heading_font_size: '', body_font_size: '', line_spacing: '1.4' },
  colors: { heading: '#000', body: '#000', accent: '#000' },
  styling: {},
});
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => {
    const catalogues = api.keys.map(apiCatalogue);
    return {
      catalogues,
      loading: false,
      error: null,
      getCatalogue: vi.fn(),
      getCataloguesMap: () => Object.fromEntries(catalogues.map((c) => [c.key, c])),
    };
  },
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy: { label: 'Galaxy', swatches: ['#111'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
    ocean: { label: 'Ocean', swatches: ['#222'], style: { fontFamily: 'arial' }, template_id: 'compact_professional' },
  },
  CATALOGUE_LAYOUT_MAP: {},
}));
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    setResumeStyle: vi.fn(),
    sectionOrder: [],
    setSectionOrder: vi.fn(),
    setPreviewCatalogueKey: vi.fn(),
    resumeId: null,
  }),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: vi.fn().mockResolvedValue([]),
  getTemplateCategories: vi.fn().mockResolvedValue([]),
  applyCatalogueToResume: vi.fn().mockResolvedValue(undefined),
  applyCatalogueToEnhancedResume: vi.fn().mockResolvedValue(undefined),
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

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';
import TemplatesPage from '@/app/(resume)/templates/page';

beforeEach(() => {
  window.localStorage.clear();
});

describe.each([
  ['builder CatalogueTab', () => render(<CatalogueTab />)],
  ['/templates page', () => render(<TemplatesPage />)],
])('%s with API catalogues', (_name, renderGrid) => {
  it('lists only API keys that have a local style', async () => {
    api.keys = ['galaxy', 'nova'];
    renderGrid();
    expect(await screen.findByTestId('catalogue-card-galaxy')).toBeInTheDocument();
    expect(screen.queryByTestId('catalogue-card-nova')).not.toBeInTheDocument();
    // The API list is still the source: ocean is local-only.
    expect(screen.queryByTestId('catalogue-card-ocean')).not.toBeInTheDocument();
  });

  it('falls back to the local catalogues when no API key has a local style', async () => {
    api.keys = ['nova'];
    renderGrid();
    expect(await screen.findByTestId('catalogue-card-galaxy')).toBeInTheDocument();
    expect(screen.getByTestId('catalogue-card-ocean')).toBeInTheDocument();
    expect(screen.queryByTestId('catalogue-card-nova')).not.toBeInTheDocument();
  });
});
