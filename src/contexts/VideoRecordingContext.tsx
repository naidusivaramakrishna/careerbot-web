'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface VideoRecordingContextType {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  getRecordedVideo: () => Blob | null;
}

const VideoRecordingContext = createContext<VideoRecordingContextType | null>(null);

export const useVideoRecording = () => {
  const context = useContext(VideoRecordingContext);
  if (!context) {
    throw new Error('useVideoRecording must be used within VideoRecordingProvider');
  }
  return context;
};

interface VideoRecordingProviderProps {
  children: React.ReactNode;
}

export const VideoRecordingProvider: React.FC<VideoRecordingProviderProps> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedVideoRef = useRef<Blob | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎥 Starting video recording...');

      // Get media stream with video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedVideoRef.current = videoBlob;
        console.log('✅ Video recording stopped. Size:', videoBlob.size, 'bytes');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      console.log('✅ Video recording started successfully');
    } catch (error) {
      console.error('❌ Error starting video recording:', error);
      setIsRecording(false);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        console.warn('⚠️ No active recording to stop');
        resolve(recordedVideoRef.current);
        return;
      }

      console.log('🛑 Stopping video recording...');

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedVideoRef.current = videoBlob;
        console.log('✅ Video recording stopped. Size:', videoBlob.size, 'bytes');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve(videoBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const getRecordedVideo = useCallback(() => {
    return recordedVideoRef.current;
  }, []);

  const value: VideoRecordingContextType = {
    isRecording,
    startRecording,
    stopRecording,
    getRecordedVideo,
  };

  return (
    <VideoRecordingContext.Provider value={value}>
      {children}
    </VideoRecordingContext.Provider>
  );
};
