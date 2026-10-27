/**
 * Style & Layout tab with no style (catalogue) chosen, e.g. right after a career-level template was
 * applied (that removes selected_catalogue). The Color Theme buttons and hovering the style cards
 * must not apply or save a style the user never picked; the layout settings are kept per user.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockSetResumeStyle = vi.fn();
const mockPersist = vi.fn();
const ctx = vi.hoisted(() => ({ resumeStyle: {} as Record<string, unknown> }));

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ({
    setResumeStyle: mockSetResumeStyle,
    setPreviewCatalogueKey: vi.fn(),
    resumeStyle: ctx.resumeStyle,
    resumeId: 'resume-1',
    resumeSource: 'normal',
  }),
}));
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: () => React.createElement('div'),
  CATALOGUE_PALETTES: {},
  CODE_THUMBNAIL_CATALOGUES: new Set(),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy: { label: 'Galaxy', swatches: ['#000'], style: { fontFamily: 'georgia', headingColor: '#5b21b6' } },
    classic: { label: 'Classic', swatches: ['#1A1A1A'], style: { fontFamily: 'garamond', headingColor: '#1A1A1A' } },
  },
}));
vi.mock('@/app/(resume)/templates/_utils/cataloguePersister', () => ({
  createCataloguePersister: () => mockPersist,
}));

import CatalogueTab from '@/app/(resume)/builder/creation/_components/templates/CatalogueTab';

const styleAfter = (prev: object = {}) =>
  mockSetResumeStyle.mock.calls.reduce(
    (acc, [arg]) => (typeof arg === 'function' ? (arg as (p: object) => object)(acc) : arg),
    prev,
  ) as Record<string, unknown>;

describe('Color Theme with no style chosen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    ctx.resumeStyle = {};
  });

  it('sets only the accent colour: no style is applied, saved or sent to the backend', () => {
    render(<CatalogueTab />);
    fireEvent.click(screen.getByRole('radio', { name: 'Green' }));

    const after = styleAfter({ fontFamily: 'arial', headingColor: '#1A1A1A' });
    expect(after).toEqual({ fontFamily: 'arial', headingColor: '#1A1A1A', accentColor: '#1f9d55' });
    expect(window.localStorage.getItem('selected_catalogue')).toBeNull();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('control: with a saved style, the colour is applied to that style and the style is saved', () => {
    window.localStorage.setItem('selected_catalogue', 'classic');
    render(<CatalogueTab />);
    fireEvent.click(screen.getByRole('radio', { name: 'Green' }));

    expect(styleAfter()).toMatchObject({ fontFamily: 'garamond', accentColor: '#1f9d55' });
    expect(window.localStorage.getItem('selected_catalogue')).toBe('classic');
    expect(mockPersist).toHaveBeenCalledWith('resume-1', 'classic', false);
  });

  it('marks no colour as active when the style has no accent colour', () => {
    render(<CatalogueTab />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('aria-checked', 'false');
  });

  it('hovering a style card and leaving it restores the look from before the hover (no Galaxy)', () => {
    ctx.resumeStyle = { fontFamily: 'arial', headingColor: '#1A1A1A' };
    render(<CatalogueTab />);
    const card = screen.getByTestId('catalogue-card-classic');
    fireEvent.mouseEnter(card);
    expect(styleAfter(ctx.resumeStyle)).toMatchObject({ fontFamily: 'garamond' });
    fireEvent.mouseLeave(card);

    expect(styleAfter(ctx.resumeStyle)).toEqual({ fontFamily: 'arial', headingColor: '#1A1A1A' });
    expect(window.localStorage.getItem('selected_catalogue')).toBeNull();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('a later hover restores the current look, not the one from an earlier hover', () => {
    ctx.resumeStyle = { fontFamily: 'arial' };
    const view = render(<CatalogueTab />);
    const card = screen.getByTestId('catalogue-card-classic');
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    // the look changes elsewhere (e.g. the resume finished loading its template style)
    ctx.resumeStyle = { fontFamily: 'helvetica', headingColor: '#222222' };
    view.rerender(<CatalogueTab />);
    mockSetResumeStyle.mockClear();
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    expect(styleAfter(ctx.resumeStyle)).toEqual({ fontFamily: 'helvetica', headingColor: '#222222' });
  });

  it('control: with a saved style, leaving a card shows the saved style again', () => {
    window.localStorage.setItem('selected_catalogue', 'classic');
    render(<CatalogueTab />);
    const card = screen.getByTestId('catalogue-card-galaxy');
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);
    expect(styleAfter()).toMatchObject({ fontFamily: 'garamond' });
  });

  it('offers font size 8, the smallest size the preview and export accept', () => {
    render(<CatalogueTab />);
    const sizes = Array.from((screen.getByLabelText('Font Size') as HTMLSelectElement).options).map((o) => o.value);
    expect(sizes).toContain('8');
  });
});

describe('Layout settings are kept per user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    ctx.resumeStyle = {};
  });

  it('saves a layout setting under the signed-in user', () => {
    window.localStorage.setItem('userEmail', 'a@example.com');
    render(<CatalogueTab />);
    fireEvent.change(screen.getByLabelText('Page Margin'), { target: { value: 'wide' } });

    expect(window.localStorage.getItem('selected_page_margin_a@example.com')).toBe('wide');
    expect(window.localStorage.getItem('selected_page_margin')).toBeNull();
  });

  it("does not show or apply another account's layout settings", () => {
    window.localStorage.setItem('userEmail', 'a@example.com');
    const first = render(<CatalogueTab />);
    fireEvent.change(screen.getByLabelText('Page Margin'), { target: { value: 'wide' } });
    fireEvent.change(screen.getByLabelText('Content Alignment'), { target: { value: 'center' } });
    first.unmount();

    // another account signs in on the same browser
    window.localStorage.setItem('userEmail', 'b@example.com');
    window.localStorage.setItem('selected_catalogue', 'classic');
    mockSetResumeStyle.mockClear();
    render(<CatalogueTab />);

    expect((screen.getByLabelText('Page Margin') as HTMLSelectElement).value).toBe('normal');
    expect((screen.getByLabelText('Content Alignment') as HTMLSelectElement).value).toBe('');
    fireEvent.click(screen.getByTestId('catalogue-card-classic'));
    const after = styleAfter();
    expect(after.pageMargin).toBeUndefined();
    expect(after.alignment).toBeUndefined();
  });

  it("control: the user's own saved settings are shown and kept when a style is applied", () => {
    window.localStorage.setItem('userEmail', 'b@example.com');
    window.localStorage.setItem('selected_page_margin_b@example.com', 'narrow');
    render(<CatalogueTab />);

    expect((screen.getByLabelText('Page Margin') as HTMLSelectElement).value).toBe('narrow');
    fireEvent.click(screen.getByTestId('catalogue-card-classic'));
    expect(styleAfter().pageMargin).toBe('narrow');
  });
});
