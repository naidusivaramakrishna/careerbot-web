import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuilderPage from '@/app/(resume)/builder/creation/[resumeId]/page';
import { useResume } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { useSearchParams } from 'next/navigation';

const { mockExportAs } = vi.hoisted(() => ({
  mockExportAs: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: vi.fn(),
}));

vi.mock('@/app/(resume)/builder/creation/_hooks/useBuilderDisplayScore', () => ({
  useBuilderDisplayScore: () => 25,
}));

vi.mock('@/app/(resume)/builder/creation/_components/Header', () => ({
  default: ({ actions }: { actions?: React.ReactNode }) => (
    <header data-testid="builder-header">
      Header
      {actions}
    </header>
  ),
  UseForCoverLetterButton: () => <button type="button">Use for Cover Letter</button>,
  useCoverLetterHandoff: () => ({ handleUseForCoverLetter: vi.fn(), isUsingForCoverLetter: false }),
}));

vi.mock('@/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide', () => ({
  default: ({
    resumeId,
    initialTab,
    defaultOpen,
    builderLayout,
    tabRequest,
  }: {
    resumeId: string;
    initialTab?: string;
    defaultOpen: boolean;
    builderLayout?: boolean;
    tabRequest?: { tab: string; id: number } | null;
  }) => (
    <aside data-testid="resume-side">
      <p>Resume ID: {resumeId}</p>
      <p>Initial tab: {initialTab ?? 'none'}</p>
      <p>Default open: {String(defaultOpen)}</p>
      <p>Builder layout: {String(!!builderLayout)}</p>
      <p>Tab request: {tabRequest ? `${tabRequest.tab}#${tabRequest.id}` : 'none'}</p>
    </aside>
  ),
}));

vi.mock('@/app/(resume)/builder/creation/_components/PreviewPanel', () => ({
  default: ({
    resumeId,
    isEnhancedResume,
    hideToolbar,
    exportApiRef,
    zoom,
  }: {
    resumeId: string;
    isEnhancedResume: boolean;
    hideToolbar?: boolean;
    zoom?: number;
    exportApiRef?: { current: { exportAs: (type: string) => Promise<void> } | null };
  }) => {
    if (exportApiRef) exportApiRef.current = { exportAs: mockExportAs };
    return (
      <section data-testid="preview-panel">
        <p>Preview resume ID: {resumeId}</p>
        <p>Enhanced: {String(isEnhancedResume)}</p>
        <p>Toolbar hidden: {String(!!hideToolbar)}</p>
        <p>Zoom: {String(zoom ?? 'none')}</p>
      </section>
    );
  },
}));

const mockUseResume = vi.mocked(useResume);
const mockUseSearchParams = vi.mocked(useSearchParams);

const renderBuilderPage = (resumeId = 'resume-123') =>
  render(<BuilderPage params={{ resumeId } as never} />);

describe('ResumeBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseResume.mockReturnValue({ isLoadingResume: false } as never);
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as never);
  });

  it('renders loading state with header while resume data is loading', () => {
    mockUseResume.mockReturnValue({ isLoadingResume: true } as never);

    renderBuilderPage();

    expect(screen.getByTestId('builder-header')).toBeInTheDocument();
    expect(screen.getByText('Loading resume data...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we fetch your resume')).toBeInTheDocument();
    expect(screen.queryByTestId('resume-side')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument();
  });

  it('lays out the editor panel and the live preview side by side for a normal builder resume', () => {
    renderBuilderPage('builder-resume-1');

    expect(screen.getByTestId('builder-header')).toBeInTheDocument();
    expect(screen.getByText('Resume ID: builder-resume-1')).toBeInTheDocument();
    expect(screen.getByText('Builder layout: true')).toBeInTheDocument();
    expect(screen.getByText('Initial tab: none')).toBeInTheDocument();
    expect(screen.getByText('Default open: true')).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: 'Resume Preview' })).not.toBeInTheDocument();
    expect(screen.getByText('Preview resume ID: builder-resume-1')).toBeInTheDocument();
    expect(screen.getByText('Enhanced: false')).toBeInTheDocument();
    expect(screen.getByText('Toolbar hidden: true')).toBeInTheDocument();
  });

  it('opens the Score tab for enhanced resumes', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('source=enhanced') as never);

    renderBuilderPage('enhanced-resume-1');

    expect(screen.getByText('Enhanced: true')).toBeInTheDocument();
    expect(screen.getByText('Initial tab: Score')).toBeInTheDocument();
  });

  it('passes Editor initial tab when opened from ATS', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('from_ats=true') as never);

    renderBuilderPage();

    expect(screen.getByText('Initial tab: Editor')).toBeInTheDocument();
  });

  it('supports enhanced and ATS params together', () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('source=enhanced&from_ats=true') as never
    );

    renderBuilderPage();

    // Enhanced resumes always open on Score, even when arriving from ATS.
    expect(screen.getByText('Enhanced: true')).toBeInTheDocument();
    expect(screen.getByText('Initial tab: Score')).toBeInTheDocument();
  });

  it('opens a full view with only the resume from the eye (Preview) button and closes it again', () => {
    renderBuilderPage();

    expect(screen.queryByRole('dialog', { name: 'Resume full preview' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    const dialog = screen.getByRole('dialog', { name: 'Resume full preview' });
    expect(within(dialog).getByTestId('preview-panel')).toBeInTheDocument();
    // nothing but the resume (and the close control) in the full view
    expect(within(dialog).queryByTestId('resume-side')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Resume Preview')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('dialog', { name: 'Resume full preview' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Resume full preview' })).not.toBeInTheDocument();
  });

  it('downloads PDF or DOCX from the Export menu through the preview export', () => {
    renderBuilderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));
    expect(mockExportAs).toHaveBeenCalledWith('PDF');

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'DOCX' }));
    expect(mockExportAs).toHaveBeenCalledWith('DOCX');
  });

  it('scrolls the page first on the wheel, then leaves the event to the panels at the page end', () => {
    renderBuilderPage();
    const root = screen.getByTestId('builder-scroll-root');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 600 });

    // page can still move down: the page takes the wheel
    root.scrollTop = 0;
    expect(fireEvent.wheel(root, { deltaY: 120 })).toBe(false);
    expect(root.scrollTop).toBe(120);

    // page is at its end: the wheel is left to the panel under the pointer
    root.scrollTop = 400;
    expect(fireEvent.wheel(root, { deltaY: 120 })).toBe(true);
    expect(root.scrollTop).toBe(400);

    // wheel up with the page scrolled: page first again
    expect(fireEvent.wheel(root, { deltaY: -100 })).toBe(false);
    expect(root.scrollTop).toBe(300);

    // wheel up at the very top: nothing to move, panels handle it
    root.scrollTop = 0;
    expect(fireEvent.wheel(root, { deltaY: -100 })).toBe(true);
  });

  it('leaves the wheel to the full-preview window instead of scrolling the page behind it', () => {
    renderBuilderPage();
    const root = screen.getByTestId('builder-scroll-root');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 600 });
    root.scrollTop = 0;

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const dialog = screen.getByRole('dialog', { name: 'Resume full preview' });

    // the page could still move, but the pointer is over the window: the window scrolls itself
    expect(fireEvent.wheel(within(dialog).getByTestId('preview-panel'), { deltaY: 120 })).toBe(true);
    expect(root.scrollTop).toBe(0);

    // outside the window the page still takes the wheel
    expect(fireEvent.wheel(root, { deltaY: 120 })).toBe(false);
    expect(root.scrollTop).toBe(120);
  });

  it('shows the score button in the preview header and brings the Score tab forward when clicked', () => {
    renderBuilderPage();

    expect(screen.getByText('Tab request: none')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Score 25%' }));
    expect(screen.getByText('Tab request: Score#1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Score 25%' }));
    expect(screen.getByText('Tab request: Score#2')).toBeInTheDocument();
  });

  it('zooms the preview from the − 100% + control', () => {
    renderBuilderPage();

    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('110%')).toBeInTheDocument();
    expect(screen.getAllByText('Zoom: 1.1').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('90%')).toBeInTheDocument();
  });
});
