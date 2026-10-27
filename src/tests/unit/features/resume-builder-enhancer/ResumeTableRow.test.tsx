import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeTableRow from '@/app/(resume)/builder/start/_components/ResumeTableRow';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
  },
}));

const baseResume = {
  id: 'resume-1',
  initials: 'AB',
  name: 'Avery Builder',
  job: 'Frontend Engineer',
  score: 72,
  modified: 'Today',
  created: 'Yesterday',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  primary: false,
  source: 'builder' as const,
};

const renderRow = (
  resume = baseResume,
  props: Partial<{
    onSetPrimary: () => void;
    onDownload: () => void;
    downloading: boolean;
  }> = {}
) =>
  render(
    <table>
      <tbody>
        <ResumeTableRow
          resume={resume}
          index={0}
          onDownload={props.onDownload || vi.fn()}
          onSetPrimary={props.onSetPrimary || vi.fn()}
          downloading={props.downloading ?? false}
        />
      </tbody>
    </table>
  );

describe('ResumeTableRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders builder resume details, target role and score, with no Builder/Enhancer source label', () => {
    renderRow();

    expect(screen.getByText('Avery Builder')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Builder')).not.toBeInTheDocument();
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows no source label for an enhanced resume and navigates with the source query param', () => {
    renderRow({
      ...baseResume,
      id: 'enhanced-1',
      name: 'Uploaded Resume',
      source: 'enhanced',
      job: '',
      score: 35,
    });

    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
    expect(screen.queryByText('Builder')).not.toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('row'));

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('resumeData');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'enhanced-1');
    expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-1?source=enhanced');
  });

  it('navigates to the builder editor when the row body is clicked', () => {
    renderRow();

    fireEvent.click(screen.getByRole('row'));

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('resumeData');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'resume-1');
    expect(mockPush).toHaveBeenCalledWith('/builder/creation/resume-1');
  });

  it('opens the resume at the url the page gives it, so return_to survives a row click', () => {
    const creationUrl = '/builder/creation/resume-1?return_to=%2Fcover-letter';
    render(
      <table>
        <tbody>
          <ResumeTableRow resume={baseResume} index={0} onDownload={vi.fn()} downloading={false} creationUrl={creationUrl} />
        </tbody>
      </table>
    );

    fireEvent.click(screen.getByRole('row'));

    expect(mockPush).toHaveBeenCalledWith(creationUrl);
  });

  it('opens the action menu without triggering row navigation', async () => {
    const onDownload = vi.fn();
    const { container } = renderRow(baseResume, { onDownload });
    const actionButton = container.querySelector('td:last-child button') as HTMLButtonElement;

    vi.spyOn(actionButton, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      right: 300,
      top: 80,
      left: 280,
      width: 20,
      height: 20,
      x: 280,
      y: 80,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(actionButton);

    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByText('Download')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Download'));

    expect(onDownload).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Download')).not.toBeInTheDocument();
    });
  });

  it('calls onSetPrimary from the action menu and shows a non-clickable state once primary', async () => {
    const onSetPrimary = vi.fn();
    const { container, rerender } = renderRow(baseResume, { onSetPrimary });
    fireEvent.click(container.querySelector('td:last-child button') as HTMLButtonElement);

    fireEvent.click(await screen.findByText('Set as Primary'));
    expect(onSetPrimary).toHaveBeenCalledTimes(1);

    rerender(
      <table>
        <tbody>
          <ResumeTableRow resume={{ ...baseResume, primary: true }} index={0} onDownload={vi.fn()} onSetPrimary={onSetPrimary} downloading={false} />
        </tbody>
      </table>
    );
    fireEvent.click(container.querySelector('td:last-child button') as HTMLButtonElement);
    expect(await screen.findByRole('button', { name: /Primary resume/ })).toBeDisabled();
  });

  it('closes the action menu when clicking outside', async () => {
    const { container } = renderRow();
    const actionButton = container.querySelector('td:last-child button') as HTMLButtonElement;

    vi.spyOn(actionButton, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      right: 300,
      top: 80,
      left: 280,
      width: 20,
      height: 20,
      x: 280,
      y: 80,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(actionButton);

    expect(await screen.findByText('Set as Primary')).toBeInTheDocument();
    expect(screen.queryByText('Optimize for Job')).not.toBeInTheDocument();
    expect(screen.queryByText('Share')).not.toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Set as Primary')).not.toBeInTheDocument();
    });
  });

  it('refreshes rendered relative date labels on the one-minute interval', () => {
    vi.useFakeTimers();
    renderRow();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText('Avery Builder')).toBeInTheDocument();
  });
});
