/**
 * Unit tests for CertificationsSection — CRUD UI for certification entries.
 *
 * Covers:
 *   - Renders empty state when no certifications and API returns []
 *   - Renders certification cards when tempProfile has data
 *   - Does not call getCertification when data already in tempProfile
 *   - Opens add modal when "Add Certification" button is clicked
 *   - Calls addCertificationItem and shows success toast on add save
 *   - Opens edit modal when edit button is clicked
 *   - Calls updateCertification and shows success toast on edit save
 *   - Opens confirm delete modal when delete button is clicked
 *   - Calls deleteCertification on confirm
 *   - Cancels delete when cancel is clicked
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetCertification = vi.fn();
const mockUpdateCertification = vi.fn();
const mockDeleteCertification = vi.fn();

vi.mock('@/api/userApi', () => ({
  getCertification: (...args: unknown[]) => mockGetCertification(...args),
  updateCertification: (...args: unknown[]) => mockUpdateCertification(...args),
  deleteCertification: (...args: unknown[]) => mockDeleteCertification(...args),
}));

const mockAddCertificationItem = vi.fn();
vi.mock('@/app/(user)/profile/_utils/autoFillHelper', () => ({
  addCertificationItem: (...args: unknown[]) => mockAddCertificationItem(...args),
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
import CertificationsSection from '@/app/(user)/profile/_components/certifications/CertificationsSection';
import { toast } from 'sonner';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const emptyProfile = { certifications: [] };
const certEntry = {
  id: 'cert-1',
  certification_name: 'AWS Certified Developer',
  issuer: 'Amazon',
  start_date: '2022-01-01',
  end_date: '2025-01-01',
};
const profileWithCert = { certifications: [certEntry] };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CertificationsSection — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCertification.mockResolvedValue([]);
  });

  it('shows empty state when API returns no certifications', async () => {
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('add-certification-btn')).toBeInTheDocument();
    });
  });
});

describe('CertificationsSection — list rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders certification card when data is pre-loaded', async () => {
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('certification-card-0')).toBeInTheDocument();
    });
  });

  it('does not call getCertification when tempProfile already has certifications', async () => {
    mockGetCertification.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('certification-card-0')).toBeInTheDocument());
    expect(mockGetCertification).not.toHaveBeenCalled();
  });
});

describe('CertificationsSection — add certification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens add modal when "Add Certification" button is clicked', async () => {
    mockGetCertification.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-certification-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-certification-btn'));
    expect(screen.getByTestId('cert-name-input')).toBeInTheDocument();
  });

  it('calls addCertificationItem and shows success toast on save', async () => {
    mockGetCertification.mockResolvedValue([]);
    mockAddCertificationItem.mockResolvedValue({
      id: 'new-1',
      certification_name: 'GCP Associate',
      issuer: 'Google',
    });
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-certification-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-certification-btn'));
    fireEvent.change(screen.getByTestId('cert-name-input'), {
      target: { value: 'GCP Associate' },
    });
    fireEvent.click(screen.getByTestId('cert-save-btn'));

    await waitFor(() => {
      expect(mockAddCertificationItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Certification added');
    });
  });
});

describe('CertificationsSection — edit certification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens edit modal when edit button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('certification-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('certification-edit-btn-0'));
    expect(screen.getByTestId('cert-name-input')).toBeInTheDocument();
  });

  it('calls updateCertification and shows success toast on edit save', async () => {
    mockUpdateCertification.mockResolvedValue({
      ...certEntry,
      certification_name: 'AWS Solutions Architect',
    });
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('certification-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('certification-edit-btn-0'));
    fireEvent.click(screen.getByTestId('cert-save-btn'));

    await waitFor(() => {
      expect(mockUpdateCertification).toHaveBeenCalledWith('cert-1', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Certification updated');
    });
  });
});

describe('CertificationsSection — delete certification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens confirm delete modal when delete button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() =>
      expect(screen.getByTestId('certification-delete-btn-0')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('certification-delete-btn-0'));
    expect(screen.getByTestId('modal-confirm-btn')).toBeInTheDocument();
  });

  it('calls deleteCertification on confirm', async () => {
    mockDeleteCertification.mockResolvedValue({});
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() =>
      expect(screen.getByTestId('certification-delete-btn-0')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('certification-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(mockDeleteCertification).toHaveBeenCalledWith('cert-1');
    });
  });

  it('does not call deleteCertification when cancel is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<CertificationsSection tempProfile={profileWithCert} setTempProfile={setTempProfile} />);
    await waitFor(() =>
      expect(screen.getByTestId('certification-delete-btn-0')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('certification-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-cancel-btn'));
    expect(mockDeleteCertification).not.toHaveBeenCalled();
  });
});
