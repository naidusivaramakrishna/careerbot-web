'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  X,
} from 'lucide-react';
import { Card, Button, Alert, AlertDescription, Badge, Progress } from '@/components/common';

/**
 * Practice Mode Page
 *
 * Features:
 * - Record practice answers
 * - Get instant AI feedback
 * - Track score history
 * - Retry questions
 * - View improvement suggestions
 */
export default function PracticePage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<'init' | 'recording' | 'submitted' | 'completed'>('init');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const [currentQuestion, setCurrentQuestion] = useState({
    id: 'q1',
    number: 1,
    total: 5,
    text: 'Tell me about yourself and your background.',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feedback, setFeedback] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questionsAnswered, setQuestionsAnswered] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Start recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio level visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateLevel = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const average = data.reduce((a, b) => a + b) / data.length;
        setAudioLevel(average / 255);
        if (isRecording) requestAnimationFrame(updateLevel);
      };

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      updateLevel();

      // Timer
      let seconds = 0;
      recordingIntervalRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);

        // Auto-stop at 2 minutes
        if (seconds >= 120) {
          handleStopRecording();
        }
      }, 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError('Microphone access denied. Please enable microphone permissions.');
      console.error(err);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setIsRecording(false);
    setSessionState('submitted');
  };

  // Play recorded audio
  const handlePlayRecording = () => {
    if (audioBlob && audioElementRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioElementRef.current.src = url;
      audioElementRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  // Submit answer for feedback
  const handleSubmit = async () => {
    if (!audioBlob) return;

    try {
      setIsLoading(true);
      setError(null);

      // Will replace with submitPracticeAnswer API call
      // const result = await submitPracticeAnswer(sessionId, currentQuestion.id, audioBlob);
      // setFeedback(result);

      // Placeholder: Simulate feedback from backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFeedback({
        transcript:
          'I have 3 years of experience as a software engineer focusing on full-stack development.',
        audio_duration_s: 15,
        rule_scores: {
          filler_count: 2,
          key_points_hit: ['experience', 'role'],
          length_ok: true,
          rule_score: 6.5,
        },
        llm_scores: {
          content: 7,
          clarity: 8,
          structure: 7,
          length: 8,
          weighted: 7.5,
        },
        feedback:
          'Good response overall. You clearly mentioned your experience and role. Try to be more specific about the technologies you use.',
        improved_answer:
          'I have 3 years of experience as a full-stack software engineer, primarily working with React, Node.js, and PostgreSQL. I focus on building scalable web applications.',
      });

      setQuestionsAnswered([
        ...questionsAnswered,
        {
          question: currentQuestion.text,
          score: 7.5,
          attempt: 1,
        },
      ]);

      setSessionState('completed');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError('Failed to submit answer. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry question
  const handleRetry = () => {
    setRecordingTime(0);
    setAudioBlob(null);
    setFeedback(null);
    setSessionState('init');
    setIsPlayingRecording(false);
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentQuestion.number < currentQuestion.total) {
      setCurrentQuestion({
        ...currentQuestion,
        number: currentQuestion.number + 1,
      });
      handleRetry();
    } else {
      router.push('/interview/mock');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Mode</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Record your answer and get AI feedback
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question {currentQuestion.number} of {currentQuestion.total}
              </div>
              <Progress value={(currentQuestion.number / currentQuestion.total) * 100} className="mt-2" />
            </div>
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

        {/* Question Card */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900">
          <Badge className="mb-4">Question {currentQuestion.number}/{currentQuestion.total}</Badge>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
            {currentQuestion.text}
          </h2>
        </Card>

        {/* Recording Interface */}
        {(sessionState === 'init' || sessionState === 'recording') && !feedback && (
          <Card className="p-8 mb-6">
            <div className="space-y-6">
              {/* Audio Visualizer */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full transition-all"
                      style={{
                        height: `${Math.sin(i * 0.3) * audioLevel * 120 + 4}px`,
                        background: `linear-gradient(to top, #2557a7, #4a8fdb)`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Main Button */}
              <div className="flex flex-col items-center gap-4">
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

                {/* Timer */}
                {isRecording && (
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Instructions */}
              {!isRecording && recordingTime === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    📝 Tip: Aim for 30-90 seconds. Speak clearly and naturally. Avoid filler words.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recording Preview */}
        {audioBlob && !feedback && (
          <Card className="p-6 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your Recording</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayRecording}
                disabled={isPlayingRecording}
              >
                {isPlayingRecording ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Duration: {recordingTime} seconds
              </div>
              <audio
                ref={audioElementRef}
                onEnded={() => setIsPlayingRecording(false)}
              />
            </div>
          </Card>
        )}

        {/* Submit Actions */}
        {audioBlob && !feedback && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !audioBlob}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Getting Feedback...
                </>
              ) : (
                'Submit for Feedback'
              )}
            </Button>
            <Button variant="outline" onClick={handleRetry} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="space-y-6 mb-6">
            {/* Score Card */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Overall Score
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {feedback.llm_scores.weighted.toFixed(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/10</span>
                  </div>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </Card>

            {/* Detailed Scores */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detailed Scores</h3>
              <div className="space-y-4">
                {[
                  { label: 'Content', score: feedback.llm_scores.content },
                  { label: 'Clarity', score: feedback.llm_scores.clarity },
                  { label: 'Structure', score: feedback.llm_scores.structure },
                  { label: 'Length', score: feedback.llm_scores.length },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.score}/10
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${(item.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transcript */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your Transcript</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feedback.transcript}
                </p>
              </div>
            </Card>

            {/* Feedback */}
            <Card className="p-6 bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                💡 AI Feedback
              </h3>
              <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed mb-4">
                {feedback.feedback}
              </p>
            </Card>

            {/* Improved Answer */}
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                ✨ Improved Answer Example
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {feedback.improved_answer}
                </p>
              </div>
            </Card>

            {/* Next Actions */}
            <div className="flex gap-3">
              <Button onClick={handleNextQuestion} className="flex-1">
                {currentQuestion.number < currentQuestion.total ? (
                  <>
                    Next Question <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Finish <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Questions Answered Summary */}
        {questionsAnswered.length > 0 && (
          <Card className="p-6 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Session Summary</h3>
            <div className="space-y-2">
              {questionsAnswered.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Q{idx + 1}: {item.question.substring(0, 50)}...
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.score.toFixed(1)}/10
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Average Score
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {(
                    questionsAnswered.reduce((a, b) => a + b.score, 0) /
                    questionsAnswered.length
                  ).toFixed(1)}/10
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
