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
} from '@/api/communicationApi';
import type { CurrentQuestionResponse } from '@/api/communicationApi';
import logger from '@/lib/logger';
import { validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';

const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), { loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading...</div></div>, ssr: false });
const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });

export default function SituationExplainingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');
  const { stopRecording, isRecording: isVideoRecording } = useVideoRecording();

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

  const handleFinish = async () => {
    if (!recordedAudio) {
      alert('Please record your answer before finishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get email, test_id, and session_id from localStorage
      const emailId = localStorage.getItem('userEmail') || localStorage.getItem('user_email');
      const testId = localStorage.getItem('test_id');
      const sessionId = localStorage.getItem('session_id');

      if (!emailId || !testId || !sessionId) {
        logger.error('Missing email, test_id, or session_id');
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

      // ==================== STEP 1: Upload Audio ====================
      logger.info('📤 STEP 1: Uploading audio for final question...');

      if (recordedAudio.size === 0 || recordedAudio.size < 100) {
        const errorMsg = `Audio recording is empty or too small (${recordedAudio.size} bytes). Please record your answer again.`;
        logger.error(errorMsg);
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      try {
        const uploadResponse = await uploadAudio({
          session_id: sessionId,
          question_id: currentQuestion.question_id,
          test_id: testId,
          audio_file: recordedAudio,
          return_next_question: false,
          question_number: currentQuestion.question_number,
        });

        logger.info('✅ STEP 1 Complete: Audio uploaded successfully');

        if (!uploadResponse || !uploadResponse.success) {
          const errorMsg = `Audio upload failed. Response: ${JSON.stringify(uploadResponse)}`;
          logger.error(errorMsg);
          alert(errorMsg);
          setIsSubmitting(false);
          return;
        }
      } catch (uploadError) {
        logger.error('❌ STEP 1 Failed: Audio upload error:', uploadError);
        alert(`Failed to upload audio: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }

      // ==================== STEP 2: Complete Session ====================
      logger.info('📋 STEP 2: Completing session...');

      try {
        const completeResponse = await completeSession(sessionId);
        logger.info('✅ STEP 2 Complete: Session completed successfully:', completeResponse);
      } catch (completeError) {
        logger.error('❌ STEP 2 Failed: Complete session error:', completeError);
        // Continue anyway - session might already be complete
        logger.warn('⚠️ Continuing despite complete session error...');
      }

      // ==================== Prepare Video Blob ====================
      logger.info('🎥 Stopping video recording...');
      const videoBlob = await stopRecording();

      if (!videoBlob) {
        logger.warn('No video recording found - will skip video evaluation');
      } else {
        logger.info(`Video blob retrieved: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
      }

      // ==================== STEP 3: Parallel Evaluations ====================
      logger.info('📊 STEP 3: Running audio and video evaluations in parallel...');

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

          // Store results
          if (audioEvalResponse.evaluation) {
            localStorage.setItem('audio_evaluation', JSON.stringify(audioEvalResponse.evaluation));
          }
          if (audioEvalResponse.audio_evaluation_id) {
            localStorage.setItem('audio_evaluation_id', audioEvalResponse.audio_evaluation_id);
          }
          localStorage.setItem('audio_evaluation_response', JSON.stringify(audioEvalResponse));

          return { type: 'audio', success: true, data: audioEvalResponse };
        })
        .catch((audioError: any) => {
          logger.error('❌ Audio evaluation failed:', audioError);

          // Check for incomplete submission error
          if (audioError?.response?.data?.error === 'Incomplete submission') {
            const errorData = audioError.response.data;
            const message = `⚠️ Assessment Incomplete!\n\n` +
              `Completed: ${errorData.completed || 0}/${errorData.total_required || 44}\n` +
              `Missing: ${errorData.missing_sections?.join(', ') || 'Unknown'}`;
            throw new Error(message);
          }

          return { type: 'audio', success: false, error: audioError.message || 'Audio evaluation failed' };
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

            if (videoEvalResponse.evaluation_id) {
              localStorage.setItem('video_evaluation_id', videoEvalResponse.evaluation_id);
            }
            localStorage.setItem('video_evaluation_response', JSON.stringify(videoEvalResponse));

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
        logger.info('✅ STEP 3 Complete: All evaluations finished');

        // Check if audio evaluation failed critically
        const audioResult = results.find(r => r.type === 'audio');
        if (audioResult && !audioResult.success) {
          alert(audioResult.error || 'Audio evaluation failed');
          setIsSubmitting(false);
          return;
        }

        // Video failure is non-critical
        const videoResult = results.find(r => r.type === 'video');
        if (videoResult && !videoResult.success) {
          logger.warn('⚠️ Video evaluation failed but continuing:', videoResult.error);
        }

      } catch (evalError) {
        logger.error('❌ STEP 3 Failed: Evaluation error:', evalError);
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
      logger.error('❌ Error finishing assessment:', error);
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
        {/* LEFT SIDEBAR */}
        <AssessmentSidebar currentSectionId={7} />

        {/* MAIN CONTENT */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentQuestion?.section_name || 'Situation Explaining'}
              </h1>
              <p className="text-gray-600 text-sm">
                Explain the given situation clearly and comprehensively
              </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Final Section - Situation Explaining
                </span>
                <span className="text-sm font-semibold text-indigo-600">
                  1 Question
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left Side - Situation */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="mb-4">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                        Situation Question
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      {currentQuestion?.question_text ||
                        'Imagine you are at a job interview and the interviewer asks you to describe a challenging situation you faced at work or school and how you handled it.'}
                    </h2>

                    {/* Guidelines */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">
                        Guidelines for Your Response:
                      </h3>
                      <ul className="space-y-2">
                        {guidelines.map((point, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Time Info */}
                    {/* <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-4">
                      <p className="text-sm font-semibold text-amber-900">
                        ⏱️ You have {currentQuestion?.time_limit || 60} seconds to record your response
                      </p>
                    </div> */}

                    {/* <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
                      <p className="text-sm text-gray-700">
                        💡 Think carefully about your response before recording.
                      </p>
                    </div> */}

                    {/* Recording Status - Commented out */}
                    {/* {recordedAudio && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Recording Saved - Ready to Finish
                        </span>
                      </div>
                    )} */}
                  </div>

                  {/* Right Side - Recorder */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                      maxDuration={currentQuestion?.time_limit || 60}
                    />
                  </div>
                </div>

                {/* Finish Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleFinish}
                    disabled={!recordedAudio || isSubmitting}
                    className={`px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-2 ${
                      recordedAudio && !isSubmitting
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
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
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
