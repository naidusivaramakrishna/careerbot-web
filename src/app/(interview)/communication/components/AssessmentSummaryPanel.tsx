'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { getAudioStatus } from '@/api/communicationApi';

interface AssessmentSummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}

interface QuestionStatus {
  questionNumber: number;
  isCompleted: boolean;
}

export default function AssessmentSummaryPanel({
  isOpen,
  onClose,
  onFinish,
  isSubmitting,
}: AssessmentSummaryPanelProps) {
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isTranscriptionReady, setIsTranscriptionReady] = useState(false);
  const [waitingTimeLeft, setWaitingTimeLeft] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadQuestionStatuses();
      checkTranscriptionReadiness();

      // Poll transcription status every 3 seconds while panel is open
      const pollInterval = setInterval(() => {
        checkTranscriptionReadiness();
      }, 3000); // Check every 3 seconds

      // Cleanup interval when panel closes
      return () => clearInterval(pollInterval);
    }
  }, [isOpen]);

  const loadQuestionStatuses = () => {
    try {
      // Initialize all 44 questions
      const statuses: QuestionStatus[] = Array.from({ length: 44 }, (_, i) => ({
        questionNumber: i + 1,
        isCompleted: false,
      }));

      // Try to load completed questions from localStorage
      // We'll check for uploaded questions in session storage
      const sessionId = localStorage.getItem('session_id');

      if (sessionId) {
        // Check which questions have been answered
        let completed = 0;

        // Check sessionStorage for lightweight completion markers
        // These are set when audio is successfully uploaded (just a "true" string, not the actual audio)
        for (let i = 1; i <= 44; i++) {
          const completionKey = `q_${i}_completed`;
          if (sessionStorage.getItem(completionKey) === 'true') {
            statuses[i - 1].isCompleted = true;
            completed++;
          }
        }

        setCompletedCount(completed);
        logger.info(`📊 Loaded assessment progress: ${completed}/44 questions completed`);
      }

      setQuestionStatuses(statuses);
    } catch (error) {
      logger.error('Failed to load question statuses:', error);
      // Initialize with empty statuses
      const statuses: QuestionStatus[] = Array.from({ length: 44 }, (_, i) => ({
        questionNumber: i + 1,
        isCompleted: false,
      }));
      setQuestionStatuses(statuses);
    }
  };

  const checkTranscriptionReadiness = async () => {
    try {
      const sessionId = localStorage.getItem('session_id');

      if (!sessionId) {
        logger.warn('No session_id found for transcription check');
        setIsTranscriptionReady(false);
        return;
      }

      // Call backend API to get real-time transcription status
      const status = await getAudioStatus(sessionId);

      logger.info(`📊 Transcription status: ${status.completed}/${status.total_expected} completed, ${status.processing} processing, ${status.failed} failed`);

      // Check if all transcriptions are complete
      if (status.overall_status === 'completed' && status.completed === status.total_expected) {
        setIsTranscriptionReady(true);
        setWaitingTimeLeft(0);
        logger.info('✅ All audio transcriptions are complete');
      } else {
        setIsTranscriptionReady(false);
        // Calculate remaining questions (processing + pending)
        const remaining = status.total_expected - status.completed;
        setWaitingTimeLeft(remaining);
        logger.info(`⏳ Waiting for ${remaining} transcriptions (${status.processing} processing, ${status.missing.length} pending)`);
      }
    } catch (error) {
      logger.error('Failed to check transcription readiness:', error);
      // If there's an error, default to not ready
      setIsTranscriptionReady(false);
    }
  };

  const progressPercentage = (completedCount / 44) * 100;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/20 z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Overview</p>
                <h2 className="text-base font-bold text-gray-900">Assessment Summary</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Close panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Circular Progress */}
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="#F3F4F6" strokeWidth="6" fill="none" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#2557a7"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 leading-none">{completedCount}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">of 44</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progressPercentage.toFixed(0)}%</p>
                <p className="text-sm text-gray-500 mt-0.5">Questions answered</p>
                {completedCount < 44 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {44 - completedCount} remaining
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Question Status</p>
            <div className="grid grid-cols-8 gap-1.5">
              {questionStatuses.map((status) => (
                <div
                  key={status.questionNumber}
                  title={`Question ${status.questionNumber} — ${status.isCompleted ? 'Answered' : 'Pending'}`}
                  className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold transition-all duration-200 ${
                    status.isCompleted
                      ? 'bg-[#2557a7] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {status.questionNumber}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-[#2557a7]" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-gray-200" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 shrink-0">
            {/* Transcription warning */}
            {!isTranscriptionReady && !isSubmitting && waitingTimeLeft > 0 && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-800">Processing Audio</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {waitingTimeLeft} transcription{waitingTimeLeft !== 1 ? 's' : ''} remaining — please wait…
                </p>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.setItem('assessment_end_time', new Date().toISOString());
                onFinish();
              }}
              disabled={isSubmitting || !isTranscriptionReady}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isSubmitting || !isTranscriptionReady
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2557a7] hover:bg-[#1e4a94] text-white shadow-sm'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting…
                </>
              ) : !isTranscriptionReady ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Transcriptions…
                </>
              ) : (
                'Finish Assessment →'
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
