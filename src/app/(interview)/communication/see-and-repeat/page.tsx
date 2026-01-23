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
//     console.log('Recording saved for question:', questionNumber);
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
//         {/* Header Section - Top */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-3">
//             <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
//               SECTION
//             </span>
//             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
//               {sectionName}
//             </h1>
//           </div>
//           <p className="text-slate-600 text-lg mb-6">
//             {sectionDescription}
//           </p>

//           {/* Progress Bar - Directly Below Section Description */}
//           <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-5 border border-slate-200">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-4">
//                 <span className="text-sm font-bold text-slate-700">Section Progress</span>
//                 <div className="flex items-center gap-2">
//                   <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
//                     {questionNumber}
//                   </span>
//                   <span className="text-slate-400 text-lg font-medium">/</span>
//                   <span className="text-lg font-semibold text-slate-600">{totalQuestions}</span>
//                   <span className="text-sm text-slate-500 ml-1">questions</span>
//                 </div>
//               </div>
//               <span className="text-lg font-bold text-indigo-600 px-4 py-2 bg-indigo-50 rounded-lg">
//                 {Math.round((questionNumber / totalQuestions) * 100)}%
//               </span>
//             </div>
//             <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
//               <div
//                 className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
//                 style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
//               ></div>
//             </div>
//           </div>
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
//               {/* Audio Recorder Component - Centered */}
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
//       </div>
//     </div>
//   );
// }


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

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
//       <div className="container px-6 py-8 w-full">
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
//           {/* Left Side - Question */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Question {questionNumber}
//               </span>
//             </div>
            
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               {currentQuestion?.question}
//             </h2>
            
//             <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 Read the text carefully and record your answer using the recorder on the right.
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

// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

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
//           {/* Left Side - Question */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Question {questionNumber}
//               </span>
//             </div>
            
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               {currentQuestion?.question}
//             </h2>
            
//             <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 Read the text carefully and record your answer using the recorder on the right.
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

// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';
// import { Lock } from 'lucide-react';

// const questions = [
//   {
//     sentence: 'The entrepreneur successfully pitched their innovative startup idea.',
//     highlight: 'entrepreneur',
//   },
//   {
//     sentence: 'The engineer designed an efficient solution.',
//     highlight: 'engineer',
//   },
// ];

// const sections = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity', active: true },
//   { id: 2, title: 'Listen & Repeat', desc: 'Assess your listening accuracy' },
//   { id: 3, title: 'Jumbled Sentence', desc: 'Evaluate sentence structure understanding' },
//   { id: 4, title: 'Sentence Completion', desc: 'Test vocabulary and context understanding' },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   { id: 6, title: 'Story Listening', desc: 'Evaluate comprehension and retention' },
// ];

// export default function AssessmentQuestionPage() {
//   const router = useRouter();
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [recorded, setRecorded] = useState<{ [key: number]: Blob }>({});

//   const current = questions[currentIndex];
//   const questionProgress = ((currentIndex + 1) / questions.length) * 100;

//   const handleRecordingComplete = (blob: Blob) => {
//     setRecorded((prev) => ({ ...prev, [currentIndex]: blob }));
//   };

//   const handleNext = () => {
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex((p) => p + 1);
//     } else {
//       router.push('/next-section');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F4F6FB] flex">
//       {/* LEFT SIDEBAR */}
//       <aside className="w-80 bg-white border-r px-4 py-6">
//         <h2 className="text-sm font-semibold text-gray-700 mb-4">
//           Assessment Progress
//         </h2>

//         <div className="mb-6">
//           <div className="flex justify-between text-xs text-gray-500 mb-1">
//             <span>Section 1 of 7</span>
//             <span className="text-blue-600 font-medium">2% Complete</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div className="bg-blue-600 h-2 rounded-full w-[2%]" />
//           </div>
//         </div>

//         <ul className="space-y-3">
//           {sections.map((s) => (
//             <li
//               key={s.id}
//               className={`flex items-start justify-between p-3 rounded-lg border ${
//                 s.active
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-gray-200 bg-gray-50 text-gray-400'
//               }`}
//             >
//               {/* TEXT */}
//               <div>
//                 <p className={`text-sm font-semibold ${s.active ? 'text-blue-700' : ''}`}>
//                   Section {s.id}
//                 </p>
//                 <p className="text-sm">{s.title}</p>
//                 <p className="text-xs">{s.desc}</p>
//               </div>

//               {/* ICON — RIGHT SIDE */}
//               <div className="pt-1">
//                 {s.active ? (
//                   <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
//                 ) : (
//                   <Lock size={14} />
//                 )}
//               </div>
//             </li>
//           ))}
//         </ul>

//         <p className="text-xs text-gray-400 mt-6">
//           Complete sections in order <br />
//           Locked sections will unlock as you progress
//         </p>
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 px-8 py-6">
//         {/* HEADER */}
//         <div className="bg-white rounded-lg p-5 mb-6">
//           <div className="flex justify-between items-center mb-2">
//             <div>
//               <h1 className="text-lg font-semibold">See and Repeat</h1>
//               <p className="text-sm text-gray-500">
//                 Read the sentence and pronounce the highlighted word clearly.
//               </p>
//             </div>
//             <p className="text-sm text-gray-600">
//               {currentIndex + 1} of {questions.length} Questions
//             </p>
//           </div>

//           {/* QUESTION PROGRESS BAR */}
//           <div className="w-full bg-gray-200 h-1 rounded-full">
//             <div
//               className="bg-green-500 h-1 rounded-full transition-all"
//               style={{ width: `${questionProgress}%` }}
//             />
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* SENTENCE CARD */}
//           <div className="bg-white rounded-xl p-6 shadow-sm">
//             <p className="text-sm text-gray-500 mb-4">
//               Read the sentence and only pronounce the{' '}
//               <span className="text-orange-500 font-semibold">highlighted word</span> clearly.
//             </p>

//             <p className="text-lg text-gray-800 leading-relaxed">
//               {current.sentence.split(current.highlight)[0]}
//               <span className="bg-yellow-200 px-1 rounded font-semibold">
//                 {current.highlight}
//               </span>
//               {current.sentence.split(current.highlight)[1]}
//             </p>

//             <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
//               💡 <strong>AI Tip:</strong> Focus on pronouncing clearly. Take a breath before speaking.
//             </div>
//           </div>

//           {/* RECORDING */}
//           <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
//             <h3 className="text-sm font-semibold mb-4">Record your response:</h3>

//             <AudioRecorder
//               maxDuration={15}
//               onRecordingComplete={handleRecordingComplete}
//             />

//             {recorded[currentIndex] && (
//               <p className="text-green-600 text-sm mt-3">✔ Recording saved</p>
//             )}
//           </div>
//         </div>

//         {/* FOOTER */}
//         <div className="flex justify-between items-center mt-6">
//           <p className="text-sm text-gray-500">
//             Question {currentIndex + 1} of {questions.length} in this section
//           </p>

//           <button
//             onClick={handleNext}
//             disabled={!recorded[currentIndex]}
//             className={`px-6 py-3 rounded-lg font-semibold transition ${
//               recorded[currentIndex]
//                 ? 'bg-blue-600 text-white hover:bg-blue-700'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             Next Question →
//           </button>
//         </div>
//       </main>
//     </div>
//   );
// }
//main


// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';
// import AssessmentSidebar from '../components/AssessmentSidebar';
// import SectionStartModal from '../components/SectionStartModal';
// import { getCurrentQuestion, getNextQuestion, CurrentQuestionResponse, NextQuestionResponse } from '@/api/communicationApi';
// import { saveAudioRecording } from '@/utils/audioUtils';

// const questions = [
//   {
//     sentence: 'The entrepreneur successfully pitched their innovative startup idea.',
//     highlight: 'entrepreneur',
//   },
//   {
//     sentence: 'The engineer designed an efficient solution.',
//     highlight: 'engineer',
//   },
// ];

// export default function AssessmentMain() {
//   const router = useRouter();
//   const [showModal, setShowModal] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [recorded, setRecorded] = useState<{ [key: number]: Blob }>({});
//   const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionResponse | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [audioRecordings, setAudioRecordings] = useState<{ [questionId: string]: Blob }>({});

//   const current = questions[currentIndex];
//   const questionProgress = ((currentIndex + 1) / questions.length) * 100;

//   // Check if current section requires audio recording (sections 1, 2, 5, 7)
//   const isVoiceSection = currentQuestion?.question_type === 'VOICE' ||
//     ['See and Repeat', 'Listen and Repeat', 'Listen and Correct', 'Situation Explaining'].includes(currentQuestion?.section_name || '');

//   const fetchCurrentQuestion = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       // Check localStorage contents for debugging
//       console.log('🔍 Checking localStorage for session_id...');
//       const sessionId = localStorage.getItem('session_id');
//       console.log('📦 Retrieved session_id from localStorage:', sessionId);

//       if (!sessionId) {
//         console.error('❌ Session ID is null or undefined');
//         throw new Error('Session ID not found. Please start from the beginning.');
//       }

//       console.log('📤 Calling getCurrentQuestion API with session_id:', sessionId);
//       const response = await getCurrentQuestion(sessionId);
//       console.log('✅ Current question fetched:', response);
//       setCurrentQuestion(response);
//     } catch (err: any) {
//       console.error('❌ Error fetching current question:', err);
//       setError(err?.response?.data?.message || err.message || 'Failed to fetch question. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartSection = async () => {
//     setShowModal(false);
//     await fetchCurrentQuestion();
//   };

//   const handleRecordingComplete = async (blob: Blob) => {
//     setRecorded((prev) => ({ ...prev, [currentIndex]: blob }));

//     // Save audio recording with question_id for voice sections (1, 2, 5, 7)
//     if (isVoiceSection && currentQuestion?.question_id) {
//       setAudioRecordings((prev) => ({
//         ...prev,
//         [currentQuestion.question_id]: blob,
//       }));

//       // Save to sessionStorage for persistence across navigation
//       try {
//         await saveAudioRecording(currentQuestion.question_id, blob);
//       } catch (error) {
//         console.error('Error saving audio recording:', error);
//       }
//     }
//   };

//   const fetchNextQuestion = async () => {
//     setLoading(true);
//     setError('');
//     setRecorded({}); // Clear recorded state for new question

//     try {
//       const sessionId = localStorage.getItem('session_id');
//       if (!sessionId) {
//         throw new Error('Session ID not found. Please start from the beginning.');
//       }

//       // Get the current question_id to send to the API
//       if (!currentQuestion?.question_id) {
//         throw new Error('Current question ID not found. Cannot fetch next question.');
//       }

//       console.log('📤 Fetching next question with current question_id:', currentQuestion.question_id);

//       const response = await getNextQuestion({
//         session_id: sessionId,
//         question_id: currentQuestion.question_id  // Pass current question_id
//       });
//       console.log('✅ Next question fetched:', response);

//       // Check if assessment is completed
//       if (response.completed) {
//         console.log('✅ Assessment completed!');
//         router.push('/communication/feedback');
//         return;
//       }

//       // Update current question
//       setCurrentQuestion(response);
//       setCurrentIndex((prev) => prev + 1);

//     } catch (err: any) {
//       console.error('❌ Error fetching next question:', err);
//       setError(err?.response?.data?.message || err.message || 'Failed to fetch next question. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNext = async () => {
//     await fetchNextQuestion();
//   };

//   return (
//     <>
//     {/* 🔔 START MODAL */}
//       <SectionStartModal
//         open={showModal}
//         onStart={handleStartSection}
//         title="Section 1: See and Repeat"
//         subtitle="Read the sentences and pronounce the highlighted word clearly"
//         questions={8}
//         // duration="2 min"
//         instructions={[
//           'Read the sentence displayed on screen',
//           'Focus on the highlighted word',
//           'Click "Start Recording" when ready',
//           'Pronounce the highlighted word clearly',
//           'You have 15 seconds for each recording',
//         ]}
//       />

//     <div className="min-h-screen bg-[#F4F6FB] flex">
//       {/* LEFT SIDEBAR */}
//       <AssessmentSidebar currentSectionId={1}/>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 px-8 py-6">
//         {/* HEADER */}
//         <div className="bg-white rounded-lg p-5 mb-6">
//           <div className="flex justify-between items-center mb-2">
//             <div>
//               <h1 className="text-lg font-semibold">
//                 {currentQuestion?.section_name || 'See and Repeat'}
//               </h1>
//               <p className="text-sm text-gray-500">
//                 Read the sentence and pronounce the highlighted word clearly.
//               </p>
//             </div>
//             <p className="text-sm text-gray-600">
//               {currentQuestion?.question_number || currentIndex + 1} of {currentQuestion?.total_questions || questions.length} Questions
//             </p>
//           </div>

//           {/* QUESTION PROGRESS */}
//           <div className="w-full bg-gray-200 h-1 rounded-full">
//             <div
//               className="bg-green-500 h-1 rounded-full transition-all"
//               style={{
//                 width: currentQuestion
//                   ? `${((currentQuestion.question_number || 1) / (currentQuestion.total_questions || 1)) * 100}%`
//                   : `${questionProgress}%`
//               }}
//             />
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* SENTENCE CARD */}
//           <div className="bg-white rounded-xl p-6 shadow-sm">
//             {loading ? (
//               <div className="flex items-center justify-center h-64">
//                 <div className="text-center">
//                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                   <p className="text-gray-600">Loading question...</p>
//                 </div>
//               </div>
//             ) : error ? (
//               <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
//                 {error}
//               </div>
//             ) : currentQuestion ? (
//               <>
//                 <p className="text-sm text-gray-500 mb-4">
//                   Read the sentence and only pronounce the{' '}
//                   <span className="text-orange-500 font-semibold">highlighted word</span> clearly.
//                 </p>

//                 <p className="text-lg text-gray-800 leading-relaxed">
//                   {currentQuestion.question_text}
//                 </p>

//                 <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
//                   💡 <strong>AI Tip:</strong> Focus on pronouncing clearly. Take a breath before speaking.
//                 </div>
//               </>
//             ) : (
//               <>
//                 <p className="text-sm text-gray-500 mb-4">
//                   Read the sentence and only pronounce the{' '}
//                   <span className="text-orange-500 font-semibold">highlighted word</span> clearly.
//                 </p>

//                 <p className="text-lg text-gray-800 leading-relaxed">
//                   {current.sentence.split(current.highlight)[0]}
//                   <span className="bg-yellow-200 px-1 rounded font-semibold">
//                     {current.highlight}
//                   </span>
//                   {current.sentence.split(current.highlight)[1]}
//                 </p>

//                 <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
//                   💡 <strong>AI Tip:</strong> Focus on pronouncing clearly. Take a breath before speaking.
//                 </div>
//               </>
//             )}
//           </div>

//           {/* RECORDING */}
//           <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
//             {/* <h3 className="text-sm font-semibold mb-4">Record your response:</h3> */}

//             <AudioRecorder
//               maxDuration={15}
//               onRecordingComplete={handleRecordingComplete}
//             />

//             {recorded[currentIndex] && (
//               <p className="text-green-600 text-sm mt-3">✔ Recording saved</p>
//             )}
//           </div>
//         </div>

//         {/* FOOTER */}
//         <div className="flex justify-between items-center mt-6">
//           <p className="text-sm text-gray-500">
//             {currentQuestion ? (
//               <>Question {currentQuestion.question_number} of {currentQuestion.total_questions} in this section</>
//             ) : (
//               <>Question {currentIndex + 1} of {questions.length} in this section</>
//             )}
//           </p>

//           <button
//             onClick={handleNext}
//             disabled={!recorded[currentIndex] || loading}
//             className={`px-6 py-3 rounded-lg font-semibold transition ${
//               recorded[currentIndex] && !loading
//                 ? 'bg-blue-600 text-white hover:bg-blue-700'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             {loading ? 'Loading...' :
//               currentQuestion?.is_last_question && currentQuestion?.is_last_section
//                 ? 'Complete Assessment →'
//                 : currentQuestion?.is_last_question
//                 ? 'Next Section →'
//                 : 'Next Question →'
//             }
//           </button>
//         </div>
//       </main>
//     </div>
//     </>
//   );
// }
// before next question issue



'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '../components/AudioRecorder';
import AssessmentSidebar from '../components/AssessmentSidebar';
import SectionStartModal from '../components/SectionStartModal';
import {
  getCurrentQuestion,
  getNextQuestion,
  CurrentQuestionResponse,
} from '@/api/communicationApi';
import { saveAudioRecording } from '@/utils/audioUtils';

export default function AssessmentMain() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ recordings mapped by question_id
  const [audioRecordings, setAudioRecordings] = useState<{
    [questionId: string]: Blob;
  }>({});

  const isVoiceSection =
    currentQuestion?.question_type === 'VOICE' ||
    ['See and Repeat', 'Listen and Repeat', 'Listen and Correct', 'Situation Explaining']
      .includes(currentQuestion?.section_name || '');

  // ================= FIRST QUESTION =================
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

  // ================= RECORD AUDIO =================
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

  // ================= NEXT QUESTION =================
  const handleNext = async () => {
    if (!currentQuestion?.question_id) return;

    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('Session ID not found');

      const response = await getNextQuestion({
        session_id: sessionId,
        question_id: currentQuestion.question_id, // ✅ REQUIRED
      });

      if (response.completed) {
        router.push('/communication/feedback');
        return;
      }

      // Check if section changed to "Listen and Repeat"
      if (response.section_name === 'Listen and Repeat') {
        console.log('✅ Navigating to Listen and Repeat section');
        router.push('/communication/listen-and-repeat');
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
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
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
              {hasRecording && (
                <p className="text-green-600 text-sm mt-3">
                  ✔ Recording saved
                </p>
              )}
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
//     console.log('Recording saved for question:', questionNumber);
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
