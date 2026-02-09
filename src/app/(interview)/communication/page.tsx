'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateTest } from '@/api/communicationApi';
import { getProfile } from '@/api/userApi';
import { clearAllAudioRecordings } from '@/utils/audioUtils';
import { useVideoRecording } from '@/contexts/VideoRecordingContext';
import logger from '@/lib/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { clearRecordedVideo } = useVideoRecording();

  // ✅ Auto-fill email from profile API (always fetch fresh data)
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        logger.info('Fetching user email from profile API...');
        const profile = await getProfile();

        if (profile.email) {
          setEmail(profile.email);
          // Update localStorage with fresh data
          localStorage.setItem('user_email', profile.email);
          logger.info('Email fetched and updated:', profile.email);
        } else {
          logger.warn('No email found in profile');
        }
      } catch (err) {
        logger.error('Failed to fetch profile:', err);

        // ✅ Only fallback to localStorage if API fails
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
      // Store email and mode in localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userMode', mode);

      // Call the generate test API
      const response = await generateTest({
        email_id: email,
        difficulty: mode,
        do_not_repeat_list: [], // Add logic to fetch previously attempted questions if needed
      });

      logger.info('Test generated successfully:', response);

      // Store test_id in localStorage for later use
      if (response.test_id) {
        localStorage.setItem('test_id', response.test_id);
      }

      // ✅ OPTIMISTIC NAVIGATION: Navigate immediately for better UX
      logger.info('🚀 Navigating to sections page immediately...');
      router.push('/communication/sections');

      // ✅ Run cleanup in background (fire-and-forget)
      // Clear all previous audio recordings, video recordings, and text answers
      // This ensures only current test's files are attached to the APIs
      Promise.resolve().then(() => {
        clearAllAudioRecordings();
        clearRecordedVideo();
        sessionStorage.removeItem('text_answers');
        logger.info('✅ Background cleanup completed: audio recordings, video recording, and text answers cleared');
      });

    } catch (err: any) {
      logger.error('Error generating test:', err);
      setError(err?.response?.data?.message || 'Failed to generate test. Please try again.');
      setLoading(false);
    }
    // Note: Don't setLoading(false) on success since we're navigating away
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Communication Assessment</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={loadingEmail ? '' : email}
              readOnly
              required
              className="w-full px-4 py-3 border text-gray-700 bg-gray-100 border-gray-300 rounded-lg cursor-not-allowed"
              placeholder={loadingEmail ? "Loading email..." : "Email not found"}
            />
            <p className="mt-1 text-xs text-gray-500">
              Email is auto-filled from your account
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
            <div className="flex space-x-4">
              {['easy', 'medium', 'hard'].map((m) => (
                <label key={m} className="flex items-center">
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 capitalize">{m}</span>
                </label>
              ))}
            </div>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || loadingEmail || !email}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating Test...' : loadingEmail ? 'Loading...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

