'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getCurrentQuestion,
  getNextQuestion,
  uploadAudio,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveTextAnswer, textToSpeechAndRecord, validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';
import { getSectionRoute } from '@/utils/sectionRouter';
import logger from '@/lib/logger';

const TextToSpeechPlayer = dynamic(() => import('../components/TextToSpeechPlayer'), { loading: () => <div className="animate-pulse p-4">Loading...</div>, ssr: false });
const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });

// Option type for MCQ questions
interface Option {
  id: string;
  text: string;
}

export default function StoryListeningPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioSaved, setAudioSaved] = useState(false);
  const [audioRecordings, setAudioRecordings] = useState<{ [questionId: string]: Blob }>({});

  // Track which story has been played (by story text content)
  const [playedStories, setPlayedStories] = useState<Set<string>>(new Set());

  // Check if section was already completed - prevents back navigation issues
  useEffect(() => {
    const isCompleted = sessionStorage.getItem('story_listening_completed');
    if (isCompleted === 'true') {
      logger.warn('Story Listening section already completed. Preventing access via back navigation.');

      // Get the stored next section route
      const nextSectionRoute = sessionStorage.getItem('story_listening_next_section');

      if (nextSectionRoute) {
        logger.info('Redirecting to stored next section:', nextSectionRoute);
        router.push(nextSectionRoute);
      } else {
        // Fallback: redirect to sentence-completion or situation-explaining
        logger.info('No stored section found, redirecting to sentence-completion as fallback');
        router.push('/communication/sentence-completion');
      }
    }
  }, [router]);

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

  // Generate options based on expected_text and question context
  const getOptionsForQuestion = (): Option[] => {
    // If backend provides options array, use them
    if (currentQuestion?.options && currentQuestion.options.length > 0) {
      const optionIds = ['A', 'B', 'C', 'D', 'E', 'F'];
      return currentQuestion.options.map((optionText, index) => ({
        id: optionIds[index] || String.fromCharCode(65 + index),
        text: optionText,
      }));
    }

    // If backend provides expected_text, use it as the correct answer and generate 3 distractors
    if (currentQuestion?.expected_text) {
      const expectedAnswer = currentQuestion.expected_text; // Keep exactly as-is
      const expectedLower = expectedAnswer.toLowerCase();
      const questionText = currentQuestion.question_text?.toLowerCase() || '';

      // Generate 3 plausible distractors that follow the same pattern as expected_text
      let distractors: string[] = [];

      // Analyze expected_text pattern and generate similar distractors
      // Check for name patterns first (e.g., "Tom and Alex", "Sarah", "Mike")
      const isNamePattern = /^[A-Z][a-z]+(\s+(and|&)\s+[A-Z][a-z]+)?$/.test(expectedAnswer);

      if (isNamePattern || (questionText.includes('who') && !expectedLower.startsWith('the ') && !expectedLower.startsWith('a '))) {
        // Name pattern: "Tom and Alex", "Sarah", "Mike and Emma"
        if (expectedAnswer.includes(' and ') || expectedAnswer.includes(' & ')) {
          // Two names pattern
          distractors = [
            'Sarah and Mike',
            'John and Mary',
            'Emma and David',
            'Lisa and Peter',
            'Anna and James',
            'Kate and Robert',
            'Nina and Chris',
            'Rachel and Ben',
            'Sophie and Mark',
            'Laura and Steven'
          ];
        } else {
          // Single name pattern
          distractors = [
            'Sarah',
            'Michael',
            'Emma',
            'David',
            'Lisa',
            'Peter',
            'Anna',
            'James',
            'Rachel',
            'Mark'
          ];
        }
      } else if (expectedLower.startsWith('at the ') || expectedLower.startsWith('at ')) {
        // Location pattern: "At the coffee shop", "At home"
        distractors = [
          'At the park',
          'At home',
          'At the office',
          'At the store',
          'At the beach',
          'At the restaurant',
          'At school',
          'At the library',
          'At the hospital',
          'At the market',
          'At the station',
          'At the hotel'
        ];
      } else if (expectedLower.startsWith('in the ') || expectedLower.startsWith('in ')) {
        // Time or location pattern: "In the morning", "In the garden"
        if (questionText.includes('when') || questionText.includes('time')) {
          distractors = [
            'In the morning',
            'In the afternoon',
            'In the evening',
            'In the night',
            'In the early hours',
            'In the late afternoon',
            'In the midday',
            'In the dawn'
          ];
        } else {
          distractors = [
            'In the garden',
            'In the house',
            'In the classroom',
            'In the kitchen',
            'In the bedroom',
            'In the hall',
            'In the lobby',
            'In the basement'
          ];
        }
      } else if (expectedLower.startsWith('to ')) {
        // Purpose/reason pattern: "To help someone", "To buy groceries"
        distractors = [
          'To help someone',
          'To complete a task',
          'To solve a problem',
          'To meet a friend',
          'To save time',
          'To earn money',
          'To learn something',
          'To avoid trouble',
          'To finish work',
          'To make plans'
        ];
      } else if (expectedLower.startsWith('the ')) {
        // Definite noun pattern: "The main character", "The manager"
        if (questionText.includes('who')) {
          distractors = [
            'The main character',
            'The friend',
            'The family member',
            'The colleague',
            'The neighbor',
            'The teacher',
            'The manager',
            'The stranger',
            'The customer',
            'The assistant'
          ];
        } else {
          distractors = [
            'The first option',
            'The best choice',
            'The right answer',
            'The correct solution',
            'The main point',
            'The key detail',
            'The important fact',
            'The central idea'
          ];
        }
      } else if (expectedLower.startsWith('a ') || expectedLower.startsWith('an ')) {
        // Indefinite noun pattern: "A friend", "An important event"
        distractors = [
          'A friend',
          'A family member',
          'A colleague',
          'A neighbor',
          'A stranger',
          'A teacher',
          'A customer',
          'A helper',
          'A visitor',
          'A partner'
        ];
      } else if (questionText.includes('when') || questionText.includes('time')) {
        // Time-related answers
        distractors = [
          'In the morning',
          'In the afternoon',
          'In the evening',
          'At night',
          'Yesterday',
          'Last week',
          'Tomorrow',
          'Next month',
          'Today',
          'Last year'
        ];
      } else if (questionText.includes('how') || questionText.includes('feel')) {
        // Emotion/feeling pattern
        distractors = [
          'Happy and excited',
          'Sad and disappointed',
          'Worried and nervous',
          'Calm and relaxed',
          'Angry and frustrated',
          'Surprised and amazed',
          'Tired and exhausted',
          'Curious and interested',
          'Confident and proud',
          'Anxious and scared'
        ];
      } else if (questionText.includes('what')) {
        // Event/thing pattern
        distractors = [
          'A special event',
          'An important decision',
          'A challenging situation',
          'A helpful suggestion',
          'A surprising discovery',
          'A difficult problem',
          'A wonderful opportunity',
          'A valuable lesson',
          'A simple task',
          'A great achievement'
        ];
      } else {
        // Generic distractors for other patterns
        distractors = [
          'The first alternative',
          'The second option',
          'Another possibility',
          'A different answer',
          'An alternative choice',
          'Something else entirely',
          'A contrasting view',
          'The opposite outcome',
          'A similar situation',
          'The main reason'
        ];
      }

      // Filter out the expected answer from distractors (case-insensitive)
      distractors = distractors.filter(d => d.toLowerCase() !== expectedLower);

      // Select 3 random distractors
      const selectedDistractors = distractors
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Combine expected answer (EXACTLY as-is) with distractors
      const allOptions = [expectedAnswer, ...selectedDistractors];

      // Shuffle to randomize correct answer position
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      // Assign A, B, C, D labels
      return shuffledOptions.map((optionText, index) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D
        text: optionText,
      }));
    }

    // Fallback: Generate generic contextual options
    const questionText = currentQuestion?.question_text?.toLowerCase() || '';

    if (questionText.includes('where') || questionText.includes('location')) {
      return [
        { id: 'A', text: 'At the park' },
        { id: 'B', text: 'At home' },
        { id: 'C', text: 'At the office' },
        { id: 'D', text: 'At the store' },
      ];
    } else if (questionText.includes('when') || questionText.includes('time')) {
      return [
        { id: 'A', text: 'In the morning' },
        { id: 'B', text: 'In the afternoon' },
        { id: 'C', text: 'In the evening' },
        { id: 'D', text: 'At night' },
      ];
    } else if (questionText.includes('who')) {
      return [
        { id: 'A', text: 'The main character' },
        { id: 'B', text: 'A friend' },
        { id: 'C', text: 'A family member' },
        { id: 'D', text: 'A stranger' },
      ];
    } else if (questionText.includes('why') || questionText.includes('reason')) {
      return [
        { id: 'A', text: 'To help someone' },
        { id: 'B', text: 'To complete a task' },
        { id: 'C', text: 'To solve a problem' },
        { id: 'D', text: 'To learn something new' },
      ];
    } else if (questionText.includes('how') || questionText.includes('feel')) {
      return [
        { id: 'A', text: 'Happy and excited' },
        { id: 'B', text: 'Sad and disappointed' },
        { id: 'C', text: 'Worried and nervous' },
        { id: 'D', text: 'Calm and relaxed' },
      ];
    } else {
      // Default generic options for comprehension questions
      return [
        { id: 'A', text: 'The first option' },
        { id: 'B', text: 'The second option' },
        { id: 'C', text: 'The third option' },
        { id: 'D', text: 'The fourth option' },
      ];
    }
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
      setAudioSaved(false);
      setIsConvertingAudio(false);

      logger.info('Story Listening - Now showing question:', response.question_id);
      logger.info('Has story_text:', !!response.story_text);
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

  // Handle option selection for MCQ
  const handleOptionSelect = async (optionText: string) => {
    if (!currentQuestion?.question_id) return;
    setSelectedAnswer(optionText);
    setAudioSaved(false);

    // Save text answer immediately
    saveTextAnswer(currentQuestion.question_id, optionText);
    logger.info('Selected answer:', optionText);

    // Convert selected answer to audio blob (muted, not audible)
    setIsConvertingAudio(true);

    try {
      // Convert text to speech and record as audio blob with volume 0 (muted)
      const audioBlob = await textToSpeechAndRecord(optionText, {
        rate: 0.85,
        pitch: 1.0,
        volume: 0, // Muted - no sound will play
        lang: 'en-GB',
      });

      logger.info('Audio blob created (muted), size:', audioBlob.size);

      // ✅ Validate synthetic audio before saving
      logger.info('🔍 Validating synthetic audio...');
      const validation = await validateAudioBlob(audioBlob);

      logger.info('📊 Synthetic audio validation result:', {
        isValid: validation.isValid,
        duration: formatDuration(validation.duration),
        hasSound: validation.hasSound,
        size: formatFileSize(audioBlob.size),
        error: validation.error,
        warning: validation.warning,
      });

      if (!validation.isValid) {
        const errorMsg = `Generated audio is invalid: ${validation.error}`;
        logger.error('❌', errorMsg);
        // Don't throw - text answer is still saved, audio generation can be retried
        logger.warn('⚠️ Continuing with text answer, audio validation failed');
      }

      // IMPORTANT: Don't save to sessionStorage to avoid quota exceeded error
      // Generated audio files are large (~282KB) and will fill up sessionStorage quickly
      // We only need to keep in state for immediate upload via progressive API
      setAudioRecordings((prev) => ({
        ...prev,
        [currentQuestion.question_id]: audioBlob,
      }));

      setAudioSaved(true);

      logger.info(`✅ Synthetic audio saved (${formatDuration(validation.duration)}, ${formatFileSize(audioBlob.size)})`);
    } catch (err) {
      logger.error('Error converting to audio:', err);
      // Don't set error - text answer is still saved, audio is optional
    } finally {
      setIsConvertingAudio(false);
    }
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
      const testId = localStorage.getItem('test_id');

      if (!sessionId) throw new Error('Session ID not found');
      if (!testId) throw new Error('Test ID not found');

      // Get the audio blob for current question
      const audioBlob = audioRecordings[currentQuestion.question_id];
      logger.info('Audio blob check for question:', currentQuestion.question_id, {
        hasBlob: !!audioBlob,
        blobSize: audioBlob?.size,
        blobType: audioBlob?.type,
        allQuestionIds: Object.keys(audioRecordings),
      });

      if (!audioBlob) {
        const errorMsg = `No audio recording found for question ${currentQuestion.question_id}. Please try selecting your answer again.`;
        logger.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      if (audioBlob.size === 0 || audioBlob.size < 100) {
        const errorMsg = `Audio recording is empty or too small (${audioBlob.size} bytes). Please try again.`;
        logger.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // ✅ STEP 1: Upload audio first
      // ✅ Upload audio with return_next_question=true
      logger.info('Uploading audio with return_next_question=true for question:', currentQuestion.question_id);
      logger.info('Audio details:', {
        size: `${(audioBlob.size / 1024).toFixed(2)} KB`,
        type: audioBlob.type,
      });

      const uploadResponse = await uploadAudio({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        test_id: testId,
        audio_file: audioBlob,
        return_next_question: true, // ✅ Request next question in response
        question_number: currentQuestion.question_number, // ✅ Global question number
      });
      logger.info('Audio uploaded successfully for', currentQuestion.question_id, ':', uploadResponse);

      // Verify upload was successful - backend returns success:true and status:"completed"
      if (!uploadResponse || !uploadResponse.success) {
        const errorMsg = `Audio upload failed for question ${currentQuestion.question_id}. Response: ${JSON.stringify(uploadResponse)}`;
        logger.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // ✅ Check if next question was included in upload response
      if (uploadResponse.next_question) {
        logger.info('Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        // Check if section changed to next section
        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);

          // Get the route for the new section dynamically
          const nextRoute = getSectionRoute(nextQuestion.section_name);

          if (nextRoute) {
            logger.info('Routing to next section page:', nextRoute);
            logger.info('Current URL before routing:', window.location.pathname);

            // Mark section as complete and store next section route to prevent back navigation issues
            sessionStorage.setItem('story_listening_completed', 'true');
            sessionStorage.setItem('story_listening_next_section', nextRoute);

            router.push(nextRoute);
          } else {
            logger.error('Unknown section name from backend:', nextQuestion.section_name);
            setError(`Unknown section: ${nextQuestion.section_name}. Please contact support.`);
          }
          return;
        }

        logger.info('Staying in Story Listen Facts section, showing next question');
        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'MCQ',
          section_name: 'Story Listen Facts', // ✅ Use backend section name
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
        setSelectedAnswer(null);
      } else {
        // Fallback: If next_question not in response, fetch it separately
        logger.warn('Next question not in upload response, fetching separately...');
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
          logger.info('Assessment completed, routing to feedback');
          router.push('/communication/feedback');
          return;
        }

        // Check if section changed to next section
        if (response.section_name !== currentQuestion.section_name) {
          logger.info('Section changed from', currentQuestion.section_name, 'to:', response.section_name);

          // Get the route for the new section dynamically
          const nextRoute = getSectionRoute(response.section_name);

          if (nextRoute) {
            logger.info('Routing to next section page:', nextRoute);
            logger.info('Current URL before routing:', window.location.pathname);

            // Mark section as complete and store next section route to prevent back navigation issues
            sessionStorage.setItem('story_listening_completed', 'true');
            sessionStorage.setItem('story_listening_next_section', nextRoute);

            router.push(nextRoute);
          } else {
            logger.error('Unknown section name from backend:', response.section_name);
            setError(`Unknown section: ${response.section_name}. Please contact support.`);
          }
          return;
        }

        logger.info('Staying in Story Listen Facts section, showing next question');
        // Update to the next question with normalized section name
        setCurrentQuestion({
          ...response,
          section_name: 'Story Listen Facts', // ✅ Normalize to match backend
        });
        setSelectedAnswer(null);
      }

      // Note: playedStories Set is preserved
      // shouldShowStoryAudio will check if this new question's story has been played
    } catch (err: any) {
      logger.error('Error uploading audio or fetching next question:', err);
      setError(err.message || 'Failed to upload audio or fetch next question');
    } finally {
      setLoading(false);
    }
  };

  // Get hardcoded options for MCQ
  const options = getOptionsForQuestion();

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
                {currentQuestion?.section_name || 'Story Listening'}
              </h1>
              <p className="text-sm text-gray-500">
                Listen to stories and answer comprehension questions
              </p>
            </div>

            {/* PROGRESS */}
            <div className="bg-white rounded-lg p-5 mb-6">
              <div className="flex justify-between items-center mb-2">
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

                    {/* Start Questions Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleStartQuestions}
                        className="px-8 py-3 rounded-lg font-semibold flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition"
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
                        Question {currentQuestion.question_number} of{' '}
                        {currentQuestion.total_questions}
                      </p>

                      <button
                        onClick={handleNext}
                        disabled={!audioSaved || loading}
                        className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                          audioSaved && !loading
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
