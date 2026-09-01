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
import FeedbackCard from "@/app/(interview)/mock-interview/_components/FeedbackCard";
import TranscriptDisplay from "@/app/(interview)/mock-interview/_components/TranscriptDisplay";
import { submitPracticeAnswer, getNotes, SubmitAnswerResponse, HrQuestion, GenerateHrQuestionsResponse } from "@/api/mockInterviewApi";

const HR_QUESTIONS_KEY = "hr_generated_questions";
import { useMockInterview } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";

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
  question_id: string;
  question_text: string;
  order: number;
  difficulty: string;
  why_asked: string;
  expected_duration_s: number;
  note_script: string;
  keywords: string[];
};

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Session persistence ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

const STORAGE_KEY = "hr_practice_session_v1";
const SESSION_TTL_MS = 14400 * 1000; // 4h ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â matches PRACTICE_SESSION_TTL on backend

type SavedSession = {
  roundNumber: number;
  sessionId?: string;
  questions: Question[];
  currentIndex: number;
  answeredMap: Record<string, AnswerState>;
  notesMap: Record<string, string>;
  savedAt?: number;
  userId?: string;
};

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
}

function loadSavedSession(roundNumber: number, userId?: string | null): SavedSession | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed: SavedSession = JSON.parse(raw);
    if (parsed.roundNumber !== roundNumber) return null;
    if (Date.now() - (parsed.savedAt ?? 0) > SESSION_TTL_MS) {
      localStorage.removeItem(storageKey(userId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(data: SavedSession) {
  try { localStorage.setItem(storageKey(data.userId), JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
}

function clearSession(userId?: string | null) {
  try { localStorage.removeItem(storageKey(userId)); } catch {}
}

// ─── Content ──────────────────────────────────────────────────────────────────

function HRPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPracticeAnswered, setPracticeTotal, userId } = useMockInterview();

  const roundNumber = 1;
  const questionsRemaining = Number(searchParams.get("resume")) || 0;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerState>>({});
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const errorDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSaveRef = useRef(false);

  const showSubmitError = useCallback((msg: string) => {
    if (errorDismissRef.current) clearTimeout(errorDismissRef.current);
    setSubmitError(msg);
    errorDismissRef.current = setTimeout(() => setSubmitError(null), 5000);
  }, []);

  // Persist progress to localStorage
  useEffect(() => {
    if (questions.length === 0 || skipSaveRef.current) return;
    saveSession({ roundNumber, sessionId: sessionId ?? undefined, questions, currentIndex, answeredMap, notesMap, userId: userId ?? undefined });
  }, [sessionId, questions, currentIndex, answeredMap, notesMap, roundNumber, userId]);

  // Load session on mount / round change
  useEffect(() => {
    setCurrentAnswer(null);
    skipSaveRef.current = false;

    // Fresh data from the HR info page always takes priority — it carries the
    // session_id that must match the question_ids sent to the answer endpoint.
    let stored: GenerateHrQuestionsResponse | null = null;
    try {
      const raw = sessionStorage.getItem(HR_QUESTIONS_KEY);
      if (raw) {
        stored = JSON.parse(raw) as GenerateHrQuestionsResponse;
        sessionStorage.removeItem(HR_QUESTIONS_KEY);
      }
    } catch {}

    if (stored && stored.questions.length > 0) {
      setSessionId(stored.session_id);

      const mappedQuestions: Question[] = stored.questions.map((q: HrQuestion, i: number) => ({
        question_id: q.id,
        question_text: q.text,
        order: i + 1,
        difficulty: "intermediate",
        why_asked: q.category || "HR interview question",
        expected_duration_s: q.time_limit_s,
        note_script: "",
        keywords: q.key_points.length > 0 ? q.key_points : ["motivation", "fit", "example"],
      }));

      setQuestions(mappedQuestions);
      setPracticeTotal(mappedQuestions.length);
      setCurrentIndex(0);
      setAnsweredMap({});

      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        getNotes(resumeId)
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

      if (questionsRemaining > 0) {
        setCurrentIndex(Math.max(0, mappedQuestions.length - questionsRemaining));
      }
      setSessionLoading(false);
      return;
    }

    // No fresh sessionStorage data — try to resume a saved localStorage session.
    const saved = loadSavedSession(roundNumber, userId);
    if (saved && saved.questions.length > 0) {
      if (saved.sessionId) setSessionId(saved.sessionId);
      setQuestions(saved.questions);
      setPracticeTotal(saved.questions.length);
      setCurrentIndex(saved.currentIndex);
      setAnsweredMap(saved.answeredMap);
      setNotesMap(saved.notesMap || {});
      const restoredQ = saved.questions[saved.currentIndex];
      if (restoredQ && saved.answeredMap[restoredQ.question_id]) {
        setCurrentAnswer(saved.answeredMap[restoredQ.question_id]);
      }
      setSessionLoading(false);
      return;
    }

    setSessionError("No questions found. Please go back and start HR practice again.");
    setSessionLoading(false);
  }, [roundNumber, setPracticeTotal, questionsRemaining, userId]);

  // Elapsed timer

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answeredMap).length;

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationMs?: number) => {
    if (durationMs !== undefined && durationMs < 2000) {
      showSubmitError("No speech detected. Please speak clearly for at least 2 seconds when recording.");
      return;
    }

    setIsSubmitting(true);
    setCurrentAnswer(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");
      if (sessionId) formData.append("session_id", sessionId);
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
          { label: "Content",   score: apiResponse.scores.content_score,   weight: "40%" },
          { label: "Clarity",   score: apiResponse.scores.clarity_score,   weight: "30%" },
          { label: "Structure", score: apiResponse.scores.structure_score, weight: "20%" },
          { label: "Length",    score: apiResponse.scores.length_score,    weight: "10%" },
        ],
        targetDurationMin: Math.round(q.expected_duration_s * 0.7),
        targetDurationMax: q.expected_duration_s,
        attemptNumber: roundNumber,
      };

      setCurrentAnswer(answer);
      setAnsweredMap((m) => ({ ...m, [question.question_id]: answer }));
    } catch {
      const q = questions[currentIndex];
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
        targetDurationMin: q ? Math.round(q.expected_duration_s * 0.7) : undefined,
        targetDurationMax: q ? q.expected_duration_s : undefined,
        attemptNumber: roundNumber,
      };
      setCurrentAnswer(fallback);
      setAnsweredMap((m) => ({ ...m, [question.question_id]: fallback }));
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, question?.question_id, roundNumber, questions, currentIndex]);

  const handleNext = () => {
    setCurrentAnswer(null);
    setPracticeAnswered(Object.keys(answeredMap).length);
    if (isLastQuestion) {
      skipSaveRef.current = true;
      clearSession(userId);
      router.push("/mock-interview/live");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleTryAgain = () => setCurrentAnswer(null);

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Loading ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
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
            onClick={() => router.push("/notes/hr")}
            className="px-5 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
          >
            Go Back
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
          <p className="text-sm text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Main UI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4">

      <button
        onClick={() => router.push("/notes/hr")}
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
          <h1 className="text-lg font-black text-gray-950">HR Practice</h1>
          <p className="mt-0.5 text-[11px] font-medium text-gray-500">Practice warm, specific answers for fit and recruiter screens.</p>
        </div>

        <div className="flex max-w-full items-center gap-2 overflow-x-auto py-1">
          {questions.map((q, i) => (
            <button
              key={q.question_id}
              aria-label={`Go to question ${i + 1}${answeredMap[q.question_id] ? ", answered" : ""}`}
              onClick={() => { setCurrentIndex(i); setCurrentAnswer(answeredMap[q.question_id] ?? null); }}
              className={`h-8 w-8 shrink-0 rounded-full text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2 ${
                i === currentIndex
                  ? "bg-[#2557a7] text-white shadow-md scale-105"
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
            <div className="px-4 py-4">
              <p className="text-base font-black text-gray-950 leading-snug mb-2">
                {question.question_text}
              </p>
              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <AlertCircle size={12} className="shrink-0 mt-0.5 text-[#2557a7]" />
                {question.why_asked}
              </p>
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
              <div className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                showNotes
                  ? roundNumber === 1
                    ? "border-[#2557a7]/20 bg-[#2557a7]/5"
                    : "border-gray-200 bg-gray-50"
                  : "border-gray-200 bg-gray-50"
              }`}>
                <button
                  type="button"
                  aria-expanded={showNotes}
                  onClick={() => setShowNotes((s) => !s)}
                  className="w-full flex items-center justify-between px-3 py-2.5"
                >
                  <div className={`flex items-center gap-2 text-sm font-semibold ${roundNumber === 1 ? "text-[#2557a7]" : "text-gray-700"}`}>
                    {roundNumber === 1 ? <BookOpen size={14} /> : <Key size={14} />}
                    {roundNumber === 1 ? "Your Notes" : "Keywords only"}
                  </div>
                  {showNotes
                    ? <EyeOff size={14} className={roundNumber === 1 ? "text-[#2557a7]" : "text-gray-500"} />
                    : <Eye size={14} className={roundNumber === 1 ? "text-[#2557a7]" : "text-gray-500"} />}
                </button>
                {showNotes && (
                  <div className={`max-h-52 overflow-auto px-3 pb-3 border-t pt-2.5 ${roundNumber === 1 ? "border-[#2557a7]/15" : "border-gray-200"}`}>
                    {roundNumber === 1 ? (
                      (question.note_script || notesMap[question.question_id]) ? (
                        <p className="text-xs text-[#2557a7] leading-5 whitespace-pre-wrap">
                          {question.note_script || notesMap[question.question_id]}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No answer script found for this question. Go to the Notes page to generate your prepared scripts.
                        </p>
                      )
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {(question.keywords.length ? question.keywords : ["motivation", "fit", "example"]).map((kw) => (
                          <span key={kw} className="text-xs font-semibold bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/20 rounded-lg px-2.5 py-1">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="w-14 h-14 bg-[#2557a7]/5 rounded-lg flex items-center justify-center">
                  <Mic size={24} className="text-[#2557a7]" />
                </div>
                <p className="text-sm font-black text-gray-800">AI Feedback</p>
                <p className="max-w-56 text-[11px] font-medium leading-5 text-gray-500">
                  Record your answer to unlock tone, clarity, structure, and confidence feedback.
                </p>
              </div>
            </>
          )}
        </aside>

      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push("/notes/english")}
          className="text-xs text-[#2557a7] hover:text-[#1e4a8f] underline-offset-2 hover:underline"
        >
          Need help? Review English phrases
        </button>
      </div>

    </main>
  );
}

export default function HRPracticePage() {
  return (
    <Suspense>
      <HRPracticeContent />
    </Suspense>
  );
}
