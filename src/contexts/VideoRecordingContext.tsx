'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

interface VideoRecordingContextType {
  isRecording: boolean;
  startRecording: () => Promise<void>;
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

interface VideoRecordingProviderProps {
  children: React.ReactNode;
}

export const VideoRecordingProvider: React.FC<VideoRecordingProviderProps> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedVideoRef = useRef<Blob | null>(null);

  // Release camera/mic when the provider unmounts (e.g. the user leaves the
  // assessment mid-recording without triggering stopRecording). Without this,
  // the tracks stay live and the browser's "recording" indicator persists onto
  // other pages — making it look like the mock test is recording.
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // // console.log('🎥 Starting video recording...');

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
          // // console.log('📹 Video chunk received:', event.data.size, 'bytes. Total chunks:', recordedChunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        // // console.log('🛑 MediaRecorder onstop triggered. Total chunks:', recordedChunksRef.current.length);
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedVideoRef.current = videoBlob;
        // // console.log('✅ Video recording stopped. Size:', videoBlob.size, 'bytes');

        // Update state to reflect recording has stopped
        setIsRecording(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = () => {
        // // console.error('❌ MediaRecorder error');
        setIsRecording(false);

        // Save whatever chunks we have so far
        if (recordedChunksRef.current.length > 0) {
          const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          recordedVideoRef.current = videoBlob;
          // // console.log('⚠️ Saved partial recording:', videoBlob.size, 'bytes');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // // console.log('✅ Video recording started successfully');
    } catch (error) {
      // // console.error('❌ Error starting video recording:', error);
      setIsRecording(false);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // // console.log('🛑 Stopping video recording...');
      // // console.log('📊 Current recording state:', {
      //   hasMediaRecorder: !!mediaRecorderRef.current,
      //   recorderState: mediaRecorderRef.current?.state,
      //   hasRecordedVideo: !!recordedVideoRef.current,
      //   chunksCount: recordedChunksRef.current.length,
      //   isRecordingState: isRecording,
      // });

      // If recorder is inactive but we have chunks, create blob from chunks
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        // // console.warn('⚠️ MediaRecorder is inactive or null');

        // If we have chunks but no recorded video yet, create it now
        if (recordedChunksRef.current.length > 0 && !recordedVideoRef.current) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          recordedVideoRef.current = videoBlob;
          // // console.log('✅ Created video blob from chunks:', videoBlob.size, 'bytes');
        }

        // Return whatever we have (could be null if never recorded)
        if (recordedVideoRef.current) {
          // // console.log('✅ Returning previously recorded video:', recordedVideoRef.current.size, 'bytes');
        } else {
          // // console.error('❌ No video recording found');
        }

        // Stop all tracks even if recorder is inactive
        if (streamRef.current) {
          // // console.log('🔴 Stopping camera/microphone tracks...');
          streamRef.current.getTracks().forEach(track => {
            // // console.log(`🛑 Stopping track: ${track.kind} (${track.label})`);
            track.stop();
          });
          streamRef.current = null;
          // // console.log('✅ All tracks stopped');
        }

        setIsRecording(false);
        resolve(recordedVideoRef.current);
        return;
      }

      // Recorder is still active, stop it normally
      // // console.log('🛑 Stopping active MediaRecorder...');
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedVideoRef.current = videoBlob;
        // // console.log('✅ Video recording stopped. Size:', videoBlob.size, 'bytes');

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

  const clearRecordedVideo = useCallback(() => {
    // // console.log('🗑️ Clearing recorded video...');
    recordedVideoRef.current = null;
    recordedChunksRef.current = [];
    // // console.log('✅ Video storage cleared');
  }, []);

  const value: VideoRecordingContextType = {
    isRecording,
    startRecording,
    stopRecording,
    getRecordedVideo,
    clearRecordedVideo,
  };

  return (
    <VideoRecordingContext.Provider value={value}>
      {children}
    </VideoRecordingContext.Provider>
  );
};
