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
import { getSectionRoute } from '@/utils/sectionRouter';
import logger from '@/lib/logger';

const TextToSpeechPlayer = dynamic(() => import('../components/TextToSpeechPlayer'), { loading: () => <div className="animate-pulse p-4">Loading...</div>, ssr: false });
const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });
const QuestionProgressBar = dynamic(() => import('../components/QuestionProgressBar'), { loading: () => <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200 h-20 animate-pulse" /> });

// Option type for MCQ questions
interface Option {
  id: string;
  text: string;
}

export default function StoryListenFactsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSaved, setAnswerSaved] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false); // Track if audio has finished playing

  // Track which story has been played (by story text content)
  const [playedStories, setPlayedStories] = useState<Set<string>>(new Set());

  // ✅ Track section-specific question number for display only (1-3 for "Story Listening")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 3; // Total 3 questions for the story


  // Check if we should show story audio page
  // Show audio if the current question has story_text and we haven't played it yet
  const shouldShowStoryAudio = (() => {
    if (!currentQuestion) return false;

    // If there's no story_text, don't show audio page
    if (!currentQuestion.story_text) {
      logger.info('[shouldShowStoryAudio] No story_text, returning false');
      return false;
    }

    // Check if we've already played this story
    const hasPlayedThisStory = playedStories.has(currentQuestion.story_text);
    const result = !hasPlayedThisStory;

    logger.info('[shouldShowStoryAudio] Checking...', {
      hasStoryText: !!currentQuestion.story_text,
      storyPreview: currentQuestion.story_text.substring(0, 50) + '...',
      hasPlayedThisStory,
      showAudio: result,
    });

    return result;
  })();

  // Get options from backend only
  const getOptionsFromBackend = (): Option[] => {
    if (currentQuestion?.options && currentQuestion.options.length > 0) {
      return currentQuestion.options.map((optionText, index) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D, etc.
        text: optionText,
      }));
    }
    return [];
  };

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
        section_name: 'Story Listen Facts', // Backend uses this name
      });
      setSelectedAnswer(null);
      setAnswerSaved(false);

      logger.info('Story Listening - Now showing question:', response.question_id);
      logger.info('Has story_text:', !!response.story_text);
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
    setAudioCompleted(false); // Reset audio completion state
    await fetchCurrentQuestion();
  };

  // Handler for when audio finishes playing
  const handleAudioEnd = () => {
    setAudioCompleted(true);
    logger.info('✅ Story audio playback completed - Start Questions button now enabled');
  };

  // Handle option selection for MCQ
  const handleOptionSelect = (optionText: string) => {
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

  // Handle "Start Questions" button after story audio
  const handleStartQuestions = () => {
    logger.info('[handleStartQuestions] Button clicked!');

    if (currentQuestion?.story_text) {
      const storyText = currentQuestion.story_text;
      // Mark this story as played by adding it to the Set
      setPlayedStories(prev => new Set(prev).add(storyText));
      logger.info('[handleStartQuestions] Marked story as played:', storyText.substring(0, 50) + '...');
      logger.info('[handleStartQuestions] Component should re-render now and show the question');
    } else {
      logger.error('[handleStartQuestions] No story_text found!');
    }
  };

  // Next question
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

      // Fetch next question directly (no audio upload for story listen facts)
      logger.info('📬 Fetching next question for:', currentQuestion.question_id);
      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      logger.info('===== [Story Listening] NEXT QUESTION API RESPONSE =====');
      logger.info('completed:', response.completed);
      logger.info('section_name:', response.section_name);
      logger.info('question_id:', response.question_id);
      logger.info('question_number:', response.question_number);
      logger.info('total_questions:', response.total_questions);
      logger.info('is_last_question:', response.is_last_question);
      logger.info('is_last_section:', response.is_last_section);
      logger.info('==========================================================');

      if (response.completed) {
        logger.info('✅ Assessment completed, routing to feedback');
        router.push('/communication/feedback');
        return;
      }

      // Check if section changed to next section
      if (response.section_name !== currentQuestion.section_name) {
        logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);

        // Get the route for the new section dynamically
        const nextRoute = getSectionRoute(response.section_name);

        if (nextRoute) {
          logger.info('🚀 Routing to next section page:', nextRoute);
          logger.info('Current URL before routing:', window.location.pathname);

          router.push(nextRoute);
        } else {
          logger.error('Unknown section name from backend:', response.section_name);
          setError(`Unknown section: ${response.section_name}. Please contact support.`);
        }
        return;
      }

      logger.info('➡️ Staying in Story Listen Facts section, showing next question');
      // Update to the next question with normalized section name
      setCurrentQuestion({
        ...response,
        section_name: 'Story Listen Facts', // ✅ Normalize to match backend
        question_number: currentQuestion.question_number ? currentQuestion.question_number + 1 : response.question_number,
      });
      setSelectedAnswer(null);
      setAnswerSaved(false); // Reset answer saved state

      // Reset audio completion for new story (if it has story_text and hasn't been played)
      if (response.story_text && !playedStories.has(response.story_text)) {
        setAudioCompleted(false);
      }

      // ✅ Increment section-specific question number for display
      setSectionQuestionNumber((prev) => prev + 1);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch next question');
      logger.error('❌ Error fetching next question:', err);
      setError(error.message);
      setLoading(false);
    }
  };

  // Get options from backend
  const options = getOptionsFromBackend();

  return (
    <>
      {/* 🔔 START MODAL */}
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 6: Story Listen Facts"
        subtitle="Listen to stories and answer comprehension questions"
        questions={8}
        instructions={[
          'Click "Play Audio" button to listen to the story',
          'You can play the audio ONLY ONCE - listen carefully!',
          'Answer the comprehension questions based on what you heard',
          'Select the best answer from the options provided',
          'Click "Next Question" to continue',
        ]}
      />

      <div className="min-h-screen bg-gray-50 flex">
        <AssessmentSidebar currentSectionId={6} />

        <main className="flex-1 px-8 py-7 min-w-0">

          {/* Section Header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section 6 of 7</p>
            <h1 className="text-lg font-bold text-gray-900">
              {currentQuestion?.section_name || 'Story Listen Facts'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Listen to the story and answer comprehension questions.
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
              {shouldShowStoryAudio ? (
                <>
                  {/* Story Audio Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5 max-w-2xl">
                    <div className="mb-5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Story</p>
                      <h2 className="text-lg font-bold text-gray-900">Listen to the Story</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Listen carefully. You will answer questions about it next.
                      </p>
                    </div>

                    {currentQuestion.story_text && (
                      <TextToSpeechPlayer
                        text={currentQuestion.story_text}
                        autoPlay={false}
                        onAudioEnd={handleAudioEnd}
                      />
                    )}

                    <div className="mt-4 px-4 py-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
                      <p className="text-sm font-semibold text-amber-900">
                        You can only listen to this story once — listen carefully before proceeding.
                      </p>
                    </div>
                  </div>

                  {!audioCompleted && (
                    <div className="mb-4 px-4 py-3 bg-[#2557a7]/5 border-l-4 border-[#2557a7] rounded-r-xl max-w-2xl">
                      <p className="text-sm font-medium text-[#2557a7]">
                        Play and listen to the story first before starting questions.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end max-w-2xl">
                    <button
                      onClick={handleStartQuestions}
                      disabled={!audioCompleted}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        audioCompleted
                          ? 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Start Questions →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* MCQ Question */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    {/* Question Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question</p>
                        <span className="text-xs font-semibold text-[#2557a7] bg-[#2557a7]/8 px-2.5 py-0.5 rounded-full">
                          {sectionQuestionNumber} / {SECTION_TOTAL_QUESTIONS}
                        </span>
                      </div>

                      <h2 className="text-base font-semibold text-gray-900 mb-4 leading-relaxed">
                        {currentQuestion.question_text}
                      </h2>

                      <div className="px-4 py-3 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl">
                        <p className="text-xs font-medium text-[#2557a7]">
                          Select the correct answer based on the story you heard.
                        </p>
                      </div>
                    </div>

                    {/* Options Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Your Answer</p>

                      <div className="space-y-2.5">
                        {options.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => handleOptionSelect(option.text)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                              answerSaved ? 'cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              selectedAnswer === option.text
                                ? 'border-[#2557a7] bg-[#2557a7]/5'
                                : answerSaved
                                  ? 'border-gray-100 bg-gray-50 opacity-50'
                                  : 'border-gray-200 hover:border-[#2557a7]/40 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              selectedAnswer === option.text
                                ? 'bg-[#2557a7] text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {option.id}
                            </div>
                            <p className="text-sm font-medium text-gray-900 flex-1">{option.text}</p>
                            {selectedAnswer === option.text && (
                              <svg className="w-5 h-5 text-[#2557a7] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

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
                </>
              )}
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
