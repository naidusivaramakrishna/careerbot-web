// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// const questions = [
//   'How do you expand your vocabulary regularly?',
//   'Describe how you use context clues to understand new words.',
//   'What role does vocabulary play in effective communication?',
//   'How do you remember and retain new vocabulary?',
//   'Describe your experience with learning technical vocabulary.',
//   'How do you choose appropriate words for different contexts?',
//   'What strategies do you use to learn synonyms and antonyms?',
//   'How do you apply new vocabulary in your daily communication?',
// ];

// export default function VocabularyPage() {
//   const router = useRouter();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//     } else {
//       router.push('/grammar');
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div className="bg-white px-6 py-3 rounded-full shadow-lg border-2 border-violet-200">
//             <span className="text-lg font-bold text-violet-600">
//               {currentQuestion + 1}/{questions.length}
//             </span>
//           </div>

//           <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 rounded-full shadow-lg">
//             <h1 className="text-xl font-bold text-white">Vocabulary 📚</h1>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
//           {/* Left Side - Question */}
//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <div className="flex items-start space-x-4">
//               <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
//                   Question {currentQuestion + 1}
//                 </h2>
//                 <p className="text-2xl lg:text-3xl font-bold text-gray-800 leading-relaxed">
//                   {questions[currentQuestion]}
//                 </p>
//               </div>
//             </div>

//             <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
//               <h3 className="text-sm font-semibold text-violet-600 uppercase mb-3">Recording Guidelines</h3>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-violet-400 rounded-full mr-3"></span>
//                   You have 15 seconds to record your answer
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-violet-400 rounded-full mr-3"></span>
//                   Speak clearly and at a moderate pace
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-violet-400 rounded-full mr-3"></span>
//                   Click Start to begin recording
//                 </li>
//               </ul>
//             </div>
//           </div>

//           {/* Right Side - Audio Recording */}
//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <AudioRecorder maxDuration={15} />
//           </div>
//         </div>

//         {/* Navigation Buttons */}
//         <div className="flex justify-between mt-12">
//           <button
//             onClick={handlePrevious}
//             disabled={currentQuestion === 0}
//             className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-3"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//             <span>Previous</span>
//           </button>

//           <button
//             onClick={handleNext}
//             className="group px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3"
//           >
//             <span>{currentQuestion === questions.length - 1 ? 'Next Section' : 'Next Question'}</span>
//             <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// // Sample questions data for Listen and Correct section
// const questionsData = [
//   {
//     id: 1,
//     audioUrl: '/audio/listen-correct-1.mp3', // Replace with your actual audio file path
//     incorrectSentence: 'She go to school every day.',
//     correctSentence: 'She goes to school every day.',
//     error: 'Verb agreement error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 2,
//     audioUrl: '/audio/listen-correct-2.mp3',
//     incorrectSentence: 'They was playing football yesterday.',
//     correctSentence: 'They were playing football yesterday.',
//     error: 'Verb form error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 3,
//     audioUrl: '/audio/listen-correct-3.mp3',
//     incorrectSentence: 'I have went to the market.',
//     correctSentence: 'I have gone to the market.',
//     error: 'Past participle error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 4,
//     audioUrl: '/audio/listen-correct-4.mp3',
//     incorrectSentence: 'He don\'t like coffee.',
//     correctSentence: 'He doesn\'t like coffee.',
//     error: 'Contraction error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 5,
//     audioUrl: '/audio/listen-correct-5.mp3',
//     incorrectSentence: 'The book are on the table.',
//     correctSentence: 'The book is on the table.',
//     error: 'Subject-verb agreement',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 6,
//     audioUrl: '/audio/listen-correct-6.mp3',
//     incorrectSentence: 'She is more taller than her brother.',
//     correctSentence: 'She is taller than her brother.',
//     error: 'Comparative adjective error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 7,
//     audioUrl: '/audio/listen-correct-7.mp3',
//     incorrectSentence: 'We was waiting for the bus.',
//     correctSentence: 'We were waiting for the bus.',
//     error: 'Verb agreement error',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
//   {
//     id: 8,
//     audioUrl: '/audio/listen-correct-8.mp3',
//     incorrectSentence: 'He can sings very well.',
//     correctSentence: 'He can sing very well.',
//     error: 'Modal verb usage',
//     description: 'Listen to the sentence carefully. It contains a grammatical error. Record the corrected version.',
//   },
// ];

// interface ListenAndCorrectPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function ListenAndCorrectPage({
//   sectionName = 'Listen and Correct',
//   sectionDescription = 'Listen to sentences with errors and record the corrected versions',
// }: ListenAndCorrectPageProps) {
//   const router = useRouter();
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [recordedAudios, setRecordedAudios] = useState<{ [key: number]: Blob }>({});

//   const currentQuestion = questionsData[currentQuestionIndex];
//   const totalQuestions = questionsData.length;
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
//       router.push('/story-listening');
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
//               Listen to the Sentence
//             </h2>

//             {/* Audio Player */}
//             <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
//               <div className="flex items-center justify-center mb-4">
//                 <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
//                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
//                   </svg>
//                 </div>
//               </div>
              
//               <audio 
//                 controls 
//                 className="w-full"
//                 key={currentQuestionIndex}
//                 controlsList="nodownload"
//               >
//                 <source src={currentQuestion.audioUrl} type="audio/mpeg" />
//                 Your browser does not support the audio element.
//               </audio>
//             </div>

//             {/* Error Type Hint */}
//             <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
//               <div className="flex items-start gap-2">
//                 <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//                 <div>
//                   <p className="text-sm font-semibold text-red-900 mb-1">Error Type:</p>
//                   <p className="text-sm text-red-800">{currentQuestion.error}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Instructions */}
//             <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 {currentQuestion.description}
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
//  before ui chanes


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// const questionsData = [
//   {
//     id: 1,
//     audioUrl: '/audio/listen-correct-1.mp3',
//   },
//   {
//     id: 2,
//     audioUrl: '/audio/listen-correct-2.mp3',
//   },
// ];

// export default function ListenAndCorrectPage() {
//   const router = useRouter();
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [recordedAudios, setRecordedAudios] = useState<Record<number, Blob>>({});

//   const totalQuestions = questionsData.length;
//   const questionNumber = currentQuestionIndex + 1;
//   const currentQuestion = questionsData[currentQuestionIndex];

//   const handleRecordingComplete = (audio: Blob) => {
//     setRecordedAudios((prev) => ({
//       ...prev,
//       [currentQuestionIndex]: audio,
//     }));
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       router.push('/communication/story-listening');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F4F6FB]">
//       <div className="max-w-7xl mx-auto px-6 py-6">

//         {/* HEADER */}
//         <div className="mb-4">
//           <h1 className="text-lg font-semibold text-gray-900">
//             Listen & Correct
//           </h1>
//           <p className="text-sm text-gray-500">
//             Listen to audio contains an error.
//           </p>
//         </div>

//         {/* PROGRESS + TIMER */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex-1 mr-6">
//             <div className="flex justify-between text-sm text-gray-600 mb-1">
//               <span>
//                 {questionNumber} of {totalQuestions} Questions
//               </span>
//             </div>
//             <div className="w-full bg-gray-200 h-1 rounded-full">
//               <div
//                 className="bg-green-500 h-1 rounded-full transition-all"
//                 style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
//               />
//             </div>
//           </div>

//           {/* TIMER UI */}
//           <div className="bg-black text-white px-4 py-2 rounded-md font-mono text-lg">
//             12:00
//           </div>
//         </div>

//         {/* MAIN CONTENT */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//           {/* LEFT CARD */}
//           <div className="bg-white rounded-xl p-6 shadow-sm border">
//             <p className="text-sm text-gray-500 mb-6">
//               Listen carefully. The sentence contains a mistake. Record the corrected version.
//             </p>

//             {/* AUDIO CARD */}
//             <div className="border rounded-xl p-5 mb-6">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
//                   <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M8 5v14l11-7z" />
//                   </svg>
//                 </div>
//                 <p className="text-sm font-medium">
//                   Listen carefully – audio plays once
//                 </p>
//               </div>

//               <audio
//                 controls
//                 controlsList="nodownload noplaybackrate"
//                 className="w-full"
//                 key={currentQuestionIndex}
//               >
//                 <source src={currentQuestion.audioUrl} type="audio/mpeg" />
//               </audio>

//               {/* Fake waveform
//               <div className="mt-4 flex gap-1">
//                 {Array.from({ length: 30 }).map((_, i) => (
//                   <div
//                     key={i}
//                     className="w-1 bg-orange-400 rounded"
//                     style={{ height: `${10 + (i % 5) * 6}px` }}
//                   />
//                 ))}
//               </div> */}
//             </div>

//             {/* AI TIP */}
//             <div className="bg-amber-50 border-t border-amber-300 p-4 rounded-b-xl">
//               <p className="text-sm text-amber-700">
//                 💡 AI Tip: Listen carefully for grammatical errors. Common mistakes include subject-verb agreement and tense usage.
//               </p>
//             </div>
//           </div>

//           {/* Right Side - Audio Recorder */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//              <AudioRecorder 
//                onRecordingComplete={handleRecordingComplete}
//                maxDuration={15}
//            />
//           </div>
//          </div>

//         {/* FOOTER */}
//         <div className="flex justify-between items-center mt-8">
//           <p className="text-sm text-gray-500">
//             Record the corrected sentence clearly.
//           </p>

//           <button
//             onClick={handleNext}
//             disabled={!recordedAudios[currentQuestionIndex]}
//             className={`px-6 py-3 rounded-lg font-semibold transition ${
//               recordedAudios[currentQuestionIndex]
//                 ? 'bg-blue-600 text-white hover:bg-blue-700'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             Next Question →
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// before sidebar


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '../components/AudioRecorder';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';
import TextToSpeechPlayer from '../components/TextToSpeechPlayer';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveAudioRecording } from '@/utils/audioUtils';

export default function ListenAndCorrectPage() {
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

  // Fetch current question from API
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getCurrentQuestion(sessionId);
      setCurrentQuestion(response);
      console.log('➡️ Listen and Correct - Now showing question:', response.question_id);
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

      console.log('🔍 [Listen and Correct] Next question response:', {
        completed: response.completed,
        section_name: response.section_name,
        question_id: response.question_id,
        question_number: response.question_number,
        total_questions: response.total_questions,
      });

      if (response.completed) {
        console.log('✅ Assessment completed, routing to feedback');
        router.push('/communication/feedback');
        return;
      }

      // Check if section changed to next section
      if (response.section_name !== 'Listen and Correct') {
        console.log('✅ Section changed from "Listen and Correct" to:', response.section_name);
        console.log('🚀 Routing to next section page');
        // Route to appropriate next section (update this based on your flow)
        router.push('/communication/story-listening');
        return;
      }

      console.log('➡️ Staying in Listen and Correct section, showing next question');
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
    {/* 🔔 START MODAL */}
          <SectionStartModal
            open={showModal}
            onStart={handleStartSection}
            title="Section 5: Listen and Correct"
            subtitle="Listen to sentences with errors and record the corrected versions"
            questions={8}
            instructions={[
              'Click "Play Audio" button to listen to the question',
              'You can play the audio ONLY ONCE - listen carefully!',
              'The sentence contains a grammatical error',
              'Click "Start Recording" when ready to record the corrected sentence',
              'You have 15 seconds for each recording',
            ]}
          />
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* LEFT SIDEBAR */}
      <AssessmentSidebar currentSectionId={5}/>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-8 py-6">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentQuestion?.section_name || 'Listen and Correct'}
            </h1>
            <p className="text-sm text-gray-500">
              Listen to audio contains an error.
            </p>
          </div>

          {/* PROGRESS */}
          <div className="bg-white rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-600">
                  {currentQuestion?.question_number} of{' '}
                  {currentQuestion?.total_questions} Questions
                </p>
              </div>
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

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT CARD */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
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

                  <p className="text-sm text-gray-500 mb-6">
                    Listen carefully. The sentence contains a mistake. Record the corrected version.
                  </p>

                  {currentQuestion?.question_text && (
                    <TextToSpeechPlayer
                      text={currentQuestion.question_text}
                      autoPlay={false}
                    />
                  )}

                  {/* AI TIP */}
                  {/* <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <p className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-600">💡</span>
                      <span>
                        AI Tip: Listen carefully for grammatical errors. Common mistakes include subject-verb agreement and tense usage.
                      </span>
                    </p>
                  </div> */}

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

            {/* RIGHT SIDE - AUDIO RECORDER */}
            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
              <AudioRecorder
                key={currentQuestion?.question_id}
                onRecordingComplete={handleRecordingComplete}
                maxDuration={15}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-8">
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
              {loading ? 'Loading...' : 'Next Question →'}
            </button>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
