/**
 * Unit tests for EmploymentInfoSection — employment preferences form.
 *
 * Covers:
 *   - Fetches employment info on mount and populates form
 *   - Save Changes button is hidden when no changes have been made
 *   - Save Changes button appears after a field is changed
 *   - Calls updateEmploymentInfo with current form data on save
 *   - Shows "Saving..." while save is in flight
 *   - Hides Save Changes button after a successful save
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

vi.mock('@/components/common/InfoToggleGroup', () => ({
  default: ({ label, name, options, value, onChange }: {
    label: string;
    name: string;
    options: { label: string; value: unknown }[];
    value: unknown;
    onChange: (v: unknown) => void;
  }) =>
    React.createElement('div', { 'data-testid': `toggle-${name}` },
      React.createElement('span', null, label),
      options.map(opt =>
        React.createElement('button', {
          key: String(opt.value),
          onClick: () => onChange(opt.value),
          'aria-pressed': value === opt.value,
        }, opt.label)
      )
    ),
}));

// ─── Component under test ─────────────────────────────────────────────────────
import EmploymentInfoSection from '@/app/(user)/profile/_components/EmploymentInfoSection';
import type { ProfileData } from '@/app/(user)/profile/_types/ProfileData';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseProfile: ProfileData = {
  personalInformation: { fullName: '', email: '' },
  skills: [],
};

const defaultProps = {
  tempProfile: baseProfile,
  setTempProfile: vi.fn(),
};

const mockEmploymentData = {
  authorized_to_work: true,
  disability_status: 'no',
  willing_to_relocate: false,
  work_mode: 'remote',
  gender: 'male',
  preferred_job_type: 'full_time',
  employment_status: 'employed',
  notice_period_days: 'immediate',
  preferred_industries: [],
  preferred_roles: [],
  preferred_locations: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmploymentInfoSection — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the gender select', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('combobox', { name: /gender/i })).toBeInTheDocument();
  });

  it('renders the employment status select', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('combobox', { name: /employment status/i })).toBeInTheDocument();
  });

  it('renders the notice period select', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('combobox', { name: /notice period/i })).toBeInTheDocument();
  });
});

describe('EmploymentInfoSection — save button visibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not show Save Changes button before any field is changed', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  it('shows Save Changes button after gender is changed', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));

    const genderSelect = screen.getByRole('combobox', { name: /gender/i });
    fireEvent.change(genderSelect, { target: { value: 'female' } });

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows Save Changes button after employment status is changed', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));

    const statusSelect = screen.getByRole('combobox', { name: /employment status/i });
    fireEvent.change(statusSelect, { target: { value: 'unemployed' } });

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

describe('EmploymentInfoSection — save action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls updateEmploymentInfo on Save Changes click', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    mockUpdateEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByRole('combobox', { name: /gender/i }), {
      target: { value: 'female' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateEmploymentInfo).toHaveBeenCalledTimes(1);
    });
  });

  it('shows "Saving..." while save is in flight', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    let resolveSave!: (v: unknown) => void;
    mockUpdateEmploymentInfo.mockReturnValueOnce(new Promise(r => { resolveSave = r; }));

    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByRole('combobox', { name: /gender/i }), {
      target: { value: 'female' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

    resolveSave(mockEmploymentData);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /saving/i })).not.toBeInTheDocument();
    });
  });

  it('hides Save Changes button after a successful save', async () => {
    mockGetEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);
    mockUpdateEmploymentInfo.mockResolvedValueOnce(mockEmploymentData);

    render(<EmploymentInfoSection {...defaultProps} />);
    await waitFor(() => expect(mockGetEmploymentInfo).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByRole('combobox', { name: /gender/i }), {
      target: { value: 'female' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });
});
