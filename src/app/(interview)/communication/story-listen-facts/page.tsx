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
      });
      setSelectedAnswer(null);
      setAnswerSaved(false); // Reset answer saved state

      // Reset audio completion for new story (if it has story_text and hasn't been played)
      if (response.story_text && !playedStories.has(response.story_text)) {
        setAudioCompleted(false);
      }

      // ✅ Increment section-specific question number for display
      setSectionQuestionNumber((prev) => prev + 1);

      // Note: playedStories Set is preserved
      // shouldShowStoryAudio will check if this new question's story has been played
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch next question');
      logger.error('❌ Error fetching next question:', err);
      setError(error.message);
    } finally {
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

      <div className="min-h-screen bg-[#F4F6FB] flex">
        {/* LEFT SIDEBAR */}
        <AssessmentSidebar currentSectionId={6} />

        {/* MAIN CONTENT */}
        <main className="flex-1 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentQuestion?.section_name || 'Story Listen Facts'}
              </h1>
              <p className="text-sm text-gray-500">
                Listen to stories and answer comprehension questions
              </p>
            </div>

            {/* PROGRESS */}
            <QuestionProgressBar
              currentQuestion={sectionQuestionNumber}
              totalQuestions={SECTION_TOTAL_QUESTIONS}
              className="mb-6"
            />

            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : currentQuestion ? (
              <>
                {/* STORY AUDIO PAGE - Show this only for first question of story before audio is played */}
                {shouldShowStoryAudio ? (
                  <>
                    {/* Story Audio Page */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border mb-6">
                      <div className="max-w-3xl mx-auto">
                        {/* Story Title/Header */}
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Listen to the Story
                          </h2>
                          <p className="text-gray-600">
                            Listen carefully to the audio. You will answer questions about it
                            next.
                          </p>
                        </div>

                        {/* Text-to-Speech Player for Story */}
                        {currentQuestion.story_text && (
                          <TextToSpeechPlayer
                            text={currentQuestion.story_text}
                            autoPlay={false}
                            onAudioEnd={handleAudioEnd}
                          />
                        )}

                        {/* Warning */}
                        <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                          <p className="text-sm text-amber-900 flex items-start gap-2 font-semibold">
                            <svg
                              className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              Important: You can only listen to this story ONCE. Listen
                              carefully before proceeding to questions.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info message when audio hasn't completed */}
                    {!audioCompleted && (
                      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-600">ℹ️</span>
                          <span className="font-medium">
                            Please play and listen to the story first before you can start the questions.
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Start Questions Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleStartQuestions}
                        disabled={!audioCompleted}
                        className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition ${
                          audioCompleted
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Start Questions →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* QUESTION PAGE - Show questions with MCQ options */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* LEFT CARD - Question */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="mb-6">
                          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                            Question {currentQuestion.question_number}
                          </span>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                          {currentQuestion.question_text}
                        </h2>

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">
                              Based on the story you heard
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Select the correct answer from the options on the right.
                          </p>
                        </div>

                        {/* Selection Status - Commented out */}
                        {/* {selectedAnswer && (
                          <div className={`mt-4 flex items-center gap-2 p-3 rounded ${
                            isConvertingAudio
                              ? 'bg-blue-50 border border-blue-200'
                              : audioSaved
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            {isConvertingAudio ? (
                              <>
                                <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-medium text-blue-800">Converting to audio...</span>
                              </>
                            ) : audioSaved ? (
                              <>
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium text-green-800">Answer Selected & Audio Saved</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium text-yellow-800">Answer Selected</span>
                              </>
                            )}
                          </div>
                        )} */}
                      </div>

                      {/* RIGHT CARD - Options */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Select Your Answer
                        </h3>

                        <div className="space-y-3">
                          {options.map((option) => (
                            <div
                              key={option.id}
                              onClick={() => handleOptionSelect(option.text)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedAnswer === option.text
                                  ? 'border-indigo-600 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                                    selectedAnswer === option.text
                                      ? 'border-indigo-600 bg-indigo-600 text-white'
                                      : 'border-gray-300 text-gray-600'
                                  }`}
                                >
                                  {option.id}
                                </div>
                                <p className="text-base font-medium text-gray-900 flex-1">
                                  {option.text}
                                </p>
                                {selectedAnswer === option.text && (
                                  <svg
                                    className="w-6 h-6 text-indigo-600 shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-center mt-8">
                      <p className="text-sm text-gray-500">
                        Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
                      </p>

                      <button
                        onClick={handleNext}
                        disabled={!answerSaved || loading}
                        className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                          answerSaved && !loading
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next Question →
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
}
