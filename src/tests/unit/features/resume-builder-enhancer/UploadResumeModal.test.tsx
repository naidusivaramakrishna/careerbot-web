import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadResumeModal from '@/app/(resume)/builder/start/_components/UploadResumeModal';
import { parseResumeForEnhancer, enhanceResume, getEnhancedResume } from '@/api/enhancerApi';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';
import { toast } from 'sonner';
import { clearStoredFixedSuggestions } from '@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage';
import { forgetFixedTextFor } from '@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/api/enhancerApi', () => ({
  parseResumeForEnhancer: vi.fn(),
  enhanceResume: vi.fn(),
  getEnhancedResume: vi.fn(),
}));
vi.mock('@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage', () => ({
  clearStoredFixedSuggestions: vi.fn(),
}));
vi.mock('@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights', () => ({
  forgetFixedTextFor: vi.fn(),
}));

vi.mock('@/utils/resumeMappers', () => ({
  mapParserOutputToBuilderData: vi.fn(),
}));

const mockParseResumeForEnhancer = vi.mocked(parseResumeForEnhancer);
const mockEnhanceResume = vi.mocked(enhanceResume);
const mockGetEnhancedResume = vi.mocked(getEnhancedResume);
const mockMapParserOutputToBuilderData = vi.mocked(mapParserOutputToBuilderData);
const mockToast = vi.mocked(toast);
const mockClearStoredFixedSuggestions = vi.mocked(clearStoredFixedSuggestions);
const mockForgetFixedTextFor = vi.mocked(forgetFixedTextFor);

const onClose = vi.fn();

const pdfFile = (name = 'resume.pdf') => new File(['resume'], name, { type: 'application/pdf' });
const docxFile = (name = 'resume.docx') =>
  new File(['resume'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
const oversizedFile = () => {
  const file = pdfFile('large.pdf');
  Object.defineProperty(file, 'size', {
    value: 11 * 1024 * 1024,
  });
  return file;
};

const renderModal = (isOpen = true) => render(<UploadResumeModal isOpen={isOpen} onClose={onClose} />);

describe('UploadResumeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    mockGetEnhancedResume.mockResolvedValue({ applied_fixes: [] } as never);
    mockParseResumeForEnhancer.mockResolvedValue({ resume_id: 'parsed-resume-1' } as never);
    mockEnhanceResume.mockResolvedValue({
      enhanced_resume_id: 'enhanced-resume-1',
      enhanced_resume: {
        personalInfo: { fullname: 'Jane Candidate' },
      },
    } as never);
    mockMapParserOutputToBuilderData.mockReturnValue({
      personalInfo: { fullname: 'Jane Candidate' },
      workExperience: [],
    } as never);
  });

  it('does not render when closed', () => {
    renderModal(false);

    expect(screen.queryByRole('heading', { name: 'Upload Existing Resume' })).not.toBeInTheDocument();
  });

  it('renders upload state with accepted file types and helper copy', () => {
    const { container } = renderModal();

    expect(screen.getByRole('heading', { name: 'Upload Existing Resume' })).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
    expect(screen.getByText('PDF or DOCX · Max 10MB')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      'accept',
      '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('closes and resets from the close button in upload state', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked only during upload step', () => {
    const { container } = renderModal();
    const backdrop = container.firstElementChild as HTMLElement;

    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation error for files above 10MB and does not call APIs', async () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [oversizedFile()] } });

    expect(await screen.findByText('File exceeds 10MB limit.')).toBeInTheDocument();
    expect(mockParseResumeForEnhancer).not.toHaveBeenCalled();
    expect(mockEnhanceResume).not.toHaveBeenCalled();
  });

  it('shows validation error for unsupported files and keeps upload state', async () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['resume'], 'resume.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [txtFile] } });

    expect(await screen.findByText('Only PDF or DOCX files are accepted.')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
  });

  it('parses and enhances a selected PDF file, writes cache, and routes to enhanced editor', async () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced');
    });

    expect(mockParseResumeForEnhancer).toHaveBeenCalledWith(expect.any(File));
    expect(mockEnhanceResume).toHaveBeenCalledWith({ resume_id: 'parsed-resume-1' });
    expect(mockMapParserOutputToBuilderData).toHaveBeenCalledWith({
      personalInfo: { fullname: 'Jane Candidate' },
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'cached_resume_data',
      expect.stringContaining('"resumeId":"enhanced-resume-1"')
    );
    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'enhanced-resume-1');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'enhanced_resume_ids',
      JSON.stringify(['enhanced-resume-1'])
    );
    expect(mockToast.success).toHaveBeenCalledWith('Resume imported! Opening editor…');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
  });

  it('supports DOCX files', async () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [docxFile()] } });

    await waitFor(() => {
      expect(mockParseResumeForEnhancer).toHaveBeenCalledWith(expect.any(File));
    });
    expect(mockEnhanceResume).toHaveBeenCalledWith({ resume_id: 'parsed-resume-1' });
  });

  it('uses enhancer_state.resume when enhanced_resume is absent', async () => {
    mockEnhanceResume.mockResolvedValue({
      enhanced_resume_id: 'enhanced-resume-2',
      enhancer_state: {
        resume: {
          personalInfo: { fullname: 'State Resume' },
        },
      },
    } as never);
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });

    await waitFor(() => {
      expect(mockMapParserOutputToBuilderData).toHaveBeenCalledWith({
        personalInfo: { fullname: 'State Resume' },
      });
    });
  });

  it('does not duplicate enhanced resume IDs already in localStorage', async () => {
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'enhanced_resume_ids') return JSON.stringify(['enhanced-resume-1']);
      return null;
    });
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      'enhanced_resume_ids',
      JSON.stringify(['enhanced-resume-1', 'enhanced-resume-1'])
    );
  });

  it('handles drag enter, drag leave, and drop upload flow', async () => {
    renderModal();
    const dropzone = screen.getByText('Drag & drop your resume').closest('div') as HTMLElement;

    fireEvent.dragEnter(dropzone);
    expect(screen.getByText('Drop your file here')).toBeInTheDocument();

    fireEvent.dragLeave(dropzone);
    expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [pdfFile('dropped.pdf')],
      },
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced');
    });
  });

  it('prevents backdrop close while parsing or enhancing', async () => {
    mockParseResumeForEnhancer.mockReturnValue(new Promise(() => undefined) as never);
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const backdrop = container.firstElementChild as HTMLElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });
    expect(await screen.findByText(/Parsing your resume/)).toBeInTheDocument();

    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows error toast and resets when parse fails', async () => {
    mockParseResumeForEnhancer.mockRejectedValue(new Error('Parser unavailable'));
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Parser unavailable');
    });
    expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
    expect(mockEnhanceResume).not.toHaveBeenCalled();
  });

  it('shows generic error toast and resets for non-Error enhance failures', async () => {
    mockEnhanceResume.mockRejectedValue('bad response');
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile()] } });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.');
    });
    expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
  });

  describe('a file that already has saved fixes', () => {
    const uploadPdf = () => {
      const { container } = renderModal();
      fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [pdfFile()] } });
    };
    const withSavedFixes = (count = 2) =>
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-1',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
        applied_fixes: Array.from({ length: count }, (_, i) => ({ suggestion_id: `s${i}` })),
      } as never);

    it('asks before opening the editor and keeps the fixes on "Continue with my changes"', async () => {
      withSavedFixes();
      uploadPdf();

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent('2 fixes applied');
      expect(mockPush).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Continue with my changes'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenCalledTimes(1);          // no second, credit-charging scan
    });

    it('starts from the original file only after a second confirmation', async () => {
      withSavedFixes(1);
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-2',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
      } as never);
      uploadPdf();
      await screen.findByRole('dialog');

      fireEvent.click(screen.getByText('Start with fresh data'));
      expect(mockEnhanceResume).toHaveBeenCalledTimes(1);          // nothing sent before confirming
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-2?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenLastCalledWith({ resume_id: 'parsed-resume-1', force_refresh: true });
    });

    it('keeps browser fixed-card state when the server says its saved fixes remain', async () => {
      withSavedFixes(1);
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-1',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
        applied_fixes: [{ suggestion_id: 's0' }],
      } as never);
      uploadPdf();
      await screen.findByRole('dialog');

      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('The saved fixes are still present. Please try again.');
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockClearStoredFixedSuggestions).not.toHaveBeenCalled();
      expect(mockForgetFixedTextFor).not.toHaveBeenCalled();
    });

    it('keeps the latest server result when a refresh response omits fixes but its record still has them', async () => {
      withSavedFixes(1);
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-1',
        enhanced_resume: { personalInfo: { fullname: 'Latest Server Candidate' } },
      } as never);
      mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 's0' }] } as never);
      uploadPdf();
      await screen.findByRole('dialog');

      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('The saved fixes are still present. Please try again.'));

      fireEvent.click(screen.getByText('Cancel'));
      fireEvent.click(screen.getByText('Continue with my changes'));
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockMapParserOutputToBuilderData).toHaveBeenLastCalledWith({
        personalInfo: { fullname: 'Latest Server Candidate' },
      });
      expect(mockClearStoredFixedSuggestions).not.toHaveBeenCalled();
      expect(mockForgetFixedTextFor).not.toHaveBeenCalled();
    });

    it('treats an omitted optional applied_fixes field on the refreshed record as empty', async () => {
      withSavedFixes(1);
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-2',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
      } as never);
      mockGetEnhancedResume.mockResolvedValueOnce({} as never);
      uploadPdf();
      await screen.findByRole('dialog');

      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-2?source=enhanced'));
      expect(mockClearStoredFixedSuggestions).toHaveBeenCalledWith('enhanced-resume-1');
      expect(mockClearStoredFixedSuggestions).toHaveBeenCalledWith('enhanced-resume-2');
      expect(mockForgetFixedTextFor).toHaveBeenCalledWith('enhanced-resume-1');
      expect(mockForgetFixedTextFor).toHaveBeenCalledWith('enhanced-resume-2');
    });

    it('opens the successful fresh response without stale browser fixes when verification GET fails', async () => {
      withSavedFixes(1);
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-2',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
      } as never);
      mockGetEnhancedResume.mockRejectedValueOnce(new Error('Temporary read failure'));
      uploadPdf();
      await screen.findByRole('dialog');

      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-2?source=enhanced'));
      expect(mockClearStoredFixedSuggestions).toHaveBeenCalled();
      expect(mockForgetFixedTextFor).toHaveBeenCalled();
      expect(mockToast.warning).toHaveBeenCalledWith('Opened the latest scan, but could not verify its saved-fix list.');
    });

    it('reads the saved record when the response carries no fix list', async () => {
      mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 'a' }] } as never);
      uploadPdf();

      expect(await screen.findByRole('dialog')).toHaveTextContent('1 fix applied');
    });

    it('opens the editor straight away when there is nothing saved', async () => {
      uploadPdf();

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
