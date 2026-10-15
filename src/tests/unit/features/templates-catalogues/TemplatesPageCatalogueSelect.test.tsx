/**
 * PR #96 ai-review (1a8259c1) P2: choosing a style on /templates POSTed the
 * catalogue to `localStorage.current_resume_id` (whichever resume was opened
 * last) when the page had no ?resumeId, and unlike CatalogueTab did not
 * order fast clicks. The page says the style "will apply automatically when
 * you open the builder" (the builder reads `selected_catalogue`), so without
 * ?resumeId the choice stays local, as on develop2.
 *
 * PR #96 ai-review (2817c0db) P2: with ?source=enhanced the ?resumeId is an
 * enhanced-resume id, but the page still used the regular catalogue endpoint
 * (404 for enhanced ids). It now shares CatalogueTab's persister.
 *
 * PR #227: a card click now opens a confirmation step ("Yes, Select").
 * PR #227 ai-review (da27bab1) P1: the confirm handlers also called
 * applyCatalogueToResume directly next to the persister -- a second write
 * that bypassed its enhanced routing and click ordering. Codex P2: Undo
 * reverted the style locally but left the resume saved with the undone one.
 * P1: the page fetched 12 templates per page from the server but paged the
 * grid by domain card, so a domain's career levels were split across pages
 * and its modal got a partial list.
 * PR #227 ai-review (a9b2b932) P2: Undo after a colour change on the same
 * catalogue kept the new colour (only the catalogue key was remembered).
 * Codex P2: a search matching only a template's name/subtitle/description
 * was dropped when grouping by domain. Codex P2: the industry search and its
 * "Try:" chips did nothing on the (default) Catalogues view.
 * Local ai-review (0c8e77cf) P2: confirming switches to the industry view,
 * but Undo was rendered only in the Catalogues view, so it was hidden right
 * after a choice. P3: Enter on the modal's focused Cancel button confirmed
 * (the window handler cancelled the button's own click). P3: the modal's
 * "Previous Selection" showed the last Undo snapshot, not the current style.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import React from 'react';

const { params } = vi.hoisted(() => ({ params: { value: new URLSearchParams() } }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => params.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
const { mockApply, mockApplyEnhanced, mockGetTemplates } = vi.hoisted(() => ({
  mockApply: vi.fn(), mockApplyEnhanced: vi.fn(), mockGetTemplates: vi.fn(),
}));
vi.mock('@/api/resumeApi', () => ({
  getTemplatesByCategory: (...args: unknown[]) => mockGetTemplates(...args),
  getTemplateCategories: vi.fn().mockResolvedValue([]),
  applyCatalogueToResume: (...args: unknown[]) => mockApply(...args),
  applyCatalogueToEnhancedResume: (...args: unknown[]) => mockApplyEnhanced(...args),
}));
vi.mock('@/hooks/useCatalogues', () => ({
  useCatalogues: () => ({ catalogues: [], loading: false, error: null, getCatalogue: vi.fn(), getCataloguesMap: () => ({}) }),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  STYLE_CATALOGUES: {
    galaxy: { label: 'Galaxy', description: 'g', swatches: ['#111'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
    ocean: { label: 'Ocean', description: 'o', swatches: ['#222'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
    slate: { label: 'Slate', description: 's', swatches: ['#333'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
    eclipse: { label: 'Eclipse', description: 'e', swatches: ['#444'], style: { fontFamily: 'arial' }, template_id: 'clean_simple' },
  },
  CATALOGUE_LAYOUT_MAP: {},
}));
vi.mock('@/app/browse-templates/_components/CatalogueThumbnail', () => ({
  default: () => null,
  CATALOGUE_PALETTES: { eclipse: { palette: ['#aaa111', '#bbb222'], defaultColor: '#aaa111' } },
  CODE_THUMBNAIL_CATALOGUES: new Set<string>(['eclipse']),
}));
vi.mock('@/app/(resume)/templates/_components/CategorySidebar', () => ({
  default: ({ onSelectCategory }: { onSelectCategory: (c: string) => void }) => (
    <div>
      <button data-testid="sidebar-Catalogues" onClick={() => onSelectCategory('Catalogues')} />
      <button data-testid="sidebar-All" onClick={() => onSelectCategory('All')} />
    </div>
  ),
}));
vi.mock('@/app/(resume)/templates/_components/DomainTemplatesModal', () => ({
  default: ({ templates }: { templates: unknown[] }) => <div data-testid="domain-modal">{templates.length}</div>,
}));
vi.mock('@/app/(resume)/templates/_components/DomainCard', () => ({
  default: ({ domainName, templateCount, onClick }: { domainName: string; templateCount: number; onClick: () => void }) => (
    <button data-testid={`domain-card-${domainName}`} onClick={onClick}>{templateCount}</button>
  ),
}));
vi.mock('@/app/(resume)/templates/Template1', () => ({ default: () => null }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TemplatesPage from '@/app/(resume)/templates/page';

async function choose(key: string) {
  fireEvent.click(await screen.findByTestId(`catalogue-card-${key}`));
  fireEvent.click(screen.getByText('Yes, Select'));
  await act(async () => {});
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockApply.mockResolvedValue(undefined);
  mockApplyEnhanced.mockResolvedValue(undefined);
  mockGetTemplates.mockResolvedValue([]);
});

describe('/templates style selection', () => {
  it('does not write to the last-opened resume when the page has no ?resumeId', async () => {
    params.value = new URLSearchParams();
    window.localStorage.setItem('current_resume_id', 'last-opened');
    render(<TemplatesPage />);
    await choose('ocean');
    expect(window.localStorage.getItem('selected_catalogue')).toBe('ocean');
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('applies nothing until the selection is confirmed, and nothing on cancel', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    render(<TemplatesPage />);
    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    await act(async () => {});
    expect(mockApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cancel'));
    await act(async () => {});
    expect(mockApply).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('selected_catalogue')).toBeNull();
  });

  it('applies to the ?resumeId resume once per confirmed choice, in order', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    window.localStorage.setItem('current_resume_id', 'last-opened');
    const resolvers: Array<() => void> = [];
    mockApply.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));
    render(<TemplatesPage />);

    await choose('ocean');
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    await choose('galaxy');
    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
    // The second request waits for the first.
    expect(mockApply).toHaveBeenLastCalledWith('r9', 'ocean');
    await act(async () => { resolvers[0](); });
    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
    expect(mockApply).toHaveBeenLastCalledWith('r9', 'galaxy');
    await act(async () => { resolvers[1](); });
    expect(mockApply).toHaveBeenCalledTimes(2);
  });

  it('persists an enhanced resume (?source=enhanced) through the enhanced-resume endpoint only', async () => {
    params.value = new URLSearchParams('resumeId=e1&source=enhanced');
    render(<TemplatesPage />);
    await choose('ocean');
    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledWith('e1', 'ocean'));
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('Undo saves the previous style on the ?resumeId resume too', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    render(<TemplatesPage />);
    await choose('ocean');
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith('r9', 'ocean'));
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    fireEvent.click(await screen.findByTitle('Undo to previous catalogue'));
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith('r9', 'galaxy'));
    expect(window.localStorage.getItem('selected_catalogue')).toBe('galaxy');
    // One step back: Undo is spent, so it cannot re-send the same save.
    expect(screen.queryByTitle('Undo to previous catalogue')).toBeNull();
  });

  it('Undo after a colour change on the same catalogue restores the previous colour', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    window.localStorage.setItem('selected_catalogue', 'eclipse');
    window.localStorage.setItem('selected_color_eclipse', '#aaa111');
    window.localStorage.setItem('selected_section_bg', '#aaa111');
    render(<TemplatesPage />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText('Select colour #bbb222'));
    fireEvent.click(screen.getByText('Yes, Select'));
    await act(async () => {});
    expect(window.localStorage.getItem('selected_color_eclipse')).toBe('#bbb222');
    expect(window.localStorage.getItem('selected_section_bg')).toBe('#bbb222');

    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    fireEvent.click(await screen.findByTitle('Undo to previous catalogue'));
    await act(async () => {});
    expect(window.localStorage.getItem('selected_catalogue')).toBe('eclipse');
    expect(window.localStorage.getItem('selected_color_eclipse')).toBe('#aaa111');
    expect(window.localStorage.getItem('selected_section_bg')).toBe('#aaa111');
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith('r9', 'eclipse'));
  });

  it('Undo after a colour pick on another catalogue restores both the style and that catalogue\'s colour', async () => {
    params.value = new URLSearchParams();
    render(<TemplatesPage />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText('Select colour #bbb222'));
    fireEvent.click(screen.getByText('Yes, Select'));
    await act(async () => {});
    expect(window.localStorage.getItem('selected_catalogue')).toBe('eclipse');
    expect(window.localStorage.getItem('selected_color_eclipse')).toBe('#bbb222');

    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    fireEvent.click(await screen.findByTitle('Undo to previous catalogue'));
    await act(async () => {});
    expect(window.localStorage.getItem('selected_catalogue')).toBe('galaxy');
    expect(window.localStorage.getItem('selected_color_eclipse')).toBeNull();
    expect(window.localStorage.getItem('selected_section_bg')).toBeNull();
  });

  it('sends only the latest of the enhanced-resume choices confirmed while a request is in flight', async () => {
    // Each enhanced PATCH re-scores the resume, as in CatalogueTab.
    params.value = new URLSearchParams('resumeId=e1&source=enhanced');
    const resolvers: Array<() => void> = [];
    mockApplyEnhanced.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));
    render(<TemplatesPage />);
    await choose('ocean');
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    await choose('galaxy');
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    await choose('slate');

    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledTimes(1));
    expect(mockApplyEnhanced).toHaveBeenLastCalledWith('e1', 'ocean');
    await act(async () => { resolvers[0](); });
    await waitFor(() => expect(mockApplyEnhanced).toHaveBeenCalledTimes(2));
    expect(mockApplyEnhanced).toHaveBeenLastCalledWith('e1', 'slate');
    await act(async () => { resolvers[1](); });
    expect(mockApplyEnhanced).toHaveBeenCalledTimes(2);
    expect(mockApply).not.toHaveBeenCalled();
  });
});

describe('/templates industry grid', () => {
  // 14 domains in one family; domain d00's three career levels are spread
  // through the list, as a template-count page boundary would split them.
  const tpl = (id: string, domain: string) => ({
    template_id: id, name: `${domain} ${id}`, domain_family: 'software_engineering', applicable_domains: [domain],
  });
  const domains = Array.from({ length: 14 }, (_, i) => `d${String(i).padStart(2, '0')}`);
  const catalogue = [
    tpl('a', 'd00'),
    ...domains.slice(1).map((d, i) => tpl(`x${i}`, d)),
    tpl('b', 'd00'),
    tpl('c', 'd00'),
  ];

  it('fetches the catalogue once and pages by domain card', async () => {
    params.value = new URLSearchParams();
    mockGetTemplates.mockResolvedValue(catalogue);
    render(<TemplatesPage />);
    fireEvent.click(screen.getByTestId('sidebar-All'));

    expect(await screen.findByTestId('domain-card-d00')).toHaveTextContent('3');
    expect(screen.queryAllByTestId(/^domain-card-/)).toHaveLength(12);
    fireEvent.click(screen.getByTestId('domain-card-d00'));
    expect(screen.getByTestId('domain-modal')).toHaveTextContent('3');
    expect(mockGetTemplates).toHaveBeenCalledTimes(1);
    expect(mockGetTemplates.mock.calls[0]).toEqual([]);
  });

  it('searches the fetched catalogue without another request per keystroke', async () => {
    params.value = new URLSearchParams();
    mockGetTemplates.mockResolvedValue(catalogue);
    render(<TemplatesPage />);
    fireEvent.click(screen.getByTestId('sidebar-All'));
    await screen.findByTestId('domain-card-d00');

    fireEvent.change(screen.getByTestId('template-search-input'), { target: { value: 'd13' } });
    await waitFor(() => expect(screen.queryAllByTestId(/^domain-card-/)).toHaveLength(1));
    expect(screen.getByTestId('domain-card-d13')).toBeInTheDocument();
    expect(mockGetTemplates).toHaveBeenCalledTimes(1);
  });

  it('keeps a template whose name matches the search in its domain card', async () => {
    params.value = new URLSearchParams();
    mockGetTemplates.mockResolvedValue([
      ...catalogue,
      { template_id: 'q', name: 'Quantum Ledger Specialist', domain_family: 'software_engineering', applicable_domains: ['d05'] },
    ]);
    render(<TemplatesPage />);
    fireEvent.click(screen.getByTestId('sidebar-All'));
    await screen.findByTestId('domain-card-d00');

    fireEvent.change(screen.getByTestId('template-search-input'), { target: { value: 'quantum' } });
    expect(await screen.findByTestId('domain-card-d05')).toHaveTextContent('1');
    expect(screen.queryAllByTestId(/^domain-card-/)).toHaveLength(1);
  });

  it('shows the industry search only on the industry views, not on the Catalogues view', async () => {
    params.value = new URLSearchParams();
    mockGetTemplates.mockResolvedValue(catalogue);
    render(<TemplatesPage />);
    await act(async () => {});
    // Catalogues is the default view; it has its own catalogue search.
    expect(screen.queryByTestId('template-search-input')).toBeNull();
    expect(screen.queryByTestId('quick-search-healthcare')).toBeNull();
    expect(screen.getByPlaceholderText('Search catalogues...')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sidebar-All'));
    expect(screen.getByTestId('template-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('quick-search-healthcare')).toBeInTheDocument();
  });
});

describe('/templates confirm modal and Undo', () => {
  const undo = () => screen.queryAllByTitle('Undo to previous catalogue');

  it('shows Undo right after a confirmed style, in the view the confirm switches to', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    render(<TemplatesPage />);
    expect(undo()).toHaveLength(0);
    await choose('ocean');
    // The confirm switched to the industry view (its search is shown).
    expect(screen.getByTestId('template-search-input')).toBeInTheDocument();
    expect(undo()).toHaveLength(1);
    fireEvent.click(undo()[0]);
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith('r9', 'galaxy'));
    expect(window.localStorage.getItem('selected_catalogue')).toBe('galaxy');
    expect(undo()).toHaveLength(0);
  });

  it('shows Undo right after a confirmed colour too, and once on the Catalogues view', async () => {
    params.value = new URLSearchParams();
    render(<TemplatesPage />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText('Select colour #bbb222'));
    fireEvent.click(screen.getByText('Yes, Select'));
    await act(async () => {});
    expect(undo()).toHaveLength(1);
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    expect(undo()).toHaveLength(1);
  });

  it('Enter on the focused Cancel button cancels instead of confirming', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    render(<TemplatesPage />);
    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    const cancel = screen.getByText('Cancel');
    cancel.focus();
    // A browser turns Enter on a focused button into a click unless the
    // keydown's default action was prevented.
    if (fireEvent.keyDown(cancel, { key: 'Enter' })) fireEvent.click(cancel);
    await act(async () => {});
    expect(screen.queryByText('Yes, Select')).toBeNull();
    expect(window.localStorage.getItem('selected_catalogue')).toBeNull();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('Enter outside a button still confirms, and Escape on Cancel still cancels', async () => {
    params.value = new URLSearchParams('resumeId=r9');
    render(<TemplatesPage />);
    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    fireEvent.keyDown(screen.getByText('Cancel'), { key: 'Escape' });
    await act(async () => {});
    expect(screen.queryByText('Yes, Select')).toBeNull();
    expect(window.localStorage.getItem('selected_catalogue')).toBeNull();

    fireEvent.click(screen.getByTestId('catalogue-card-ocean'));
    fireEvent.keyDown(document.body, { key: 'Enter' });
    await act(async () => {});
    expect(window.localStorage.getItem('selected_catalogue')).toBe('ocean');
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith('r9', 'ocean'));
  });

  it('Enter while a background colour button keeps focus still confirms that colour', async () => {
    params.value = new URLSearchParams();
    render(<TemplatesPage />);
    await act(async () => {});
    const swatch = screen.getByLabelText('Select colour #bbb222');
    swatch.focus();
    fireEvent.click(swatch);
    if (fireEvent.keyDown(swatch, { key: 'Enter' })) fireEvent.click(swatch);
    await act(async () => {});
    expect(screen.queryByText('Yes, Select')).toBeNull();
    expect(window.localStorage.getItem('selected_color_eclipse')).toBe('#bbb222');
  });

  it('the confirm modal compares with the current style, not the last Undo snapshot', async () => {
    params.value = new URLSearchParams();
    render(<TemplatesPage />);
    // First choice: the current style (Galaxy) is shown.
    fireEvent.click(await screen.findByTestId('catalogue-card-ocean'));
    expect(within(screen.getByText('Previous Selection').parentElement!).getByText('Galaxy')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Yes, Select'));
    await act(async () => {});
    // Galaxy -> Ocean confirmed; picking Slate compares with Ocean.
    fireEvent.click(screen.getByTestId('sidebar-Catalogues'));
    fireEvent.click(await screen.findByTestId('catalogue-card-slate'));
    const prev = screen.getByText('Previous Selection').parentElement!;
    expect(within(prev).getByText('Ocean')).toBeInTheDocument();
    expect(within(prev).queryByText('Galaxy')).toBeNull();
  });
});
