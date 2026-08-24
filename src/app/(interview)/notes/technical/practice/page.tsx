"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Code2, Mic, Clock,
  CheckCircle2, Loader2, AlertCircle, Key, RotateCcw,
} from "lucide-react";
import AudioRecorder from "@/app/(interview)/communication/components/AudioRecorder";
import FeedbackCard from "@/app/(interview)/mock-interview/_components/FeedbackCard";
import TranscriptDisplay from "@/app/(interview)/mock-interview/_components/TranscriptDisplay";
import {
  submitPracticeAnswer, MrTrQuestion, GenerateMrTrQuestionsResponse, SubmitAnswerResponse,
} from "@/api/mockInterviewApi";

const TECH_QUESTIONS_KEY = "tech_generated_questions";
import { useMockInterview } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerState = {
  transcript: string;
  duration: number;
  fillerCount: number;
  keyPointsHit: string[];
  dimensions: { label: string; score: number; weight: string }[];
  weightedScore: number;
  feedback: string;
  improvedAnswer: string;
  answerId?: string;
  whatWasGood?: string[];
  whatToImprove?: string[];
  fillerWords?: { word: string; count: number }[];
  fillerTip?: string;
  targetDurationMin?: number;
  targetDurationMax?: number;
  lengthNote?: string;
  speechRate?: number;
  pauseAnalysis?: string;
  encouragement?: string;
  attemptNumber?: number;
} | null;

type Question = {
  id: string;
  text: string;
  keywords: string[];
  expected_duration_s: number;
};

// ─── Content ──────────────────────────────────────────────────────────────────

function TechnicalPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPracticeAnswered } = useMockInterview();
  const errorDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = searchParams.get("category") ?? "dsa";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerState>>({});
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const showSubmitError = useCallback((msg: string) => {
    if (errorDismissRef.current) clearTimeout(errorDismissRef.current);
    setSubmitError(msg);
    errorDismissRef.current = setTimeout(() => setSubmitError(null), 5000);
  }, []);

  useEffect(() => {
    let stored: GenerateMrTrQuestionsResponse | null = null;
    try {
      const raw = sessionStorage.getItem(TECH_QUESTIONS_KEY);
      if (raw) {
        stored = JSON.parse(raw) as GenerateMrTrQuestionsResponse;
        sessionStorage.removeItem(TECH_QUESTIONS_KEY);
      }
    } catch {}

    if (!stored || stored.questions.length === 0) {
      setSessionError("No questions found. Please go back and start technical practice again.");
      setSessionLoading(false);
      return;
    }

    setSessionId(stored.session_id);
    setQuestions(
      stored.questions.map((q: MrTrQuestion) => ({
        id: q.id,
        text: q.text,
        keywords: q.key_points,
        expected_duration_s: q.time_limit_s,
      }))
    );
    setSessionLoading(false);
  }, []);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answeredMap).length;

  const handleRecordingComplete = useCallback(async (blob: Blob, durationMs?: number) => {
    if (!question) return;

    if (durationMs !== undefined && durationMs < 2000) {
      showSubmitError("No speech detected. Please speak clearly for at least 2 seconds when recording.");
      return;
    }

    setIsSubmitting(true);
    setCurrentAnswer(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");
      if (sessionId) formData.append("session_id", sessionId);
      formData.append("question_id", question.id);

      const api = await submitPracticeAnswer(formData) as unknown as SubmitAnswerResponse;
      const answer: AnswerState = {
        transcript: api.transcript,
        duration: durationMs !== undefined ? Math.round(durationMs / 1000) : 0,
        fillerCount: api.rule_scores.filler_count,
        keyPointsHit: api.rule_scores.key_points_hit,
        weightedScore: api.scores.weighted_score,
        feedback: api.feedback.improvements.join(" "),
        improvedAnswer: api.feedback.improved_answer,
        whatWasGood: api.feedback.good_points,
        whatToImprove: api.feedback.improvements,
        encouragement: api.feedback.encouragement,
        dimensions: [
          { label: "Content",   score: api.scores.content_score,   weight: "40%" },
          { label: "Clarity",   score: api.scores.clarity_score,   weight: "30%" },
          { label: "Structure", score: api.scores.structure_score, weight: "20%" },
          { label: "Length",    score: api.scores.length_score,    weight: "10%" },
        ],
        targetDurationMin: Math.round(question.expected_duration_s * 0.7),
        targetDurationMax: question.expected_duration_s,
      };
      setAnsweredMap((m) => ({ ...m, [question.id]: answer }));
      setCurrentAnswer(answer);
    } catch {
      const fallback: AnswerState = {
        transcript: "Transcript unavailable — re-record to get a full transcript.",
        duration: durationMs !== undefined ? Math.round(durationMs / 1000) : 0,
        fillerCount: 0,
        keyPointsHit: [],
        weightedScore: 5,
        feedback: "Evaluation was temporarily unavailable.",
        improvedAnswer: "Re-record this answer to receive an AI-improved version.",
        whatWasGood: ["Your answer was received"],
        whatToImprove: ["Re-record for full AI feedback"],
        encouragement: "Good effort — recording again will give you complete feedback.",
        dimensions: [
          { label: "Content",   score: 5, weight: "40%" },
          { label: "Clarity",   score: 5, weight: "30%" },
          { label: "Structure", score: 5, weight: "20%" },
          { label: "Length",    score: 5, weight: "10%" },
        ],
        targetDurationMin: Math.round(question.expected_duration_s * 0.7),
        targetDurationMax: question.expected_duration_s,
      };
      setAnsweredMap((m) => ({ ...m, [question.id]: fallback }));
      setCurrentAnswer(fallback);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, question, showSubmitError]);

  const handleNext = () => {
    setCurrentAnswer(null);
    setPracticeAnswered(Object.keys(answeredMap).length);
    if (isLastQuestion) {
      router.push("/mock-interview/live");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleTryAgain = () => setCurrentAnswer(null);

  // Loading 
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Preparing questions...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (sessionError || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Questions Unavailable</h2>
          <p className="text-sm text-gray-500 mb-4">{sessionError ?? "No questions were returned for this category."}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/notes/technical")}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  //  Main UI 
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4">

      <button
        onClick={() => router.push("/notes/technical")}
        className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm transition-colors hover:text-gray-800"
      >
        <ChevronLeft size={14} /> Back
      </button>

      {/* Submit error */}
      {submitError && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} className="text-[#2557a7] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-800 font-medium">{submitError}</p>
          </div>
          <button onClick={() => setSubmitError(null)} className="text-gray-400 hover:text-[#2557a7] text-xs shrink-0">Dismiss</button>
        </div>
      )}

      {/* Long answer warning */}

      {/* Header: title + question circles */}
      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black px-3 py-1.5 bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/15 rounded-full capitalize">
              {category.toUpperCase() === "DSA" ? "DSA" : category}
            </span>
          </div>
          <h1 className="text-lg font-black text-gray-950">Technical Practice</h1>
          <p className="mt-0.5 text-[11px] font-medium text-gray-500">Explain approach, constraints, trade-offs, and edge cases.</p>
        </div>

        <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              aria-label={`Go to question ${i + 1}${answeredMap[q.id] ? ", answered" : ""}`}
              onClick={() => { setCurrentIndex(i); setCurrentAnswer(answeredMap[q.id] ?? null); }}
              className={`h-8 w-8 shrink-0 rounded-full text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 ${
                i === currentIndex
                  ? "bg-[#2557a7] text-white shadow-md scale-105"
                  : answeredMap[q.id]
                  ? "bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/30"
                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {answeredMap[q.id] ? <CheckCircle2 size={14} className="mx-auto" /> : i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-label="Question progress"
            className="h-full bg-[#2557a7] rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* Left column */}
        <div className="space-y-3">

          {/* Question card */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="h-1 bg-[#2557a7]" />
            <div className="px-4 pt-3 pb-2.5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question {currentIndex + 1}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">technical</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                  <Clock size={12} />
                  {question.expected_duration_s}s target
                </div>
              </div>
            </div>
            <div className="px-4 py-4">
              <p className="text-base font-black text-gray-950 leading-snug">{question.text}</p>
            </div>
          </div>

          {/* Recorder */}
          {!currentAnswer && !isSubmitting && (
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 mb-2.5">
                <Mic size={16} className="text-[#2557a7]" />
                <p className="text-sm font-semibold text-gray-700">Record Your Answer</p>
              </div>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                maxDuration={Math.min(Math.round(question.expected_duration_s * 1.5), 120)}
              />
            </div>
          )}

          {/* Submitting */}
          {isSubmitting && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <Loader2 size={32} className="text-[#2557a7] animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Analysing your answer...</p>
              <p className="text-xs text-gray-400">Transcribing - Checking - Scoring</p>
            </div>
          )}

          {/* Transcript */}
          {currentAnswer && (
            <TranscriptDisplay
              transcript={currentAnswer.transcript}
              duration={currentAnswer.duration}
              fillerCount={currentAnswer.fillerCount}
              keyPointsHit={currentAnswer.keyPointsHit}
            />
          )}

          {/* Navigation buttons */}
          {currentAnswer && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {currentIndex > 0 && (
                <button
                  onClick={() => { setCurrentIndex((i) => i - 1); setCurrentAnswer(answeredMap[questions[currentIndex - 1].id] ?? null); }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50"
                >
                  <ChevronLeft size={15} /> Back
                </button>
              )}
              <button
                onClick={handleTryAgain}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <RotateCcw size={14} className="text-gray-500" /> Record Again
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2557a7] py-2.5 text-xs font-black text-white shadow-lg shadow-[#2557a7]/15 transition-all hover:bg-[#1e4a8f]"
              >
                {isLastQuestion ? "Start Live Interview" : "Next Question"}
                <ChevronRight size={15} />
              </button>
            </div>
          )}

        </div>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {currentAnswer && (
            <FeedbackCard
              weightedScore={currentAnswer.weightedScore}
              feedback={currentAnswer.feedback}
              improvedAnswer={currentAnswer.improvedAnswer}
              dimensions={currentAnswer.dimensions}
              whatWasGood={currentAnswer.whatWasGood}
              whatToImprove={currentAnswer.whatToImprove}
              fillerWords={currentAnswer.fillerWords}
              fillerTip={currentAnswer.fillerTip}
              answerDuration={currentAnswer.duration}
              targetDurationMin={currentAnswer.targetDurationMin}
              targetDurationMax={currentAnswer.targetDurationMax}
              lengthNote={currentAnswer.lengthNote}
              speechRate={currentAnswer.speechRate}
              pauseAnalysis={currentAnswer.pauseAnalysis}
              encouragement={currentAnswer.encouragement}
              attemptNumber={currentAnswer.attemptNumber}
              onTryAgain={handleTryAgain}
              answerId={currentAnswer.answerId}
            />
          )}
          {!currentAnswer && (
            <>
              {question.keywords.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Key size={13} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600">Key points to cover</span>
                  </div>
                  <div className="max-h-52 overflow-auto">
                    <div className="flex flex-wrap gap-2">
                      {question.keywords.map((kw, i) => (
                        <span key={i} className="text-xs font-semibold bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/20 rounded-lg px-2.5 py-1">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="w-14 h-14 bg-[#2557a7]/5 rounded-lg flex items-center justify-center">
                  <Code2 size={24} className="text-[#2557a7]" />
                </div>
                <p className="text-sm font-black text-gray-800">AI Feedback</p>
                <p className="max-w-56 text-[11px] font-medium leading-5 text-gray-500">
                  Record your answer to unlock score breakdowns, key-point coverage, and a stronger model response.
                </p>
              </div>
            </>
          )}
        </aside>

      </div>
    </main>
  );
}

export default function TechnicalPracticePage() {
  return (
    <Suspense>
      <TechnicalPracticeContent />
    </Suspense>
  );
}
