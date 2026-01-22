'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ReportPage() {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [testDate, setTestDate] = useState('');

  // Get dynamic data from localStorage
  useEffect(() => {
    // Get username from localStorage (stored during signup)
    const username = localStorage.getItem('username') || 'User';
    setCandidateName(username);

    // Get test start date from localStorage (stored when assessment starts)
    const testStartDate = localStorage.getItem('test_start_date');
    if (testStartDate) {
      const date = new Date(testStartDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setTestDate(formattedDate);
    } else {
      // Fallback to current date if not found
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setTestDate(formattedDate);
    }
  }, []);

  // Assessment results structure
  const assessmentResults = {
    candidateName: candidateName,
    testDate: testDate,
    totalTime: '45 minutes',
    sections: [
      { name: 'See and Repeat', questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Listen and Repeat', questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Jumbled Sentences', questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Sentence Completion', questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Listen and Correct', questionsCompleted: 8, totalQuestions: 8 },
      { name: 'Story Listening', questionsCompleted: 3, totalQuestions: 3 },
      { name: 'Situation Explaining', questionsCompleted: 1, totalQuestions: 1 },
    ],
  };

  const totalQuestions = assessmentResults.sections.reduce(
    (sum, section) => sum + section.totalQuestions,
    0
  );
  const completedQuestions = assessmentResults.sections.reduce(
    (sum, section) => sum + section.questionsCompleted,
    0
  );

  const handleDownloadReport = async () => {
    setIsDownloading(true);

    // Simulate PDF generation and download
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real implementation, trigger actual PDF download
    // Example: window.open('/api/download-report?userId=123', '_blank');

    setIsDownloading(false);
    alert('Report downloaded successfully!');
  };

  const handleBackToDashboard = () => {
    router.push('/communication/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Assessment Report
          </h1>
          <p className="text-lg text-gray-600">
            Your detailed communication assessment results
          </p>
        </div>

        {/* Assessment Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            Assessment Summary
          </h2>

          {/* Candidate Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-gray-600 mb-1">Candidate Name</p>
              <p className="text-lg font-bold text-gray-900">{assessmentResults.candidateName}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Test Date</p>
              <p className="text-lg font-bold text-gray-900">{assessmentResults.testDate}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-gray-600 mb-1">Total Time</p>
              <p className="text-lg font-bold text-gray-900">{assessmentResults.totalTime}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">Overall Completion</span>
              <span className="text-2xl font-bold">{completedQuestions}/{totalQuestions}</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${(completedQuestions / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-white/90 mt-2">
              {Math.round((completedQuestions / totalQuestions) * 100)}% Complete
            </p>
          </div>

          {/* Section Breakdown */}
          <h3 className="text-lg font-bold text-gray-900 mb-4">Section Breakdown</h3>
          <div className="space-y-3">
            {assessmentResults.sections.map((section, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{section.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {section.questionsCompleted}/{section.totalQuestions} questions
                  </span>
                  {section.questionsCompleted === section.totalQuestions ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Report Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
            </svg>
            Download Your Report
          </h2>
          <p className="text-gray-600 mb-6">
            Download a detailed PDF report of your assessment results for your records.
          </p>
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
              isDownloading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* Next Steps Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <svg className="w-7 h-7 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            What Happens Next?
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-indigo-700 font-bold text-xs">1</span>
              </div>
              <p className="text-gray-700">
                Your responses will be reviewed by our assessment team
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-indigo-700 font-bold text-xs">2</span>
              </div>
              <p className="text-gray-700">
                You will receive detailed feedback on your communication skills
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-indigo-700 font-bold text-xs">3</span>
              </div>
              <p className="text-gray-700">
                Results will be sent to your registered email within 3-5 business days
              </p>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBackToDashboard}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>Back to Dashboard</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Thank You Message */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 text-sm">
            Thank you for taking the time to complete this assessment. We appreciate your effort! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
