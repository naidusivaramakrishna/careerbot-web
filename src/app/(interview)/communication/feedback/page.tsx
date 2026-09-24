'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { submitFinalReport } from '@/api/communicationApi';
import { getProfile } from '@/api/userApi';
// import Sidebar from '@/components/layout/Sidebar';
// import Header from '@/components/layout/Header';
import logger from '@/lib/logger';

// useSearchParams must be inside a Suspense boundary for static export (Next.js).
// The default export below wraps the content component in <Suspense>.
function FeedbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEarlyTermination = searchParams.get('reason') !== null; // covers timeout and violations

  // Exit fullscreen when feedback page loads - assessment is over regardless of how we got here
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Please provide a rating before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info('Feedback submitted:', { rating, feedbackText });
      if (isEarlyTermination) {
        router.push('/dashboard');
        return;
      }
      await submitFinalReportAPI();
      router.push('/communication/report');
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      if (isEarlyTermination) {
        router.push('/dashboard');
        return;
      }
      await submitFinalReportAPI();
      router.push('/communication/report');
    } catch (error) {
      logger.error('Error submitting final report:', error);
      alert('Failed to generate report. Please try again.');
      setIsSkipping(false);
    }
  };

  const submitFinalReportAPI = async () => {
    const profile = await getProfile();
    const emailId = profile?.email;
    const testId = localStorage.getItem('test_id');
    const videoEvaluationId = localStorage.getItem('video_evaluation_id');
    const audioEvaluationId = localStorage.getItem('audio_evaluation_id');
    const mcqEvaluationId = localStorage.getItem('mcq_evaluation_id');

    if (!emailId || !testId) {
      throw new Error('Missing required information (email or test_id)');
    }

    logger.info('ðŸ“‹ Final report request data:', {
      email_id: emailId,
      test_id: testId,
      video_evaluation_id: videoEvaluationId || '(none)',
      audio_evaluation_id: audioEvaluationId || '(none)',
      mcq_evaluation_id: mcqEvaluationId || '(none)',
      sample_report: false,
    });

    const response = await submitFinalReport({
      email_id: emailId,
      test_id: testId,
      video_evaluation_id: videoEvaluationId || undefined,
      audio_evaluation_id: audioEvaluationId || undefined,
      mcq_evaluation_id: mcqEvaluationId || undefined,
      sample_report: false,
    });

    logger.info(' Final report submitted successfully:', response);
    return response;
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 assessment-scroll">
      {/* <Sidebar /> */}
      {/* <Header /> */}

      <main>
        <div className="mx-auto max-w-xl px-5 py-10">

          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2557a7] shadow-lg shadow-[#2557a7]/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Share Your Feedback</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              Help us improve the assessment experience. Your feedback is appreciated.
            </p>
          </div>

          {/* Feedback Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">

            {/* Blue top bar */}
            <div className="h-1 bg-[#2557a7]" />

            <div className="p-7 space-y-7">

              {/* Rating */}
              <div>
                <span id="rating-label" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  How would you rate this assessment? <span className="text-red-500 normal-case font-normal">*</span>
                </span>

                <div role="group" aria-labelledby="rating-label" className="flex gap-2 justify-center mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <svg
                        className={`w-10 h-10 transition-colors ${
                          star <= displayRating ? 'text-amber-400' : 'text-gray-200'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>

                {displayRating > 0 && (
                  <p className="text-center text-sm text-slate-600">
                    <span className="font-bold text-[#2557a7]">{ratingLabels[displayRating]}</span>
                    {' '}- {displayRating} star{displayRating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* Comment */}
              <div>
                <label htmlFor="feedback" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Additional Comments <span className="normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#2557a7] focus:ring-2 focus:ring-[#2557a7]/10 focus:outline-none transition-all resize-none text-sm text-slate-700 bg-slate-50 placeholder-gray-400"
                  placeholder="Tell us what you liked or how we can improve the assessment..."
                />
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || isSkipping}
              className="flex-1 py-3.5 bg-[#2557a7] hover:bg-[#1e4a94] disabled:bg-gray-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting || isSkipping}
              className="sm:w-auto px-7 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              {isSkipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Skipping...
                </>
              ) : (
                'Skip'
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            {isEarlyTermination
              ? 'Submitting or skipping will take you to your dashboard.'
              : 'Submitting or skipping will take you to your assessment report.'}
          </p>

        </div>
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="h-full bg-slate-50" />}>
      <FeedbackPageContent />
    </Suspense>
  );
}
