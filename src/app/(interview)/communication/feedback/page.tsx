'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitFinalReport } from '@/api/communicationApi';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import logger from '@/lib/logger';

export default function FeedbackPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Please provide a rating before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API to submit feedback
      // await submitFeedbackAPI({ rating, feedbackText });

      logger.info('Feedback submitted:', { rating, feedbackText });

      // Call final report API
      await submitFinalReportAPI();

      // Navigate to report page after successful submission
      router.push('/communication/report');
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);

    try {
      // Call final report API even when skipping feedback
      await submitFinalReportAPI();

      // Navigate to report page without submitting feedback
      router.push('/communication/report');
    } catch (error) {
      logger.error('Error submitting final report:', error);
      alert('Failed to generate report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const submitFinalReportAPI = async () => {
    // Get required data from localStorage
    const emailId = localStorage.getItem('userEmail');
    const testId = localStorage.getItem('test_id');
    const videoEvaluationId = localStorage.getItem('video_evaluation_id');
    const audioEvaluationId = localStorage.getItem('audio_evaluation_id');

    if (!emailId || !testId) {
      throw new Error('Missing required information (email or test_id)');
    }

    logger.info('📋 Final report request data:', {
      email_id: emailId,
      test_id: testId,
      video_evaluation_id: videoEvaluationId || '(none)',
      audio_evaluation_id: audioEvaluationId || '(none)',
    });

    // ✅ Call final report API with only IDs
    // Backend will retrieve full evaluation data using these IDs
    const response = await submitFinalReport({
      email_id: emailId,
      test_id: testId,
      video_evaluation_id: videoEvaluationId,
      audio_evaluation_id: audioEvaluationId,
    });

    logger.info('✅ Final report submitted successfully:', response);
    return response;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content - with left margin for sidebar and top margin for header */}
      <main className="ml-20 pt-14">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Share Your Feedback
            </h1>
            <p className="text-lg text-gray-600">
              Help us improve! We would love to hear about your experience with this assessment.
            </p>
          </div>

          {/* Feedback Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
            <div className="space-y-6">
              {/* Rating Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-4">
                  How would you rate this assessment? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      type="button"
                    >
                      <svg
                        className={`w-14 h-14 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-base text-gray-600 mt-4">
                    You rated: <span className="font-semibold text-purple-600">{rating} star{rating > 1 ? 's' : ''}</span>
                  </p>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Comments Section */}
              <div>
                <label htmlFor="feedback" className="block text-lg font-semibold text-gray-800 mb-3">
                  Additional Comments (Optional)
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-none text-gray-700"
                  placeholder="Tell us about your experience with the assessment. What did you like? What could be improved?"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Your feedback helps us create better assessments for everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Feedback
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Submitting or skipping will take you to your assessment report
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
