// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// const questions = [
//   'How do you ensure grammatical accuracy in your communication?',
//   'Describe your approach to learning grammar rules.',
//   'What grammar rules do you find most challenging?',
//   'How do you self-correct grammatical errors?',
//   'Describe your experience with advanced grammar concepts.',
//   'How does grammar affect the clarity of your message?',
//   'What strategies do you use to master complex grammar?',
//   'How do you balance grammar accuracy with fluency?',
// ];

// export default function GrammarPage() {
//   const router = useRouter();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//     } else {
//       router.push('/feedback');
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div className="bg-white px-6 py-3 rounded-full shadow-lg border-2 border-sky-200">
//             <span className="text-lg font-bold text-sky-600">
//               {currentQuestion + 1}/{questions.length}
//             </span>
//           </div>

//           <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-3 rounded-full shadow-lg">
//             <h1 className="text-xl font-bold text-white">Grammar 📝</h1>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
//           {/* Left Side - Question */}
//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <div className="flex items-start space-x-4">
//               <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
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

//             <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-100">
//               <h3 className="text-sm font-semibold text-sky-600 uppercase mb-3">Recording Guidelines</h3>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-sky-400 rounded-full mr-3"></span>
//                   You have 15 seconds to record your answer
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-sky-400 rounded-full mr-3"></span>
//                   Speak clearly and at a moderate pace
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-sky-400 rounded-full mr-3"></span>
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

// // Sample questions data for Sentence Completion section
// const questionsData = [
//   {
//     id: 1,
//     sentence: 'I usually _______ to work by bus every morning.',
//     blank: 'go',
//     hint: 'verb of movement',
//   },
//   {
//     id: 2,
//     sentence: 'She has been _______ for this company for five years.',
//     blank: 'working',
//     hint: 'present perfect continuous',
//   },
//   {
//     id: 3,
//     sentence: 'The movie was so _______ that everyone fell asleep.',
//     blank: 'boring',
//     hint: 'adjective describing the movie',
//   },
//   {
//     id: 4,
//     sentence: 'If I _______ enough money, I would buy a new car.',
//     blank: 'had',
//     hint: 'conditional sentence',
//   },
//   {
//     id: 5,
//     sentence: 'The children are playing _______ in the garden.',
//     blank: 'happily',
//     hint: 'adverb',
//   },
//   {
//     id: 6,
//     sentence: 'We need to _______ this project by next Friday.',
//     blank: 'complete/finish',
//     hint: 'verb meaning to finish',
//   },
//   {
//     id: 7,
//     sentence: 'The weather _______ been very cold lately.',
//     blank: 'has',
//     hint: 'present perfect auxiliary verb',
//   },
//   {
//     id: 8,
//     sentence: 'She is looking forward _______ meeting you tomorrow.',
//     blank: 'to',
//     hint: 'preposition',
//   },
// ];

// interface SentenceCompletionPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function SentenceCompletionPage({
//   sectionName = 'Sentence Completion',
//   sectionDescription = 'Complete the sentences with appropriate words and record your answer',
// }: SentenceCompletionPageProps) {
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
//       router.push('/listen-and-correct');
//     }
//   };

//   const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

//   // Split sentence by blank (_______)
//   const renderSentenceWithBlank = () => {
//     const parts = currentQuestion.sentence.split('_______');
//     return (
//       <div className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
//         {parts.map((part, index) => (
//           <span key={index}>
//             {part}
//             {index < parts.length - 1 && (
//               <span className="inline-block mx-2 px-0 py-2  rounded-lg border-dashed">
//                 <span className="text-gray-900 font-bold">_______</span>
//               </span>
//             )}
//           </span>
//         ))}
//       </div>
//     );
//   };

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
//           {/* Left Side - Question with Blank */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Question {questionNumber}
//               </span>
//             </div>
            
//             <h2 className="text-lg font-semibold text-gray-800 mb-6">
//               Fill in the blank with the appropriate word:
//             </h2>

//             {/* Sentence with Blank */}
//             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 mb-6">
//               {renderSentenceWithBlank()}
//             </div>

//             {/* Hint Section */}
//             {/* <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
//               <div className="flex items-start gap-2">
//                 <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                 </svg>
//                 <div>
//                   <p className="text-sm font-semibold text-blue-900 mb-1">Hint:</p>
//                   <p className="text-sm text-blue-800">{currentQuestion.hint}</p>
//                 </div>
//               </div>
//             </div> */}

//             {/* Instructions */}
//             <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
//               <p className="text-sm text-gray-700 flex items-start gap-2">
//                 <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//                 <span>
//                   💡 Think about the correct word to fill in the blank, then record the complete sentence using the recorder on the right.
//                 </span>
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
// before ui change




// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// const questionsData = [
//   {
//     id: 1,
//     sentence: 'We need to _______ our strategy to meet the new market demands.',
//     options: [
//       { id: 'A', text: 'adjust' },
//       { id: 'B', text: 'modify' },
//       { id: 'C', text: 'revise' },
//       { id: 'D', text: 'adapt' },
//     ],
//     correctAnswer: 'D',
//   },
//   {
//     id: 2,
//     sentence: 'She decided to _______ her decision after receiving new information.',
//     options: [
//       { id: 'A', text: 'repeat' },
//       { id: 'B', text: 'revise' },
//       { id: 'C', text: 'ignore' },
//       { id: 'D', text: 'refuse' },
//     ],
//     correctAnswer: 'B',
//   },
// ];

// export default function SentenceCompletionPage() {
//   const router = useRouter();
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
//     {}
//   );

//   const currentQuestion = questionsData[currentQuestionIndex];
//   const totalQuestions = questionsData.length;
//   const questionNumber = currentQuestionIndex + 1;
//   const selectedOption = selectedAnswers[currentQuestionIndex];

//   const handleSelect = (optionId: string) => {
//     setSelectedAnswers((prev) => ({
//       ...prev,
//       [currentQuestionIndex]: optionId,
//     }));
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       router.push('/communication/listen-and-correct');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F4F6FB]">
//       <div className="max-w-7xl mx-auto px-6 py-6">
//         {/* HEADER */}
//         <div className="mb-4">
//           <h1 className="text-lg font-semibold text-gray-900">
//             Sentence Completion
//           </h1>
//           <p className="text-sm text-gray-500">
//             Test vocabulary and context understanding.
//           </p>
//         </div>

//         {/* PROGRESS */}
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
//                 style={{
//                   width: `${(questionNumber / totalQuestions) * 100}%`,
//                 }}
//               />
//             </div>
//           </div>

//           {/* TIMER (UI ONLY) */}
//           <div className="bg-black text-white px-4 py-2 rounded-md font-mono text-lg">
//             12:00
//           </div>
//         </div>

//         {/* MAIN CONTENT */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* LEFT CARD */}
//           <div className="bg-white rounded-xl p-6 shadow-sm border">
//             <p className="text-sm text-gray-500 mb-6">
//               Select the most appropriate word to complete the sentence.
//             </p>

//             <p className="text-xs uppercase text-gray-400 mb-2">
//               Sentence
//             </p>

//             <p className="text-xl font-medium text-gray-900 leading-relaxed">
//               {currentQuestion.sentence}
//             </p>

//             <div className="mt-6 bg-amber-50 border-t border-amber-300 p-4 rounded-b-xl">
//               <p className="text-sm text-amber-700 flex items-center gap-2">
//                 💡 AI Tip: Consider the context and tone of the sentence when
//                 choosing your answer.
//               </p>
//             </div>
//           </div>

//           {/* RIGHT CARD */}
//           <div className="bg-white rounded-xl p-6 shadow-sm border">
//             <h3 className="text-sm font-semibold mb-4">
//               Select correct answer:
//             </h3>

//             <div className="space-y-3">
//               {currentQuestion.options.map((option) => (
//                 <div
//                   key={option.id}
//                   onClick={() => handleSelect(option.id)}
//                   className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition ${
//                     selectedOption === option.id
//                       ? 'border-blue-600 bg-blue-50'
//                       : 'border-gray-300 hover:border-blue-400'
//                   }`}
//                 >
//                   <div className="flex items-center gap-3">
//                     <span className="font-semibold">
//                       ({option.id})
//                     </span>
//                     <span className="text-gray-700">
//                       {option.text}
//                     </span>
//                   </div>
//                   <span
//                     className={`w-4 h-4 rounded-full border ${
//                       selectedOption === option.id
//                         ? 'border-blue-600 bg-blue-600'
//                         : 'border-gray-400'
//                     }`}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* FOOTER */}
//         <div className="flex justify-between items-center mt-8">
//           <p className="text-sm text-gray-500">
//             Question {questionNumber} of {totalQuestions} in this section
//           </p>

//           <button
//             onClick={handleNext}
//             disabled={!selectedOption}
//             className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
//               selectedOption
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
// before sidebar added



'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { textToSpeechAndRecord, saveAudioRecording } from '@/utils/audioUtils';

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
      console.log('➡️ Sentence Completion - Now showing question:', response.question_id);
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

    console.log('✅ Selected answer:', optionText);
    console.log('✅ Completed sentence:', completedSent);

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

      console.log('🔊 Audio blob created (muted), size:', audioBlob.size);

      // Save the audio blob (like listen-and-repeat section)
      await saveAudioRecording(currentQuestion.question_id, audioBlob);
      setAudioSaved(true);

      console.log('✅ Audio recording saved to sessionStorage');
    } catch (err) {
      console.error('❌ Error converting to audio:', err);
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
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      console.log('🔍 [Sentence Completion] Next question response:', {
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

      // Check if section changed to next section (Listen and Correct)
      // Backend may return "Sentence Completion" or similar
      if (response.section_name !== 'Sentence Completion') {
        console.log('✅ Section changed from "Sentence Completion" to:', response.section_name);
        console.log('🚀 Routing to listen-and-correct page');
        router.push('/communication/listen-and-correct');
        return;
      }

      console.log('➡️ Staying in Sentence Completion section, showing next question');
      setCurrentQuestion(response);
      setSelectedAnswer(null); // Reset selected answer
      setAudioSaved(false); // Reset audio saved state
      setCompletedSentence(''); // Reset completed sentence
    } catch (err: any) {
      console.error('❌ Error fetching next question:', err);
      setError(err.message || 'Failed to fetch next question');
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

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : error ? (
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

                    {/* Audio Saved Confirmation */}
                    {audioSaved && !isConvertingAudio && (
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
                    )}

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
                    {loading ? 'Loading...' : 'Next Question →'}
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
