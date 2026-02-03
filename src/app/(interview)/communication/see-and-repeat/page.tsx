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
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse">Loading...</div></div>,
  ssr: false,
});

const AssessmentSidebar = dynamic(() => import('../components/AssessmentSidebar'), {
  loading: () => <div className="w-64 bg-gray-100 animate-pulse" />,
});

const SectionStartModal = dynamic(() => import('../components/SectionStartModal'), {
  loading: () => null,
});

export default function AssessmentMain() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  // ✅ recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

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

  // ================= RECORD AUDIO =================
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

  // ================= NEXT QUESTION =================
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

      // ✅ Check if next question was included in upload response
      if (uploadResponse.next_question) {
        logger.info('📬 Next question received from upload response:', uploadResponse.next_question.question.question_id);

        const nextQuestion = uploadResponse.next_question.question;

        // Check if section changed to next section
        if (nextQuestion.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', nextQuestion.section_name);
          router.push('/communication/listen-and-repeat');
          return;
        }

        // Update current question with the next question from upload response
        setCurrentQuestion({
          question_id: nextQuestion.question_id,
          question_text: nextQuestion.question_text,
          question_type: nextQuestion.question_type || 'VOICE',
          section_name: nextQuestion.section_name,
          section_id: undefined, // Backend returns string, frontend expects number - omit for now
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
      } else {
        // Fallback: If next_question not in response, fetch it separately
        logger.warn('⚠️ Next question not in upload response, fetching separately...');
        const response = await getNextQuestion({
          session_id: sessionId,
          question_id: currentQuestion.question_id,
        });

        if (response.completed) {
          router.push('/communication/feedback');
          return;
        }

        // Check if section changed to next section
        if (response.section_name !== currentQuestion.section_name) {
          logger.info('✅ Section changed from', currentQuestion.section_name, 'to:', response.section_name);
          router.push('/communication/listen-and-repeat');
          return;
        }

        setCurrentQuestion(response);
      }
    } catch (err: any) {
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
      <SectionStartModal
        open={showModal}
        onStart={handleStartSection}
        title="Section 1: See and Repeat"
        subtitle="Read the sentences and pronounce the highlighted word clearly"
        questions={8}
        instructions={[
          'Read the sentence displayed on screen',
          'Focus on the highlighted word',
          'Click "Start Recording" when ready',
          'Pronounce the highlighted word clearly',
          'You have 15 seconds for each recording',
        ]}
      />

      <div className="min-h-screen bg-[#F4F6FB] flex">
        <AssessmentSidebar currentSectionId={1} />

        <main className="flex-1 px-8 py-6">
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-lg text-black font-semibold">
                  {currentQuestion?.section_name}
                </h1>
                <p className="text-sm text-gray-500">
                  Read the sentence and pronounce the highlighted word clearly.
                </p>
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <p className="text-lg text-black">{currentQuestion?.question_text}</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                maxDuration={15}
                onRecordingComplete={handleRecordingComplete}
              />
              {/* {hasRecording && (
                <p className="text-green-600 text-sm mt-3">
                  ✔ Recording saved
                </p>
              )} */}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Question {currentQuestion?.question_number} of{' '}
              {currentQuestion?.total_questions}
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
        </main>
      </div>
    </>
  );
}




// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder'; // Import your audio recorder component

// // Sample questions data - replace with your actual data
// const questionsData = {
//   'See and Repeat': [
//     { id: 1, question: 'Look at the word "HELLO" and repeat it clearly.' },
//     { id: 2, question: 'Look at the phrase "Good Morning" and repeat it.' },
//     { id: 3, question: 'Look at the sentence "I am learning English" and repeat it.' },
//     { id: 4, question: 'Look at "Communication is important" and repeat it.' },
//     { id: 5, question: 'Look at "Practice makes perfect" and repeat it.' },
//     { id: 6, question: 'Look at "Welcome to the assessment" and repeat it.' },
//     { id: 7, question: 'Look at "Thank you for your time" and repeat it.' },
//   ],
// };

// interface AssessmentQuestionPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function AssessmentQuestionPage({
//   sectionName = 'See and Repeat',
//   sectionDescription = 'View and repeat the given content clearly and accurately',
// }: AssessmentQuestionPageProps) {
//   const router = useRouter();
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [recordedAudios, setRecordedAudios] = useState<{ [key: number]: Blob }>({});

//   const questions = questionsData[sectionName as keyof typeof questionsData] || [];
//   const currentQuestion = questions[currentQuestionIndex];
//   const totalQuestions = questions.length;
//   const questionNumber = currentQuestionIndex + 1;

//   const handleRecordingComplete = (audioBlob: Blob) => {
//     setRecordedAudios((prev) => ({
//       ...prev,
//       [currentQuestionIndex]: audioBlob,
//     }));
//     // // console.log('Recording saved for question:', questionNumber);
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       // Navigate to next section or results page
//       router.push('/next-section');
//     }
//   };

//   const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
//       {/* Background Decoration */}
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40"></div>

//       <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
//         {/* Header Section - Top Left */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-3">
//             <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
//               SECTION
//             </span>
//             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
//               {sectionName}
//             </h1>
//           </div>
//           <p className="text-slate-600 text-lg ml-0">
//             {sectionDescription}
//           </p>
//         </div>

//         {/* Main Content Area */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Left Side - Question */}
//           <div className="flex flex-col justify-start">
//             <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-8 h-full">
//               <div className="mb-6">
//                 <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-2 rounded-lg">
//                   Question {questionNumber}
//                 </span>
//               </div>
              
//               <div className="prose prose-lg max-w-none">
//                 <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-relaxed mb-6">
//                   {currentQuestion?.question}
//                 </h2>
                
//                 <div className="mt-8 p-6 bg-indigo-50 rounded-xl border-l-4 border-indigo-500">
//                   <p className="text-slate-700 font-medium flex items-start gap-3">
//                     <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <span>
//                       Read the text carefully and record your answer by clicking the "Start Recording" button on the right.
//                     </span>
//                   </p>
//                 </div>
//               </div>

//               {/* Recording Status Indicator */}
//               {recordedAudios[currentQuestionIndex] && (
//                 <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
//                   <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
//                     <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                   </div>
//                   <div>
//                     <p className="font-semibold text-emerald-800">Recording Saved</p>
//                     <p className="text-sm text-emerald-600">You can re-record if needed</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right Side - Audio Recorder */}
//           <div className="flex flex-col">
//             <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-8 h-full flex flex-col">
//               {/* Question Progress - Top Right */}
//               <div className="mb-8 flex justify-end">
//                 <div className="bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-4 rounded-2xl border-2 border-indigo-200 shadow-sm">
//                   <p className="text-sm text-slate-600 uppercase tracking-widest font-semibold mb-1 text-center">
//                     Progress
//                   </p>
//                   <p className="text-3xl font-bold text-center">
//                     <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
//                       {questionNumber}
//                     </span>
//                     <span className="text-slate-400 mx-2">/</span>
//                     <span className="text-slate-600">{totalQuestions}</span>
//                   </p>
//                 </div>
//               </div>

//               {/* Audio Recorder Component */}
//               <div className="flex-1 flex items-center justify-center">
//                 <AudioRecorder 
//                   onRecordingComplete={handleRecordingComplete}
//                   maxDuration={15}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom Section - Next Button (Right Aligned) */}
//         <div className="flex justify-end">
//           <button
//             onClick={handleNext}
//             disabled={!recordedAudios[currentQuestionIndex]}
//             className={`group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl transform transition-all duration-300 ${
//               recordedAudios[currentQuestionIndex]
//                 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             <span>{isLastQuestion ? 'Complete Section' : 'Next Question'}</span>
//             <svg 
//               className={`w-5 h-5 transition-transform ${recordedAudios[currentQuestionIndex] ? 'group-hover:translate-x-1' : ''}`}
//               fill="none" 
//               viewBox="0 0 24 24" 
//               stroke="currentColor"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//             </svg>
//           </button>
//         </div>

//         {/* Progress Bar */}
//         <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm font-medium text-slate-700">Section Progress</span>
//             <span className="text-sm font-bold text-indigo-600">
//               {Math.round((questionNumber / totalQuestions) * 100)}%
//             </span>
//           </div>
//           <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
//             <div
//               className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
//               style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
//             ></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
