import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/app/(resume)/ats/_components/landing/HeroSection', () => ({
  default: ({ onScanClick }: { onScanClick: () => void }) => (
    <div data-testid="hero-section">
      <h1>ATS Resume Scanner</h1>
      <button data-testid="hero-scan-cta" onClick={onScanClick}>Scan My Resume</button>
    </div>
  ),
}));

vi.mock('@/app/(resume)/ats/_components/landing/FeaturesSection', () => ({
  default: () => <div data-testid="features-section">Features</div>,
}));

vi.mock('@/app/(resume)/ats/_components/landing/ATSScannerChecks', () => ({
  default: () => <div data-testid="ats-scanner-checks">Scanner Checks</div>,
}));

vi.mock('@/app/(resume)/ats/_components/landing/BeforeAfterSection', () => ({
  default: ({ onScanClick }: { onScanClick: () => void }) => (
    <div data-testid="before-after-section">
      <button data-testid="before-after-scan-cta" onClick={onScanClick}>Get Your Score</button>
    </div>
  ),
}));

vi.mock('@/app/(resume)/ats/_components/landing/TestimonialsSection', () => ({
  default: () => <div data-testid="testimonials-section">Testimonials</div>,
}));

vi.mock('@/app/(resume)/ats/_components/landing/CTABand', () => ({
  default: ({ onScanClick }: { onScanClick: () => void }) => (
    <div data-testid="cta-band">
      <button data-testid="cta-band-scan" onClick={onScanClick}>Start for Free</button>
    </div>
  ),
}));

vi.mock('@/app/(resume)/ats/_components/landing/FAQPage', () => ({
  default: () => <div data-testid="faq-section">FAQ</div>,
}));

vi.mock('@/app/(resume)/ats/_components/landing/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('@/app/(resume)/ats/_components/upload/ResumeUploadModal', () => ({
  default: ({ isOpen, onClose, children }: any) =>
    isOpen ? (
      <div data-testid="upload-modal">
        <button data-testid="modal-close-button" onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

vi.mock('@/app/(resume)/ats/_components/upload/ResumeUpload', () => ({
  default: () => <div data-testid="resume-upload">Upload Form</div>,
}));

// ─── Lazy imports after mocks are hoisted ─────────────────────────────────────

import HeroSection from '@/app/(resume)/ats/_components/landing/HeroSection';
import FeaturesSection from '@/app/(resume)/ats/_components/landing/FeaturesSection';
import ATSScannerChecks from '@/app/(resume)/ats/_components/landing/ATSScannerChecks';
import BeforeAfterSection from '@/app/(resume)/ats/_components/landing/BeforeAfterSection';
import TestimonialsSection from '@/app/(resume)/ats/_components/landing/TestimonialsSection';
import CTABand from '@/app/(resume)/ats/_components/landing/CTABand';
import FAQPage from '@/app/(resume)/ats/_components/landing/FAQPage';
import Footer from '@/app/(resume)/ats/_components/landing/Footer';
import ResumeUploadModal from '@/app/(resume)/ats/_components/upload/ResumeUploadModal';
import ResumeUpload from '@/app/(resume)/ats/_components/upload/ResumeUpload';

// ─── Component under test ─────────────────────────────────────────────────────

function HomePageWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTop] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <HeroSection onScanClick={openModal} />
      <FeaturesSection />
      <ATSScannerChecks />
      <BeforeAfterSection onScanClick={openModal} />
      <TestimonialsSection />
      <CTABand onScanClick={openModal} />
      <FAQPage />
      <Footer />
      <ResumeUploadModal isOpen={isModalOpen} onClose={closeModal}>
        <ResumeUpload />
      </ResumeUploadModal>
      {showTop && (
        <button data-testid="scroll-to-top-button" aria-label="Scroll to top">
          TOP
        </button>
      )}
    </>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ATS HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main landing sections', () => {
    render(<HomePageWrapper />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('ats-scanner-checks')).toBeInTheDocument();
    expect(screen.getByTestId('before-after-section')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-band')).toBeInTheDocument();
    expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders the ATS Scanner heading in the hero section', () => {
    render(<HomePageWrapper />);
    expect(screen.getByText('ATS Resume Scanner')).toBeInTheDocument();
  });

  it('does not show upload modal on initial render', () => {
    render(<HomePageWrapper />);
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  it('opens upload modal when hero CTA is clicked', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('hero-scan-cta'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });
  });

  it('renders ResumeUpload inside the modal when it opens', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('hero-scan-cta'));
    await waitFor(() => {
      expect(screen.getByTestId('resume-upload')).toBeInTheDocument();
    });
  });

  it('closes upload modal when close button is clicked', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('hero-scan-cta'));
    await waitFor(() => expect(screen.getByTestId('upload-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('modal-close-button'));
    await waitFor(() => {
      expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
    });
  });

  it('opens upload modal when before-after section CTA is clicked', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('before-after-scan-cta'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });
  });

  it('opens upload modal when CTA band button is clicked', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('cta-band-scan'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });
  });

  it('can re-open upload modal after it was closed', async () => {
    render(<HomePageWrapper />);
    fireEvent.click(screen.getByTestId('hero-scan-cta'));
    await waitFor(() => expect(screen.getByTestId('upload-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('modal-close-button'));
    await waitFor(() => expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument());
    fireEvent.click(screen.getByTestId('hero-scan-cta'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });
  });

  it('does not show scroll-to-top button on initial render', () => {
    render(<HomePageWrapper />);
    expect(screen.queryByTestId('scroll-to-top-button')).not.toBeInTheDocument();
  });
});

// ─── resumeatsapi unit tests ──────────────────────────────────────────────────

const mockProcessResumeComplete = vi.fn();

vi.mock('@/api/resumeatsapi', () => ({
  processResumeComplete: (...args: any[]) => mockProcessResumeComplete(...args),
}));

describe('resumeatsapi — processResumeComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns success: true with resume_id and finalWeightedScore on success', async () => {
    mockProcessResumeComplete.mockResolvedValue({
      success: true,
      resume_id: 'r-xyz',
      finalWeightedScore: 78,
      ats_score: {},
      parsed_data: {},
    });
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = await mockProcessResumeComplete(file);
    expect(result.success).toBe(true);
    expect(result.resume_id).toBe('r-xyz');
    expect(result.finalWeightedScore).toBe(78);
  });

  it('returns success: false with normalized credit error message', async () => {
    mockProcessResumeComplete.mockResolvedValue({
      success: false,
      error: "You don't have enough credits to analyze this resume. Please upgrade your plan or purchase credits.",
    });
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = await mockProcessResumeComplete(file);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/credits/i);
  });

  it('returns success: false on enhance failure', async () => {
    mockProcessResumeComplete.mockResolvedValue({
      success: false,
      error: 'Unable to enhance resume',
    });
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = await mockProcessResumeComplete(file);
    expect(result.success).toBe(false);
  });

  it('returns cached result on cache hit', async () => {
    const cachedPayload = { resume_id: 'cached-id', finalWeightedScore: 90, ats_score: {}, parsed_data: {} };
    mockProcessResumeComplete.mockResolvedValue({ success: true, ...cachedPayload });
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = await mockProcessResumeComplete(file);
    expect(result.success).toBe(true);
    expect(result.resume_id).toBe('cached-id');
    expect(result.finalWeightedScore).toBe(90);
  });
});
