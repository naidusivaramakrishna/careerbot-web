'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import { startSession } from '@/api/communicationApi';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import logger from '@/lib/logger';

const sections = [
  { name: 'See & Repeat',        count: 8, description: 'Read the highlighted word clearly',      type: 'VOICE' },
  { name: 'Listen & Repeat',     count: 8, description: 'Repeat what you hear',                   type: 'VOICE' },
  { name: 'Jumbled Sentence',    count: 8, description: 'Arrange words in the correct order',     type: 'MCQ'   },
  { name: 'Sentence Completion', count: 8, description: 'Choose the best word to fill the blank', type: 'MCQ'   },
  { name: 'Listen & Correct',    count: 8, description: 'Identify and correct mistakes',          type: 'VOICE' },
  { name: 'Story Listen Facts',  count: 3, description: 'Comprehension questions on a story',     type: 'MCQ'   },
  { name: 'Describe Situation',  count: 1, description: 'Open-ended situational response',        type: 'VOICE' },
];

// Only assessments that actually contain a recording (VOICE) section need the
// microphone/camera. Without this gate the start flow prompted for media on
// every assessment, even MCQ-only ones.
const needsRecording = sections.some((s) => s.type === 'VOICE');

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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        sessionStorage.setItem('microphonePermissionGranted', 'true');
        sessionStorage.setItem('cameraPermissionGranted', 'true');
      }
    } catch (error) {
      logger.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const handleStartAssessment = async () => {
    setIsRequesting(true);
    setError('');

    try {
      const testId = localStorage.getItem('test_id');
      if (!testId) throw new Error('Test ID not found. Please start from the beginning.');

      // Silently read current permission state — no prompt, no dialog.
      // If denied, fail early before touching fullscreen.
      // If already granted, fullscreen can go first (still in user gesture).
      // If prompt (not yet asked), ask camera/mic first then fullscreen.
      let alreadyGranted = false;
      try {
        const [cam, mic] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);
        if (cam.state === 'denied' || mic.state === 'denied') {
          throw Object.assign(new Error('Permissions denied'), { name: 'NotAllowedError' });
        }
        alreadyGranted = cam.state === 'granted' && mic.state === 'granted';
      } catch (permErr) {
        const e = permErr as { name?: string };
        if (e.name === 'NotAllowedError') throw permErr;
        // permissions API unsupported — fall through, getUserMedia will handle it
      }

      // Fullscreen first only when we already have access (user gesture still active)
      if (alreadyGranted) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            logger.info('✅ Entered fullscreen mode');
          }
        } catch (fsErr) {
          logger.warn('Could not enter fullscreen:', fsErr);
        }
      }

      // Request camera/mic — shows browser prompt if not yet granted
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // Permissions just granted via prompt — try fullscreen now (Chrome keeps gesture active)
      if (!alreadyGranted) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            logger.info('✅ Entered fullscreen mode');
          }
        } catch (fsErr) {
          logger.warn('Could not enter fullscreen:', fsErr);
        }
      }

      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      }

      const response = await startSession({ test_id: testId });
      logger.info('Session started successfully:', response);
      logger.info('Response object type:', typeof response);
      logger.info('Response keys:', Object.keys(response || {}));
      logger.info('session_id value:', response.session_id);

      if (!response.session_id) {
        logger.error('Session ID not found in response:', response);
        const r = response as unknown as Record<string, unknown>;
        const possibleSessionId =
          r?.sessionId ||
          (r?.session as Record<string, unknown>)?.session_id ||
          (r?.session as Record<string, unknown>)?.sessionId ||
          (r?.session as Record<string, unknown>)?.id ||
          (r?.data as Record<string, unknown>)?.session_id ||
          (r?.data as Record<string, unknown>)?.sessionId;

        if (possibleSessionId) {
          logger.info('Found session_id in alternate location:', possibleSessionId);
          localStorage.setItem('session_id', String(possibleSessionId));
        } else {
          throw new Error('Session ID not received from API response. Response: ' + JSON.stringify(response));
        }
      } else {
        localStorage.setItem('session_id', response.session_id);
      }

      logger.info('Session ID stored in localStorage:', localStorage.getItem('session_id'));
      logger.info('Verified session_id in localStorage:', localStorage.getItem('session_id'));
      const startDate = new Date().toISOString();
      localStorage.setItem('test_start_date', startDate);
      window.dispatchEvent(new CustomEvent('assessment-timer-start', { detail: startDate }));

      if (needsRecording) {
        try {
          await startRecording();
          logger.info('✅ Video recording started');
          // Stop the preview stream — the recording context owns its own stream from here on.
          // Without this, the preview stream keeps the camera LED on even after stopRecording() is called.
          if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
          }
        } catch (recordingError) {
          logger.error('Failed to start video recording:', recordingError);
        }
      }

      logger.info('🚀 Navigating to see-and-repeat page...');
      router.push('/communication/see-and-repeat');
    } catch (err) {
      setIsRequesting(false);
      const e = err as { name?: string; message?: string; response?: { data?: { message?: string } } };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Microphone and camera permissions are required. Please allow both and try again.');
      } else if (e.name === 'NotFoundError') {
        setError('No microphone or camera found. Please connect both devices and try again.');
      } else if (e.message) {
        setError(e.message);
      } else {
        setError(e?.response?.data?.message || 'Failed to start session. Please try again.');
      }
      logger.error('Error starting assessment:', e);
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        muted
        playsInline
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-5 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-snug">
              Assessment Overview
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              A structured evaluation of your English communication skills — speaking, listening, grammar, and comprehension.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: '7',   label: 'Sections'  },
              { value: '44',  label: 'Questions' },
              { value: '20', label: 'Minutes'   },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl py-5 text-center shadow-sm">
                <p className="text-[26px] font-bold text-[#2557a7] leading-none">{s.value}</p>
                <p className="text-xs text-gray-500 mt-2 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sections Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Assessment Sections</h2>
              <span className="text-[11px] text-gray-400 font-medium">Complete in order</span>
            </div>
            <div>
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#2557a7]/8 border border-[#2557a7]/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#2557a7]">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{section.name}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium text-gray-400">{section.count}Q</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        section.type === 'VOICE'
                          ? 'bg-[#2557a7]/10 text-[#2557a7]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {section.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Technical Requirements</h2>
            </div>
            <div className="grid grid-cols-2">
              {[
                { label: 'Microphone', note: 'Required for all voice sections',       required: needsRecording },
                { label: 'Camera',     note: 'Required for video proctoring',         required: needsRecording },
                { label: 'Quiet Room', note: 'Minimise background noise',             required: false },
                { label: 'Headphones', note: 'Recommended for listening tasks',       required: false },
              ].map((req, i) => (
                <div
                  key={req.label}
                  className={`px-5 py-4 ${
                    i % 2 === 0 ? 'border-r border-gray-100' : ''
                  } ${i < 2 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{req.label}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${req.required ? 'text-red-500' : 'text-gray-400'}`}>
                      {req.required ? 'Required' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{req.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Before You Begin */}
          <div className="border border-amber-200 bg-amber-50 rounded-xl px-5 py-4 mb-8">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5">
              Before You Begin
            </p>
            <ul className="space-y-1.5 text-xs text-amber-800">
              {[
                'You have 20 minutes to complete all 7 sections.',
                'Sections are sequential — you cannot skip ahead.',
                'Progress is auto-saved between questions.',
                'Do not close or refresh the browser during the assessment.',
                'Speak naturally and clearly — this is a learning evaluation, not a perfection test.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-amber-500 mt-0.5">–</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-center">
            <button
              onClick={handleStartAssessment}
              disabled={isRequesting}
              className="bg-[#2557a7] hover:bg-[#1e4a94] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              {isRequesting ? 'Starting Assessment…' : 'Start Assessment →'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
