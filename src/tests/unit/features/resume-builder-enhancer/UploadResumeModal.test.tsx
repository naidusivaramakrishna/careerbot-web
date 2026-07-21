import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadResumeModal from '@/app/(resume)/builder/start/_components/UploadResumeModal';
import { parseResumeForEnhancer, enhanceResume } from '@/api/enhancerApi';
import { mapParserOutputToBuilderData } from '@/utils/resumeMappers';
import { toast } from 'sonner';

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
}));

vi.mock('@/utils/resumeMappers', () => ({
  mapParserOutputToBuilderData: vi.fn(),
}));

const mockParseResumeForEnhancer = vi.mocked(parseResumeForEnhancer);
const mockEnhanceResume = vi.mocked(enhanceResume);
const mockMapParserOutputToBuilderData = vi.mocked(mapParserOutputToBuilderData);
const mockToast = vi.mocked(toast);

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
});
