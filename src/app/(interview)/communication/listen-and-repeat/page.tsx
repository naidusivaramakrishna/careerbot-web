// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// // Sample questions data for Listen and Repeat section
// const questionsData = {
//   'Listen and Repeat': [
//     { 
//       id: 1, 
//       audioUrl: '/audio/question1.mp3', // Replace with your actual audio file paths
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 2, 
//       audioUrl: '/audio/question2.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 3, 
//       audioUrl: '/audio/question3.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 4, 
//       audioUrl: '/audio/question4.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 5, 
//       audioUrl: '/audio/question5.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 6, 
//       audioUrl: '/audio/question6.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 7, 
//       audioUrl: '/audio/question7.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//     { 
//       id: 8, 
//       audioUrl: '/audio/question8.mp3',
//       description: 'Listen to the audio and repeat what you hear clearly.'
//     },
//   ],
// };

// interface ListenAndRepeatPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function ListenAndRepeatPage({
//   sectionName = 'Listen and Repeat',
//   sectionDescription = 'Listen carefully and repeat what you hear',
// }: ListenAndRepeatPageProps) {
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
//     console.log('Recording saved for question:', questionNumber);
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       router.push('/next-section');
//     }
//   };

//   const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header Section */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
//             {sectionName}
//           </h1>
//           <p className="text-gray-600 text-sm">
//             {sectionDescription}
//           </p>
//         </div>

//         {/* Progress Bar */}
//         <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm font-medium text-gray-700">
//               Question {questionNumber} of {totalQuestions}
//             </span>
//             <span className="text-sm font-semibold text-indigo-600">
//               {Math.round((questionNumber / totalQuestions) * 100)}%
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           {/* Left Side - Audio Player */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Question {questionNumber}
//               </span>
//             </div>
            
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               Listen to the Audio
//             </h2>

//             {/* Audio Player */}
//             <div className="mb-6 p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
//               {/* <div className="flex items-center justify-center mb-4">
//                 <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
//                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
//                   </svg>
//                 </div>
//               </div> */}
              
//               <audio 
//                 controls 
//                 className="w-full"
//                 key={currentQuestionIndex}
//                 controlsList="nodownload"
//               >
//                 <source src={currentQuestion?.audioUrl} type="audio/mpeg" />
//                 Your browser does not support the audio element.
//               </audio>
//             </div>
            
//             <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 {currentQuestion?.description}
//               </p>
//             </div>

//             {/* Recording Status */}
//             {recordedAudios[currentQuestionIndex] && (
//               <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
//                 <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                 </svg>
//                 <span className="text-sm font-medium text-green-800">Recording Saved</span>
//               </div>
//             )}
//           </div>

//           {/* Right Side - Audio Recorder */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <AudioRecorder 
//               onRecordingComplete={handleRecordingComplete}
//               maxDuration={15}
//             />
//           </div>
//         </div>

//         {/* Bottom Section - Next Button */}
//         <div className="flex justify-end">
//           <button
//             onClick={handleNext}
//             disabled={!recordedAudios[currentQuestionIndex]}
//             className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
//               recordedAudios[currentQuestionIndex]
//                 ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             {isLastQuestion ? 'Complete Section' : 'Next Question →'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '../components/AudioRecorder';
import AssessmentSidebar from '../components/AssessmentSidebar';
import TextToSpeechPlayer from '../components/TextToSpeechPlayer';
import SectionStartModal from '../components/SectionStartModal';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveAudioRecording } from '@/utils/audioUtils';

export default function ListenAndRepeatPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

  const isVoiceSection =
    currentQuestion?.question_type === 'VOICE' ||
    ['See and Repeat', 'Listen and Repeat', 'Listen and Correct', 'Situation Explaining']
      .includes(currentQuestion?.section_name || '');

  // Fetch current question
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      console.log('➡️ Now showing question:', response.question_id);
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

  // Record audio
  const handleRecordingComplete = async (blob: Blob) => {
    if (!currentQuestion?.question_id) return;

    setAudioRecordings((prev) => ({
      ...prev,
      [currentQuestion.question_id]: blob,
    }));

    if (isVoiceSection) {
      await saveAudioRecording(currentQuestion.question_id, blob);
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

      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      if (response.completed) {
        router.push('/communication/feedback');
        return;
      }

      // Check if section changed to next section
      if (response.section_name !== 'Listen and Repeat') {
        console.log('✅ Navigating to next section:', response.section_name);
        // Route to appropriate next section
        router.push('/communication/jumbled-sentences');
        return;
      }

      setCurrentQuestion(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch next question');
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
        title="Section 2: Listen and Repeat"
        subtitle="Listen carefully and repeat what you hear"
        questions={8}
        instructions={[
          'Click "Play Audio" button to listen to the question',
          'You can play the audio ONLY ONCE - listen carefully!',
          'You CANNOT replay the audio after playing it once',
          'Click "Start Recording" when ready to record your answer',
          'You have 15 seconds for each recording',
        ]}
      />

      <div className="min-h-screen bg-[#F4F6FB] flex">
        <AssessmentSidebar currentSectionId={2} />

        <main className="flex-1 px-8 py-6">
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-lg text-black font-semibold">
                  {currentQuestion?.section_name || 'Listen and Repeat'}
                </h1>
                <p className="text-sm text-gray-500">
                  Listen carefully and repeat what you hear
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
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <>
                  <div className="mb-6">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                      Question {currentQuestion?.question_number}
                    </span>
                  </div>

                  {currentQuestion?.question_text && (
                    <TextToSpeechPlayer
                      text={currentQuestion.question_text}
                      autoPlay={true}
                    />
                  )}

                  {hasRecording && (
                    <div className="mt-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
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
                      <span className="text-sm font-medium text-green-800">
                        Recording Saved
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                maxDuration={15}
                onRecordingComplete={handleRecordingComplete}
              />
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
