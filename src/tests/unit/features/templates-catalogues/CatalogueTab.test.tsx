/**
 * Component tests for CatalogueTab — the style picker panel in the resume builder.
 *
 * Covers:
 *   - Renders "Choose a Style" heading and all catalogue labels
 *   - "Galaxy" is selected by default (localStorage returns nothing)
 *   - Non-colour-picker catalogues show "Mono" instead of swatches
 *   - Clicking a catalogue card calls setResumeStyle and saves to localStorage
 *   - Galaxy/Ocean/Amber/Ember type: headingColor is always dark (#1A1A1A)
 *   - Eclipse type: sectionHeaderBg is set from the palette; accentColor is cleared
 *   - Classic/other type: setResumeStyle is called (no accentColor contamination)
 *   - Clicking a colour swatch saves the colour and applies the catalogue
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Context mock ─────────────────────────────────────────────────────────────
const mockSetResumeStyle = vi.fn();

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({ setResumeStyle: mockSetResumeStyle }),
}));

// ─── CatalogueThumbnail mock ──────────────────────────────────────────────────
// Renders a simple div so ScaledThumbnail (a local wrapper) gets the testid.
// Click events bubble up from the testid div to the parent card's onClick handler.
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: ({ catalogueKey }: { catalogueKey: string }) =>
    React.createElement('div', { 'data-testid': `thumbnail-${catalogueKey}` }),
  CATALOGUE_PALETTES: {
    galaxy:  { palette: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'], defaultColor: '#ff0000' },
    eclipse: { palette: ['#111111', '#222222', '#333333', '#444444', '#555555'], defaultColor: '#111111' },
    ocean:   { palette: ['#0369a1', '#0c4a6e', '#1e40af', '#1d4ed8', '#2563eb'], defaultColor: '#0369a1' },
  },
  CODE_THUMBNAIL_CATALOGUES: new Set(['galaxy', 'eclipse', 'ocean']),
}));

// ─── STYLE_CATALOGUES mock ────────────────────────────────────────────────────
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy:  { label: 'Galaxy',  swatches: ['#1a1a1a', '#4b5563'], style: { fontFamily: 'arial',            headingColor: '#1a1a1a' } },
    eclipse: { label: 'Eclipse', swatches: ['#ececec', '#d1d5db'], style: { fontFamily: 'helvetica',        sectionHeaderBg: '#ececec' } },
    ocean:   { label: 'Ocean',   swatches: ['#0369a1', '#0c4a6e'], style: { fontFamily: 'arial',            headingColor: '#0369a1' } },
    classic: { label: 'Classic', swatches: ['#1A1A1A', '#4b5563'], style: { fontFamily: 'times new roman',  headingColor: '#1A1A1A', bodyColor: '#4b5563' } },
  },
}));

// ─── Component under test ─────────────────────────────────────────────────────
import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CatalogueTab — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "Choose a Style" heading', () => {
    render(<CatalogueTab />);
    expect(screen.getByText('Choose a Style')).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<CatalogueTab />);
    expect(screen.getByText(/select a colour theme/i)).toBeInTheDocument();
  });

  it('renders all catalogue labels', () => {
    render(<CatalogueTab />);
    expect(screen.getByText('Galaxy')).toBeInTheDocument();
    expect(screen.getByText('Eclipse')).toBeInTheDocument();
    expect(screen.getByText('Ocean')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
  });

  it('"Galaxy" label is blue (selected) by default', () => {
    // localStorage.getItem returns undefined → selectedKey defaults to "galaxy"
    render(<CatalogueTab />);
    const galaxyLabel = screen.getByText('Galaxy');
    expect(galaxyLabel.className).toContain('text-[#2257a7]');
  });

  it('"Classic" label is NOT blue initially', () => {
    render(<CatalogueTab />);
    const classicLabel = screen.getByText('Classic');
    expect(classicLabel.className).toContain('text-slate-700');
    expect(classicLabel.className).not.toContain('text-[#2257a7]');
  });

  it('shows "Mono" text for catalogues that have no colour swatches', () => {
    // "classic" is not in CODE_THUMBNAIL_CATALOGUES → renders "Mono"
    render(<CatalogueTab />);
    expect(screen.getByText('Mono')).toBeInTheDocument();
  });

  it('renders colour swatch buttons for colour-picker catalogues', () => {
    render(<CatalogueTab />);
    // Ocean swatch: aria-label="Select colour #0369a1"
    expect(screen.getByLabelText('Select colour #0369a1')).toBeInTheDocument();
  });
});

describe('CatalogueTab — catalogue selection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking the Ocean card calls setResumeStyle once', () => {
    render(<CatalogueTab />);
    // Clicks on the thumbnail bubble up to the parent card's onClick handler
    fireEvent.click(screen.getByTestId('thumbnail-ocean'));
    expect(mockSetResumeStyle).toHaveBeenCalledTimes(1);
  });

  it('clicking a catalogue saves its key to localStorage', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-eclipse'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_catalogue', 'eclipse');
  });

  it('clicking the Classic card calls setResumeStyle once', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-classic'));
    expect(mockSetResumeStyle).toHaveBeenCalledTimes(1);
  });

  it('ocean (galaxy-type): headingColor is "#1A1A1A" and accentColor is the palette default', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-ocean'));

    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    expect(result.headingColor).toBe('#1A1A1A');
    expect(result.accentColor).toBe('#0369a1'); // ocean palette defaultColor
  });

  it('galaxy (galaxy-type): headingColor is "#1A1A1A" and accentColor is the palette default', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-galaxy'));

    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    expect(result.headingColor).toBe('#1A1A1A');
    expect(result.accentColor).toBe('#ff0000'); // galaxy palette defaultColor
  });

  it('eclipse: sectionHeaderBg is set to the palette default and accentColor is undefined', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-eclipse'));

    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    expect(result.sectionHeaderBg).toBe('#111111'); // eclipse palette defaultColor
    expect(result.accentColor).toBeUndefined();
  });

  it('eclipse: saves section bg to localStorage as "selected_section_bg"', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-eclipse'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_section_bg', '#111111');
  });

  it('classic (non-colour-picker): setResumeStyle updater does not set accentColor', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('thumbnail-classic'));

    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    // classic has no palette entry → accent is undefined → accentColor stays cleared
    expect(result.accentColor).toBeUndefined();
  });
});

describe('CatalogueTab — colour swatch selection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking a colour swatch saves "selected_color_<catalogue>" to localStorage', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByLabelText('Select colour #0369a1'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_color_ocean', '#0369a1');
  });

  it('clicking a colour swatch calls setResumeStyle with that colour as accentColor', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByLabelText('Select colour #0369a1'));

    const updater = mockSetResumeStyle.mock.calls[0][0] as (prev: object) => Record<string, unknown>;
    const result = updater({});
    expect(result.accentColor).toBe('#0369a1');
    expect(result.headingColor).toBe('#1A1A1A'); // ocean is galaxy-type → heading stays dark
  });

  it('clicking a second swatch changes the selected colour', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByLabelText('Select colour #0c4a6e'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_color_ocean', '#0c4a6e');
  });

  it('eclipse swatch click stores the colour as "selected_section_bg"', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByLabelText('Select colour #111111'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_section_bg', '#111111');
  });
});
