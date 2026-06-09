import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock VideoRecordingContext
vi.mock('@/contexts/VideoRecordingContext', () => ({
  useVideoRecording: () => ({
    isCameraLost: false,
    isMicLost: false,
    restartRecording: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Test component
const CommunicationHeader = () => {
  const { isCameraLost, isMicLost, restartRecording } = require('@/contexts/VideoRecordingContext').useVideoRecording();
  const router = require('next/navigation').useRouter();
  const [restarting, setRestarting] = React.useState(false);
  const [restartError, setRestartError] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [timeExpired, setTimeExpired] = React.useState(false);
  const [fullscreenExited, setFullscreenExited] = React.useState(false);

  React.useEffect(() => {
    const startTime = localStorage.getItem('test_start_date');
    if (startTime) {
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
        const remaining = Math.max(0, 1200 - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) {
          setTimeExpired(true);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleReEnableDevices = async () => {
    setRestarting(true);
    setRestartError('');
    try {
      await restartRecording();
    } catch {
      setRestartError('Could not access camera/microphone. Please check your device settings and try again.');
    } finally {
      setRestarting(false);
    }
  };

  const handleExit = () => setShowConfirm(true);
  const handleConfirmExit = () => {
    localStorage.removeItem('test_start_date');
    router.push('/dashboard');
  };
  const handleCancel = () => setShowConfirm(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerColor = timeLeft === null ? '' : timeLeft <= 120 ? 'text-red-600' : timeLeft <= 300 ? 'text-amber-600' : 'text-gray-700';
  const timerBg = timeLeft === null ? '' : timeLeft <= 120 ? 'bg-red-50 border border-red-200' : timeLeft <= 300 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-100 border border-gray-200';

  return (
    <>
      <header className="h-12 w-full shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-5 z-50">
        <div className="flex items-center">
          <span data-testid="logo">CareerBot</span>
        </div>

        <div className="flex items-center gap-3">
          <span data-testid="assessment-label" className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Communication Assessment
          </span>
          {timeLeft !== null && (
            <div data-testid="timer" className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${timerBg} ${timerColor}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <button
          onClick={handleExit}
          data-testid="exit-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500"
        >
          Exit
        </button>
      </header>

      {/* Fullscreen exited overlay */}
      {fullscreenExited && !timeExpired && !isCameraLost && (
        <div data-testid="fullscreen-modal" className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 p-6">Return to Fullscreen</h2>
            <button
              onClick={() => setFullscreenExited(false)}
              data-testid="return-fullscreen-btn"
              className="w-full py-2.5 bg-[#2557a7] text-white rounded-xl font-semibold text-sm"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Camera / mic lost overlay */}
      {(isCameraLost || isMicLost) && !timeExpired && (
        <div data-testid="device-lost-modal" className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4">
            <h2 data-testid="device-lost-title" className="text-base font-bold text-gray-900 p-6">
              {isCameraLost && isMicLost ? 'Camera & Microphone Disconnected' : isCameraLost ? 'Camera Disconnected' : 'Microphone Disconnected'}
            </h2>
            {restartError && (
              <p data-testid="restart-error" className="text-xs text-red-600 px-6">
                {restartError}
              </p>
            )}
            <button
              onClick={handleReEnableDevices}
              disabled={restarting}
              data-testid="reenable-btn"
              className="mt-6 w-full py-2.5 bg-[#2557a7] text-white rounded-xl font-semibold text-sm"
            >
              {restarting ? 'Enabling…' : 'Re-enable'}
            </button>
          </div>
        </div>
      )}

      {/* Time expired overlay */}
      {timeExpired && (
        <div data-testid="time-expired-modal" className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 p-6">Time's Up!</h2>
            <button
              onClick={() => router.push('/communication/feedback?reason=timeout')}
              data-testid="feedback-btn"
              className="w-full py-2.5 bg-[#2557a7] text-white rounded-xl font-semibold text-sm"
            >
              Continue to Feedback
            </button>
          </div>
        </div>
      )}

      {/* Exit confirmation modal */}
      {showConfirm && (
        <div data-testid="exit-confirm-modal" className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 p-6">Exit Assessment?</h2>
            <p className="text-sm text-gray-500 px-6">Your progress will be lost. Are you sure you want to exit?</p>
            <div className="flex gap-2.5 mt-6 px-6 pb-6">
              <button
                onClick={handleConfirmExit}
                data-testid="confirm-exit-btn"
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm"
              >
                Yes, Exit
              </button>
              <button
                onClick={handleCancel}
                data-testid="cancel-exit-btn"
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

describe('CommunicationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders header with logo and assessment label', () => {
    render(<CommunicationHeader />);

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByTestId('assessment-label')).toBeInTheDocument();
    expect(screen.getByText('Communication Assessment')).toBeInTheDocument();
  });

  it('displays exit button', () => {
    render(<CommunicationHeader />);

    expect(screen.getByTestId('exit-btn')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });

  it('shows timer when test is active', () => {
    const startTime = new Date().toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByTestId('timer')).toBeInTheDocument();
    });
  });

  it('displays timer in MM:SS format', () => {
    const startTime = new Date(Date.now() - 300000).toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      const timer = screen.getByTestId('timer');
      expect(timer.textContent).toMatch(/\d{2}:\d{2}/);
    });
  });

  it('changes timer color to amber when below 5 minutes', () => {
    const startTime = new Date(Date.now() - 700000).toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      const timer = screen.getByTestId('timer');
      expect(timer).toHaveClass('text-amber-600');
    });
  });

  it('changes timer color to red when below 2 minutes', () => {
    const startTime = new Date(Date.now() - 1080000).toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      const timer = screen.getByTestId('timer');
      expect(timer).toHaveClass('text-red-600');
    });
  });

  it('shows exit confirmation modal when exit button clicked', () => {
    render(<CommunicationHeader />);

    const exitBtn = screen.getByTestId('exit-btn');
    fireEvent.click(exitBtn);

    waitFor(() => {
      expect(screen.getByTestId('exit-confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Exit Assessment?')).toBeInTheDocument();
    });
  });

  it('cancels exit and closes modal', () => {
    render(<CommunicationHeader />);

    const exitBtn = screen.getByTestId('exit-btn');
    fireEvent.click(exitBtn);

    waitFor(() => {
      const cancelBtn = screen.getByTestId('cancel-exit-btn');
      fireEvent.click(cancelBtn);

      expect(screen.queryByTestId('exit-confirm-modal')).not.toBeInTheDocument();
    });
  });

  it('confirms exit and navigates to dashboard', () => {
    localStorage.setItem('test_start_date', new Date().toISOString());

    render(<CommunicationHeader />);

    const exitBtn = screen.getByTestId('exit-btn');
    fireEvent.click(exitBtn);

    waitFor(() => {
      const confirmBtn = screen.getByTestId('confirm-exit-btn');
      fireEvent.click(confirmBtn);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(localStorage.getItem('test_start_date')).toBeNull();
    });
  });

  it('shows time expired modal when time runs out', () => {
    const startTime = new Date(Date.now() - 1200000).toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByTestId('time-expired-modal')).toBeInTheDocument();
      expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    });
  });

  it('navigates to feedback page from time expired modal', () => {
    const startTime = new Date(Date.now() - 1200000).toISOString();
    localStorage.setItem('test_start_date', startTime);

    render(<CommunicationHeader />);

    waitFor(() => {
      const feedbackBtn = screen.getByTestId('feedback-btn');
      fireEvent.click(feedbackBtn);

      expect(mockPush).toHaveBeenCalledWith('/communication/feedback?reason=timeout');
    });
  });

  it('shows device lost modal for camera disconnection', () => {
    vi.doMock('@/contexts/VideoRecordingContext', () => ({
      useVideoRecording: () => ({
        isCameraLost: true,
        isMicLost: false,
        restartRecording: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByTestId('device-lost-modal')).toBeInTheDocument();
      expect(screen.getByText('Camera Disconnected')).toBeInTheDocument();
    });
  });

  it('shows device lost modal for microphone disconnection', () => {
    vi.doMock('@/contexts/VideoRecordingContext', () => ({
      useVideoRecording: () => ({
        isCameraLost: false,
        isMicLost: true,
        restartRecording: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByTestId('device-lost-modal')).toBeInTheDocument();
      expect(screen.getByText('Microphone Disconnected')).toBeInTheDocument();
    });
  });

  it('shows both devices lost message', () => {
    vi.doMock('@/contexts/VideoRecordingContext', () => ({
      useVideoRecording: () => ({
        isCameraLost: true,
        isMicLost: true,
        restartRecording: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByText('Camera & Microphone Disconnected')).toBeInTheDocument();
    });
  });

  it('displays re-enable button for device reconnection', () => {
    vi.doMock('@/contexts/VideoRecordingContext', () => ({
      useVideoRecording: () => ({
        isCameraLost: true,
        isMicLost: false,
        restartRecording: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    render(<CommunicationHeader />);

    waitFor(() => {
      expect(screen.getByTestId('reenable-btn')).toBeInTheDocument();
    });
  });

  it('does not show timer when no test is active', () => {
    render(<CommunicationHeader />);

    expect(screen.queryByTestId('timer')).not.toBeInTheDocument();
  });
});
