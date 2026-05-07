"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Mic,
  Video,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  AlertCircle,
  History,
  Play,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import ConsentModal from "./_components/ConsentModal";
import { useMockInterview } from "./_context/MockInterviewContext";

interface Step {
  id: number;
  key: string | null;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  href: string;
  badge: string;
  locked?: boolean;
  cta: string;
  completedLabel?: string;
  time: string;
}

const steps: Step[] = [
  {
    id: 1,
    key: "hasNotes",
    label: "Your Interview Notes",
    sublabel: "Generate personalised scripts from your resume. Self-intro, project explanations, HR answers.",
    icon: FileText,
    href: "/mock-interview/notes",
    badge: "Stage 1",
    cta: "Generate Notes",
    completedLabel: "Notes Ready",
    time: "~15 min",
  },
  {
    id: 2,
    key: null,
    label: "English Essentials",
    sublabel: "30 essential phrases, filler word replacements, common Indian English mistakes to avoid.",
    icon: BookOpen,
    href: "/mock-interview/english",
    badge: "Stage 2",
    cta: "Read Guide",
    completedLabel: "Reviewed",
    time: "5–10 min",
  },
  {
    id: 3,
    key: "practiceRoundsCompleted",
    label: "Practice Your Answers",
    sublabel: "Practice HR questions across 2 rounds. Round 1: With notes · Round 2: Keywords only.",
    icon: Mic,
    href: "/mock-interview/practice",
    badge: "Stage 3–4",
    cta: "Start Practice",
    completedLabel: "Practice Done",
    time: "~30 min",
  },
  {
    id: 4,
    key: null,
    label: "Live Mock Interview",
    sublabel: "Full AI-powered voice interview. 8–10 questions. AI speaks, you respond. Just like a real one.",
    icon: Video,
    href: "/mock-interview/live",
    badge: "Stage 5",
    cta: "Start Interview",
    completedLabel: "Completed",
    time: "~20 min",
  },
];

export default function MockInterviewPage() {
  const router = useRouter();
  const {
    activeSession,
    userProgress,
    stageState,
    consentGiven,
    setConsentGiven,
    dismissActiveSession,
  } = useMockInterview();

  const [showConsent, setShowConsent] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const hasNotes = stageState.notes_generated;
  const isReady = stageState.readiness_passed;
  const avgScore = userProgress?.avg_score ?? 0;
  const practiceRoundsCompleted = userProgress?.practice_rounds ?? 0;

  const handleStepClick = (href: string) => {
    if (!consentGiven) {
      setPendingHref(href);
      setShowConsent(true);
    } else {
      router.push(href);
    }
  };

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsent(false);
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
  };

  const getStepStatus = (step: Step): "completed" | "active" | "locked" => {
    if (step.id === 1) return hasNotes ? "completed" : "active";
    if (step.id === 2) return "active";
    if (step.id === 3) return hasNotes ? "active" : "locked";
    if (step.id === 4) return isReady ? "active" : "locked";
    return "locked";
  };

  const completedSteps = steps.filter((s) => getStepStatus(s) === "completed").length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);
  const hasActivity = avgScore > 0 || practiceRoundsCompleted > 0;

  const ringR = 42;
  const ringC = 2 * Math.PI * ringR;
  const ringD = (overallProgress / 100) * ringC;

  return (
    <>
      {showConsent && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onDecline={() => setShowConsent(false)}
        />
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#2557a7]/4 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2557a7]/6 border border-[#2557a7]/12 rounded-full text-[10px] font-semibold text-[#2557a7] tracking-wide mb-3">
                <Sparkles size={10} />
                AI-Powered Prep
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-1.5">
                Mock Interview
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                5-stage system to prepare and walk into your next interview with confidence.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleStepClick("/mock-interview/notes")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2557a7] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a8f] transition-all shadow-sm shadow-[#2557a7]/20"
                >
                  Get Started <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => router.push("/mock-interview/history")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-100 transition-all"
                >
                  <History size={12} /> History
                </button>
              </div>
            </div>

            {/* Progress ring — inline, no wrapper card */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                  <circle cx="50" cy="50" r={ringR} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r={ringR}
                    fill="none" stroke="#2557a7" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${ringD} ${ringC}`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 tabular-nums leading-none">{overallProgress}%</span>
                  <span className="text-[9px] text-gray-400 font-medium mt-0.5">{completedSteps}/{steps.length} done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">

        {/* ── Session Recovery Banner ── */}
        {activeSession && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-white border border-[#2557a7]/15 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2557a7]/8 rounded-lg flex items-center justify-center shrink-0">
                {activeSession.type === "live" ? <Play size={14} className="text-[#2557a7]" /> : <Mic size={14} className="text-[#2557a7]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activeSession.type === "live" ? "Interview in progress" : "Unfinished practice session"}
                </p>
                <p className="text-xs text-[#2557a7]">
                  {activeSession.questions_remaining != null
                    ? `${activeSession.questions_remaining} question(s) remaining`
                    : "Progress saved"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push(
                  activeSession.type === "live"
                    ? `/mock-interview/live/${activeSession.session_id}`
                    : `/mock-interview/practice?resume=${activeSession.questions_remaining ?? 0}`
                )}
                className="px-3.5 py-1.5 bg-[#2557a7] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a8f] transition-all"
              >
                {activeSession.type === "live" ? "Rejoin" : "Continue"}
              </button>
              <button
                onClick={dismissActiveSession}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                {activeSession.type === "live" ? "Abandon" : "Start Fresh"}
              </button>
            </div>
          </div>
        )}

        {/* ── Stats Row — only show when user has activity ── */}
        {hasActivity && (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { icon: Target, label: "Avg Score", value: avgScore ? `${avgScore}/10` : "—" },
              { icon: Mic, label: "Rounds", value: `${practiceRoundsCompleted}/3` },
              { icon: TrendingUp, label: "Readiness", value: isReady ? "Ready" : "Not Yet" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 bg-[#2557a7]/8 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[#2557a7]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none">{label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Readiness Alert ── */}
        {!isReady && practiceRoundsCompleted > 0 && (
          <div className="mb-4 flex items-center gap-2.5 bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-lg px-3.5 py-2.5">
            <AlertCircle size={14} className="text-[#2557a7] shrink-0" />
            <p className="text-xs text-gray-600">
              Complete at least 1 practice round to unlock Live Interview.
            </p>
          </div>
        )}

        {/* ── Steps Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((step) => {
            const status = getStepStatus(step);
            const Icon = step.icon;
            const isLocked = status === "locked";
            const isCompleted = status === "completed";

            return (
              <button
                key={step.id}
                onClick={() => !isLocked && handleStepClick(step.href)}
                disabled={isLocked}
                className={`
                  group relative text-left w-full rounded-xl overflow-hidden transition-all duration-200
                  ${isLocked
                    ? "bg-gray-50 border border-gray-100 cursor-not-allowed opacity-45"
                    : isCompleted
                    ? "bg-white border border-[#2557a7]/15 hover:border-[#2557a7]/25 hover:shadow-[0_4px_20px_rgba(37,87,167,0.10)] hover:-translate-y-0.5 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                    : "bg-white border border-gray-200 hover:border-[#2557a7]/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                  }
                `}
              >
                {/* Ghost step number */}
                <span className="absolute -bottom-2 right-1 text-[100px] font-black text-gray-900/[0.02] leading-none select-none pointer-events-none tabular-nums">
                  {step.id}
                </span>

                <div className="p-4 relative z-10">
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-lg bg-[#2557a7]/8 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} className="text-[#2557a7]" />
                      </div>
                    ) : isLocked ? (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Lock size={15} className="text-gray-300" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#2557a7] flex items-center justify-center shrink-0 shadow-sm shadow-[#2557a7]/25 group-hover:shadow-md group-hover:shadow-[#2557a7]/30 transition-shadow">
                        <Icon size={17} className="text-white" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold tracking-tight ${isLocked ? "text-gray-400" : "text-gray-900"}`}>
                          {step.label}
                        </h3>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isCompleted ? "bg-[#2557a7]/8 text-[#2557a7]"
                          : isLocked ? "bg-gray-100 text-gray-400"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {step.badge}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isLocked ? "text-gray-300" : "text-gray-500"}`}>
                        {step.sublabel}
                      </p>

                      {!isLocked && (
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                            <Clock size={10} /> {step.time}
                          </span>
                          <span className="text-xs font-semibold text-[#2557a7] flex items-center gap-1 group-hover:gap-1.5 transition-all">
                            {isCompleted ? step.cta : step.cta}
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      )}
                      {isLocked && (
                        <p className="text-[10px] text-gray-300 mt-2 flex items-center gap-1">
                          <Lock size={9} />
                          {step.id === 3 ? "Complete Notes first" : "Pass readiness gate"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
