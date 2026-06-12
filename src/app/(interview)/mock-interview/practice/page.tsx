"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Mic,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Key,
  RotateCcw,
} from "lucide-react";
import AudioRecorder from "@/app/(interview)/communication/components/AudioRecorder";
import FeedbackCard from "../_components/FeedbackCard";
import TranscriptDisplay from "../_components/TranscriptDisplay";
import { startPractice, submitPracticeAnswer, getPracticeProgress, getNotes, SubmitAnswerResponse } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";

// ─── Note-matching helpers ────────────────────────────────────────────────────

function wordOverlap(a: string, b: string): number {
  const words = (s: string) => s.split(/\W+/).filter((w) => w.length > 3);
  const aSet = new Set(words(a));
  const bWords = words(b);
  const matches = bWords.filter((w) => aSet.has(w)).length;
  return matches / Math.max(aSet.size, 1);
}

function matchNoteScript(questionText: string, notes: Record<string, unknown>): string {
  const text = questionText.toLowerCase();

  if (text.includes("about yourself") || text.includes("introduce") || text.includes("background")) {
    const raw = notes.self_introduction;
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object") return (raw as { script?: string }).script ?? "";
    return "";
  }

  const hrAnswers = notes.hr_answers as Array<{ question_text: string; answer_script: string | { script?: string } }> | undefined;
  if (hrAnswers?.length) {
    let best = { score: 0, script: "" };
    for (const a of hrAnswers) {
      const score = wordOverlap(text, (a.question_text ?? "").toLowerCase());
      if (score > best.score) {
        const raw = a.answer_script;
        const script = typeof raw === "string" ? raw : (raw as { script?: string })?.script ?? "";
        best = { score, script };
      }
    }
    if (best.score > 0.15) return best.script;
  }
  return "";
}


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
  // 8-section feedback fields
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPracticeAnswered, setPracticeTotal, userId } = useMockInterview();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const initialRound = Math.min(2, Math.max(1, Number(searchParams.get("round")) || 1));
  const questionsRemaining = Number(searchParams.get("resume")) || 0;
  const [roundNumber] = useState(initialRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerState>>({});
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  type Question = { question_id: string; question_text: string; order: number; difficulty: string; why_asked: string; expected_duration_s: number; note_script: string; keywords: string[] };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initialize session on mount (re-runs when round changes) ──
  useEffect(() => {
    setSessionLoading(true);
    setCurrentIndex(0);
    setAnsweredMap({});
    setCurrentAnswer(null);
    startPractice({ round_number: roundNumber })
      .then((data) => {
        setSessionId(data.session_id);
        const mappedQuestions = data.questions.map((q) => ({
          question_id: q.id,
          question_text: q.text,
          order: data.questions.indexOf(q) + 1,
          difficulty: "intermediate",
          why_asked: "Practice question",
          expected_duration_s: q.time_limit_s || 120,
          note_script: "",
          keywords: q.key_points || [],
        }));
        setQuestions(mappedQuestions);
        setPracticeTotal(mappedQuestions.length);

        // Load user's notes to populate answer scripts in the Notes panel
        if (userId) {
          getNotes(userId)
            .then((record) => {
              const rawNotes = record?.notes as Record<string, unknown> | undefined;
              if (!rawNotes || Object.keys(rawNotes).length === 0) return;
              const map: Record<string, string> = {};
              mappedQuestions.forEach((q) => {
                map[q.question_id] = matchNoteScript(q.question_text, rawNotes);
              });
              setNotesMap(map);
            })
            .catch(() => {});
        }

        // Resume: jump to the first unanswered question based on remaining count
        if (questionsRemaining > 0) {
          const resumeIndex = Math.max(0, mappedQuestions.length - questionsRemaining);
          setCurrentIndex(resumeIndex);
        }
      })
      .catch((err: unknown) => {
        const code = (err as { response?: { data?: { error?: { error_code?: string } } } })
          ?.response?.data?.error?.error_code;
        if (code === "RATE_LIMIT_EXCEEDED") {
          setSessionError("You've reached the practice session limit. Please try again in a little while.");
        } else {
          setSessionError("Could not load questions. Please check your connection and try again.");
        }
      })
      .finally(() => setSessionLoading(false));
  }, [roundNumber, setPracticeTotal, questionsRemaining]);

  // Timer runs while recorder is visible (tracks answer length for P8 warning)
  useEffect(() => {
    if (!currentAnswer && !isSubmitting) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAnswer, isSubmitting]);
  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answeredMap).length;

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationMs?: number) => {
    if (!sessionId) {
      setIsSubmitting(false);
      return;
    }

    // Reject recordings that are too short — Whisper hallucinates text on silent audio
    const MIN_DURATION_MS = 2000; // 2 seconds minimum
    if (durationMs !== undefined && durationMs < MIN_DURATION_MS) {
      setSubmitError("No speech detected. Please speak clearly for at least 2 seconds when recording.");
      return;
    }

    setIsSubmitting(true);
    setCurrentAnswer(null);

    try {
      // Build form data for multipart submission
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");
      formData.append("session_id", sessionId);
      formData.append("question_id", question.question_id);

      const apiResponse = await submitPracticeAnswer(formData) as unknown as SubmitAnswerResponse;

      const q = questions[currentIndex];
      const answer: AnswerState = {
        transcript: apiResponse.transcript,
        duration: durationMs !== undefined ? Math.round(durationMs / 1000) : 0,
        fillerCount: apiResponse.rule_scores.filler_count,
        keyPointsHit: apiResponse.rule_scores.key_points_hit,
        weightedScore: apiResponse.scores.weighted_score,
        feedback: apiResponse.feedback.improvements.join(" "),
        improvedAnswer: apiResponse.feedback.improved_answer,
        whatWasGood: apiResponse.feedback.good_points,
        whatToImprove: apiResponse.feedback.improvements,
        encouragement: apiResponse.feedback.encouragement,
        dimensions: [
          { label: "Content", score: apiResponse.scores.content_score, weight: "40%" },
          { label: "Clarity", score: apiResponse.scores.clarity_score, weight: "30%" },
          { label: "Structure", score: apiResponse.scores.structure_score, weight: "20%" },
          { label: "Length", score: apiResponse.scores.length_score, weight: "10%" },
        ],
        targetDurationMin: Math.round(q.expected_duration_s * 0.7),
        targetDurationMax: q.expected_duration_s,
        attemptNumber: roundNumber,
      };

      setCurrentAnswer(answer);
      setAnsweredMap((m) => ({ ...m, [question.question_id]: answer }));
      // Sync server-side progress (fire-and-forget)
      getPracticeProgress(sessionId).catch(() => {});
    } catch {
      setSubmitError("Could not score your answer. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, question?.question_id, roundNumber, questions, currentIndex]);

  const handleNext = () => {
    setCurrentAnswer(null);
    const newCount = Object.keys(answeredMap).length;
    setPracticeAnswered(newCount);
    if (isLastQuestion) {
      if (roundNumber < 2) {
        router.push(`/mock-interview/practice?round=${roundNumber + 1}`);
      } else {
        router.push("/mock-interview/readiness");
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleTryAgain = () => {
    setCurrentAnswer(null);
  };

  const warningThreshold = (question?.expected_duration_s ?? 120) * 1.5;
  const showLongAnswerWarning = elapsedSeconds > warningThreshold && !currentAnswer && !isSubmitting;

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Could Not Load Questions</h2>
          <p className="text-sm text-gray-500 mb-4">{sessionError}</p>
          <button
            onClick={() => { setSessionError(null); setSessionLoading(true); startPractice({ round_number: roundNumber }).then((data) => { setSessionId(data.session_id); setQuestions(data.questions.map((q, i) => ({ question_id: q.id, question_text: q.text, order: i + 1, difficulty: "intermediate", why_asked: "Practice question", expected_duration_s: q.time_limit_s || 120, note_script: "", keywords: q.key_points || [] }))); }).catch(() => setSessionError("Could not load questions. Please check your connection and try again.")).finally(() => setSessionLoading(false)); }}
            className="px-5 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading questions…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button — P10 */}
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Mock Interview
        </button>

        {/* Submit error banner */}
        {submitError && (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{submitError}</p>
            </div>
            <button onClick={() => setSubmitError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Dismiss</button>
          </div>
        )}

        {/* Long-answer warning banner — P8, A4 */}
        {showLongAnswerWarning && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-xl px-4 py-3">
            <Clock size={14} className="text-[#2557a7] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700 font-medium">
              Your answer is getting long. Try to wrap up — aim for {question.expected_duration_s}s.
            </p>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full">
                Round {roundNumber} of 2
              </span>
              {roundNumber === 1 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Notes visible</span>
              )}
              {roundNumber === 2 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Hints only</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">Practice Mode</h1>
          </div>

          {/* Question progress */}
          <div className="flex items-center gap-2">
            {questions.map((q, i) => (
              <button
                key={q.question_id}
                onClick={() => { setCurrentIndex(i); setCurrentAnswer(null); }}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i === currentIndex
                    ? "bg-[#2557a7] text-white shadow-md scale-110"
                    : answeredMap[q.question_id]
                    ? "bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/30"
                    : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                {answeredMap[q.question_id] ? <CheckCircle2 size={14} className="mx-auto" /> : i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              role="progressbar"
              aria-valuenow={currentIndex}
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-label="Question progress"
              className="h-full bg-[#2557a7] rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* LEFT: Question + Recorder */}
          <div className="space-y-4">
            {/* Question card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Top accent bar */}
              <div className="h-[3px] bg-linear-to-r from-[#2557a7] to-[#5b8fd6]" />
              <div className="px-5 pt-3.5 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question {currentIndex + 1}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      question.difficulty === "basic"
                        ? "bg-[#2557a7]/8 text-[#2557a7]"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <Clock size={12} />
                    {question.expected_duration_s}s target
                  </div>
                </div>
              </div>
              <div className="px-5 py-5">
                <p className="text-lg font-bold text-gray-900 leading-snug mb-2">
                  {question.question_text}
                </p>
                <p className="text-xs text-gray-500 flex items-start gap-1.5">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-[#2557a7]" />
                  {question.why_asked}
                </p>
              </div>
            </div>

            {/* Notes panel — Round 1: full notes, Round 2: keywords only, Round 3+: hidden — P3 */}
            {roundNumber <= 2 && (
              <div className={`rounded-xl border overflow-hidden transition-all ${
                showNotes
                  ? roundNumber === 1
                    ? "border-[#2557a7]/20 bg-[#2557a7]/5"
                    : "border-gray-200 bg-gray-50"
                  : "border-gray-200 bg-gray-50"
              }`}>
                <button
                  onClick={() => setShowNotes((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className={`flex items-center gap-2 text-sm font-semibold ${roundNumber === 1 ? "text-[#2557a7]" : "text-gray-700"}`}>
                    {roundNumber === 1 ? <BookOpen size={14} /> : <Key size={14} />}
                    {roundNumber === 1 ? "Your Notes" : "KEYWORDS only"}
                  </div>
                  {showNotes
                    ? <EyeOff size={14} className={roundNumber === 1 ? "text-[#2557a7]" : "text-gray-500"} />
                    : <Eye size={14} className={roundNumber === 1 ? "text-[#2557a7]" : "text-gray-500"} />}
                </button>
                {showNotes && (
                  <div className={`px-4 pb-4 border-t pt-3 ${roundNumber === 1 ? "border-[#2557a7]/15" : "border-gray-200"}`}>
                    {roundNumber === 1 ? (
                      (question.note_script || notesMap[question.question_id]) ? (
                        <p className="text-sm text-[#2557a7] leading-relaxed whitespace-pre-wrap">
                          {question.note_script || notesMap[question.question_id]}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No answer script found for this question. Go to the Notes page to generate your prepared scripts.
                        </p>
                      )
                    ) : (
                      /* Round 2 keyword flow */
                      <div className="flex flex-wrap items-center gap-2">
                        {question.keywords.map((kw, i) => (
                          <span key={kw} className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/20 rounded-lg px-2.5 py-1">
                              {kw}
                            </span>
                            {i < question.keywords.length - 1 && (
                              <ChevronRight size={12} className="text-gray-400 shrink-0" />
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recorder section */}
            {!currentAnswer && !isSubmitting && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mic size={16} className="text-[#2557a7]" />
                  <p className="text-sm font-semibold text-gray-700">Record Your Answer</p>
                </div>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDuration={120}
                />
              </div>
            )}

            {/* Submitting loader */}
            {isSubmitting && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-10 flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-[#2557a7] animate-spin" />
                <p className="text-sm font-semibold text-gray-600">Analysing your answer…</p>
                <p className="text-xs text-gray-400">Transcribing → Checking → Scoring</p>
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

            {/* Navigation */}
            {currentAnswer && (
              <div className="flex gap-3">
                {currentIndex > 0 && (
                  <button
                    onClick={() => { setCurrentIndex((i) => i - 1); setCurrentAnswer(answeredMap[questions[currentIndex - 1].question_id] ?? null); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm"
                  >
                    <ChevronLeft size={15} /> Back
                  </button>
                )}
                <button
                  onClick={handleTryAgain}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all"
                >
                  <RotateCcw size={14} className="text-gray-500" /> Record Again
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] transition-all shadow-md"
                >
                  {isLastQuestion ? "Check Readiness" : "Next Question"}
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Feedback */}
          <div>
            {currentAnswer ? (
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
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-center text-center gap-3 min-h-70">
                <div className="w-14 h-14 bg-[#2557a7]/5 rounded-xl flex items-center justify-center">
                  <Mic size={24} className="text-[#2557a7]" />
                </div>
                <p className="text-sm font-semibold text-gray-700">AI Feedback</p>
                <p className="text-xs text-gray-400">
                  Record your answer to receive instant AI feedback, score breakdown, and a model answer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/mock-interview/english")}
            className="text-xs text-[#2557a7] hover:text-[#1e4a8f] underline-offset-2 hover:underline"
          >
            Need help? Review English phrases →
          </button>
        </div>
      </div>
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <PracticeContent />
    </Suspense>
  );
}
