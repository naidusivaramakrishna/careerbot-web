/**
 * Unit tests for WorkExperienceSection — CRUD UI for work experience entries.
 *
 * Covers:
 *   - Renders empty state when no experience and API returns []
 *   - Renders experience cards when tempProfile has data
 *   - Does not call getExperience when data already in tempProfile
 *   - Opens add modal when "Add Experience" button is clicked
 *   - Calls addExperienceItem and shows success toast on add save
 *   - Opens edit modal when edit button is clicked
 *   - Calls updateExperience and shows success toast on edit save
 *   - Opens confirm delete modal when delete button is clicked
 *   - Calls deleteExperience on confirm
 *   - Cancels delete when cancel is clicked
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetExperience = vi.fn();
const mockUpdateExperience = vi.fn();
const mockDeleteExperience = vi.fn();

vi.mock('@/api/userApi', () => ({
  getExperience: (...args: unknown[]) => mockGetExperience(...args),
  updateExperience: (...args: unknown[]) => mockUpdateExperience(...args),
  deleteExperience: (...args: unknown[]) => mockDeleteExperience(...args),
}));

const mockAddExperienceItem = vi.fn();
vi.mock('@/app/(user)/profile/_utils/autoFillHelper', () => ({
  addExperienceItem: (...args: unknown[]) => mockAddExperienceItem(...args),
}));

const mockSetProfileData = vi.fn();
vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ setProfileData: mockSetProfileData }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

// ─── Component under test ─────────────────────────────────────────────────────
import WorkExperienceSection from '@/app/(user)/profile/_components/experience/WorkExperienceSection';
import { toast } from 'sonner';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const emptyProfile = { workExperience: [] };
const expEntry = {
  id: 'exp-1',
  job_title: 'Software Engineer',
  company: 'Acme Corp',
  job_type: 'full-time',
  location: 'New York',
  start_date: '2020-01-01',
  end_date: '2023-01-01',
  description: 'Built cool things.',
};
const profileWithExp = { workExperience: [expEntry] };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkExperienceSection — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetExperience.mockResolvedValue([]);
  });

  it('shows empty state when API returns no experience', async () => {
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('add-experience-btn')).toBeInTheDocument();
    });
  });
});

describe('WorkExperienceSection — list rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders experience card when data is pre-loaded', async () => {
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('experience-card-0')).toBeInTheDocument();
    });
  });

  it('does not call getExperience when tempProfile already has experience', async () => {
    mockGetExperience.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-card-0')).toBeInTheDocument());
    expect(mockGetExperience).not.toHaveBeenCalled();
  });
});

describe('WorkExperienceSection — add experience', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens add modal when "Add Experience" button is clicked', async () => {
    mockGetExperience.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-experience-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-experience-btn'));
    expect(screen.getByTestId('exp-job-title-input')).toBeInTheDocument();
  });

  it('calls addExperienceItem and shows success toast on save', async () => {
    mockGetExperience.mockResolvedValue([]);
    mockAddExperienceItem.mockResolvedValue({ id: 'new-1', job_title: 'Dev', company: 'Co' });
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-experience-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-experience-btn'));
    fireEvent.change(screen.getByTestId('exp-job-title-input'), {
      target: { value: 'Dev' },
    });
    fireEvent.click(screen.getByTestId('exp-save-btn'));

    await waitFor(() => {
      expect(mockAddExperienceItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Experience added');
    });
  });
});

describe('WorkExperienceSection — edit experience', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens edit modal when edit button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-edit-btn-0'));
    expect(screen.getByTestId('exp-job-title-input')).toBeInTheDocument();
  });

  it('calls updateExperience and shows success toast on edit save', async () => {
    mockUpdateExperience.mockResolvedValue({ ...expEntry, job_title: 'Senior Engineer' });
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-edit-btn-0'));
    fireEvent.click(screen.getByTestId('exp-save-btn'));

    await waitFor(() => {
      expect(mockUpdateExperience).toHaveBeenCalledWith('exp-1', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Experience updated');
    });
  });
});

describe('WorkExperienceSection — delete experience', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens confirm delete modal when delete button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-delete-btn-0'));
    expect(screen.getByTestId('modal-confirm-btn')).toBeInTheDocument();
  });

  it('calls deleteExperience on confirm', async () => {
    mockDeleteExperience.mockResolvedValue({});
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(mockDeleteExperience).toHaveBeenCalledWith('exp-1');
    });
  });

  it('does not call deleteExperience when cancel is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<WorkExperienceSection tempProfile={profileWithExp} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('experience-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-cancel-btn'));
    expect(mockDeleteExperience).not.toHaveBeenCalled();
  });
});
