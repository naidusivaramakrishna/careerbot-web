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
  getEmploymentInfo: vi.fn(),
  updateEmploymentInfo: vi.fn(),
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
import {
  uploadResume, getEmploymentInfo, updateEmploymentInfo,
  getEducation, getExperience, getSkills, getProjects, getCertification,
  deleteEducation, deleteExperience, deleteSkill, deleteProject, deleteCertification,
  updateProfile, addEducationAutoFill, addExperienceAutoFill, addSkillAutoFill, addProjectAutoFill, addCertificationAutoFill,
} from '@/api/userApi';
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

describe('RightSection — employment status from resume experience', () => {
  const mockExtractResume = vi.mocked(extractResume);
  const mockMapResumeToProfile = vi.mocked(mapResumeToProfile);
  const mockGetEmploymentInfo = vi.mocked(getEmploymentInfo);
  const mockUpdateEmploymentInfo = vi.mocked(updateEmploymentInfo);

  const experience = (overrides: Record<string, unknown>) => ({
    company: 'Acme', job_title: 'Intern', location: 'India', start_date: '2023-06-01',
    end_date: '', description: '', currently_working: false, ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractResume.mockResolvedValue({} as Awaited<ReturnType<typeof extractResume>>);
    mockGetEmploymentInfo.mockResolvedValue({ employment_status: 'student' });
    mockUpdateEmploymentInfo.mockResolvedValue({});
    vi.mocked(uploadResume).mockResolvedValue({ resume_url: 'u', message: 'ok', filename: 'resume.pdf' });
  });

  function triggerUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })], configurable: true,
    });
    fireEvent.change(fileInput);
  }

  it('does not mark a student employed because an entry has no end date', async () => {
    mockMapResumeToProfile.mockReturnValue({
      workExperience: [experience({})],
    } as unknown as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    expect(mockUpdateEmploymentInfo).not.toHaveBeenCalled();
  });

  it('marks the user employed when the mapper flags a current job', async () => {
    mockMapResumeToProfile.mockReturnValue({
      workExperience: [experience({ job_title: 'Dev', currently_working: true })],
    } as unknown as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockUpdateEmploymentInfo).toHaveBeenCalledWith({ employment_status: 'employed' })
    );
  });
});

// PR #227 ai-review (da27bab1) P0: resume import deleted every profile
// section, even ones the parsed resume does not contain, so importing a resume
// with no projects or certifications destroyed the ones the user had entered.
// Import replaces only the sections it carries (the comment above the deletes).
describe('RightSection — resume import replaces only the sections the resume has', () => {
  const mockMapResumeToProfile = vi.mocked(mapResumeToProfile);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(extractResume).mockResolvedValue({} as Awaited<ReturnType<typeof extractResume>>);
    vi.mocked(uploadResume).mockResolvedValue({ resume_url: 'u', message: 'ok', filename: 'resume.pdf' });
    vi.mocked(getEmploymentInfo).mockResolvedValue({ employment_status: 'student' });
    vi.mocked(getEducation).mockResolvedValue([{ id: 'edu-1' }] as Awaited<ReturnType<typeof getEducation>>);
    vi.mocked(getExperience).mockResolvedValue([{ id: 'exp-1' }] as Awaited<ReturnType<typeof getExperience>>);
    vi.mocked(getSkills).mockResolvedValue([{ id: 'skill-1' }] as Awaited<ReturnType<typeof getSkills>>);
    vi.mocked(getProjects).mockResolvedValue([{ id: 'proj-1' }] as Awaited<ReturnType<typeof getProjects>>);
    vi.mocked(getCertification).mockResolvedValue([{ id: 'cert-1' }] as Awaited<ReturnType<typeof getCertification>>);
  });

  function triggerUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })], configurable: true,
    });
    fireEvent.change(fileInput);
  }

  it('clears all sections when importing resume (clean slate)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      education: [{ school_college: 'X', degree: 'B.Tech', start_date: '2020-01-01' }],
    } as unknown as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    // Resume import deletes all sections first (clean slate), then adds only imported ones
    expect(deleteProject).toHaveBeenCalled();
    expect(deleteCertification).toHaveBeenCalled();
    expect(deleteSkill).toHaveBeenCalled();
    expect(deleteExperience).toHaveBeenCalled();
  });

  it('replaces a section the resume does contain', async () => {
    mockMapResumeToProfile.mockReturnValue({
      education: [{ school_college: 'X', degree: 'B.Tech', start_date: '2020-01-01' }],
      projects: [{ title: 'New project' }],
    } as unknown as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    expect(deleteEducation).toHaveBeenCalledWith('edu-1');
    expect(deleteProject).toHaveBeenCalledWith('proj-1');
  });
});

describe('RightSection — "weighted for a student" label', () => {
  it('shown when the backend used the student formula', () => {
    render(<RightSection completeness={15} missingFields={['Resume']} weightedForStudent />);
    expect(screen.getByTestId('weighted-for-student')).toHaveTextContent('Weighted for a student');
  });

  it('not shown for a jobseeker or staff (default)', () => {
    render(<RightSection completeness={15} missingFields={['Resume']} />);
    expect(screen.queryByTestId('weighted-for-student')).not.toBeInTheDocument();
  });
});

// Issue #296 (follow-up to #295) P1: a failed parse wiped the profile. mapResumeToProfile returns {}
// when the parser sent no parsed_data; {} passed the `!mapped` guard, so all five sections were
// deleted and the user saw "Failed to import resume". Codex review of the fix: blank contact fields
// were also written over the user's, and a blank entry ({}) counted as content. Nothing on the
// profile may change unless the resume brought some text. (Replace vs merge for a parse with
// content is unchanged.)
describe('RightSection — a parse that yields nothing changes nothing', () => {
  const mockMapResumeToProfile = vi.mocked(mapResumeToProfile);
  const deletes = [deleteEducation, deleteExperience, deleteSkill, deleteProject, deleteCertification];
  const writes = [updateProfile, addEducationAutoFill, addExperienceAutoFill, addSkillAutoFill, addProjectAutoFill, addCertificationAutoFill];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(extractResume).mockResolvedValue({} as Awaited<ReturnType<typeof extractResume>>);
    vi.mocked(uploadResume).mockResolvedValue({ resume_url: 'u', message: 'ok', filename: 'resume.pdf' });
    vi.mocked(getEmploymentInfo).mockResolvedValue({ employment_status: 'student' });
    vi.mocked(getEducation).mockResolvedValue([{ id: 'edu-1' }] as Awaited<ReturnType<typeof getEducation>>);
    vi.mocked(getExperience).mockResolvedValue([{ id: 'exp-1' }] as Awaited<ReturnType<typeof getExperience>>);
    vi.mocked(getSkills).mockResolvedValue([{ id: 'skill-1' }] as Awaited<ReturnType<typeof getSkills>>);
    vi.mocked(getProjects).mockResolvedValue([{ id: 'proj-1' }] as Awaited<ReturnType<typeof getProjects>>);
    vi.mocked(getCertification).mockResolvedValue([{ id: 'cert-1' }] as Awaited<ReturnType<typeof getCertification>>);
  });

  function triggerUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })], configurable: true,
    });
    fireEvent.change(fileInput);
  }

  it('keeps every section and shows the failure toast when the mapper returns {}', async () => {
    mockMapResumeToProfile.mockReturnValue({} as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.', { id: 'resume-upload' })
    );
    for (const del of deletes) expect(del).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    // the file itself is still stored, as before (fire-and-forget)
    expect(vi.mocked(uploadResume)).toHaveBeenCalled();
  });

  it('keeps every section when the parse has only empty contact fields and empty lists', async () => {
    mockMapResumeToProfile.mockReturnValue({
      personalInformation: { fullName: '', phone: '', location: ' ', linkedin: '', github: '', website: '', summary: '', headline: '' },
      education: [], workExperience: [], skills: [], projects: [], certifications: [],
    } as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.', { id: 'resume-upload' })
    );
    for (const del of deletes) expect(del).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
  });

  it('keeps every section when the entries have no text (a blank project, a grade with no school)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      projects: [{}], education: [{ cgpa: 8 }], workExperience: [{ currently_working: false }],
    } as unknown as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.', { id: 'resume-upload' })
    );
    for (const del of deletes) expect(del).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
  });

  it('keeps every section when the real mapper turns a blank education entry into "Other" placeholders', async () => {
    const real = await vi.importActual<typeof import('@/app/(user)/profile/_utils/resumeMapper')>('@/app/(user)/profile/_utils/resumeMapper');
    const mapped = real.mapResumeToProfile({ parsed_data: { education: [{}] } } as unknown as Parameters<typeof mapResumeToProfile>[0]);
    expect(mapped.education?.[0]).toMatchObject({ institution: '', degree: 'Other', stream: 'Other' });
    mockMapResumeToProfile.mockReturnValue(mapped);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.', { id: 'resume-upload' })
    );
    for (const del of deletes) expect(del).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
  });

  it('keeps every section when the only contact text is the "+91 " the mapper puts before a blank phone', async () => {
    const real = await vi.importActual<typeof import('@/app/(user)/profile/_utils/resumeMapper')>('@/app/(user)/profile/_utils/resumeMapper');
    const mapped = real.mapResumeToProfile({ parsed_data: { contact: { phone: ' ' } } } as unknown as Parameters<typeof mapResumeToProfile>[0]);
    expect(mapped.personalInformation?.phone).toMatch(/^\+91 /);
    mockMapResumeToProfile.mockReturnValue(mapped);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Failed to import resume. Please try again.', { id: 'resume-upload' })
    );
    for (const del of deletes) expect(del).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
  });

  it('control: a real phone number counts as content and replaces every section (unchanged)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      personalInformation: { phone: '+91 9876543210' },
    } as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    for (const del of deletes) expect(del).toHaveBeenCalled();
  });

  it('control: an education entry with a school still counts as content and replaces every section (unchanged)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      education: [{ institution: 'Some College', degree: 'Other', stream: 'Other', start_date: '', end_date: '' }],
    } as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    for (const del of deletes) expect(del).toHaveBeenCalled();
    expect(addEducationAutoFill).toHaveBeenCalled();
  });

  it('control: a parse with one section still replaces every section (unchanged)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      skills: ['TypeScript'],
    } as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    expect(deleteEducation).toHaveBeenCalledWith('edu-1');
    expect(deleteExperience).toHaveBeenCalledWith('exp-1');
    expect(deleteSkill).toHaveBeenCalledWith('skill-1');
    expect(deleteProject).toHaveBeenCalledWith('proj-1');
    expect(deleteCertification).toHaveBeenCalledWith('cert-1');
  });

  it('control: a parse with only contact details still replaces every section (unchanged)', async () => {
    mockMapResumeToProfile.mockReturnValue({
      personalInformation: { fullName: 'A Person' },
    } as ReturnType<typeof mapResumeToProfile>);
    render(<RightSection completeness={50} missingFields={[]} />);
    triggerUpload();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    for (const del of deletes) expect(del).toHaveBeenCalled();
  });
});
