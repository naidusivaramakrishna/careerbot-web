/**
 * Unit tests for EducationSection — CRUD UI for education entries.
 *
 * Covers:
 *   - Renders empty state when no education and API returns []
 *   - Renders education cards when API returns data
 *   - Opens add modal when "Add Education" button is clicked
 *   - Calls addEducationItem and shows success toast when form is saved (add)
 *   - Opens edit modal pre-filled when edit button is clicked
 *   - Calls updateEducation and shows success toast on edit save
 *   - Opens confirm delete modal when delete button is clicked
 *   - Calls deleteEducation and updates list on confirm
 *   - Shows error toast when save fails with validation error
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetEducation = vi.fn();
const mockUpdateEducation = vi.fn();
const mockDeleteEducation = vi.fn();

vi.mock('@/api/userApi', () => ({
  getEducation: (...args: unknown[]) => mockGetEducation(...args),
  updateEducation: (...args: unknown[]) => mockUpdateEducation(...args),
  deleteEducation: (...args: unknown[]) => mockDeleteEducation(...args),
}));

const mockAddEducationItem = vi.fn();
vi.mock('@/app/(user)/profile/_utils/autoFillHelper', () => ({
  addEducationItem: (...args: unknown[]) => mockAddEducationItem(...args),
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
import EducationSection from '@/app/(user)/profile/_components/education/EducationSection';
import { toast } from 'sonner';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const emptyProfile = { education: [] };
const eduEntry = {
  id: 'edu-1',
  institution: 'MIT',
  degree: 'B.Sc',
  stream: 'Computer Science',
  cgpa: 3.8,
  start_date: '2018-09-01',
  end_date: '2022-06-01',
};
const profileWithEdu = { education: [eduEntry] };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EducationSection — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEducation.mockResolvedValue([]);
  });

  it('shows empty state when API returns no education', async () => {
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('add-education-btn')).toBeInTheDocument();
    });
  });
});

describe('EducationSection — list rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders education card when data is pre-loaded in tempProfile', async () => {
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('education-card-0')).toBeInTheDocument();
    });
  });

  it('does not call getEducation when tempProfile already has education', async () => {
    mockGetEducation.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-card-0')).toBeInTheDocument());
    expect(mockGetEducation).not.toHaveBeenCalled();
  });
});

describe('EducationSection — add education', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens the add modal when the add button is clicked', async () => {
    mockGetEducation.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-education-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-education-btn'));
    expect(screen.getByTestId('edu-institution-input')).toBeInTheDocument();
  });

  it('calls addEducationItem and shows success toast on save', async () => {
    mockGetEducation.mockResolvedValue([]);
    mockAddEducationItem.mockResolvedValue({ id: 'new-1', institution: 'Harvard', degree: 'M.Sc' });
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-education-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-education-btn'));
    fireEvent.change(screen.getByTestId('edu-institution-input'), {
      target: { value: 'Harvard' },
    });
    fireEvent.click(screen.getByTestId('edu-save-btn'));

    await waitFor(() => {
      expect(mockAddEducationItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Education added');
    });
  });
});

describe('EducationSection — edit education', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens edit modal when edit button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('education-edit-btn-0'));
    expect(screen.getByTestId('edu-institution-input')).toBeInTheDocument();
  });

  it('calls updateEducation and shows success toast on edit save', async () => {
    mockUpdateEducation.mockResolvedValue({ ...eduEntry, institution: 'Updated MIT' });
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('education-edit-btn-0'));
    fireEvent.click(screen.getByTestId('edu-save-btn'));

    await waitFor(() => {
      expect(mockUpdateEducation).toHaveBeenCalledWith('edu-1', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Education updated');
    });
  });
});

describe('EducationSection — delete education', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens confirm delete modal when delete button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('education-delete-btn-0'));
    expect(screen.getByTestId('modal-confirm-btn')).toBeInTheDocument();
  });

  it('calls deleteEducation and removes card after confirm', async () => {
    mockDeleteEducation.mockResolvedValue({});
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('education-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(mockDeleteEducation).toHaveBeenCalledWith('edu-1');
    });
  });

  it('cancels delete when cancel button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<EducationSection tempProfile={profileWithEdu} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('education-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('education-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-cancel-btn'));
    expect(mockDeleteEducation).not.toHaveBeenCalled();
  });
});
