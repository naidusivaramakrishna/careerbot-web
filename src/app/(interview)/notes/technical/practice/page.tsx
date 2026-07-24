"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Code2,
  Mic,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import AudioRecorder from "@/app/(interview)/communication/components/AudioRecorder";
import FeedbackCard from "@/app/(interview)/mock-interview/_components/FeedbackCard";
import TranscriptDisplay from "@/app/(interview)/mock-interview/_components/TranscriptDisplay";
import {
  startPractice,
  submitPracticeAnswer,
  generateTechnicalQuestions,
  SubmitAnswerResponse,
} from "@/api/mockInterviewApi";
import { useMockInterview } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";


type AnswerState = {
  transcript: string;
  weightedScore: number;
  feedback: string;
  dimensions: { label: string; score: number; weight: string }[];
  answerId?: string;
} | null;

function TechnicalPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPracticeAnswered } = useMockInterview();

  const category = searchParams.get("category") ?? "dsa";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<{ id: string; text: string; hint: string }[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerState>>({});
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const categoryMap: Record<string, string> = {
    dsa: "technical", web: "technical", backend: "technical",
    database: "technical", core: "technical",
  };
  const backendCategory = categoryMap[category] ?? "technical";

  useEffect(() => {
    Promise.allSettled([
      startPractice({ round_number: 1, category: backendCategory }),
      generateTechnicalQuestions({ skills: [category], num_questions: 5, experience_level: (localStorage.getItem("mock_experience_level") === "experienced" ? "mid" : "fresher") }),
    ]).then(([sessionResult, questionsResult]) => {
      if (sessionResult.status === "fulfilled") {
        setSessionId(sessionResult.value.session_id);
      }
      if (questionsResult.status === "fulfilled" && questionsResult.value.questions.length > 0) {
        setQuestions(
          questionsResult.value.questions.map((q) => ({
            id: q.question_id,
            text: q.question_text,
            hint: q.key_points.join(", "),
          }))
        );
      } else {
        setSessionError("Could not load questions for this category. Please try again.");
      }
    }).finally(() => setSessionLoading(false));
  }, [category, backendCategory]);


  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answeredMap).length;

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    if (!sessionId || !question) return;
    setIsSubmitting(true);
    setCurrentAnswer(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");
      formData.append("session_id", sessionId);
      formData.append("question_id", question.id);

      const apiResponse = await submitPracticeAnswer(formData) as unknown as SubmitAnswerResponse;
      const answer: AnswerState = {
        transcript: apiResponse.transcript,
        weightedScore: apiResponse.scores.weighted_score,
        feedback: apiResponse.feedback.improvements.join(" "),
        dimensions: [
          { label: "Content", score: apiResponse.scores.content_score, weight: "40%" },
          { label: "Clarity", score: apiResponse.scores.clarity_score, weight: "30%" },
          { label: "Structure", score: apiResponse.scores.structure_score, weight: "20%" },
          { label: "Length", score: apiResponse.scores.length_score, weight: "10%" },
        ],
      };
      setAnsweredMap((m) => ({ ...m, [question.id]: answer }));
      setCurrentAnswer(answer);
    } catch {
      /* recording failed — user can try again */
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, question]);

  const handleNext = () => {
    setCurrentAnswer(null);
    const newCount = Object.keys(answeredMap).length;
    setPracticeAnswered(newCount);
    if (isLastQuestion) {
      router.push("/mock-interview/live");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Preparing questions…</p>
        </div>
      </div>
    );
  }

  if (sessionError || questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
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
              onClick={() => { setSessionError(null); setSessionLoading(true); }}
              className="px-4 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/notes/technical")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full capitalize">
            {category.replace("dsa", "DSA")}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-[#2557a7] rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden mb-4">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2557a7]/5 border-b border-[#2557a7]/10">
          <Code2 size={13} className="text-[#2557a7]" />
          <span className="text-xs font-semibold text-[#2557a7]">Question {currentIndex + 1}</span>
        </div>
        <div className="px-5 py-5">
          <p className="text-gray-900 text-sm font-semibold leading-relaxed mb-3">
            {question.text}
          </p>
          {question.hint && (
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <AlertCircle size={12} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500"><span className="font-semibold">Hint:</span> {question.hint}</p>
            </div>
          )}
        </div>
      </div>

      {!currentAnswer && !isSubmitting && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mic size={14} className="text-[#2557a7]" />
            <p className="text-sm font-semibold text-gray-900">Record Your Answer</p>
          </div>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      )}

      {isSubmitting && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 flex flex-col items-center gap-3 shadow-sm">
          <Loader2 size={28} className="text-[#2557a7] animate-spin" />
          <p className="text-sm text-gray-500">Analysing your answer…</p>
        </div>
      )}

      {currentAnswer && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Answer</p>
              <CheckCircle2 size={14} className="text-[#2557a7]" />
            </div>
            <TranscriptDisplay transcript={currentAnswer.transcript} />
          </div>

          <FeedbackCard
            weightedScore={currentAnswer.weightedScore}
            improvedAnswer=""
            feedback={currentAnswer.feedback}
            dimensions={currentAnswer.dimensions}
            answerId={currentAnswer.answerId}
          />

          <div className="flex gap-3">
            {currentIndex > 0 && (
              <button
                onClick={() => { setCurrentAnswer(null); setCurrentIndex((i) => i - 1); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] transition-all shadow-md"
            >
              {isLastQuestion ? (
                <>Start Live Interview <ChevronRight size={14} /></>
              ) : (
                <>Next Question <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {answeredCount > 0 && !currentAnswer && (
        <p className="text-center text-xs text-gray-400 mt-4">
          {answeredCount} of {questions.length} answered
        </p>
      )}
    </div>
  );
}

export default function TechnicalPracticePage() {
  return (
    <Suspense>
      <TechnicalPracticeContent />
    </Suspense>
  );
}
