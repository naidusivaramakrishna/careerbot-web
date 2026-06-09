import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock ConsentModal component
const MockConsentModal = ({ onAccept, onDecline }: any) => (
  <div data-testid="consent-modal">
    <p>Do you consent to continue?</p>
    <button onClick={onAccept} data-testid="consent-accept">Accept</button>
    <button onClick={onDecline} data-testid="consent-decline">Decline</button>
  </div>
);

vi.mock('./_components/ConsentModal', () => ({
  default: MockConsentModal,
}));

// Mock context
vi.mock('./_context/MockInterviewContext', () => ({
  useMockInterview: () => ({
    activeSession: null,
    userProgress: { avg_score: 0, practice_rounds: 0 },
    stageState: { notes_generated: false, readiness_passed: false },
    consentGiven: false,
    setConsentGiven: vi.fn(),
    dismissActiveSession: vi.fn(),
  }),
}));

// Test component
const MockInterviewPage = () => {
  const {
    activeSession,
    userProgress,
    stageState,
    consentGiven,
    setConsentGiven,
  } = require('./_context/MockInterviewContext').useMockInterview();
  const router = require('next/navigation').useRouter();

  const [showConsent, setShowConsent] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const hasNotes = stageState.notes_generated;
  const isReady = stageState.readiness_passed;
  const avgScore = userProgress?.avg_score ?? 0;
  const practiceRoundsCompleted = userProgress?.practice_rounds ?? 0;

  const steps = [
    {
      id: 1,
      label: 'Your Interview Notes',
      sublabel: 'Generate personalised scripts from your resume',
      href: '/mock-interview/notes',
      badge: 'Stage 1',
      cta: 'Generate Notes',
      completedLabel: 'Notes Ready',
      time: '~15 min',
    },
    {
      id: 2,
      label: 'English Essentials',
      sublabel: '30 essential phrases, filler word replacements',
      href: '/mock-interview/english',
      badge: 'Stage 2',
      cta: 'Read Guide',
      completedLabel: 'Reviewed',
      time: '5–10 min',
    },
    {
      id: 3,
      label: 'Practice Your Answers',
      sublabel: 'Practice HR questions across 2 rounds',
      href: '/mock-interview/practice',
      badge: 'Stage 3–4',
      cta: 'Start Practice',
      completedLabel: 'Practice Done',
      time: '~30 min',
    },
    {
      id: 4,
      label: 'Live Mock Interview',
      sublabel: 'Full AI-powered voice interview',
      href: '/mock-interview/live',
      badge: 'Stage 5',
      cta: 'Start Interview',
      completedLabel: 'Completed',
      time: '~20 min',
    },
  ];

  const handleStepClick = (href: string) => {
    if (!consentGiven) {
      setPendingHref(href);
      setShowConsent(true);
    } else {
      router.push(href);
    }
  };

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsent(false);
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
  };

  const getStepStatus = (step: any): 'completed' | 'active' | 'locked' => {
    if (step.id === 1) return hasNotes ? 'completed' : 'active';
    if (step.id === 2) return 'active';
    if (step.id === 3) return hasNotes ? 'active' : 'locked';
    if (step.id === 4) return isReady ? 'active' : 'locked';
    return 'locked';
  };

  const completedSteps = steps.filter((s) => getStepStatus(s) === 'completed').length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);
  const hasActivity = avgScore > 0 || practiceRoundsCompleted > 0;

  return (
    <>
      {showConsent && (
        <MockConsentModal
          onAccept={handleConsentAccept}
          onDecline={() => setShowConsent(false)}
        />
      )}

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            Mock Interview
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            5-stage system to prepare and walk into your next interview with confidence.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleStepClick('/mock-interview/notes')}
              data-testid="get-started-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2557a7] text-white rounded-lg text-xs font-bold"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push('/mock-interview/history')}
              data-testid="history-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-xs"
            >
              History
            </button>
          </div>

          <div className="mt-4">
            <div data-testid="progress-ring" className="relative w-24 h-24">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{overallProgress}%</span>
                <span className="text-[9px] text-gray-400">{completedSteps}/{steps.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {activeSession && (
          <div data-testid="session-recovery-banner" className="mb-4 flex items-center justify-between gap-3 bg-white border border-[#2557a7]/15 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {activeSession.type === 'live' ? 'Interview in progress' : 'Unfinished practice session'}
              </p>
            </div>
          </div>
        )}

        {hasActivity && (
          <div data-testid="stats-section" className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase">Avg Score</p>
              <p className="text-sm font-bold text-gray-900">{avgScore ? `${avgScore}/10` : '—'}</p>
            </div>
            <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase">Rounds</p>
              <p className="text-sm font-bold text-gray-900">{practiceRoundsCompleted}/3</p>
            </div>
            <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase">Readiness</p>
              <p className="text-sm font-bold text-gray-900">{isReady ? 'Ready' : 'Not Yet'}</p>
            </div>
          </div>
        )}

        {!isReady && practiceRoundsCompleted > 0 && (
          <div data-testid="readiness-alert" className="mb-4 flex items-center gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-lg px-3.5 py-2.5">
            <p className="text-xs text-gray-600">Complete at least 1 practice round to unlock Live Interview.</p>
          </div>
        )}

        <div data-testid="steps-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((step) => {
            const status = getStepStatus(step);
            const isLocked = status === 'locked';
            const isCompleted = status === 'completed';

            return (
              <button
                key={step.id}
                onClick={() => !isLocked && handleStepClick(step.href)}
                disabled={isLocked}
                data-testid={`step-${step.id}`}
                className={`group relative text-left w-full rounded-xl overflow-hidden transition-all duration-200 ${
                  isLocked
                    ? 'bg-gray-50 border border-gray-100 cursor-not-allowed opacity-45'
                    : isCompleted
                    ? 'bg-white border border-[#2557a7]/15'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="p-4 relative z-10">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold tracking-tight text-gray-900">
                          {step.label}
                        </h3>
                        <span data-testid={`step-badge-${step.id}`} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{step.sublabel}</p>
                      {!isLocked && (
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-medium">{step.time}</span>
                          <span className="text-xs font-semibold text-[#2557a7]">{step.cta}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

describe('MockInterviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mock interview page title', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
  });

  it('displays get started and history buttons', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('get-started-btn')).toBeInTheDocument();
    expect(screen.getByTestId('history-btn')).toBeInTheDocument();
  });

  it('displays progress ring with 0% completion initially', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('progress-ring')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders all 4 interview steps', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-3')).toBeInTheDocument();
    expect(screen.getByTestId('step-4')).toBeInTheDocument();
  });

  it('displays step titles correctly', () => {
    render(<MockInterviewPage />);

    expect(screen.getByText('Your Interview Notes')).toBeInTheDocument();
    expect(screen.getByText('English Essentials')).toBeInTheDocument();
    expect(screen.getByText('Practice Your Answers')).toBeInTheDocument();
    expect(screen.getByText('Live Mock Interview')).toBeInTheDocument();
  });

  it('displays step badges', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('step-badge-1')).toHaveTextContent('Stage 1');
    expect(screen.getByTestId('step-badge-2')).toHaveTextContent('Stage 2');
    expect(screen.getByTestId('step-badge-3')).toHaveTextContent('Stage 3–4');
    expect(screen.getByTestId('step-badge-4')).toHaveTextContent('Stage 5');
  });

  it('shows consent modal when step clicked without consent', () => {
    render(<MockInterviewPage />);

    const getStartedBtn = screen.getByTestId('get-started-btn');
    fireEvent.click(getStartedBtn);

    waitFor(() => {
      expect(screen.getByTestId('consent-modal')).toBeInTheDocument();
    });
  });

  it('accepts consent and navigates to step', () => {
    render(<MockInterviewPage />);

    const getStartedBtn = screen.getByTestId('get-started-btn');
    fireEvent.click(getStartedBtn);

    waitFor(() => {
      const acceptBtn = screen.getByTestId('consent-accept');
      fireEvent.click(acceptBtn);

      expect(mockPush).toHaveBeenCalledWith('/mock-interview/notes');
    });
  });

  it('declines consent and closes modal', () => {
    render(<MockInterviewPage />);

    const getStartedBtn = screen.getByTestId('get-started-btn');
    fireEvent.click(getStartedBtn);

    waitFor(() => {
      const declineBtn = screen.getByTestId('consent-decline');
      fireEvent.click(declineBtn);

      expect(screen.queryByTestId('consent-modal')).not.toBeInTheDocument();
    });
  });

  it('navigates to history page', () => {
    render(<MockInterviewPage />);

    const historyBtn = screen.getByTestId('history-btn');
    fireEvent.click(historyBtn);

    expect(mockPush).toHaveBeenCalledWith('/mock-interview/history');
  });

  it('does not display stats section when no activity', () => {
    render(<MockInterviewPage />);

    expect(screen.queryByTestId('stats-section')).not.toBeInTheDocument();
  });

  it('does not display readiness alert when readiness passed', () => {
    render(<MockInterviewPage />);

    expect(screen.queryByTestId('readiness-alert')).not.toBeInTheDocument();
  });

  it('does not display session recovery banner when no active session', () => {
    render(<MockInterviewPage />);

    expect(screen.queryByTestId('session-recovery-banner')).not.toBeInTheDocument();
  });

  it('renders steps grid', () => {
    render(<MockInterviewPage />);

    expect(screen.getByTestId('steps-grid')).toBeInTheDocument();
  });

  it('displays step descriptions', () => {
    render(<MockInterviewPage />);

    expect(screen.getByText(/Generate personalised scripts from your resume/)).toBeInTheDocument();
    expect(screen.getByText(/30 essential phrases/)).toBeInTheDocument();
    expect(screen.getByText(/Practice HR questions across 2 rounds/)).toBeInTheDocument();
    expect(screen.getByText(/Full AI-powered voice interview/)).toBeInTheDocument();
  });

  it('displays step time estimates', () => {
    render(<MockInterviewPage />);

    expect(screen.getByText('~15 min')).toBeInTheDocument();
    expect(screen.getByText('5–10 min')).toBeInTheDocument();
    expect(screen.getByText('~30 min')).toBeInTheDocument();
    expect(screen.getByText('~20 min')).toBeInTheDocument();
  });

  it('displays step CTAs', () => {
    render(<MockInterviewPage />);

    expect(screen.getByText('Generate Notes')).toBeInTheDocument();
    expect(screen.getByText('Read Guide')).toBeInTheDocument();
    expect(screen.getByText('Start Practice')).toBeInTheDocument();
    expect(screen.getByText('Start Interview')).toBeInTheDocument();
  });
});
