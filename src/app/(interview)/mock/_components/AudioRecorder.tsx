'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/common';

export interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  maxDuration?: number; // Default: 120 seconds (2 min)
  disabled?: boolean;
}

/**
 * Audio Recorder Component
 *
 * Records audio using MediaRecorder API
 * - Captures audio as .webm format
 * - Real-time audio level visualization
 * - Duration tracking with auto-stop
 * - Microphone permission handling
 */
export function AudioRecorder({
  onRecordingComplete,
  maxDuration = 120,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update audio level visualization
  useEffect(() => {
    if (!isRecording || !analyserRef.current) return;

    const updateLevel = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const average = data.reduce((a, b) => a + b) / data.length;
        setAudioLevel(average / 255);
      }
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevel);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  // Update recording timer
  useEffect(() => {
    if (!isRecording) return;

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        // Auto-stop at max duration
        if (newTime >= maxDuration) {
          handleStopRecording();
          return newTime;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  // Request microphone permission and start recording
  const handleStartRecording = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      chunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      // Setup audio context for level analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone device found. Please check your device.');
      } else {
        setError(err.message || 'Failed to access microphone');
      }
    }
  };

  // Stop recording and return blob
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Create blob from chunks
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

      setIsRecording(false);
      onRecordingComplete(blob, recordingTime);
    }
  };

  // Check if too short
  const isTooShort = recordingTime < 3;
  const isMaxed = recordingTime >= maxDuration;

  return (
    <div className="space-y-4">
      {/* Permission Error */}
      {permissionDenied && (
        <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Microphone Permission Required</p>
            <p className="text-xs text-red-700 mt-1">
              Please enable microphone access in your browser settings to use the audio recorder.
            </p>
          </div>
        </div>
      )}

      {/* General Error */}
      {error && !permissionDenied && (
        <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Audio Level Visualizer */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-16 bg-gray-50 rounded-lg border border-gray-200 p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all"
              style={{
                height: `${Math.sin(i * 0.3) * audioLevel * 120 + 4}px`,
                background: `linear-gradient(to top, #2557a7, #4a8fdb)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Recording Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={disabled || permissionDenied}
          className="h-16 w-16 rounded-full flex items-center justify-center transition-all text-white shadow-lg hover:shadow-xl"
          style={{
            backgroundColor: isRecording ? '#dc2626' : disabled || permissionDenied ? '#d1d5db' : '#2557a7',
            cursor: disabled || permissionDenied ? 'not-allowed' : 'pointer',
            opacity: disabled || permissionDenied ? 0.7 : 1,
          }}
        >
          {isRecording ? (
            <MicOff className="h-7 w-7" />
          ) : (
            <Mic className="h-7 w-7" />
          )}
        </button>

        {/* Timer */}
        {isRecording && (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {isTooShort && 'Keep recording (minimum 3 seconds)'}
              {!isTooShort && !isMaxed && 'Recording...'}
              {isMaxed && 'Maximum duration reached'}
            </p>
          </div>
        )}
      </div>

      {/* Duration Progress */}
      {isRecording && (
        <div className="space-y-2">
          <Progress value={(recordingTime / maxDuration) * 100} />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{recordingTime}s</span>
            <span>{maxDuration}s max</span>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!isRecording && recordingTime === 0 && (
        <p className="text-sm text-gray-600 text-center">
          📝 Aim for 30-90 seconds. Speak clearly and avoid filler words.
        </p>
      )}
    </div>
  );
}
