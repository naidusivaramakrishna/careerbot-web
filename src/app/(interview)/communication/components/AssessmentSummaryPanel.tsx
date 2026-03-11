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
      {/* Backdrop with Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/10 z-40 transition-all duration-300"
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Assessment Summary</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close panel"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Circular Progress */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Background Circle */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{completedCount}</span>
                  <span className="text-sm text-gray-500">of 44</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-600">
                {progressPercentage.toFixed(0)}% Complete
              </p>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Status</h3>
            <div className="grid grid-cols-8 gap-2">
              {questionStatuses.map((status) => (
                <div
                  key={status.questionNumber}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-xs font-semibold
                    transition-all duration-200
                    ${
                      status.isCompleted
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }
                  `}
                  title={`Question ${status.questionNumber} - ${status.isCompleted ? 'Completed' : 'Not completed'}`}
                >
                  {status.questionNumber}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-600"></div>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200"></div>
                <span className="text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Footer with Finish Button */}
          <div className="p-6 border-t border-gray-200">
            {/* Transcription Status Warning */}
            {!isTranscriptionReady && !isSubmitting && waitingTimeLeft > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Processing Audio Transcriptions</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {waitingTimeLeft} transcription{waitingTimeLeft !== 1 ? 's' : ''} remaining. Please wait...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onFinish}
              disabled={isSubmitting || !isTranscriptionReady}
              className={`
                w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2
                ${
                  isSubmitting || !isTranscriptionReady
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : !isTranscriptionReady ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Transcriptions...
                </>
              ) : (
                <>
                  <span>Finish Assessment</span>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </>
              )}
            </button>

            {completedCount < 44 && (
              <p className="mt-3 text-xs text-center text-amber-600">
                ⚠️ You have {44 - completedCount} unanswered question(s)
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
