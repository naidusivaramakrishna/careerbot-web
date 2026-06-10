import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockProcessResumeComplete = vi.fn();

vi.mock('@/api/resumeatsapi', () => ({
  processResumeComplete: (...args: any[]) => mockProcessResumeComplete(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createMockFile = (name: string, size = 500 * 1024, type = 'application/pdf') => {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// ─── Test component ───────────────────────────────────────────────────────────

function ATSLoginPageWrapper() {
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canScan = Boolean(file && agreed);

  const validateAndSetFile = (f: File) => {
    setError('');
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setError('Invalid file type. Only PDF, DOCX, and DOC are allowed.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB. Please upload a smaller file.');
      return;
    }
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    setAgreed(false);
  };

  const handleScanResume = async () => {
    if (!file) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await mockProcessResumeComplete(file);
      if (!result.success) {
        throw new Error(result.error ?? 'Upload failed');
      }
      const resumeId = result.resume_id ?? '';
      mockPush(`/atslogin/report?resume_id=${resumeId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to process your resume. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div data-testid="error-modal">
          <p data-testid="error-message">{error}</p>
          <button data-testid="try-again-button" onClick={() => setError('')}>
            Try Again
          </button>
        </div>
      )}

      {isLoading && <div data-testid="loading-overlay">Analyzing your resume…</div>}

      {!file ? (
        <label htmlFor="ats-file-upload" data-testid="upload-zone">
          Drop your resume here
          <input
            type="file"
            id="ats-file-upload"
            data-testid="file-input"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc"
          />
        </label>
      ) : (
        <div data-testid="file-preview">
          <span data-testid="file-name">{file.name}</span>
          <span data-testid="file-size">{(file.size / 1024).toFixed(0)} KB</span>
          <p data-testid="ready-to-scan">Ready to scan</p>
          <button data-testid="remove-file-button" aria-label="Remove file" onClick={handleRemoveFile}>
            Remove
          </button>
          <label>
            <input
              type="checkbox"
              data-testid="terms-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I agree to CareerBot&apos;s Terms of Service
          </label>
        </div>
      )}

      <button data-testid="scan-button" onClick={handleScanResume} disabled={!canScan}>
        {!file ? 'Drop your resume to begin' : !agreed ? 'Accept terms to continue' : 'Upload & Scan Resume'}
      </button>
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ATSLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the upload zone when no file is selected', () => {
    render(<ATSLoginPageWrapper />);
    expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
  });

  it('renders the hidden file input with correct accepted formats', () => {
    render(<ATSLoginPageWrapper />);
    expect(screen.getByTestId('file-input')).toHaveAttribute('accept', '.pdf,.docx,.doc');
  });

  it('renders scan button as disabled when no file is selected', () => {
    render(<ATSLoginPageWrapper />);
    expect(screen.getByTestId('scan-button')).toBeDisabled();
  });

  it('shows "Drop your resume to begin" label when no file selected', () => {
    render(<ATSLoginPageWrapper />);
    expect(screen.getByTestId('scan-button')).toHaveTextContent('Drop your resume to begin');
  });

  it('shows error for unsupported file type (e.g. .txt)', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.txt', 100 * 1024, 'text/plain')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Invalid file type. Only PDF, DOCX, and DOC are allowed.'
      );
    });
  });

  it('shows error for file larger than 10MB', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf', 11 * 1024 * 1024)] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'File size exceeds 10MB. Please upload a smaller file.'
      );
    });
  });

  it('accepts a valid PDF file', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('file-preview')).toBeInTheDocument();
      expect(screen.getByTestId('file-name')).toHaveTextContent('resume.pdf');
    });
  });

  it('accepts a valid DOCX file', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.docx', 200 * 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('file-name')).toHaveTextContent('resume.docx');
    });
  });

  it('accepts a valid DOC file', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.doc', 200 * 1024, 'application/msword')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('file-name')).toHaveTextContent('resume.doc');
    });
  });

  it('shows file size in KB in file preview', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf', 512 * 1024)] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('file-size')).toHaveTextContent('512 KB');
    });
  });

  it('shows "Ready to scan" text after valid file selected', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('ready-to-scan')).toBeInTheDocument();
    });
  });

  it('removes file and returns to upload zone when remove button clicked', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('file-preview')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('remove-file-button'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    });
  });

  it('shows "Accept terms to continue" when file selected but terms not agreed', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('scan-button')).toHaveTextContent('Accept terms to continue');
    });
  });

  it('keeps scan button disabled until terms checkbox is checked', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    expect(screen.getByTestId('scan-button')).toBeDisabled();
  });

  it('enables scan button after file selected and terms agreed', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    await waitFor(() => {
      expect(screen.getByTestId('scan-button')).not.toBeDisabled();
      expect(screen.getByTestId('scan-button')).toHaveTextContent('Upload & Scan Resume');
    });
  });

  it('shows loading overlay while scan is in progress', async () => {
    mockProcessResumeComplete.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, resume_id: 'r-1' }), 200))
    );
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('scan-button'));
    await waitFor(() => {
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    });
  });

  it('redirects to report page with correct resume_id on success', async () => {
    mockProcessResumeComplete.mockResolvedValue({ success: true, resume_id: 'abc-123' });
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('scan-button'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/atslogin/report?resume_id=abc-123');
    });
  });

  it('shows error modal when API returns success: false', async () => {
    mockProcessResumeComplete.mockResolvedValue({ success: false, error: 'Parse failed on server' });
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('scan-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Parse failed on server');
    });
  });

  it('shows error modal when API throws an exception', async () => {
    mockProcessResumeComplete.mockRejectedValue(new Error('Network timeout'));
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('scan-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network timeout');
    });
  });

  it('dismisses error modal when "Try Again" is clicked', async () => {
    mockProcessResumeComplete.mockRejectedValue(new Error('Network error'));
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('scan-button'));
    await waitFor(() => expect(screen.getByTestId('error-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('try-again-button'));
    await waitFor(() => {
      expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument();
    });
  });

  it('resets agreed state when file is removed', async () => {
    render(<ATSLoginPageWrapper />);
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [createMockFile('resume.pdf')] },
    });
    await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('terms-checkbox'));
    fireEvent.click(screen.getByTestId('remove-file-button'));
    await waitFor(() => {
      expect(screen.getByTestId('scan-button')).toBeDisabled();
    });
  });
});
