import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeThumbnail from '@/app/(resume)/builder/start/_components/ResumeThumbnail';
import { getResumePreviewImage } from '@/api/resumeApi';
import { previewEnhancedResumePDFOnly } from '@/api/enhancerApi';

vi.mock('@/api/resumeApi', () => ({
  getResumePreviewImage: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  previewEnhancedResumePDFOnly: vi.fn(),
}));

vi.mock('@/app/(resume)/templates/_utils/activeTemplateDomain', () => ({
  resolveAccountEmail: vi.fn().mockResolvedValue('user@example.com'),
}));

const mockPreviewImage = vi.mocked(getResumePreviewImage);
const mockEnhancedPdf = vi.mocked(previewEnhancedResumePDFOnly);

// The global test setup stubs IntersectionObserver so it never fires; these two report "visible"
// right away, or never.
class VisibleObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe = () => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  disconnect = vi.fn();
  unobserve = vi.fn();
}
class HiddenObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

describe('ResumeThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('IntersectionObserver', VisibleObserver);
    window.URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => `blob:thumb-${(blob as Blob).size}`);
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'selectedTemplateId_user@example.com') return 'domain-template-1';
      if (key === 'selected_catalogue') return 'classic';
      return null;
    });
  });

  it('shows the real rendered image of a builder resume, using the template picked in the builder', async () => {
    mockPreviewImage.mockResolvedValue(new Blob(['png-bytes']));
    render(<ResumeThumbnail resumeId="builder-thumb-1" source="builder" updatedAt="2026-01-01" />);

    const img = await screen.findByRole('img', { name: 'Resume preview' });
    expect(img).toHaveAttribute('src', 'blob:thumb-9');
    expect(mockPreviewImage).toHaveBeenCalledTimes(1);
    const [id, , domainTemplateId] = mockPreviewImage.mock.calls[0];
    expect(id).toBe('builder-thumb-1');
    expect(domainTemplateId).toBe('domain-template-1');
  });

  // The editor's export passes the saved Style & Layout settings; the thumbnail must pass the same ones, or a
  // customised resume is drawn differently on its card than in the file the user downloads.
  const withStorage = (values: Record<string, string>) => {
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'selectedTemplateId_user@example.com') return 'domain-template-1';
      return values[key] ?? null;
    });
  };
  const savedStyle = {
    accentColor: '#aa0000',
    headingColor: '#333333',
    sectionHeaderBg: '#112233',
    fontFamily: 'Georgia',
    lineSpacing: '1.5',
    fontSize: '11',
    pageMargin: 'wide',
    sectionSpacing: 'compact',
    alignment: 'center',
  };

  it('renders with the saved style, section order, font, spacing and layout, like the export does', async () => {
    withStorage({
      userEmail: 'user@example.com',
      selected_catalogue: 'eclipse',
      'resumeStyle_user@example.com': JSON.stringify(savedStyle),
      'sectionOrder_user@example.com': JSON.stringify(['summary', 'skills']),
    });
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    render(<ResumeThumbnail resumeId="builder-thumb-style" source="builder" updatedAt="v1" />);

    await screen.findByRole('img', { name: 'Resume preview' });
    const args = mockPreviewImage.mock.calls[0];
    expect(args[3]).toBe('#112233'); // section header background: Eclipse only
    expect(args[4]).toBe('#aa0000'); // accent colour
    // the saved order belongs to the browser (the last edited resume), not to this resume, and the export completes it
    // per resume; sending it raw could drop a section this resume has, so the card leaves the order to the template
    expect(args[5]).toBeUndefined();
    expect(args[6]).toBe('Georgia');
    expect(args[7]).toBe('1.5');
    expect(args[8]).toBe('Mid-Level');
    expect(args[10]).toEqual({ fontSize: '11', pageMargin: 'wide', sectionSpacing: 'compact', alignment: 'center' });
  });

  it('uses the heading colour when there is no accent, and ignores the section background outside Eclipse', async () => {
    withStorage({
      userEmail: 'user@example.com',
      selected_catalogue: 'classic',
      'resumeStyle_user@example.com': JSON.stringify({ ...savedStyle, accentColor: undefined }),
    });
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    render(<ResumeThumbnail resumeId="builder-thumb-accent" source="builder" updatedAt="v1" />);

    await screen.findByRole('img', { name: 'Resume preview' });
    const args = mockPreviewImage.mock.calls[0];
    expect(args[3]).toBeUndefined();
    expect(args[4]).toBe('#333333');
  });

  it('takes the career level from the applied career-level template of the signed-in account, as the export does', async () => {
    // localStorage.userEmail is never cleared on logout: it may still name the previous account
    withStorage({
      userEmail: 'previous-user@example.com',
      'careerLevelTemplates_previous-user@example.com': JSON.stringify([{ id: 'domain-template-1', name: 'Junior Analyst' }]),
      'careerLevelTemplates_user@example.com': JSON.stringify([{ id: 'domain-template-1', name: 'Senior Software Engineer' }]),
    });
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    render(<ResumeThumbnail resumeId="builder-thumb-level" source="builder" updatedAt="v1" />);

    await screen.findByRole('img', { name: 'Resume preview' });
    expect(mockPreviewImage.mock.calls[0][8]).toBe('Senior-Level');
  });

  it('renders again when the style changed since the cached picture was made', async () => {
    withStorage({ userEmail: 'user@example.com', 'resumeStyle_user@example.com': JSON.stringify({ fontFamily: 'Arial' }) });
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    const first = render(<ResumeThumbnail resumeId="builder-thumb-restyle" source="builder" updatedAt="v1" />);
    await screen.findByRole('img', { name: 'Resume preview' });
    first.unmount();

    withStorage({ userEmail: 'user@example.com', 'resumeStyle_user@example.com': JSON.stringify({ fontFamily: 'Georgia' }) });
    render(<ResumeThumbnail resumeId="builder-thumb-restyle" source="builder" updatedAt="v1" />);

    await waitFor(() => expect(mockPreviewImage).toHaveBeenCalledTimes(2));
    expect(mockPreviewImage.mock.calls[1][6]).toBe('Georgia');
  });

  it('renders again when only the selected domain template changed', async () => {
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) => (
      key === 'selectedTemplateId_user@example.com' ? 'domain-A' : null
    ));
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    const first = render(<ResumeThumbnail resumeId="builder-thumb-domain" source="builder" updatedAt="v1" />);
    await screen.findByRole('img', { name: 'Resume preview' });
    first.unmount();

    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) => (
      key === 'selectedTemplateId_user@example.com' ? 'domain-B' : null
    ));
    render(<ResumeThumbnail resumeId="builder-thumb-domain" source="builder" updatedAt="v1" />);

    await waitFor(() => expect(mockPreviewImage).toHaveBeenCalledTimes(2));
    expect(mockPreviewImage.mock.calls[1][2]).toBe('domain-B');
  });

  it('frees the old picture when a newer one replaces it', async () => {
    window.URL.revokeObjectURL = vi.fn();
    withStorage({ userEmail: 'user@example.com', 'resumeStyle_user@example.com': JSON.stringify({ fontFamily: 'Arial' }) });
    mockPreviewImage.mockResolvedValueOnce(new Blob(['old']));
    const first = render(<ResumeThumbnail resumeId="builder-thumb-free" source="builder" updatedAt="v1" />);
    await screen.findByRole('img', { name: 'Resume preview' });
    first.unmount();

    withStorage({ userEmail: 'user@example.com', 'resumeStyle_user@example.com': JSON.stringify({ fontFamily: 'Georgia' }) });
    mockPreviewImage.mockResolvedValueOnce(new Blob(['newer-bytes']));
    render(<ResumeThumbnail resumeId="builder-thumb-free" source="builder" updatedAt="v1" />);

    await waitFor(() => expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:thumb-3'));
  });

  it('cancels the request itself when a render takes too long', async () => {
    vi.useFakeTimers();
    try {
      mockPreviewImage.mockImplementation(() => new Promise(() => undefined) as never);
      render(<ResumeThumbnail resumeId="builder-thumb-abort" source="builder" updatedAt="v1" />);

      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      const signal = mockPreviewImage.mock.calls[0][9] as AbortSignal;
      expect(signal.aborted).toBe(false);
      await act(async () => { await vi.advanceTimersByTimeAsync(40100); });
      expect(signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels an uploaded resume preview itself when it takes too long', async () => {
    vi.useFakeTimers();
    try {
      mockEnhancedPdf.mockImplementation(() => new Promise(() => undefined) as never);
      render(<ResumeThumbnail resumeId="enhanced-thumb-abort" source="enhanced" updatedAt="v1" />);

      await vi.advanceTimersByTimeAsync(0);
      const signal = mockEnhancedPdf.mock.calls[0][1] as AbortSignal;
      expect(signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(40100);
      expect(signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows an enhanced resume as its rendered PDF page', async () => {
    mockEnhancedPdf.mockResolvedValue(new Blob(['pdf']));
    const { container } = render(<ResumeThumbnail resumeId="enhanced-thumb-1" source="enhanced" updatedAt="2026-01-01" />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull());
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('blob:thumb-3#');
    expect(mockEnhancedPdf).toHaveBeenCalledWith('enhanced-thumb-1', expect.any(AbortSignal));
    expect(mockPreviewImage).not.toHaveBeenCalled();
  });

  it('keeps the placeholder lines when the preview cannot be rendered', async () => {
    mockPreviewImage.mockRejectedValue(new Error('render failed'));
    const { container } = render(<ResumeThumbnail resumeId="builder-thumb-fail" source="builder" updatedAt="2026-01-01" />);

    await waitFor(() => expect(mockPreviewImage).toHaveBeenCalled());
    expect(screen.queryByRole('img', { name: 'Resume preview' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThan(0);
  });

  it('does not render the same resume version twice', async () => {
    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    const first = render(<ResumeThumbnail resumeId="builder-thumb-cache" source="builder" updatedAt="v1" />);
    await screen.findByRole('img', { name: 'Resume preview' });
    first.unmount();

    render(<ResumeThumbnail resumeId="builder-thumb-cache" source="builder" updatedAt="v1" />);
    expect(await screen.findByRole('img', { name: 'Resume preview' })).toBeInTheDocument();
    expect(mockPreviewImage).toHaveBeenCalledTimes(1);
  });

  it('waits until the card is on screen before rendering the preview', () => {
    vi.stubGlobal('IntersectionObserver', HiddenObserver);
    render(<ResumeThumbnail resumeId="builder-thumb-offscreen" source="builder" updatedAt="v1" />);

    expect(mockPreviewImage).not.toHaveBeenCalled();
  });

  it('tries again after a failed render instead of leaving the card empty', async () => {
    vi.useFakeTimers();
    try {
      mockPreviewImage.mockRejectedValueOnce(new Error('server busy')).mockResolvedValueOnce(new Blob(['png-bytes']));
      render(<ResumeThumbnail resumeId="builder-thumb-retry" source="builder" updatedAt="v1" />);

      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(mockPreviewImage).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('img', { name: 'Resume preview' })).not.toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
      expect(mockPreviewImage).toHaveBeenCalledTimes(2);
      await act(async () => { await vi.advanceTimersByTimeAsync(100); }); // let the second render's result land
      expect(screen.getByRole('img', { name: 'Resume preview' })).toHaveAttribute('src', 'blob:thumb-9');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not remember a failure: the card asks again when it is shown again', async () => {
    mockPreviewImage.mockRejectedValue(new Error('down'));
    const first = render(<ResumeThumbnail resumeId="builder-thumb-nocache" source="builder" updatedAt="v1" />);
    await waitFor(() => expect(mockPreviewImage).toHaveBeenCalledTimes(1));
    first.unmount();

    mockPreviewImage.mockResolvedValue(new Blob(['png']));
    render(<ResumeThumbnail resumeId="builder-thumb-nocache" source="builder" updatedAt="v1" />);
    expect(await screen.findByRole('img', { name: 'Resume preview' })).toBeInTheDocument();
    expect(mockPreviewImage).toHaveBeenCalledTimes(2);
  });

  it('gives up on a render that never finishes, so it cannot block the others', async () => {
    vi.useFakeTimers();
    try {
      mockPreviewImage.mockImplementation(() => new Promise(() => undefined) as never);
      render(<ResumeThumbnail resumeId="builder-thumb-hung" source="builder" updatedAt="v1" />);

      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(mockPreviewImage).toHaveBeenCalledTimes(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(40100 + 3100); });
      expect(mockPreviewImage).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
