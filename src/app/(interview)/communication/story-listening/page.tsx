// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// const questions = [
//   'What is your writing process from start to finish?',
//   'How do you ensure clarity and coherence in your writing?',
//   'Describe a significant writing project you completed.',
//   'How do you handle writer\'s block?',
//   'What techniques do you use for effective editing?',
//   'How do you adapt your writing style for different audiences?',
//   'Describe your experience with professional writing.',
//   'How do you organize your thoughts before writing?',
// ];

// export default function WritingSkillsPage() {
//   const router = useRouter();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//     } else {
//       router.push('/vocabulary');
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div className="bg-white px-6 py-3 rounded-full shadow-lg border-2 border-amber-200">
//             <span className="text-lg font-bold text-amber-600">
//               {currentQuestion + 1}/{questions.length}
//             </span>
//           </div>

//           <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 rounded-full shadow-lg">
//             <h1 className="text-xl font-bold text-white">Writing Skills ✍️</h1>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
//           {/* Left Side - Question */}
//           <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
//             <div className="flex items-start space-x-4">
//               <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
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

//             <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
//               <h3 className="text-sm font-semibold text-amber-600 uppercase mb-3">Recording Guidelines</h3>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
//                   You have 15 seconds to record your answer
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
//                   Speak clearly and at a moderate pace
//                 </li>
//                 <li className="flex items-center">
//                   <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
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

// import { useState, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import StoryAudioPlayer from '../components/StoryAudioPlayer';

// // Sample data for Story Listening section
// const storiesData = [
//   {
//     id: 1,
//     title: 'A Day at the Beach',
//     audioUrl: '/audio/story1.mp3', // Replace with your actual audio file path
//     duration: '2:30',
//     questions: [
//       {
//         id: 1,
//         question: 'Where did the family go for their vacation?',
//         options: [
//           { id: 'A', text: 'To the mountains' },
//           { id: 'B', text: 'To the beach' },
//           { id: 'C', text: 'To the city' },
//           { id: 'D', text: 'To a farm' },
//         ],
//         correctAnswer: 'B',
//       },
//       {
//         id: 2,
//         question: 'What did the children do at the beach?',
//         options: [
//           { id: 'A', text: 'They went fishing' },
//           { id: 'B', text: 'They played volleyball' },
//           { id: 'C', text: 'They built sandcastles' },
//           { id: 'D', text: 'They went surfing' },
//         ],
//         correctAnswer: 'C',
//       },
//       {
//         id: 3,
//         question: 'How did the family feel about their day?',
//         options: [
//           { id: 'A', text: 'They were tired and bored' },
//           { id: 'B', text: 'They were happy and enjoyed it' },
//           { id: 'C', text: 'They were disappointed' },
//           { id: 'D', text: 'They wanted to go home early' },
//         ],
//         correctAnswer: 'B',
//       },
//     ],
//   },
//   // {
//   //   id: 2,
//   //   title: 'The Lost Puppy',
//   //   audioUrl: '/audio/story2.mp3',
//   //   duration: '2:45',
//   //   questions: [
//   //     {
//   //       id: 1,
//   //       question: 'What did Sarah find in the park?',
//   //       options: [
//   //         { id: 'A', text: 'A lost kitten' },
//   //         { id: 'B', text: 'A lost puppy' },
//   //         { id: 'C', text: 'A toy' },
//   //         { id: 'D', text: 'A ball' },
//   //       ],
//   //       correctAnswer: 'B',
//   //     },
//   //     {
//   //       id: 2,
//   //       question: 'What color was the puppy?',
//   //       options: [
//   //         { id: 'A', text: 'Black and white' },
//   //         { id: 'B', text: 'Brown and white' },
//   //         { id: 'C', text: 'Golden brown' },
//   //         { id: 'D', text: 'Gray' },
//   //       ],
//   //       correctAnswer: 'C',
//   //     },
//   //     {
//   //       id: 3,
//   //       question: 'How did Sarah help the puppy?',
//   //       options: [
//   //         { id: 'A', text: 'She took it to a shelter' },
//   //         { id: 'B', text: 'She kept it as her pet' },
//   //         { id: 'C', text: 'She found the owner using the tag' },
//   //         { id: 'D', text: 'She called the police' },
//   //       ],
//   //       correctAnswer: 'C',
//   //     },
//   //   ],
//   // },
//   // {
//   //   id: 3,
//   //   title: 'The School Competition',
//   //   audioUrl: '/audio/story3.mp3',
//   //   duration: '3:00',
//   //   questions: [
//   //     {
//   //       id: 1,
//   //       question: 'What kind of competition was held at school?',
//   //       options: [
//   //         { id: 'A', text: 'A sports competition' },
//   //         { id: 'B', text: 'A science fair' },
//   //         { id: 'C', text: 'A spelling bee' },
//   //         { id: 'D', text: 'An art contest' },
//   //       ],
//   //       correctAnswer: 'B',
//   //     },
//   //     {
//   //       id: 2,
//   //       question: 'What was Tom\'s project about?',
//   //       options: [
//   //         { id: 'A', text: 'Solar energy' },
//   //         { id: 'B', text: 'Water pollution' },
//   //         { id: 'C', text: 'Plant growth' },
//   //         { id: 'D', text: 'Recycling' },
//   //       ],
//   //       correctAnswer: 'A',
//   //     },
//   //     {
//   //       id: 3,
//   //       question: 'What prize did Tom win?',
//   //       options: [
//   //         { id: 'A', text: 'Third place' },
//   //         { id: 'B', text: 'Second place' },
//   //         { id: 'C', text: 'First place' },
//   //         { id: 'D', text: 'He did not win' },
//   //       ],
//   //       correctAnswer: 'C',
//   //     },
//   //   ],
//   // },
// ];

// interface StoryListeningPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function StoryListeningPage({
//   sectionName = 'Story Listening',
//   sectionDescription = 'Listen to stories and answer comprehension questions',
// }: StoryListeningPageProps) {
//   const router = useRouter();
//   const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 means showing audio
//   const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
//   const [hasListenedToAudio, setHasListenedToAudio] = useState(false);
//   const [audioHasPlayed, setAudioHasPlayed] = useState(false);
//   const audioRef = useRef<HTMLAudioElement>(null);

//   const currentStory = storiesData[currentStoryIndex];
//   const totalStories = storiesData.length;
//   const storyNumber = currentStoryIndex + 1;

//   // Check if we're on audio page or question page
//   const isAudioPage = currentQuestionIndex === -1;
//   const currentQuestion = !isAudioPage ? currentStory.questions[currentQuestionIndex] : null;
//   const totalQuestionsInStory = currentStory.questions.length;
//   const questionNumber = currentQuestionIndex + 1;

//   // Create unique key for storing answers
//   const getAnswerKey = () => `story${currentStoryIndex}_q${currentQuestionIndex}`;

//   // Handle audio play - restrict to once only
//   const handleAudioPlay = () => {
//     if (audioHasPlayed) {
//       if (audioRef.current) {
//         audioRef.current.pause();
//       }
//       alert('You can only listen to this story once. Please proceed to the questions.');
//     } else {
//       setAudioHasPlayed(true);
//       setHasListenedToAudio(true);
//     }
//   };

//   const handleOptionSelect = (optionId: string) => {
//     setSelectedAnswers((prev) => ({
//       ...prev,
//       [getAnswerKey()]: optionId,
//     }));
//   };

//   const handleNext = () => {
//     // If on audio page, move to first question
//     if (isAudioPage) {
//       if (hasListenedToAudio) {
//         setCurrentQuestionIndex(0);
//       } else {
//         alert('Please listen to the audio story before proceeding to questions.');
//       }
//       return;
//     }

//     // If on question page
//     if (currentQuestionIndex < totalQuestionsInStory - 1) {
//       // Move to next question in current story
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       // All questions answered for current story
//       if (currentStoryIndex < totalStories - 1) {
//         // Move to next story
//         setCurrentStoryIndex((prev) => prev + 1);
//         setCurrentQuestionIndex(-1); // Reset to audio page
//         setHasListenedToAudio(false);
//         setAudioHasPlayed(false); // Reset for next story
//       } else {
//         // All stories completed
//         router.push('/situation-explaining');
//       }
//     }
//   };

//   const selectedOption = !isAudioPage ? selectedAnswers[getAnswerKey()] : null;
//   const isLastQuestionOfLastStory = 
//     currentStoryIndex === totalStories - 1 && 
//     currentQuestionIndex === totalQuestionsInStory - 1;

//   // Calculate overall progress
//   const totalQuestions = storiesData.reduce((sum, story) => sum + story.questions.length, 0);
//   const answeredQuestions = Object.keys(selectedAnswers).length;
//   const overallProgress = Math.round((answeredQuestions / totalQuestions) * 100);

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
//               Story {storyNumber} of {totalStories}
//               {!isAudioPage && ` - Question ${questionNumber} of ${totalQuestionsInStory}`}
//             </span>
//             <span className="text-sm font-semibold text-indigo-600">
//               {overallProgress}% Complete
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${overallProgress}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* Story Title */}
//         {/* <div className="mb-6">
//           <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-4 shadow-md">
//             <div className="flex items-center justify-between">
//               <div>
//                 <span className="text-sm font-semibold opacity-90">Story {storyNumber}</span>
//                 <h2 className="text-2xl font-bold mt-1">{currentStory.title}</h2>
//               </div>
//               <div className="bg-white/20 px-4 py-2 rounded-lg">
//                 <span className="text-sm font-semibold">{currentStory.duration}</span>
//               </div>
//             </div>
//           </div>
//         </div> */}

//         {/* Audio Page */}
//         {isAudioPage && (
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
//             <div className="max-w-2xl mx-auto">
//               {/* <div className="text-center mb-6">
//                 <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
//                   <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-2">Listen to the Story</h3>
//                 <p className="text-gray-600 text-sm">
//                   Listen carefully to the audio story. You will answer questions about it next.
//                 </p>
//               </div> */}

//               {/* Audio Player */}
//               {/* <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
//                 <audio 
//                   ref={audioRef}
//                   controls 
//                   className="w-full"
//                   key={currentStoryIndex}
//                   controlsList="nodownload"
//                   onPlay={handleAudioPlay}
//                   onEnded={() => setHasListenedToAudio(true)}
//                 >
//                   <source src="/at-the-coffee-shop.mp3" type="audio/mpeg" />
//                   Your browser does not support the audio element.
//                 </audio>
//               </div> */}
//               <StoryAudioPlayer
//   src={currentStory.audioUrl}
//   onFirstPlay={() => {
//     setAudioHasPlayed(true);
//     setHasListenedToAudio(true);
//   }}
// />


//               <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
//                 <p className="text-sm text-amber-900 flex items-start gap-2 font-semibold">
//                   <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                   </svg>
//                   <span>
//                     ⚠️ Important: You can only listen to this story ONCE. Listen carefully before proceeding to questions.
//                   </span>
//                 </p>
//               </div>

//               {hasListenedToAudio && (
//                 <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
//                   <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                   <span className="text-sm font-medium text-green-800">Audio Completed - Ready to Continue</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Question Page */}
//         {!isAudioPage && currentQuestion && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//             {/* Left Side - Question */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//               <div className="mb-4">
//                 <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                   Question {questionNumber} of {totalQuestionsInStory}
//                 </span>
//               </div>
              
//               <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                 {currentQuestion.question}
//               </h2>

//               <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
//                     <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
//                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
//                     </svg>
//                   </div>
//                   <p className="text-sm font-semibold text-gray-800">Based on the story: {currentStory.title}</p>
//                 </div>
//                 <p className="text-sm text-gray-600">
//                   Select the correct answer from the options on the right.
//                 </p>
//               </div>

//               {/* Selection Status */}
//               {selectedOption && (
//                 <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
//                   <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                   <span className="text-sm font-medium text-green-800">Answer Selected</span>
//                 </div>
//               )}
//             </div>

//             {/* Right Side - Options */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Select Your Answer
//               </h3>

//               <div className="space-y-3">
//                 {currentQuestion.options.map((option) => (
//                   <div
//                     key={option.id}
//                     onClick={() => handleOptionSelect(option.id)}
//                     className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                       selectedOption === option.id
//                         ? 'border-indigo-600 bg-indigo-50'
//                         : 'border-gray-200 hover:border-indigo-300 bg-white'
//                     }`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div
//                         className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
//                           selectedOption === option.id
//                             ? 'border-indigo-600 bg-indigo-600 text-white'
//                             : 'border-gray-300 text-gray-600'
//                         }`}
//                       >
//                         {option.id}
//                       </div>
//                       <p className="text-base font-medium text-gray-900 flex-1">
//                         {option.text}
//                       </p>
//                       {selectedOption === option.id && (
//                         <svg className="w-6 h-6 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Bottom Section - Next Button */}
//         <div className="flex justify-end">
//           <button
//             onClick={handleNext}
//             disabled={!isAudioPage && !selectedOption}
//             className={`px-8 py-3 rounded-lg font-semibold text-base transition-all ${
//               (isAudioPage && hasListenedToAudio) || (!isAudioPage && selectedOption)
//                 ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             {isAudioPage 
//               ? 'Start Questions →'
//               : isLastQuestionOfLastStory 
//                 ? 'Complete Section' 
//                 : currentQuestionIndex === totalQuestionsInStory - 1
//                   ? 'Next Story →'
//                   : 'Next Question →'
//             }
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// before UI changes



'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StoryAudioPlayer from '../components/StoryAudioPlayer';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';

// Sample data for Story Listening section
const storiesData = [
  {
    id: 1,
    title: 'A Day at the Beach',
    audioUrl: '/audio/story1.mp3',
    duration: '2:30',
    questions: [
      {
        id: 1,
        question: 'Where did the family go for their vacation?',
        options: [
          { id: 'A', text: 'To the mountains' },
          { id: 'B', text: 'To the beach' },
          { id: 'C', text: 'To the city' },
          { id: 'D', text: 'To a farm' },
        ],
        correctAnswer: 'B',
      },
      {
        id: 2,
        question: 'What did the children do at the beach?',
        options: [
          { id: 'A', text: 'They went fishing' },
          { id: 'B', text: 'They played volleyball' },
          { id: 'C', text: 'They built sandcastles' },
          { id: 'D', text: 'They went surfing' },
        ],
        correctAnswer: 'C',
      },
      {
        id: 3,
        question: 'How did the family feel about their day?',
        options: [
          { id: 'A', text: 'They were tired and bored' },
          { id: 'B', text: 'They were happy and enjoyed it' },
          { id: 'C', text: 'They were disappointed' },
          { id: 'D', text: 'They wanted to go home early' },
        ],
        correctAnswer: 'B',
      },
    ],
  },
];

interface StoryListeningPageProps {
  sectionName?: string;
  sectionDescription?: string;
}

export default function StoryListeningPage({
  sectionName = 'Story Listening',
  sectionDescription = 'Listen to stories and answer comprehension questions',
}: StoryListeningPageProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [currentStoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );
  const [hasListenedToAudio, setHasListenedToAudio] = useState(false);
  // const audioRef = useRef<HTMLAudioElement>(null);

  const currentStory = storiesData[currentStoryIndex];
  const totalStories = storiesData.length;
  const storyNumber = currentStoryIndex + 1;

  const isAudioPage = currentQuestionIndex === -1;
  const currentQuestion = !isAudioPage
    ? currentStory.questions[currentQuestionIndex]
    : null;

  const totalQuestionsInStory = currentStory.questions.length;
  const questionNumber = currentQuestionIndex + 1;

  const getAnswerKey = () =>
    `story${currentStoryIndex}_q${currentQuestionIndex}`;

  const handleOptionSelect = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [getAnswerKey()]: optionId,
    }));
  };

  const handleNext = () => {
    if (isAudioPage) {
      if (hasListenedToAudio) {
        setCurrentQuestionIndex(0);
      }
      return;
    }

    if (currentQuestionIndex < totalQuestionsInStory - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      router.push('/communication/situation-explaining');
    }
  };

  const selectedOption = !isAudioPage
    ? selectedAnswers[getAnswerKey()]
    : null;

  const totalQuestions = storiesData.reduce(
    (sum, story) => sum + story.questions.length,
    0
  );
  const answeredQuestions = Object.keys(selectedAnswers).length;
  const overallProgress = Math.round(
    (answeredQuestions / totalQuestions) * 100
  );

  return (
    <>
    {/* 🔔 START MODAL */}
          <SectionStartModal
            open={showModal}
            onStart={() => setShowModal(false)}
            title="Section 1: See and Repeat"
            subtitle="Read the sentences and pronounce the highlighted word clearly"
            questions={8}
            duration="2 min"
            instructions={[
              'Read the sentence displayed on screen',
              'Focus on the highlighted word',
              'Click "Start Recording" when ready',
              'Pronounce the highlighted word clearly',
              'You have 15 seconds for each recording',
            ]}
          />
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* LEFT SIDEBAR */}
      <AssessmentSidebar currentSectionId={6} />

      {/* MAIN CONTENT */}
      <main className="flex-1 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {sectionName}
            </h1>
            <p className="text-gray-600 text-sm">{sectionDescription}</p>
          </div>

          {/* PROGRESS BAR */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
            <div className="flex justify-between text-sm mb-2">
              <span>
                Story {storyNumber} of {totalStories}
                {!isAudioPage &&
                  ` — Question ${questionNumber} of ${totalQuestionsInStory}`}
              </span>
              <span className="text-indigo-600 font-semibold">
                {overallProgress}% Complete
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* AUDIO PAGE */}
          {isAudioPage && (
            <div className="bg-white rounded-lg p-8 border mb-6">
              <StoryAudioPlayer
                src={currentStory.audioUrl}
                onFirstPlay={() => setHasListenedToAudio(true)}
              />

              {hasListenedToAudio && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✔ Audio completed. You may proceed.
                </div>
              )}
            </div>
          )}

          {/* QUESTION PAGE */}
          {!isAudioPage && currentQuestion && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`p-4 border rounded-lg mb-3 cursor-pointer ${
                      selectedOption === option.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {option.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!isAudioPage && !selectedOption}
              className={`px-8 py-3 rounded-lg font-semibold ${
                (isAudioPage && hasListenedToAudio) ||
                (!isAudioPage && selectedOption)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAudioPage ? 'Start Questions →' : 'Next →'}
            </button>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
