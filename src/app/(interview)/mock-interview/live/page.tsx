"use client";

import Image from "next/image";
import { PageHeading } from "../_components/MockUI";
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
  return (
    <main className="mi-page mi-setup-home">
      <div className="mi-intro-grid">
        <div className="mi-intro-copy">
          <span className="mi-pill"><Radio size={15} /> YOUR INTERVIEW STUDIO</span>
          <h1>Get ready for your next interview</h1>
          <p className="mi-description">A focused conversation. A fresh perspective. Practise how you tell your story, with an AI interviewer who guides you through every question.</p>
          <div className="mi-actions"><button type="button" className="mi-button" onClick={onContinue}>Continue to room check <ArrowRight size={18} /></button></div>
          <div className="mi-intro-details"><span><Mic size={17} /> Voice-led interview</span><span><FileText size={17} /> Personalised report</span></div>
        </div>
        <div className="mi-interviewer-card"><div className="mi-interviewer-photo"><Image src={MOCK_INTERVIEWERS[0].src} alt="Ananya, your AI interviewer" fill priority sizes="(min-width: 1024px) 400px, 90vw" /></div><div className="mi-interviewer-caption"><div><p className="mi-eyebrow">MEET YOUR INTERVIEWER</p><h2>Ananya</h2><p>A conversation built around your experience.</p></div><span className="mi-icon-tile"><MessageSquareText size={23} /></span></div></div>
      </div>
      <section className="mi-panel mi-journey"><div className="mi-section-heading"><div><p className="mi-eyebrow">WHAT TO EXPECT</p><h2>Your path through the interview</h2></div><p>A few simple steps to make your practice count.</p></div><div className="mi-journey-grid">{[
        { Icon: ShieldCheck, title: "Check your room", copy: "Test your devices and find a quiet space." },
        { Icon: UserRound, title: "Make it yours", copy: "Choose your role, interview type, and optional resume." },
        { Icon: MessageSquareText, title: "Have the conversation", copy: "Listen to each question, respond naturally, then pause." },
        { Icon: FileText, title: "Find your next step", copy: "Review your transcript, scores, and feedback." },
      ].map(({ Icon, title, copy }, index) => <article key={title}><span className="mi-icon-tile"><Icon size={23} /></span><small>0{index + 1}</small><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="mi-next-action"><span className="mi-icon-tile"><ShieldCheck size={24} /></span><div><strong>A little care makes a better conversation.</strong><p>Use specific examples, finish your thought before pausing, and stay on this tab until your interview ends. Keep a stable connection — if it drops, the session ends and a report is built from the answers captured so far. Your voice is transcribed for scoring.</p></div></section>
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

  const readyCount = [micState === "ok", camState === "ok", speakerState === "ok", network.state === "ok" || network.state === "warning"].filter(Boolean).length;
  return (
    <main className="mi-page">
      <PageHeading eyebrow="STEP 02 / ROOM CHECK" title="Set up your interview room" description="A quick check now helps you stay focused on the conversation later." />
      <div className="mi-preflight-layout">
        <section className="mi-device-grid" aria-label="Device checks">
          <article className="mi-panel mi-device-card"><div className="mi-device-top"><span className="mi-icon-tile"><Mic size={24} /></span><span className={micState === "ok" ? "mi-pill" : "mi-pill mi-pill-neutral"}>{micState === "ok" ? "Ready" : "Check required"}</span></div><h2>Microphone</h2><p>{micState === "ok" ? "Microphone is available." : micState === "denied" ? "Microphone permission denied. Allow access and try again." : micState === "error" ? "Could not access microphone. Please retry." : "Make sure your voice can be heard clearly."}</p><DeviceSelect label="Microphone input" value={selectedMic} devices={micDevices} onChange={setSelectedMic} /><div className="mi-mic-track" aria-label="Microphone input level"><span style={{ width: micLevel + "%" }} /></div><button type="button" className="mi-button mi-button-secondary" aria-label="Test microphone" onClick={testMicrophone} disabled={micState === "checking"}>{micState === "checking" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}{micState === "checking" ? "Checking" : "Test microphone"}</button></article>
          <article className="mi-panel mi-device-card"><div className="mi-device-top"><span className="mi-icon-tile"><Video size={24} /></span><span className={camState === "ok" ? "mi-pill" : "mi-pill mi-pill-neutral"}>{camState === "ok" ? "Ready" : "Check required"}</span></div><h2>Camera</h2><p>{camState === "ok" ? "Camera preview is working." : camState === "denied" ? "Camera permission denied. Allow access and try again." : camState === "error" ? "Could not access camera. Please retry." : "Frame yourself as you would in a real interview."}</p><DeviceSelect label="Camera input" value={selectedCam} devices={camDevices} onChange={setSelectedCam} /><div className="mi-camera-preview">{cameraStream ? <video ref={videoRef} autoPlay playsInline muted /> : <span><VideoOff size={22} />Camera preview appears here</span>}</div><button type="button" className="mi-button mi-button-secondary" aria-label="Test camera" onClick={testCamera} disabled={camState === "checking"}>{camState === "checking" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}{camState === "checking" ? "Checking" : "Test camera"}</button></article>
          <article className="mi-panel mi-device-card"><div className="mi-device-top"><span className="mi-icon-tile"><Volume2 size={24} /></span><span className={speakerState === "ok" ? "mi-pill" : "mi-pill mi-pill-neutral"}>{speakerState === "ok" ? "Ready" : "Check required"}</span></div><h2>Speakers</h2><p>{speakerState === "ok" ? "Speaker test completed." : speakerState === "error" ? "Could not play the test tone. Please retry." : "Play a short tone to check your audio output."}</p><button type="button" className="mi-button mi-button-secondary" aria-label="Test speaker" onClick={testSpeaker} disabled={speakerState === "playing"}>{speakerState === "playing" ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}{speakerState === "playing" ? "Playing" : "Test speaker"}</button></article>
          <article className="mi-panel mi-device-card"><div className="mi-device-top"><span className="mi-icon-tile">{network.state === "offline" ? <WifiOff size={24} /> : <Wifi size={24} />}</span><span className={network.state === "ok" ? "mi-pill" : "mi-pill mi-pill-neutral"}>{network.state === "ok" ? "Ready" : network.state === "warning" ? "Slow connection" : network.state === "offline" ? "Offline" : "Checking"}</span></div><h2>Connection</h2><p>{network.label}</p><div className="mi-device-tip">A stable connection keeps the audio conversation flowing. Connection is checked automatically.</div></article>
        </section>
        <aside className="mi-panel mi-preflight-summary"><p className="mi-eyebrow">YOUR ROOM AT A GLANCE</p><h2>Make space to focus.</h2><div className="mi-readiness-count"><strong>{readyCount}<span>/4</span></strong><p>device checks ready</p></div><div className="mi-mic-track"><span style={{ width: readyCount * 25 + "%" }} /></div><ul>{[["Microphone", micState === "ok"], ["Camera", camState === "ok"], ["Speakers", speakerState === "ok"], ["Connection", network.state === "ok" || network.state === "warning"]].map(([label, ready]) => <li key={String(label)}><span>{label}</span>{ready ? <CheckCircle2 size={18} /> : <span className="mi-check-pending" />}</li>)}</ul><label className="mi-consent"><input type="checkbox" checked={quietConfirmed} onChange={event => setQuietConfirmed(event.target.checked)} /><span><strong>Quiet environment confirmed</strong><small>I am in a quiet room, understand my voice is transcribed for scoring, and can stay on this tab until the report is generated.</small></span></label><button type="button" className="mi-button" onClick={onContinue} disabled={!canContinue}>Continue to interview setup <ArrowRight size={17} /></button><p className="mi-caption">Complete the device checks and confirm your environment to continue.</p></aside>
      </div>
    </main>
  );
}

function ConnectingScreen({ sessionType }: { sessionType: SessionType }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-gray-950">
      <section className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-7 text-center shadow-sm">
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
    <main className="mi-page mi-role-page">
      <PageHeading eyebrow="STEP 03 / MAKE IT YOURS" title="Choose your interview role" description="Choose the role you want to practise for. Then select your interview format and add a resume if you like." action={<span className="mi-pill"><UserRound size={15} />{visibleRoles.length} roles shown</span>} />
      {isMobile && <div className="mi-notice"><Smartphone size={19} /><p><strong>Mobile device detected.</strong> For best results, use a laptop or desktop with stable internet. Mobile browsers may limit microphone and fullscreen behavior.</p></div>}
      <section className="mi-panel mi-role-browser"><div className="mi-role-filters" aria-label="Filter roles by discipline">{ROLE_CATEGORY_FILTERS.map(category => <button type="button" key={category} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "is-active" : ""}>{category}</button>)}</div><div className="mi-role-grid">{visibleRoles.map(role => <button type="button" key={role.title} aria-label={role.title} onClick={() => openRoleModal(role)} className="mi-role-card"><span className="mi-icon-tile"><UserRound size={21} /></span><span><strong>{role.title}</strong><small>{role.category}</small></span><ArrowRight size={17} aria-hidden="true" /></button>)}</div></section>
      <div className="mi-next-action"><ShieldCheck size={24} /><div><strong>Your experience makes it personal.</strong><p>An optional resume gives the interviewer more context for your conversation.</p></div></div>
      {selectedRole && <div className="mi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="role-confirm-title">
        <section className="mi-modal"><button type="button" className="mi-modal-close" aria-label="Close interview confirmation" onClick={closeRoleModal} disabled={starting}><X size={20} /></button><span className="mi-icon-tile"><UserRound size={26} /></span><p className="mi-eyebrow">CONFIRM INTERVIEW</p><h2 id="role-confirm-title">{selectedRole.title}</h2><p>Set the focus of your conversation. You&apos;re one step away.</p>
          <div className="mi-modal-section"><div className="mi-panel-heading"><h3>Interview type</h3><span className="mi-caption">Choose one</span></div><div className="mi-type-grid">{availableInterviewTypes.map(type => <button type="button" key={type} aria-pressed={modalType === type} onClick={() => { setModalType(type); onTypeChange(type); }} className={modalType === type ? "is-active" : ""}><span>{type}</span><small>{type === "HR" ? "Experience & communication" : type === "Managerial" ? "Leadership & decision-making" : type === "Technical + Coding" ? "Technical interview format" : "Skills & problem-solving"}</small>{modalType === type && <CheckCircle2 size={17} />}</button>)}</div></div>
          <div className="mi-upload-area"><span className="mi-icon-tile">{isUploadingResume ? <Loader2 size={22} className="animate-spin" /> : <FileText size={22} />}</span><div><strong>{resumeFileName ?? "Add your resume"}</strong><p>Optional · PDF, DOC, or DOCX. Max 10MB.</p></div><button type="button" className="mi-button mi-button-secondary" onClick={() => resumeInputRef.current?.click()} disabled={starting || isUploadingResume}>{isUploadingResume ? "Uploading" : resumeFileName ? "Replace" : "Upload"}</button><input ref={resumeInputRef} type="file" aria-label="Upload resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={event => void handleResumeUpload(event.target.files?.[0])} /></div>
          {resumeUploadError && <p className="mi-form-error" role="alert"><AlertCircle size={15} />{resumeUploadError}</p>}{resumeFileName && !resumeUploadError && <p className="mi-form-success"><CheckCircle2 size={15} />Resume ready for this interview.</p>}
          <div className="mi-modal-actions"><button type="button" className="mi-button mi-button-secondary" onClick={closeRoleModal} disabled={starting}>Cancel</button><button type="button" className="mi-button" onClick={startSelectedRole} disabled={!modalType || starting || isUploadingResume}>{starting ? <><Loader2 size={17} className="animate-spin" />Creating room</> : <>Start Interview <Play size={17} /></>}</button></div>
        </section>
      </div>}
    </main>
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

  useEffect(() => {
    if (phase === "pre-interview") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const scrollContainer = document.querySelector('.mi-content') as HTMLElement;
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          } else {
            window.scrollTo(0, 0);
          }
        });
      });
    }
  }, [phase]);

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
    // "technical_coding" is not a valid session_type on the backend anymore —
    // this release has no live-interview coding round at all. "Technical + Coding"
    // still maps to plain "technical" for now (see live-interview.txt section 6/9).
    const typeMap: Record<SessionType, "hr" | "technical" | "managerial"> = {
      HR: "hr", Technical: "technical", Managerial: "managerial", "Technical + Coding": "technical",
    };
    const resumeId = localStorage.getItem("current_resume_id") ?? undefined;
    const interviewerIndex = pickRandomInterviewerIndex();
    const selectedInterviewer = MOCK_INTERVIEWERS[interviewerIndex];
    sessionStorage.setItem("live_session_params", JSON.stringify({
      session_type: typeMap[selectedType],
      resume_id: resumeId,
      target_role: targetRole,
      voice: selectedInterviewer.voice,
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
      {phase !== "connecting" && (
        <nav className="mi-setup-progress" aria-label="Interview setup progress">
          <ol>
            {["Get ready", "Check devices", "Choose your role"].map((label, index) => {
              const current = phase === "info" ? 0 : phase === "preflight" ? 1 : 2;
              return (
                <li key={label} aria-current={index === current ? "step" : undefined} data-complete={index < current}>
                  <span>{index < current ? <CheckCircle2 size={16} aria-hidden="true" /> : index + 1}</span>
                  <strong>{label}</strong>
                </li>
              );
            })}
          </ol>
        </nav>
      )}
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
