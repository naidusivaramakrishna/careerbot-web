"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_INTERVIEWERS, pickRandomInterviewerIndex } from "../_lib/interviewers";
import { parseResume } from "@/api/parserApi";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquareText,
  Mic,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  UserRound,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

type SetupPhase = "info" | "preflight" | "pre-interview" | "connecting";
type CheckState = "idle" | "checking" | "ok" | "denied" | "error";
type AudioCheckState = "idle" | "playing" | "ok" | "error";
type NetworkState = "checking" | "ok" | "warning" | "offline";
type SessionType = "HR" | "Technical" | "Managerial" | "Technical + Coding";
type RoleCategory =
  | "Tech"
  | "Engineering"
  | "Data"
  | "QA"
  | "Product"
  | "Management"
  | "Business";
type RoleCard = {
  title: string;
  category: RoleCategory;
};

interface DeviceOption {
  deviceId: string;
  label: string;
}

const INTERVIEW_TYPES = ["HR", "Technical", "Managerial", "Technical + Coding"] as const;

const ROLE_CARDS: RoleCard[] = [
  { title: "Frontend Developer", category: "Tech" },
  { title: "Backend Developer", category: "Tech" },
  { title: "Full Stack Developer", category: "Tech" },
  { title: "Software Engineer", category: "Tech" },
  { title: "React Developer", category: "Tech" },
  { title: "Angular Developer", category: "Tech" },
  { title: "Node.js Developer", category: "Tech" },
  { title: "Java Developer", category: "Tech" },
  { title: "Python Developer", category: "Tech" },
  { title: "Mobile Developer", category: "Tech" },
  { title: "Android Developer", category: "Tech" },
  { title: "iOS Developer", category: "Tech" },
  { title: "Data Analyst", category: "Data" },
  { title: "Data Engineer", category: "Data" },
  { title: "Data Scientist", category: "Data" },
  { title: "Business Intelligence Analyst", category: "Data" },
  { title: "Database Administrator", category: "Data" },
  { title: "AI/ML Engineer", category: "Data" },
  { title: "Machine Learning Engineer", category: "Data" },
  { title: "Generative AI Engineer", category: "Data" },
  { title: "MLOps Engineer", category: "Engineering" },
  { title: "NLP Engineer", category: "Data" },
  { title: "QA Automation Engineer", category: "QA" },
  { title: "Manual QA Tester", category: "QA" },
  { title: "SDET", category: "QA" },
  { title: "Performance Test Engineer", category: "QA" },
  { title: "DevOps Engineer", category: "Engineering" },
  { title: "Cloud Engineer", category: "Engineering" },
  { title: "Site Reliability Engineer", category: "Engineering" },
  { title: "Platform Engineer", category: "Engineering" },
  { title: "System Administrator", category: "Engineering" },
  { title: "Cybersecurity Analyst", category: "Engineering" },
  { title: "Security Engineer", category: "Engineering" },
  { title: "SOC Analyst", category: "Engineering" },
  { title: "Product Manager", category: "Product" },
  { title: "Associate Product Manager", category: "Product" },
  { title: "Product Owner", category: "Product" },
  { title: "Scrum Master", category: "Management" },
  { title: "Engineering Manager", category: "Management" },
  { title: "Technical Lead", category: "Management" },
  { title: "UI/UX Designer", category: "Product" },
  { title: "Product Designer", category: "Product" },
  { title: "UX Researcher", category: "Product" },
  { title: "Business Analyst", category: "Business" },
  { title: "Project Manager", category: "Management" },
  { title: "Program Manager", category: "Management" },
  { title: "Salesforce Developer", category: "Tech" },
  { title: "SAP Consultant", category: "Business" },
  { title: "Technical Support Engineer", category: "Tech" },
  { title: "General Interview", category: "Business" },
];

const ROLE_CATEGORY_FILTERS: Array<RoleCategory | "All"> = [
  "All",
  ...Array.from(new Set(ROLE_CARDS.map((role) => role.category))),
];

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

function InfoScreen({ onContinue }: { onContinue: () => void }) {
  const flow = [
    { title: "Question", copy: "The interviewer asks one focused prompt at a time.", Icon: MessageSquareText },
    { title: "Answer", copy: "Respond naturally while mic and camera stay locked on.", Icon: UserRound },
    { title: "Report", copy: "Your transcript, timing, and scoring become the final report.", Icon: ShieldCheck },
  ];

  const expectations = [
    "Use specific examples with context, action, and result.",
    "Finish your thought before pressing Done Speaking.",
    "Stay on this tab until the session completes or the report opens.",
    "If connection drops, reconnect and continue from the saved room state.",
  ];

  const roomSignals = [
    { label: "Format", value: "Live AI voice panel" },
    { label: "Questions", value: "6 adaptive prompts" },
    { label: "Answer time", value: "About 2 min" },
    { label: "Output", value: "Transcript + report" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-4">
        <header className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2557a7] text-white">
              <Radio size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2557a7]">Live interview briefing</p>
              <h1 className="truncate text-base font-semibold text-gray-950 sm:text-lg">Mock interview room information</h1>
            </div>
          </div>
          <div className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 sm:block">
            Ready for room check
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                <Sparkles size={13} className="text-[#2557a7]" /> Realistic interview setup
              </div>
              <h2 className="max-w-2xl text-xl font-semibold leading-tight tracking-tight text-gray-950 lg:text-2xl">
                Review the live interview flow before the AI interviewer joins.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                This room simulates a real video interview with voice questions, timed answers, live transcript capture, follow-up handling, reconnect support, and a structured report after completion.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {flow.map(({ title, copy, Icon }, index) => (
                <div key={title} className="rounded-lg border border-gray-200 bg-gray-50 p-3.5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-[#2557a7]"><Icon size={16} /></span>
                    <span className="text-[11px] font-semibold text-gray-400">0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
              {roomSignals.map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#2557a7]"><Timer size={17} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Candidate instructions</p>
                  <h2 className="text-base font-semibold text-gray-950">How to perform well</h2>
                </div>
              </div>
              <ul className="space-y-2">
                {expectations.map((item) => (
                  <li key={item} className="flex gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs leading-5 text-gray-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2557a7]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#2557a7]"><Mic size={17} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2557a7]">Room requirements</p>
                  <h2 className="text-base font-semibold text-gray-950">Mic, camera, speaker, network</h2>
                </div>
              </div>
              <p className="text-sm leading-6 text-gray-600">
                CareerBot will verify your microphone, camera preview, speaker output, connection state, and quiet-room confirmation before the timer starts.
              </p>
              <button
                type="button"
                onClick={onContinue}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557a7]/90 focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
              >
                Continue to room check <ArrowRight size={15} />
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
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
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-5 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#2557a7]/10 px-3 py-1 text-xs font-medium text-[#2557a7]">
          <Sparkles size={12} /> Pre-interview checks
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Set up your interview room</h1>
        <p className="text-sm text-gray-500 mt-1">Verify devices, audio, connection, and environment before the AI interviewer joins.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${micState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
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
            <button aria-label="Test microphone" onClick={testMicrophone} disabled={micState === "checking"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#2557a7]/90 disabled:opacity-50 transition-colors">
              {micState === "checking" ? <><Loader2 size={12} className="animate-spin" /> Checking</> : <><RefreshCw size={12} /> Test</>}
            </button>
          </div>
          <DeviceSelect label="Microphone" value={selectedMic} devices={micDevices} onChange={setSelectedMic} />
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden" aria-label="Microphone input level">
            <div className="h-full rounded-full bg-[#2557a7] transition-all" style={{ width: `${micLevel}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${camState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
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
            <button aria-label="Test camera" onClick={testCamera} disabled={camState === "checking"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#2557a7]/90 disabled:opacity-50 transition-colors">
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

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${speakerState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
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
            <button aria-label="Test speaker" onClick={testSpeaker} disabled={speakerState === "playing"} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#2557a7]/90 disabled:opacity-50 transition-colors">
              {speakerState === "playing" ? <><Loader2 size={12} className="animate-spin" /> Playing</> : <><Volume2 size={12} /> Test</>}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${network.state === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"}`}>
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

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input type="checkbox" checked={quietConfirmed} onChange={(event) => setQuietConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#2557a7]" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Quiet environment confirmed</p>
          <p className="text-xs text-gray-500 mt-0.5">I am in a quiet room, understand my voice is transcribed for scoring, and can stay on this tab until the report is generated.</p>
        </div>
      </label>

      <button onClick={onContinue} disabled={!canContinue} className="mt-4 w-full rounded-lg bg-[#2557a7] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557a7]/90 disabled:cursor-not-allowed disabled:opacity-40">
        {canContinue ? "Continue to interview setup" : "Complete mic, camera, speaker, and room checks"}
      </button>
    </div>
  );
}

function ConnectingScreen({ sessionType }: { sessionType: SessionType }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 text-gray-950">
      <section className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#2557a7] text-white">
          <Loader2 size={22} className="animate-spin" />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2557a7]">Entering fullscreen interview room</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">Creating your live interview room</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          We are matching your interviewer, preparing the {sessionType} voice session, and opening the live room.
        </p>
        <div className="mt-5 grid gap-2 text-left">
          {[
            "Securing live session",
            "Matching interviewer voice",
            "Preparing camera and transcript panels",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
              <CheckCircle2 size={14} className="text-[#2557a7]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
function PreInterviewScreen({
  isMobile,
  onStart,
  onTypeChange,
  starting,
}: {
  isMobile: boolean;
  onStart: (type: SessionType, targetRole: string) => void;
  onTypeChange: (t: SessionType) => void;
  starting: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleCard | null>(null);
  const [modalType, setModalType] = useState<SessionType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | "All">("All");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const visibleRoles = selectedCategory === "All" ? ROLE_CARDS : ROLE_CARDS.filter((role) => role.category === selectedCategory);
  const availableInterviewTypes = selectedRole?.category === "Tech"
    ? INTERVIEW_TYPES
    : INTERVIEW_TYPES.filter((type) => type !== "Technical + Coding");

  const validateResumeFile = (file: File): string | null => {
    const allowedExtension = /\.(pdf|doc|docx)$/i.test(file.name);
    const allowedMime = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (!allowedExtension && !allowedMime.has(file.type)) {
      return "Upload a PDF, DOC, or DOCX resume.";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "Resume must be 10MB or smaller.";
    }

    return null;
  };

  const getResumeUploadErrorMessage = (error: unknown): string => {
    const responseData = (error as { response?: { data?: unknown } })?.response?.data;
    if (typeof responseData === "string" && responseData.trim()) return responseData;
    if (responseData && typeof responseData === "object") {
      const data = responseData as Record<string, unknown>;
      const detail = data.detail ?? data.message ?? data.error;
      if (typeof detail === "string" && detail.trim()) return detail;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return "Could not upload this resume. Please try another file.";
  };

  const handleResumeUpload = async (file: File | null | undefined) => {
    if (!file) return;

    const validationError = validateResumeFile(file);
    if (validationError) {
      setResumeUploadError(validationError);
      setResumeFileName(null);
      return;
    }

    setIsUploadingResume(true);
    setResumeUploadError(null);

    try {
      const parsed = await parseResume(file);
      if (!parsed.resume_id) {
        throw new Error("Resume parsed but no resume id was returned.");
      }

      localStorage.setItem("current_resume_id", parsed.resume_id);
      setResumeFileName(parsed.file_name || file.name);
    } catch (error) {
      setResumeFileName(null);
      setResumeUploadError(getResumeUploadErrorMessage(error));
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const openRoleModal = (role: RoleCard) => {
    setSelectedRole(role);
    setModalType(null);
  };

  const closeRoleModal = () => {
    if (starting) return;
    setSelectedRole(null);
    setModalType(null);
  };

  const startSelectedRole = () => {
    if (!selectedRole || !modalType) return;
    onTypeChange(modalType);
    onStart(modalType, selectedRole.title);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      {isMobile && (
        <div className="mb-5 flex items-start gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-lg px-4 py-3">
          <Smartphone size={15} className="text-[#2557a7] mt-0.5 shrink-0" />
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Mobile device detected.</span> For best results, use a laptop or desktop with stable internet. Mobile browsers may limit microphone and fullscreen behavior.
          </p>
        </div>
      )}

      <div className="mb-5 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#2557a7]/10 px-3 py-1 text-xs font-medium text-[#2557a7]">
          <Sparkles size={12} /> Live AI Mock Interview
        </div>
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Choose your interview role.</h1>
        <p className="text-gray-500 text-sm">Select the role you want to simulate. You can confirm the interview type before entering the live room.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-end gap-1.5">
        {ROLE_CATEGORY_FILTERS.map((category) => {
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium leading-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2 ${
                isActive
                  ? "border-transparent bg-[#2557a7] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#2557a7]/40 hover:text-[#2557a7]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid gap-2.5 lg:grid-cols-3">
        {visibleRoles.map((role) => {
          const roleTitle = role.title;

          return (
            <button
              key={roleTitle}
              type="button"
              onClick={() => openRoleModal(role)}
              className="flex min-h-[56px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#2557a7]/40 hover:text-[#2557a7] hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
            >
              {roleTitle}
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4" role="dialog" aria-modal="true" aria-labelledby="role-confirm-title">
          <section className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2557a7]">Confirm interview</p>
                <h2 id="role-confirm-title" className="mt-1 text-lg font-semibold text-gray-950">{selectedRole.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={starting}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                aria-label="Cancel interview setup"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-4 rounded-lg border border-dashed border-[#2557a7]/35 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2557a7]/10 text-[#2557a7]">
                      {isUploadingResume ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resume</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                        {resumeFileName ?? "Upload resume for tailored questions"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">PDF, DOC, or DOCX. Max 10MB.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={starting || isUploadingResume}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2557a7]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2557a7] transition hover:border-[#2557a7]/45 hover:bg-[#2557a7]/5 disabled:opacity-60"
                  >
                    {isUploadingResume ? "Uploading" : resumeFileName ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(event) => void handleResumeUpload(event.target.files?.[0])}
                  />
                </div>
                {resumeUploadError && (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-red-600">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{resumeUploadError}</span>
                  </p>
                )}
                {resumeFileName && !resumeUploadError && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} />
                    <span>Resume ready for this interview.</span>
                  </p>
                )}
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Interview type</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableInterviewTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={modalType === type}
                    onClick={() => {
                      setModalType(type);
                      onTypeChange(type);
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      modalType === type
                        ? "border-[#2557a7] bg-[#2557a7] text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#2557a7]/40"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={starting}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startSelectedRole}
                disabled={starting || isUploadingResume || !modalType}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557a7]/90 disabled:opacity-60"
              >
                {starting ? <><Loader2 size={16} className="animate-spin" /> Creating room</> : <><Play size={16} /> Start Interview</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
export default function LiveSetupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>("info");
  const [sessionType, setSessionType] = useState<SessionType>("HR");
  const [isMobile, setIsMobile] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Prefetch the [sessionId] bundle as soon as setup page mounts so the JS is
  // already cached by the time the user clicks "Start Interview" and we push.
  useEffect(() => {
    router.prefetch('/mock-interview/live/prefetch');
  }, [router]);

  const handleStart = (selectedType = sessionType, targetRole?: string) => {
    setStartError(null);
    setSessionType(selectedType);

    try {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    setPhase("connecting");

    try {
      const unlock = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      unlock.volume = 0;
      void unlock.play().then(() => unlock.pause()).catch(() => {});
    } catch {}

    // Store params for the starting page, then navigate immediately so the user
    // doesn't wait on the API call before seeing any progress.
    const typeMap: Record<SessionType, "hr" | "technical" | "managerial" | "technical_coding"> = {
      HR: "hr", Technical: "technical", Managerial: "managerial", "Technical + Coding": "technical_coding",
    };
    const resumeId = localStorage.getItem("current_resume_id") ?? undefined;
    const interviewerIndex = pickRandomInterviewerIndex();
    const selectedInterviewer = MOCK_INTERVIEWERS[interviewerIndex];
    sessionStorage.setItem("live_session_params", JSON.stringify({
      session_type: typeMap[selectedType],
      resume_id: resumeId,
      target_role: targetRole,
      enable_streaming_stt: true,
      voice: selectedInterviewer.voice,
      use_orchestrator: true,
      interviewer_index: interviewerIndex,
      interviewer_slug: selectedInterviewer.slug,
      interviewer_name: selectedInterviewer.name,
      gender: selectedInterviewer.gender,
      session_type_label: selectedType,
    }));
    router.push('/mock-interview/live/starting');
  };

  return (
    <>
      {phase === "info" && <InfoScreen onContinue={() => setPhase("preflight")} />}
      {phase === "preflight" && <PreflightScreen onContinue={() => setPhase("pre-interview")} />}
      {phase === "connecting" && <ConnectingScreen sessionType={sessionType} />}
      {phase === "pre-interview" && (
        <>
          {startError && (
            <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm">
              <AlertCircle size={13} className="mr-2 inline text-gray-400" /> {startError}
            </div>
          )}
          <PreInterviewScreen
            isMobile={isMobile}
            onStart={handleStart}
            onTypeChange={setSessionType}
            starting={false}
          />
        </>
      )}
    </>
  );
}
