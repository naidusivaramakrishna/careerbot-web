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
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="w-5 h-5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), {
  loading: () => <div className="w-65 bg-white border-r border-gray-200 shrink-0 animate-pulse" />,
});

const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), {
  loading: () => null,
});

const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), {
  loading: () => <div className="h-14 bg-white rounded-xl border border-gray-200 mb-6 animate-pulse" />,
});

export default function AssessmentMain() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setValidationWarning] = useState('');

  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8;

  const [audioRecordings, setAudioRecordings] = useState<{ [questionId: string]: Blob }>({});

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
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch question');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSection = async () => {
    setShowModal(false);
    setSectionQuestionNumber(1);
    await fetchCurrentQuestion();
  };

  // ================= RECORD AUDIO =================
  const handleRecordingComplete = async (blob: Blob) => {
    if (!currentQuestion?.question_id) return;

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

    if (!validation.isValid) {
      setError(validation.error || 'Invalid audio recording');
      setValidationWarning('');
      alert(`⚠️ Invalid Recording!\n\n${validation.error}\n\nPlease record again.`);
      return;
    }

    if (validation.warning) {
      setValidationWarning(validation.warning);
      logger.warn('⚠️', validation.warning);
    } else {
      setValidationWarning('');
    }

    setError('');
    setAudioRecordings((prev) => ({
      ...prev,
      [currentQuestion.question_id]: blob,
    }));

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

      logger.info('🔍 ===== Preparing to upload audio =====');
      logger.info('  📋 session_id:', sessionId || 'MISSING');
      logger.info('  📋 test_id:', testId || 'MISSING');
      logger.info('  📋 question_id:', currentQuestion.question_id);
      logger.info('  📋 question_number:', currentQuestion.question_number || 'MISSING');

      if (!sessionId) throw new Error('Session ID not found. Please restart the assessment.');
      if (!testId) throw new Error('Test ID not found. Please restart the assessment.');

      const audioBlob = audioRecordings[currentQuestion.question_id];

      if (!audioBlob) {
        logger.error('❌ No audio recording found for question:', currentQuestion.question_id);
        throw new Error('No audio recording found. Please record your answer first.');
      }

      logger.info('  📋 audio_file size:', `${(audioBlob.size / 1024).toFixed(2)} KB`);
      logger.info('  📋 audio_file type:', audioBlob.type);
      logger.info('🔍 ===== All parameters validated, calling API =====');

      const uploadResponse = await uploadAudio({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        test_id: testId,
        audio_file: audioBlob,
        return_next_question: true,
        question_number: currentQuestion.question_number,
      });
      logger.info('✅ Audio uploaded successfully:', uploadResponse);

      if (currentQuestion.question_number) {
        sessionStorage.setItem(`q_${currentQuestion.question_number}_completed`, 'true');
        logger.info(`✅ Marked question ${currentQuestion.question_number} as completed`);
      }

      if (uploadResponse.next_question) {
        logger.info('📬 Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);
          router.push('/communication/listen-and-repeat');
          return;
        }

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

        setSectionQuestionNumber((prev) => prev + 1);
      } else {
        logger.warn('⚠️ Next question not in upload response, fetching separately...');
        const response = await getNextQuestion({
          session_id: sessionId,
          question_id: currentQuestion.question_id,
        });

        if (response.completed) {
          router.push('/communication/feedback');
          return;
        }

        if (response.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
          router.push('/communication/listen-and-repeat');
          return;
        }

        setCurrentQuestion(response);
        setSectionQuestionNumber((prev) => prev + 1);
      }
      setLoading(false);
    } catch (err) {
      logger.error('❌ Error in handleNext:', err);
      const error = err as { message?: string; response?: { data?: { message?: string; error?: string }; status?: number } };

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to upload audio or fetch next question';

      setError(errorMessage);
      logger.error('❌ Showing error to user:', errorMessage);
      setLoading(false);
    }
  };

  const hasRecording =
    currentQuestion?.question_id && audioRecordings[currentQuestion.question_id];

  return (
    <>
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 1: See and Repeat"
        subtitle="Read the sentence and pronounce the highlighted word clearly"
        questions={8}
        instructions={[
          'Read the full sentence displayed on screen',
          'Focus on the highlighted word',
          'Click "Start Recording" when ready',
          'Pronounce the highlighted word clearly',
          'You have 15 seconds for each recording',
        ]}
      />

      <div className="min-h-screen bg-gray-50 flex">
        <AssessmentSidebar currentSectionId={1} />

        <main className="flex-1 px-8 py-7 min-w-0">

          {/* Section Header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section 1 of 7</p>
            <h1 className="text-lg font-bold text-gray-900">
              {currentQuestion?.section_name || 'See & Repeat'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Read the sentence and pronounce the highlighted word clearly.
            </p>
          </div>

          {/* Progress Bar */}
          <QuestionProgressBar
            currentQuestion={sectionQuestionNumber}
            totalQuestions={SECTION_TOTAL_QUESTIONS}
            className="mb-6"
          />

          {/* Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Question Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question</p>
                <span className="text-xs font-semibold text-[#2557a7] bg-[#2557a7]/8 px-2.5 py-0.5 rounded-full">
                  {sectionQuestionNumber} / {SECTION_TOTAL_QUESTIONS}
                </span>
              </div>

              {loading && !currentQuestion ? (
                <div className="space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ) : error ? (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <p className="text-base text-gray-900 leading-relaxed font-medium">
                  {currentQuestion?.question_text}
                </p>
              )}
            </div>

            {/* Recorder Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                maxDuration={15}
                onRecordingComplete={handleRecordingComplete}
                disabled={!!hasRecording}
              />
            </div>
          </div>

          {/* Footer: nav */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-gray-400">
              Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
            </p>

            <button
              onClick={handleNext}
              disabled={!hasRecording || loading}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                hasRecording && !loading
                  ? 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Uploading…' : 'Next Question →'}
            </button>
          </div>

        </main>
      </div>
    </>
  );
}
