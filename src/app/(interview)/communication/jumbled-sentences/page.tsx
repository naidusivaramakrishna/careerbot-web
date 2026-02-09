'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getCurrentQuestion,
  getNextQuestion,
  uploadAudio,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveTextAnswer, textToSpeechAndRecord, validateAudioBlob, formatDuration, formatFileSize } from '@/utils/audioUtils';
import logger from '@/lib/logger';

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), { loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> });
const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), { loading: () => null });

interface JumbledSentencesPageProps {
  sectionName?: string;
  sectionDescription?: string;
}

export default function JumbledSentencesPage({
  sectionName = 'Jumbled Sentences',
  sectionDescription = 'Arrange words in the correct order to form meaningful sentences',
}: JumbledSentencesPageProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioSaved, setAudioSaved] = useState(false);

  // ✅ Track section-specific question number for display only (1-8 for "Jumbled Sentences")
  // Note: currentQuestion.question_number remains global for backend upload API
  const [sectionQuestionNumber, setSectionQuestionNumber] = useState(1);
  const SECTION_TOTAL_QUESTIONS = 8; // Total questions in this section

  // Track audio recordings by question_id
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
      setSelectedAnswer(null); // Reset selection for new question
      setAudioSaved(false); // Reset audio state for new question
      setIsConvertingAudio(false);
      logger.info('➡️ Jumbled Sentences - Now showing question:', response.question_id);
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

  // Parse question_text as array of words if it's a string
  const originalWords = currentQuestion?.question_text
    ? typeof currentQuestion.question_text === 'string'
      ? JSON.parse(currentQuestion.question_text)
      : currentQuestion.question_text
    : [];

  // Shuffle the words and create mapping (memoized per question)
  const { jumbledWords, correctOrderMapping, originalToJumbledMap } = useMemo(() => {
    if (!originalWords || originalWords.length === 0) {
      return { jumbledWords: [], correctOrderMapping: '', originalToJumbledMap: new Map() };
    }

    // Create array of indices and shuffle them
    const indices = Array.from({ length: originalWords.length }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Create jumbled words array based on shuffled indices
    const shuffled = indices.map(idx => originalWords[idx]);

    // Create mapping: originalIndex -> jumbledPosition (1-based)
    const map = new Map<number, number>();
    indices.forEach((originalIdx, jumbledPos) => {
      map.set(originalIdx, jumbledPos + 1);
    });

    // Create correct order mapping (shows which jumbled position should come first, second, etc.)
    // For example, if original is ["I", "am", "eating"] and jumbled is ["eating", "I", "am"]
    // Then correct order is "2-3-1" (jumbled position 2 is "I", position 3 is "am", position 1 is "eating")
    const correctMapping = originalWords.map((_, originalIdx) => map.get(originalIdx)).join('-');

    return {
      jumbledWords: shuffled,
      correctOrderMapping: correctMapping,
      originalToJumbledMap: map
    };
  }, [currentQuestion?.question_id, originalWords.length]);

  // Generate random orderings as options (memoized per question)
  const generatedOptions = useMemo(() => {
    if (jumbledWords.length === 0) return [];

    const length = jumbledWords.length;
    const options = [correctOrderMapping]; // First option is the correct ordering

    // Generate 3 more random orderings
    while (options.length < 4) {
      const randomIndices = Array.from({ length }, (_, i) => i + 1);
      // Fisher-Yates shuffle
      for (let i = randomIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]];
      }
      const randomOrder = randomIndices.join('-');
      if (!options.includes(randomOrder)) {
        options.push(randomOrder);
      }
    }

    // Shuffle the options so correct answer is not always first
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
  }, [jumbledWords.length, correctOrderMapping]);

  // Convert ordering (like "1-2-3-4-5") to actual sentence using jumbled words
  const constructSentence = (ordering: string): string => {
    if (!jumbledWords || jumbledWords.length === 0) return '';
    const indices = ordering.split('-').map(num => parseInt(num) - 1);
    return indices.map(idx => jumbledWords[idx]).join(' ');
  };

  const handleOptionSelect = async (optionOrdering: string) => {
    if (!currentQuestion?.question_id) return;

    // Store the ordering in state
    setSelectedAnswer(optionOrdering);
    setAudioSaved(false);

    // Construct the sentence from the ordering and save to sessionStorage
    const constructedSentence = constructSentence(optionOrdering);
    saveTextAnswer(currentQuestion.question_id, constructedSentence);

    logger.info('✅ Selected ordering:', optionOrdering);
    logger.info('✅ Constructed sentence:', constructedSentence);

    // Convert constructed sentence to audio blob (muted, not audible)
    setIsConvertingAudio(true);

    try {
      // Convert text to speech and record as audio blob with volume 0 (muted)
      const audioBlob = await textToSpeechAndRecord(constructedSentence, {
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
      logger.error('❌ Error converting to audio:', err);
      // Don't set error - text answer is still saved, audio is optional
    } finally {
      setIsConvertingAudio(false);
    }
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
          logger.info('🚀 Routing to sentence-completion page');
          router.push('/communication/sentence-completion');
          return;
        }

        logger.info('➡️ Staying in Jumbled Sentence section, showing next question');
        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'MCQ',
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
        setSelectedAnswer(null); // Reset selection for new question

        // ✅ Increment section-specific question number for display
        setSectionQuestionNumber((prev) => prev + 1);
      } else {
        // Fallback: If next_question not in response, fetch it separately
        logger.warn('⚠️ Next question not in upload response, fetching separately...');
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

        // Check if section changed to next section
        if (response.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
          logger.info('🚀 Routing to sentence-completion page');
          router.push('/communication/sentence-completion');
          return;
        }

        logger.info('➡️ Staying in Jumbled Sentence section, showing next question');
        setCurrentQuestion(response);
        setSelectedAnswer(null); // Reset selection for new question

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

  return (
    <>
      {/* 🔔 START MODAL */}
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 3: Jumbled Sentences"
        subtitle="Arrange the words in the correct order to form meaningful sentences"
        questions={8}
        // duration="2 min"
        instructions={[
          'Read the jumbled words carefully',
          'Select the correct word order from options',
          'Click "Next" to proceed to the next question',
        ]}
      />

    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR */}
      <AssessmentSidebar currentSectionId={3} />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* 🔽 YOUR EXISTING UI — UNCHANGED */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {sectionName}
            </h1>
            <p className="text-gray-600 text-sm">
              {sectionDescription}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {sectionQuestionNumber} of {SECTION_TOTAL_QUESTIONS}
              </span>
              <span className="text-sm font-semibold text-indigo-600">
                {Math.round((sectionQuestionNumber / SECTION_TOTAL_QUESTIONS) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(sectionQuestionNumber / SECTION_TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : currentQuestion ? (
                <>
                  <div className="mb-4">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                      Question {currentQuestion.question_number}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Arrange the words in correct order
                  </h2>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                      Jumbled Words:
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {jumbledWords.map((word: string, index: number) => (
                        <div
                          key={index}
                          className="bg-white px-4 py-3 rounded-lg shadow-sm border-2 border-indigo-200 flex items-center gap-2"
                        >
                          <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-gray-900 font-medium text-lg">
                            {word}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
                    <p className="text-sm text-gray-700">
                      💡 Select the correct order from the options on the right.
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
                </>
              ) : null}
            </div>

            {/* Right */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select the Correct Order
              </h3>

              {generatedOptions.length > 0 ? (
                <div className="space-y-3">
                  {generatedOptions.map((optionOrdering: string, index: number) => (
                    <div
                      key={index}
                      onClick={() => handleOptionSelect(optionOrdering)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAnswer === optionOrdering
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                          selectedAnswer === optionOrdering
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-300 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-mono font-medium text-gray-900">
                            {optionOrdering}
                          </p>
                        </div>
                        {selectedAnswer === optionOrdering && (
                          <svg className="w-6 h-6 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading options...</p>
              )}
            </div>
          </div>

          {/* Button */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!audioSaved || loading}
              className={`px-8 py-3 rounded-lg font-semibold ${
                audioSaved && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
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
