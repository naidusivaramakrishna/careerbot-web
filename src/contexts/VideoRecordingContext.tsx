'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

interface VideoRecordingContextType {
  isRecording: boolean;
  isCameraLost: boolean;
  isMicLost: boolean;
  startRecording: () => Promise<void>;
  restartRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  getRecordedVideo: () => Blob | null;
  clearRecordedVideo: () => void;
}

const VideoRecordingContext = createContext<VideoRecordingContextType | null>(null);

export const useVideoRecording = () => {
  const context = useContext(VideoRecordingContext);
  if (!context) {
    throw new Error('useVideoRecording must be used within VideoRecordingProvider');
  }
  return context;
};

export const VideoRecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraLost, setIsCameraLost] = useState(false);
  const [isMicLost, setIsMicLost] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedVideoRef = useRef<Blob | null>(null);

  const attachTrackListeners = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        setIsCameraLost(true);
        setIsRecording(false);
      };
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.onended = () => {
        setIsMicLost(true);
        setIsRecording(false);
      };
    }
  }, []);

  const buildRecorder = useCallback((stream: MediaStream) => {
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
      ? 'video/webm; codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      recordedVideoRef.current = new Blob(recordedChunksRef.current, { type: mimeType });
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };

    recorder.onerror = () => {
      setIsRecording(false);
      if (recordedChunksRef.current.length > 0) {
        recordedVideoRef.current = new Blob(recordedChunksRef.current, { type: mimeType });
      }
    };

    return recorder;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      attachTrackListeners(stream);
      recordedChunksRef.current = [];
      const recorder = buildRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      setIsRecording(false);
      throw error;
    }
  }, [attachTrackListeners, buildRecorder]);

  // Re-acquire camera/mic after user re-enables them.
  // Existing recorded chunks are kept — new chunks are appended so the final
  // video covers the full session (the gap where devices were off is preserved).
  const restartRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    attachTrackListeners(stream);

    const recorder = buildRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start(1000);

    setIsCameraLost(false);
    setIsMicLost(false);
    setIsRecording(true);
  }, [attachTrackListeners, buildRecorder]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        if (recordedChunksRef.current.length > 0 && !recordedVideoRef.current) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          recordedVideoRef.current = new Blob(recordedChunksRef.current, { type: mimeType });
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        setIsRecording(false);
        resolve(recordedVideoRef.current);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        recordedVideoRef.current = new Blob(recordedChunksRef.current, { type: mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve(recordedVideoRef.current);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const getRecordedVideo = useCallback(() => recordedVideoRef.current, []);

  const clearRecordedVideo = useCallback(() => {
    recordedVideoRef.current = null;
    recordedChunksRef.current = [];
    setIsCameraLost(false);
    setIsMicLost(false);
  }, []);

  return (
    <VideoRecordingContext.Provider value={{
      isRecording,
      isCameraLost,
      isMicLost,
      startRecording,
      restartRecording,
      stopRecording,
      getRecordedVideo,
      clearRecordedVideo,
    }}>
      {children}
    </VideoRecordingContext.Provider>
  );
};
