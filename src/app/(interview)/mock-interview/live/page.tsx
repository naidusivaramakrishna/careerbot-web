"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLiveSession, LiveCreateResponse } from "@/api/mockInterviewApi";
import {
  Mic,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Play,
  Sparkles,
  Smartphone,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SetupPhase = "preflight" | "pre-interview" | "connecting";
type MicCheckState = "idle" | "checking" | "ok" | "denied" | "error";

// ─── Mock questions preview ───────────────────────────────────────────────────

const MOCK_QUESTIONS_PREVIEW = [
  "Tell me about yourself.",
  "Why do you want to join our company?",
  "What are your greatest strengths?",
  "Describe a challenging situation you faced.",
  "Where do you see yourself in 5 years?",
  "How do you handle pressure?",
  "What is your biggest weakness?",
  "Do you prefer working alone or in a team?",
  "Do you have any questions for us?",
];

// ─── Preflight screen ─────────────────────────────────────────────────────────

function PreflightScreen({ onContinue }: { onContinue: () => void }) {
  const [micState, setMicState] = useState<MicCheckState>("idle");
  const [quietConfirmed, setQuietConfirmed] = useState(false);

  const testMicrophone = async () => {
    setMicState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("ok");
    } catch (err) {
      const e = err as DOMException;
      setMicState(e.name === "NotAllowedError" ? "denied" : "error");
    }
  };

  const canContinue = micState === "ok" && quietConfirmed;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-4">
          <Sparkles size={12} />
          Pre-Interview Checks
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set Up Your Environment</h1>
        <p className="text-sm text-gray-500 mt-1">Complete these checks before the interview starts.</p>
      </div>

      <div className="space-y-4 mb-6">
        {/* Mic check */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                micState === "ok" ? "bg-[#2557a7]/10" : "bg-gray-100"
              }`}>
                {micState === "ok" ? (
                  <CheckCircle2 size={18} className="text-[#2557a7]" />
                ) : micState === "denied" || micState === "error" ? (
                  <AlertCircle size={18} className="text-gray-500" />
                ) : (
                  <Mic size={18} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Microphone</p>
                <p className={`text-xs mt-0.5 ${
                  micState === "ok" ? "text-[#2557a7]"
                  : micState === "denied" ? "text-gray-600"
                  : micState === "error" ? "text-gray-500"
                  : "text-gray-500"
                }`}>
                  {micState === "idle" && "Not checked yet"}
                  {micState === "checking" && "Requesting access…"}
                  {micState === "ok" && "Microphone detected and working"}
                  {micState === "denied" && "Permission denied — allow mic access in browser settings"}
                  {micState === "error" && "Could not access microphone — check hardware"}
                </p>
              </div>
            </div>
            <button
              onClick={testMicrophone}
              disabled={micState === "checking"}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7] text-white text-xs font-semibold rounded-lg hover:bg-[#1e4a8f] disabled:opacity-50 transition-colors"
            >
              {micState === "checking" ? (
                <><Loader2 size={12} className="animate-spin" /> Checking</>
              ) : micState === "ok" ? (
                <><RefreshCw size={12} /> Re-test</>
              ) : (
                <><Mic size={12} /> Test Microphone</>
              )}
            </button>
          </div>
        </div>

        {/* Audio check */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2557a7]/10 flex items-center justify-center shrink-0">
              <Volume2 size={18} className="text-[#2557a7]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Audio Output</p>
              <p className="text-xs text-[#2557a7] mt-0.5">Device speakers or headphones detected</p>
              <p className="text-xs text-gray-400 mt-1">Make sure your volume is turned up. You will hear the AI speak.</p>
            </div>
          </div>
        </div>

        {/* Quiet environment confirmation */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={quietConfirmed}
              onChange={(e) => setQuietConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[#2557a7]"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Quiet Environment</p>
              <p className="text-xs text-gray-500 mt-0.5">
                I am in a quiet room with no background noise (TV, fan, traffic). The AI uses your mic to detect speech.
              </p>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full py-3.5 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
      >
        {canContinue ? "Continue to Interview Setup →" : "Complete all checks to continue"}
      </button>
    </div>
  );
}

// ─── Pre-interview screen ─────────────────────────────────────────────────────

function PreInterviewScreen({
  sessionType,
  isMobile,
  onStart,
  onTypeChange,
  starting,
}: {
  sessionType: "HR" | "Technical" | "Mixed";
  isMobile: boolean;
  onStart: () => void;
  onTypeChange: (t: "HR" | "Technical" | "Mixed") => void;
  starting: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Mobile warning */}
      {isMobile && (
        <div className="mb-5 flex items-start gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-xl px-4 py-3">
          <Smartphone size={15} className="text-[#2557a7] mt-0.5 shrink-0" />
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Mobile device detected.</span> For best results, use a laptop or desktop with a stable internet connection. Mobile browsers may have limited microphone support.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-4">
          <Sparkles size={12} />
          Live AI Mock Interview
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You Are Ready.</h1>
        <p className="text-gray-500 text-sm">
          An AI interviewer will ask you 9 questions in real time. Speak naturally. Get scored.
        </p>
      </div>

      {/* Session type */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Interview Type</p>
        <div className="grid grid-cols-3 gap-2">
          {(["HR", "Technical", "Mixed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
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

      {/* Questions preview */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Questions Preview ({MOCK_QUESTIONS_PREVIEW.length} questions)
        </p>
        <ol className="space-y-2">
          {MOCK_QUESTIONS_PREVIEW.map((q, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-[#2557a7]/10 text-[#2557a7] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      {/* Rules */}
      <div className="bg-[#2557a7]/5 border border-[#2557a7]/20 rounded-xl p-4 mb-6">
        <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <AlertCircle size={12} /> Before You Start
        </p>
        <ul className="space-y-1.5">
          {[
            "Use a quiet room. Turn off fans or TV.",
            "Speak clearly. The AI listens via your microphone.",
            "Each answer: 30–120 seconds. AI will prompt if too short.",
            "The session will last ~20 minutes. Do not close the tab.",
            "Your answers are scored live. Report generated at the end.",
          ].map((r) => (
            <li key={r} className="text-xs text-gray-700 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">•</span> {r}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onStart}
        disabled={starting}
        className="w-full py-4 bg-[#2557a7] text-white rounded-xl font-bold text-base hover:bg-[#1e4a8f] disabled:opacity-60 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {starting ? (
          <><Loader2 size={18} className="animate-spin" /> Setting up…</>
        ) : (
          <><Play size={18} /> Start Interview Now</>
        )}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LiveSetupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>("preflight");
  const [sessionType, setSessionType] = useState<"HR" | "Technical" | "Mixed">("HR");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleStart = async () => {
    // Enter fullscreen now — within this click gesture — so it carries into the
    // interview page (programmatic fullscreen needs a user gesture).
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* fullscreen unsupported or denied — continue without it */
    }
    setPhase("connecting");
    try {
      const typeMap: Record<string, "hr" | "technical" | "mixed"> = {
        HR: "hr", Technical: "technical", Mixed: "mixed",
      };
      const data: LiveCreateResponse = await createLiveSession({
        session_type: typeMap[sessionType],
      });
      // Store session data for the interview page to pick up
      sessionStorage.setItem("live_session_data", JSON.stringify(data));
      router.push(`/mock-interview/live/${data.session_id}`);
    } catch {
      setPhase("pre-interview");
    }
  };

  if (phase === "preflight") {
    return <PreflightScreen onContinue={() => setPhase("pre-interview")} />;
  }

  return (
    <PreInterviewScreen
      sessionType={sessionType}
      isMobile={isMobile}
      onStart={handleStart}
      onTypeChange={setSessionType}
      starting={phase === "connecting"}
    />
  );
}
