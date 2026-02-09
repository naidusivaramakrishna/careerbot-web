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

const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), { loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading...</div></div>, ssr: false });
const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });
const TextToSpeechPlayer = dynamic(() => import('../components/TextToSpeechPlayer'), { loading: () => <div className="animate-pulse p-4">Loading...</div>, ssr: false });

export default function ListenAndCorrectPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  // ✅ Track section-specific question number for display only (1-8 for "Listen and Correct")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8; // Total questions in this section

  // recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

  // Fetch current question from API
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      logger.info('➡️ Listen and Correct - Now showing question:', response.question_id);
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
      if (!audioBlob) throw new Error('No audio recording found');

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
          logger.info('🚀 Routing to next section page');
          router.push('/communication/story-listen-facts');
          return;
        }

        logger.info('➡️ Staying in Listen and Correct section, showing next question');
        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'VOICE',
          section_name: nextQuestion.section_name,
          section_id: undefined,
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

        logger.info('🔍 [Listen and Correct] Next question response:', {
          completed: response.completed,
          section_name: response.section_name,
          question_id: response.question_id,
          question_number: response.question_number,
          total_questions: response.total_questions,
        });

        if (response.completed) {
          logger.info('✅ Assessment completed, routing to feedback');
          router.push('/communication/feedback');
          return;
        }

        // Check if section changed to next section
        if (response.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
          logger.info('🚀 Routing to next section page');
          router.push('/communication/story-listen-facts');
          return;
        }

        logger.info('➡️ Staying in Listen and Correct section, showing next question');
        setCurrentQuestion(response);

        // ✅ Increment section-specific question number for display
        setSectionQuestionNumber((prev) => prev + 1);
      }
    } catch (err: any) {
      logger.error('❌ Error uploading audio or fetching next question:', err);
      setError(err.message || 'Failed to upload audio or fetch next question');
    } finally {
      setLoading(false);
    }
  };

  const hasRecording =
    currentQuestion?.question_id &&
    audioRecordings[currentQuestion.question_id];

  return (
    <>
    {/* 🔔 START MODAL */}
          <SectionStartModal
            open={showModal}
            onStart={handleStartSection}
            title="Section 5: Listen and Correct"
            subtitle="Listen to sentences with errors and record the corrected versions"
            questions={8}
            instructions={[
              'Click "Play Audio" button to listen to the question',
              'You can play the audio ONLY ONCE - listen carefully!',
              'The sentence contains a grammatical error',
              'Click "Start Recording" when ready to record the corrected sentence',
              'You have 15 seconds for each recording',
            ]}
          />
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* LEFT SIDEBAR */}
      <AssessmentSidebar currentSectionId={5}/>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-8 py-6">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentQuestion?.section_name || 'Listen and Correct'}
            </h1>
            <p className="text-sm text-gray-500">
              Listen to audio contains an error.
            </p>
          </div>

          {/* PROGRESS */}
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-600">
                  {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS} Questions
                </p>
              </div>
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

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT CARD */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <>
                  <div className="mb-6">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                      Question {sectionQuestionNumber}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-6">
                    Listen carefully. The sentence contains a mistake. Record the corrected version.
                  </p>

                  {currentQuestion?.question_text && (
                    <TextToSpeechPlayer
                      text={currentQuestion.question_text}
                      autoPlay={false}
                    />
                  )}

                  {/* AI TIP */}
                  {/* <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <p className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-600">💡</span>
                      <span>
                        AI Tip: Listen carefully for grammatical errors. Common mistakes include subject-verb agreement and tense usage.
                      </span>
                    </p>
                  </div> */}

                  {/* {hasRecording && (
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
                        Recording Saved
                      </span>
                    </div>
                  )} */}
                </>
              )}
            </div>

            {/* RIGHT SIDE - AUDIO RECORDER */}
            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                onRecordingComplete={handleRecordingComplete}
                maxDuration={15}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-8">
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
        </div>
      </main>
    </div>
    </>
  );
}
