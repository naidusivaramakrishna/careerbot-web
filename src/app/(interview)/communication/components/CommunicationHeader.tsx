'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const TOTAL_SECONDS = 20 * 60; // 20 minutes

export default function CommunicationHeader() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const startTime = localStorage.getItem('test_start_date');
    if (!startTime) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const handleConfirmExit = () => router.push('/communication');
  const handleCancel = () => setShowConfirm(false);

  return (
    <>
      {/* Static header — part of flex column, no fixed positioning */}
      <header className="h-12 w-full shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-5 z-50">

        {/* Left: Logo + name */}
        <div className="flex items-center">
          <Image
            src="/assets/icons/Logo.png"
            alt="CareerBot"
            width={50}
            height={50}
            className="object-contain"
          />
          <span className="-ml-1.5 text-lg font-bold text-gray-900 tracking-tight">CareerBot</span>
        </div>

        {/* Center: Assessment label + timer */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Communication Assessment
          </span>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${timerBg} ${timerColor}`}>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Exit
        </button>
      </header>

      {/* Exit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
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
