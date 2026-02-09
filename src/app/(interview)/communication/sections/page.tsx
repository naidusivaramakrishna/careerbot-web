'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import { startSession } from '@/api/communicationApi';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import logger from '@/lib/logger';

const sections = [
  { name: 'See & Repeat', count: 8, description: 'Read the highlighted word clearly', type: 'VOICE' },
  { name: 'Listen & Repeat', count: 8, description: 'Repeat what you hear', type: 'VOICE' },
  { name: 'Jumbled Sentence', count: 8, description: 'Arrange words correctly', type: 'MCQ' },
  { name: 'Sentence Completion', count: 8, description: 'Fill in the blanks', type: 'MCQ' },
  { name: 'Listen & Correct', count: 8, description: 'Fix the mistakes', type: 'VOICE' },
  { name: 'Story Listen Facts', count: 3, description: 'Comprehension Questions', type: 'MCQ' },
  { name: 'Describe Situation', count: 1, description: 'Explain your thoughts', type: 'VOICE' },
];

export default function SectionsPage() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startRecording } = useVideoRecording();

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Store permissions
        sessionStorage.setItem('microphonePermissionGranted', 'true');
        sessionStorage.setItem('cameraPermissionGranted', 'true');
      }
    } catch (error: any) {
      logger.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const handleStartAssessment = async () => {
    setIsRequesting(true);
    setError('');

    try {
      // Get test_id from localStorage
      const testId = localStorage.getItem('test_id');
      if (!testId) {
        throw new Error('Test ID not found. Please start from the beginning.');
      }

      // Request permissions first
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      // Stop any existing tracks and start camera preview
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
      }

      await startCameraPreview();

      // Call start session API
      const response = await startSession({
        test_id: testId,
      });

      logger.info('Session started successfully:', response);
      logger.info('Response object type:', typeof response);
      logger.info('Response keys:', Object.keys(response || {}));
      logger.info('session_id value:', response.session_id);

      // Store session_id and test start date in localStorage for later use
      if (!response.session_id) {
        logger.error('Session ID not found in response:', response);
        logger.error('Attempting to find session_id in response...');

        // Try to find it in different locations (API returns session.session_id)
        const possibleSessionId = (response as any)?.sessionId ||
                                   (response as any)?.session?.session_id ||
                                   (response as any)?.session?.sessionId ||
                                   (response as any)?.session?.id ||
                                   (response as any)?.data?.session_id ||
                                   (response as any)?.data?.sessionId;

        if (possibleSessionId) {
          logger.info('Found session_id in alternate location:', possibleSessionId);
          localStorage.setItem('session_id', possibleSessionId);
        } else {
          throw new Error('Session ID not received from API response. Response: ' + JSON.stringify(response));
        }
      } else {
        localStorage.setItem('session_id', response.session_id);
      }

      logger.info('Session ID stored in localStorage:', localStorage.getItem('session_id'));

      // Verify it was stored correctly
      const storedSessionId = localStorage.getItem('session_id');
      logger.info('Verified session_id in localStorage:', storedSessionId);

      // Store the test start date for report display
      const testStartDate = new Date().toISOString();
      localStorage.setItem('test_start_date', testStartDate);

      // Start video recording
      try {
        await startRecording();
        logger.info('✅ Video recording started');
      } catch (recordingError) {
        logger.error('Failed to start video recording:', recordingError);
        // Continue anyway - video recording failure shouldn't block assessment
      }

      // Enter fullscreen mode (keep this before navigation for better UX)
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          logger.info('✅ Entered fullscreen mode');
        }
      } catch (fullscreenError) {
        logger.warn('Could not enter fullscreen:', fullscreenError);
        // Continue anyway - fullscreen is not critical
      }

      // ✅ OPTIMIZED: Navigate immediately without unnecessary delay
      logger.info('🚀 Navigating to see-and-repeat page...');
      router.push('/communication/see-and-repeat');

    } catch (error: any) {
      setIsRequesting(false);

      // Handle different error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Microphone and camera permissions are required to take this assessment. Please allow both permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone or camera found. Please connect both devices and try again.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError(error?.response?.data?.message || 'Failed to start session. Please try again.');
      }

      logger.error('Error starting assessment:', error);
    }
  };

  return (
    <>
      {/* Hidden video element for camera preview */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        muted
        playsInline
      />
      
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Evaluate your communication skills
            </h1>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              This assessment evaluates your communication skills including pronunciation,
              listening comprehension, grammar, and situational responses.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {/* Audio Recording Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Audio Recording</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    You will record voice responses for pronunciation and speaking tests
                  </p>
                </div>
              </div>
            </div>

            {/* Listening Tasks Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Listening Tasks</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Some sections require listening to audio clips before responding
                  </p>
                </div>
              </div>
            </div>

            {/* Timed Responses Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Timed Responses</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Voice recordings have time limits (5-60 seconds per question)
                  </p>
                </div>
              </div>
            </div>

            {/* Fair Assessment Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Fair Assessment</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    You can replay audio and re-record responses within limits
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 7 Comprehensive Sections Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              7 Comprehensive Sections
            </h2>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              Each section evaluates a specific aspect of your communication skills with clear
              instructions and progressive difficulty.
            </p>
          </div>

          {/* Assessment Structure Table */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-gray-800">Assessment Structure</h3>
              <span className="text-xs font-medium text-gray-600">7 Sections • 45 Questions</span>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-teal-100 text-teal-700 font-semibold text-base w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">{section.name}</h4>
                      <p className="text-xs text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-sm">{section.count} questions</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      section.type === 'VOICE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {section.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Before You Begin Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-amber-900 mb-4">Before You Begin</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">Ensure your microphone is working and you are in a quiet environment</span>
              </li>
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">You will have 30 minutes to complete the entire assessment</span>
              </li>
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">Each section must be completed before moving to the next</span>
              </li>
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">Your progress is automatically saved between questions</span>
              </li>
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">Use headphones for better audio quality during listening tasks</span>
              </li>
              <li className="flex items-start gap-3 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm">Take a deep breath and speak naturally—this is a learning experience</span>
              </li>
            </ul>
          </div>

          {/* Start Assessment Button */}
          <div className="text-center">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm max-w-2xl mx-auto">
                {error}
              </div>
            )}
            <button
              onClick={handleStartAssessment}
              disabled={isRequesting}
              className={`bg-gray-900 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2 ${
                isRequesting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isRequesting ? 'Starting Assessment...' : 'Start Assessment'}
              {!isRequesting && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}




// 'use client';

// import { useRouter } from 'next/navigation';
// import { CheckCircle, Clock, BookOpen } from 'lucide-react'; // Optional: install lucide-react for icons

// const sections = [
//   { name: 'See and Repeat', count: 8, description: 'View and repeat the given content', icon: '👁️' },
//   { name: 'Listen and Repeat', count: 8, description: 'Listen carefully and repeat what you hear', icon: '🎧' },
//   { name: 'Jumbled Sentences', count: 8, description: 'Arrange words in the correct order', icon: '🔀' },
//   { name: 'Sentence Completion', count: 8, description: 'Complete the sentences appropriately', icon: '✍️' },
//   { name: 'Listen and Correct', count: 8, description: 'Identify and correct mistakes', icon: '✓' },
//   { name: 'Story Listening', count: 3, description: 'Listen to stories and answer questions', icon: '📖' },
//   { name: 'Situation Explaining', count: 1, description: 'Explain various situational scenarios', icon: '💬' },
// ];

// export default function SectionsPage() {
//   const router = useRouter();
//   const totalQuestions = sections.reduce((sum, section) => sum + section.count, 0);
//   const estimatedTime = Math.ceil(totalQuestions * 1.5); // 1.5 min per question

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
//       {/* Premium Background Gradient Overlay */}
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40"></div>
//       <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:20px_20px]"></div>
      
//       <div className="container mx-auto px-4 py-16 max-w-5xl relative z-10">
//         {/* Premium Header Section */}
//         <div className="text-center mb-16">
//           <div className="inline-block mb-4">
//             <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text text-sm font-bold tracking-widest uppercase">
//               Professional Assessment
//             </span>
//           </div>
//           <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
//             Communication Assessment
//           </h1>
//           <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
//             Comprehensive evaluation designed to measure your communication proficiency across multiple dimensions
//           </p>

//           {/* Stats Bar */}
//           <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-8">
//             <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
//                   {sections.length}
//                 </div>
//                 <div className="text-left">
//                   <p className="text-2xl font-bold text-slate-900">{sections.length}</p>
//                   <p className="text-xs text-slate-600 uppercase tracking-wide">Sections</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg">
//                   📝
//                 </div>
//                 <div className="text-left">
//                   <p className="text-2xl font-bold text-slate-900">{totalQuestions}</p>
//                   <p className="text-xs text-slate-600 uppercase tracking-wide">Questions</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-lg">
//                   ⏱️
//                 </div>
//                 <div className="text-left">
//                   <p className="text-2xl font-bold text-slate-900">~{estimatedTime}</p>
//                   <p className="text-xs text-slate-600 uppercase tracking-wide">Minutes</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Premium Section Cards */}
//         <div className="space-y-5">
//           {sections.map((section, index) => (
//             <div
//               key={index}
//               className="group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 overflow-hidden"
//             >
//               {/* Gradient Border Effect on Hover */}
//               <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
              
//               {/* Left Accent Bar */}
//               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>

//               <div className="p-8 relative">
//                 <div className="flex items-start justify-between gap-6">
//                   {/* Left Content */}
//                   <div className="flex-1 flex gap-5">
//                     {/* Icon Section */}
//                     <div className="flex-shrink-0">
//                       <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
//                         {section.icon}
//                       </div>
//                     </div>

//                     {/* Text Content */}
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-3">
//                         <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
//                           SECTION {index + 1}
//                         </span>
//                       </div>
//                       <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
//                         {section.name}
//                       </h2>
//                       <p className="text-slate-600 text-sm leading-relaxed">
//                         {section.description}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Right Question Count */}
//                   <div className="flex-shrink-0 text-center">
//                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-4 rounded-2xl border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors shadow-sm">
//                       <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
//                         {section.count}
//                       </p>
//                       <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mt-1">
//                         Questions
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Premium CTA Section */}
//         <div className="mt-16 text-center">
//           <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-slate-200 max-w-2xl mx-auto">
//             <h3 className="text-2xl font-bold text-slate-900 mb-3">
//               Ready to Begin?
//             </h3>
//             <p className="text-slate-600 mb-8">
//               This assessment will help evaluate your communication skills comprehensively
//             </p>
            
//             <button
//               onClick={() => router.push('/next-page')}
//               className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
//             >
//               <span>Start Assessment</span>
//               <svg 
//                 className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
//                 fill="none" 
//                 viewBox="0 0 24 24" 
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//               </svg>
//             </button>

//             <p className="text-xs text-slate-500 mt-6">
//               ⏱️ Estimated completion time: ~{estimatedTime} minutes
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

























































// 'use client';

// import { useRouter } from 'next/navigation';

// const sections = [
//   { name: 'Introduction', path: '/introduction', icon: '👋' },
//   { name: 'Listening Skills', path: '/listening-skills', icon: '👂' },
//   { name: 'Speaking Skills', path: '/speaking-skills', icon: '🗣️' },
//   { name: 'Reading Comprehension', path: '/reading-comprehension', icon: '📖' },
//   { name: 'Writing Skills', path: '/writing-skills', icon: '✍️' },
//   { name: 'Vocabulary', path: '/vocabulary', icon: '📚' },
//   { name: 'Grammar', path: '/grammar', icon: '📝' },
//   { name: 'Feedback', path: '/feedback', icon: '💬' },
// ];

// export default function SectionsPage() {
//   const router = useRouter();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
//       <div className="container mx-auto px-4 py-12">
//         <div className="text-center mb-12">
//           <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
//             Communication Assessment
//           </h1>
//           <p className="text-lg text-gray-600">Select a section to begin your assessment</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
//           {sections.map((section, index) => (
//             <button
//               key={index}
//               onClick={() => router.push(section.path)}
//               className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-indigo-300"
//             >
//               <div className="text-5xl mb-4">{section.icon}</div>
//               <h2 className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
//                 {section.name}
//               </h2>
//               <div className="mt-3 text-sm text-gray-500">
//                 8 Questions
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

