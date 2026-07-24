"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLiveSession, LiveCreateResponse } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";
import ConsentModal from "../_components/ConsentModal";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  Play,
  RefreshCw,
  Smartphone,
  Sparkles,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";

type SetupPhase = "preflight" | "pre-interview" | "connecting";
type CheckState = "idle" | "checking" | "ok" | "denied" | "error";
type AudioCheckState = "idle" | "playing" | "ok" | "error";
type NetworkState = "checking" | "ok" | "warning" | "offline";
type SessionType = "HR" | "Technical" | "Mixed" | "Technical + Coding";

interface DeviceOption {
  deviceId: string;
  label: string;
}

const QUESTION_PREVIEWS: Record<SessionType, string[]> = {
  HR: [
    "Tell me about yourself.",
    "Why are you interested in this role?",
    "Describe a challenging situation you handled.",
    "How do you handle pressure or tight deadlines?",
    "What are your strengths and areas for improvement?",
    "Do you have any questions for the interviewer?",
  ],
  Technical: [
    "Walk me through a recent technical project.",
    "How would you debug a production issue?",
    "Explain a technical decision you made and its tradeoffs.",
    "How do you design for performance and reliability?",
    "Tell me about a difficult bug you fixed.",
    "What would you improve in one of your past systems?",
  ],
  Mixed: [
    "Tell me about yourself and your recent work.",
    "Explain a project you are proud of, including technical choices.",
    "How do you communicate tradeoffs to non-technical teammates?",
    "Describe a conflict, blocker, or failure and how you handled it.",
    "How do you keep quality high under interview pressure?",
    "What questions would you ask before joining this team?",
  ],
  "Technical + Coding": [
    "Walk me through a recent technical project.",
    "How would you debug a production issue?",
    "Explain a technical decision you made and its tradeoffs.",
    "How do you design for performance and reliability?",
    "Tell me about a difficult bug you fixed.",
    "What would you improve in one of your past systems?",
  ],
};

function getNetworkSummary(): { state: NetworkState; label: string } {
  if (typeof navigator === "undefined") return { state: "checking", label: "Checking connection" };
  if (!navigator.onLine) {
    return { state: "offline", label: "Offline" };
  }

  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; rtt?: number; downlink?: number };
  }).connection;

  if (!connection) return { state: "ok", label: "Browser online" };

  const effective = connection.effectiveType ?? "unknown";
  const rtt = connection.rtt ?? 0;
  const downlink = connection.downlink ?? 0;
  const weak = effective.includes("2g") || rtt > 500 || (downlink > 0 && downlink < 1);
  return {
    state: weak ? "warning" : "ok",
    label: `${effective.toUpperCase()}${rtt ? `, ${rtt}ms` : ""}`,
  };
}

function DeviceSelect({
  label,
  value,
  devices,
  onChange,
}: {
  label: string;
  value: string;
  devices: DeviceOption[];
  onChange: (deviceId: string) => void;
}) {
  return (
    <label className="block mt-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-[#2557a7] focus:ring-2 focus:ring-[#2557a7]/15"
      >
        <option value="">System default</option>
        {devices.map((device, index) => (
          <option key={device.deviceId || `${label}-${index}`} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function PreflightScreen({ onContinue }: { onContinue: () => void }) {
  const [micState, setMicState] = useState<CheckState>("idle");
  const [camState, setCamState] = useState<CheckState>("idle");
  const [speakerState, setSpeakerState] = useState<AudioCheckState>("idle");
  const [network, setNetwork] = useState(getNetworkSummary);
  const [quietConfirmed, setQuietConfirmed] = useState(false);
  const [micDevices, setMicDevices] = useState<DeviceOption[]>([]);
  const [camDevices, setCamDevices] = useState<DeviceOption[]>([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCam, setSelectedCam] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setMicDevices(devices.filter((d) => d.kind === "audioinput").map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone ${i + 1}`,
    })));
    setCamDevices(devices.filter((d) => d.kind === "videoinput").map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${i + 1}`,
    })));
  };

  useEffect(() => {
    refreshDevices().catch(() => {});
    const syncNetwork = () => setNetwork(getNetworkSummary());
    window.addEventListener("online", syncNetwork);
    window.addEventListener("offline", syncNetwork);
    return () => {
      window.removeEventListener("online", syncNetwork);
      window.removeEventListener("offline", syncNetwork);
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  const testMicrophone = async () => {
    setMicState("checking");
    setMicLevel(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      });
      await refreshDevices();

      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        const ctx = new AudioContextCtor();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaStreamSource(stream);
        const data = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, value) => sum + value, 0) / Math.max(data.length, 1);
        setMicLevel(Math.min(Math.round(avg * 2), 100));
        await ctx.close();
      }

      stream.getTracks().forEach((track) => track.stop());
      setMicState("ok");
    } catch (err) {
      const e = err as DOMException;
      setMicState(e.name === "NotAllowedError" ? "denied" : "error");
    }
  };

  const testCamera = async () => {
    setCamState("checking");
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: false,
      });
      await refreshDevices();
      setCameraStream(stream);
      setCamState("ok");
    } catch (err) {
      const e = err as DOMException;
      setCamState(e.name === "NotAllowedError" ? "denied" : "error");
    }
  };

  const testSpeaker = async () => {
    setSpeakerState("playing");
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) throw new Error("AudioContext unsupported");
      const ctx = new AudioContextCtor();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 660;
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close().catch(() => {});
        setSpeakerState("ok");
      }, 420);
    } catch {
      setSpeakerState("error");
    }
  };

  const canContinue = micState === "ok" && camState === "ok" && speakerState === "ok" && quietConfirmed && network.state !== "offline";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-4">
          <Sparkles size={12} /> Pre-interview checks
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your interview room</h1>
        <p className="text-sm text-gray-500 mt-1">Verify devices, audio, connection, and environment before the AI interviewer joins.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${micState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
                {micState === "ok" ? <CheckCircle2 size={18} className="text-[#2557a7]" /> : <Mic size={18} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Microphone</p>
                <p className={`text-xs mt-0.5 ${micState === "ok" ? "text-[#2557a7]" : "text-gray-500"}`}>
                  {micState === "idle" && "Choose a mic and run a level check."}
                  {micState === "checking" && "Listening for input..."}
                  {micState === "ok" && "Microphone is available."}
                  {micState === "denied" && "Microphone access is blocked. Allow it in the browser and retry."}
                  {micState === "error" && "Could not access this microphone."}
                </p>
              </div>
            </div>
            <button aria-label="Test microphone" onClick={testMicrophone} disabled={micState === "checking"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#1e4a8f] disabled:opacity-50 transition-colors">
              {micState === "checking" ? <><Loader2 size={12} className="animate-spin" /> Checking</> : <><RefreshCw size={12} /> Test</>}
            </button>
          </div>
          <DeviceSelect label="Microphone" value={selectedMic} devices={micDevices} onChange={setSelectedMic} />
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden" aria-label="Microphone input level">
            <div className="h-full rounded-full bg-[#2557a7] transition-all" style={{ width: `${micLevel}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${camState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
                {camState === "ok" ? <CheckCircle2 size={18} className="text-[#2557a7]" /> : camState === "denied" || camState === "error" ? <VideoOff size={18} className="text-gray-500" /> : <Video size={18} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Camera</p>
                <p className={`text-xs mt-0.5 ${camState === "ok" ? "text-[#2557a7]" : "text-gray-500"}`}>
                  {camState === "idle" && "Choose a camera and preview it."}
                  {camState === "checking" && "Requesting camera access..."}
                  {camState === "ok" && "Camera preview is working."}
                  {camState === "denied" && "Camera access is blocked. Allow it in the browser and retry."}
                  {camState === "error" && "Could not access this camera."}
                </p>
              </div>
            </div>
            <button aria-label="Test camera" onClick={testCamera} disabled={camState === "checking"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#1e4a8f] disabled:opacity-50 transition-colors">
              {camState === "checking" ? <><Loader2 size={12} className="animate-spin" /> Checking</> : <><RefreshCw size={12} /> Test</>}
            </button>
          </div>
          <DeviceSelect label="Camera" value={selectedCam} devices={camDevices} onChange={setSelectedCam} />
          <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-gray-900">
            {cameraStream ? (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">Camera preview appears here</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${speakerState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
                {speakerState === "ok" ? <CheckCircle2 size={18} className="text-[#2557a7]" /> : <Volume2 size={18} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Speaker</p>
                <p className={`text-xs mt-0.5 ${speakerState === "ok" ? "text-[#2557a7]" : "text-gray-500"}`}>
                  {speakerState === "idle" && "Play a short tone to confirm you can hear the AI."}
                  {speakerState === "playing" && "Playing test tone..."}
                  {speakerState === "ok" && "Speaker test completed."}
                  {speakerState === "error" && "Could not play test tone. Check browser audio output."}
                </p>
              </div>
            </div>
            <button aria-label="Test speaker" onClick={testSpeaker} disabled={speakerState === "playing"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#1e4a8f] disabled:opacity-50 transition-colors">
              {speakerState === "playing" ? <><Loader2 size={12} className="animate-spin" /> Playing</> : <><Volume2 size={12} /> Test</>}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${network.state === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
              {network.state === "offline" ? <WifiOff size={18} className="text-gray-500" /> : network.state === "ok" ? <CheckCircle2 size={18} className="text-[#2557a7]" /> : <Wifi size={18} className="text-gray-500" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Connection</p>
              <p className={`text-xs mt-0.5 ${network.state === "ok" ? "text-[#2557a7]" : "text-gray-500"}`}>{network.label}</p>
              <p className="text-xs text-gray-400 mt-1">Use a stable network. The interview streams audio in real time.</p>
            </div>
          </div>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <input type="checkbox" checked={quietConfirmed} onChange={(event) => setQuietConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#2557a7]" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Quiet environment confirmed</p>
          <p className="text-xs text-gray-500 mt-0.5">I am in a quiet room, understand my voice is transcribed for scoring, and can stay on this tab until the report is generated.</p>
        </div>
      </label>

      <button onClick={onContinue} disabled={!canContinue} className="mt-6 w-full py-3.5 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
        {canContinue ? "Continue to interview setup" : "Complete mic, camera, speaker, and room checks"}
      </button>
    </div>
  );
}

function PreInterviewScreen({
  sessionType,
  isMobile,
  onStart,
  onTypeChange,
  starting,
  codingRoundEnabled,
}: {
  sessionType: SessionType;
  isMobile: boolean;
  onStart: () => void;
  onTypeChange: (t: SessionType) => void;
  starting: boolean;
  codingRoundEnabled: boolean;
}) {
  const preview = useMemo(() => QUESTION_PREVIEWS[sessionType], [sessionType]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {isMobile && (
        <div className="mb-5 flex items-start gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-xl px-4 py-3">
          <Smartphone size={15} className="text-[#2557a7] mt-0.5 shrink-0" />
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Mobile device detected.</span> For best results, use a laptop or desktop with stable internet. Mobile browsers may limit microphone and fullscreen behavior.
          </p>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-4">
          <Sparkles size={12} /> Live AI Mock Interview
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ready to start.</h1>
        <p className="text-gray-500 text-sm">The AI interviewer will speak each question. Answer naturally, then press Done Speaking.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Interview type</p>
        <div className={`grid gap-2 ${codingRoundEnabled ? "grid-cols-4" : "grid-cols-3"}`}>
          {(["HR", "Technical", "Mixed", ...(codingRoundEnabled ? ["Technical + Coding"] : [])] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange(t as SessionType)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                sessionType === t
                  ? "bg-[#2557a7] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Likely question themes ({preview.length})</p>
        <ol className="space-y-2">
          {preview.map((question, i) => (
            <li key={question} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-[#2557a7]/10 text-[#2557a7] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {question}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-xl p-4 mb-6">
        <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5"><AlertCircle size={12} /> Before you start</p>
        <ul className="space-y-1.5">
          {[
            "Your microphone streams only while you answer a question.",
            "If your connection drops, we will try to reconnect and keep completed answers.",
            "If you are silent for a while, you will see a reminder to continue or finish your answer.",
            "You can end early and still generate a partial report from completed answers.",
            "The final report uses your transcript, timing, score, and feedback from the session.",
          ].map((rule) => (
            <li key={rule} className="text-xs text-gray-700 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">-</span> {rule}</li>
          ))}
        </ul>
      </div>

      <button onClick={onStart} disabled={starting} className="w-full py-4 bg-[#2557a7] text-white rounded-xl font-bold text-base hover:bg-[#1e4a8f] disabled:opacity-60 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
        {starting ? <><Loader2 size={18} className="animate-spin" /> Setting up...</> : <><Play size={18} /> Start Interview Now</>}
      </button>
    </div>
  );
}

export default function LiveSetupPage() {
  const router = useRouter();
  const { consentGiven, setConsentGiven } = useMockInterview();
  const [phase, setPhase] = useState<SetupPhase>("preflight");
  const [sessionType, setSessionType] = useState<SessionType>("HR");
  const [isMobile, setIsMobile] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const codingRoundEnabled = process.env.NEXT_PUBLIC_MOCK_INTERVIEW_CODING_ROUND_ENABLED === "true";

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleStart = async () => {
    setStartError(null);
    try {
      const unlock = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      unlock.volume = 0;
      await unlock.play().catch(() => {});
      unlock.pause();
    } catch {}

    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {}

    setPhase("connecting");
    try {
      const typeMap: Record<SessionType, "hr" | "technical" | "mixed" | "technical_coding"> = {
        HR: "hr", Technical: "technical", Mixed: "mixed", "Technical + Coding": "technical_coding",
      };
      const data: LiveCreateResponse = await createLiveSession({
        session_type: typeMap[sessionType],
        enable_streaming_stt: true,
      });
      // Store session data for the interview page to pick up
      sessionStorage.setItem("live_session_data", JSON.stringify(data));
      sessionStorage.setItem("live_session_type", sessionType);
      router.push(`/mock-interview/live/${data.session_id}`);
    } catch {
      setStartError("We could not create the live interview. Please check your connection and try again.");
      setPhase("pre-interview");
    }
  };

  if (!consentGiven) {
    return (
      <ConsentModal
        onAccept={() => setConsentGiven(true)}
        onDecline={() => router.push("/mock-interview")}
      />
    );
  }

  return (
    <>
      {phase === "preflight" ? (
        <PreflightScreen onContinue={() => setPhase("pre-interview")} />
      ) : (
        <>
          {startError && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm">
              <AlertCircle size={13} className="mr-2 inline text-gray-400" /> {startError}
            </div>
          )}
          <PreInterviewScreen
            sessionType={sessionType}
            isMobile={isMobile}
            onStart={handleStart}
            onTypeChange={setSessionType}
            starting={phase === "connecting"}
            codingRoundEnabled={codingRoundEnabled}
          />
        </>
      )}
    </>
  );
}