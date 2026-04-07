'use client';

import { useEffect, useRef, useState } from 'react';
import logger from '@/lib/logger';

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
  testId?: string; // Assessment test session ID for backend correlation
  onUploadStatusChange?: (
    questionId: string,
    status: 'uploading' | 'completed' | 'failed',
    error?: string
  ) => void;
  enableProgressiveUpload?: boolean;
  disabled?: boolean; // Disable recording button
}


export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = 15,
  sessionId,
  questionId,
  testId,
  onUploadStatusChange,
  enableProgressiveUpload = false,
  disabled = false,
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
          const { uploadAudio } = await import('@/api/communicationApi');
          // uploadAudio expects specific parameters, need to adjust this call
          const result = await uploadAudio({
            session_id: sessionId,
            question_id: questionId,
            test_id: testId ?? '',
            audio_file: blob
          });

          if (result.success) {
            onUploadStatusChange?.(questionId, 'completed');
            logger.info(`Progressive upload completed for ${questionId}`);
          } else {
            onUploadStatusChange?.(questionId, 'failed', result.message);
            logger.error(`Progressive upload failed for ${questionId}:`, result.message);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Upload failed';
          onUploadStatusChange?.(questionId, 'failed', errorMsg);
          logger.error(`Progressive upload error for ${questionId}:`, error);
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

    analyser.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>);

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
            logger.error('Error stopping recording:', err);
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
        logger.error('Error during cleanup:', err);
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

          <div className="mb-6">
            <div className="w-36 h-36 rounded-full border-4 border-[#2557a7]/25 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#2557a7]/8 flex items-center justify-center">
                <svg className="w-9 h-9 text-[#2557a7]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                  <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={startRecording}
            disabled={disabled}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
            }`}
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
            <div className="w-36 h-36 rounded-full border-4 border-red-400/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center overflow-hidden">
                {/* Animated Waveform Bars */}
                <div className="flex items-center justify-center gap-0.5 h-full">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.8s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Recording in progress…
          </p>

          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <span className="w-2.5 h-2.5 bg-white rounded-sm"></span>
            Stop Recording
          </button>

          <p className="text-xs text-gray-400 mt-3 tabular-nums">
            {timeLeft}s remaining
          </p>
        </>
      )}
    </div>
  );
}

