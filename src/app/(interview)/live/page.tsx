'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  PhoneOff,
  Settings,
} from 'lucide-react';
import { Card, Button, Alert, AlertDescription, Badge, Progress } from '@/components/common';

/**
 * Live Mock Interview Page
 *
 * Features:
 * - Real-time audio streaming via WebSocket
 * - AI question generation and speaking
 * - Live transcript display
 * - Score tracking
 * - Session recovery on disconnect
 * - Real-time feedback
 */
export default function LiveInterviewPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<'setup' | 'active' | 'completed' | 'error'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    number: number;
    totalCount: number;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [scores, setScores] = useState<Array<{ question: number; score: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Will replace with createLiveSession API call
      // const session = await createLiveSession('HR');
      // setSessionId(session.session_id);

      setSessionId('demo-session-123');
      setSessionState('active');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session');
      setSessionState('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context for level visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Visualize audio level
      const updateLevel = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const average = data.reduce((a, b) => a + b) / data.length;
        setAudioLevel(average / 255);
        if (isRecording) requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Start recording timer
      setIsRecording(true);
      setTranscript('');
      setCurrentScore(null);
      let seconds = 0;

      recordingIntervalRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);

        // Auto-stop after 2 minutes
        if (seconds >= 120) {
          handleStopRecording();
        }
      }, 1000);
    } catch (err: any) {
      setError('Microphone access denied. Please enable microphone permissions.');
      console.error(err);
    }
  };

  // Handle recording stop
  const handleStopRecording = async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setIsRecording(false);

    // Placeholder: Send audio to WebSocket
    // Simulate getting transcript and score
    await new Promise(resolve => setTimeout(resolve, 1500));

    setTranscript('I am a software engineer with 3 years of experience in full-stack development...');
    setCurrentScore(7.5);
    setScores(prev => [...prev, { question: currentQuestion?.number || 1, score: 7.5 }]);
  };

  // Handle next question
  const handleNextQuestion = async () => {
    if (!currentQuestion) return;

    try {
      setIsLoading(true);
      setError(null);

      // Will replace with WebSocket message to backend
      // await sendNextQuestionRequest();

      // Placeholder: Simulate next question
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (currentQuestion.number < currentQuestion.totalCount) {
        setCurrentQuestion({
          text: 'What was the biggest challenge you faced in your last project?',
          number: currentQuestion.number + 1,
          totalCount: currentQuestion.totalCount,
        });
      } else {
        // All questions completed
        setSessionState('completed');
      }

      setTranscript('');
      setCurrentScore(null);
      setRecordingTime(0);
    } catch (err: any) {
      setError('Failed to load next question');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle end interview
  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview? This action cannot be undone.')) {
      try {
        // Will send end_interview message via WebSocket
        setSessionState('completed');
      } catch (err) {
        setError('Failed to end interview');
      }
    }
  };

  // Load initial data
  useEffect(() => {
    if (sessionState === 'setup') {
      initializeSession();
    }
  }, []);

  // Set first question when session starts
  useEffect(() => {
    if (sessionState === 'active' && !currentQuestion) {
      setCurrentQuestion({
        text: 'Tell me about yourself and your background.',
        number: 1,
        totalCount: 8,
      });
    }
  }, [sessionState, currentQuestion]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Mock Interview</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time interview with AI feedback
              </p>
            </div>
            {sessionState === 'active' && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentQuestion ? `Question ${currentQuestion.number} of ${currentQuestion.totalCount}` : '—'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Average Score: {
                    scores.length > 0
                      ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1)
                      : '—'
                  }/10</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndInterview}
                  className="text-red-600 hover:text-red-700"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Setup State */}
        {sessionState === 'setup' && (
          <div className="space-y-6">
            <Card className="p-8 text-center">
              {isLoading ? (
                <>
                  <Loader className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#2557a7' }} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Initializing Interview
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Setting up your live mock interview session...
                  </p>
                </>
              ) : (
                <>
                  <Mic className="h-12 w-12 mx-auto mb-4" style={{ color: '#2557a7' }} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Ready to Start?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You'll be asked 8-10 questions. Answer clearly and naturally.
                  </p>
                  <Button size="lg" onClick={() => setSessionState('active')}>
                    Start Interview
                  </Button>
                </>
              )}
            </Card>

            {/* Pre-Interview Checklist */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Pre-Interview Checklist</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Microphone is working', checked: true },
                  { label: 'You\'re in a quiet environment', checked: false },
                  { label: 'Good internet connection', checked: false },
                  { label: 'Camera/webcam (optional)', checked: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-gray-700 dark:text-gray-300">{item.label}</label>
                  </div>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Active Interview */}
        {sessionState === 'active' && currentQuestion && (
          <div className="space-y-6">
            {/* Question Card */}
            <Card className="p-8" style={{ backgroundColor: '#f0f7ff', borderLeft: '4px solid #2557a7' }}>
              <div className="flex items-start justify-between mb-4">
                <Badge>Question {currentQuestion.number}/{currentQuestion.totalCount}</Badge>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Max duration: 2 minutes
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                {currentQuestion.text}
              </h2>
              {!isRecording && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Click the microphone button below to record your answer.
                </div>
              )}
            </Card>

            {/* Recording Control */}
            <Card className="p-8">
              <div className="flex flex-col items-center gap-6">
                {/* Audio Visualizer */}
                {isRecording && (
                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-center gap-1 h-16">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full transition-all"
                          style={{
                            height: `${Math.sin(i * 0.5) * audioLevel * 100 + 4}px`,
                            background: `linear-gradient(to top, #2557a7, #4a8fdb)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recording Button */}
                <Button
                  size="lg"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={isRecording ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </>
                  )}
                </Button>

                {/* Recording Time */}
                {isRecording && (
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Clock className="h-5 w-5 text-red-600" />
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                  </div>
                )}

                {/* Duration Progress */}
                {isRecording && (
                  <div className="w-full max-w-xs">
                    <Progress value={(recordingTime / 120) * 100} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      {recordingTime < 30 && 'Keep going...'}
                      {recordingTime >= 30 && recordingTime < 90 && 'Good duration!'}
                      {recordingTime >= 90 && 'Wrap up soon...'}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Transcript Display */}
            {transcript && (
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Your Answer</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {transcript}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {recordingTime}s
                </div>
              </Card>
            )}

            {/* Score Display */}
            {currentScore !== null && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Question Score</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {currentScore.toFixed(1)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/10</span>
                    </div>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            {transcript && currentScore !== null && (
              <div className="flex gap-3">
                <Button
                  onClick={handleNextQuestion}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Loading Next Question...
                    </>
                  ) : (
                    'Next Question'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTranscript('');
                    setCurrentScore(null);
                    setRecordingTime(0);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Score Progress */}
            {scores.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Progress</h3>
                <div className="space-y-2">
                  {scores.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Question {item.question}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${(item.score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-8">
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Completed State */}
        {sessionState === 'completed' && (
          <div className="space-y-6">
            <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Interview Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your report is being generated. You'll be redirected shortly...
              </p>
              <Button onClick={() => router.push(`/interview/mock/report?session=${sessionId}`)}>
                View Report
              </Button>
            </Card>
          </div>
        )}

        {/* Error State */}
        {sessionState === 'error' && (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Session Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => router.push('/interview/mock')}>
              Return to Mock Interview
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
