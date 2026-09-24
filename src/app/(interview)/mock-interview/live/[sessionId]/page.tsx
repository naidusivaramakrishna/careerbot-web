"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
// Type-only — the actual livekit-client module (a full WebRTC SDK) is loaded
// dynamically inside joinAvatar() below, only when an avatar session exists.
// avatar: null is the common case (feature off by default per environment),
// so this keeps that SDK out of the bundle everyone pays for by default.
import type { Room, RemoteTrack } from "livekit-client";
import {
  buildWsUrl,
  getLiveSessionState,
  evaluateLiveSessionVideo,
  WsServerMessage,
  WsClientMessage,
  LiveCreateResponse,
  LiveAvatarSession,
} from "@/api/mockInterviewApi";
import { MOCK_INTERVIEWERS, isValidInterviewerIndex, pickInterviewerIndex } from "../../_lib/interviewers";
import type { MockInterviewer } from "../../_lib/interviewers";
import { useMockInterview } from "../../_context/MockInterviewContext";
import { CodingTransition } from "@/components/interview/CodingTransition";
import { CodingStep } from "@/components/interview/CodingStep";
import type { SubmitSolutionResponse } from "@/app/coding-test/_lib/types";
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
  RefreshCw,
  Maximize2,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewPhase =
  | "connecting"    // WebSocket connecting
  | "ai-talking"    // Interviewer is speaking (streaming audio deltas)
  | "listening"     // Candidate's turn — mic streaming, AI doing turn detection
  | "processing"    // Candidate's turn closed, waiting on scoring / next question
  | "coding"        // Live coding round active (not sent by this backend release — kept inert)
  | "completed";    // All questions done

interface CodingRoundState {
  problemSlug: string;
  problemTitle: string;
  timeLimitS: number;
}

interface Question {
  number: number;
  text: string;
}

interface ScoreToast {
  questionNumber: number;
  score: number;
}

interface StoredInterviewerSelection {
  session_id?: string;
  interviewer_index?: number;
  interviewer_name?: string;
  gender?: string;
  voice?: string;
}

function readStoredInterviewerIndex(sessionId: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawSelection = sessionStorage.getItem("live_session_interviewer");
    if (!rawSelection) return null;

    const selection = JSON.parse(rawSelection) as StoredInterviewerSelection;
    if (selection.session_id && selection.session_id !== sessionId) return null;
    if (!isValidInterviewerIndex(selection.interviewer_index)) return null;

    return selection.interviewer_index;
  } catch {
    return null;
  }
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

function getInterviewerStatus(phase: InterviewPhase, isSessionClosing = false) {
  if (isSessionClosing) return "Wrapping up the interview";
  if (phase === "connecting") return "Joining the room";
  if (phase === "ai-talking") return "Asking the next question";
  if (phase === "listening") return "Listening to your answer";
  if (phase === "processing") return "Reviewing your response";
  if (phase === "coding") return "Live coding round";
  return "Session complete";
}

function InterviewTimeline({ phase }: { phase: InterviewPhase }) {
  const steps = [
    { key: "ai-talking", label: "Question" },
    { key: "listening", label: "Answer" },
    { key: "processing", label: "Review" },
  ] as const;
  const activeIndex = steps.findIndex((step) => step.key === phase);

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


// ─── End Early modal ──────────────────────────────────────────────────────────

function EndEarlyModal({
  onConfirm,
  onCancel,
}: {
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
      <div className="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between mb-4">
          <h2 id="end-modal-title" className="text-base font-bold text-gray-900">End Interview Early?</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-6">
          Ending early will generate a partial report. Your scores for completed questions will still be saved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-[#2557a7] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e4a8f]"
          >
            Continue Interview
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            End
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
      <div className="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2557a7] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e4a8f]"
            >
              <RefreshCw size={13} /> Try Again
            </button>
          )}
          <button
            onClick={onAbandon}
            className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
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
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-[#2557a7]/10">
        <CheckCircle2 size={40} className="text-[#2557a7]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h2>
      <p className="text-gray-500 text-sm mb-5">
        Great effort. Your completed answers are saved and the report is being prepared.
      </p>
      <div className="mb-6 space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${index < 2 ? "bg-[#2557a7]/10 text-[#2557a7]" : "bg-gray-100 text-gray-500"}`}>{index < 2 ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}</span>
            {step}
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push(`/mock-interview/report/${reportTargetId}`)}
        className="mx-auto flex items-center gap-2 rounded-lg bg-[#2557a7] px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-[#1e4a8f]"
      >
        View My Report <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Interviewer audio playback (streamed PCM16 24 kHz deltas) ──────────────
// live-interview.txt section 4 "Server → speaker": interviewer_audio_delta
// carries raw PCM16 mono @ 24 kHz, base64-encoded, arriving in bursts faster
// than real time — deltas are scheduled back-to-back on one persistent
// AudioContext rather than played one at a time.

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

const INTERVIEWER_AUDIO_SAMPLE_RATE = 24000;

// Candidate partial captions with no transcript_final after this long are dropped.
const PARTIAL_STALE_MS = 5000;

// Client-side noise gate for mic upload. Gated chunks are still sent, as
// digital silence, so the server's turn detection keeps seeing continuous
// audio and can still detect the end of an answer; only the noise is removed.
const MIC_GATE_RMS_THRESHOLD = 0.008; // about -42 dBFS, below normal quiet speech
const MIC_GATE_HANGOVER_CHUNKS = 5;   // ~500 ms of tail after speech so word endings aren't clipped

interface InterviewerAudioPlayer {
  context: AudioContext;
  gainNode: GainNode;
  playAt: number;
  activeSources: Set<AudioBufferSourceNode>;
}

function createInterviewerAudioPlayer(): InterviewerAudioPlayer | null {
  const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const context = new AudioContextCtor({ sampleRate: INTERVIEWER_AUDIO_SAMPLE_RATE });
  const gainNode = context.createGain();
  gainNode.connect(context.destination);
  return { context, gainNode, playAt: 0, activeSources: new Set() };
}

function scheduleInterviewerAudioDelta(player: InterviewerAudioPlayer, audioBase64: string) {
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(audioBase64);
  } catch {
    return;
  }
  const sampleCount = bytes.byteLength >> 1;
  if (sampleCount <= 0) return;

  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
  const buffer = player.context.createBuffer(1, sampleCount, INTERVIEWER_AUDIO_SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) channel[i] = pcm[i] / 0x8000;

  const source = player.context.createBufferSource();
  source.buffer = buffer;
  source.connect(player.gainNode);
  source.onended = () => player.activeSources.delete(source);

  const startAt = Math.max(player.playAt, player.context.currentTime);
  source.start(startAt);
  player.playAt = startAt + buffer.duration;
  player.activeSources.add(source);
}

// interviewer_interrupted: "stop scheduled sources and reset playAt = 0."
function stopInterviewerAudio(player: InterviewerAudioPlayer) {
  player.activeSources.forEach((source) => {
    try { source.stop(); } catch { /* already stopped/ended */ }
  });
  player.activeSources.clear();
  player.playAt = 0;
}
export default function LiveInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const interviewer = useMemo<MockInterviewer>(() => MOCK_INTERVIEWERS[readStoredInterviewerIndex(sessionId) ?? pickInterviewerIndex(sessionId)], [sessionId]);

  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [sessionType, setSessionType] = useState("Live");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [visibleQuestionText, setVisibleQuestionText] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false); // handleWsMessage reads this, not the state, to stay dependency-free
  const interviewerAudioPlayerRef = useRef<InterviewerAudioPlayer | null>(null);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isSessionClosing, setIsSessionClosing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [transcriptionError, setTranscriptionError] = useState(false);
  // Partials are temporary UI only: dropped if no transcript_final follows
  // within PARTIAL_STALE_MS.
  const partialStaleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partialItemIdRef = useRef<string | null>(null);
  const clearPartialTranscript = useCallback(() => {
    if (partialStaleTimerRef.current) clearTimeout(partialStaleTimerRef.current);
    partialStaleTimerRef.current = null;
    partialItemIdRef.current = null;
    setPartialTranscript("");
  }, []);
  useEffect(() => () => { if (partialStaleTimerRef.current) clearTimeout(partialStaleTimerRef.current); }, []);
  const [wsConnected, setWsConnected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [micRetryKey, setMicRetryKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ─── Avatar (interview-avatar.txt) ──────────────────────────────────────
  // Optional talking-face layer on top of the same interviewer_audio_delta
  // stream. avatar: null (the default) is normal — this whole subsystem then
  // stays in "fallback" and the interview behaves exactly as without it.
  type AvatarConnection = "connecting" | "live" | "audio-blocked" | "fallback";
  const [avatarConnection, setAvatarConnection] = useState<AvatarConnection>("fallback");
  const [, setAvatarActivity] = useState<"idle" | "listening" | "talking">("idle");
  const avatarVideoElRef = useRef<HTMLVideoElement | null>(null);
  const avatarRoomRef = useRef<Room | null>(null);
  const avatarAudioElRef = useRef<HTMLMediaElement | null>(null); // attach() returns HTMLMediaElement
  // handleWsMessage reads this via ref, not avatarConnection state, to stay
  // dependency-free (same reasoning as questionNumberRef / isAudioMutedRef).
  const avatarAudioLiveRef = useRef(false);
  const { consumePendingAvatarSession } = useMockInterview();

  const disconnectAvatarRoom = useCallback(() => {
    avatarRoomRef.current?.disconnect();
    avatarRoomRef.current = null;
    avatarAudioElRef.current?.remove();
    avatarAudioElRef.current = null;
    avatarAudioLiveRef.current = false;
  }, []);

  const joinAvatar = useCallback(async (avatar: LiveAvatarSession) => {
    setAvatarConnection("connecting");

    let Room: typeof import("livekit-client").Room;
    let RoomEvent: typeof import("livekit-client").RoomEvent;
    let Track: typeof import("livekit-client").Track;
    try {
      ({ Room, RoomEvent, Track } = await import("livekit-client"));
    } catch {
      // Chunk failed to load (offline, blocked, etc.) — same silent fallback
      // as any other avatar-unavailable path.
      setAvatarConnection("fallback");
      return;
    }

    const room = new Room({ adaptiveStream: true });
    avatarRoomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video) {
        if (avatarVideoElRef.current) track.attach(avatarVideoElRef.current);
        setAvatarConnection((s) => (s === "connecting" ? "live" : s));
      }
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.autoplay = true;
        document.body.appendChild(el);
        avatarAudioElRef.current = el;
        avatarAudioLiveRef.current = true; // from now on, ignore interviewer_audio_delta
        if (room.canPlaybackAudio === false) setAvatarConnection("audio-blocked");
      }
    });

    // Autoplay can be blocked or unblocked at any point (e.g. after a tab
    // switch) — react to it rather than only checking once on attach.
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      setAvatarConnection((s) => {
        if (!room.canPlaybackAudio) return "audio-blocked";
        return s === "audio-blocked" ? "live" : s;
      });
    });

    room.on(RoomEvent.Disconnected, () => {
      avatarAudioLiveRef.current = false;
      setAvatarConnection("fallback");
    });

    try {
      await room.connect(avatar.livekit_url, avatar.livekit_client_token);
    } catch {
      // "avatar unavailable, continuing audio-only" — never surfaced as an error.
      avatarAudioLiveRef.current = false;
      setAvatarConnection("fallback");
    }
  }, []);

  const handleEnableAvatarSound = useCallback(() => {
    avatarRoomRef.current?.startAudio()
      .then(() => setAvatarConnection("live"))
      .catch(() => {});
  }, []);

  // Consume the avatar session handed off from the "starting" page, once.
  // Cached in a ref (not just re-read from context) so a React StrictMode
  // double-mount doesn't lose it — same pattern as initialWsUrlRef below.
  const consumedAvatarRef = useRef<{ done: boolean; avatar: LiveAvatarSession | null }>({ done: false, avatar: null });
  useEffect(() => {
    if (!sessionId) return;
    if (!consumedAvatarRef.current.done) {
      consumedAvatarRef.current = { done: true, avatar: consumePendingAvatarSession(sessionId) };
    }
    const avatar = consumedAvatarRef.current.avatar;
    if (avatar) {
      joinAvatar(avatar);
    } else {
      setAvatarConnection("fallback");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Disconnect on unmount (leaving the page) — interview_complete and
  // avatar_unavailable disconnect it explicitly from handleWsMessage.
  useEffect(() => () => disconnectAvatarRoom(), [disconnectAvatarRoom]);

  useEffect(() => { isAudioMutedRef.current = isAudioMuted; }, [isAudioMuted]);

  // Toggling mute adjusts the persistent player's gain directly — no need to
  // tear down or re-decode anything already scheduled.
  useEffect(() => {
    if (interviewerAudioPlayerRef.current) {
      interviewerAudioPlayerRef.current.gainNode.gain.value = isAudioMuted ? 0 : 1;
    }
  }, [isAudioMuted]);

  useEffect(() => {
    const storedType = sessionStorage.getItem("live_session_type");
    if (storedType) setSessionType(storedType);
  }, []);

  // Tear down the audio player on unmount.
  useEffect(() => {
    return () => {
      const player = interviewerAudioPlayerRef.current;
      if (player) {
        stopInterviewerAudio(player);
        player.context.close().catch(() => {});
        interviewerAudioPlayerRef.current = null;
      }
    };
  }, []);

  // ─── Camera self-view + fullscreen ─────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Proctoring video recording — captured throughout the session, submitted on completion
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  // Turn the webcam on automatically when the live interview opens, and start proctoring recording
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

        // Start proctoring recorder — prefer MP4 so the evaluator can decode it reliably
        const mimeType = MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        try {
          const recorder = new MediaRecorder(stream, { mimeType });
          videoChunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            // Actual submission is triggered by the completion effect; nothing to do here
          };
          recorder.start(5000); // flush a chunk every 5 s so partial data survives tab crashes
          videoRecorderRef.current = recorder;
        } catch {
          // Recording failed to start — non-fatal; the interview continues without proctoring
        }
      })
      .catch(() => {
        if (!cancelled) setCameraError(true);
      });
    return () => {
      cancelled = true;
      // Null out the onstop handler so cleanup stop doesn't race with completion submission
      if (videoRecorderRef.current) {
        videoRecorderRef.current.onstop = null;
        if (videoRecorderRef.current.state !== "inactive") {
          videoRecorderRef.current.stop();
        }
        videoRecorderRef.current = null;
      }
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

  // When the interview finishes: stop the proctoring recorder, submit the video, release camera
  useEffect(() => {
    if (phase !== "completed") return;

    const recorder = videoRecorderRef.current;
    if (recorder) {
      const submit = () => {
        const chunks = videoChunksRef.current;
        if (chunks.length === 0) return;
        const mt = (recorder.mimeType || "video/mp4").split(";")[0];
        const blob = new Blob(chunks, { type: mt });
        evaluateLiveSessionVideo(sessionId, blob).catch(() => {}); // fire-and-forget
      };

      if (recorder.state !== "inactive") {
        recorder.onstop = submit;
        recorder.stop();
      } else {
        // Recorder already stopped (e.g. stream was cut mid-session) but chunks are buffered
        submit();
      }
      videoRecorderRef.current = null;
    }

    cameraStream?.getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [phase, cameraStream, sessionId]);

  // Leave fullscreen if the user navigates away mid-interview
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const fullscreenWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Coding round state ────────────────────────────────────────────────────
  const [codingRound, setCodingRound] = useState<CodingRoundState | null>(null);
  const [showCodingTransition, setShowCodingTransition] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const MAX_RECONNECT = 3;

  // Reconnect state kept in refs to avoid stale-closure issues inside WS callbacks
  const reconnectAttemptRef = useRef(0);
  const reconnectTokenRef = useRef<string | null>(null);   // token from session_paused
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventIdRef = useRef<number>(0);                // event dedup baseline

  const [scoreToast, setScoreToast] = useState<ScoreToast | null>(null);
  const scoreToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showInactivityBanner, setShowInactivityBanner] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMicActiveRef = useRef<number>(Date.now());

  // ─── Microphone → raw PCM16 @ 24 kHz → WebSocket audio_chunk ────────────
  // The live realtime backend expects PCM16 mono at 24 kHz exactly — it does
  // not validate the sample rate, so sending 16 kHz (or any other rate) is
  // silently accepted and misheard. MediaRecorder produces WebM/Opus, which
  // this pipeline can't emit; ScriptProcessorNode gives raw Int16 PCM instead.
  //
  // Streams continuously from connect to end — not gated to a "listening"
  // phase. The AI does its own turn detection (VAD) server-side and expects
  // audio_chunk frames the whole time; there is no client-side push-to-talk.
  const audioContextRef = useRef<AudioContext | null>(null);
  const micLevelFrameRef = useRef<number | null>(null);
  const audioSeqRef = useRef(0);

  useEffect(() => {
    // Deliberately NOT keyed on `phase` — phase changes constantly through a
    // normal interview (ai-talking/listening/processing cycling every turn),
    // and re-running this effect tears down + rebuilds the whole getUserMedia
    // + AudioContext pipeline every time. That was the actual bug behind
    // "Too many events. Slow down." (restart bursts tripped the server's
    // 60 frames/s cap), missing live transcripts (audio to STT kept getting
    // cut mid-stream), and the AI moving on without waiting (its own VAD saw
    // discontinuous audio, not silence-that-means-still-thinking). The
    // pipeline is built once on connect and torn down once on disconnect;
    // phaseRef below just stops it from sending once the interview is done.
    if (!wsConnected) {
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

        // Do NOT pass { sampleRate: 16000 } — browsers silently ignore it and stay at
        // hardware rate (48 kHz on most devices). Capture at native rate and downsample.
        const ctx = new AudioContextCtor();
        audioContextRef.current = ctx;
        ctx.resume().catch(() => {});

        const NATIVE_RATE = ctx.sampleRate;   // actual rate: 48000, 44100, etc.
        const TARGET_RATE = 24000;
        const RATIO = NATIVE_RATE / TARGET_RATE; // 2.0 for 48 kHz, 1.8375 for 44.1 kHz

        console.warn('[STT DEBUG] AudioContext sampleRate:', NATIVE_RATE, '| ratio:', RATIO.toFixed(4), '| target:', TARGET_RATE);

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

        // Native buffer sized so each chunk yields ~100 ms at 24 kHz after downsampling
        // (2400 samples) — the documented sweet spot: ~10 frames/s, well under the
        // server's 60 frames/s cap. ScriptProcessorNode requires a power-of-2 buffer size.
        const nativeBufSize = Math.pow(2, Math.round(Math.log2(RATIO * 2400))) as 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
        processor = ctx.createScriptProcessor(nativeBufSize, 1, 1);
        let gateHangover = 0;
        processor.onaudioprocess = (event) => {
          const float32 = event.inputBuffer.getChannelData(0);

          // Linear-interpolation downsample: native rate → 24 kHz.
          // Handles integer ratios (48k→24k = 2×) and fractional ones (44.1k→24k = 1.8375×).
          const outLen = Math.floor(float32.length / RATIO);
          const resampled = new Float32Array(outLen);
          for (let i = 0; i < outLen; i++) {
            const pos = i * RATIO;
            const lo  = Math.floor(pos);
            const hi  = Math.min(lo + 1, float32.length - 1);
            resampled[i] = float32[lo] + (float32[hi] - float32[lo]) * (pos - lo);
          }

          // Noise gate + interviewer-speaking mute. Gated chunks are sent as
          // digital silence (a zeroed Int16Array), not dropped — see
          // MIC_GATE_* above. Speech opens the gate for a short hangover.
          let sumSquares = 0;
          for (let i = 0; i < resampled.length; i++) sumSquares += resampled[i] * resampled[i];
          const rms = resampled.length ? Math.sqrt(sumSquares / resampled.length) : 0;
          if (rms >= MIC_GATE_RMS_THRESHOLD) gateHangover = MIC_GATE_HANGOVER_CHUNKS;
          else if (gateHangover > 0) gateHangover--;

          // Mute only while interviewer audio is genuinely playing through this
          // page's own player: the context must be running (a suspended one
          // never advances currentTime, which would mute the mic forever) and
          // audio must still be scheduled ahead. Deliberately NOT keyed on
          // `phase` or avatar_state: the avatar stays "talking" until the AI
          // hears the candidate, so muting on it deadlocks — the AI hears
          // silence, times the answer out and moves to the next question.
          const player = interviewerAudioPlayerRef.current;
          const interviewerAudible =
            !!player &&
            player.context.state === "running" &&
            player.playAt > player.context.currentTime;
          const gated = interviewerAudible || gateHangover === 0;

          // Float32 → signed Int16 PCM (little-endian, as expected by backend)
          const int16 = new Int16Array(resampled.length);
          if (!gated) {
            for (let i = 0; i < resampled.length; i++) {
              int16[i] = Math.max(-32768, Math.min(32767, Math.round(resampled[i] * 32767)));
            }
          }

          // Uint8Array view of the Int16 buffer → base64 (loop avoids spread stack overflow on large buffers)
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);

          if (wsRef.current?.readyState === WebSocket.OPEN && phaseRef.current !== "completed") {
            const seq = audioSeqRef.current++;
            // Log first chunk and every 10th to confirm audio is flowing without console spam
            if (seq === 0 || seq % 10 === 0) {
              console.warn(`[STT DEBUG] audio_chunk seq=${seq} | samples=${resampled.length} | bytes=${bytes.byteLength} | nativeRate=${NATIVE_RATE}`);
            }
            // Field is "data" only — the documented protocol has no sequence field.
            wsRef.current.send(JSON.stringify({ type: "audio_chunk", data: btoa(binary) }));
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
  }, [wsConnected, micRetryKey]);

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

  // handleWsMessage is a useCallback with a stable, mostly-empty dependency
  // list (see below) — it must not read frequently-changing state directly,
  // since openWebSocket depends on it and the connect effect depends on
  // openWebSocket, so a changing identity would reopen the socket on every
  // message. Read current values through refs instead.
  const questionNumberRef = useRef(1);
  useEffect(() => { questionNumberRef.current = questionNumber; }, [questionNumber]);
  // Count of question_next frames received; after a resume it is re-seeded to
  // the question the candidate is currently on.
  const questionsAnnouncedRef = useRef(0);

  // The server tells us when the interviewer finishes (turn_complete), but that
  // can be late or missing, which left the UI on "Interviewer speaking" long
  // after the voice stopped and hid the live-transcript panel. So also switch
  // to "listening" once the interviewer's audio has actually finished playing.
  // The clock restarts on session_ready / each audio delta / each new question
  // so a gap before the next question's audio is not mistaken for the end.
  const lastInterviewerActivityRef = useRef(0);
  useEffect(() => {
    if (phase !== "ai-talking") return;
    const timer = setInterval(() => {
      const player = interviewerAudioPlayerRef.current;
      if (!player) return; // avatar audio: not observable here, rely on server events
      const stillPlaying = player.context.state === "running" && player.playAt > player.context.currentTime;
      const quietFor = Date.now() - lastInterviewerActivityRef.current;
      if (!stillPlaying && quietFor > 1500) {
        setPhase((p) => (p === "ai-talking" ? "listening" : p));
      }
    }, 300);
    return () => clearInterval(timer);
  }, [phase]);

  // Track last mic activity so the inactivity banner uses real silence,
  // not transcript updates (STT latency can exceed 30s so transcript is
  // a lagged and unreliable proxy for whether the user is speaking).
  useEffect(() => {
    if (micLevel > 8) lastMicActiveRef.current = Date.now();
  }, [micLevel]);

  useEffect(() => {
    if (phase !== "listening") {
      setShowInactivityBanner(false);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      return;
    }

    setShowInactivityBanner(false);
    lastMicActiveRef.current = Date.now();

    const SILENCE_THRESHOLD_MS = 30_000;

    const schedule = () => {
      const silentFor = Date.now() - lastMicActiveRef.current;
      const remaining = SILENCE_THRESHOLD_MS - silentFor;
      if (remaining <= 0) {
        setShowInactivityBanner(true);
      } else {
        inactivityRef.current = setTimeout(schedule, remaining);
      }
    };

    inactivityRef.current = setTimeout(schedule, SILENCE_THRESHOLD_MS);

    return () => { if (inactivityRef.current) clearTimeout(inactivityRef.current); };
  }, [phase]);

  const showScoreToast = useCallback((questionNum: number, score: number) => {
    if (scoreToastTimerRef.current) clearTimeout(scoreToastTimerRef.current);
    setScoreToast({ questionNumber: questionNum, score });
    scoreToastTimerRef.current = setTimeout(() => setScoreToast(null), 4000);
  }, []);

  // Stable ref so onclose/session_paused can call doReconnect without stale closures.
  // The real implementation is assigned after doReconnect is defined below.
  const doReconnectRef = useRef<() => void>(() => {});

  // Tracks whether session_ready was ever received — used to distinguish
  // an initial-connection failure (ticket expired) from a mid-session drop.
  const sessionReadyRef = useRef(false);

  // Stable router ref so the onclose callback never captures a stale router.
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Survives React StrictMode double-mount: stores the authenticated WS URL so
  // the second mount uses the ticket even after sessionStorage was cleared.
  const initialWsUrlRef = useRef<string | null>(null);

  const handleWsMessage = useCallback((msg: WsServerMessage) => {
    switch (msg.type) {
      // Not sent by this backend release (no live-interview coding round
      // exists yet) — kept only so the coding-round UI stays intact.
      case "coding_round_start":
        setCodingRound({
          problemSlug: msg.problem_slug,
          problemTitle: msg.problem_title,
          timeLimitS: msg.time_limit_s,
        });
        setShowCodingTransition(true);
        return;
      case "session_ready":
        sessionReadyRef.current = true;
        setServerError(null);
        setWsConnected(true);
        setVisibleQuestionText("");
        lastInterviewerActivityRef.current = Date.now();
        setPhase("ai-talking");
        break;
      case "session_resumed": {
        // Reset reconnect tracking for future disconnects
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        // Establish dedup baseline so replayed events are ignored
        lastEventIdRef.current = msg.resumed_from_event_id ?? 0;

        setQuestionNumber(msg.questions_asked + 1);
        questionsAnnouncedRef.current = msg.questions_asked + 1;
        // Restore the current question text (not just the number)
        if (msg.current_question) {
          setCurrentQuestion({ number: msg.questions_asked + 1, text: msg.current_question });
          setVisibleQuestionText(msg.current_question);
        }
        setServerError(null);
        setWsConnected(true);
        setShowReconnectModal(false);
        // If the candidate was mid-answer when the connection dropped, the AI
        // is waiting on them — resume straight into listening.
        setPhase(msg.pending_answer ? "listening" : "ai-talking");
        break;
      }
      case "interviewer_audio_delta": {
        lastInterviewerActivityRef.current = Date.now();
        setPhase("ai-talking");
        // The server always sends these whether or not the avatar is up, so
        // it can switch instantly if the avatar drops. While the avatar's
        // LiveKit audio track is live, it IS this same voice — playing both
        // would double it, slightly out of step. See interview-avatar.txt §5.
        if (avatarAudioLiveRef.current) break;
        if (!interviewerAudioPlayerRef.current) {
          interviewerAudioPlayerRef.current = createInterviewerAudioPlayer();
          if (interviewerAudioPlayerRef.current) {
            interviewerAudioPlayerRef.current.gainNode.gain.value = isAudioMutedRef.current ? 0 : 1;
          }
        }
        const player = interviewerAudioPlayerRef.current;
        if (!player) break;
        scheduleInterviewerAudioDelta(player, msg.audio_base64);
        break;
      }
      case "interviewer_transcript_delta":
        setServerError(null);
        setVisibleQuestionText((prev) => prev + msg.text);
        break;
      case "interviewer_transcript_final":
        setServerError(null);
        setVisibleQuestionText(msg.text);
        setCurrentQuestion((q) => (q ? { ...q, text: msg.text } : { number: questionNumberRef.current, text: msg.text }));
        break;
      case "interviewer_generation_complete":
      case "turn_complete":
        setPhase("listening");
        break;
      case "interviewer_interrupted": {
        const player = interviewerAudioPlayerRef.current;
        if (player) stopInterviewerAudio(player);
        break;
      }
      case "question_next": {
        const text = msg.question_text ?? msg.text ?? msg.question?.question_text ?? "";
        setServerError(null);
        // The backend announces every question, including the first, via
        // question_next — so the Nth frame is question N. Incrementing from the
        // initial value of 1 would show the opening question as "2".
        const announced = ++questionsAnnouncedRef.current;
        setQuestionNumber(announced);
        setCurrentQuestion({ number: announced, text });
        setTranscript("");
        clearPartialTranscript();
        setTranscriptionError(false);
        setVisibleQuestionText(text);
        lastInterviewerActivityRef.current = Date.now();
        setPhase("ai-talking");
        break;
      }
      case "candidate_turn_open":
        setIsCandidateSpeaking(true);
        // The candidate is speaking, so it is their turn even if the server
        // never sent turn_complete. Never overrides processing/completed.
        setPhase((p) => (p === "ai-talking" ? "listening" : p));
        break;
      case "candidate_turn_closed":
        setIsCandidateSpeaking(false);
        setPhase("processing");
        // Do NOT promote the partial to the final answer: a partial is
        // temporary UI only. It stays visible until transcript_final replaces
        // it or the stale timer drops it.
        break;
      case "transcript_partial": {
        setServerError(null);
        setTranscriptionError(false);
        // A live transcript piece means the candidate is answering (see candidate_turn_open).
        setPhase((p) => (p === "ai-talking" ? "listening" : p));
        // The backend sends only the NEW piece in each partial, so pieces of the
        // same item_id are appended. A different item_id starts a fresh caption.
        const itemId = msg.item_id ?? null;
        const startsNewItem = itemId !== null && partialItemIdRef.current !== null && itemId !== partialItemIdRef.current;
        if (itemId !== null) partialItemIdRef.current = itemId;
        setPartialTranscript((prev) => (startsNewItem ? msg.text : prev + msg.text));
        if (partialStaleTimerRef.current) clearTimeout(partialStaleTimerRef.current);
        partialStaleTimerRef.current = setTimeout(clearPartialTranscript, PARTIAL_STALE_MS);
        break;
      }
      case "transcript_final":
        setServerError(null);
        setTranscriptionError(false);
        setTranscript(msg.text);
        clearPartialTranscript();
        break;
      case "transcription_error":
        console.warn("[STT] transcription_error", msg.message ?? "");
        clearPartialTranscript();
        setTranscriptionError(true);
        break;
      // Never shown as captions.
      case "transcript_partial_ignored":
      case "transcript_late":
      case "candidate_turn_late":
        break;
      case "turn_timeout":
        setTranscript("");
        clearPartialTranscript();
        break;
      case "answer_scored": {
        const { evaluation } = msg;
        if (!evaluation.scoring_skipped && !evaluation.excluded_from_scoring) {
          showScoreToast(questionNumberRef.current, evaluation.weighted_score);
        }
        setPhase("processing");
        break;
      }
      case "session_closing":
        setIsSessionClosing(true);
        break;
      case "interview_complete":
        disconnectAvatarRoom();
        setCompletedReportId(msg.report_id);
        setPhase("completed");
        break;
      // Purely presentational — safe to ignore, but a good "I'm listening" cue.
      case "avatar_state":
        setAvatarActivity(msg.state);
        // "listening" means the AI detected the candidate speaking.
        if (msg.state === "listening") setPhase((p) => (p === "ai-talking" ? "listening" : p));
        break;
      // The avatar never returns in the same session — switch to the audio
      // deltas and show no error, per interview-avatar.txt §6.
      case "avatar_unavailable":
        avatarAudioLiveRef.current = false;
        setAvatarConnection("fallback");
        disconnectAvatarRoom();
        break;
      case "session_paused":
        setWsConnected(false);
        setShowReconnectModal(true);
        // Capture token so the reconnect path skips the HTTP /state round-trip
        if (msg.reconnect_token) reconnectTokenRef.current = msg.reconnect_token;
        // Auto-reconnect immediately — the server is about to close the WS;
        // we want to fire before onclose so the timer is already set when it arrives.
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          doReconnectRef.current();
        }, 500);
        break;
      case "heartbeat":
        break;
      case "error":
        setServerError(msg.message || "The interview service reported an issue. You can retry or end for a partial report.");
        break;
      default:
        break;
    }
  }, [showScoreToast, disconnectAvatarRoom, clearPartialTranscript]);

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
        const raw = JSON.parse(event.data) as WsServerMessage & { event_id?: number; total_questions?: number };
        // Skip replayed frames sent by the server after reconnect (dedup by event_id)
        if (raw.event_id !== undefined) {
          if (raw.event_id <= lastEventIdRef.current) return;
          lastEventIdRef.current = raw.event_id;
        }
        // Not documented on session_ready/session_resumed anymore, but read it
        // defensively if the backend still sends it — the question-progress
        // bar just shows no "of N" when it's absent.
        if (typeof raw.total_questions === "number") setTotalQuestions(raw.total_questions);
        handleWsMessage(raw);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = (event) => {
      setWsConnected(false);

      // Clean close — interview ended normally; do not reconnect
      if (event.code === 1000 || event.code === 1001) return;

      // AI_SESSION_UNAVAILABLE: the AI provider itself was unreachable when
      // the server tried to connect. Doc's own remedy is unconditional —
      // "retry with a new session" — reconnecting THIS session would just
      // fail the same way again, so go straight back to set up a fresh one.
      if (event.code === 1011) {
        routerRef.current.replace('/mock-interview/live');
        return;
      }

      // Terminal server codes — the token/session is gone; reconnecting would fail.
      // If session_ready was never received this is an initial-connection failure
      // (e.g. ticket expired during StrictMode remount or slow navigation): redirect
      // back to the setup page so the user can get a fresh ticket.
      const TERMINAL_CODES = [4001, 4002, 4003];
      if (TERMINAL_CODES.includes(event.code)) {
        if (!sessionReadyRef.current) {
          routerRef.current.replace('/mock-interview/live');
          return;
        }
        setShowReconnectModal(true);
        reconnectAttemptRef.current = MAX_RECONNECT + 1; // force "Connection Failed" state in modal
        setReconnectAttempt(MAX_RECONNECT + 1);
        return;
      }

      // Abnormal drop — auto-reconnect unless session_paused already scheduled it
      setShowReconnectModal(true);
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          doReconnectRef.current();
        }, 1500); // brief delay to let the network stabilise
      }
    };

    ws.onerror = () => {
      // onerror is always followed by onclose; rely on onclose to drive reconnect
      setWsConnected(false);
    };
  }, [handleWsMessage]);

  // On mount: read session data from sessionStorage and open WebSocket.
  // initialWsUrlRef survives StrictMode double-mount: the first mount reads and
  // removes sessionStorage, saves the ticket URL to the ref, then opens the WS.
  // The second mount (StrictMode remount) skips sessionStorage and reuses the ref.
  useEffect(() => {
    if (!sessionId) return;

    if (!initialWsUrlRef.current) {
      try {
        const raw = sessionStorage.getItem("live_session_data");
        if (raw) {
          const data = JSON.parse(raw) as LiveCreateResponse;
          if (data.session_id === sessionId) {
            sessionStorage.removeItem("live_session_data");
            const wsUrl = data.ticket_id && !data.ws_url.includes('ticket=')
              ? `${data.ws_url}${data.ws_url.includes('?') ? '&' : '?'}ticket=${data.ticket_id}`
              : data.ws_url;
            initialWsUrlRef.current = wsUrl;
          }
        }
      } catch { /* ignore parse error */ }
    }

    const wsUrl = initialWsUrlRef.current ?? `/api/v1/mock-interview/live/${sessionId}`;
    openWebSocket(wsUrl);
  }, [sessionId, openWebSocket]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleEndInterview = useCallback(() => {
    setShowEndModal(false);
    wsSend({ type: "end_interview" });
    router.push("/mock-interview/history");
  }, [wsSend, router]);

  const doReconnect = useCallback(async () => {
    if (!sessionId) return;

    reconnectAttemptRef.current += 1;
    const attempt = reconnectAttemptRef.current;
    setReconnectAttempt(attempt);

    if (attempt > MAX_RECONNECT) return; // all attempts exhausted — modal shows "Connection Failed"

    try {
      // Prefer the token captured from session_paused (avoids an HTTP round-trip inside the narrow reconnect window)
      let token = reconnectTokenRef.current;
      reconnectTokenRef.current = null; // consume it

      if (!token) {
        const state = await getLiveSessionState(sessionId);
        if (!state.can_reconnect || !state.reconnect_token) {
          // Session expired or ended — abandon to partial report
          router.push(`/mock-interview/report/${sessionId}`);
          return;
        }
        token = state.reconnect_token;
      }

      const wsPath = `/api/v1/mock-interview/live/${sessionId}?ticket=${token}`;
      openWebSocket(wsPath);
      // Modal stays open until session_resumed confirms success
    } catch {
      // getLiveSessionState threw (network still down) or openWebSocket failed.
      // No new WS was created, so no onclose will fire — schedule the next attempt manually.
      if (attempt <= MAX_RECONNECT) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          doReconnectRef.current();
        }, 2000);
      }
    }
  }, [sessionId, openWebSocket, router]);

  // Keep doReconnectRef current so onclose/setTimeout callbacks never hold stale closures
  useEffect(() => { doReconnectRef.current = doReconnect; }, [doReconnect]);

  // Manual retry button in ReconnectModal
  const handleReconnect = useCallback(() => {
    doReconnect();
  }, [doReconnect]);

  const isQuestionBeingSpoken = phase === "ai-talking";
  const questionTextForDisplay = currentQuestion
    ? isQuestionBeingSpoken
      ? visibleQuestionText
      : currentQuestion.text
    : "Your interviewer is preparing the first question.";

  const handleCodingSubmitted = useCallback((result: SubmitSolutionResponse) => {
    wsSend({
      type: "coding_answer",
      submission_id: result.submission_id,
      score: result.score,
      problem_slug: result.problem_slug,
    });
    setPhase("processing");
    setCodingRound(null);
  }, [wsSend]);

  const handleCodingTimeExpired = useCallback(() => {
    wsSend({
      type: "coding_answer",
      submission_id: null,
      score: null,
      problem_slug: codingRound?.problemSlug ?? "",
    });
    setPhase("processing");
    setCodingRound(null);
  }, [wsSend, codingRound]);

  if (phase === "completed") {
    return <CompletedScreen sessionId={sessionId} reportId={completedReportId} />;
  }

  return (
    <>
      {showEndModal && (
        <EndEarlyModal
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

      {showCodingTransition && codingRound && (
        <CodingTransition
          problemTitle={codingRound.problemTitle}
          timeLimitMin={Math.ceil(codingRound.timeLimitS / 60)}
          onDone={() => {
            setShowCodingTransition(false);
            setPhase("coding");
          }}
        />
      )}

      <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#f6f8fb]">

        {/* Score toast */}
        {showFullscreenWarning && (
          <div className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.30)]">
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
          <div className="fixed right-4 top-4 z-40 flex items-center gap-2.5 rounded-lg border border-[#2557a7]/20 bg-white px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
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
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-5 py-3 text-white shadow-sm">
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-[#2557a7]/15 bg-[#2557a7]/5 px-2.5 py-1 text-xs font-semibold text-[#2557a7]">
                <Wifi size={12} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-400">
                <WifiOff size={12} /> Disconnected
              </span>
            )}
            <span className="text-xs text-white/55">Session: {sessionId.slice(-8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-white/55">
              <Clock size={11} />
              {sessionType} Interview
            </span>
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white/70 transition-colors hover:bg-white/15"
                aria-label="Enter full screen"
              >
                <Maximize2 size={13} />
              </button>
            )}
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75 transition-colors hover:bg-white/15"
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
            <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="mx-auto flex max-w-3xl items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
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
              Are you still there? Keep speaking — the interview will continue automatically.
            </p>
            <button onClick={() => setShowInactivityBanner(false)} className="text-[#2557a7] hover:text-[#1e4a8f]">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Coding phase — full-height editor */}
        {phase === "coding" && codingRound && (
          <div className="flex-1 overflow-hidden">
            <CodingStep
              problemSlug={codingRound.problemSlug}
              timeLimitS={codingRound.timeLimitS}
              onSubmitted={handleCodingSubmitted}
              onTimeExpired={handleCodingTimeExpired}
            />
          </div>
        )}

        {/* Main content — verbal interview phases */}
        {phase !== "coding" && (
        <div className="min-h-0 flex-1 overflow-hidden bg-gray-100 px-4 py-4">
          <div className="mx-auto flex h-full w-full max-w-[1680px] flex-col gap-3">
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)_280px] lg:overflow-hidden">
              {/* Interviewer */}
              <section
                className="relative min-h-[280px] overflow-hidden rounded-lg border border-gray-200 bg-gray-950 shadow-[0_16px_48px_rgba(15,23,42,0.10)] lg:min-h-0"
              >
                {/* Live avatar (interview-avatar.txt). Element stays mounted the
                    whole time so LiveKit has a target to attach the track to
                    before it arrives; only shown once video is actually live.
                    Plain inset-0 cover — not the static photo's crop frame
                    below, which is calibrated to that PNG's exact pixels. */}
                <video
                  ref={avatarVideoElRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 h-full w-full object-cover ${
                    avatarConnection === "live" || avatarConnection === "audio-blocked" ? "block" : "hidden"
                  }`}
                />

                {/* Fallback shown when there's no avatar at all, or while it's
                    connecting / down. */}
                {avatarConnection !== "live" && avatarConnection !== "audio-blocked" && (
                  <div className="absolute inset-0 bg-gray-900">
                    <Image
                      src={interviewer.src}
                      alt={`${interviewer.name}, AI interviewer`}
                      fill
                      priority
                      sizes="(min-width: 1024px) 48vw, 100vw"
                      className="object-cover object-top"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-black/25" aria-hidden="true" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
                  <span className={`h-2 w-2 rounded-full ${wsConnected ? "bg-emerald-400" : "bg-white/50"}`} />
                  {wsConnected ? "Live interview room" : "Connecting room"}
                </div>
                <div className="absolute right-4 top-4 rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#2557a7] shadow-sm" role="status" aria-live="polite">
                  {getInterviewerStatus(phase, isSessionClosing)}
                </div>

                {avatarConnection === "connecting" && (
                  <div className="absolute left-1/2 top-14 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md sm:flex">
                    <Loader2 size={11} className="animate-spin" />
                    Connecting avatar…
                  </div>
                )}

                {avatarConnection === "audio-blocked" && (
                  <button
                    onClick={handleEnableAvatarSound}
                    className="absolute left-1/2 top-14 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-[#2557a7] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md hover:bg-[#1e4a8f]"
                  >
                    <Volume2 size={12} />
                    Tap to enable sound
                  </button>
                )}

                {phase === "ai-talking" && (
                  <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md sm:flex">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
                    Interviewer speaking
                  </div>
                )}

                <div className="absolute bottom-4 left-4 max-w-[min(380px,calc(100%-2rem))] rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-white shadow-xl backdrop-blur-md">
                  <p className="text-lg font-bold">{interviewer.name}, AI Interviewer</p>
                  <p className="mt-0.5 text-xs font-medium text-white/75">{interviewer.role} - {sessionType} interview</p>
                </div>
              </section>

              {/* Question and transcript */}
              <section className="flex min-h-0 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="shrink-0 rounded-lg border border-gray-900 bg-gray-950 p-4 text-white">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Current question</p>
                      <p className="mt-1 text-sm font-bold text-white">Question {questionNumber}{totalQuestions ? `/${totalQuestions}` : ""}</p>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1">
                    <p className="text-base font-semibold leading-relaxed text-white">
                      {questionTextForDisplay}
                      {isQuestionBeingSpoken && visibleQuestionText !== currentQuestion?.text && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#2557a7] align-[-2px]" aria-hidden="true" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-lg border border-[#2557a7]/15 bg-[#2557a7]/5 px-3 py-2 text-center">
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

                <div className="flex min-h-[220px] flex-1 flex-col rounded-lg border border-gray-200 bg-white p-3">
                  {phase === "listening" ? (
                    <div className="flex h-full min-h-0 flex-col" role="log" aria-live="polite" aria-label="Live transcript">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Live transcript</p>
                        {!micError && (
                          <div className="flex items-center gap-2 rounded-full bg-gray-50 px-2 py-1" role="status" aria-label={`Microphone input level ${micLevel} percent`}>
                            <MicLevelMeter level={micLevel} />
                            <span className="text-[10px] font-semibold text-gray-500">{isCandidateSpeaking || micLevel > 8 ? "Hearing you" : "Waiting"}</span>
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
                        ) : transcriptionError ? (
                          <p className="text-sm text-gray-500">Transcription unavailable right now. You can keep answering.</p>
                        ) : (
                          <p className="text-sm italic text-gray-400">
                            {micLevel > 8 ? "Transcribing your speech..." : "Start speaking... transcript will appear here."}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : phase === "processing" && (transcript || partialTranscript) ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your answer</p>
                      <p className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-700">{transcript || partialTranscript}</p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[160px] items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm text-gray-500">
                      Transcript appears here when it is your turn to answer.
                    </div>
                  )}
                </div>
              </section>

              {/* Interviewee */}
              <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-950 p-2">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900 lg:aspect-[4/3]">
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
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${micError ? "border-gray-200 bg-gray-100 text-gray-400" : "border-[#2557a7]/30 bg-white text-[#2557a7]"}`}>
                      <Mic size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Mic locked</p>
                      <p className="text-[10px] text-gray-400">Recording integrity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cameraError ? "border-gray-200 bg-gray-100 text-gray-400" : "border-[#2557a7]/30 bg-white text-[#2557a7]"}`}>
                      <Video size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Cam locked</p>
                      <p className="text-[10px] text-gray-400">Interview mode</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAudioMuted((m) => !m)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100"
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

            <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-lg border border-gray-200 bg-white px-4 pb-2 shadow-sm">
                <InterviewTimeline phase={phase} />
              </div>

              <div className="rounded-lg border border-[#2557a7]/20 bg-white p-3 shadow-sm">
                {phase === "listening" ? (
                  <div className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#2557a7]/5 px-4 text-center text-sm font-semibold text-[#2557a7]">
                    <span className={`h-2 w-2 rounded-full bg-[#2557a7] ${isCandidateSpeaking ? "animate-pulse" : "opacity-40"}`} aria-hidden="true" />
                    {isCandidateSpeaking ? "Hearing you — keep going" : "Your turn — start speaking"}
                  </div>
                ) : (
                  <div className="flex min-h-14 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm font-semibold text-gray-500">
                    {getInterviewerStatus(phase, isSessionClosing)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
