"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  MicOff,
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
  Minimize2,
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

// ─── Animated waveform for AI talking ────────────────────────────────────────

function AIWaveform() {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="waveBar-bar w-1.5 bg-[#2557a7] rounded-full"
          style={{
            height: `${Math.random() * 28 + 10}px`,
            animationName: "waveBar",
            animationDuration: `${0.5 + Math.random() * 0.7}s`,
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

// ─── Recording pulse ──────────────────────────────────────────────────────────

function RecordingPulse() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <div className="absolute w-20 h-20 rounded-full bg-[#2557a7] opacity-20 animate-ping motion-reduce:animate-none" />
      <div className="absolute w-14 h-14 rounded-full bg-[#2557a7] opacity-30 animate-ping motion-reduce:animate-none" style={{ animationDelay: "0.2s" }} />
      <div className="w-10 h-10 rounded-full bg-[#2557a7] flex items-center justify-center">
        <Mic size={18} className="text-white" />
      </div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function QuestionTimer({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const pct = (secondsLeft / total) * 100;
  const ring = secondsLeft < 20 ? "#9ca3af" : "#2557a7";
  const color = secondsLeft < 20 ? "text-gray-400" : "text-[#2557a7]";
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" width="56" height="56">
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

function CompletedScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-[#2557a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={40} className="text-[#2557a7]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h2>
      <p className="text-gray-500 text-sm mb-6">
        Great effort! Your report is being generated. It will be ready in a few seconds.
      </p>
      <button
        onClick={() => router.push(`/mock-interview/report/${sessionId}`)}
        className="flex items-center gap-2 px-6 py-3 bg-[#2557a7] text-white rounded-xl font-bold mx-auto hover:bg-[#1e4a8f] transition-all shadow-md"
      >
        View My Report <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── TTS audio playback helper ───────────────────────────────────────────────
// Decodes base64 TTS audio from the WebSocket and plays it.
// Calls `onEnd` when playback finishes (or immediately if audio is null/muted).
function playTtsAudio(
  base64Audio: string | null,
  mutedRef: React.RefObject<boolean>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  onEnd: () => void,
) {
  // Stop any currently playing TTS
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  if (!base64Audio || mutedRef.current) {
    // No audio or muted — wait a moment so the UI phase shows briefly, then continue
    setTimeout(onEnd, 1500);
    return;
  }

  try {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      onEnd(); // continue even if playback fails
    };
    audio.play().catch(() => {
      // Autoplay blocked by browser policy — fall back to timeout
      setTimeout(onEnd, 2000);
    });
  } catch {
    setTimeout(onEnd, 1500);
  }
}

// ─── Main Live Interview Page ─────────────────────────────────────────────────

export default function LiveInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [sessionType] = useState("HR");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false); // ref so WS handler sees latest value without stale closure
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null); // current TTS audio element
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep ref in sync with state so toggles mid-playback take effect
  useEffect(() => { isAudioMutedRef.current = isAudioMuted; }, [isAudioMuted]);

  // ─── Camera self-view + fullscreen ─────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
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

  const toggleCamera = useCallback(() => {
    setCameraOn((on) => {
      const next = !on;
      cameraStream?.getVideoTracks().forEach((t) => { t.enabled = next; });
      return next;
    });
  }, [cameraStream]);

  // Track fullscreen state so the toggle button shows the right icon
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
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

  const startTimer = useCallback((duration: number) => {
    stopTimer();
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

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
        setWsConnected(true);
        break;
      case "session_resumed":
        setTotalQuestions(msg.total_questions);
        setQuestionNumber(msg.questions_asked + 1);
        setWsConnected(true);
        setShowReconnectModal(false);
        break;
      case "question_audio": {
        setCurrentQuestion({ number: msg.question_number, text: msg.text });
        setQuestionNumber(msg.question_number);
        setTranscript("");
        setPartialTranscript("");
        setPhase(msg.is_follow_up ? "follow-up" : "ai-talking");
        const afterAudio = () => { setPhase("listening"); startTimer(msg.time_limit_s ?? 120); };
        playTtsAudio(msg.audio, isAudioMutedRef, ttsAudioRef, afterAudio);
        break;
      }
      case "follow_up": {
        setCurrentQuestion((q) => q ? { ...q, text: msg.text, isFollowUp: true } : null);
        setPhase("follow-up");
        const afterFollowUp = () => { setPhase("listening"); startTimer(120); };
        playTtsAudio(msg.audio, isAudioMutedRef, ttsAudioRef, afterFollowUp);
        break;
      }
      case "partial_transcript":
        setPartialTranscript(msg.text);
        break;
      case "transcript_final":
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
        setPhase("completed");
        break;
      case "session_paused":
        setWsConnected(false);
        setShowReconnectModal(true);
        break;
      case "error":
        setShowInactivityBanner(true);
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

  if (phase === "completed") {
    return <CompletedScreen sessionId={sessionId} />;
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

      <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col">
        {/* Score toast */}
        {scoreToast && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2.5 bg-white border border-[#2557a7]/20 rounded-xl px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
            <CheckCircle2 size={14} className="text-[#2557a7] shrink-0" />
            <p className="text-xs text-gray-900 font-semibold">
              Q{scoreToast.questionNumber} scored:{" "}
              <span className={scoreToast.score >= 7 ? "text-[#2557a7]" : scoreToast.score >= 5 ? "text-gray-600" : "text-gray-400"}>
                {scoreToast.score}/10
              </span>
            </p>
            <button onClick={() => setScoreToast(null)} className="text-gray-400 hover:text-gray-600 ml-1">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Camera self-view */}
        <div className="fixed bottom-4 right-4 z-30 w-44 h-32 rounded-xl overflow-hidden border-2 border-white bg-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.24)]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full scale-x-[-1] object-cover transition-opacity ${
              cameraOn && !cameraError ? "opacity-100" : "opacity-0"
            }`}
          />
          {(!cameraOn || cameraError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
              <VideoOff size={20} />
              <span className="text-[10px] font-medium">
                {cameraError ? "Camera unavailable" : "Camera off"}
              </span>
            </div>
          )}
          <span className="absolute bottom-1 left-2 text-[10px] font-medium text-white/90 drop-shadow">
            You
          </span>
        </div>

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
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <PhoneOff size={12} /> End
            </button>
          </div>
        </div>

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
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-5">
            {/* Question progress */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 flex-1">
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
              <span className="text-xs text-gray-500 font-medium shrink-0">
                {questionNumber}/{totalQuestions}
              </span>
            </div>

            {/* AI avatar + phase indicator */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
              <div className="flex justify-center mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${
                  phase === "ai-talking" || phase === "follow-up"
                    ? "border-[#2557a7] bg-[#2557a7]/10 shadow-lg shadow-[#2557a7]/20"
                    : phase === "processing"
                    ? "border-[#2557a7]/50 bg-[#2557a7]/10"
                    : "border-gray-200 bg-gray-50"
                }`}>
                  <Video size={32} className={phase === "ai-talking" || phase === "follow-up" ? "text-[#2557a7]" : "text-gray-500"} />
                </div>
              </div>

              <div className="mb-3">
                {phase === "connecting" && (
                  <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-[#2557a7]" />
                    Connecting to AI interviewer…
                  </p>
                )}
                {phase === "ai-talking" && (
                  <>
                    <p className="text-[#2557a7] text-xs font-semibold mb-2 uppercase tracking-wide">AI is speaking</p>
                    <AIWaveform />
                  </>
                )}
                {phase === "follow-up" && (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2557a7]/20 border border-[#2557a7]/40 rounded-full mb-2">
                      <MessageSquare size={11} className="text-[#2557a7]" />
                      <span className="text-xs text-[#2557a7] font-semibold">Follow-up Question</span>
                    </div>
                    <AIWaveform />
                  </>
                )}
                {phase === "listening" && (
                  <p className="text-[#2557a7] text-xs font-semibold uppercase tracking-wide">Your turn to speak</p>
                )}
                {phase === "processing" && (
                  <p className="text-[#2557a7] text-sm flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Processing your answer…
                  </p>
                )}
              </div>

              {currentQuestion && (phase === "ai-talking" || phase === "follow-up" || phase === "listening" || phase === "processing") && (
                <div className="bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl px-4 py-3 text-left mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500">Question {currentQuestion.number}</p>
                    {currentQuestion.isFollowUp && (
                      <span className="text-xs px-1.5 py-0.5 bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/20 rounded-full">Follow-up</span>
                    )}
                  </div>
                  <p className="text-gray-900 text-sm font-semibold leading-relaxed">
                    {currentQuestion.text}
                  </p>
                </div>
              )}
            </div>

            {/* Live transcript */}
            {phase === "listening" && (
              <div
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 min-h-20 shadow-sm"
                role="log"
                aria-live="polite"
                aria-label="Live transcript"
              >
                <p className="text-xs text-gray-500 mb-2">Live Transcript</p>
                {partialTranscript ? (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {partialTranscript}
                    <span className="inline-block w-0.5 h-4 bg-[#2557a7] ml-0.5 animate-pulse" />
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">Start speaking… transcript will appear here.</p>
                )}
              </div>
            )}

            {/* After processing — show what was said */}
            {phase === "processing" && transcript && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500 mb-2">Your Answer</p>
                <p className="text-gray-700 text-sm leading-relaxed">{transcript}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsMuted((m) => !m)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                  isMuted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                disabled={cameraError}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all disabled:cursor-not-allowed ${
                  !cameraOn || cameraError
                    ? "bg-gray-100 border-gray-200 text-gray-400"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {cameraOn && !cameraError ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {phase === "listening" && (
                <div className="flex flex-col items-center gap-2">
                  <RecordingPulse />
                  <button
                    onClick={handleEndAnswer}
                    className="px-6 py-2.5 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] transition-all flex items-center gap-1.5"
                  >
                    Done Speaking <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {phase === "listening" && (
                <QuestionTimer secondsLeft={timeLeft} total={120} />
              )}

              <button
                onClick={() => {
                  setIsAudioMuted((m) => {
                    const next = !m;
                    if (ttsAudioRef.current) {
                      next ? ttsAudioRef.current.pause() : ttsAudioRef.current.play().catch(() => {});
                    }
                    return next;
                  });
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                  isAudioMuted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
                aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
              >
                {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
