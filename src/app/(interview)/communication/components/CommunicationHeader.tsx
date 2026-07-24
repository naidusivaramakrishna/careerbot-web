'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';

const TOTAL_SECONDS = 20 * 60; // 20 minutes

export default function CommunicationHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isAssessmentOver = pathname === '/communication/feedback' || pathname === '/communication/report';
  const { isCameraLost, isMicLost, restartRecording, stopRecording } = useVideoRecording();
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState('');

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
  const [tabSwitched, setTabSwitched] = useState(false);
  const [violations, setViolations] = useState(0);
  const MAX_VIOLATIONS = 3;
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [fullscreenExited, setFullscreenExited] = useState(false);
  const expiredRef = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startCountdown = (startTime: string) => {
      if (interval) clearInterval(interval);
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
        const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0 && !expiredRef.current) {
          expiredRef.current = true;
          localStorage.removeItem('test_start_date');
          setTimeExpired(true);
          if (interval) clearInterval(interval);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    };

    // Check if timer already started (e.g. page refresh)
    const existing = localStorage.getItem('test_start_date');
    if (existing) startCountdown(existing);

    // Listen for timer start from same tab (custom event)
    const handleTimerStart = (e: Event) => {
      const startTime = (e as CustomEvent<string>).detail;
      if (startTime) startCountdown(startTime);
    };
    window.addEventListener('assessment-timer-start', handleTimerStart);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('assessment-timer-start', handleTimerStart);
    };
  }, []);

  // Block browser back/forward buttons during active assessment
  useEffect(() => {
    if (!localStorage.getItem('test_start_date')) return;
    // Push an extra history entry so pressing Back always has something to pop
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (localStorage.getItem('test_start_date')) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Block copy, cut, and right-click during active assessment
  useEffect(() => {
    const isActive = () => !!localStorage.getItem('test_start_date');
    const block = (e: Event) => { if (isActive()) e.preventDefault(); };
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('contextmenu', block);
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('contextmenu', block);
    };
  }, []);

  // Block Ctrl+T (new tab) and Ctrl+N (new window) during active assessment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!localStorage.getItem('test_start_date')) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 't' || e.key === 'T' || e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect tab switch / app switch during active assessment
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!localStorage.getItem('test_start_date')) return;
      if (document.hidden) {
        setTabSwitched(true);
        setViolations((v) => v + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-terminate when violations exceed the limit
  useEffect(() => {
    if (violations >= MAX_VIOLATIONS && localStorage.getItem('test_start_date')) {
      localStorage.removeItem('test_start_date');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      stopRecording().finally(() => {
        router.push('/communication/feedback?reason=timeout');
      });
    }
  }, [violations, router, stopRecording]);

  // Detect user exiting fullscreen mid-assessment (e.g. pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isAssessmentActive = !!localStorage.getItem('test_start_date');
      if (!document.fullscreenElement && isAssessmentActive) {
        setFullscreenExited(true);
        setViolations((v) => v + 1);
      } else {
        setFullscreenExited(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-return to fullscreen after 5s if user doesn't click the button
  useEffect(() => {
    if (!fullscreenExited) return;
    const t = setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreenExited(false);
    }, 5000);
    return () => clearTimeout(t);
  }, [fullscreenExited]);

  const handleReturnFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
    setFullscreenExited(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerColor = timeLeft === null
    ? ''
    : timeLeft <= 120
      ? 'text-red-600'
      : timeLeft <= 300
        ? 'text-amber-600'
        : 'text-gray-700';

  const timerBg = timeLeft === null
    ? ''
    : timeLeft <= 120
      ? 'bg-red-50 border border-red-200'
      : timeLeft <= 300
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-gray-100 border border-gray-200';

  const handleExit = () => setShowConfirm(true);
  const handleConfirmExit = () => {
    localStorage.removeItem('test_start_date');
    router.push('/dashboard');
  };
  const handleCancel = () => setShowConfirm(false);

  return (
    <>
      {/* Static header - part of flex column, no fixed positioning */}
      <header className="h-14 w-full shrink-0 border-b border-slate-200 bg-white/95 px-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur z-50">

        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Logo + name */}
        <div className="flex min-w-0 items-center">
          <Image
            src="/assets/icons/Logo.png"
            alt="CareerBot"
            width={50}
            height={50}
            className="object-contain"
          />
          <div className="-ml-1.5 min-w-0">
            <span className="block text-base font-black leading-none tracking-tight text-slate-950">CareerBot</span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Live assessment</span>
          </div>
        </div>

        {/* Center: Assessment label + timer */}
        <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Communication Assessment
          </span>
          {timeLeft !== null && !isAssessmentOver && (
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black tabular-nums ${timerBg} ${timerColor}`}>
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Right: Exit button */}
        <button
          onClick={handleExit}
          className="justify-self-end flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Exit
        </button>
        </div>
      </header>

      {/* Tab switch / app switch detected overlay */}
      {!isAssessmentOver && tabSwitched && !timeExpired && !isCameraLost && !isMicLost && !fullscreenExited && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-0.5 bg-amber-500" />
            <div className="p-7 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">Tab Switch Detected</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                You navigated away from the assessment. Switching tabs or apps is not allowed during the exam.
              </p>
              <button
                onClick={() => setTabSwitched(false)}
                className="mt-6 w-full py-2.5 bg-[#2557a7] hover:bg-[#1e4a94] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Return to Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen exited overlay */}
      {!isAssessmentOver && fullscreenExited && !timeExpired && !isCameraLost && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-0.5 bg-amber-500" />
            <div className="p-7 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">Return to Fullscreen</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                The assessment must be completed in fullscreen mode. Please return to fullscreen to continue.
              </p>
              <button
                onClick={handleReturnFullscreen}
                className="mt-6 w-full py-2.5 bg-[#2557a7] hover:bg-[#1e4a94] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera / mic lost overlay */}
      {!isAssessmentOver && (isCameraLost || isMicLost) && !timeExpired && (() => {
        const bothLost = isCameraLost && isMicLost;
        const title = bothLost
          ? 'Camera & Microphone Disconnected'
          : isCameraLost
            ? 'Camera Disconnected'
            : 'Microphone Disconnected';
        const description = bothLost
          ? 'Your camera and microphone were turned off. Both are required to continue the assessment.'
          : isCameraLost
            ? 'Your camera was turned off. Camera access is required to continue the assessment.'
            : 'Your microphone was turned off. Microphone access is required to continue the assessment.';
        const buttonLabel = bothLost
          ? 'Re-enable Camera & Microphone'
          : isCameraLost
            ? 'Re-enable Camera'
            : 'Re-enable Microphone';

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
              <div className="h-0.5 bg-red-500" />
              <div className="p-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 border border-red-100 rounded-2xl mb-4">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1.5">{title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                {restartError && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {restartError}
                  </p>
                )}
                <button
                  onClick={handleReEnableDevices}
                  disabled={restarting}
                  className="mt-6 w-full py-2.5 bg-[#2557a7] hover:bg-[#1e4a94] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {restarting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {restarting ? 'Enabling...' : buttonLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Time expired overlay */}
      {!isAssessmentOver && timeExpired && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-0.5 bg-red-500" />
            <div className="p-7 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 border border-red-100 rounded-2xl mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">Time&apos;s Up!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your assessment time has ended. You can still share your feedback before leaving.
              </p>
              <button
                onClick={async () => {
                  localStorage.removeItem('test_start_date');
                  setTimeExpired(false);
                  await stopRecording();
                  router.push('/communication/feedback?reason=timeout');
                }}
                className="mt-6 w-full py-2.5 bg-[#2557a7] hover:bg-[#1e4a94] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Continue to Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-0.5 bg-[#2557a7]" />
            <div className="p-7">
              <h2 className="text-base font-bold text-gray-900 mb-1.5">Exit Assessment?</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your progress will be lost. Are you sure you want to exit the assessment?
              </p>
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Yes, Exit
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


