/**
 * Unit tests for MainSection — profile page header with picture, identity info, and social links.
 *
 * Covers:
 *   - Shows loading spinner while profile data is being fetched
 *   - Shows welcome screen when profile has no name (new user)
 *   - Displays user's full name after data loads
 *   - Displays headline, location, email, and phone when present
 *   - Shows LinkedIn link when linkedin URL exists in profileData
 *   - Shows "Add LinkedIn" button when no linkedin URL
 *   - Shows GitHub link when github URL exists in profileData
 *   - Shows "Add GitHub" button when no github URL
 *   - Renders upload profile picture button
 *   - Calls uploadProfilePicture when a file is selected
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetProfile = vi.fn();
const mockGetProfilePicture = vi.fn();
const mockUploadProfilePicture = vi.fn();
const mockDeleteProfilePicture = vi.fn();
const mockGetEducation = vi.fn();
const mockGetExperience = vi.fn();
const mockGetSkills = vi.fn();
const mockGetEmploymentInfo = vi.fn();

vi.mock('@/api/userApi', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  getProfilePicture: (...args: unknown[]) => mockGetProfilePicture(...args),
  uploadProfilePicture: (...args: unknown[]) => mockUploadProfilePicture(...args),
  deleteProfilePicture: (...args: unknown[]) => mockDeleteProfilePicture(...args),
  getEducation: (...args: unknown[]) => mockGetEducation(...args),
  getExperience: (...args: unknown[]) => mockGetExperience(...args),
  getSkills: (...args: unknown[]) => mockGetSkills(...args),
  getEmploymentInfo: (...args: unknown[]) => mockGetEmploymentInfo(...args),
}));

// Profile context — data is set per test via profileDataOverride
let profileDataOverride: Record<string, unknown> = {};
const mockSetProfileData = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetProfilePicUrl = vi.fn();

vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({
    profileData: profileDataOverride,
    setProfileData: mockSetProfileData,
    setActiveTab: mockSetActiveTab,
    setProfilePicUrl: mockSetProfilePicUrl,
  }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [k: string]: unknown }) =>
    React.createElement('img', { src, alt, ...rest }),
}));

vi.mock('@/components/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => null,
}));

// ProfileTabs renders all profile sections — mock to avoid deep render tree
vi.mock('@/app/(user)/profile/_components/ProfileTabs', () => ({
  default: () => React.createElement('div', { 'data-testid': 'profile-tabs-mock' }),
}));

// ─── Component under test ─────────────────────────────────────────────────────
import MainSection from '@/app/(user)/profile/_components/MainSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseBackendProfile = {
  id: 'u1',
  email: 'jane@example.com',
  full_name: 'Jane Doe',
  username: 'janedoe',
  headline: 'Software Engineer',
  location: 'San Francisco, CA',
  phone_number: '+1 555-0100',
  linkedin_url: 'https://linkedin.com/in/janedoe',
  github_url: 'https://github.com/janedoe',
  summary: '',
  is_verified: true,
};

const setupDefaultMocks = () => {
  mockGetProfile.mockResolvedValue(baseBackendProfile);
  mockGetProfilePicture.mockRejectedValue({ response: { status: 404 } });
  mockGetEducation.mockResolvedValue([]);
  mockGetExperience.mockResolvedValue([]);
  mockGetSkills.mockResolvedValue([]);
  mockGetEmploymentInfo.mockResolvedValue({});
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MainSection — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileDataOverride = {};
  });

  it('shows loading spinner before profile resolves', () => {
    mockGetProfile.mockReturnValue(new Promise(() => {})); // never resolves
    mockGetProfilePicture.mockReturnValue(new Promise(() => {}));
    mockGetEducation.mockReturnValue(new Promise(() => {}));
    mockGetExperience.mockReturnValue(new Promise(() => {}));
    mockGetSkills.mockReturnValue(new Promise(() => {}));
    mockGetEmploymentInfo.mockReturnValue(new Promise(() => {}));

    render(<MainSection />);
    expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
  });
});

describe('MainSection — welcome screen (new user)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileDataOverride = {};
    setupDefaultMocks();
  });

  it('shows welcome message when profile has no fullName', async () => {
    // profileDataOverride stays empty → hasProfileData is false
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome to CareerBot/i)).toBeInTheDocument();
    });
  });

  it('renders the upload profile picture button in welcome view', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-profile-pic-btn')).toBeInTheDocument();
    });
  });
});

describe('MainSection — profile info display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: {
        fullName: 'Jane Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
        email: 'jane@example.com',
        phone: '+1 555-0100',
        linkedin: 'https://linkedin.com/in/janedoe',
        github: 'https://github.com/janedoe',
      },
    };
  });

  it('displays the user full name', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('displays headline', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('displays location', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });
  });

  it('displays email', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('renders upload profile picture button', async () => {
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-profile-pic-btn')).toBeInTheDocument();
    });
  });
});

describe('MainSection — social links', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows LinkedIn link when linkedin URL exists', async () => {
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: {
        fullName: 'Jane Doe',
        linkedin: 'https://linkedin.com/in/janedoe',
        github: '',
      },
    };
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('linkedin-link')).toBeInTheDocument();
    });
  });

  it('shows "Add LinkedIn" button when no linkedin URL', async () => {
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: {
        fullName: 'Jane Doe',
        linkedin: '',
        github: '',
      },
    };
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('add-linkedin-btn')).toBeInTheDocument();
    });
  });

  it('shows GitHub link when github URL exists', async () => {
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: {
        fullName: 'Jane Doe',
        linkedin: '',
        github: 'https://github.com/janedoe',
      },
    };
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('github-link')).toBeInTheDocument();
    });
  });

  it('shows "Add GitHub" button when no github URL', async () => {
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: {
        fullName: 'Jane Doe',
        linkedin: '',
        github: '',
      },
    };
    render(<MainSection />);
    await waitFor(() => {
      expect(screen.getByTestId('add-github-btn')).toBeInTheDocument();
    });
  });
});

describe('MainSection — profile picture actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    profileDataOverride = {
      personalInformation: { fullName: 'Jane Doe' },
    };
  });

  it('calls uploadProfilePicture when a file is selected', async () => {
    mockUploadProfilePicture.mockResolvedValue({ picture_url: 'https://cdn.example.com/pic.jpg' });
    render(<MainSection />);
    await waitFor(() => expect(screen.getByTestId('profile-pic-input')).toBeInTheDocument());

    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    const input = screen.getByTestId('profile-pic-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockUploadProfilePicture).toHaveBeenCalledWith(file);
    });
  });
});
