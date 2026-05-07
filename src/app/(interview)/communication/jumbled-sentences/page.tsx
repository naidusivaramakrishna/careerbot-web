'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveTextAnswer } from '@/utils/audioUtils';
import logger from '@/lib/logger';

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), {
  loading: () => <div className="w-65 bg-white border-r border-gray-200 shrink-0 animate-pulse" />,
});
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), {
  loading: () => null,
});
const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), {
  loading: () => <div className="h-14 bg-white rounded-xl border border-gray-200 mb-6 animate-pulse" />,
});

export default function JumbledSentencesPage() {
  const sectionName = 'Jumbled Sentences';
  const sectionDescription = 'Arrange the words in the correct order to form a meaningful sentence';
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSaved, setAnswerSaved] = useState(false);

  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8;

  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');
    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');
      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      setSelectedAnswer(null);
      setAnswerSaved(false);
      logger.info('➡️ Jumbled Sentences - Now showing question:', response.question_id);
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

  const questionWords = currentQuestion?.question_text
    ? typeof currentQuestion.question_text === 'string'
      ? JSON.parse(currentQuestion.question_text)
      : currentQuestion.question_text
    : [];

  const backendOptions = currentQuestion?.options || [];

  const handleOptionSelect = (optionOrdering: string) => {
    if (!currentQuestion?.question_id || answerSaved) return;
    setSelectedAnswer(optionOrdering);
    saveTextAnswer(currentQuestion.question_id, optionOrdering);
    logger.info('✅ Selected ordering:', optionOrdering);
    setAnswerSaved(true);
  };

  const handleNext = async () => {
    if (!currentQuestion?.question_id) return;
    setLoading(true);
    setError('');
    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      if (currentQuestion.question_number) {
        sessionStorage.setItem(`q_${currentQuestion.question_number}_completed`, 'true');
        logger.info(`✅ Marked question ${currentQuestion.question_number} as completed`);
      }

      logger.info('📬 Fetching next question for:', currentQuestion.question_id);
      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      logger.info('🔍 [Jumbled Sentences] Next question response:', {
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

      if (response.section_name !== currentQuestion.section_name) {
        logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
        router.push('/communication/sentence-completion');
        return;
      }

      logger.info('➡️ Staying in Jumbled Sentence section, showing next question');
      setCurrentQuestion({
        ...response,
        question_number: currentQuestion.question_number ? currentQuestion.question_number + 1 : response.question_number,
      });
      setSelectedAnswer(null);
      setAnswerSaved(false);
      setSectionQuestionNumber((prev) => prev + 1);
      setLoading(false);
    } catch (err: unknown) {
      logger.error('❌ Error fetching next question:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch next question');
      setLoading(false);
    }
  };

  return (
    <>
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 3: Jumbled Sentences"
        subtitle="Arrange the words in the correct order to form meaningful sentences"
        questions={8}
        instructions={[
          'Read the numbered words carefully',
          'Select the correct word order from the options provided',
          'Click "Next" to proceed to the next question',
        ]}
      />

      <div className="min-h-screen bg-gray-50 flex">
        <AssessmentSidebar currentSectionId={3} />

        <main className="flex-1 px-8 py-7 min-w-0">

          {/* Section Header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section 3 of 7</p>
            <h1 className="text-lg font-bold text-gray-900">{sectionName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sectionDescription}</p>
          </div>

          {/* Progress Bar */}
          <QuestionProgressBar
            currentQuestion={sectionQuestionNumber}
            totalQuestions={SECTION_TOTAL_QUESTIONS}
            className="mb-6"
          />

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

            {/* Left — Words display */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Words</p>
                <span className="text-xs font-semibold text-[#2557a7] bg-[#2557a7]/8 px-2.5 py-0.5 rounded-full">
                  {sectionQuestionNumber} / {SECTION_TOTAL_QUESTIONS}
                </span>
              </div>

              {error ? (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              ) : currentQuestion ? (
                <>
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    Arrange the words in the correct order:
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-wrap gap-2.5">
                      {questionWords.map((word: string, index: number) => (
                        <div
                          key={index}
                          className="bg-white border border-[#2557a7]/20 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#2557a7] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-gray-900 font-semibold text-sm">{word}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 px-4 py-3 bg-[#2557a7]/5 border-l-4 border-[#2557a7] rounded-r-xl">
                    <p className="text-xs text-gray-600">
                      Select the correct order from the options on the right.
                    </p>
                  </div>

                  {answerSaved && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Answer selected</span>
                    </div>
                  )}
                </>
              ) : loading ? (
                <div className="space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                </div>
              ) : null}
            </div>

            {/* Right — Options */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Select the Correct Order</p>

              {backendOptions.length > 0 ? (
                <div className="space-y-2.5">
                  {backendOptions.map((optionOrdering: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      disabled={answerSaved}
                      onClick={() => handleOptionSelect(optionOrdering)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        answerSaved ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        selectedAnswer === optionOrdering
                          ? 'border-[#2557a7] bg-[#2557a7]/5'
                          : answerSaved
                            ? 'border-gray-100 bg-gray-50 opacity-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Letter badge */}
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                          selectedAnswer === optionOrdering
                            ? 'border-[#2557a7] bg-[#2557a7] text-white'
                            : 'border-gray-300 text-gray-500'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>

                      {/* Option text */}
                      <span className="flex-1 text-sm font-medium text-gray-900 font-mono">
                        {optionOrdering}
                      </span>

                      {/* Selected checkmark */}
                      {selectedAnswer === optionOrdering && (
                        <svg className="w-4 h-4 text-[#2557a7] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
            </p>
            <button
              onClick={handleNext}
              disabled={!answerSaved || loading}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                answerSaved && !loading
                  ? 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Loading…' : 'Next Question →'}
            </button>
          </div>

        </main>
      </div>
    </>
  );
}
