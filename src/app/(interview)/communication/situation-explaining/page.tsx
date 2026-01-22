// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import AudioRecorder from '../components/AudioRecorder';

// // Sample question data for Situation Explaining section
// const situationQuestion = {
//   id: 1,
//   title: 'Situation Explaining',
//   situation: 'Imagine you are at a job interview and the interviewer asks you to describe a challenging situation you faced at work or school and how you handled it.',
//   points: [
//     'Describe the situation clearly',
//     'Explain what the challenge was',
//     'Describe the actions you took',
//     'Explain the outcome or result',
//     'Reflect on what you learned',
//   ],
//   timeLimit: 60, // 1 minute in seconds
// };

// interface SituationExplainingPageProps {
//   sectionName?: string;
//   sectionDescription?: string;
// }

// export default function SituationExplainingPage({
//   sectionName = 'Situation Explaining',
//   sectionDescription = 'Explain the given situation clearly and comprehensively',
// }: SituationExplainingPageProps) {
//   const router = useRouter();
//   const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

//   const handleRecordingComplete = (audioBlob: Blob) => {
//     setRecordedAudio(audioBlob);
//     console.log('Recording saved for situation explaining');
//   };

//   const handleFinish = () => {
//     if (recordedAudio) {
//       // Navigate to feedback page
//       router.push('/feedback');
//     } else {
//       alert('Please record your answer before finishing.');
//     }
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
//               Final Section - Situation Explaining
//             </span>
//             <span className="text-sm font-semibold text-indigo-600">
//               1 Question
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: '100%' }}
//             ></div>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           {/* Left Side - Situation Question */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="mb-4">
//               <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
//                 Situation Question
//               </span>
//             </div>
            
//             <h2 className="text-xl font-semibold text-gray-900 mb-6">
//               {situationQuestion.situation}
//             </h2>

//             {/* Guidelines Section */}
//             <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 mb-6">
//               <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
//                 <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                 </svg>
//                 Guidelines for Your Response:
//               </h3>
//               <ul className="space-y-2">
//                 {situationQuestion.points.map((point, index) => (
//                   <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
//                     <span className="shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
//                       {index + 1}
//                     </span>
//                     <span>{point}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Time Information */}
//             <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-4">
//               <div className="flex items-center gap-2">
//                 <svg className="w-5 h-5 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//                 </svg>
//                 <p className="text-sm font-semibold text-amber-900">
//                   ⏱️ You have 1 minute to record your response
//                 </p>
//               </div>
//             </div>

//             <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
//               <p className="text-sm text-gray-700">
//                 💡 Think carefully about your response before recording. Use the audio recorder on the right to record your answer.
//               </p>
//             </div>

//             {/* Recording Status */}
//             {recordedAudio && (
//               <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
//                 <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                 </svg>
//                 <span className="text-sm font-medium text-green-800">Recording Saved - Ready to Finish</span>
//               </div>
//             )}
//           </div>

//           {/* Right Side - Audio Recorder */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
//             <div className="flex-1 flex items-center justify-center">
//               <AudioRecorder 
//                 onRecordingComplete={handleRecordingComplete}
//                 maxDuration={situationQuestion.timeLimit}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Bottom Section - Finish Button */}
//         <div className="flex justify-end">
//           <button
//             onClick={handleFinish}
//             disabled={!recordedAudio}
//             className={`px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-2 ${
//               recordedAudio
//                 ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 cursor-pointer shadow-lg hover:shadow-xl'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             <span>Finish Assessment</span>
//             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
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
import SectionStartModal from '../components/SectionStartModal';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import { submitVideoEvaluation } from '@/api/communicationApi';

// Sample question data for Situation Explaining section
const situationQuestion = {
  id: 1,
  title: 'Situation Explaining',
  situation:
    'Imagine you are at a job interview and the interviewer asks you to describe a challenging situation you faced at work or school and how you handled it.',
  points: [
    'Describe the situation clearly',
    'Explain what the challenge was',
    'Describe the actions you took',
    'Explain the outcome or result',
    'Reflect on what you learned',
  ],
  timeLimit: 60,
};

interface SituationExplainingPageProps {
  sectionName?: string;
  sectionDescription?: string;
}

export default function SituationExplainingPage({
  sectionName = 'Situation Explaining',
  sectionDescription = 'Explain the given situation clearly and comprehensively',
}: SituationExplainingPageProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { stopRecording } = useVideoRecording();

  const handleRecordingComplete = (audioBlob: Blob) => {
    setRecordedAudio(audioBlob);
  };

  const handleFinish = async () => {
    if (!recordedAudio) {
      alert('Please record your answer before finishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Stop video recording
      console.log('🛑 Stopping video recording...');
      const videoBlob = await stopRecording();

      if (!videoBlob) {
        console.warn('⚠️ No video recording found');
      }

      // Get email and test_id from localStorage
      const emailId = localStorage.getItem('userEmail');
      const testId = localStorage.getItem('test_id');

      if (!emailId || !testId) {
        console.error('❌ Missing email or test_id');
        alert('Missing required information. Please start the assessment again.');
        setIsSubmitting(false);
        return;
      }

      // Submit video evaluation if we have a video blob
      if (videoBlob) {
        console.log('📤 Submitting video for evaluation...');
        const videoEvalResponse = await submitVideoEvaluation({
          email_id: emailId,
          test_id: testId,
          video: videoBlob,
        });
        console.log('✅ Video evaluation submitted successfully');

        // Store video_evaluation_id for final report
        if (videoEvalResponse.evaluation_id) {
          localStorage.setItem('video_evaluation_id', videoEvalResponse.evaluation_id);
        }
      }

      // Exit fullscreen mode before navigating
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          console.log('✅ Exited fullscreen mode');
        }
      } catch (fullscreenError) {
        console.warn('⚠️ Could not exit fullscreen:', fullscreenError);
        // Continue anyway - not critical
      }

      // Navigate to feedback page
      router.push('/communication/feedback');
    } catch (error) {
      console.error('❌ Error finishing assessment:', error);
      alert('Failed to submit video evaluation. Please try again.');
      setIsSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR */}
      <AssessmentSidebar currentSectionId={6}/>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* 🔽 EXISTING UI — UNCHANGED */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
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
                Final Section - Situation Explaining
              </span>
              <span className="text-sm font-semibold text-indigo-600">
                1 Question
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Side - Situation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded">
                  Situation Question
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {situationQuestion.situation}
              </h2>

              {/* Guidelines */}
              <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Guidelines for Your Response:
                </h3>
                <ul className="space-y-2">
                  {situationQuestion.points.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Time Info */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-4">
                <p className="text-sm font-semibold text-amber-900">
                  ⏱️ You have 1 minute to record your response
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-indigo-600 p-4 rounded">
                <p className="text-sm text-gray-700">
                  💡 Think carefully about your response before recording.
                </p>
              </div>

              {/* Recording Status */}
              {recordedAudio && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm font-medium text-green-800">
                    Recording Saved - Ready to Finish
                  </span>
                </div>
              )}
            </div>

            {/* Right Side - Recorder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                maxDuration={situationQuestion.timeLimit}
              />
            </div>
          </div>

          {/* Finish Button */}
          <div className="flex justify-end">
            <button
              onClick={handleFinish}
              disabled={!recordedAudio || isSubmitting}
              className={`px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-2 ${
                recordedAudio && !isSubmitting
                  ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Finish Assessment'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
