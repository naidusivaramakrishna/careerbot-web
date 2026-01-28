// 'use client';

// import { useState, useEffect, useRef } from 'react';

// interface AudioRecorderProps {
//   onRecordingComplete?: (audioBlob: Blob) => void;
//   maxDuration?: number;
// }

// export default function AudioRecorder({ 
//   onRecordingComplete, 
//   maxDuration = 15 
// }: AudioRecorderProps) {
//   const [isRecording, setIsRecording] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(maxDuration);
//   const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const chunksRef = useRef<Blob[]>([]);

//   const progress = ((maxDuration - timeLeft) / maxDuration) * 100;

//   const initMediaRecorder = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;
      
//       const recorder = new MediaRecorder(stream);
//       chunksRef.current = [];

//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunksRef.current.push(event.data);
//         }
//       };

//       recorder.onstop = () => {
//         const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
//         if (onRecordingComplete) {
//           onRecordingComplete(audioBlob);
//         }
//         chunksRef.current = [];
//       };

//       setMediaRecorder(recorder);
//       return recorder;
//     } catch (error) {
//       console.error('Error accessing microphone:', error);
//       alert('Please allow microphone access to record audio.');
//       return null;
//     }
//   };

//   const startRecording = async () => {
//     let recorder = mediaRecorder;
    
//     if (!recorder) {
//       recorder = await initMediaRecorder();
//       if (!recorder) return;
//     }

//     setIsRecording(true);
//     setTimeLeft(maxDuration);
//     recorder.start();

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           stopRecording();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   const stopRecording = () => {
//     if (mediaRecorder && mediaRecorder.state === 'recording') {
//       mediaRecorder.stop();
//     }
    
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
    
//     setIsRecording(false);
//     setTimeLeft(maxDuration);
//   };

//   useEffect(() => {
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center">
//       <h3 className="text-2xl font-bold text-gray-800 mb-4">Record Your Answer</h3>

//       {/* Recording Circle with Timer */}
//       <div className="relative mb-4">
//         <svg className="transform -rotate-90" width="240" height="240">
//           <circle
//             cx="120"
//             cy="120"
//             r="90"
//             stroke="#e5e7eb"
//             strokeWidth="12"
//             fill="none"
//           />
//           <circle
//             cx="120"
//             cy="120"
//             r="100"
//             stroke={isRecording ? "#ef4444" : "#6366f1"}
//             strokeWidth="12"
//             fill="none"
//             strokeDasharray={`${2 * Math.PI * 100}`}
//             strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
//             strokeLinecap="round"
//             className="transition-all duration-1000 ease-linear"
//           />
//         </svg>

//         <div className="absolute inset-0 flex flex-col items-center justify-center">
//           <div className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//             {timeLeft}s
//           </div>
//           <div className="text-sm text-gray-500 mt-2 font-medium">
//             {isRecording ? 'Recording...' : 'Ready'}
//           </div>
//         </div>
//       </div>

//       {/* Recording Controls */}
//       <div className="flex space-x-4">
//         {!isRecording ? (
//           <button
//             onClick={startRecording}
//             className="group relative px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-103 transition-all duration-200 flex items-center space-x-3"
//           >
//             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
//               <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
//             </svg>
//             <span>Start Recording</span>
//           </button>
//         ) : (
//           <button
//             onClick={stopRecording}
//             className="group relative px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 animate-pulse"
//           >
//             <div className="w-4 h-4 bg-white rounded-sm"></div>
//             <span>Stop Recording</span>
//           </button>
//         )}
//       </div>

//       {isRecording && (
//         <div className="mt-6 flex items-center space-x-2 text-red-500 animate-pulse">
//           <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//           <span className="font-semibold">Recording in progress...</span>
//         </div>
//       )}
//     </div>
//   );
// }


// 'use client';

// import { useState, useEffect, useRef } from 'react';

// interface AudioRecorderProps {
//   onRecordingComplete?: (audioBlob: Blob) => void;
//   maxDuration?: number;
// }

// export default function AudioRecorder({ 
//   onRecordingComplete, 
//   maxDuration = 15 
// }: AudioRecorderProps) {
//   const [isRecording, setIsRecording] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(maxDuration);
//   const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const chunksRef = useRef<Blob[]>([]);

//   const progress = ((maxDuration - timeLeft) / maxDuration) * 100;

//   const initMediaRecorder = async () => {
//     try {
//       // Check if permission was already granted
//       const permissionGranted = sessionStorage.getItem('microphonePermissionGranted');
      
//       if (!permissionGranted) {
//         alert('Please start the assessment from the beginning to grant microphone permission.');
//         return null;
//       }

//       // Request stream (should not prompt since permission already granted)
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;
      
//       const recorder = new MediaRecorder(stream);
//       chunksRef.current = [];

//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunksRef.current.push(event.data);
//         }
//       };

//       recorder.onstop = () => {
//         const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
//         if (onRecordingComplete) {
//           onRecordingComplete(audioBlob);
//         }
//         chunksRef.current = [];
//       };

//       setMediaRecorder(recorder);
//       return recorder;
//     } catch (error) {
//       console.error('Error accessing microphone:', error);
//       alert('Unable to access microphone. Please check your permissions and try again.');
//       return null;
//     }
//   };

//   const startRecording = async () => {
//     let recorder = mediaRecorder;
    
//     if (!recorder) {
//       recorder = await initMediaRecorder();
//       if (!recorder) return;
//     }

//     setIsRecording(true);
//     setTimeLeft(maxDuration);
//     recorder.start();

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           stopRecording();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   const stopRecording = () => {
//     if (mediaRecorder && mediaRecorder.state === 'recording') {
//       mediaRecorder.stop();
//     }
    
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
    
//     setIsRecording(false);
//     setTimeLeft(maxDuration);
//   };

//   useEffect(() => {
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center">
//       <h3 className="text-2xl font-bold text-gray-800 mb-4">Record Your Answer</h3>

//       {/* Recording Circle with Timer */}
//       <div className="relative mb-4">
//         <svg className="transform -rotate-90" width="240" height="240">
//           <circle
//             cx="120"
//             cy="120"
//             r="90"
//             stroke="#e5e7eb"
//             strokeWidth="12"
//             fill="none"
//           />
//           <circle
//             cx="120"
//             cy="120"
//             r="100"
//             stroke={isRecording ? "#ef4444" : "#6366f1"}
//             strokeWidth="12"
//             fill="none"
//             strokeDasharray={`${2 * Math.PI * 100}`}
//             strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
//             strokeLinecap="round"
//             className="transition-all duration-1000 ease-linear"
//           />
//         </svg>

//         <div className="absolute inset-0 flex flex-col items-center justify-center">
//           <div className="text-4xl font-bold bg-linear-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//             {timeLeft}s
//           </div>
//           <div className="text-sm text-gray-500 mt-2 font-medium">
//             {isRecording ? 'Recording...' : 'Ready'}
//           </div>
//         </div>
//       </div>

//       {/* Recording Controls */}
//       <div className="flex space-x-4">
//         {!isRecording ? (
//           <button
//             onClick={startRecording}
//             className="group relative px-3 py-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-103 transition-all duration-200 flex items-center space-x-3"
//           >
//             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
//               <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
//             </svg>
//             <span>Start Recording</span>
//           </button>
//         ) : (
//           <button
//             onClick={stopRecording}
//             className="group relative px-8 py-3 bg-linear-to-r from-red-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 animate-pulse"
//           >
//             <div className="w-4 h-4 bg-white rounded-sm"></div>
//             <span>Stop Recording</span>
//           </button>
//         )}
//       </div>

//       {isRecording && (
//         <div className="mt-6 flex items-center space-x-2 text-red-500 animate-pulse">
//           <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//           <span className="font-semibold">Recording in progress...</span>
//         </div>
//       )}
//     </div>
//   );
// }
//  ui like ux



'use client';

import { useEffect, useRef, useState } from 'react';

// interface AudioRecorderProps {
//   onRecordingComplete?: (audioBlob: Blob) => void;
//   maxDuration?: number;
// }
interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  maxDuration?: number;
  // NEW: For progressive upload
  sessionId?: string;
  questionId?: string;
  onUploadStatusChange?: (
    questionId: string,
    status: 'uploading' | 'completed' | 'failed',
    error?: string
  ) => void;
  enableProgressiveUpload?: boolean;
}


export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = 15,
  sessionId,
  questionId,
  onUploadStatusChange,
  enableProgressiveUpload = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // ➡️ scrolling position for silence line
  const silentOffsetRef = useRef<number>(0);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t));
  };

  const initRecorder = async () => {
    if (mediaRecorderRef.current) return;

    const mimeType = getSupportedMimeType();
    if (!mimeType) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    // recorder.onstop = () => {
    //   const blob = new Blob(chunksRef.current, { type: mimeType });
    //   onRecordingComplete?.(blob);
    //   chunksRef.current = [];
    // };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onRecordingComplete?.(blob);
      chunksRef.current = [];

      // NEW: Progressive upload if enabled
      if (enableProgressiveUpload && sessionId && questionId) {
        onUploadStatusChange?.(questionId, 'uploading');

        try {
          // Import dynamically to avoid circular deps
          const { uploadProgressiveAudio } = await import('@/api/communicationApi');
          const result = await uploadProgressiveAudio(sessionId, questionId, blob);

          if (result.success) {
            onUploadStatusChange?.(questionId, 'completed');
            console.log(`✅ Progressive upload completed for ${questionId}`);
          } else {
            onUploadStatusChange?.(questionId, 'failed', result.error);
            console.error(`❌ Progressive upload failed for ${questionId}:`, result.error);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Upload failed';
          onUploadStatusChange?.(questionId, 'failed', errorMsg);
          console.error(`❌ Progressive upload error for ${questionId}:`, error);
        }
      }
    };

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.fftSize);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    let isSilent = true;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      if (Math.abs(v - 1) > 0.02) {
        isSilent = false;
        break;
      }
    }

    // 🔇 SILENCE → moving straight line
    if (isSilent) {
      silentOffsetRef.current -= 1;
      if (silentOffsetRef.current < -canvas.width) {
        silentOffsetRef.current = canvas.width;
      }

      ctx.beginPath();
      ctx.moveTo(silentOffsetRef.current, canvas.height / 2);
      ctx.lineTo(
        silentOffsetRef.current + canvas.width,
        canvas.height / 2
      );
      ctx.stroke();
    }
    // 🔊 VOICE → waveform
    else {
      silentOffsetRef.current = canvas.width;

      ctx.beginPath();
      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(draw);
  };

  const startRecording = async () => {
    await initRecorder();

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'recording') return;

    recorder.start();
    setIsRecording(true);
    setTimeLeft(maxDuration);
    silentOffsetRef.current = canvasRef.current?.width || 0;

    draw();

    timerRef.current = setInterval(async () => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Call async stopRecording without awaiting in setState
          // This is OK because the recording will complete regardless
          stopRecording().catch((err) => {
            console.error('❌ Error stopping recording:', err);
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current?.state !== 'recording') {
      return;
    }

    // Create a promise that resolves when onstop callback completes
    const stopPromise = new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }

      // Store original onstop handler
      const originalOnStop = recorder.onstop;

      // Wrap onstop to resolve promise after it completes
      recorder.onstop = async (event: Event) => {
        try {
          // Call original onstop handler
          if (originalOnStop) {
            await originalOnStop.call(recorder, event);
          }
        } finally {
          // Resolve the promise after onstop completes
          resolve();
        }
      };

      // Now stop the recorder - this will trigger onstop callback
      recorder.stop();
    });

    // Wait for onstop callback to complete
    await stopPromise;

    // NOW cleanup resources after blob is fully created
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop audio context and stream AFTER blob creation
    audioContextRef.current?.close();
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Reset the media recorder ref so it can be re-initialized
    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setTimeLeft(maxDuration);
  };

  useEffect(() => {
    return () => {
      // Don't await cleanup in useEffect return, just call it
      stopRecording().catch((err) => {
        console.error('❌ Error during cleanup:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      {!isRecording && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-8">
            Record your response:
          </h3>

          <div className="mb-6"> <div className="w-40 h-40 rounded-full border-4 border-blue-500 flex items-center justify-center"> <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center"> <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" /> <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" /> </svg> </div> </div> </div>

          <button
            onClick={startRecording}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Start Recording
          </button>
        </>
      )}

      {isRecording && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-8">
            Record your response:
          </h3>

          <div className="mb-6">
            <div className="w-40 h-40 rounded-full border-4 border-blue-500 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                <canvas ref={canvasRef} width={80} height={40} />
              </div>
            </div>
          </div>

          <p className="text-red-500 text-sm mb-4">
            Recording in progress...
          </p>

          <button
            onClick={stopRecording}
            className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-lg"
          >
            <span className="w-3 h-3 bg-white rounded-sm"></span>
            Stop Recording
          </button>

          <p className="text-red-500 text-sm mt-3">
            {timeLeft}s remaining
          </p>
        </>
      )}
    </div>
  );
}

