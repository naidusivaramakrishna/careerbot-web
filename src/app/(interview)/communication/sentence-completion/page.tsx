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

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });
const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), { loading: () => <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200 h-20 animate-pulse" /> });

export default function SentenceCompletionPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSaved, setAnswerSaved] = useState(false);

  // ✅ Track section-specific question number for display only (1-8 for "Sentence Completion")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8; // Total questions in this section

  // Fetch current question from API
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
      logger.info('➡️ Sentence Completion - Now showing question:', response.question_id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch question');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSection = async () => {
    setShowModal(false);
    setSectionQuestionNumber(1); // ✅ Start at question 1 for this section
    await fetchCurrentQuestion();
  };

  // Get options from backend
  const options = currentQuestion?.options || [];

  const handleSelect = (optionText: string) => {
    if (!currentQuestion?.question_id) return;
    if (answerSaved) return; // Prevent re-selection after answer is saved

    setSelectedAnswer(optionText);

    // Save the selected option directly to sessionStorage
    saveTextAnswer(currentQuestion.question_id, optionText);

    logger.info('✅ Selected answer:', optionText);
    logger.info('✅ Saved answer as-is');

    // Mark as saved immediately
    setAnswerSaved(true);
  };

  const handleNext = async () => {
    if (!currentQuestion?.question_id) return;

    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');

      if (!sessionId) throw new Error('Session ID not found');

      // ✅ Mark question as completed in sessionStorage for Assessment Summary Panel
      if (currentQuestion.question_number) {
        sessionStorage.setItem(`q_${currentQuestion.question_number}_completed`, 'true');
        logger.info(`✅ Marked question ${currentQuestion.question_number} as completed`);
      }

      // Fetch next question directly (no audio upload for sentence completion)
      logger.info('📬 Fetching next question for:', currentQuestion.question_id);
      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      logger.info('🔍 [Sentence Completion] Next question response:', {
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

      // Check if section changed to next section (Listen and Correct)
      if (response.section_name !== currentQuestion.section_name) {
        logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
        logger.info('🚀 Routing to listen-and-correct page');
        router.push('/communication/listen-and-correct');
        return;
      }

      logger.info('➡️ Staying in Sentence Completion section, showing next question');
      setCurrentQuestion({
        ...response,
        question_number: currentQuestion.question_number ? currentQuestion.question_number + 1 : response.question_number,
      });
      setSelectedAnswer(null);
      setAnswerSaved(false);
      setSectionQuestionNumber((prev) => prev + 1);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch next question');
      logger.error('❌ Error fetching next question:', err);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔔 START MODAL */}
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 4: Sentence Completion"
        subtitle="Select the correct word to complete each sentence"
        questions={8}
        instructions={[
          'Read the sentence with the blank (____)',
          'Options will be shown below',
          'Select the word that best completes the sentence',
          'Click "Next Question" to continue',
        ]}
      />

      <div className="min-h-screen bg-gray-50 flex">
        <AssessmentSidebar currentSectionId={4} />

        <main className="flex-1 px-8 py-7 min-w-0">

          {/* Section Header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section 4 of 7</p>
            <h1 className="text-lg font-bold text-gray-900">
              {currentQuestion?.section_name || 'Sentence Completion'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Select the most appropriate word to complete the sentence.
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
          ) : currentQuestion ? (
            <>
              <div className="max-w-3xl">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                  {/* Sentence display */}
                  <div className="px-7 pt-7 pb-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sentence</p>
                      <span className="text-xs font-semibold text-[#2557a7] bg-[#2557a7]/8 px-2.5 py-0.5 rounded-full">
                        {sectionQuestionNumber} / {SECTION_TOTAL_QUESTIONS}
                      </span>
                    </div>

                    <div className="bg-[#2557a7]/4 border border-[#2557a7]/15 rounded-xl px-5 py-4 mb-5">
                      <p className="text-xl font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.question_text}
                      </p>
                    </div>

                    {answerSaved && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl mb-5">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">Answer selected and saved</span>
                      </div>
                    )}

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select the correct word</p>

                    <div className="space-y-2.5">
                      {options && options.length > 0 ? (
                        options.map((option: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => !answerSaved && handleSelect(option)}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                              answerSaved ? 'cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              selectedAnswer === option
                                ? 'border-[#2557a7] bg-[#2557a7]/5'
                                : 'border-gray-200 hover:border-[#2557a7]/40 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold w-6 h-6 rounded-md flex items-center justify-center ${
                                selectedAnswer === option ? 'bg-[#2557a7] text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-base text-gray-800">{option}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedAnswer === option ? 'border-[#2557a7] bg-[#2557a7]' : 'border-gray-300'
                            }`}>
                              {selectedAnswer === option && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-6">No options available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 max-w-3xl">
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
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
