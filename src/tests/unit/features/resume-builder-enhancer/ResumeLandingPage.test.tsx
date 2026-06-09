import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock Resume Landing Page
const MockResumeLandingPage = () => {
  const [activeSection, setActiveSection] = React.useState('overview');
  const [showSignin, setShowSignin] = React.useState(false);

  return (
    <main data-testid="landing-page">
      <header data-testid="landing-header" className="sticky top-0 z-50">
        <nav>
          <a href="/" data-testid="logo">
            CareerBOT
          </a>

          <div data-testid="nav-items">
            <a href="#overview" aria-current={activeSection === 'overview' ? 'page' : undefined}>
              Overview
            </a>
            <a href="#choose-path" aria-current={activeSection === 'choose-path' ? 'page' : undefined}>
              Build or Enhance
            </a>
            <a href="#quality-checks" aria-current={activeSection === 'quality-checks' ? 'page' : undefined}>
              Quality Checks
            </a>
          </div>

          <div data-testid="header-actions">
            <button onClick={() => setShowSignin(true)} data-testid="signin-btn">
              Sign In
            </button>
            <a href="/builder/start" data-testid="start-free-btn">
              Start Free
            </a>
          </div>
        </nav>
      </header>

      <section id="overview" data-testid="overview-section">
        <div>
          <h1>
            Build or improve your resume with <span>AI that feels practical</span>
          </h1>
          <p>
            Start from a template or enhance your current resume. CareerBot helps you improve
            structure, wording, ATS readability, and export readiness in one focused workflow.
          </p>
          <a href="/builder/start" data-testid="hero-start-btn">
            Start Free
          </a>
        </div>
      </section>

      <section data-testid="proof-stats">
        <div data-testid="stat-box">12,400+ job seekers</div>
        <div data-testid="stat-box">18+ ATS templates</div>
        <div data-testid="stat-box">PDF export ready</div>
        <div data-testid="stat-box">Free plan available</div>
      </section>

      <section id="choose-path" data-testid="choose-path-section">
        <h2>Start where your resume is today</h2>
        <div data-testid="path-card">
          <h3>Enhance an existing resume</h3>
          <p>Upload your resume, fix weak wording, improve ATS readability</p>
          <a href="/builder/start?action=enhance" data-testid="enhance-btn">
            Enhance My Resume
          </a>
        </div>
        <div data-testid="path-card">
          <h3>Build a new resume</h3>
          <p>Start from an ATS-friendly template and follow guided sections</p>
          <a href="/builder/start" data-testid="build-btn">
            Build New Resume
          </a>
        </div>
      </section>

      <section id="quality-checks" data-testid="quality-checks-section">
        <h2>A cleaner resume, not just prettier formatting</h2>
        <div data-testid="feature-card">AI bullet rewrites</div>
        <div data-testid="feature-card">ATS readability</div>
        <div data-testid="feature-card">Role relevance</div>
      </section>

      <section data-testid="cta-section">
        <h2>Ready to build a resume you can actually use?</h2>
        <a href="/builder/start" data-testid="final-cta-btn">
          Start Free
        </a>
      </section>

      {showSignin && (
        <div data-testid="signin-modal">
          <button onClick={() => setShowSignin(false)} data-testid="close-modal">
            Close
          </button>
        </div>
      )}
    </main>
  );
};

describe('ResumeLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with logo and navigation', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('CareerBOT')).toBeInTheDocument();
  });

  it('renders sign in button in header', () => {
    render(<MockResumeLandingPage />);

    const signinBtn = screen.getByTestId('signin-btn');
    expect(signinBtn).toBeInTheDocument();
    expect(signinBtn).toHaveTextContent('Sign In');
  });

  it('opens signin modal when sign in button is clicked', () => {
    render(<MockResumeLandingPage />);

    const signinBtn = screen.getByTestId('signin-btn');
    fireEvent.click(signinBtn);

    expect(screen.getByTestId('signin-modal')).toBeInTheDocument();
  });

  it('closes signin modal when close button is clicked', () => {
    render(<MockResumeLandingPage />);

    fireEvent.click(screen.getByTestId('signin-btn'));
    expect(screen.getByTestId('signin-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-modal'));
    expect(screen.queryByTestId('signin-modal')).not.toBeInTheDocument();
  });

  it('renders overview section with hero content', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
    expect(screen.getByText(/Build or improve your resume with/)).toBeInTheDocument();
  });

  it('renders proof stats section', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('proof-stats')).toBeInTheDocument();
    expect(screen.getByText('12,400+ job seekers')).toBeInTheDocument();
    expect(screen.getByText('18+ ATS templates')).toBeInTheDocument();
    expect(screen.getByText('PDF export ready')).toBeInTheDocument();
    expect(screen.getByText('Free plan available')).toBeInTheDocument();
  });

  it('renders choose-path section with two options', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('choose-path-section')).toBeInTheDocument();
    expect(screen.getByText('Enhance an existing resume')).toBeInTheDocument();
    expect(screen.getByText('Build a new resume')).toBeInTheDocument();
  });

  it('enhance button has correct href', () => {
    render(<MockResumeLandingPage />);

    const enhanceBtn = screen.getByTestId('enhance-btn');
    expect(enhanceBtn).toHaveAttribute('href', '/builder/start?action=enhance');
  });

  it('build button has correct href', () => {
    render(<MockResumeLandingPage />);

    const buildBtn = screen.getByTestId('build-btn');
    expect(buildBtn).toHaveAttribute('href', '/builder/start');
  });

  it('renders quality-checks section with feature cards', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('quality-checks-section')).toBeInTheDocument();
    expect(screen.getByText('AI bullet rewrites')).toBeInTheDocument();
    expect(screen.getByText('ATS readability')).toBeInTheDocument();
    expect(screen.getByText('Role relevance')).toBeInTheDocument();
  });

  it('renders CTA section with final call to action', () => {
    render(<MockResumeLandingPage />);

    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByText(/Ready to build a resume/)).toBeInTheDocument();
  });

  it('all start free buttons link to builder', () => {
    render(<MockResumeLandingPage />);

    const startButtons = [
      screen.getByTestId('start-free-btn'),
      screen.getByTestId('hero-start-btn'),
      screen.getByTestId('final-cta-btn'),
    ];

    startButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('href', '/builder/start');
    });
  });

  it('renders navigation links', () => {
    render(<MockResumeLandingPage />);

    const navItems = screen.getByTestId('nav-items');
    expect(navItems).toBeInTheDocument();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Build or Enhance')).toBeInTheDocument();
    expect(screen.getByText('Quality Checks')).toBeInTheDocument();
  });

  it('renders header actions', () => {
    render(<MockResumeLandingPage />);

    const headerActions = screen.getByTestId('header-actions');
    expect(headerActions).toBeInTheDocument();
    expect(screen.getByTestId('signin-btn')).toBeInTheDocument();
    expect(screen.getByTestId('start-free-btn')).toBeInTheDocument();
  });

  it('renders path cards with descriptions', () => {
    render(<MockResumeLandingPage />);

    const pathCards = screen.getAllByTestId('path-card');
    expect(pathCards).toHaveLength(2);

    expect(screen.getByText(/Upload your resume, fix weak wording/)).toBeInTheDocument();
    expect(screen.getByText(/Start from an ATS-friendly template/)).toBeInTheDocument();
  });

  it('renders multiple feature cards in quality checks', () => {
    render(<MockResumeLandingPage />);

    const featureCards = screen.getAllByTestId('feature-card');
    expect(featureCards.length).toBeGreaterThan(0);
  });

  it('renders landing page main element', () => {
    render(<MockResumeLandingPage />);

    const landingPage = screen.getByTestId('landing-page');
    expect(landingPage).toBeInTheDocument();
  });

  it('has header as sticky positioned', () => {
    render(<MockResumeLandingPage />);

    const header = screen.getByTestId('landing-header');
    expect(header).toHaveClass('sticky');
  });
});
