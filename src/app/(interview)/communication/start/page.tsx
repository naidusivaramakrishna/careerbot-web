'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateTest } from '@/api/communicationApi';
import { getProfile } from '@/api/userApi';
import { clearAllAudioRecordings } from '@/utils/audioUtils';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import logger from '@/lib/logger';

const difficulties = [
  { key: 'easy', label: 'Easy', meta: 'Basic vocabulary' },
  { key: 'medium', label: 'Medium', meta: 'Intermediate level' },
  { key: 'hard', label: 'Hard', meta: 'Advanced language' },
];

const assessmentFacts = [
  { label: 'Sections', value: '7' },
  { label: 'Questions', value: '44' },
  { label: 'Duration', value: '20 min' },
];

const setupChecks = [
  'New test will be generated for this attempt',
  'Previous local audio answers will be cleared',
  'Camera and microphone checks happen on the next screen',
];

export default function CommunicationEntryPage() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { clearRecordedVideo } = useVideoRecording();

  useEffect(() => {
    localStorage.removeItem('test_start_date');

    const fetchEmail = async () => {
      try {
        logger.info('Fetching user email from profile API...');
        const profile = await getProfile();
        if (profile.email) {
          setEmail(profile.email);
          localStorage.setItem('user_email', profile.email);
          logger.info('Email fetched and updated:', profile.email);
        } else {
          logger.warn('No email found in profile');
        }
      } catch (err) {
        logger.error('Failed to fetch profile:', err);
        const cachedEmail = localStorage.getItem('user_email');
        if (cachedEmail) {
          setEmail(cachedEmail);
          logger.warn('Using cached email from localStorage:', cachedEmail);
        }
      } finally {
        setLoadingEmail(false);
      }
    };
    fetchEmail();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userMode', mode);

      const response = await generateTest({
        email_id: email,
        difficulty: mode,
        do_not_repeat_list: [],
      });

      logger.info('Test generated successfully:', response);

      if (response.test_id) {
        localStorage.setItem('test_id', response.test_id);
      }

      logger.info('Navigating to sections page immediately...');
      router.push('/communication/sections');

      Promise.resolve().then(() => {
        clearAllAudioRecordings();
        clearRecordedVideo();
        sessionStorage.removeItem('text_answers');
        logger.info('Background cleanup completed');
      });
    } catch (err) {
      logger.error('Error generating test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Failed to generate test. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-hidden bg-slate-50 px-5 py-4">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2557a7]">Assessment setup</p>
            <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-950">Communication Assessment</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-slate-600">
              Confirm the account, select the difficulty, and generate a fresh assessment attempt.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {assessmentFacts.map((fact) => (
              <div key={fact.label} className="min-w-[86px] rounded-lg bg-slate-50 px-3 py-2 text-center">
                <p className="text-base font-black leading-none text-[#2557a7]">{fact.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{fact.label}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-950">Attempt Details</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">These settings apply only to the new generated test.</p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label htmlFor="account-email" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Account Email
                </label>
                <input
                  id="account-email"
                  type="email"
                  value={loadingEmail ? '' : email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
                  placeholder={loadingEmail ? 'Fetching your email...' : 'Email not available'}
                />
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {loadingEmail ? 'Loading from your profile...' : 'Authenticated CareerBot account'}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span id="difficulty-level-label" className="block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Difficulty Level
                  </span>
                  <span className="text-xs font-bold text-slate-400">Required</span>
                </div>
                <div role="group" aria-labelledby="difficulty-level-label" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {difficulties.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setMode(d.key)}
                      aria-pressed={mode === d.key}
                      className={`min-h-[74px] rounded-xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 ${
                        mode === d.key
                          ? 'border-[#2557a7] bg-[#2557a7]/5 text-[#2557a7] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-black">{d.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold opacity-75">{d.meta}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-sm font-black text-slate-950">Before continuing</h2>
              <ul className="mt-3 space-y-2">
                {setupChecks.map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs font-semibold leading-5 text-slate-700">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <button
              type="submit"
              disabled={loading || loadingEmail || !email}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2557a7]/15 transition-colors hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? 'Generating Test...' : loadingEmail ? 'Loading...' : 'Continue to Assessment'}
              {!loading && !loadingEmail && <span aria-hidden="true">-&gt;</span>}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
