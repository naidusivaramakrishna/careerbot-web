import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuilderPage from '@/app/(resume)/builder/creation/[resumeId]/page';
import { useResume } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { useSearchParams } from 'next/navigation';

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

vi.mock('@/app/(resume)/builder/creation/_components/Header', () => ({
  default: () => <header data-testid="builder-header">Header</header>,
}));

vi.mock('@/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide', () => ({
  default: ({
    resumeId,
    initialTab,
    defaultOpen,
    isTemplateSidebarOpen,
    onToggleTemplateSidebar,
  }: {
    resumeId: string;
    initialTab?: string;
    defaultOpen: boolean;
    isTemplateSidebarOpen: boolean;
    onToggleTemplateSidebar: (isOpen: boolean) => void;
  }) => (
    <aside data-testid="resume-side">
      <p>Resume ID: {resumeId}</p>
      <p>Initial tab: {initialTab ?? 'none'}</p>
      <p>Default open: {String(defaultOpen)}</p>
      <p>Template open in side: {String(isTemplateSidebarOpen)}</p>
      <button onClick={() => onToggleTemplateSidebar(false)}>Close templates from side</button>
      <button onClick={() => onToggleTemplateSidebar(true)}>Open templates from side</button>
    </aside>
  ),
}));

vi.mock('@/app/(resume)/builder/creation/_components/PreviewPanel', () => ({
  default: ({
    resumeId,
    isEnhancedResume,
    isTemplateSidebarOpen,
    onTabClick,
  }: {
    resumeId: string;
    isEnhancedResume: boolean;
    isTemplateSidebarOpen: boolean;
    onTabClick: (tab: string) => void;
  }) => (
    <section data-testid="preview-panel">
      <p>Preview resume ID: {resumeId}</p>
      <p>Enhanced: {String(isEnhancedResume)}</p>
      <p>Template open in preview: {String(isTemplateSidebarOpen)}</p>
      <button onClick={() => onTabClick('Score')}>Open score tab</button>
      <button onClick={() => onTabClick('Templates')}>Open templates tab</button>
    </section>
  ),
}));

vi.mock('@/app/(resume)/builder/creation/_components/templateSidebar/TemplatesSidebar', () => ({
  default: ({
    resumeId,
    isOpen,
    activeTab,
    onToggle,
    setActiveTab,
  }: {
    resumeId: string;
    isOpen: boolean;
    activeTab: string;
    onToggle: (isOpen: boolean) => void;
    setActiveTab: (tab: string) => void;
  }) => (
    <aside data-testid="templates-sidebar">
      <p>Sidebar resume ID: {resumeId}</p>
      <p>Sidebar open: {String(isOpen)}</p>
      <p>Active tab: {activeTab}</p>
      <button onClick={() => onToggle(false)}>Close templates</button>
      <button onClick={() => onToggle(true)}>Open templates</button>
      <button onClick={() => setActiveTab('Editor')}>Set editor tab</button>
    </aside>
  ),
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
    expect(screen.queryByTestId('templates-sidebar')).not.toBeInTheDocument();
  });

  it('renders production child contracts for a normal builder resume', async () => {
    renderBuilderPage('builder-resume-1');

    expect(screen.getByTestId('builder-header')).toBeInTheDocument();
    expect(screen.getByText('Resume ID: builder-resume-1')).toBeInTheDocument();
    expect(screen.getByText('Preview resume ID: builder-resume-1')).toBeInTheDocument();
    expect(screen.getByText('Sidebar resume ID: builder-resume-1')).toBeInTheDocument();
    expect(screen.getByText('Initial tab: none')).toBeInTheDocument();
    expect(screen.getByText('Default open: true')).toBeInTheDocument();
    expect(screen.getByText('Enhanced: false')).toBeInTheDocument();
    expect(screen.getByText('Sidebar open: false')).toBeInTheDocument();
    expect(screen.getByText('Active tab: Templates')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('template_sidebar_open', 'false');
    });
  });

  it('opens template sidebar and starts on Score tab for enhanced resumes', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('source=enhanced') as never);

    renderBuilderPage('enhanced-resume-1');

    expect(screen.getByText('Enhanced: true')).toBeInTheDocument();
    expect(screen.getByText('Default open: false')).toBeInTheDocument();
    expect(screen.getByText('Sidebar open: true')).toBeInTheDocument();
    expect(screen.getByText('Active tab: Score')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('template_sidebar_open', 'true');
    });
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

    expect(screen.getByText('Enhanced: true')).toBeInTheDocument();
    expect(screen.getByText('Initial tab: Editor')).toBeInTheDocument();
    expect(screen.getByText('Active tab: Score')).toBeInTheDocument();
  });

  it('persists template sidebar state when toggled from sidebar controls', async () => {
    renderBuilderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Open templates from side' }));

    expect(screen.getByText('Sidebar open: true')).toBeInTheDocument();
    expect(screen.getByText('Template open in preview: true')).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenLastCalledWith('template_sidebar_open', 'true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close templates from side' }));

    expect(screen.getByText('Sidebar open: false')).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenLastCalledWith('template_sidebar_open', 'false');
    });
  });

  it('opens the template sidebar and changes active tab from preview toolbar clicks', async () => {
    renderBuilderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Open score tab' }));

    expect(screen.getByText('Sidebar open: true')).toBeInTheDocument();
    expect(screen.getByText('Active tab: Score')).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenLastCalledWith('template_sidebar_open', 'true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open templates tab' }));

    expect(screen.getByText('Active tab: Templates')).toBeInTheDocument();
  });

  it('allows TemplatesSidebar to set active tab directly', () => {
    renderBuilderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Set editor tab' }));

    expect(screen.getByText('Active tab: Editor')).toBeInTheDocument();
  });
});
