'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { downloadReportPdf } from '@/api/communicationApi';
import { getProfile } from '@/api/userApi';
// import Sidebar from '@/components/layout/Sidebar';
// import Header from '@/components/layout/Header';
import logger from '@/lib/logger';

export default function ReportPage() {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [timeTaken, setTimeTaken] = useState('—');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profile = await getProfile();
        const fullName = profile.full_name || profile.username || 'User';
        setCandidateName(fullName);
        logger.info('✅ Loaded candidate name from profile:', fullName);
      } catch (error) {
        logger.error('❌ Failed to fetch user profile:', error);
        const username = localStorage.getItem('username') || 'User';
        setCandidateName(username);
      }

      const testStartDate = localStorage.getItem('test_start_date');
      if (testStartDate) {
        const date = new Date(testStartDate);
        setTestDate(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

        // Calculate time taken
        const endTimeStr = localStorage.getItem('assessment_end_time');
        const endMs = endTimeStr ? new Date(endTimeStr).getTime() : Date.now();
        const diffMs = endMs - new Date(testStartDate).getTime();
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeTaken(secs > 0 ? `${mins}m ${secs}s` : `${mins} min`);
      } else {
        setTestDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    };

    fetchUserData();
  }, []);

  const assessmentResults = {
    candidateName,
    testDate,
    totalTime: timeTaken,
    sections: [
      { name: 'See and Repeat',       questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Listen and Repeat',    questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Jumbled Sentences',    questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Sentence Completion',  questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Listen and Correct',   questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Story Listening',      questionsCompleted: 3, totalQuestions: 3 },
      { name: 'Situation Explaining', questionsCompleted: 1, totalQuestions: 1 },
    ],
  };

  const totalQuestions = assessmentResults.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
  const completedQuestions = assessmentResults.sections.reduce((sum, s) => sum + s.questionsCompleted, 0);
  const completionPercent = Math.round((completedQuestions / totalQuestions) * 100);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const testId = localStorage.getItem('test_id');
      if (!testId) {
        alert('Test ID not found. Please complete an assessment first.');
        setIsDownloading(false);
        return;
      }

      logger.info('Downloading PDF report for test_id:', testId);
      const pdfBlob = await downloadReportPdf(testId);

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assessment-report-${testId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('PDF downloaded successfully');
    } catch (error) {
      logger.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Sidebar /> */}
      {/* <Header /> */}

      <main>
        <div className="max-w-3xl mx-auto px-5 py-12">

          {/* Success Banner */}
          <div className="bg-[#2557a7] rounded-2xl p-7 mb-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">Assessment Complete</p>
                <h1 className="text-xl font-bold text-white">Communication Assessment Report</h1>
                <p className="text-sm text-white/70 mt-1">Your responses have been recorded and are being evaluated.</p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Assessment Summary</h2>
              <span className="text-xs text-gray-400">{assessmentResults.testDate}</span>
            </div>

            {/* Candidate info */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'Candidate', value: assessmentResults.candidateName || '—' },
                { label: 'Date',      value: assessmentResults.testDate      || '—' },
                { label: 'Duration',  value: assessmentResults.totalTime              },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Overall progress */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Overall Completion</p>
                <span className="text-sm font-bold text-[#2557a7]">
                  {completedQuestions}/{totalQuestions} questions
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[#2557a7] rounded-full transition-all duration-700"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{completionPercent}% complete</p>
            </div>

            {/* Section breakdown */}
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Section Breakdown</p>
              <div className="space-y-2">
                {assessmentResults.sections.map((section, index) => {
                  const done = section.questionsCompleted === section.totalQuestions;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="w-6 h-6 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#2557a7]">{index + 1}</span>
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-800">{section.name}</span>
                      <span className="text-xs text-gray-400 mr-2">
                        {section.questionsCompleted}/{section.totalQuestions}
                      </span>
                      {done ? (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Download Report */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Download Report</h2>
            </div>
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-700 font-medium">Detailed PDF Report</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Download your full assessment results for your records.
                </p>
              </div>
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="shrink-0 px-5 py-2.5 bg-[#2557a7] hover:bg-[#1e4a94] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">What Happens Next?</h2>
            </div>
            <div className="px-6 py-5">
              <ol className="space-y-4">
                {[
                  'Your responses will be reviewed by our assessment team.',
                  'You will receive detailed feedback on your communication skills.',
                  'Results will be sent to your registered email within 3–5 business days.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#2557a7]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#2557a7]">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/communication/dashboard')}
              className="bg-[#2557a7] hover:bg-[#1e4a94] text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Back to Dashboard →
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Thank you for completing the Communication Assessment.
          </p>

        </div>
      </main>
    </div>
  );
}
