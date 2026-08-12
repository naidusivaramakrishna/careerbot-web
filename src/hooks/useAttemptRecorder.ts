'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Webcam recorder for a proctored mock test attempt.
 *
 * Deliberately NOT reusing VideoRecordingContext: that one is a provider bound to
 * the communication flow and records at 2,500,000 bps. Over an 80-minute test that
 * is roughly 1.5 GB — past the backend's 1 GB cap (MOCK_TEST_VIDEO_MAX_BYTES), so
 * every full-length attempt would be rejected on upload.
 *
 * The bitrate below targets ~250 MB for a full 80-minute attempt, which is ample
 * for proctoring (is the candidate present, alone, and looking at the screen).
 */

// 400 kbps video + 32 kbps audio ≈ 260 MB over 80 minutes.
const VIDEO_BITS_PER_SECOND = 400_000;
const AUDIO_BITS_PER_SECOND = 32_000;

// Modest capture size — proctoring needs a recognisable face, not detail.
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width:      { ideal: 640 },
  height:     { ideal: 480 },
  frameRate:  { ideal: 15, max: 15 },
  facingMode: 'user',
};

/** Emit a chunk periodically so a crash/kill still leaves recoverable data. */
const TIMESLICE_MS = 10_000;

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'error';

export interface AttemptRecorder {
  status: RecorderStatus;
  error: string | null;
  isRecording: boolean;
  /** File extension implied by the negotiated container, e.g. ".webm". */
  fileExtension: string;
  /** Ask for the camera and begin. Call from a user gesture. Throws on denial. */
  start: () => Promise<void>;
  /** Stop and resolve the finished recording (null if nothing was captured). */
  stop: () => Promise<Blob | null>;
  /** Release the camera without producing a blob. Safe to call repeatedly. */
  cleanup: () => void;
}

const pickMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  // MP4 first. MediaRecorder's WebM carries no duration in its header (it is
  // written before recording ends and never patched), so server-side decoders
  // frequently reject it — the AI evaluator returned
  // "Uploaded video file is corrupted or unreadable" for exactly that. MP4/H.264
  // is far more reliably decodable; WebM stays as the fallback for browsers that
  // cannot record MP4.
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
};

const humaniseGetUserMediaError = (err: unknown): string => {
  const name = (err as { name?: string })?.name ?? '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera and microphone access was blocked. This test is proctored and cannot start without it — allow access in your browser and try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found. This test is proctored and requires a working camera.';
    case 'NotReadableError':
      return 'Your camera is already in use by another application. Close it and try again.';
    default:
      return 'Could not start the camera. This test is proctored and requires camera access.';
  }
};

export function useAttemptRecorder(): AttemptRecorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError]   = useState<string | null>(null);

  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const mimeRef     = useRef<string>('video/webm');

  const cleanup = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* already stopped */ }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach(t => { try { t.stop(); } catch { /* ignore */ } });
    streamRef.current = null;
  }, []);

  // Never leave the camera light on if the user navigates away mid-test.
  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg = 'This browser cannot record video. Use a recent Chrome, Edge or Firefox to take a proctored test.';
      setStatus('error'); setError(msg);
      throw new Error(msg);
    }

    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: true,
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeRef.current = mimeType || 'video/webm';

      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(TIMESLICE_MS);
      recorderRef.current = recorder;
      setStatus('recording');
    } catch (err: unknown) {
      cleanup();
      const msg = humaniseGetUserMediaError(err);
      setStatus('error');
      setError(msg);
      throw new Error(msg);
    }
  }, [cleanup]);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      const existing = chunksRef.current.length
        ? new Blob(chunksRef.current, { type: mimeRef.current.split(';')[0] })
        : null;
      cleanup();
      setStatus('stopped');
      return Promise.resolve(existing);
    }

    return new Promise<Blob | null>(resolve => {
      // Resolve from onstop, not immediately after stop(): the final chunk is
      // delivered asynchronously, and reading the array too early truncates the
      // tail of the recording.
      recorder.onstop = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: mimeRef.current.split(';')[0] })
          : null;
        cleanup();
        setStatus('stopped');
        resolve(blob);
      };
      try {
        // stop() already flushes the outstanding buffer as a final dataavailable.
        // The requestData() that used to precede it emitted an extra partial
        // cluster, appending a fragment that can leave the container unreadable.
        recorder.stop();
      } catch {
        cleanup();
        setStatus('stopped');
        resolve(chunksRef.current.length ? new Blob(chunksRef.current, { type: mimeRef.current.split(';')[0] }) : null);
      }
    });
  }, [cleanup]);

  const fileExtension = mimeRef.current.includes('mp4') ? '.mp4' : '.webm';

  return {
    status,
    error,
    isRecording: status === 'recording',
    fileExtension,
    start,
    stop,
    cleanup,
  };
}
