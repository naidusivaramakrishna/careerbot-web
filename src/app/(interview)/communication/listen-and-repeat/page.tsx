'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getCurrentQuestion,
  getNextQuestion,
  uploadAudio,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import logger from '@/lib/logger';
import { validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';

// ✅ Lazy load heavy components for faster initial page load
const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading recorder...</div></div>,
  ssr: false, // Disable SSR for media recorder
});

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), {
  loading: () => <div className="w-64 bg-gray-100 animate-pulse" />,
});

const TextToSpeechPlayer = dynamic(() => import('../components/TextToSpeechPlayer'), {
  loading: () => <div className="animate-pulse p-4">Loading audio...</div>,
  ssr: false,
});

const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), {
  loading: () => null,
});

export default function ListenAndRepeatPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  // recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

  // Fetch current question
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      logger.info('➡️ Now showing question:', response.question_id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSection = async () => {
    setShowModal(false);
    await fetchCurrentQuestion();
  };

  // Record audio
  const handleRecordingComplete = async (blob: Blob) => {
    if (!currentQuestion?.question_id) return;

    // ✅ Validate audio before saving
    logger.info('🔍 Validating audio recording...');
    const validation = await validateAudioBlob(blob);

    logger.info('📊 Audio validation result:', {
      isValid: validation.isValid,
      duration: formatDuration(validation.duration),
      hasSound: validation.hasSound,
      size: formatFileSize(blob.size),
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

    setAudioRecordings((prev) => ({
      ...prev,
      [currentQuestion.question_id]: blob,
    }));

    // IMPORTANT: Don't save to sessionStorage to avoid quota exceeded error
    // Real audio recordings are large (~88KB WebM) and will fill up sessionStorage quickly
    // We only need to keep in state for immediate upload via progressive API
    logger.info(`✅ Valid audio saved (${formatDuration(validation.duration)}, ${formatFileSize(blob.size)})`);
  };

  // Next question
  const handleNext = async () => {
    if (!currentQuestion?.question_id) return;

    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      const testId = localStorage.getItem('test_id');

      if (!sessionId) throw new Error('Session ID not found');
      if (!testId) throw new Error('Test ID not found');

      // Get the audio blob for current question
      const audioBlob = audioRecordings[currentQuestion.question_id];

      // ✅ Enhanced validation and logging
      if (!audioBlob) {
        const errorMsg = `❌ No audio recording found for question: ${currentQuestion.question_id}`;
        logger.error(errorMsg);
        logger.error('Available recordings:', Object.keys(audioRecordings));
        throw new Error('Please record your audio before clicking Next');
      }

      // ✅ Log audio blob details
      logger.info('🎙️ Audio blob details:', {
        question_id: currentQuestion.question_id,
        size: `${(audioBlob.size / 1024).toFixed(2)} KB`,
        type: audioBlob.type,
      });

      // ✅ Upload audio with return_next_question=true
      logger.info('📤 Uploading audio with return_next_question=true for question:', currentQuestion.question_id);

      const uploadResponse = await uploadAudio({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        test_id: testId,
        audio_file: audioBlob,
        return_next_question: true, // ✅ Request next question in response
        question_number: currentQuestion.question_number, // ✅ Global question number
      });

      logger.info('✅ Audio uploaded successfully:', uploadResponse);
      logger.info(`✅ Upload confirmed for ${currentQuestion.question_id} - Size: ${(audioBlob.size / 1024).toFixed(2)} KB`);

      // ✅ Check if next question was included in upload response
      if (uploadResponse.next_question) {
        logger.info('📬 Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        // Check if section changed to next section
        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);
          router.push('/communication/jumbled-sentences');
          return;
        }

        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'VOICE',
          section_name: nextQuestion.section_name,
          section_id: undefined,
          question_number: currentQuestion.question_number ? currentQuestion.question_number + 1 : 1,
          total_questions: uploadResponse.next_question.section.total_questions,
          options: nextQuestion.options,
          audio_url: nextQuestion.audio_url,
          time_limit: nextQuestion.time_limit,
          is_last_question: nextQuestion.is_last_question,
          is_last_section: nextQuestion.is_last_section,
          story_text: nextQuestion.story_text,
          expected_text: nextQuestion.expected_text,
        });
      } else {
        // Fallback: If next_question not in response, fetch it separately
        logger.warn('⚠️ Next question not in upload response, fetching separately...');
        const response = await getNextQuestion({
          session_id: sessionId,
          question_id: currentQuestion.question_id,
        });

        if (response.completed) {
          router.push('/communication/feedback');
          return;
        }

        // Check if section changed to next section
        if (response.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
          router.push('/communication/jumbled-sentences');
          return;
        }

        setCurrentQuestion(response);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload audio or fetch next question';
      logger.error('❌ Error in handleSubmit:', errorMessage);
      logger.error('❌ Full error:', err);

      // ✅ Show error to user
      setError(errorMessage);
      alert(`⚠️ Upload Failed!\n\n${errorMessage}\n\nPlease try recording again.`);
    } finally {
      setLoading(false);
    }
  };

  const hasRecording =
    currentQuestion?.question_id &&
    audioRecordings[currentQuestion.question_id];

  return (
    <>
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 2: Listen and Repeat"
        subtitle="Listen carefully and repeat what you hear"
        questions={8}
        instructions={[
          'Click "Play Audio" button to listen to the question',
          'You can play the audio ONLY ONCE - listen carefully!',
          'You CANNOT replay the audio after playing it once',
          'Click "Start Recording" when ready to record your answer',
          'You have 15 seconds for each recording',
        ]}
      />

      <div className="min-h-screen bg-[#F4F6FB] flex">
        <AssessmentSidebar currentSectionId={2} />

        <main className="flex-1 px-8 py-6">
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-lg text-black font-semibold">
                  {currentQuestion?.section_name || 'Listen and Repeat'}
                </h1>
                <p className="text-sm text-gray-500">
                  Listen carefully and repeat what you hear
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {currentQuestion?.question_number} of{' '}
                {currentQuestion?.total_questions} Questions
              </p>
            </div>

            <div className="w-full bg-gray-200 h-1 rounded-full">
              <div
                className="bg-green-500 h-1 rounded-full transition-all"
                style={{
                  width: `${
                    ((currentQuestion?.question_number || 1) /
                      (currentQuestion?.total_questions || 1)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <>
                  <div className="mb-6">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                      Question {currentQuestion?.question_number}
                    </span>
                  </div>

                  {currentQuestion?.question_text && (
                    <TextToSpeechPlayer
                      text={currentQuestion.question_text}
                      autoPlay={true}
                    />
                  )}

                  {/* Show validation warning if exists */}
                  {validationWarning && hasRecording && (
                    <div className="mt-6 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800">
                        {validationWarning}
                      </span>
                    </div>
                  )}

                  {/* Show success indicator when valid recording exists */}
                  {hasRecording && !validationWarning && (
                    <div className="mt-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
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
                        Valid Recording Saved
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                maxDuration={15}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Question {currentQuestion?.question_number} of{' '}
              {currentQuestion?.total_questions}
            </p>

            <button
              onClick={handleNext}
              disabled={!hasRecording || loading}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                hasRecording && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next Question →
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
