'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
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

  const handleStartAssessment = async () => {
    setIsRequesting(true);
    setError('');

    try {
      const testId = localStorage.getItem('test_id');
      if (!testId) throw new Error('Test ID not found. Please start from the beginning.');

      // Silently read current permission state - no prompt, no dialog.
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
        // permissions API unsupported - fall through, getUserMedia will handle it
      }

      // Fullscreen first only when we already have access (user gesture still active)
      if (alreadyGranted) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            logger.info(' Entered fullscreen mode');
          }
        } catch (fsErr) {
          logger.warn('Could not enter fullscreen:', fsErr);
        }
      }

      // Request camera/mic - shows browser prompt if not yet granted
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // Permissions just granted via prompt - try fullscreen now (Chrome keeps gesture active)
      if (!alreadyGranted) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            logger.info(' Entered fullscreen mode');
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

      if (needsRecording) {
        try {
          await startRecording();
          logger.info(' Video recording started');
          // Stop the preview stream - the recording context owns its own stream from here on.
          // Without this, the preview stream keeps the camera LED on even after stopRecording() is called.
          if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
          }
        } catch (recordingError) {
          logger.error('Failed to start video recording:', recordingError);
          throw recordingError; // block navigation — camera must be working before assessment starts
        }
      }

      // Arm timer and proctoring ONLY after recording is confirmed working.
      // Setting test_start_date earlier would start the countdown and arm all
      // violation rules (tab-switch, fullscreen-exit) before the user is actually
      // in the assessment — a camera failure would leave them stranded with a live timer.
      const startDate = new Date().toISOString();
      localStorage.setItem('test_start_date', startDate);
      window.dispatchEvent(new CustomEvent('assessment-timer-start', { detail: startDate }));

      logger.info('Navigating to see-and-repeat page...');
      router.push('/communication/see-and-repeat');
    } catch (err) {
      setIsRequesting(false);
      const e = err as { name?: string; message?: string; response?: { data?: { message?: string } } };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Microphone and camera permissions are required. Please allow both and try again.');
      } else if (e.name === 'NotFoundError') {
        setError('No microphone or camera found. Please connect both devices and try again.');
      } else if (e.name === 'NotReadableError' || (e.message || '').toLowerCase().includes('could not start video source')) {
        setError('Camera is in use by another application (e.g. Zoom, Teams, another tab). Please close it and try again.');
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
        className="absolute inset-0 h-full w-full object-cover opacity-0 pointer-events-none"
        muted
        playsInline
      />

      <div className="h-full overflow-y-auto bg-slate-50 px-5 py-8 assessment-scroll">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-[#2557a7]/15 bg-[#2557a7]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#2557a7]">
                  Candidate briefing
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Assessment Overview</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  A structured evaluation of English communication skills across speaking, listening, grammar, and comprehension. Review the requirements before entering fullscreen.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAssessment}
                disabled={isRequesting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#2557a7]/15 transition-colors hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isRequesting ? 'Starting Assessment...' : 'Start Assessment'}
                {!isRequesting && <span aria-hidden="true">-&gt;</span>}
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { value: '7', label: 'Sections' },
              { value: '44', label: 'Questions' },
              { value: '20', label: 'Minutes' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <p className="text-3xl font-black leading-none text-[#2557a7]">{s.value}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Assessment Sections</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Complete each module in order.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sequential</span>
              </div>

              <div className="divide-y divide-slate-100">
                {sections.map((section, index) => (
                  <div key={section.name} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2557a7]/15 bg-[#2557a7]/5 text-xs font-black text-[#2557a7]">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-950">{section.name}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{section.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-black text-slate-400">{section.count}Q</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                          section.type === 'VOICE'
                            ? 'bg-[#2557a7]/10 text-[#2557a7]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {section.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-black text-slate-950">Technical Requirements</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'Microphone', note: 'Required for voice responses', required: needsRecording },
                    { label: 'Camera', note: 'Required for proctoring', required: needsRecording },
                    { label: 'Quiet Room', note: 'Minimise background noise', required: false },
                    { label: 'Headphones', note: 'Recommended for listening tasks', required: false },
                  ].map((req) => (
                    <div key={req.label} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">{req.label}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">{req.note}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${req.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {req.required ? 'Required' : 'Recommended'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Before You Begin</p>
                <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-amber-900">
                  {[
                    'You have 20 minutes to complete all 7 sections.',
                    'Sections are sequential; you cannot skip ahead.',
                    'Progress is saved between questions.',
                    'Do not close or refresh the browser during the assessment.',
                    'Speak naturally and clearly during voice sections.',
                  ].map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
