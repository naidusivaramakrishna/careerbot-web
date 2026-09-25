/**
 * PR #96 — CatalogueTab switched to `useCatalogues()` data when the API
 * returns catalogues. The API shape (careerbot-api
 * app/db/seeds/data/catalogues.json) has typography/colors/styling but no
 * `style`, so `{ ...cat.style }` applied nothing: font and spacing of the
 * chosen catalogue were silently dropped. tsc flags it too
 * (TS2339 "Property 'style' does not exist on type CatalogueConfig").
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockSetResumeStyle = vi.fn();
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({ setResumeStyle: mockSetResumeStyle }),
}));

vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: ({ catalogueKey }: { catalogueKey: string }) =>
    React.createElement('div', { 'data-testid': `thumbnail-${catalogueKey}` }),
  CATALOGUE_PALETTES: {},
  CODE_THUMBNAIL_CATALOGUES: new Set<string>(),
}));

vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    classic: { label: 'Classic', swatches: ['#1A1A1A'], style: { fontFamily: 'times new roman', lineSpacing: '1.3' } },
  },
}));

// API-shaped catalogue, as returned by GET /templates/catalogues/all
const apiCatalogue = {
  key: 'classic',
  label: 'Classic (API)',
  description: 'd',
  preview_url: '',
  template_id: 'classic',
  header_layout: 'centered',
  ats_level: 'safe',
  default_color: '#000000',
  color_palette: [],
  accent_swatches: ['#1A1A1A'],
  typography: { font_family: 'Times New Roman', name_font_size: '', heading_font_size: '', body_font_size: '', line_spacing: '1.3' },
  colors: { heading: '#000', body: '#000', accent: '#000' },
  styling: {},
};
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({
    catalogues: [apiCatalogue],
    loading: false,
    error: null,
    getCatalogue: () => apiCatalogue,
    getCataloguesMap: () => ({ classic: apiCatalogue }),
  }),
}));

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

describe('CatalogueTab with API catalogues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('still applies the catalogue font and line spacing', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-classic'));
    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    expect(result.fontFamily).toBe('times new roman');
    expect(result.lineSpacing).toBe('1.3');
  });
});
