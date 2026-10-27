/**
 * Style & Layout tab: the new design's controls (font size, page margin, section spacing, content alignment),
 * their persistence, and the query string the preview / export requests send for them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { appendLayoutParams } from '@/api/layoutOptions';

const mockSetResumeStyle = vi.fn();

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({ setResumeStyle: mockSetResumeStyle, resumeStyle: {} }),
}));
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: () => React.createElement('div'),
  CATALOGUE_PALETTES: {},
  CODE_THUMBNAIL_CATALOGUES: new Set(),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: { classic: { label: 'Classic', swatches: ['#1A1A1A'], style: { fontFamily: 'arial' } } },
}));

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

const lastStyleUpdate = (prev: object = {}) =>
  (mockSetResumeStyle.mock.calls.at(-1)![0] as (p: object) => Record<string, unknown>)(prev);

describe('Style & Layout controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows the new page: typography, colour theme and layout, with no page-format or skills-order controls', () => {
    render(<CatalogueTab />);
    expect(screen.getByText('Customize the look and feel')).toBeInTheDocument();
    for (const label of ['Font Family', 'Font Size', 'Line Spacing', 'Page Margin', 'Section Spacing', 'Content Alignment']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText('Page Format')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills before Experience')).not.toBeInTheDocument();
    expect(screen.getByText('Choose a Style')).toBeInTheDocument();
  });

  it.each([
    ['Font Size', '11', 'fontSize', 'selected_font_size'],
    ['Page Margin', 'wide', 'pageMargin', 'selected_page_margin'],
    ['Section Spacing', 'relaxed', 'sectionSpacing', 'selected_section_spacing'],
    ['Content Alignment', 'center', 'alignment', 'selected_alignment'],
  ])('%s: updates the style and is remembered', (label, value, styleKey, storageKey) => {
    render(<CatalogueTab />);
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

    expect(lastStyleUpdate({ fontFamily: 'arial' })).toEqual({ fontFamily: 'arial', [styleKey]: value });
    expect(window.localStorage.getItem(storageKey)).toBe(value);
  });

  it('choosing the template default clears the setting again', () => {
    window.localStorage.setItem('selected_alignment', 'right');
    render(<CatalogueTab />);
    fireEvent.change(screen.getByLabelText('Content Alignment'), { target: { value: '' } });

    expect(lastStyleUpdate({ alignment: 'right' }).alignment).toBeUndefined();
    expect(window.localStorage.getItem('selected_alignment')).toBeNull();
  });

  it('keeps the saved layout settings when a catalogue style is applied', () => {
    window.localStorage.setItem('selected_page_margin', 'narrow');
    render(<CatalogueTab />);
    fireEvent.click(screen.getByTestId('catalogue-card-classic'));

    expect(lastStyleUpdate().pageMargin).toBe('narrow');
  });
});

describe('appendLayoutParams', () => {
  it('adds only the settings that are set, under the names the backend reads', () => {
    const params = new URLSearchParams({ format: 'png' });
    appendLayoutParams(params, { fontSize: '11', pageMargin: 'wide', alignment: undefined });
    expect(params.toString()).toBe('format=png&font_size=11&page_margin=wide');
  });

  it('does nothing without settings', () => {
    const params = new URLSearchParams({ format: 'pdf' });
    appendLayoutParams(params, undefined);
    appendLayoutParams(params, {});
    expect(params.toString()).toBe('format=pdf');
  });
});
