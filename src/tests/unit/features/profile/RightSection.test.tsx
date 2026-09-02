/**
 * Unit tests for RightSection — profile sidebar with completeness indicator and quick actions.
 *
 * Covers:
 *   - Displays the correct completeness percentage
 *   - Shows correct status label for each completeness range
 *   - Shows "All fields complete!" when completeness=100 and no missing fields
 *   - Lists missing fields when completeness < 100
 *   - Shows "+N more" when there are more than 3 missing fields
 *   - "Upload Resume" area is present
 *   - "Upgrade Now" button navigates to /payments
 *   - Resume upload rejects invalid file types
 *   - Resume upload rejects files over 10MB
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/api/userApi', () => ({
  updateProfile: vi.fn(),
  getEducation: vi.fn().mockResolvedValue([]),
  getExperience: vi.fn().mockResolvedValue([]),
  getSkills: vi.fn().mockResolvedValue([]),
  deleteExperience: vi.fn(),
  deleteSkill: vi.fn(),
  deleteEducation: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([]),
  deleteProject: vi.fn(),
  addEducationAutoFill: vi.fn(),
  addExperienceAutoFill: vi.fn(),
  addSkillAutoFill: vi.fn(),
  addProjectAutoFill: vi.fn(),
  getCertification: vi.fn().mockResolvedValue([]),
  deleteCertification: vi.fn(),
  addCertificationAutoFill: vi.fn(),
  uploadResume: vi.fn(),
}));

vi.mock('@/api/resumeParsingApi', () => ({
  extractResume: vi.fn(),
}));

vi.mock('@/api/linkedinParsingApi', () => ({
  importLinkedInProfile: vi.fn(),
}));

vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ setProfileData: vi.fn() }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

vi.mock('@/app/(user)/profile/_utils/resumeMapper', () => ({
  mapResumeToProfile: vi.fn(),
}));

vi.mock('@/app/(user)/profile/_utils/linkedinMapper', () => ({
  mapLinkedinToProfile: vi.fn(),
}));

vi.mock('@/app/(user)/profile/_components/LinkedinImportModal', () => ({
  default: () => null,
}));

// ─── Component under test ─────────────────────────────────────────────────────
import RightSection from '@/app/(user)/profile/_components/RightSection';
import { uploadResume } from '@/api/userApi';
import { extractResume } from '@/api/resumeParsingApi';
import { mapResumeToProfile } from '@/app/(user)/profile/_utils/resumeMapper';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RightSection — completeness display', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('displays the completeness percentage', () => {
    render(<RightSection completeness={65} missingFields={[]} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows "Just Started" label for completeness < 30', () => {
    render(<RightSection completeness={10} missingFields={[]} />);
    expect(screen.getByText('Just Started')).toBeInTheDocument();
  });

  it('shows "Getting Started" label for completeness 30–59', () => {
    render(<RightSection completeness={45} missingFields={[]} />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('shows "Good Progress" label for completeness 60–79', () => {
    render(<RightSection completeness={70} missingFields={[]} />);
    expect(screen.getByText('Good Progress')).toBeInTheDocument();
  });

  it('shows "Almost There!" label for completeness 80–99', () => {
    render(<RightSection completeness={85} missingFields={[]} />);
    expect(screen.getByText('Almost There!')).toBeInTheDocument();
  });

  it('shows "Complete!" label for completeness 100', () => {
    render(<RightSection completeness={100} missingFields={[]} />);
    expect(screen.getByText('Complete!')).toBeInTheDocument();
  });
});

describe('RightSection — missing fields', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows "All fields complete!" when no missing fields', () => {
    render(<RightSection completeness={100} missingFields={[]} />);
    expect(screen.getByText('All fields complete!')).toBeInTheDocument();
  });

  it('lists missing fields when completeness < 100', () => {
    render(
      <RightSection
        completeness={60}
        missingFields={['Phone', 'LinkedIn', 'Summary']}
      />
    );
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('shows only first 4 missing fields and "+N more" for the rest', () => {
    render(
      <RightSection
        completeness={30}
        missingFields={['Phone', 'LinkedIn', 'Summary', 'GitHub', 'Headline']}
      />
    );
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Headline')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });
});

describe('RightSection — quick actions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the "Upload Resume" action area', () => {
    render(<RightSection completeness={50} missingFields={[]} />);
    expect(screen.getByText('Upload Resume')).toBeInTheDocument();
  });

  it('renders the "Upgrade Now" button', () => {
    render(<RightSection completeness={50} missingFields={[]} />);
    expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument();
  });

  it('navigates to /payments when "Upgrade Now" is clicked', () => {
    render(<RightSection completeness={50} missingFields={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /upgrade now/i }));
    expect(mockPush).toHaveBeenCalledWith('/payments');
  });

  it('renders the "Contact Support" link', () => {
    render(<RightSection completeness={50} missingFields={[]} />);
    expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
  });
});

describe('RightSection — resume upload validation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows error toast when an invalid file type is uploaded', async () => {
    render(<RightSection completeness={50} missingFields={[]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      configurable: true,
    });
    fireEvent.change(fileInput);

    expect(mockToast.error).toHaveBeenCalledWith('Please upload a PDF or DOCX file');
  });

  it('shows error toast when file exceeds 10MB', async () => {
    render(<RightSection completeness={50} missingFields={[]} />);

    const oversizedFile = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [oversizedFile],
      configurable: true,
    });
    fireEvent.change(fileInput);

    expect(mockToast.error).toHaveBeenCalledWith('File size should be less than 10MB');
  });
});

describe('RightSection — uploadResume fire-and-forget', () => {
  const mockUploadResume = vi.mocked(uploadResume);
  const mockExtractResume = vi.mocked(extractResume);
  const mockMapResumeToProfile = vi.mocked(mapResumeToProfile);

  beforeEach(() => {
    vi.clearAllMocks();
    // Return a minimal mapped object so the handler doesn't throw on !mapped
    mockMapResumeToProfile.mockReturnValue({} as ReturnType<typeof mapResumeToProfile>);
    mockExtractResume.mockResolvedValue({} as Awaited<ReturnType<typeof extractResume>>);
  });

  function triggerUpload(file = new File(['content'], 'resume.pdf', { type: 'application/pdf' })) {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fireEvent.change(fileInput);
    return file;
  }

  it('calls uploadResume immediately after extractResume succeeds', async () => {
    mockUploadResume.mockResolvedValueOnce({ resume_url: 'https://example.com/resume.pdf', message: 'ok', filename: 'resume.pdf' });
    render(<RightSection completeness={50} missingFields={[]} />);
    const file = triggerUpload();
    await waitFor(() => expect(mockUploadResume).toHaveBeenCalledWith(file));
  });

  it('shows toast.warning when uploadResume storage fails', async () => {
    mockUploadResume.mockRejectedValueOnce(new Error('Storage failed'));
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.warning).toHaveBeenCalledWith(
        expect.stringContaining('could not be saved'),
        expect.any(Object),
      )
    );
  });
});
