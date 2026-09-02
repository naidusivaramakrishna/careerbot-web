'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { getAudioStatus } from '@/api/communicationApi';

interface AssessmentSummaryPanelProps {
  isOpen: boolean;
  onFinish: () => void;
  isSubmitting: boolean;
}

interface QuestionStatus {
  questionNumber: number;
  isCompleted: boolean;
}

export default function AssessmentSummaryPanel({
  isOpen,
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
        logger.info(` Loaded assessment progress: ${completed}/44 questions completed`);
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

      logger.info(` Transcription status: ${status.completed}/${status.total_expected} completed, ${status.processing} processing, ${status.failed} failed`);

      // Check if all transcriptions are complete
      if (status.overall_status === 'completed' && status.completed === status.total_expected) {
        setIsTranscriptionReady(true);
        setWaitingTimeLeft(0);
        logger.info(' All audio transcriptions are complete');
      } else {
        setIsTranscriptionReady(false);
        // Calculate remaining questions (processing + pending)
        const remaining = status.total_expected - status.completed;
        setWaitingTimeLeft(remaining);
        logger.info(` Waiting for ${remaining} transcriptions (${status.processing} processing, ${status.missing.length} pending)`);
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
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition-all duration-300"
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[420px] transform border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f8ff] px-6 pb-5 pt-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#2557a7]">Overview</p>
                <h2 className="text-base font-black text-slate-950">Assessment Summary</h2>
              </div>
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
                  <span className="text-xl font-black leading-none text-slate-950">{completedCount}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">of 44</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-950">{progressPercentage.toFixed(0)}%</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-500">Questions answered</p>
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
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Question Status</p>
            <div className="grid grid-cols-8 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {questionStatuses.map((status) => (
                <div
                  key={status.questionNumber}
                  title={`Question ${status.questionNumber} - ${status.isCompleted ? 'Answered' : 'Pending'}`}
                  className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-black transition-all duration-200 ${
                    status.isCompleted
                      ? 'bg-[#2557a7] text-white shadow-sm'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status.questionNumber}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-slate-500">
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
          <div className="shrink-0 border-t border-slate-100 bg-white px-6 pb-6 pt-4">
            {/* Transcription warning */}
            {!isTranscriptionReady && !isSubmitting && waitingTimeLeft > 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-black text-amber-900">Processing Audio</p>
                <p className="mt-0.5 text-xs font-semibold text-amber-800">
                  {waitingTimeLeft} transcription{waitingTimeLeft !== 1 ? 's' : ''} remaining - please wait...
                </p>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.setItem('assessment_end_time', new Date().toISOString());
                onFinish();
              }}
              disabled={isSubmitting || !isTranscriptionReady}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all ${
                isSubmitting || !isTranscriptionReady
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'bg-[#2557a7] text-white shadow-lg shadow-[#2557a7]/15 hover:bg-[#1e4a94]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : !isTranscriptionReady ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Transcriptions...
                </>
              ) : (
                'Finish Assessment ->'
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
