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

// The API requires target_role (blank or placeholder -> 422) and takes mode manual|auto.
const ENHANCE_REQUEST = { resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'Software Developer' };

const renderModal = (isOpen = true) => render(<UploadResumeModal isOpen={isOpen} onClose={onClose} />);

describe('UploadResumeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    mockGetEnhancedResume.mockResolvedValue({ applied_fixes: [] } as never);
    mockParseResumeForEnhancer.mockResolvedValue({
      resume_id: 'parsed-resume-1',
      parsed_data: { headline: 'Software Developer' },
    } as never);
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
    expect(mockEnhanceResume).toHaveBeenCalledWith(ENHANCE_REQUEST);
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
    expect(mockEnhanceResume).toHaveBeenCalledWith(ENHANCE_REQUEST);
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

  // Each case renders the modal and a dialog several times; the 5 s default is too tight on the CI runners.
  describe('target role', { timeout: 30_000 }, () => {
    const upload = () => {
      const view = renderModal();
      fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLInputElement, {
        target: { files: [pdfFile()] },
      });
      return view;
    };
    const noRoleInResume = () =>
      mockParseResumeForEnhancer.mockResolvedValue({
        resume_id: 'parsed-resume-1',
        parsed_data: { headline: 'Fresher', experience: [] },
      } as never);
    const roleRejected = (raw: unknown) =>
      Object.assign(new Error('We could not tell which role to score your resume for.'), { __raw: raw, status: 422 });
    const scanButton = () => screen.getByRole('button', { name: 'Scan my resume' }) as HTMLButtonElement;

    it('sends the role the resume names and mode "manual"', async () => {
      mockParseResumeForEnhancer.mockResolvedValue({
        resume_id: 'parsed-resume-1',
        parsed_data: { experience: [{ title: 'Data Analyst' }] },
      } as never);
      upload();

      await waitFor(() => expect(mockPush).toHaveBeenCalled());
      expect(mockEnhanceResume).toHaveBeenCalledWith({
        resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'Data Analyst',
      });
    });

    it('asks once when the resume names no role, and sends nothing until a usable role is typed', async () => {
      noRoleInResume();
      upload();

      expect(await screen.findByRole('dialog', { name: 'Which role are you aiming for?' })).toBeInTheDocument();
      expect(mockEnhanceResume).not.toHaveBeenCalled();

      // Look the controls up once: role queries are slow in jsdom and the dialog keeps the same nodes.
      const roleField = screen.getByLabelText('Target role');
      const button = scanButton();
      for (const refused of ['   ', 'string', 'n/a', 'x']) {
        fireEvent.change(roleField, { target: { value: refused } });
        expect(button.disabled).toBe(true);
        fireEvent.submit(button.closest('form') as HTMLFormElement);
      }
      expect(mockEnhanceResume).not.toHaveBeenCalled();

      fireEvent.change(roleField, { target: { value: '  Product Manager  ' } });
      fireEvent.click(button);

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenCalledTimes(1);
      expect(mockEnhanceResume).toHaveBeenCalledWith({
        resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'Product Manager',
      });
      expect(mockParseResumeForEnhancer).toHaveBeenCalledTimes(1);   // the file is not parsed again
    });

    it('goes back to the upload step when the role prompt is cancelled', async () => {
      noRoleInResume();
      upload();

      await screen.findByRole('dialog', { name: 'Which role are you aiming for?' });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
      expect(mockEnhanceResume).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it.each([
      ['target_role_required', { success: false, error: { message: 'HTTP 422', details: { error: 'target_role_required' } } }],
      ['a 422 validation error on target_role', {
        success: false,
        error: { message: 'Invalid target_role: ...', error_code: 'VALIDATION_ERROR', validation_errors: [{ field: 'target_role', message: 'Value error' }] },
      }],
      ['a 422 validation error on target_role under details', {
        success: false,
        error: { message: 'Invalid target_role: ...', error_code: 'VALIDATION_ERROR', details: { validation_errors: [{ field: 'target_role', message: 'Value error' }] } },
      }],
    ])('asks for the role when the API refuses it (%s), then retries with the typed role', async (_label, raw) => {
      mockEnhanceResume.mockRejectedValueOnce(roleRejected(raw));
      upload();

      const dialog = await screen.findByRole('dialog', { name: 'Which role are you aiming for?' });
      expect(mockToast.error).toHaveBeenCalledWith('Enter the role you are targeting, for example Software Developer.');
      // The resume named "Software Developer": say that role was refused, not that the resume has none.
      expect(dialog).toHaveTextContent('We couldn\'t score your resume for "Software Developer".');
      expect(dialog).not.toHaveTextContent('no headline or job title');
      expect(mockPush).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText('Target role'), { target: { value: 'Backend Engineer' } });
      fireEvent.click(scanButton());

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenLastCalledWith({
        resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'Backend Engineer',
      });
    });

    it('asks again, naming the typed role, when the API refuses that one too', async () => {
      noRoleInResume();
      mockEnhanceResume.mockRejectedValueOnce(roleRejected({
        success: false,
        error: { message: 'Invalid target_role: ...', error_code: 'VALIDATION_ERROR', validation_errors: [{ field: 'target_role', message: 'Value error' }] },
      }));
      upload();

      const first = await screen.findByRole('dialog', { name: 'Which role are you aiming for?' });
      expect(first).toHaveTextContent('no headline or job title');            // nothing was sent yet
      fireEvent.change(screen.getByLabelText('Target role'), { target: { value: 'Chief Vibes Officer' } });
      fireEvent.click(scanButton());

      await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('We couldn\'t score your resume for "Chief Vibes Officer".'));
      expect(screen.getByLabelText('Target role')).toHaveValue('');
      expect(mockEnhanceResume).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockParseResumeForEnhancer).toHaveBeenCalledTimes(1);

      fireEvent.change(screen.getByLabelText('Target role'), { target: { value: 'Data Analyst' } });
      fireEvent.click(scanButton());
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenLastCalledWith({
        resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'Data Analyst',
      });
    });

    it('keeps the saved-fixes choice open when start-fresh gets a role 422 (the same role was just accepted)', async () => {
      mockEnhanceResume
        .mockResolvedValueOnce({
          enhanced_resume_id: 'enhanced-resume-1',
          enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
          applied_fixes: [{ suggestion_id: 's0' }],
        } as never)
        .mockRejectedValueOnce(roleRejected({
          success: false,
          error: { message: 'HTTP 422', details: { error: 'target_role_required' } },
        }));
      mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 's0' }] } as never);
      upload();

      await screen.findByText('Start with fresh data');
      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('We could not tell which role to score your resume for.'));
      expect(screen.getByRole('dialog', { name: 'Start with fresh data?' })).toBeInTheDocument();   // still the saved-fixes choice
      expect(screen.getByText('Yes, start fresh')).not.toBeDisabled();
      expect(screen.queryByRole('dialog', { name: 'Which role are you aiming for?' })).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows the error and resets for any other 422', async () => {
      mockEnhanceResume.mockRejectedValueOnce(Object.assign(new Error('Add your name to the resume.'), {
        __raw: { success: false, error: { message: 'HTTP 422', details: { error: 'contact_name_required' } } },
        status: 422,
      }));
      upload();

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Add your name to the resume.'));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByText('Drag & drop your resume')).toBeInTheDocument();
    });

    it('sends the typed role again when starting fresh', async () => {
      noRoleInResume();
      mockEnhanceResume
        .mockResolvedValueOnce({
          enhanced_resume_id: 'enhanced-resume-1',
          enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
          applied_fixes: [{ suggestion_id: 's0' }],
        } as never)
        .mockResolvedValueOnce({
          enhanced_resume_id: 'enhanced-resume-2',
          enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
          applied_fixes: [],
        } as never);
      upload();
      await screen.findByRole('dialog', { name: 'Which role are you aiming for?' });
      fireEvent.change(screen.getByLabelText('Target role'), { target: { value: 'QA Engineer' } });
      fireEvent.click(scanButton());

      await screen.findByText('Start with fresh data');
      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-2?source=enhanced'));
      expect(mockEnhanceResume).toHaveBeenLastCalledWith({
        resume_id: 'parsed-resume-1', mode: 'manual', target_role: 'QA Engineer', force_refresh: true,
      });
    });

    it('does not count fixes an ATS scan applied by itself (auto) as the user\'s saved work', async () => {
      mockEnhanceResume.mockResolvedValueOnce({
        enhanced_resume_id: 'enhanced-resume-1',
        enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
        applied_fixes: [{ suggestion_id: 'a1', auto: true }, { suggestion_id: 'a2', auto: true }],
      } as never);
      upload();

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(screen.queryByText('Continue with my changes')).toBeNull();
    });

    it('does not count auto fixes from the saved record either (no inline fix list)', async () => {
      mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 'a1', auto: true }] } as never);
      upload();

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/builder/creation/enhanced-resume-1?source=enhanced'));
      expect(mockGetEnhancedResume).toHaveBeenCalledWith('enhanced-resume-1');
      expect(screen.queryByText('Continue with my changes')).toBeNull();
    });

    it('treats a record left with only auto fixes after a failed start-fresh as "fixes already removed"', async () => {
      mockEnhanceResume
        .mockResolvedValueOnce({
          enhanced_resume_id: 'enhanced-resume-1',
          enhanced_resume: { personalInfo: { fullname: 'Jane Candidate' } },
          applied_fixes: [{ suggestion_id: 's0' }],
        } as never)
        .mockRejectedValueOnce(new Error('Insufficient credits'));
      mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 'a1', auto: true }] } as never);
      upload();

      await screen.findByText('Start with fresh data');
      fireEvent.click(screen.getByText('Start with fresh data'));
      fireEvent.click(screen.getByText('Yes, start fresh'));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith(
        'Insufficient credits The earlier fixes were already removed from this resume.',
      ));
      expect(mockClearStoredFixedSuggestions).toHaveBeenCalledWith('enhanced-resume-1');
      expect(mockForgetFixedTextFor).toHaveBeenCalledWith('enhanced-resume-1');
      expect(screen.queryByText('Continue with my changes')).toBeNull();
    });
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
      expect(mockEnhanceResume).toHaveBeenLastCalledWith({ ...ENHANCE_REQUEST, force_refresh: true });
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

    describe('when "Start fresh" fails (e.g. 402 out of credits)', () => {
      const failFreshScan = () => {
        withSavedFixes(1);
        mockEnhanceResume.mockRejectedValueOnce(new Error('Insufficient credits'));
        uploadPdf();
      };
      const confirmStartFresh = async () => {
        await screen.findByRole('dialog');
        fireEvent.click(screen.getByText('Start with fresh data'));
        fireEvent.click(screen.getByText('Yes, start fresh'));
      };

      it('drops the stale copy when the server already removed the fixes', async () => {
        failFreshScan();
        await confirmStartFresh();

        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith(
          'Insufficient credits The earlier fixes were already removed from this resume.',
        ));
        expect(mockGetEnhancedResume).toHaveBeenLastCalledWith('enhanced-resume-1');
        expect(mockClearStoredFixedSuggestions).toHaveBeenCalledWith('enhanced-resume-1');
        expect(mockForgetFixedTextFor).toHaveBeenCalledWith('enhanced-resume-1');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByText('Continue with my changes')).toBeNull();
        expect(mockPush).not.toHaveBeenCalled();
      });

      it('keeps the choice open when the saved fixes are still there', async () => {
        failFreshScan();
        mockGetEnhancedResume.mockResolvedValueOnce({ applied_fixes: [{ suggestion_id: 's0' }] } as never);
        await confirmStartFresh();

        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Insufficient credits'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(mockClearStoredFixedSuggestions).not.toHaveBeenCalled();
        expect(mockForgetFixedTextFor).not.toHaveBeenCalled();
      });

      it('keeps the choice open when the saved record does not say (no applied_fixes field)', async () => {
        failFreshScan();
        mockGetEnhancedResume.mockResolvedValueOnce({} as never);
        await confirmStartFresh();

        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Insufficient credits'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(mockClearStoredFixedSuggestions).not.toHaveBeenCalled();
        expect(mockForgetFixedTextFor).not.toHaveBeenCalled();
      });

      it('keeps the choice open when the saved record cannot be read', async () => {
        failFreshScan();
        mockGetEnhancedResume.mockRejectedValueOnce(new Error('Temporary read failure'));
        await confirmStartFresh();

        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Insufficient credits'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(mockClearStoredFixedSuggestions).not.toHaveBeenCalled();
        expect(mockForgetFixedTextFor).not.toHaveBeenCalled();
      });
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
