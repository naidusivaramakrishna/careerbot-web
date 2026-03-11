'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Download,
  Share2,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Award,
  Target,
  Loader,
} from 'lucide-react';
import { Card, Button, Alert, AlertDescription } from '@/components/common';

/**
 * Mock Interview Report Page
 *
 * Displays:
 * - Overall score and breakdown
 * - Strengths and improvements
 * - Per-question analysis
 * - Recommendations
 * - PDF export
 * - Share link generation
 */
function MockInterviewReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Placeholder report data
  const [report, setReport] = useState<any>(null);

  // Load report on mount
  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Will replace with getMockReport API call
      // const data = await getMockReport(sessionId);
      // setReport(data);

      // Placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000));

      setReport({
        session_id: sessionId,
        overall_score: 7.2,
        hr_score: 7.5,
        communication_score: 7.0,
        confidence_score: 6.8,
        pressure_score: 7.4,
        strengths: [
          'Clear and articulate communication',
          'Good handling of pressure situations',
          'Well-structured answers',
        ],
        improvements: [
          'Reduce filler words (um, uh, like)',
          'Add more specific examples from projects',
          'Practice confidence in technical areas',
        ],
        redo_questions: [
          {
            question_id: 'q3',
            question_text: 'Tell me about a time you failed',
            score: 5.8,
            reason_to_redo: 'Answer was too brief. Expand on learnings.',
          },
        ],
        reattempt_suggestion:
          'Great progress! Focus on the questions marked for retry and practice with more specific examples.',
        action_plan:
          '1. Record yourself answering the retry questions\n2. Focus on eliminating filler words\n3. Practice storytelling techniques\n4. Attempt live mock again in 3 days',
        question_breakdown: [
          { question_id: 'q1', score: 8.2, key_issue: null },
          { question_id: 'q2', score: 7.5, key_issue: null },
          { question_id: 'q3', score: 5.8, key_issue: 'Brief answer, lacking detail' },
          { question_id: 'q4', score: 7.1, key_issue: null },
        ],
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setError('Failed to load report. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setError(null);

      // Will replace with downloadReportPDF API call
      // const blob = await downloadReportPDF(sessionId);
      // const url = URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `interview-report-${sessionId}.pdf`;
      // link.click();

      // Placeholder: Show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('PDF download started');
    } catch (err) {
      setError('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setError(null);

      // Will replace with createShareLink API call
      // const result = await createShareLink(sessionId);
      // setShareUrl(result.share_url);

      // Placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = `${window.location.origin}/interview/shared-report/demo-token`;
      setShareUrl(url);

      // Copy to clipboard
      navigator.clipboard.writeText(url);
    } catch (err) {
      setError('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700">Loading your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#e8eff9' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Interview Report</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert - Share Link */}
        {shareUrl && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              ✅ Share link copied to clipboard!
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Overall Score
                  </h2>
                  <p className="text-gray-700">
                    {report.overall_score >= 8
                      ? '🎉 Excellent! You are well-prepared for interviews.'
                      : report.overall_score >= 7
                        ? '👍 Good progress! Keep practicing.'
                        : 'Keep working on your skills. Practice makes perfect!'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">
                    {report.overall_score.toFixed(1)}
                  </div>
                  <div className="text-gray-600">/10</div>
                </div>
              </div>
            </Card>

            {/* Score Breakdown */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Score Breakdown</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: 'HR Questions', score: report.hr_score },
                  { label: 'Communication', score: report.communication_score },
                  { label: 'Confidence', score: report.confidence_score },
                  { label: 'Pressure Handling', score: report.pressure_score },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {item.score.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strengths */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Your Strengths</h3>
              </div>
              <ul className="space-y-2">
                {report.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Areas for Improvement */}
            <Card className="p-6 border-l-4 border-l-blue-600">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Areas for Improvement</h3>
              </div>
              <ul className="space-y-2">
                {report.improvements.map((improvement: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Questions to Retry */}
            {report.redo_questions && report.redo_questions.length > 0 && (
              <Card className="p-6 border-l-4 border-l-orange-600">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Questions to Practice Again
                </h3>
                <div className="space-y-3">
                  {report.redo_questions.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {item.question_text}
                        </p>
                        <span className="text-sm font-semibold text-orange-600">
                          {item.score.toFixed(1)}/10
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.reason_to_redo}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Plan */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">📋 Action Plan</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {report.action_plan}
              </p>
            </Card>

            {/* Question Results Table */}
            <Card className="p-6 overflow-x-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Question Results</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Question</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Score</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.question_breakdown.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-700">
                        Question {idx + 1}
                      </td>
                      <td className="text-right py-3 px-3 font-semibold text-gray-900">
                        {item.score.toFixed(1)}/10
                      </td>
                      <td className="py-3 px-3">
                        {item.key_issue ? (
                          <span className="inline-block px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                            ⚠️ Needs Work
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                            ✓ Good
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="outline"
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </>
                )}
              </Button>

              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="flex-1"
              >
                {isSharing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Report
                  </>
                )}
              </Button>
            </div>

            {/* Next Steps */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">Next Steps</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>
                  1. <strong>Practice the retry questions</strong> using practice mode
                </li>
                <li>
                  2. <strong>Take another mock interview</strong> in 2-3 days
                </li>
                <li>
                  3. <strong>Track your progress</strong> over time
                </li>
                <li>
                  4. <strong>Schedule your real interview</strong> when you're confident
                </li>
              </ol>
            </Card>

            {/* Back Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => router.push('/interview/mock')}
                variant="outline"
              >
                ← Back to Mock Interview
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MockInterviewReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MockInterviewReportContent />
    </Suspense>
  );
}
