'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateTest } from '@/api/communicationApi';
import { getProfile } from '@/api/userApi';
import { clearAllAudioRecordings } from '@/utils/audioUtils';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import logger from '@/lib/logger';

const difficulties = [
  { key: 'easy',   label: 'Easy',   meta: 'Basic vocabulary' },
  { key: 'medium', label: 'Medium', meta: 'Intermediate level' },
  { key: 'hard',   label: 'Hard',   meta: 'Advanced language' },
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
    // Clear timer state so header doesn't show stale timer from a previous session
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

      logger.info('🚀 Navigating to sections page immediately...');
      router.push('/communication/sections');

      Promise.resolve().then(() => {
        clearAllAudioRecordings();
        clearRecordedVideo();
        sessionStorage.removeItem('text_answers');
        logger.info('✅ Background cleanup completed');
      });
    } catch (err) {
      logger.error('Error generating test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Failed to generate test. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">
            Communication Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Evaluate your English communication skills across 7 sections
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Blue top bar */}
          <div className="h-[3px] bg-[#2557a7] rounded-t-2xl" />

          <form onSubmit={handleSubmit} className="px-7 py-7 space-y-6">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Account Email
              </label>
              <input
                type="email"
                value={loadingEmail ? '' : email}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm cursor-not-allowed focus:outline-none"
                placeholder={loadingEmail ? 'Fetching your email…' : 'Email not available'}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                {loadingEmail ? 'Loading from your profile…' : 'Auto-filled from your CareerBot account'}
              </p>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setMode(d.key)}
                    className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 font-medium text-sm transition-all ${
                      mode === d.key
                        ? 'border-[#2557a7] bg-[#2557a7]/5 text-[#2557a7]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-semibold">{d.label}</span>
                    <span className="text-[10px] font-normal opacity-70">{d.meta}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || loadingEmail || !email}
              className="w-full bg-[#2557a7] hover:bg-[#1e4a94] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {loading
                ? 'Generating Test…'
                : loadingEmail
                ? 'Loading…'
                : 'Continue to Assessment →'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-center divide-x divide-gray-200 text-xs text-gray-400">
          <span className="px-3">7 sections</span>
          <span className="px-3">45 questions</span>
          <span className="px-3">~30 minutes</span>
        </div>

      </div>
    </div>
  );
}
