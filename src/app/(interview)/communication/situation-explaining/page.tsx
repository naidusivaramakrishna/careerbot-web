'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '../components/AudioRecorder';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
// import { submitVideoEvaluation, getCurrentQuestion, getNextQuestion, submitAudioToText } from '@/api/communicationApi';
// import type { CurrentQuestionResponse } from '@/api/communicationApi';
// import { getAllAudioRecordings, base64ToBlob, blobToFile, saveAudioRecording } from '@/utils/audioUtils';
import {
  submitVideoEvaluation,
  getCurrentQuestion,
  getNextQuestion,
  uploadAudio,
  // OLD: submitAudioToText - no longer used for batch upload
  evaluateAudio,  // NEW: Use cached transcripts for evaluation
} from '@/api/communicationApi';
import type { CurrentQuestionResponse } from '@/api/communicationApi';

export default function SituationExplainingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { stopRecording, isRecording: isVideoRecording } = useVideoRecording();

  // Fetch current question from API
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      console.log('✅ Situation Explaining - Loaded question:', response.question_id);
      console.log('📍 Question text:', response.question_text);
    } catch (err) {
      console.error('❌ Failed to fetch question:', err);
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
    setRecordedAudio(audioBlob);
    console.log('✅ Recording completed for situation explaining');

    // IMPORTANT: Don't save to sessionStorage to avoid quota exceeded error
    // Real audio recordings are large (~88KB WebM) and will fill up sessionStorage quickly
    // We only need to keep in state for immediate upload via progressive API
    console.log('✅ Audio blob saved to state (skipping sessionStorage to avoid quota issues)');
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
        console.error('❌ Missing email, test_id, or session_id');
        alert('Missing required information. Please start the assessment again.');
        setIsSubmitting(false);
        return;
      }

      // ✅ STEP 1: Upload audio first via progressive upload API
      if (currentQuestion?.question_id && recordedAudio) {
        console.log('📤 Uploading situation explaining audio via progressive API...');
        console.log('📊 Audio blob details:', {
          hasBlob: !!recordedAudio,
          size: `${(recordedAudio.size / 1024).toFixed(2)} KB`,
          type: recordedAudio.type,
        });

        if (recordedAudio.size === 0 || recordedAudio.size < 100) {
          const errorMsg = `Audio recording is empty or too small (${recordedAudio.size} bytes). Please record your answer again.`;
          console.error('❌', errorMsg);
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
          });
          console.log('✅ Audio uploaded successfully for', currentQuestion.question_id, ':', uploadResponse);

          // Verify upload was successful - backend returns success:true and status:"completed"
          if (!uploadResponse || !uploadResponse.success) {
            const errorMsg = `Audio upload failed for question ${currentQuestion.question_id}. Response: ${JSON.stringify(uploadResponse)}`;
            console.error('❌', errorMsg);
            alert(errorMsg);
            setIsSubmitting(false);
            return;
          }
        } catch (uploadError) {
          console.error('❌ Audio upload failed:', uploadError);
          alert(`Failed to upload audio: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setIsSubmitting(false);
          return; // Don't continue if upload failed
        }
      } else {
        console.error('❌ Missing question_id or recordedAudio');
        alert('Cannot submit: Missing audio recording or question information.');
        setIsSubmitting(false);
        return;
      }

      // Stop video recording
      console.log('🛑 Attempting to stop video recording...');
      console.log('📊 Video recording status before stop:', {
        isVideoRecording,
        hasStopFunction: !!stopRecording,
      });

      const videoBlob = await stopRecording();

      if (!videoBlob) {
        console.warn('⚠️ No video recording found - continuing without video');
        console.warn('💡 This may happen if video recording was never started or failed silently');
      } else {
        console.log('✅ Video blob retrieved successfully:', videoBlob.size, 'bytes');
      }

      // Audio already uploaded via progressive API in STEP 1 above
      // No need to save to sessionStorage (would cause quota exceeded error)

      // ==================== AUDIO EVALUATION ====================
      // Audio was uploaded progressively during test, now just evaluate from cached transcripts
      console.log('📊 Evaluating audio from cached transcripts...');

      try {
        // Call the audio evaluate endpoint with session_id, email_id, test_id
        const audioEvalResponse = await evaluateAudio({
          session_id: sessionId,
          email_id: emailId,
          test_id: testId,
        });

        console.log('✅ Audio evaluation response:', audioEvalResponse);

        if (audioEvalResponse.status === 'insufficient') {
          // Not enough recordings - show error
          const missing = audioEvalResponse.missing_sections?.length || 0;
          console.error(`❌ Insufficient recordings: ${missing} missing`);
          alert(`Missing ${missing} audio recordings. Please go back and complete all sections.`);
          setIsSubmitting(false);
          return;
        }

        if (audioEvalResponse.status === 'partial') {
          // Some missing but enough to continue
          console.warn(`⚠️ Partial evaluation: ${audioEvalResponse.missing_sections?.length || 0} missing`);
        }

        // Store evaluation result
        if (audioEvalResponse.evaluation) {
          localStorage.setItem('audio_evaluation', JSON.stringify(audioEvalResponse.evaluation));
        }

      } catch (audioError) {
        console.error('❌ Audio evaluation failed:', audioError);
        // Continue with flow - evaluation might still work from video
      }

      // Submit video evaluation if we have a video blob
      if (videoBlob && videoBlob.size > 0) {
        console.log('📤 Submitting video for evaluation...');
        console.log('📊 Video blob details:', {
          size: videoBlob.size,
          type: videoBlob.type,
        });

        try {
          const videoEvalResponse = await submitVideoEvaluation({
            email_id: emailId,
            test_id: testId,
            file: videoBlob,
          });
          console.log('✅ Video evaluation submitted successfully');

          // Store video_evaluation_id for final report
          if (videoEvalResponse.evaluation_id) {
            localStorage.setItem('video_evaluation_id', videoEvalResponse.evaluation_id);
          }
        } catch (videoSubmitError) {
          console.error('❌ Video submission failed:', videoSubmitError);
          console.warn('⚠️ Continuing without video evaluation - audio evaluation is sufficient');
          // Don't throw - allow assessment to complete without video
        }
      } else {
        console.warn('⚠️ Skipping video evaluation - no valid video blob available');
        console.info('ℹ️ Assessment will complete with audio evaluation only');
      }

      // Call next question API to mark section complete
      if (currentQuestion?.question_id) {
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
          const response = await getNextQuestion({
            session_id: sessionId,
            question_id: currentQuestion.question_id,
          });
          console.log('✅ Section completed, response:', response);
        }
      }

      // Exit fullscreen mode before navigating
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          console.log('✅ Exited fullscreen mode');
        }
      } catch (fullscreenError) {
        console.warn('⚠️ Could not exit fullscreen:', fullscreenError);
      }

      // Navigate to feedback page
      router.push('/communication/feedback');
    } catch (error) {
      console.error('❌ Error finishing assessment:', error);
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
        title="Section 7: Situation Explaining"
        subtitle="Explain the given situation clearly and comprehensively"
        questions={1}
        duration="1 min"
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

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading question...</p>
              </div>
            ) : error ? (
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

                    {/* Recording Status */}
                    {recordedAudio && (
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
                    )}
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
