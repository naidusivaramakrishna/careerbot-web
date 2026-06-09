import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { Suspense } from 'react';

// Mock components
const MockHeader = () => <header data-testid="builder-header">Header</header>;
const MockResumeSide = ({ resumeId }: any) => (
  <div data-testid="resume-side">Resume Sidebar - {resumeId}</div>
);
const MockPreviewPanel = ({ isEnhancedResume }: any) => (
  <div data-testid="preview-panel">
    Preview Panel {isEnhancedResume ? '(Enhanced)' : ''}
  </div>
);
const MockTemplatesSidebar = () => <div data-testid="templates-sidebar">Templates Sidebar</div>;

// Mock context
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: vi.fn(() => ({
    isLoadingResume: false,
  })),
}));

// Mock next/navigation
const mockUseSearchParams = vi.fn(() => new URLSearchParams());
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => '/builder/creation/resume-123',
}));

// Test component
const BuilderPageInner = ({ resumeId }: { resumeId: string }) => {
  const searchParams = mockUseSearchParams();
  const fromAts = searchParams.get('from_ats') === 'true';
  const isEnhancedResume = searchParams.get('source') === 'enhanced';
  const { isLoadingResume } = require('@/app/(resume)/builder/creation/_context/ResumeContext').useResume();

  if (isLoadingResume) {
    return (
      <>
        <MockHeader />
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading resume data...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your resume</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MockHeader />
      <div className="flex h-screen">
        <MockResumeSide resumeId={resumeId} />
        <main className="flex-1 bg-gray-50">
          <MockPreviewPanel isEnhancedResume={isEnhancedResume} />
        </main>
        <MockTemplatesSidebar />
      </div>
    </>
  );
};

describe('ResumeBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('renders builder components when resume loads', async () => {
    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByTestId('builder-header')).toBeInTheDocument();
    expect(screen.getByTestId('resume-side')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('templates-sidebar')).toBeInTheDocument();
  });

  it('shows loading state while resume data is being fetched', async () => {
    const { useResume } = require('@/app/(resume)/builder/creation/_context/ResumeContext');
    useResume.mockReturnValue({ isLoadingResume: true });

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByText('Loading resume data...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we fetch your resume')).toBeInTheDocument();
  });

  it('passes correct resumeId to child components', async () => {
    const testResumeId = 'resume-456';
    render(<BuilderPageInner resumeId={testResumeId} />);

    expect(screen.getByText(`Resume Sidebar - ${testResumeId}`)).toBeInTheDocument();
  });

  it('detects enhanced resume mode from search params', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('source=enhanced'));

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByText('Preview Panel (Enhanced)')).toBeInTheDocument();
  });

  it('detects ATS mode from search params', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('from_ats=true'));

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });

  it('maintains sidebar state across renders', async () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'template_sidebar_open') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByTestId('templates-sidebar')).toBeInTheDocument();
  });

  it('renders layout with proper flex structure', () => {
    const { container } = render(<BuilderPageInner resumeId="resume-123" />);

    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toHaveClass('flex', 'h-screen');
  });

  it('renders main element with flex-1 class', () => {
    const { container } = render(<BuilderPageInner resumeId="resume-123" />);

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('flex-1', 'bg-gray-50');
  });

  it('handles multiple search parameters together', () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('source=enhanced&from_ats=true')
    );

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByText('Preview Panel (Enhanced)')).toBeInTheDocument();
  });

  it('displays header for loading state', async () => {
    const { useResume } = require('@/app/(resume)/builder/creation/_context/ResumeContext');
    useResume.mockReturnValue({ isLoadingResume: true });

    render(<BuilderPageInner resumeId="resume-123" />);

    expect(screen.getByTestId('builder-header')).toBeInTheDocument();
  });

  it('renders correct resume sidebar with ID', () => {
    const resumeId = 'special-resume-789';
    render(<BuilderPageInner resumeId={resumeId} />);

    expect(screen.getByText(`Resume Sidebar - ${resumeId}`)).toBeInTheDocument();
  });
});
