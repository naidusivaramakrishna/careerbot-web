'use client';

import { useState } from 'react';
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

// ✅ Lazy load heavy components for faster route transitions
const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading...</div></div>,
  ssr: false,
});

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), {
  loading: () => <div className="w-64 bg-gray-100 animate-pulse" />,
});

const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), {
  loading: () => null,
});

export default function AssessmentMain() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  // ✅ Track section-specific question number for display only (1-8 for "See and Repeat")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8; // Total questions in this section

  // ✅ recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

  // ================= FIRST QUESTION =================
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
    setSectionQuestionNumber(1); // ✅ Start at question 1 for this section
    await fetchCurrentQuestion();
  };

  // ================= RECORD AUDIO =================
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

  // ================= NEXT QUESTION =================
  const handleNext = async () => {
    if (!currentQuestion?.question_id) {
      logger.warn('⚠️ No current question, cannot proceed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      const testId = localStorage.getItem('test_id');

      // ✅ Log all parameters before calling API
      logger.info('🔍 ===== Preparing to upload audio =====');
      logger.info('  📋 session_id:', sessionId || 'MISSING');
      logger.info('  📋 test_id:', testId || 'MISSING');
      logger.info('  📋 question_id:', currentQuestion.question_id);
      logger.info('  📋 question_number:', currentQuestion.question_number || 'MISSING');

      if (!sessionId) {
        logger.error('❌ Session ID not found in localStorage');
        throw new Error('Session ID not found. Please restart the assessment.');
      }
      if (!testId) {
        logger.error('❌ Test ID not found in localStorage');
        throw new Error('Test ID not found. Please restart the assessment.');
      }

      // Get the audio blob for current question
      const audioBlob = audioRecordings[currentQuestion.question_id];

      if (!audioBlob) {
        logger.error('❌ No audio recording found for question:', currentQuestion.question_id);
        logger.error('  📋 Available recordings:', Object.keys(audioRecordings));
        throw new Error('No audio recording found. Please record your answer first.');
      }

      logger.info('  📋 audio_file size:', `${(audioBlob.size / 1024).toFixed(2)} KB`);
      logger.info('  📋 audio_file type:', audioBlob.type);
      logger.info('  📋 return_next_question: true');
      logger.info('🔍 ===== All parameters validated, calling API =====');

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

      // ✅ Mark question as completed in sessionStorage for Assessment Summary Panel
      if (currentQuestion.question_number) {
        sessionStorage.setItem(`q_${currentQuestion.question_number}_completed`, 'true');
        logger.info(`✅ Marked question ${currentQuestion.question_number} as completed`);
      }

      // ✅ Check if next question was included in upload response
      if (uploadResponse.next_question) {
        logger.info('📬 Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        // Check if section changed to next section
        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);
          router.push('/communication/listen-and-repeat');
          return;
        }

        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'VOICE',
          section_name: nextQuestion.section_name,
          section_id: undefined, // Backend returns string, frontend expects number - omit for now
          question_number: currentQuestion.question_number ? currentQuestion.question_number + 1 : 1, // ✅ Keep global for backend
          total_questions: uploadResponse.next_question.section.total_questions,
          options: nextQuestion.options,
          audio_url: nextQuestion.audio_url,
          time_limit: nextQuestion.time_limit,
          is_last_question: nextQuestion.is_last_question,
          is_last_section: nextQuestion.is_last_section,
          story_text: nextQuestion.story_text,
          expected_text: nextQuestion.expected_text,
        });

        // ✅ Increment section-specific question number for display
        setSectionQuestionNumber((prev) => prev + 1);
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
          router.push('/communication/listen-and-repeat');
          return;
        }

        setCurrentQuestion(response);

        // ✅ Increment section-specific question number for display
        setSectionQuestionNumber((prev) => prev + 1);
      }
    } catch (err: any) {
      logger.error('❌ Error in handleNext:', err);
      logger.error('  Error message:', err.message);
      logger.error('  Error response:', err.response);
      logger.error('  Error response data:', err.response?.data);
      logger.error('  Error response status:', err.response?.status);

      // Show detailed error message from backend if available
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Failed to upload audio or fetch next question';

      setError(errorMessage);
      logger.error('❌ Showing error to user:', errorMessage);
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
        title="Section 1: See and Repeat"
        subtitle="Read the sentences and pronounce the highlighted word clearly"
        questions={8}
        instructions={[
          'Read the sentence displayed on screen',
          'Focus on the highlighted word',
          'Click "Start Recording" when ready',
          'Pronounce the highlighted word clearly',
          'You have 15 seconds for each recording',
        ]}
      />

      <div className="min-h-screen bg-[#F4F6FB] flex">
        <AssessmentSidebar currentSectionId={1} />

        <main className="flex-1 px-8 py-6">
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-lg text-black font-semibold">
                  {currentQuestion?.section_name}
                </h1>
                <p className="text-sm text-gray-500">
                  Read the sentence and pronounce the highlighted word clearly.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS} Questions
              </p>
            </div>

            <div className="w-full bg-gray-200 h-1 rounded-full">
              <div
                className="bg-green-500 h-1 rounded-full transition-all"
                style={{
                  width: `${(sectionQuestionNumber / SECTION_TOTAL_QUESTIONS) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <p className="text-lg text-black">{currentQuestion?.question_text}</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                maxDuration={15}
                onRecordingComplete={handleRecordingComplete}
              />
              {/* {hasRecording && (
                <p className="text-green-600 text-sm mt-3">
                  ✔ Recording saved
                </p>
              )} */}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
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




