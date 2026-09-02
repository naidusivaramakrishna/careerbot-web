'use client';

import { useEffect, useRef, useState } from 'react';
import logger from '@/lib/logger';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, durationMs?: number) => void;
  maxDuration?: number;
  sessionId?: string;
  questionId?: string;
  onUploadStatusChange?: (
    questionId: string,
    status: 'uploading' | 'completed' | 'failed',
    error?: string
  ) => void;
  enableProgressiveUpload?: boolean;
  disabled?: boolean;
  captured?: boolean;
}

export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = 15,
  sessionId,
  questionId,
  onUploadStatusChange,
  enableProgressiveUpload = false,
  disabled = false,
  captured,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [inputLevel, setInputLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);

  const elapsed = maxDuration - timeLeft;
  const capturedSeconds = lastDurationMs ? Math.max(1, Math.round(lastDurationMs / 1000)) : null;
  const isCaptured = captured ?? disabled;

  const getSupportedMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
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

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const durationMs = recordingStartRef.current != null ? Date.now() - recordingStartRef.current : undefined;
      recordingStartRef.current = null;
      setLastDurationMs(durationMs ?? null);
      onRecordingComplete?.(blob, durationMs);
      chunksRef.current = [];

      if (enableProgressiveUpload && sessionId && questionId) {
        onUploadStatusChange?.(questionId, 'uploading');

        try {
          const { uploadAudio } = await import('@/api/communicationApi');
          const result = await uploadAudio({
            session_id: sessionId,
            question_id: questionId,
            test_id: '',
            audio_file: blob,
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
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return;

    analyser.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>);

    let peak = 0;
    for (let i = 0; i < dataArray.length; i++) {
      peak = Math.max(peak, Math.abs(dataArray[i] - 128));
    }

    setInputLevel(Math.min(100, Math.round((peak / 48) * 100)));
    animationRef.current = requestAnimationFrame(draw);
  };

  const startRecording = async () => {
    setLastDurationMs(null);
    await initRecorder();

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'recording') return;

    recorder.start();
    recordingStartRef.current = Date.now();
    setIsRecording(true);
    setTimeLeft(maxDuration);
    setInputLevel(0);

    draw();

    // Use Date.now() each tick so the display reflects real elapsed time
    // even if the browser throttles setInterval in a background tab.
    timerRef.current = setInterval(() => {
      if (!recordingStartRef.current) return;
      const elapsedSec = Math.floor((Date.now() - recordingStartRef.current) / 1000);
      const left = Math.max(0, maxDuration - elapsedSec);
      setTimeLeft(left);
    }, 500);

    // Hard-stop the recording at maxDuration using a single setTimeout.
    // setInterval counting is unreliable in background tabs; setTimeout
    // fires once and is not subject to cumulative drift.
    autoStopRef.current = setTimeout(() => {
      stopRecording().catch((err) => logger.error('Error auto-stopping recording:', err));
    }, maxDuration * 1000);
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current?.state !== 'recording') return;

    const stopPromise = new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }

      const originalOnStop = recorder.onstop;
      recorder.onstop = async (event: Event) => {
        try {
          if (originalOnStop) await originalOnStop.call(recorder, event);
        } finally {
          resolve();
        }
      };
      recorder.stop();
    });

    await stopPromise;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    audioContextRef.current?.close();
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }

    setIsRecording(false);
    setTimeLeft(maxDuration);
    setInputLevel(0);
  };

  useEffect(() => {
    return () => {
      stopRecording().catch((err) => logger.error('Error during cleanup:', err));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3 text-left">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Voice capture</p>
          <h3 className="mt-0.5 text-sm font-black text-slate-900">Record your response</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            isRecording
              ? 'border border-red-200 bg-red-50 text-red-600'
              : disabled
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-[#2557a7]/15 bg-[#2557a7]/5 text-[#2557a7]'
          }`}
        >
          {isRecording ? 'Recording' : isCaptured ? 'Captured' : 'Ready'}
        </span>
      </div>

      <div className={`mx-auto mb-3 flex h-[clamp(5.5rem,18vh,8rem)] w-[clamp(5.5rem,18vh,8rem)] shrink-0 items-center justify-center rounded-full border ${isRecording ? 'border-red-200 bg-red-50' : isCaptured ? 'border-green-200 bg-green-50' : 'border-[#2557a7]/15 bg-[#2557a7]/5'}`}>
        <div className={`flex h-[clamp(3.5rem,11vh,5rem)] w-[clamp(3.5rem,11vh,5rem)] items-center justify-center rounded-full ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : isCaptured ? 'bg-green-600 text-white' : 'bg-white text-[#2557a7] shadow-sm'}`}>
          {isRecording ? (
            <span className="h-6 w-6 rounded bg-white" aria-hidden="true" />
          ) : isCaptured ? (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
              <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
            </svg>
          )}
        </div>
      </div>

      <div className="mb-2 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        {isRecording ? (
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Input level</span>
              <span className="text-[11px] font-black text-red-600">Live</span>
            </div>
            <div className="flex h-7 items-end gap-1" aria-label={`Microphone input level ${inputLevel}%`}>
              {[14, 28, 42, 56, 70, 84, 98].map((threshold) => (
                <span
                  key={threshold}
                  className={`flex-1 rounded-full transition-all duration-100 ${
                    inputLevel >= threshold ? 'bg-red-500' : 'bg-slate-200'
                  }`}
                  style={{ height: `${Math.max(7, threshold / 2)}%` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-9 items-center justify-center text-xs font-semibold text-slate-500">
            {disabled
              ? `Response captured${capturedSeconds ? ` in ${capturedSeconds}s` : ''}`
              : 'Microphone input appears while recording'}
          </div>
        )}
      </div>

      {isRecording ? (
        <>
          <div className="mb-2 flex shrink-0 items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Elapsed</span>
            <span className="text-sm font-black tabular-nums">{elapsed}s</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-white" />
            Stop Recording
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className={`w-full shrink-0 rounded-xl px-5 py-2.5 text-sm font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 ${
              disabled
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-[#2557a7] text-white shadow-lg shadow-[#2557a7]/15 hover:bg-[#1e4a94]'
            }`}
          >
            {isCaptured ? 'Response Captured' : 'Start Recording'}
          </button>
        </>
      )}
    </div>
  );
}
