'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import {
  submitVideoEvaluation,
  getCurrentQuestion,
  uploadAudio,
  evaluateAudio,
  completeSession,
  evaluateMcq,
} from '@/api/communicationApi';
import type { CurrentQuestionResponse } from '@/api/communicationApi';
import logger from '@/lib/logger';
import { validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';

const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), { loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading...</div></div>, ssr: false });
const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });
const AssessmentSummaryPanel = dynamic(() => import('../components/AssessmentSummaryPanel'), { loading: () => null, ssr: false });
const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), { loading: () => <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200 h-20 animate-pulse" /> });

export default function SituationExplainingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setValidationWarning] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { stopRecording } = useVideoRecording();

  // ✅ Track section-specific question number for display only (1 of 1 for "Situation Explaining")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 1; // Total questions in this section

  // Fetch current question from API
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      // ✅ Normalize section name to match backend's naming
      setCurrentQuestion({
        ...response,
        section_name: 'Describe Situation', // Backend uses this name
      });
      logger.info('Situation Explaining - Loaded question:', response.question_id);
      logger.info('Question text:', response.question_text);
    } catch (err) {
      logger.error('Failed to fetch question:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSection = async () => {
    setShowModal(false);
    await fetchCurrentQuestion();
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // ✅ Validate audio before saving
    logger.info('🔍 Validating audio recording...');
    const validation = await validateAudioBlob(audioBlob);

    logger.info('📊 Audio validation result:', {
      isValid: validation.isValid,
      duration: formatDuration(validation.duration),
      hasSound: validation.hasSound,
      size: formatFileSize(audioBlob.size),
      error: validation.error,
      warning: validation.warning,
    });

    // Show error if audio is invalid
    if (!validation.isValid) {
      setError(validation.error || 'Invalid audio recording');
      setValidationWarning('');
      alert(`⚠️ Invalid Recording!\n\n${validation.error}\n\nPlease record again.`);
      return; // Don't save invalid audio
    }

    // Show warning if audio is valid but concerning
    if (validation.warning) {
      setValidationWarning(validation.warning);
      logger.warn('⚠️', validation.warning);
    } else {
      setValidationWarning('');
    }

    // Clear any previous errors
    setError('');

    setRecordedAudio(audioBlob);
    logger.info(`✅ Valid audio saved (${formatDuration(validation.duration)}, ${formatFileSize(audioBlob.size)})`);

    // IMPORTANT: Don't save to sessionStorage to avoid quota exceeded error
    // Real audio recordings are large (~88KB WebM) and will fill up sessionStorage quickly
    // We only need to keep in state for immediate upload via progressive API
  };

  // Step 1: Upload current question audio and open summary panel
  const handleUploadCurrentAudio = async () => {
    if (!recordedAudio) {
      alert('Please record your answer before finishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const testId = localStorage.getItem('test_id');
      const sessionId = localStorage.getItem('session_id');

      if (!testId || !sessionId) {
        logger.error('Missing test_id or session_id');
        alert('Missing required information. Please start the assessment again.');
        setIsSubmitting(false);
        return;
      }

      if (!currentQuestion?.question_id || !recordedAudio) {
        logger.error('Missing question_id or recordedAudio');
        alert('Cannot submit: Missing audio recording or question information.');
        setIsSubmitting(false);
        return;
      }

      // ==================== Upload Audio Only ====================
      logger.info('📤 Uploading audio for final question...');

      if (recordedAudio.size === 0 || recordedAudio.size < 100) {
        const errorMsg = `Audio recording is empty or too small (${recordedAudio.size} bytes). Please record your answer again.`;
        logger.error(errorMsg);
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const uploadResponse = await uploadAudio({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        test_id: testId,
        audio_file: recordedAudio,
        return_next_question: false,
        question_number: currentQuestion.question_number,
      });

      logger.info('✅ Audio uploaded successfully');

      if (!uploadResponse || !uploadResponse.success) {
        const errorMsg = `Audio upload failed. Response: ${JSON.stringify(uploadResponse)}`;
        logger.error(errorMsg);
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Mark question as completed in sessionStorage for Assessment Summary Panel
      sessionStorage.setItem(`q_44_completed`, 'true');
      logger.info('✅ Marked question 44 as completed');

      // Open the summary panel
      setIsSubmitting(false);
      setIsPanelOpen(true);
      logger.info('✅ Audio uploaded. Opening assessment summary panel...');

    } catch (error) {
      logger.error('❌ Error uploading audio:', error);
      alert('Failed to upload audio. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Step 2: Complete session and run evaluations (called from panel)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      const emailId = localStorage.getItem('userEmail') || localStorage.getItem('user_email');
      const testId = localStorage.getItem('test_id');
      const sessionId = localStorage.getItem('session_id');

      if (!emailId || !testId || !sessionId) {
        logger.error('Missing email, test_id, or session_id');
        alert('Missing required information. Please start the assessment again.');
        setIsSubmitting(false);
        return;
      }

      // ==================== STEP 1: Complete Session ====================
      logger.info('📋 STEP 1: Completing session...');

      try {
        const completeResponse = await completeSession(sessionId);
        logger.info('✅ STEP 1 Complete: Session completed successfully:', completeResponse);
      } catch (completeError) {
        logger.error('❌ STEP 1 Failed: Complete session error:', completeError);
        // Continue anyway - session might already be complete
        logger.warn('⚠️ Continuing despite complete session error...');
      }

      // ==================== STEP 1.5: MCQ Evaluation ====================
      logger.info('📊 STEP 1.5: Evaluating MCQ answers (Jumbled Sentences, Sentence Completion, Story Listen Facts)...');

      try {
        // Collect MCQ answers from sessionStorage
        const textAnswersStr = sessionStorage.getItem('text_answers');

        if (textAnswersStr) {
          const textAnswers = JSON.parse(textAnswersStr);
          const totalAnswers = Object.keys(textAnswers).length;

          logger.info(`📝 Found ${totalAnswers} MCQ answers in sessionStorage`);

          // Filter to only include JUM, SCM, and SLF sections
          const mcqAnswers: { [key: string]: string } = {};
          Object.entries(textAnswers).forEach(([questionId, answer]) => {
            // Check if question ID contains JUM, SCM, or SLF section codes
            if (questionId.includes('-JUM-') || questionId.includes('-SCM-') || questionId.includes('-SLF-')) {
              mcqAnswers[questionId] = answer as string;
            }
          });

          const mcqCount = Object.keys(mcqAnswers).length;
          logger.info(`📝 Filtered ${mcqCount} MCQ answers for evaluation (JUM + SCM + SLF)`);

          if (mcqCount > 0) {
            // Call MCQ evaluation API
            const mcqEvalResponse = await evaluateMcq({
              test_id: testId,
              email_id: emailId,
              answers: mcqAnswers,
            });

            logger.info('✅ STEP 1.5 Complete: MCQ evaluation successful:', mcqEvalResponse);

            // ✅ Store the mcq_evaluation_id
            if (mcqEvalResponse.mcq_evaluation_id) {
              localStorage.setItem('mcq_evaluation_id', mcqEvalResponse.mcq_evaluation_id);
              logger.info('✅ Stored mcq_evaluation_id:', mcqEvalResponse.mcq_evaluation_id);
            }

            // ✅ Store the full MCQ evaluation response for final report
            localStorage.setItem('mcq_evaluation_data', JSON.stringify(mcqEvalResponse));
            logger.info('✅ Stored full MCQ evaluation data');
          } else {
            logger.warn('⚠️ No MCQ answers found for JUM, SCM, or SLF sections');
          }
        } else {
          logger.warn('⚠️ No text_answers found in sessionStorage');
        }
      } catch (mcqError) {
        logger.error('❌ STEP 1.5 Failed: MCQ evaluation error:', mcqError);
        // MCQ evaluation failure should not block the rest of the flow
        logger.warn('⚠️ Continuing despite MCQ evaluation error...');
      }

      // ==================== Prepare Video Blob ====================
      logger.info('🎥 Stopping video recording...');
      const videoBlob = await stopRecording();

      if (!videoBlob) {
        logger.warn('No video recording found - will skip video evaluation');
      } else {
        logger.info(`Video blob retrieved: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
      }

      // ==================== STEP 2: Parallel Evaluations ====================
      logger.info('📊 STEP 2: Running audio and video evaluations in parallel...');

      const evaluationPromises = [];

      // Audio evaluation promise
      const audioEvalPromise = evaluateAudio({
        session_id: sessionId,
        email_id: emailId,
        test_id: testId,
        allow_partial: true,
      })
        .then((audioEvalResponse) => {
          logger.info('✅ Audio evaluation completed:', audioEvalResponse.status);

          if (audioEvalResponse.status === 'insufficient') {
            const missing = audioEvalResponse.missing_sections?.length || 0;
            throw new Error(`Missing ${missing} audio recordings. Please complete all sections.`);
          }

          if (audioEvalResponse.status === 'partial') {
            logger.warn(`⚠️ Partial evaluation: ${audioEvalResponse.missing_sections?.join(', ')}`);
          }

          // ✅ Store the evaluation ID
          if (audioEvalResponse.audio_evaluation_id) {
            localStorage.setItem('audio_evaluation_id', audioEvalResponse.audio_evaluation_id);
            logger.info('✅ Stored audio_evaluation_id:', audioEvalResponse.audio_evaluation_id);
          }

          // ✅ Store the full audio evaluation response for final report
          localStorage.setItem('audio_evaluation_data', JSON.stringify(audioEvalResponse));
          logger.info('✅ Stored full audio evaluation data');

          return { type: 'audio', success: true, data: audioEvalResponse };
        })
        .catch((audioError: unknown) => {
          logger.error('❌ Audio evaluation failed:', audioError);

          // Check for incomplete submission error
          const error = audioError as { response?: { data?: { error?: string; missing_sections?: string[]; missing_count?: number; completed?: number; total_required?: number } }; message?: string };
          if (error?.response?.data?.error === 'Incomplete submission') {
            const errorData = error.response?.data || {};
            const missing = errorData.missing_sections || [];
            const message = `⏳ Transcriptions Still Processing!\n\n` +
              `The backend is still processing ${errorData.missing_count || 9} audio transcriptions.\n\n` +
              `Completed: ${errorData.completed || 0}/${errorData.total_required || 44}\n` +
              `Missing: ${missing.join(', ')}\n\n` +
              `Please wait 30 seconds and click "Finish Assessment" again.\n\n` +
              `This happens because audio transcription runs in the background and may take a few seconds to complete.`;
            throw new Error(message);
          }

          return { type: 'audio', success: false, error: error.message || 'Audio evaluation failed' };
        });

      evaluationPromises.push(audioEvalPromise);

      // Video evaluation promise (only if we have video)
      if (videoBlob && videoBlob.size > 0) {
        const videoEvalPromise = submitVideoEvaluation({
          email_id: emailId,
          test_id: testId,
          file: videoBlob,
        })
          .then((videoEvalResponse) => {
            logger.info('✅ Video evaluation completed');

            // ✅ Store the evaluation ID (from nested data structure)
            if (videoEvalResponse.data?.video_evaluation_id) {
              localStorage.setItem('video_evaluation_id', videoEvalResponse.data.video_evaluation_id);
              logger.info('✅ Stored video_evaluation_id:', videoEvalResponse.data.video_evaluation_id);
            }

            // ✅ Store the full video evaluation response for final report
            localStorage.setItem('video_evaluation_data', JSON.stringify(videoEvalResponse));
            logger.info('✅ Stored full video evaluation data');

            return { type: 'video', success: true, data: videoEvalResponse };
          })
          .catch((videoError) => {
            logger.error('❌ Video evaluation failed:', videoError);
            return { type: 'video', success: false, error: videoError.message || 'Video evaluation failed' };
          });

        evaluationPromises.push(videoEvalPromise);
      } else {
        logger.warn('⚠️ Skipping video evaluation - no valid video blob');
      }

      // Wait for all evaluations to complete
      try {
        const results = await Promise.all(evaluationPromises);
        logger.info('✅ STEP 2 Complete: All evaluations finished');

        // Check if audio evaluation failed critically
        const audioResult = results.find(r => r.type === 'audio');
        if (audioResult && !audioResult.success) {
          const errorMsg = 'error' in audioResult ? audioResult.error : 'Audio evaluation failed';
          alert(errorMsg);
          setIsSubmitting(false);
          return;
        }

        // Video failure is non-critical
        const videoResult = results.find(r => r.type === 'video');
        if (videoResult && !videoResult.success) {
          const errorMsg = 'error' in videoResult ? videoResult.error : 'Video evaluation failed';
          logger.warn('⚠️ Video evaluation failed but continuing:', errorMsg);
        }

      } catch (evalError) {
        logger.error('❌ STEP 2 Failed: Evaluation error:', evalError);
        alert(evalError instanceof Error ? evalError.message : 'Evaluation failed');
        setIsSubmitting(false);
        return;
      }

      // Exit fullscreen mode before navigating
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          logger.info('Exited fullscreen mode');
        }
      } catch (fullscreenError) {
        logger.warn('Could not exit fullscreen:', fullscreenError);
      }

      // Navigate to feedback page
      logger.info('✅ All steps complete! Navigating to feedback page...');
      router.push('/communication/feedback');

    } catch (error) {
      logger.error('❌ Error during final submission:', error);
      alert('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Default guidelines for situation explaining
  const guidelines = [
    'You have 60 seconds to record your response',
    'Describe the situation clearly',
    'Explain what the challenge was',
    'Describe the actions you took',
    'Explain the outcome or result',
    'Reflect on what you learned',
  ];

  return (
    <>
      {/* START MODAL */}
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 7: Describe Situation"
        subtitle="Explain the given situation clearly and comprehensively"
        questions={1}
        // duration="1 min"
        instructions={[
          'Read the situation prompt carefully',
          'Think about your response before recording',
          'Click "Start Recording" when ready',
          'Explain the situation clearly within 1 minute',
          'Click "Finish Assessment" when done',
        ]}
      />

      <div className="min-h-screen bg-gray-50 flex">
        <AssessmentSidebar currentSectionId={7} />

        <main className="flex-1 px-8 py-7 min-w-0">

          {/* Section Header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section 7 of 7</p>
            <h1 className="text-lg font-bold text-gray-900">
              {currentQuestion?.section_name || 'Describe Situation'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Explain the given situation clearly and comprehensively.
            </p>
          </div>

          <QuestionProgressBar
            currentQuestion={sectionQuestionNumber}
            totalQuestions={SECTION_TOTAL_QUESTIONS}
            className="mb-6"
          />

          {error ? (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {/* Situation Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Situation</p>
                    <span className="text-xs font-semibold text-[#2557a7] bg-[#2557a7]/8 px-2.5 py-0.5 rounded-full">
                      1 / 1
                    </span>
                  </div>

                  <p className="text-base font-medium text-gray-900 leading-relaxed mb-5">
                    {currentQuestion?.question_text ||
                      'Imagine you are at a job interview and the interviewer asks you to describe a challenging situation you faced at work or school and how you handled it.'}
                  </p>

                  <div className="bg-[#2557a7]/4 border border-[#2557a7]/15 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Response Guidelines</p>
                    <ul className="space-y-2">
                      {guidelines.map((point, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="w-4 h-4 bg-[#2557a7] text-white rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recorder Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center">
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={currentQuestion?.time_limit || 60}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUploadCurrentAudio}
                  disabled={!recordedAudio || isSubmitting}
                  className={`px-8 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                    recordedAudio && !isSubmitting
                      ? 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    'Finish Assessment →'
                  )}
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Assessment Summary Panel */}
      <AssessmentSummaryPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onFinish={handleFinalSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
