'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen, Mic, Trophy, ArrowRight, Loader } from 'lucide-react';
import { Card, Button, Alert, AlertDescription, Badge } from '@/components/common';

/**
 * Mock Interview - Practice Mode Page
 *
 * Features:
 * - Generate interview notes from resume
 * - View interview preparation materials
 * - Practice with AI feedback
 * - Track readiness score
 * - Unlock live mock interview when ready
 */
export default function MockInterviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'practice'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load readiness status on mount
  useEffect(() => {
    loadReadinessStatus();
  }, []);

  const loadReadinessStatus = async () => {
    try {
      setIsLoading(true);
      // Will replace with API call once backend is ready
      // const status = await getReadinessStatus();
      // setReadinessScore(status.average_score || 0);
      setReadinessScore(0); // Placeholder
    } catch (err) {
      setError('Failed to load readiness status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Will replace with API call once backend is ready
      // const generatedNotes = await generateNotes(resumeId);
      // setNotes(generatedNotes);

      // Placeholder
      setNotes({
        self_introduction: 'Hello, my name is John...',
        project_explanations: [],
        hr_answers: [],
      });
    } catch (err) {
      setError('Failed to generate notes. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPractice = () => {
    router.push('/interview/mock/practice');
  };

  const handleStartLiveMock = () => {
    if (readinessScore && readinessScore >= 6) {
      router.push('/interview/live');
    } else {
      setError('You need to score at least 6/10 in practice mode before starting a live mock interview.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#2557a7' }}>Mock Interview</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Practice your interview skills with AI-powered feedback
              </p>
            </div>
            <Badge variant={readinessScore && readinessScore >= 6 ? 'success' : 'warning'}>
              Readiness: {readinessScore?.toFixed(1) || '—'}/10
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['overview', 'notes', 'practice'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && <OverviewTab onStartLive={handleStartLiveMock} readinessScore={readinessScore} />}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
            isLoading={isLoading}
            onGenerateNotes={handleGenerateNotes}
            onStartPractice={handleStartPractice}
          />
        )}

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <PracticeTab onStart={handleStartPractice} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Overview Tab - Main interface
 */
function OverviewTab({
  onStartLive,
  readinessScore,
}: {
  onStartLive: () => void;
  readinessScore: number | null;
}) {
  return (
    <div className="space-y-8">
      {/* Journey Progress */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Your Interview Journey
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: 1,
              title: 'Generate Notes',
              description: 'Create AI-powered interview preparation notes',
              icon: BookOpen,
              completed: true,
            },
            {
              step: 2,
              title: 'Learn Phrases',
              description: 'Master 30 essential interview phrases',
              icon: Mic,
              completed: true,
            },
            {
              step: 3,
              title: 'Practice Q&A',
              description: 'Record answers and get instant feedback',
              icon: Trophy,
              completed: readinessScore ? readinessScore >= 4 : false,
            },
            {
              step: 4,
              title: 'Live Mock',
              description: 'Real-time conversation with AI interviewer',
              icon: Mic,
              completed: readinessScore ? readinessScore >= 6 : false,
              locked: readinessScore ? readinessScore < 6 : true,
            },
          ].map(({ step, title, description, icon: Icon, completed, locked }) => (
            <Card
              key={step}
              className={`p-6 transition-all ${
                locked
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                  : 'hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        completed ? 'bg-green-500' : ''
                      }`}
                      style={{ backgroundColor: completed ? '#10b981' : '#2557a7' }}
                    >
                      {step}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
                {locked && (
                  <div className="text-lg">🔒</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Start</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-8 hover:shadow-lg transition-all">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Practice Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Practice answering interview questions and get AI-powered feedback on your responses.
            </p>
            <Button
              onClick={() => window.location.href = '/interview/mock/practice'}
              className="w-full"
            >
              Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          <Card className={`p-8 transition-all ${
            readinessScore && readinessScore >= 6
              ? 'hover:shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900'
              : 'opacity-50'
          }`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Live Mock Interview
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {readinessScore && readinessScore >= 6
                ? 'You\'re ready! Start a live interview with AI.'
                : `Build up your readiness score (currently ${readinessScore?.toFixed(1) || 0}/10) to unlock live mock interviews.`}
            </p>
            <Button
              onClick={onStartLive}
              disabled={!readinessScore || readinessScore < 6}
              className="w-full"
            >
              Start Live Interview <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• Practice in a quiet environment for better audio quality</li>
          <li>• Speak naturally and avoid long pauses</li>
          <li>• Review feedback carefully to improve your answers</li>
          <li>• Practice at least 5 questions before taking the live mock interview</li>
        </ul>
      </Card>
    </div>
  );
}

/**
 * Notes Tab - Interview preparation notes
 */
function NotesTab({
  notes,
  isLoading,
  onGenerateNotes,
  onStartPractice,
}: {
  notes: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isLoading: boolean;
  onGenerateNotes: () => void;
  onStartPractice: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interview Preparation Notes
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-generated notes based on your resume to help you prepare
          </p>
        </div>
        <Button onClick={onGenerateNotes} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Notes'
          )}
        </Button>
      </div>

      {notes ? (
        <div className="space-y-6">
          {/* Self Introduction */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Your Self Introduction
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {notes.self_introduction}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Practice This
              </Button>
            </div>
          </Card>

          {/* Project Explanations */}
          {notes.project_explanations && notes.project_explanations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Project Explanations
              </h3>
              <div className="space-y-4">
                {notes.project_explanations.map((project: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {project.project_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.script}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.key_points?.map((point: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* HR Answers */}
          {notes.hr_answers && notes.hr_answers.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                HR Answer Scripts
              </h3>
              <div className="space-y-4">
                {notes.hr_answers.map((qa: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Q: {qa.question_text}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                      {qa.answer_script}
                    </p>
                    <Button variant="outline" size="sm" onClick={onStartPractice}>
                      Practice This Question
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Notes Generated Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Generate AI-powered interview notes from your resume to get started
          </p>
          <Button onClick={onGenerateNotes} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Notes'}
          </Button>
        </Card>
      )}
    </div>
  );
}

/**
 * Practice Tab - Practice mode interface
 */
function PracticeTab({
  onStart,
  isLoading,
}: {
  onStart: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Practice Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Record your answers and get instant AI feedback
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">HR Practice</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Practice answering common HR interview questions
              </p>
              <Button className="mt-4 w-full" onClick={onStart} disabled={isLoading}>
                Start Practice
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all opacity-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Mic className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Technical Practice</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Available in Week 4 - Practice technical questions for your role
              </p>
              <Button className="mt-4 w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Practice Guidelines */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
        <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3">📋 Practice Guidelines</h3>
        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
          <li>
            <strong>Duration:</strong> Aim for 30-90 seconds per answer
          </li>
          <li>
            <strong>Clarity:</strong> Speak clearly and avoid filler words (um, uh, like)
          </li>
          <li>
            <strong>Structure:</strong> Follow situation-action-result format for behavioral questions
          </li>
          <li>
            <strong>Feedback:</strong> Review AI feedback carefully and retry questions
          </li>
          <li>
            <strong>Consistency:</strong> Practice 5-10 questions to reach readiness level
          </li>
        </ul>
      </Card>
    </div>
  );
}
