"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  buildWsUrl,
  getLiveSessionState,
  WsServerMessage,
  WsClientMessage,
  LiveCreateResponse,
} from "@/api/mockInterviewApi";
import {
  Mic,
  Video,
  VideoOff,
  Clock,
  PhoneOff,
  Wifi,
  WifiOff,
  Loader2,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Maximize2,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewPhase =
  | "connecting"    // WebSocket connecting
  | "ai-talking"    // AI is playing audio question
  | "follow-up"     // AI is asking a follow-up
  | "listening"     // Microphone recording
  | "processing"    // AI processing answer
  | "completed";    // All questions done

interface Question {
  number: number;
  text: string;
  isFollowUp?: boolean;
}

interface ScoreToast {
  questionNumber: number;
  score: number;
}

const INTERVIEWERS = [
  {
    name: "Arjun",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-male-01.png",
  },
  {
    name: "Rahul",
    role: "Technical Interview Panelist",
    src: "/images/ai-interviewer-room-male-02.png",
  },
  {
    name: "Meera",
    role: "Senior HR Interviewer",
    src: "/images/ai-interviewer-room-female-01.png",
  },
  {
    name: "Nisha",
    role: "Product Engineering Interviewer",
    src: "/images/ai-interviewer-room-female-02.png",
  },
] as const;

function pickInterviewerIndex(sessionId: string) {
  if (!sessionId) return 0;

  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash + sessionId.charCodeAt(i) * (i + 1)) % INTERVIEWERS.length;
  }

  return hash;
}

// ─── Animated waveform for AI talking ────────────────────────────────────────

const AI_WAVE_BARS = [18, 30, 24, 38, 22, 34, 28, 20, 36, 26, 32, 22];

function AIWaveform({ barClassName = "bg-[#2557a7]" }: { barClassName?: string } = {}) {
  return (
    <div className="flex h-12 items-center justify-center gap-1" aria-hidden="true">
      {AI_WAVE_BARS.map((height, i) => (
        <div
          key={i}
          className={`waveBar-bar w-1.5 ${barClassName} rounded-full`}
          style={{
            height: `${height}px`,
            animationName: "waveBar",
            animationDuration: `${0.55 + (i % 4) * 0.12}s`,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            animationDelay: `${i * 0.08}s`,
            animationDirection: "alternate",
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); opacity: 0.5; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .waveBar-bar { animation: none !important; opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function getInterviewerStatus(phase: InterviewPhase) {
  if (phase === "connecting") return "Joining the room";
  if (phase === "ai-talking") return "Asking the next question";
  if (phase === "follow-up") return "Asking a follow-up";
  if (phase === "listening") return "Listening to your answer";
  if (phase === "processing") return "Reviewing your response";
  return "Session complete";
}

function InterviewTimeline({ phase }: { phase: InterviewPhase }) {
  const steps = [
    { key: "ai-talking", label: "Question" },
    { key: "listening", label: "Answer" },
    { key: "processing", label: "Review" },
  ] as const;
  const activeIndex = phase === "follow-up" ? 0 : steps.findIndex((step) => step.key === phase);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Interview question flow">
      {steps.map((step, index) => {
        const isActive = activeIndex === index;
        const isDone = activeIndex > index;
        return (
          <div key={step.key} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              isActive || isDone ? "bg-[#2557a7] text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {isDone ? <CheckCircle2 size={11} aria-hidden="true" /> : index + 1}
            </span>
            <span className={`truncate text-[11px] font-semibold ${isActive ? "text-[#2557a7]" : "text-gray-500"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MicLevelMeter({ level }: { level: number }) {
  const bars = [12, 24, 36, 48, 60, 72, 84, 96];
  return (
    <div className="flex items-end gap-1" aria-hidden="true">
      {bars.map((threshold, index) => (
        <span
          key={threshold}
          className={`w-1.5 rounded-full transition-colors ${level >= threshold ? "bg-[#2557a7]" : "bg-gray-200"}`}
          style={{ height: `${8 + index * 2}px` }}
        />
      ))}
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function QuestionTimer({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const pct = (secondsLeft / total) * 100;
  const ring = secondsLeft < 20 ? "#9ca3af" : "#2557a7";
  const color = secondsLeft < 20 ? "text-gray-400" : "text-[#2557a7]";
  const r = 19;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center" role="timer" aria-label={`Time remaining: ${secondsLeft} seconds`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={ring} strokeWidth="4"
          strokeDasharray={`${circ}`}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span className={`text-xs font-bold ${color} z-10`}>
        {secondsLeft < 60 ? `${secondsLeft}s` : `${Math.floor(secondsLeft / 60)}m`}
      </span>
    </div>
  );
}

// ─── End Early modal ──────────────────────────────────────────────────────────

function EndEarlyModal({
  questionNumber,
  totalQuestions,
  onConfirm,
  onCancel,
}: {
  questionNumber: number;
  totalQuestions: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-modal-title"
    >
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-sm mx-4 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between mb-4">
          <h2 id="end-modal-title" className="text-base font-bold text-gray-900">End Interview Early?</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          You have answered <span className="text-gray-900 font-semibold">{questionNumber - 1} of {totalQuestions}</span> questions.
        </p>
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-6">
          Ending early will generate a partial report. Your scores for completed questions will still be saved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-colors"
          >
            Continue Interview
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            End &amp; Get Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reconnection modal ───────────────────────────────────────────────────────

function ReconnectModal({
  attempt,
  maxAttempts,
  onRetry,
  onAbandon,
}: {
  attempt: number;
  maxAttempts: number;
  onRetry: () => void;
  onAbandon: () => void;
}) {
  const failed = attempt > maxAttempts;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconnect-modal-title"
    >
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-sm mx-4 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)] text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100">
          {failed ? (
            <WifiOff size={24} className="text-gray-400" />
          ) : (
            <Loader2 size={24} className="text-[#2557a7] animate-spin" />
          )}
        </div>
        <h2 id="reconnect-modal-title" className="text-base font-bold text-gray-900 mb-2">
          {failed ? "Connection Failed" : "Connection Lost"}
        </h2>
        <p className="text-sm text-gray-600 mb-1">
          {failed
            ? "Unable to reconnect after 3 attempts."
            : `Reconnecting… attempt ${attempt} of ${maxAttempts}`}
        </p>
        {!failed && (
          <p className="text-xs text-gray-500 mb-6">Your progress is saved. Please wait.</p>
        )}
        {failed && (
          <p className="text-xs text-gray-500 mb-6">Your answers so far have been saved. You can view a partial report.</p>
        )}
        <div className="flex gap-3">
          {!failed && (
            <button
              onClick={onRetry}
              className="flex-1 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} /> Try Again
            </button>
          )}
          <button
            onClick={onAbandon}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              failed
                ? "flex-1 bg-[#2557a7] text-white hover:bg-[#1e4a8f]"
                : "px-4 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {failed ? "View Partial Report" : "Abandon Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completed screen ─────────────────────────────────────────────────────────

function CompletedScreen({ sessionId, reportId }: { sessionId: string; reportId?: string | null }) {
  const router = useRouter();
  const steps = ["Answers saved", "Transcript reviewed", reportId ? "Report ready" : "Report being prepared"];
  const reportTargetId = reportId || sessionId;
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-[#2557a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={40} className="text-[#2557a7]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h2>
      <p className="text-gray-500 text-sm mb-5">
        Great effort. Your completed answers are saved and the report is being prepared.
      </p>
      <div className="mb-6 space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${index < 2 ? "bg-[#2557a7]/10 text-[#2557a7]" : "bg-gray-100 text-gray-500"}`}>{index < 2 ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}</span>
            {step}
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push(`/mock-interview/report/${reportTargetId}`)}
        className="flex items-center gap-2 px-6 py-3 bg-[#2557a7] text-white rounded-xl font-bold mx-auto hover:bg-[#1e4a8f] transition-all shadow-md"
      >
        View My Report <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── TTS audio playback helper ───────────────────────────────────────────────

// Decode URL-safe or standard base64 into a Uint8Array.
function decodeBase64(b64: string): Uint8Array {
  const normalized = b64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(b64.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Try MPEG first, then WAV, then OGG — we don't always know what the backend sends.
const TTS_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg; codecs=opus", "audio/webm"];

function playTtsAudio(
  base64Audio: string | null,
  mutedRef: React.RefObject<boolean>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  visualizerCleanupRef: React.MutableRefObject<(() => void) | null>,
  onMouthLevel: (level: number) => void,
  onEnd: () => void,
) {
  if (visualizerCleanupRef.current) {
    visualizerCleanupRef.current();
    visualizerCleanupRef.current = null;
  }

  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  onMouthLevel(0);

  if (!base64Audio || mutedRef.current) {
    setTimeout(onEnd, 1500);
    return;
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(base64Audio);
  } catch {
    setTimeout(onEnd, 1500);
    return;
  }

  let mimeIndex = 0;

  const tryNext = () => {
    if (mimeIndex >= TTS_MIME_TYPES.length) {
      setTimeout(onEnd, 2000);
      return;
    }

    const mime = TTS_MIME_TYPES[mimeIndex++];
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    let audioContext: AudioContext | null = null;
    let rafId: number | null = null;
    const stopVisualizer = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = null;
      onMouthLevel(0);
      if (audioContext?.state !== "closed") {
        audioContext?.close().catch(() => {});
      }
    };

    try {
      const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        audioContext = new AudioContextCtor();
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.68;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        const samples = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(samples);
          const speechEnergy = samples.slice(2, 32).reduce((sum, value) => sum + value, 0) / 30;
          onMouthLevel(Math.min(1, speechEnergy / 105));
          rafId = window.requestAnimationFrame(tick);
        };

        visualizerCleanupRef.current = stopVisualizer;
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        tick();
      }
    } catch {
      visualizerCleanupRef.current = null;
    }

    const cleanupAudio = () => {
      stopVisualizer();
      visualizerCleanupRef.current = null;
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };

    audio.onended = () => {
      cleanupAudio();
      onEnd();
    };
    audio.onerror = () => {
      cleanupAudio();
      tryNext();
    };
    audio.play().catch(() => {
      cleanupAudio();
      setTimeout(onEnd, 3000);
    });
  };

  tryNext();
}
export default function LiveInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const interviewer = useMemo(() => INTERVIEWERS[pickInterviewerIndex(sessionId)], [sessionId]);

  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [sessionType, setSessionType] = useState("Live");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [visibleQuestionText, setVisibleQuestionText] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timeLimitTotal, setTimeLimitTotal] = useState(120);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false); // ref so WS handler sees latest value without stale closure
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null); // current TTS audio element
  const ttsVisualizerCleanupRef = useRef<(() => void) | null>(null);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [micRetryKey, setMicRetryKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);
  const [interviewerMouthLevel, setInterviewerMouthLevel] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep ref in sync with state so toggles mid-playback take effect
  useEffect(() => { isAudioMutedRef.current = isAudioMuted; }, [isAudioMuted]);

  useEffect(() => {
    const storedType = sessionStorage.getItem("live_session_type");
    if (storedType) setSessionType(storedType);
  }, []);

  useEffect(() => {
    return () => {
      if (ttsVisualizerCleanupRef.current) {
        ttsVisualizerCleanupRef.current();
        ttsVisualizerCleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "ai-talking" && phase !== "follow-up") {
      setInterviewerMouthLevel(0);
    }
  }, [phase]);

  useEffect(() => {
    const questionText = currentQuestion?.text ?? "";
    const shouldRevealQuestion = phase === "ai-talking" || phase === "follow-up";

    if (!questionText) {
      setVisibleQuestionText("");
      return;
    }

    if (!shouldRevealQuestion) {
      setVisibleQuestionText(questionText);
      return;
    }

    const words = questionText.match(/\S+\s*/g) ?? [questionText];
    let wordIndex = 0;
    setVisibleQuestionText("");

    const revealTimer = window.setInterval(() => {
      wordIndex += 1;
      setVisibleQuestionText(words.slice(0, wordIndex).join(""));

      if (wordIndex >= words.length) {
        window.clearInterval(revealTimer);
      }
    }, 115);

    return () => window.clearInterval(revealTimer);
  }, [currentQuestion?.text, phase]);

  // ─── Camera self-view + fullscreen ─────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Turn the webcam on automatically when the live interview opens
  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = stream;
        setCameraStream(stream);
        setCameraError(false);
      })
      .catch(() => {
        if (!cancelled) setCameraError(true);
      });
    return () => {
      cancelled = true;
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Attach the stream to the <video> element once both are available
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const phaseRef = useRef<InterviewPhase>("connecting");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Track fullscreen and guide recovery if the user exits mid-interview
  useEffect(() => {
    const sync = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen && phaseRef.current !== "completed") {
        if (fullscreenWarningTimerRef.current) clearTimeout(fullscreenWarningTimerRef.current);
        setShowFullscreenWarning(true);
        fullscreenWarningTimerRef.current = setTimeout(() => setShowFullscreenWarning(false), 3000);
      }
    };
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Release camera + exit fullscreen when the interview finishes
  useEffect(() => {
    if (phase !== "completed") return;
    cameraStream?.getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [phase, cameraStream]);

  // Leave fullscreen if the user navigates away mid-interview
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const fullscreenWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showEndModal, setShowEndModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const MAX_RECONNECT = 3;

  const [scoreToast, setScoreToast] = useState<ScoreToast | null>(null);
  const scoreToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showInactivityBanner, setShowInactivityBanner] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const autoSubmitRef = useRef<(() => void) | null>(null);

  const startTimer = useCallback((duration: number) => {
    stopTimer();
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          autoSubmitRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ─── Microphone → raw PCM16 @ 16 kHz → WebSocket audio_chunk ────────────
  // MediaRecorder produces WebM/Opus which the backend faster-whisper STT rejects.
  // ScriptProcessorNode gives raw Int16 PCM that the backend framing layer expects.
  const audioContextRef = useRef<AudioContext | null>(null);
  const micLevelFrameRef = useRef<number | null>(null);
  const audioSeqRef = useRef(0);

  useEffect(() => {
    if (phase !== "listening") {
      setMicLevel(0);
      return;
    }

    let localStream: MediaStream | null = null;
    let processor: ScriptProcessorNode | null = null;
    setMicError(null);
    audioSeqRef.current = 0;

    navigator.mediaDevices
      .getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false })
      .then((stream) => {
        localStream = stream;

        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;

        // Request 16 kHz — browser resamples internally from hardware rate
        const ctx = new AudioContextCtor({ sampleRate: 16000 });
        audioContextRef.current = ctx;
        ctx.resume().catch(() => {}); // unblock if browser auto-suspended

        const source = ctx.createMediaStreamSource(stream);

        // Analyser for the mic level bar
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        const tick = () => {
          analyser.getByteFrequencyData(freqData);
          const avg = freqData.reduce((s, v) => s + v, 0) / Math.max(freqData.length, 1);
          setMicLevel(Math.min(100, Math.round(avg * 2.2)));
          micLevelFrameRef.current = requestAnimationFrame(tick);
        };
        tick();

        // 4096 samples × 2 bytes = 8192 bytes per chunk (always even — required by backend PCM framing)
        processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          const float32 = event.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
          }
          // Encode to base64 without spread (safe for large buffers)
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "audio_chunk", data: btoa(binary), sequence: audioSeqRef.current++ })
            );
          }
        };

        source.connect(processor);
        processor.connect(ctx.destination); // required for onaudioprocess to fire
      })
      .catch(() => {
        setMicError("Microphone access is unavailable. Allow microphone permission in your browser, then retry.");
      });

    return () => {
      if (processor) { processor.disconnect(); processor.onaudioprocess = null; }
      localStream?.getTracks().forEach((t) => t.stop());
      if (micLevelFrameRef.current) cancelAnimationFrame(micLevelFrameRef.current);
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
      setMicLevel(0);
    };
  }, [phase, micRetryKey]);

  const wsSend = useCallback((msg: WsClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (wsConnected && phase !== "completed") {
      heartbeatRef.current = setInterval(() => {
        wsSend({ type: "ping" });
      }, 30_000);
    } else {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    }
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [wsConnected, phase, wsSend]);

  useEffect(() => {
    if (phase === "listening") {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      setShowInactivityBanner(false);
      inactivityRef.current = setTimeout(() => setShowInactivityBanner(true), 30_000);
    } else {
      setShowInactivityBanner(false);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    }
    return () => { if (inactivityRef.current) clearTimeout(inactivityRef.current); };
  }, [phase, partialTranscript]);

  const showScoreToast = useCallback((questionNum: number, score: number) => {
    if (scoreToastTimerRef.current) clearTimeout(scoreToastTimerRef.current);
    setScoreToast({ questionNumber: questionNum, score });
    scoreToastTimerRef.current = setTimeout(() => setScoreToast(null), 4000);
  }, []);

  const handleWsMessage = useCallback((msg: WsServerMessage) => {
    switch (msg.type) {
      case "session_ready":
        setTotalQuestions(msg.total_questions);
        setServerError(null);
        setWsConnected(true);
        break;
      case "session_resumed":
        setTotalQuestions(msg.total_questions);
        setQuestionNumber(msg.questions_asked + 1);
        setServerError(null);
        setWsConnected(true);
        setShowReconnectModal(false);
        break;
      case "question_audio": {
        setCurrentQuestion({ number: msg.question_number, text: msg.text });
        setServerError(null);
        setQuestionNumber(msg.question_number);
        setTranscript("");
        setPartialTranscript("");
        setPhase(msg.is_follow_up ? "follow-up" : "ai-talking");
        // Use server's time_limit_s; fall back to 120 only when server sends 0 or omits it
        const limit = msg.time_limit_s || 120;
        const afterAudio = () => { setPhase("listening"); setTimeLimitTotal(limit); startTimer(limit); };
        playTtsAudio(msg.audio, isAudioMutedRef, ttsAudioRef, ttsVisualizerCleanupRef, setInterviewerMouthLevel, afterAudio);
        break;
      }
      case "follow_up": {
        setCurrentQuestion((q) => q ? { ...q, text: msg.text, isFollowUp: true } : null);
        setPhase("follow-up");
        const afterFollowUp = () => { setPhase("listening"); startTimer(120); };
        playTtsAudio(msg.audio, isAudioMutedRef, ttsAudioRef, ttsVisualizerCleanupRef, setInterviewerMouthLevel, afterFollowUp);
        break;
      }
      case "partial_transcript":
        setServerError(null);
        setPartialTranscript(msg.text);
        break;
      case "transcript_final":
        setServerError(null);
        setTranscript(msg.text);
        setPartialTranscript("");
        break;
      case "answer_scored":
        showScoreToast(msg.question_number, msg.score);
        setPhase("processing");
        break;
      case "question_skipped":
        setTranscript("");
        setPartialTranscript("");
        break;
      case "interview_complete":
        stopTimer();
        setCompletedReportId(msg.report_id);
        setPhase("completed");
        break;
      case "session_paused":
        setWsConnected(false);
        setShowReconnectModal(true);
        break;
      case "error":
        setServerError(msg.message || "The interview service reported an issue. You can retry or end for a partial report.");
        break;
      default:
        break;
    }
  }, [startTimer, stopTimer, showScoreToast]);

  const openWebSocket = useCallback((wsUrl: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const ws = new WebSocket(buildWsUrl(wsUrl));
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        handleWsMessage(msg);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = (event) => {
      setWsConnected(false);
      if (event.code !== 1000 && event.code !== 1001) {
        setShowReconnectModal(true);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
      setShowReconnectModal(true);
    };
  }, [handleWsMessage]);

  // On mount: read session data from sessionStorage and open WebSocket
  useEffect(() => {
    if (!sessionId) return;

    try {
      const raw = sessionStorage.getItem("live_session_data");
      if (raw) {
        const data = JSON.parse(raw) as LiveCreateResponse;
        if (data.session_id === sessionId) {
          sessionStorage.removeItem("live_session_data");
          // Append one-time ticket for WS authentication if not already in the URL
          const wsUrl = data.ticket_id && !data.ws_url.includes('ticket=')
            ? `${data.ws_url}${data.ws_url.includes('?') ? '&' : '?'}ticket=${data.ticket_id}`
            : data.ws_url;
          openWebSocket(wsUrl);
          return;
        }
      }
    } catch { /* ignore parse error */ }

    // Fallback: construct ws path directly
    const wsPath = `/api/v1/mock-interview/live/${sessionId}`;
    openWebSocket(wsPath);
  }, [sessionId, openWebSocket]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleEndAnswer = useCallback(() => {
    stopTimer();
    setShowInactivityBanner(false);
    setPhase("processing");
    if (partialTranscript) setTranscript(partialTranscript);
    setPartialTranscript("");
    wsSend({ type: "end_answer" });
  }, [partialTranscript, stopTimer, wsSend]);

  // Keep autoSubmitRef pointing at the latest handleEndAnswer so the timer
  // can fire it without capturing a stale closure.
  useEffect(() => {
    autoSubmitRef.current = handleEndAnswer;
  }, [handleEndAnswer]);

  const handleEndInterview = useCallback(() => {
    stopTimer();
    setShowEndModal(false);
    wsSend({ type: "end_interview" });
    setPhase("completed");
  }, [stopTimer, wsSend]);

  const handleReconnect = useCallback(async () => {
    const next = reconnectAttempt + 1;
    setReconnectAttempt(next);
    if (next > MAX_RECONNECT || !sessionId) return;

    try {
      const state = await getLiveSessionState(sessionId);
      if (!state.can_reconnect || !state.reconnect_token) return;

      const wsPath = `/api/v1/mock-interview/live/${sessionId}?ticket=${state.reconnect_token}`;
      openWebSocket(wsPath);
      setShowReconnectModal(false);
    } catch { /* leave modal open */ }
  }, [reconnectAttempt, sessionId, openWebSocket]);

  const isQuestionBeingSpoken = phase === "ai-talking" || phase === "follow-up";
  const questionTextForDisplay = currentQuestion
    ? isQuestionBeingSpoken
      ? visibleQuestionText
      : currentQuestion.text
    : "Your interviewer is preparing the first question.";

  if (phase === "completed") {
    return <CompletedScreen sessionId={sessionId} reportId={completedReportId} />;
  }

  return (
    <>
      {showEndModal && (
        <EndEarlyModal
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          onConfirm={handleEndInterview}
          onCancel={() => setShowEndModal(false)}
        />
      )}

      {showReconnectModal && (
        <ReconnectModal
          attempt={reconnectAttempt}
          maxAttempts={MAX_RECONNECT}
          onRetry={handleReconnect}
          onAbandon={() => router.push(`/mock-interview/report/${sessionId}`)}
        />
      )}

      <div className="flex h-[calc(100vh-56px)] min-h-0 flex-col overflow-hidden bg-gray-50">
        {/* Score toast */}
        {showFullscreenWarning && (
          <div className="fixed top-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-2.5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.30)]">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0 text-yellow-400" />
              Fullscreen helps simulate the interview environment.
            </p>
            <button onClick={toggleFullscreen} className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20">
              Enter fullscreen
            </button>
          </div>
        )}

        {scoreToast && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2.5 bg-white border border-[#2557a7]/20 rounded-xl px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
            <CheckCircle2 size={14} className="text-[#2557a7] shrink-0" />
            <p className="text-xs text-gray-900 font-semibold">
              Q{scoreToast.questionNumber} scored:{" "}
              <span className={scoreToast.score >= 7 ? "text-[#2557a7]" : scoreToast.score >= 5 ? "text-gray-600" : "text-gray-400"}>
                {scoreToast.score}/10
              </span>
            </p>
            <button onClick={() => setScoreToast(null)} className="ml-1 text-gray-400 hover:text-gray-600" aria-label="Dismiss score notification">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Status bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <span className="flex items-center gap-1.5 text-xs text-[#2557a7] font-medium">
                <Wifi size={12} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <WifiOff size={12} /> Disconnected
              </span>
            )}
            <span className="text-xs text-gray-500">Session: {sessionId.slice(-8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {sessionType} Interview
            </span>
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Enter full screen"
              >
                <Maximize2 size={13} />
              </button>
            )}
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <PhoneOff size={12} /> End
            </button>
          </div>
        </div>

        {serverError && (
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-white flex items-center gap-2">
              <AlertCircle size={13} className="text-yellow-300 shrink-0" />
              {serverError}
            </p>
            <button onClick={() => setServerError(null)} className="text-white/70 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {micError && (
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <Mic size={15} className="mt-0.5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Microphone permission needs attention</p>
                  <p className="mt-0.5 text-xs text-gray-500">Allow microphone access from the browser address bar, then retry. Your completed answers remain saved.</p>
                </div>
              </div>
              <button onClick={() => setMicRetryKey((key) => key + 1)} className="shrink-0 rounded-lg bg-[#2557a7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e4a8f]">
                Retry mic
              </button>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="border-b border-gray-200 bg-white px-4 py-2.5">
            <div className="mx-auto flex max-w-3xl items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <VideoOff size={15} className="mt-0.5 shrink-0 text-gray-500" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Camera preview is unavailable</p>
                <p className="mt-0.5 text-xs text-gray-500">You can continue if microphone works, but enabling camera creates a closer real interview simulation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Inactivity banner */}
        {showInactivityBanner && (
          <div className="bg-[#2557a7]/20 border-b border-[#2557a7]/40 px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-[#2557a7] flex items-center gap-2">
              <AlertCircle size={13} className="shrink-0" />
              Are you still there? Press <strong>Done Speaking</strong> or continue your answer.
            </p>
            <button onClick={() => setShowInactivityBanner(false)} className="text-[#2557a7] hover:text-[#1e4a8f]">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[1560px] flex-col gap-3">
            {/* Question progress */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < questionNumber - 1
                        ? "bg-[#2557a7]"
                        : i === questionNumber - 1
                        ? "bg-[#2557a7]"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="shrink-0 text-xs font-medium text-gray-500">
                {questionNumber}/{totalQuestions}
              </span>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.14fr)_minmax(320px,0.78fr)_300px] gap-3 overflow-hidden">
              {/* Interviewer */}
              <section className="relative min-h-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-[0_16px_48px_rgba(15,23,42,0.10)]">
                <Image
                  src={interviewer.src}
                  alt={`${interviewer.name}, AI interviewer seated in a professional interview room`}
                  fill
                  className="scale-[1.24] object-cover object-[center_44%]"
                  priority
                  sizes="48vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-black/25" aria-hidden="true" />

                {isQuestionBeingSpoken && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-[43.5%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center mix-blend-multiply"
                    style={{
                      opacity: 0.14 + interviewerMouthLevel * 0.28,
                      transform: `translate(-50%, -50%) scaleX(${0.82 + interviewerMouthLevel * 0.34})`,
                    }}
                    aria-hidden="true"
                  >
                    <span
                      className="block rounded-full bg-black/70 shadow-[0_0_10px_rgba(0,0,0,0.22)]"
                      style={{
                        width: `${18 + interviewerMouthLevel * 18}px`,
                        height: `${2 + interviewerMouthLevel * 9}px`,
                        filter: `blur(${0.15 + interviewerMouthLevel * 0.35}px)`,
                      }}
                    />
                  </div>
                )}

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
                  <span className={`h-2 w-2 rounded-full ${wsConnected ? "bg-emerald-400" : "bg-white/50"}`} />
                  {wsConnected ? "Live interview room" : "Connecting room"}
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#2557a7] shadow-sm" role="status" aria-live="polite">
                  {getInterviewerStatus(phase)}
                </div>

                {(phase === "ai-talking" || phase === "follow-up") && (
                  <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md sm:flex">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
                    Interviewer speaking
                  </div>
                )}

                <div className="absolute bottom-4 left-4 max-w-[min(380px,calc(100%-2rem))] rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-white shadow-xl backdrop-blur-md">
                  <p className="text-lg font-bold">{interviewer.name}, AI Interviewer</p>
                  <p className="mt-0.5 text-xs font-medium text-white/75">{interviewer.role} - {sessionType} interview</p>
                </div>
              </section>

              {/* Question and transcript */}
              <section className="flex min-h-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Current question</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">Question {questionNumber}/{totalQuestions || "-"}</p>
                    </div>
                    {currentQuestion?.isFollowUp && (
                      <span className="rounded-full border border-[#2557a7]/20 bg-[#2557a7]/10 px-2 py-1 text-xs font-semibold text-[#2557a7]">Follow-up</span>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1">
                    <p className="text-base font-semibold leading-relaxed text-gray-950">
                      {questionTextForDisplay}
                      {isQuestionBeingSpoken && visibleQuestionText !== currentQuestion?.text && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#2557a7] align-[-2px]" aria-hidden="true" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-[#2557a7]/15 bg-[#2557a7]/5 px-3 py-2 text-center">
                  {phase === "connecting" && (
                    <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2557a7]">
                      <Loader2 size={13} className="animate-spin" />
                      Connecting to {interviewer.name}
                    </p>
                  )}
                  {phase === "ai-talking" && (
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2557a7]">{interviewer.name} is asking</p>
                      <AIWaveform />
                    </div>
                  )}
                  {phase === "follow-up" && (
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare size={12} className="text-[#2557a7]" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#2557a7]">Follow-up question</span>
                    </div>
                  )}
                  {phase === "listening" && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2557a7]">{interviewer.name} is listening</p>
                  )}
                  {phase === "processing" && (
                    <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2557a7]">
                      <Loader2 size={13} className="animate-spin" />
                      Reviewing answer
                    </p>
                  )}
                </div>

                <div className="flex min-h-[220px] flex-1 flex-col rounded-xl border border-gray-200 bg-white p-3">
                  {phase === "listening" ? (
                    <div className="flex h-full min-h-0 flex-col" role="log" aria-live="polite" aria-label="Live transcript">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Live transcript</p>
                        {!micError && (
                          <div className="flex items-center gap-2 rounded-full bg-gray-50 px-2 py-1" role="status" aria-label={`Microphone input level ${micLevel} percent`}>
                            <MicLevelMeter level={micLevel} />
                            <span className="text-[10px] font-semibold text-gray-500">{micLevel > 8 ? "Hearing you" : "Waiting"}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-gray-50 px-3 py-3">
                        {micError ? (
                          <p className="text-sm text-gray-500">Microphone is unavailable. Use Retry mic above after allowing permission.</p>
                        ) : partialTranscript || transcript ? (
                          <p className="text-sm leading-relaxed text-gray-700">
                            {partialTranscript || transcript}
                            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#2557a7]" />
                          </p>
                        ) : (
                          <p className="text-sm italic text-gray-400">Start speaking... transcript will appear here.</p>
                        )}
                      </div>
                    </div>
                  ) : phase === "processing" && transcript ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your answer</p>
                      <p className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-700">{transcript}</p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[160px] items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm text-gray-500">
                      Transcript appears here when it is your turn to answer.
                    </div>
                  )}
                </div>
              </section>

              {/* Interviewee */}
              <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="rounded-xl border border-gray-200 bg-gray-950 p-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-900">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full scale-x-[-1] object-cover transition-opacity ${
                        !cameraError ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                        <VideoOff size={24} />
                        <span className="text-xs font-medium">Camera unavailable</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/35 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                      You
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${micError ? "border-gray-200 bg-gray-100 text-gray-400" : "border-[#2557a7]/30 bg-white text-[#2557a7]"}`}>
                      <Mic size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Mic locked</p>
                      <p className="text-[10px] text-gray-400">Recording integrity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cameraError ? "border-gray-200 bg-gray-100 text-gray-400" : "border-[#2557a7]/30 bg-white text-[#2557a7]"}`}>
                      <Video size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Cam locked</p>
                      <p className="text-[10px] text-gray-400">Interview mode</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAudioMuted((m) => {
                        const next = !m;
                        if (ttsAudioRef.current) {
                          if (next) {
                            ttsAudioRef.current.pause();
                          } else {
                            ttsAudioRef.current.play().catch(() => {});
                          }
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100"
                    aria-label={isAudioMuted ? "Unmute interviewer audio" : "Mute interviewer audio"}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      isAudioMuted ? "border-gray-200 bg-gray-100 text-gray-400" : "border-gray-200 bg-white text-gray-600"
                    }`}>
                      {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Speaker</p>
                      <p className="text-[10px] text-gray-400">Interviewer audio</p>
                    </div>
                  </button>
                </div>
              </aside>
            </div>

            <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_300px] gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 shadow-sm">
                <InterviewTimeline phase={phase} />
              </div>

              <div className="rounded-2xl border border-[#2557a7]/20 bg-white p-3 shadow-sm">
                {phase === "listening" ? (
                  <div className="flex items-center gap-3 rounded-xl bg-[#2557a7]/5 p-2">
                    <QuestionTimer secondsLeft={timeLeft} total={timeLimitTotal} />
                    <button
                      onClick={handleEndAnswer}
                      className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2557a7] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1e4a8f]"
                    >
                      Done Speaking <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-14 items-center justify-center rounded-xl bg-gray-50 px-4 text-center text-sm font-semibold text-gray-500">
                    {getInterviewerStatus(phase)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
