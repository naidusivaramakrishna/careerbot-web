/**
 * Unit tests for PersonalInfoSection — the personal info form in the profile page.
 *
 * Covers:
 *   - Renders all input fields with their current values
 *   - Email field is disabled (read-only from auth provider)
 *   - Save Changes button is present
 *   - "Saving..." shown while PUT request is in flight
 *   - Calls updateProfile with backend-mapped field names on save
 *   - Backend validation errors mapped to the correct input fields
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdateProfile = vi.fn();
vi.mock('@/api/userApi', () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

const mockSetProfileData = vi.fn();
vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ setProfileData: mockSetProfileData }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

vi.mock('@/hooks/useAIDescriptionGenerator', () => ({
  useAIGeneration: () => ({ generateSummary: vi.fn().mockResolvedValue(''), isGenerating: false }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/app/(user)/profile/_utils/resumeMapper', () => ({
  formatPhoneNumber: (p: string) => p,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [k: string]: unknown }) =>
    React.createElement('img', { src, alt, ...rest }),
}));

// ─── Component under test ─────────────────────────────────────────────────────
import PersonalInfoSection from '@/app/(user)/profile/_components/PersonalInfoSection';
import type { ProfileData } from '@/app/(user)/profile/_types/ProfileData';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseProfile: ProfileData = {
  personalInformation: {
    fullName: 'John Doe',
    headline: 'Software Engineer',
    location: 'New York, USA',
    email: 'john@example.com',
    phone: '+1234567890',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    summary: 'A passionate developer.',
  },
  skills: [],
};

const defaultProps = {
  tempProfile: baseProfile,
  setTempProfile: vi.fn(),
  setProfile: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PersonalInfoSection — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the Full Name input with current value', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('renders the Headline input with current value', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
  });

  it('renders the Location input with current value', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByDisplayValue('New York, USA')).toBeInTheDocument();
  });

  it('renders the Email input and it is disabled', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    const emailInput = screen.getByDisplayValue('john@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('renders the Phone input with current value', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  it('renders the Professional Summary textarea with current value', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByDisplayValue('A passionate developer.')).toBeInTheDocument();
  });

  it('renders the Save Changes button', () => {
    render(<PersonalInfoSection {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

describe('PersonalInfoSection — save action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls updateProfile with backend-mapped field names on save', async () => {
    mockUpdateProfile.mockResolvedValueOnce({});

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe',
          headline: 'Software Engineer',
          location: 'New York, USA',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          github_url: 'https://github.com/johndoe',
        })
      );
    });
  });

  it('shows "Saving..." while the PUT request is in flight', async () => {
    let resolveUpdate!: (v: unknown) => void;
    mockUpdateProfile.mockReturnValueOnce(new Promise(r => { resolveUpdate = r; }));

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    resolveUpdate({});
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('updates the global profile context after a successful save', async () => {
    mockUpdateProfile.mockResolvedValueOnce({});

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockSetProfileData).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PersonalInfoSection — validation errors', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps phone_number backend error to the phone field', async () => {
    mockUpdateProfile.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          details: {
            validation_errors: [{ field: 'phone_number', message: 'Invalid phone number format' }],
          },
        },
      },
    });

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
    });
  });

  it('maps full_name backend error to the fullName field', async () => {
    mockUpdateProfile.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          details: {
            validation_errors: [{ field: 'full_name', message: 'Full name is required' }],
          },
        },
      },
    });

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('maps linkedin_url backend error to the linkedin field', async () => {
    mockUpdateProfile.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          details: {
            validation_errors: [{ field: 'linkedin_url', message: 'Invalid LinkedIn URL' }],
          },
        },
      },
    });

    render(<PersonalInfoSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid LinkedIn URL')).toBeInTheDocument();
    });
  });
});
