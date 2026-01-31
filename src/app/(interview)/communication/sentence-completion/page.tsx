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
import { textToSpeechAndRecord, validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';
import logger from '@/lib/logger';

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });

// Dynamic options for sentence completion based on question_id from backend
// Map question_id to appropriate options that fit each question
const QUESTION_OPTIONS_MAP: { [key: string]: string[] } = {
  // Add your question_id mappings here
  // Example: 'q1_id': ['go', 'went', 'going', 'goes'],
  // You can get the question_id from console logs and add mappings
};

// Function to get options based on question_id or generate smart defaults
const getOptionsForQuestion = (questionId: string, questionText: string): string[] => {
  // First, try to get options from the map using question_id
  if (QUESTION_OPTIONS_MAP[questionId]) {
    return QUESTION_OPTIONS_MAP[questionId];
  }

  // If not found, generate smart options based on question text patterns
  const text = questionText.toLowerCase();

  // Verb tense patterns
  if (text.includes('every day') || text.includes('usually') || text.includes('often')) {
    return ['go', 'goes', 'went', 'gone'];
  }
  if (text.includes('yesterday') || text.includes('last')) {
    return ['went', 'was', 'had', 'did'];
  }
  if (text.includes('now') || text.includes('currently')) {
    return ['is', 'are', 'going', 'doing'];
  }

  // Be verb patterns
  if (text.includes('she ') || text.includes('he ') || text.includes('it ')) {
    return ['is', 'was', 'has', 'does'];
  }
  if (text.includes('they ') || text.includes('we ') || text.includes('you ')) {
    return ['are', 'were', 'have', 'do'];
  }
  if (text.includes('i ')) {
    return ['am', 'was', 'have', 'do'];
  }

  // Modal verbs
  if (text.includes('permission') || text.includes('allowed')) {
    return ['can', 'may', 'could', 'might'];
  }
  if (text.includes('future') || text.includes('tomorrow')) {
    return ['will', 'would', 'shall', 'should'];
  }

  // Default fallback options
  return ['is', 'are', 'was', 'were'];
};

export default function SentenceCompletionPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioSaved, setAudioSaved] = useState(false);
  const [completedSentence, setCompletedSentence] = useState<string>('');
  const [audioRecordings, setAudioRecordings] = useState<{ [questionId: string]: Blob }>({});

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
      setAudioSaved(false);
      setCompletedSentence('');
      logger.info('➡️ Sentence Completion - Now showing question:', response.question_id);
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

  // Get dynamic options based on question_id and question_text from backend
  const options = currentQuestion?.question_id && currentQuestion?.question_text
    ? getOptionsForQuestion(currentQuestion.question_id, currentQuestion.question_text)
    : [];

  const handleSelect = async (optionText: string) => {
    if (!currentQuestion?.question_id) return;
    if (audioSaved) return; // Prevent re-selection after audio is saved

    setSelectedAnswer(optionText);

    // Construct the completed sentence
    const completedSent = currentQuestion.question_text.replace(/____+/g, optionText);
    setCompletedSentence(completedSent);

    logger.info('✅ Selected answer:', optionText);
    logger.info('✅ Completed sentence:', completedSent);

    // Convert completed sentence to audio blob (muted, not audible)
    setIsConvertingAudio(true);

    try {
      // Convert text to speech and record as audio blob with volume 0 (muted)
      const audioBlob = await textToSpeechAndRecord(completedSent, {
        rate: 0.85,
        pitch: 1.0,
        volume: 0, // Muted - no sound will play
        lang: 'en-GB',
      });

      logger.info('🔊 Audio blob created (muted), size:', audioBlob.size);

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
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // IMPORTANT: Don't save to sessionStorage to avoid quota exceeded error
      // Generated audio files are large (~282KB) and will fill up sessionStorage quickly
      // We only need to keep in state for immediate upload via progressive API
      setAudioRecordings((prev) => ({
        ...prev,
        [currentQuestion.question_id]: audioBlob,
      }));

      setAudioSaved(true);

      logger.info(`✅ Valid synthetic audio saved (${formatDuration(validation.duration)}, ${formatFileSize(audioBlob.size)})`);
    } catch (err) {
      logger.error('❌ Error converting to audio:', err);
      setError('Failed to convert to audio. Please try again.');
    } finally {
      setIsConvertingAudio(false);
    }
  };

  // Get completed sentence by filling the blank with selected answer
  const getCompletedSentence = (): string => {
    if (!currentQuestion?.question_text || !selectedAnswer) {
      return currentQuestion?.question_text || '';
    }
    // Replace ____ with the selected answer
    return currentQuestion.question_text.replace(/____+/g, selectedAnswer);
  };

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
      logger.info('📊 Audio blob check for question:', currentQuestion.question_id, {
        hasBlob: !!audioBlob,
        blobSize: audioBlob?.size,
        blobType: audioBlob?.type,
        allQuestionIds: Object.keys(audioRecordings),
      });

      if (!audioBlob) {
        const errorMsg = `No audio recording found for question ${currentQuestion.question_id}. Please try selecting your answer again.`;
        logger.error('❌', errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      if (audioBlob.size === 0 || audioBlob.size < 100) {
        const errorMsg = `Audio recording is empty or too small (${audioBlob.size} bytes). Please try again.`;
        logger.error('❌', errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // ✅ STEP 1: Upload audio first
      // ✅ Upload audio with return_next_question=true
      logger.info('📤 Uploading audio with return_next_question=true for question:', currentQuestion.question_id);
      logger.info('📊 Audio details:', {
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
      logger.info('✅ Audio uploaded successfully for', currentQuestion.question_id, ':', uploadResponse);

      // Verify upload was successful - backend returns success:true and status:"completed"
      if (!uploadResponse || !uploadResponse.success) {
        const errorMsg = `Audio upload failed for question ${currentQuestion.question_id}. Response: ${JSON.stringify(uploadResponse)}`;
        logger.error('❌', errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // ✅ Check if next question was included in upload response
      if (uploadResponse.next_question) {
        logger.info('📬 Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        // Check if section changed to next section (Listen and Correct)
        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);
          logger.info('🚀 Routing to listen-and-correct page');
          router.push('/communication/listen-and-correct');
          return;
        }

        logger.info('➡️ Staying in Sentence Completion section, showing next question');
        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'MCQ',
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
        setSelectedAnswer(null); // Reset selected answer
        setAudioSaved(false); // Reset audio saved state
        setCompletedSentence(''); // Reset completed sentence
      } else {
        // Fallback: If next_question not in response, fetch it separately
        logger.warn('⚠️ Next question not in upload response, fetching separately...');
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
        setCurrentQuestion(response);
        setSelectedAnswer(null); // Reset selected answer
        setAudioSaved(false); // Reset audio saved state
        setCompletedSentence(''); // Reset completed sentence
      }
    } catch (err: any) {
      logger.error('❌ Error uploading audio or fetching next question:', err);
      setError(err.message || 'Failed to upload audio or fetch next question');
    } finally {
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
          'Four options will be shown below',
          'Select the word that best completes the sentence',
          'The completed sentence will be converted to audio (silently)',
          'Wait for the conversion to complete',
          'Click "Next Question" to continue',
        ]}
      />

      <div className="min-h-screen bg-[#F4F6FB] flex">
        {/* LEFT SIDEBAR */}
        <AssessmentSidebar currentSectionId={4} />

        {/* MAIN CONTENT */}
        <main className="flex-1 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentQuestion?.section_name || 'Sentence Completion'}
              </h1>
              <p className="text-sm text-gray-500">
                Test vocabulary and context understanding.
              </p>
            </div>

            {/* PROGRESS */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 mr-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {currentQuestion?.question_number || 0} of{' '}
                    {currentQuestion?.total_questions || 0} Questions
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1 rounded-full">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all"
                    style={{
                      width: `${
                        ((currentQuestion?.question_number || 0) /
                          (currentQuestion?.total_questions || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : currentQuestion ? (
              <>
                {/* MAIN CONTENT */}
                <div className="max-w-4xl mx-auto">
                  {/* Single Card - Sentence and Options */}
                  <div className="bg-white rounded-xl p-8 shadow-sm border">
                    <div className="mb-6">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                        Question {currentQuestion.question_number}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                      Select the most appropriate word to complete the sentence.
                    </p>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 mb-6">
                      <p className="text-xs uppercase text-gray-400 mb-3">
                        Sentence
                      </p>
                      <p className="text-2xl font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.question_text}
                      </p>
                    </div>

                    {/* Completed Sentence Display */}
                    {/* {selectedAnswer && (
                      <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                        <div className="flex items-start gap-3">
                          <svg
                            className="w-6 h-6 text-green-600 flex-shrink-0 mt-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs uppercase text-gray-600 font-semibold mb-2">
                              ✓ Completed Sentence
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {completedSentence || getCompletedSentence()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {/* Audio Converting Indicator */}
                    {isConvertingAudio && (
                      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-blue-600 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <p className="text-sm font-medium text-blue-800">
                            🔄 Converting to audio...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Audio Saved Confirmation - Commented out */}
                    {/* {audioSaved && !isConvertingAudio && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
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
                          <p className="text-sm font-medium text-green-800">
                            ✓ Audio recording saved
                          </p>
                        </div>
                      </div>
                    )} */}

                    {/* {!audioSaved && !isConvertingAudio && (
                      <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                        <p className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-amber-600">ℹ️</span>
                          <span>
                            Select an option below. The completed sentence will be converted to audio format automatically (you won&apos;t hear it).
                          </span>
                        </p>
                      </div>
                    )} */}

                    <h3 className="text-sm text-black font-semibold mb-4">
                      Select the correct word:
                    </h3>

                    <div className="space-y-3">
                      {options && options.length > 0 ? (
                        options.map((option: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => !audioSaved && !isConvertingAudio && handleSelect(option)}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                              audioSaved || isConvertingAudio
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                            } ${
                              selectedAnswer === option
                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span
                                className={`font-bold text-base ${
                                  selectedAnswer === option
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                ({String.fromCharCode(65 + index)})
                              </span>
                              <span className="text-lg text-gray-800">
                                {option}
                              </span>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedAnswer === option
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selectedAnswer === option && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No options available
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center mt-8 max-w-4xl mx-auto">
                  <p className="text-sm text-gray-500">
                    Question {currentQuestion.question_number} of{' '}
                    {currentQuestion.total_questions} in this section
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
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
}
