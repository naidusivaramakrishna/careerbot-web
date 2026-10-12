"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  buildWsUrl,
  evaluateLiveSessionVideo,
  WsServerMessage,
  WsClientMessage,
  LiveCreateResponse,
  SimliAvatarSession,
} from "@/api/mockInterviewApi";
// Type-only — the actual simli-client module (a full WebRTC SDK) is loaded
// dynamically inside joinAvatar() below, only when an avatar session exists.
// avatar: null is the common case (feature off by default per environment),
// so this keeps that SDK out of the bundle everyone pays for by default.
import type { SimliClient } from "simli-client";
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

function EndEarlyModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return <div className="mi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-modal-title"><div className="mi-modal mi-modal-small"><button className="mi-modal-close" aria-label="Close end interview confirmation" onClick={onCancel}><X size={20} /></button><span className="mi-icon-tile"><PhoneOff size={25} /></span><h2 id="end-modal-title">End Interview Early?</h2><p>Ending early will generate a partial report. Your scores for completed questions will still be saved.</p><div className="mi-modal-actions"><button className="mi-button" onClick={onCancel}>Continue Interview</button><button className="mi-button mi-button-secondary" onClick={onConfirm}>End</button></div></div></div>;
}

// ─── Completed screen ─────────────────────────────────────────────────────────

function CompletedScreen({ sessionId, reportId }: { sessionId: string; reportId?: string | null }) {
  const router = useRouter();
  return <main className="mi-session-state"><section className="mi-panel mi-state-card"><span className="mi-icon-tile"><CheckCircle2 size={30} /></span><p className="mi-eyebrow">ONE CONVERSATION. ONE STEP FORWARD.</p><h2>Interview Complete!</h2><p>Great effort. Your completed answers are saved and the report is being prepared. Take a moment to reflect, then see what to carry into your next attempt.</p><div className="mi-state-checks"><span><CheckCircle2 size={16} />Answers saved</span><span><CheckCircle2 size={16} />Transcript reviewed</span><span>{reportId ? <CheckCircle2 size={16} /> : <Loader2 size={16} className="animate-spin" />}{reportId ? "Report ready" : "Report being prepared"}</span></div><div className="mi-actions"><button className="mi-button" onClick={() => router.push(`/mock-interview/report/${reportId || sessionId}`)}>View Report <ChevronRight size={17} /></button><button className="mi-button mi-button-secondary" onClick={() => router.push("/mock-interview/history")}>View History</button></div></section></main>;
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

// mock-interview-simli-avatar.txt §5: Simli has no ready-made resampler and
// expects a different rate (currently 16 kHz) than interviewer_audio_delta's
// fixed 24 kHz. Linear interpolation is what the doc calls for — good enough
// for speech, and avoids the aliasing a naive decimation would produce.
// Operates directly on Int16 PCM since the delta arrives that way already
// (see decodeBase64 / scheduleInterviewerAudioDelta above).
function resamplePcm16(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
  const output = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, input.length - 1);
    output[i] = input[lo] + (input[hi] - input[lo]) * (pos - lo);
  }
  return output;
}

// mock-interview-simli-avatar.txt §3: audio_input_format is currently always
// "pcm16;rate=16000" — parse the rate rather than hardcoding it, since a
// future Simli account/config could change it.
function parseSimliTargetRate(audioInputFormat: string): number {
  const match = /rate=(\d+)/.exec(audioInputFormat);
  return match ? parseInt(match[1], 10) : 16000;
}

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
  const { consumePendingAvatarSession } = useMockInterview();
  const interviewer = useMemo<MockInterviewer>(() => MOCK_INTERVIEWERS[readStoredInterviewerIndex(sessionId) ?? pickInterviewerIndex(sessionId)], [sessionId]);

  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const phaseRef = useRef<InterviewPhase>("connecting");
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const [sessionType, setSessionType] = useState("Live");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [visibleQuestionText, setVisibleQuestionText] = useState("");
  // question_next sets the full question text eagerly (a fallback for
  // sessions without transcript-delta streaming). If
  // interviewer_transcript_delta then re-streams the same question from
  // scratch, appending onto that eager full text produces "old text + new
  // fragment" until transcript_final replaces it. This flag makes the first
  // delta after a fresh question REPLACE instead of append, so streaming
  // starts clean while sessions with no deltas at all keep the eager text.
  const questionTextStreamStartedRef = useRef(false);
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

  // ─── answer_capture_complete fallback ────────────────────────────────────
  // The AI's own silence finalizer (currently 3s, server-configured) is the
  // primary signal for "the full answer is done." This timer is only a safety
  // net against a dropped WS message or a stalled finalizer — it must stay
  // comfortably above the server's own window or it will fire while the
  // candidate is still legitimately mid-answer across a pause.
  const ANSWER_CAPTURE_FALLBACK_MS = 6000;
  const answerCaptureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAnswerCaptureFallback, setIsAnswerCaptureFallbackState] = useState(false);
  // Mirrored into a ref so handleWsMessage (a stable useCallback) can read the
  // current value without it being a dependency — same pattern as
  // avatarAudioLiveRef / isAudioMutedRef elsewhere in this file.
  const isAnswerCaptureFallbackRef = useRef(false);
  const setIsAnswerCaptureFallback = useCallback((value: boolean) => {
    isAnswerCaptureFallbackRef.current = value;
    setIsAnswerCaptureFallbackState(value);
  }, []);
  const clearAnswerCaptureTimer = useCallback(() => {
    if (answerCaptureTimerRef.current) clearTimeout(answerCaptureTimerRef.current);
    answerCaptureTimerRef.current = null;
  }, []);
  const scheduleAnswerCaptureFallback = useCallback(() => {
    clearAnswerCaptureTimer();
    answerCaptureTimerRef.current = setTimeout(() => {
      answerCaptureTimerRef.current = null;
      // Defensive root-cause guard: only force "processing" if we're still
      // genuinely mid-answer. The session may have completed, paused, or
      // moved on for reasons unrelated to this specific answer while the
      // timer was ticking (interview_complete, session_paused, a fresh
      // question) — this must never override any of those states.
      if (phaseRef.current !== "listening") return;
      setIsAnswerCaptureFallback(true);
      setPhase("processing");
    }, ANSWER_CAPTURE_FALLBACK_MS);
  }, [clearAnswerCaptureTimer, setIsAnswerCaptureFallback]);
  useEffect(() => () => clearAnswerCaptureTimer(), [clearAnswerCaptureTimer]);
  const [wsConnected, setWsConnected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [micRetryKey, setMicRetryKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ─── Avatar (mock-interview-simli-avatar.txt) ───────────────────────────
  // Optional talking-face layer on top of the same interviewer_audio_delta
  // stream. avatar: null (the default) is normal — this whole subsystem then
  // stays in "fallback" and the interview behaves exactly as without it.
  // Simli is the only avatar vendor (LiveAvatar/HeyGen has been removed).
  type AvatarConnection = "connecting" | "live" | "fallback";
  const [avatarConnection, setAvatarConnection] = useState<AvatarConnection>("fallback");
  const [, setAvatarActivity] = useState<"idle" | "listening" | "talking">("idle");
  const avatarVideoElRef = useRef<HTMLVideoElement | null>(null);

  // Simli has no server-side audio bridge — the browser feeds the
  // interviewer's audio into it directly so it can render a lip-synced
  // audio+video stream. Same "one audio rule" the HeyGen/LiveAvatar
  // integration used: once the avatar's own rendered audio is live, it is
  // the single audible source and playDelta is skipped; before that (or if
  // via ref, not avatarConnection state, to stay dependency-free (same
  // reasoning as isAudioMutedRef elsewhere in this file).
  const simliAudioLiveRef = useRef(false);
  const simliClientRef = useRef<SimliClient | null>(null);
  const simliAudioElRef = useRef<HTMLAudioElement | null>(null);
  const simliTargetRateRef = useRef(16000);
  const consumedAvatarRef = useRef<{ done: boolean; avatar: SimliAvatarSession | null }>({ done: false, avatar: null });

  // There is no backend stop endpoint for Simli (mock-interview-simli-avatar.txt
  // §9) — the browser closing the connection is the only thing that ends it.
  const disconnectAvatar = useCallback(() => {
    simliClientRef.current?.stop().catch(() => {});
    simliClientRef.current = null;
    simliAudioLiveRef.current = false;
  }, []);

  const joinAvatar = useCallback(async (avatar: SimliAvatarSession) => {
    setAvatarConnection("connecting");
    simliTargetRateRef.current = parseSimliTargetRate(avatar.audio_input_format);

    let SimliClientCtor: typeof import("simli-client").SimliClient;
    let LogLevel: typeof import("simli-client").LogLevel;
    try {
      ({ SimliClient: SimliClientCtor, LogLevel } = await import("simli-client"));
    } catch {
      // Chunk failed to load (offline, blocked, etc.) — same silent fallback
      // as any other avatar-unavailable path.
      setAvatarConnection("fallback");
      return;
    }

    const videoEl = avatarVideoElRef.current;
    const audioEl = simliAudioElRef.current;
    if (!videoEl || !audioEl) {
      setAvatarConnection("fallback");
      return;
    }

    // Muted by default until "start" fires — before that, playDelta is the
    // audible source and Simli's own rendered audio must stay silent.
    audioEl.muted = true;

    const client = new SimliClientCtor(avatar.session_token, videoEl, audioEl, null, LogLevel.ERROR, "livekit");
    simliClientRef.current = client;
    client.on("start", () => {
      setAvatarConnection((s) => (s === "connecting" ? "live" : s));
      // Simli's rendered output becomes the single audible source — unmute
      // it (respecting the candidate's own mute toggle) and stop feeding
      // playDelta from here on (same "one audio rule" as HeyGen/LiveAvatar).
      simliAudioLiveRef.current = true;
      audioEl.muted = isAudioMutedRef.current;
    });
    client.on("speaking", () => setAvatarActivity("talking"));
    client.on("silent", () => setAvatarActivity("idle"));
    client.on("error", (detail) => {
      console.warn("Simli avatar error, continuing audio-only", detail);
      // No reconnect path for Simli (mock-interview-simli-avatar.txt §6/§9) —
      // treat it as gone for the rest of this session. Fall back to playDelta
      // and make sure Simli's own output can't still be heard.
      simliAudioLiveRef.current = false;
      audioEl.muted = true;
      simliClientRef.current = null;
      setAvatarConnection("fallback");
    });

    try {
      await client.start();
    } catch (err) {
      console.warn("Simli avatar failed to connect, continuing audio-only", err);
      simliAudioLiveRef.current = false;
      simliClientRef.current = null;
    }
  }, []);

  // Consume the avatar session handed off from the "starting" page, once.
  // Separately guards joinAvatar() itself (not just the consume-from-context
  // step above) — without this, StrictMode's double-invoke can construct a
  // second SimliClient while the first is still mid-connect, and the
  // synthetic cleanup's disconnectAvatar() calling .stop() on a client still
  // inside room.connect() surfaces as an unhandled "Client initiated
  // disconnect" ConnectionError from inside livekit-client (which Simli's
  // transport uses internally) — not something our own try/catch around
  // client.start() is positioned to catch, since it rejects LiveKit's own
  // internal connect-future, not the promise we're awaiting.
  const avatarJoinStartedRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return;
    if (!consumedAvatarRef.current.done) {
      consumedAvatarRef.current = { done: true, avatar: consumePendingAvatarSession(sessionId) };
    }
    const avatar = consumedAvatarRef.current.avatar;
    if (avatar) {
      if (!avatarJoinStartedRef.current) {
        avatarJoinStartedRef.current = true;
        joinAvatar(avatar);
      }
    } else {
      setAvatarConnection("fallback");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Disconnect on unmount (leaving the page) — interview_complete disconnects
  // it explicitly from handleWsMessage.
  useEffect(() => () => disconnectAvatar(), [disconnectAvatar]);

  useEffect(() => { isAudioMutedRef.current = isAudioMuted; }, [isAudioMuted]);

  // Toggling mute adjusts the persistent player's gain directly — no need to
  // tear down or re-decode anything already scheduled.
  useEffect(() => {
    if (interviewerAudioPlayerRef.current) {
      interviewerAudioPlayerRef.current.gainNode.gain.value = isAudioMuted ? 0 : 1;
    }
  }, [isAudioMuted]);

  // Mirror the same toggle onto Simli's own audio element once it's the
  // active audible source — avatarConnection === "live" is set at the exact
  // same moment simliAudioLiveRef flips (the "start" event in joinAvatar).
  // While not live, leave the element's muted state alone — joinAvatar/error
  // already manage it directly for that case.
  useEffect(() => {
    if (avatarConnection === "live" && simliAudioElRef.current) {
      simliAudioElRef.current.muted = isAudioMuted;
    }
  }, [isAudioMuted, avatarConnection]);

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
        questionTextStreamStartedRef.current = false;
        lastInterviewerActivityRef.current = Date.now();
        setPhase("ai-talking");
        break;
      case "interviewer_audio_delta": {
        lastInterviewerActivityRef.current = Date.now();
        setPhase("ai-talking");
        // The server always sends these whether or not the avatar is up, so
        // it can switch instantly if the avatar drops. Once Simli's own
        // rendered audio is live, it IS this same voice — playing both would
        // double it, slightly out of step (same "one audio rule" as the old
        // HeyGen/LiveAvatar integration, just with Simli in its place).
        if (!simliAudioLiveRef.current) {
          if (!interviewerAudioPlayerRef.current) {
            interviewerAudioPlayerRef.current = createInterviewerAudioPlayer();
            if (interviewerAudioPlayerRef.current) {
              interviewerAudioPlayerRef.current.gainNode.gain.value = isAudioMutedRef.current ? 0 : 1;
            }
          }
          const player = interviewerAudioPlayerRef.current;
          if (player) scheduleInterviewerAudioDelta(player, msg.audio_base64);
        }

        // Simli has no server-side audio bridge (mock-interview-simli-avatar.txt
        // §2/§5) — forward the same delta into it regardless, so it can
        // render the lip-synced audio+video it needs to produce once live.
        if (simliClientRef.current) {
          const pcm24k = decodeBase64(msg.audio_base64);
          const samples = new Int16Array(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength >> 1);
          const pcm16k = resamplePcm16(samples, INTERVIEWER_AUDIO_SAMPLE_RATE, simliTargetRateRef.current);
          simliClientRef.current.sendAudioData(new Uint8Array(pcm16k.buffer));
        }
        break;
      }
      case "interviewer_transcript_delta":
        setServerError(null);
        // The first delta for a question REPLACES whatever question_next
        // eagerly pre-filled (its full text was only a fallback for sessions
        // without delta streaming) — appending onto it here would show
        // "old text" + "new fragment" concatenated together.
        // Subsequent deltas for the same question append normally.
        if (!questionTextStreamStartedRef.current) {
          questionTextStreamStartedRef.current = true;
          setVisibleQuestionText(msg.text);
        } else {
          setVisibleQuestionText((prev) => prev + msg.text);
        }
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
        // text is a fallback for sessions without delta streaming — if
        // interviewer_transcript_delta re-streams this same question from
        // scratch, its first chunk must replace this, not append to it.
        questionTextStreamStartedRef.current = false;
        lastInterviewerActivityRef.current = Date.now();
        clearAnswerCaptureTimer();
        setIsAnswerCaptureFallback(false);
        setPhase("ai-talking");
        break;
      }
      case "candidate_turn_open":
        setIsCandidateSpeaking(true);
        // The candidate is speaking, so it is their turn even if the server
        // never sent turn_complete. Safe to pull back from "ai-talking" always;
        // only pull back from "processing" when that state was forced by OUR
        // fallback timer (isAnswerCaptureFallbackRef) — a legitimate
        // answer_capture_complete must never be undone by a stray/late event.
        setPhase((p) => (p === "ai-talking" || (p === "processing" && isAnswerCaptureFallbackRef.current) ? "listening" : p));
        if (isAnswerCaptureFallbackRef.current) setIsAnswerCaptureFallback(false);
        // The candidate is demonstrably still active — postpone the fallback
        // deadline exactly like transcript_final/candidate_turn_closed do.
        scheduleAnswerCaptureFallback();
        break;
      case "candidate_turn_closed":
        setIsCandidateSpeaking(false);
        // This is only a per-item VAD boundary, not "answer ready for review" —
        // the candidate may resume speaking (another item) before the AI's
        // silence finalizer decides the full answer is done. Do NOT change
        // phase here; wait for answer_capture_complete (or the fallback below).
        // Do NOT promote the partial to the final answer: a partial is
        // temporary UI only. It stays visible until transcript_final replaces
        // it or the stale timer drops it.
        scheduleAnswerCaptureFallback();
        break;
      case "transcript_partial": {
        setServerError(null);
        setTranscriptionError(false);
        // A live transcript piece means the candidate is answering (see candidate_turn_open).
        // Same fallback-only recovery rule as candidate_turn_open above.
        setPhase((p) => (p === "ai-talking" || (p === "processing" && isAnswerCaptureFallbackRef.current) ? "listening" : p));
        if (isAnswerCaptureFallbackRef.current) setIsAnswerCaptureFallback(false);
        // Still-arriving partials prove the candidate hasn't gone silent —
        // postpone the fallback deadline the same way finals/turn-closed do.
        scheduleAnswerCaptureFallback();
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
        // transcript_final is final for ONE committed VAD item only — a full
        // answer can span several items if the candidate pauses mid-thought.
        // Append, don't replace, or an earlier item's text is lost the moment
        // the candidate speaks again after a pause.
        setTranscript((prev) => (prev ? `${prev} ${msg.text}` : msg.text));
        clearPartialTranscript();
        // Each accepted final segment restarts the AI's own silence window —
        // mirror that on the fallback timer so it doesn't fire mid-answer.
        scheduleAnswerCaptureFallback();
        break;
      case "answer_capture_complete":
        clearAnswerCaptureTimer();
        setIsAnswerCaptureFallback(false);
        // Server's concatenation is authoritative — overrides local accumulation,
        // which is only ever a best-effort live-display reconstruction.
        if (msg.final_text) setTranscript(msg.final_text);
        clearPartialTranscript();
        setPhase("processing");
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
        clearAnswerCaptureTimer();
        setIsAnswerCaptureFallback(false);
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
        disconnectAvatar();
        // The session can end mid-answer (early ending, no answer_capture_complete
        // in between) with a fallback timer still ticking — clear it so it can't
        // fire later and overwrite the completed screen with "processing".
        clearAnswerCaptureTimer();
        setCompletedReportId(msg.report_id);
        setPhase("completed");
        break;
      // Informational only now — reconnect is removed
      // (live-interview-reconnect-and-simli-avatar.txt). interview_complete
      // always follows within the same message burst, then the socket
      // closes for good; just stop a fallback timer that can no longer matter.
      case "session_paused":
        clearAnswerCaptureTimer();
        break;
      case "heartbeat":
        break;
      case "error":
        setServerError(msg.message || "The interview service reported an issue. You can retry or end for a partial report.");
        break;
      default:
        break;
    }
  }, [showScoreToast, disconnectAvatar, clearPartialTranscript, clearAnswerCaptureTimer, scheduleAnswerCaptureFallback, setIsAnswerCaptureFallback]);

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
        // Defensive dedup in case the server ever redelivers a frame (event_id
        // is monotonic) — not reconnect-specific, just general WS hygiene.
        if (raw.event_id !== undefined) {
          if (raw.event_id <= lastEventIdRef.current) return;
          lastEventIdRef.current = raw.event_id;
        }
        // Not documented on session_ready anymore, but read it defensively if
        // the backend still sends it — the question-progress bar just shows
        // no "of N" when it's absent.
        if (typeof raw.total_questions === "number") setTotalQuestions(raw.total_questions);
        handleWsMessage(raw);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = (event) => {
      setWsConnected(false);

      // Clean close — interview ended normally; nothing more to do.
      if (event.code === 1000 || event.code === 1001) return;

      // AI_SESSION_UNAVAILABLE: the AI provider itself was unreachable when
      // the server tried to connect — no interview ever started, nothing to
      // report. Go straight back to set up a fresh one.
      if (event.code === 1011) {
        routerRef.current.replace('/mock-interview/live');
        return;
      }

      // Terminal server codes before session_ready — an initial-connection
      // failure (e.g. ticket expired during StrictMode remount or slow
      // navigation), not a mid-interview drop. Same "nothing started yet"
      // case as above: redirect to setup for a fresh ticket.
      const TERMINAL_CODES = [4001, 4002, 4003];
      if (TERMINAL_CODES.includes(event.code) && !sessionReadyRef.current) {
        routerRef.current.replace('/mock-interview/live');
        return;
      }

      // Every other disconnect during an active interview is now terminal —
      // reconnect is removed (live-interview-reconnect-and-simli-avatar.txt).
      // The backend has already ended the session and built a report from
      // whatever was captured; interview_complete should have arrived just
      // before this fires and already driven the UI to "completed". If it
      // somehow didn't (a true network failure, nothing received at all),
      // land on the same completed screen directly — CompletedScreen falls
      // back to sessionId when reportId is null.
      if (phaseRef.current !== "completed") {
        setCompletedReportId(null);
        setPhase("completed");
      }
    };

    ws.onerror = () => {
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
    {showEndModal && <EndEarlyModal onConfirm={handleEndInterview} onCancel={() => setShowEndModal(false)} />}
    {showCodingTransition && codingRound && <CodingTransition problemTitle={codingRound.problemTitle} timeLimitMin={Math.ceil(codingRound.timeLimitS / 60)} onDone={() => { setShowCodingTransition(false); setPhase("coding"); }} />}
    <main className="mi-room">
      <header className="mi-room-header"><div><p className="mi-eyebrow">YOUR LIVE CONVERSATION</p><h1>{sessionType} Interview</h1></div><div className="mi-room-header-actions"><span className="mi-pill mi-pill-neutral">{wsConnected ? <Wifi size={15} /> : <WifiOff size={15} />}{wsConnected ? "Connected" : "Disconnected"}</span>{!isFullscreen && <button className="mi-button mi-button-icon mi-button-secondary" onClick={toggleFullscreen} aria-label="Enter full screen"><Maximize2 size={18} /></button>}<button className="mi-button mi-button-secondary" onClick={() => setShowEndModal(true)}><PhoneOff size={16} />End</button></div></header>
      {showFullscreenWarning && <div className="mi-notice"><AlertCircle size={18} /><p>Fullscreen helps simulate the interview environment.</p><button className="mi-text-button" onClick={toggleFullscreen}>Enter fullscreen</button></div>}
      {serverError && <div className="mi-notice" role="alert"><AlertCircle size={18} /><p>{serverError}</p><button className="mi-text-button" aria-label="Dismiss server error" onClick={() => setServerError(null)}><X size={17} /></button></div>}
      {micError && <div className="mi-notice"><Mic size={18} /><div><strong>Microphone permission needs attention</strong><p>Allow microphone access from the browser address bar, then retry. Your completed answers remain saved.</p></div><button className="mi-button mi-button-secondary" onClick={() => setMicRetryKey(key => key + 1)}>Retry mic</button></div>}
      {cameraError && <div className="mi-notice"><VideoOff size={18} /><div><strong>Camera preview is unavailable</strong><p>You can continue if microphone works, but enabling camera creates a closer real interview simulation.</p></div></div>}
      {showInactivityBanner && <div className="mi-notice"><AlertCircle size={18} /><p>Are you still there? Keep speaking ? the interview will continue automatically.</p><button className="mi-text-button" aria-label="Dismiss inactivity notice" onClick={() => setShowInactivityBanner(false)}><X size={17} /></button></div>}
      {phase === "coding" && codingRound ? <div className="mi-coding-room"><CodingStep problemSlug={codingRound.problemSlug} timeLimitS={codingRound.timeLimitS} onSubmitted={handleCodingSubmitted} onTimeExpired={handleCodingTimeExpired} /></div> : <>
        <div className="mi-room-grid">
          <section className="mi-conversation-stage" aria-label="Interviewer and camera preview">
            <video ref={avatarVideoElRef} autoPlay playsInline muted className={avatarConnection === "live" ? "mi-avatar-video" : "hidden"} />
            <audio ref={simliAudioElRef} autoPlay muted className="hidden" />
            {avatarConnection !== "live" && <Image src={interviewer.src} alt={interviewer.name + ", AI interviewer"} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="mi-avatar-photo" />}
            <div className="mi-stage-overlay" aria-hidden="true" /><span className="mi-stage-badge"><span className="mi-status-dot" />{wsConnected ? "Live interview room" : "Connecting room"}</span>
            {avatarConnection === "connecting" && <span className="mi-avatar-connecting"><Loader2 size={14} className="animate-spin" />Connecting avatar?</span>}
            <div className="mi-stage-name"><strong>{interviewer.name}, AI Interviewer</strong><span>{interviewer.role} ? {sessionType} interview</span></div>
            <div className="mi-self-preview"><video ref={videoRef} autoPlay playsInline muted className={cameraError ? "opacity-0" : ""} />{cameraError && <div><VideoOff size={22} /><span>Camera unavailable</span></div>}<span>You</span></div>
          </section>
          <section className="mi-panel mi-conversation-panel" aria-label="Question and response">
            <div className="mi-question-heading"><span className="mi-pill">Question {questionNumber}</span><span className="mi-caption">One thought at a time</span></div>
            <div className="mi-current-question"><p className="mi-eyebrow">CURRENT QUESTION</p><h2>{questionTextForDisplay}{isQuestionBeingSpoken && visibleQuestionText !== currentQuestion?.text && <span className="mi-cursor" aria-hidden="true" />}</h2></div>
            <div className="mi-turn-status" aria-live="polite">{phase === "connecting" && <><Loader2 size={16} className="animate-spin" />Connecting to {interviewer.name}</>}{phase === "ai-talking" && <><span>{interviewer.name} is asking</span><AIWaveform /></>}{phase === "listening" && <><Mic size={16} />{interviewer.name} is listening</>}{phase === "processing" && <><Loader2 size={16} className="animate-spin" />{isAnswerCaptureFallback ? "Still finishing up" : "Reviewing answer"}</>}</div>
            <div className="mi-transcript-panel">{phase === "listening" ? <div className="mi-transcript-content" role="log" aria-live="polite" aria-label="Live transcript"><div className="mi-transcript-title"><h3>Live transcript</h3>{!micError && <span className="mi-mic-status" role="status" aria-label={"Microphone input level " + micLevel + " percent"}><MicLevelMeter level={micLevel} /><small>{isCandidateSpeaking || micLevel > 8 ? "Hearing you" : "Waiting"}</small></span>}</div><div className="mi-transcript-scroll">{micError ? <p>Microphone is unavailable. Use Retry mic above after allowing permission.</p> : partialTranscript || transcript ? <p>{partialTranscript || transcript}<span className="mi-cursor" aria-hidden="true" /></p> : transcriptionError ? <p>Transcription unavailable right now. You can keep answering.</p> : <p className="mi-transcript-placeholder">{micLevel > 8 ? "Transcribing your speech..." : "Start speaking... transcript will appear here."}</p>}</div></div> : phase === "processing" && (transcript || partialTranscript) ? <div className="mi-transcript-content"><h3>Your answer</h3><div className="mi-transcript-scroll"><p>{transcript || partialTranscript}</p></div></div> : <div className="mi-transcript-empty"><Mic size={28} /><h3>Your voice, your story.</h3><p>Transcript appears here when it is your turn to answer.</p></div>}</div>
            <InterviewTimeline phase={phase} />
          </section>
        </div>
        <footer className="mi-room-controls"><div className="mi-room-device-status"><span><Mic size={16} /><strong>Mic locked</strong><small>Recording integrity</small></span><span><Video size={16} /><strong>Cam locked</strong><small>Interview mode</small></span></div><div className="mi-room-turn">{phase === "listening" ? <><span className="mi-status-dot" />{isCandidateSpeaking ? "Hearing you ? keep going" : "Your turn ? start speaking"}</> : getInterviewerStatus(phase, isSessionClosing)}</div><button className="mi-button mi-button-secondary" onClick={() => setIsAudioMuted(value => !value)} aria-label={isAudioMuted ? "Unmute interviewer audio" : "Mute interviewer audio"}>{isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}<span>{isAudioMuted ? "Unmute" : "Speaker"}</span></button></footer>
      </>}
    </main>
  </>
);
}
