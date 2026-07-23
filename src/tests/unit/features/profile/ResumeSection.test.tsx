/**
 * Unit tests for ResumeSection — the resume upload/management section on the profile page.
 *
 * Covers:
 *   - Shows "Upload Your Resume" heading and "Choose Resume" button when no resume (404)
 *   - Shows resume filename and Delete/Replace buttons when a resume exists
 *   - Clicking Delete opens the "Delete Resume?" confirmation modal
 *   - Confirming the modal calls deleteResume and hides the modal
 *   - Clicking Cancel in the modal dismisses it without deleting
 *   - File type validation rejects non-PDF/DOCX/DOC files
 *   - File size validation rejects files over 10MB
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetResume = vi.fn();
const mockUploadResume = vi.fn();
const mockDeleteResume = vi.fn();
vi.mock('@/api/userApi', () => ({
  getResume: (...args: unknown[]) => mockGetResume(...args),
  uploadResume: (...args: unknown[]) => mockUploadResume(...args),
  deleteResume: (...args: unknown[]) => mockDeleteResume(...args),
}));

const mockSetProfileData = vi.fn();
vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ profileData: {}, setProfileData: mockSetProfileData }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

// ─── Component under test ─────────────────────────────────────────────────────
import ResumeSection from '@/app/(user)/profile/_components/ResumeSection';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const defaultProps = {
  setTempProfile: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResumeSection — no resume uploaded', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Upload Your Resume" heading when getResume returns 404', async () => {
    mockGetResume.mockRejectedValueOnce({ response: { status: 404 } });
    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Upload Your Resume')).toBeInTheDocument();
    });
  });

  it('shows "Choose Resume" button when no resume is present', async () => {
    mockGetResume.mockRejectedValueOnce({ response: { status: 404 } });
    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose resume/i })).toBeInTheDocument();
    });
  });
});

describe('ResumeSection — resume exists', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the resume filename derived from the URL', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/user-resume.pdf',
    });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Resume.pdf')).toBeInTheDocument();
    });
  });

  it('shows Delete and Replace buttons when resume exists', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/resume.docx',
    });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
    });
  });

  it('derives extension from resume URL for the filename', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/cv.docx',
    });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Resume.docx')).toBeInTheDocument();
    });
  });
});

describe('ResumeSection — delete flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Delete Resume?" confirmation modal when Delete is clicked', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/resume.pdf',
    });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.getByText('Delete Resume?')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete your resume/i)).toBeInTheDocument();
  });

  it('calls deleteResume and closes the modal on confirm', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/resume.pdf',
    });
    mockDeleteResume.mockResolvedValueOnce({ message: 'Resume deleted successfully' });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    // Open the confirmation modal
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText('Delete Resume?')).toBeInTheDocument();

    // Click the modal's confirm Delete button (second Delete button in DOM)
    const [, modalDeleteBtn] = screen.getAllByRole('button', { name: /^delete$/i });
    fireEvent.click(modalDeleteBtn);

    await waitFor(() => {
      expect(mockDeleteResume).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Delete Resume?')).not.toBeInTheDocument();
    });
  });

  it('dismisses the modal without deleting when Cancel is clicked', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/resume.pdf',
    });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText('Delete Resume?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText('Delete Resume?')).not.toBeInTheDocument();
    expect(mockDeleteResume).not.toHaveBeenCalled();
  });

  it('updates the global profile context after a successful delete', async () => {
    mockGetResume.mockResolvedValueOnce({
      resume_url: 'https://storage.example.com/resumes/resume.pdf',
    });
    mockDeleteResume.mockResolvedValueOnce({ message: 'Resume deleted successfully' });

    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    const [, modalDeleteBtn] = screen.getAllByRole('button', { name: /^delete$/i });
    fireEvent.click(modalDeleteBtn);

    await waitFor(() => {
      expect(mockSetProfileData).toHaveBeenCalled();
    });
  });
});

describe('ResumeSection — upload validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows error toast when an invalid file type is selected', async () => {
    mockGetResume.mockRejectedValueOnce({ response: { status: 404 } });
    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose resume/i })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      configurable: true,
    });
    fireEvent.change(fileInput);

    expect(mockToast.error).toHaveBeenCalledWith('Please upload a PDF, DOCX, or DOC file');
    expect(mockUploadResume).not.toHaveBeenCalled();
  });

  it('shows error toast when file exceeds 10MB', async () => {
    mockGetResume.mockRejectedValueOnce({ response: { status: 404 } });
    render(<ResumeSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose resume/i })).toBeInTheDocument();
    });

    const oversizedFile = new File(['x'.repeat(1)], 'big-resume.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [oversizedFile],
      configurable: true,
    });
    fireEvent.change(fileInput);

    expect(mockToast.error).toHaveBeenCalledWith('File size must be less than 10MB');
    expect(mockUploadResume).not.toHaveBeenCalled();
  });
});
