/**
 * Unit tests for EmploymentInfoSection (employmentInfo/EmploymentInfoSection.tsx)
 *
 * Covers:
 *   - Shows empty state when no employment info exists in tempProfile
 *   - Shows employment card when tempProfile.employmentInfo is populated
 *   - Fetches employment info from API on mount
 *   - Opens modal when "Add Employment Info" is clicked
 *   - Opens modal when "Edit" is clicked on the card
 *   - Closes modal on Cancel
 *   - Calls updateEmploymentInfo when Save is clicked in the modal
 *   - Shows "Saving..." while save is in flight
 *   - Closes modal after a successful save
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetEmploymentInfo = vi.fn();
const mockUpdateEmploymentInfo = vi.fn();
vi.mock('@/api/userApi', () => ({
  getEmploymentInfo: (...args: unknown[]) => mockGetEmploymentInfo(...args),
  updateEmploymentInfo: (...args: unknown[]) => mockUpdateEmploymentInfo(...args),
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

vi.mock('@/app/(user)/profile/_utils/employmentData', () => ({
  industries: [{ value: 'tech', label: 'Technology' }],
  roles: [{ value: 'engineer', label: 'Engineer' }],
  locations: [{ value: 'remote', label: 'Remote' }],
  jobTypes: [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
  ],
  noticePeriod: [
    { value: 'immediate', label: 'Immediate' },
    { value: '30_days', label: '30 Days' },
  ],
}));

vi.mock('@/components/common/MultiSelectAutocomplete', () => ({
  default: ({ label }: { label: string }) =>
    React.createElement('div', { 'data-testid': `multiselect-${label.toLowerCase().replace(/\s+/g, '-')}` }, label),
}));

// Render children inline when open so modal content is accessible in tests
vi.mock('@/components/common/Modal', () => ({
  default: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open
      ? React.createElement('div', { role: 'dialog', 'aria-label': title }, children)
      : null,
}));

// ─── Component under test ─────────────────────────────────────────────────────
import EmploymentInfoSection from '@/app/(user)/profile/_components/employmentInfo/EmploymentInfoSection';
import type { ProfileData } from '@/app/(user)/profile/_types/ProfileData';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseProfile: ProfileData = {
  personalInformation: { fullName: '', email: '' },
  skills: [],
};

const mockEmploymentData = {
  authorized_to_work: true,
  disability_status: 'no',
  willing_to_relocate: false,
  work_mode: 'remote' as const,
  gender: 'male' as const,
  preferred_job_type: 'full_time' as const,
  employment_status: 'employed' as const,
  notice_period_days: '30',
  preferred_industries: [],
  preferred_roles: [],
  preferred_locations: [],
};

const filledProfile: ProfileData = {
  ...baseProfile,
  employmentInfo: mockEmploymentData,
};

const defaultProps = {
  tempProfile: baseProfile,
  setTempProfile: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmploymentInfoSection — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmploymentInfo.mockResolvedValue(null);
  });

  it('shows empty state message when no employment info exists', () => {
    render(<EmploymentInfoSection {...defaultProps} />);
    expect(screen.getByText(/no employment info added yet/i)).toBeInTheDocument();
  });

  it('renders the Add Employment Info button', () => {
    render(<EmploymentInfoSection {...defaultProps} />);
    expect(screen.getByTestId('add-employment-info-btn')).toBeInTheDocument();
  });

  it('calls getEmploymentInfo on mount', async () => {
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));
  });
});

describe('EmploymentInfoSection — filled state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmploymentInfo.mockResolvedValue(mockEmploymentData);
  });

  it('shows the employment card when tempProfile has employment info', () => {
    render(<EmploymentInfoSection tempProfile={filledProfile} setTempProfile={vi.fn()} />);
    expect(screen.getByText(/employment preferences/i)).toBeInTheDocument();
  });

  it('renders the Edit button on the card', () => {
    render(<EmploymentInfoSection tempProfile={filledProfile} setTempProfile={vi.fn()} />);
    expect(screen.getByTestId('employment-info-edit-btn')).toBeInTheDocument();
  });

  it('does not show the empty state when data exists', () => {
    render(<EmploymentInfoSection tempProfile={filledProfile} setTempProfile={vi.fn()} />);
    expect(screen.queryByText(/no employment info added yet/i)).not.toBeInTheDocument();
  });
});

describe('EmploymentInfoSection — modal interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmploymentInfo.mockResolvedValue(null);
  });

  it('opens modal when "Add Employment Info" is clicked', () => {
    render(<EmploymentInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-employment-info-btn'));
    expect(screen.getByRole('dialog', { name: /employment information/i })).toBeInTheDocument();
  });

  it('opens modal when "Edit" is clicked on the card', () => {
    render(<EmploymentInfoSection tempProfile={filledProfile} setTempProfile={vi.fn()} />);
    fireEvent.click(screen.getByTestId('employment-info-edit-btn'));
    expect(screen.getByRole('dialog', { name: /employment information/i })).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', () => {
    render(<EmploymentInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-employment-info-btn'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('EmploymentInfoSection — save action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmploymentInfo.mockResolvedValue(null);
  });

  it('calls updateEmploymentInfo when Save is clicked', async () => {
    mockUpdateEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-employment-info-btn'));
    fireEvent.click(screen.getByTestId('employment-info-save-btn'));

    await waitFor(() => expect(mockUpdateEmploymentInfo).toHaveBeenCalledTimes(1));
  });

  it('shows "Saving..." on the save button while the request is in flight', async () => {
    let resolveSave!: (v: unknown) => void;
    mockUpdateEmploymentInfo.mockReturnValueOnce(new Promise(r => { resolveSave = r; }));

    render(<EmploymentInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-employment-info-btn'));
    fireEvent.click(screen.getByTestId('employment-info-save-btn'));

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

    resolveSave(mockEmploymentData);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /saving/i })).not.toBeInTheDocument();
    });
  });

  it('closes the modal after a successful save', async () => {
    mockUpdateEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);

    render(<EmploymentInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-employment-info-btn'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('employment-info-save-btn'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
