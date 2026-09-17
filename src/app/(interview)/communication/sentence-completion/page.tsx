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

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="hidden h-full w-56 shrink-0 bg-gray-100 animate-pulse lg:block xl:w-60" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });
const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), { loading: () => <div className="mb-3 h-12 shrink-0 rounded-xl border border-gray-200 bg-white animate-pulse" /> });

export default function SentenceCompletionPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSaved, setAnswerSaved] = useState(false);

  //  Track section-specific question number for display only (1-8 for "Sentence Completion")
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
      logger.info(' Sentence Completion - Now showing question:', response.question_id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch question');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSection = async () => {
    setShowModal(false);
    setSectionQuestionNumber(1); //  Start at question 1 for this section
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

    logger.info(' Selected answer:', optionText);
    logger.info(' Saved answer as-is');

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

      //  Mark question as completed in sessionStorage for Assessment Summary Panel
      if (currentQuestion.question_number) {
        sessionStorage.setItem(`q_${currentQuestion.question_number}_completed`, 'true');
        logger.info(` Marked question ${currentQuestion.question_number} as completed`);
      }

      // Fetch next question directly (no audio upload for sentence completion)
      logger.info('Fetching next question for:', currentQuestion.question_id);
      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      logger.info(' [Sentence Completion] Next question response:', {
        completed: response.completed,
        section_name: response.section_name,
        question_id: response.question_id,
        question_number: response.question_number,
        total_questions: response.total_questions,
      });

      if (response.completed) {
        logger.info(' Assessment completed, routing to feedback');
        router.push('/communication/feedback');
        return;
      }

      // Check if section changed to next section (Listen and Correct)
      if (response.section_name !== currentQuestion.section_name) {
        logger.info(' Section changed from', currentQuestion.section_name, 'to:', response.section_name);
        logger.info('Routing to listen-and-correct page');
        router.push('/communication/listen-and-correct');
        return;
      }

      logger.info(' Staying in Sentence Completion section, showing next question');
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
      logger.error(' Error fetching next question:', err);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* START MODAL */}
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 4: Sentence Completion"
        subtitle="Select the correct word to complete each sentence"
        questions={8}
        instructions={[
          'Read the sentence with the blank (____)',
          'Options will be shown on the right',
          'Select the word that best completes the sentence',
          'Click "Next Question" to continue',
        ]}
      />

      <div className="flex h-full min-h-0 overflow-hidden bg-gray-50">
        <AssessmentSidebar currentSectionId={4} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-3 lg:px-6 lg:py-4">

          {/* Section Header */}
          <div className="mb-2 shrink-0">
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
            className="mb-3 shrink-0"
          />

          {error ? (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          ) : currentQuestion ? (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 assessment-scroll lg:grid-cols-2">
                {/* Left - Sentence */}
                <div className="min-h-0 overflow-y-auto assessment-scroll rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sentence</p>
                    <span className="rounded-full bg-[#2557a7]/8 px-2.5 py-0.5 text-xs font-semibold text-[#2557a7]">
                      {sectionQuestionNumber} / {SECTION_TOTAL_QUESTIONS}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#2557a7]/15 bg-[#2557a7]/4 px-4 py-3">
                    <p className="text-base font-medium leading-relaxed text-gray-900">
                      {currentQuestion.question_text}
                    </p>
                  </div>

                  <div className="mt-4 rounded-r-xl border-l-4 border-[#2557a7] bg-[#2557a7]/5 px-4 py-3">
                    <p className="text-xs text-gray-600">
                      Select the option on the right that best completes the sentence.
                    </p>
                  </div>

                  {answerSaved && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                      <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Answer selected and saved</span>
                    </div>
                  )}
                </div>

                {/* Right - Options */}
                <div className="min-h-0 overflow-y-auto assessment-scroll rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Select the correct word</p>

                  <div className="space-y-1.5">
                    {options && options.length > 0 ? (
                      options.map((option: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          disabled={answerSaved}
                          aria-pressed={selectedAnswer === option}
                          onClick={() => handleSelect(option)}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 ${
                            answerSaved ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            selectedAnswer === option
                              ? 'border-[#2557a7] bg-[#2557a7]/5'
                              : answerSaved
                                ? 'border-gray-100 bg-gray-50 opacity-50'
                                : 'border-gray-200 hover:border-[#2557a7]/40 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              selectedAnswer === option
                                ? 'border-[#2557a7] bg-[#2557a7] text-white'
                                : 'border-gray-300 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-base text-gray-800">{option}</span>
                          </div>
                          {selectedAnswer === option && (
                            <svg className="h-4 w-4 shrink-0 text-[#2557a7]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="py-6 text-center text-sm text-gray-400">No options available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex shrink-0 items-center justify-between">
                <p className="text-xs text-gray-400">
                  Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
                </p>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!answerSaved || loading}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    answerSaved && !loading
                      ? 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Loading...' : 'Next Question ->'}
                </button>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
