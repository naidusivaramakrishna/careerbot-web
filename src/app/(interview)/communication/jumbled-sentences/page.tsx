// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// const questions = [
//   'How do you prepare for important presentations?',
//   'Describe your public speaking experience.',
//   'How do you handle speaking anxiety?',
//   'What techniques do you use to engage your audience?',
//   'Describe a successful presentation you delivered.',
//   'How do you adapt your speaking style for different audiences?',
//   'What is your approach to impromptu speaking?',
//   'How do you use vocal variety in your speech?',
// ];

// export default function SpeakingSkillsPage() {
//   const router = useRouter();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//     } else {
//       router.push('/reading-comprehension');
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex justify-between items-center mb-8">
//           <div className="bg-white px-6 py-3 rounded-full shadow-lg border-2 border-rose-200">
//             <span className="text-lg font-bold text-rose-600">
//               {currentQuestion + 1}/{questions.length}
//             </span>
//           </div>

//           <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-8 py-3 rounded-full shadow-lg">
//             <h1 className="text-xl font-bold text-white">Speaking Skills 🗣️</h1>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <div className="flex items-start space-x-4">
//               <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
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

//             <div className="mt-8 p-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100">
//               <h3 className="text-sm font-semibold text-rose-600 uppercase mb-3">Recording Guidelines</h3>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
//                   You have 15 seconds to record your answer
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
//                   Speak clearly and at a moderate pace
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
//                   Click Start to begin recording
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <AudioRecorder maxDuration={15} />
//           </div>
//         </div>

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

// // Sample questions data for Jumbled Sentences section
// const questionsData = [
//   {
//     id: 1,
//     jumbledWords: [
//       { num: 1, word: 'playing' },
//       { num: 2, word: 'children' },
//       { num: 3, word: 'are' },
//       { num: 4, word: 'park' },
//       { num: 5, word: 'the' },
//       { num: 6, word: 'in' },
//       { num: 7, word: 'the' },
//     ],
//     options: [
//       { id: 'A', order: '2-3-1-6-5-7-4', text: 'The children are playing in the park' },
//       { id: 'B', order: '5-2-3-1-6-7-4', text: 'The children are playing the in park' },
//       { id: 'C', order: '2-3-1-5-7-4-6', text: 'Children are playing the park in the' },
//       { id: 'D', order: '1-2-3-6-5-4-7', text: 'Playing children are in the park the' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 2,
//     jumbledWords: [
//       { num: 1, word: 'read' },
//       { num: 2, word: 'I' },
//       { num: 3, word: 'books' },
//       { num: 4, word: 'love' },
//       { num: 5, word: 'to' },
//     ],
//     options: [
//       { id: 'A', order: '2-4-5-1-3', text: 'I love to read books' },
//       { id: 'B', order: '2-5-1-4-3', text: 'I to read love books' },
//       { id: 'C', order: '4-2-5-1-3', text: 'Love I to read books' },
//       { id: 'D', order: '2-1-3-4-5', text: 'I read books love to' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 3,
//     jumbledWords: [
//       { num: 1, word: 'beautiful' },
//       { num: 2, word: 'sky' },
//       { num: 3, word: 'is' },
//       { num: 4, word: 'the' },
//       { num: 5, word: 'today' },
//     ],
//     options: [
//       { id: 'A', order: '4-2-3-1-5', text: 'The sky is beautiful today' },
//       { id: 'B', order: '4-1-2-3-5', text: 'The beautiful sky is today' },
//       { id: 'C', order: '5-4-2-3-1', text: 'Today the sky is beautiful' },
//       { id: 'D', order: '2-3-1-4-5', text: 'Sky is beautiful the today' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 4,
//     jumbledWords: [
//       { num: 1, word: 'homework' },
//       { num: 2, word: 'finished' },
//       { num: 3, word: 'she' },
//       { num: 4, word: 'her' },
//       { num: 5, word: 'has' },
//     ],
//     options: [
//       { id: 'A', order: '3-5-2-4-1', text: 'She has finished her homework' },
//       { id: 'B', order: '3-2-5-4-1', text: 'She finished has her homework' },
//       { id: 'C', order: '5-3-2-4-1', text: 'Has she finished her homework' },
//       { id: 'D', order: '3-4-1-5-2', text: 'She her homework has finished' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 5,
//     jumbledWords: [
//       { num: 1, word: 'delicious' },
//       { num: 2, word: 'my' },
//       { num: 3, word: 'food' },
//       { num: 4, word: 'mother' },
//       { num: 5, word: 'cooks' },
//     ],
//     options: [
//       { id: 'A', order: '2-4-5-1-3', text: 'My mother cooks delicious food' },
//       { id: 'B', order: '2-4-1-5-3', text: 'My mother delicious cooks food' },
//       { id: 'C', order: '4-2-5-1-3', text: 'Mother my cooks delicious food' },
//       { id: 'D', order: '1-3-2-4-5', text: 'Delicious food my mother cooks' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 6,
//     jumbledWords: [
//       { num: 1, word: 'every' },
//       { num: 2, word: 'exercise' },
//       { num: 3, word: 'day' },
//       { num: 4, word: 'I' },
//       { num: 5, word: 'do' },
//     ],
//     options: [
//       { id: 'A', order: '4-5-2-1-3', text: 'I do exercise every day' },
//       { id: 'B', order: '4-2-5-1-3', text: 'I exercise do every day' },
//       { id: 'C', order: '1-3-4-5-2', text: 'Every day I do exercise' },
//       { id: 'D', order: '2-4-5-1-3', text: 'Exercise I do every day' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 7,
//     jumbledWords: [
//       { num: 1, word: 'dog' },
//       { num: 2, word: 'the' },
//       { num: 3, word: 'barking' },
//       { num: 4, word: 'is' },
//       { num: 5, word: 'loudly' },
//     ],
//     options: [
//       { id: 'A', order: '2-1-4-3-5', text: 'The dog is barking loudly' },
//       { id: 'B', order: '2-1-3-4-5', text: 'The dog barking is loudly' },
//       { id: 'C', order: '1-2-4-3-5', text: 'Dog the is barking loudly' },
//       { id: 'D', order: '3-5-2-1-4', text: 'Barking loudly the dog is' },
//     ],
//     correctAnswer: 'A',
//   },
//   {
//     id: 8,
//     jumbledWords: [
//       { num: 1, word: 'going' },
//       { num: 2, word: 'we' },
//       { num: 3, word: 'beach' },
//       { num: 4, word: 'are' },
//       { num: 5, word: 'the' },
//       { num: 6, word: 'to' },
//     ],
//     options: [
//       { id: 'A', order: '2-4-1-6-5-3', text: 'We are going to the beach' },
//       { id: 'B', order: '2-1-4-6-5-3', text: 'We going are to the beach' },
//       { id: 'C', order: '2-4-6-1-5-3', text: 'We are to going the beach' },
//       { id: 'D', order: '1-6-5-3-2-4', text: 'Going to the beach we are' },
//     ],
//     correctAnswer: 'A',
//   },
// ];

// interface JumbledSentencesPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function JumbledSentencesPage({
//   sectionName = 'Jumbled Sentences',
//   sectionDescription = 'Arrange words in the correct order to form meaningful sentences',
// }: JumbledSentencesPageProps) {
//   const router = useRouter();
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});

//   const currentQuestion = questionsData[currentQuestionIndex];
//   const totalQuestions = questionsData.length;
//   const questionNumber = currentQuestionIndex + 1;

//   const handleOptionSelect = (optionId: string) => {
//     setSelectedAnswers((prev) => ({
//       ...prev,
//       [currentQuestionIndex]: optionId,
//     }));
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       router.push('/sentence-completion');
//     }
//   };

//   const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
//   const selectedOption = selectedAnswers[currentQuestionIndex];

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
//           {/* Left Side - Jumbled Words */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Question {questionNumber}
//               </span>
//             </div>
            
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               Arrange the words in correct order
//             </h2>

//             {/* Jumbled Words Display */}
//             <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
//               <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
//                 Jumbled Words:
//               </h3>
//               <div className="flex flex-wrap gap-3">
//                 {currentQuestion.jumbledWords.map((item) => (
//                   <div
//                     key={item.num}
//                     className="bg-white px-4 py-3 rounded-lg shadow-sm border-2 border-indigo-200 flex items-center gap-2"
//                   >
//                     <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
//                       {item.num}
//                     </span>
//                     <span className="text-gray-900 font-medium text-lg">
//                       {item.word}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-6 bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 Look at the numbered words above and select the correct order from the options on the right.
//               </p>
//             </div>

//             {/* Selection Status */}
//             {selectedOption && (
//               <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
//                 <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                 </svg>
//                 <span className="text-sm font-medium text-green-800">Answer Selected</span>
//               </div>
//             )}
//           </div>

//           {/* Right Side - Options */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Select the Correct Order
//             </h3>

//             <div className="space-y-3">
//               {currentQuestion.options.map((option) => (
//                 <div
//                   key={option.id}
//                   onClick={() => handleOptionSelect(option.id)}
//                   className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                     selectedOption === option.id
//                       ? 'border-indigo-600 bg-indigo-50'
//                       : 'border-gray-200 hover:border-indigo-300 bg-white'
//                   }`}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div
//                       className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
//                         selectedOption === option.id
//                           ? 'border-indigo-600 bg-indigo-600 text-white'
//                           : 'border-gray-300 text-gray-600'
//                       }`}
//                     >
//                       {option.id}
//                     </div>
//                     <div className="flex-1">
//                       <p className="text-xs font-mono text-gray-500 mb-1">
//                         Order: {option.order}
//                       </p>
//                       <p className="text-base font-medium text-gray-900">
//                         {option.text}
//                       </p>
//                     </div>
//                     {selectedOption === option.id && (
//                       <svg className="w-6 h-6 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Bottom Section - Next Button */}
//         <div className="flex justify-end">
//           <button
//             onClick={handleNext}
//             disabled={!selectedOption}
//             className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
//               selectedOption
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

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveTextAnswer, textToSpeechAndRecord, saveAudioRecording } from '@/utils/audioUtils';

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
      console.log('➡️ Jumbled Sentences - Now showing question:', response.question_id);
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

    console.log('✅ Selected ordering:', optionOrdering);
    console.log('✅ Constructed sentence:', constructedSentence);

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

      console.log('🔊 Audio blob created (muted), size:', audioBlob.size);

      // Save the audio blob (like sentence-completion section)
      await saveAudioRecording(currentQuestion.question_id, audioBlob);
      setAudioSaved(true);

      console.log('✅ Audio recording saved to sessionStorage');
    } catch (err) {
      console.error('❌ Error converting to audio:', err);
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
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
      });

      console.log('🔍 [Jumbled Sentences] Next question response:', {
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
      // Backend returns "Jumbled Sentence" (singular, no 's')
      if (response.section_name !== 'Jumbled Sentence') {
        console.log('✅ Section changed from "Jumbled Sentence" to:', response.section_name);
        console.log('🚀 Routing to sentence-completion page');
        router.push('/communication/sentence-completion');
        return;
      }

      console.log('➡️ Staying in Jumbled Sentence section, showing next question');
      setCurrentQuestion(response);
      setSelectedAnswer(null); // Reset selection for new question
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
                Question {currentQuestion?.question_number || 0} of {currentQuestion?.total_questions || 0}
              </span>
              <span className="text-sm font-semibold text-indigo-600">
                {Math.round(((currentQuestion?.question_number || 0) / (currentQuestion?.total_questions || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion?.question_number || 0) / (currentQuestion?.total_questions || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
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

                  {/* Selection Status */}
                  {selectedAnswer && (
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
                  )}
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
              disabled={!selectedAnswer || loading}
              className={`px-8 py-3 rounded-lg font-semibold ${
                selectedAnswer && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
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
