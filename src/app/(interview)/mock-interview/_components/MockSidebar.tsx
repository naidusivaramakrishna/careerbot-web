"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Mic,
  Play,
  History,
  CheckCircle2,
  Lock,
  ChevronRight,
  Code2,
} from "lucide-react";
import { useMockInterview, MockStageState } from "../_context/MockInterviewContext";

// ─── Stage config ─────────────────────────────────────────────────────────────

interface Stage {
  id: string;
  label: string;
  subLabel: string;
  href: string;
  icon: React.ElementType;
  locked: boolean;
  lockReason?: string;
  badge?: string;
  status: "completed" | "in_progress" | "available" | "locked";
}

function buildStages(state: MockStageState): Stage[] {
  return [
    {
      id: "notes",
      label: "Interview Notes",
      subLabel: state.notes_generated ? "Generated" : "Not started",
      href: "/mock-interview/notes",
      icon: FileText,
      locked: false,
      status: state.notes_generated ? "completed" : "available",
    },
    {
      id: "english",
      label: "English Essentials",
      subLabel: state.english_read ? "Reviewed" : "5–10 min read",
      href: "/mock-interview/english",
      icon: BookOpen,
      locked: false,
      status: state.english_read ? "completed" : "available",
    },
    {
      id: "practice",
      label: "Practice Mode",
      subLabel:
        state.practice_answered > 0 && state.practice_total > 0
          ? `${state.practice_answered}/${state.practice_total} done`
          : state.practice_answered > 0
          ? "Practice in progress"
          : "Requires notes first",
      href: "/mock-interview/practice",
      icon: Mic,
      locked: !state.notes_generated,
      lockReason: "Complete Interview Notes first",
      badge:
        state.practice_answered > 0
          ? `${state.practice_answered}/${state.practice_total}`
          : undefined,
      status: !state.notes_generated
        ? "locked"
        : state.practice_answered === state.practice_total
        ? "completed"
        : state.practice_answered > 0
        ? "in_progress"
        : "available",
    },
    {
      id: "technical",
      label: "Technical Practice",
      subLabel: state.notes_generated ? "Practice tech questions" : "Requires notes first",
      href: "/mock-interview/technical",
      icon: Code2,
      locked: !state.notes_generated,
      lockReason: "Complete Interview Notes first",
      status: !state.notes_generated ? "locked" : "available",
    },
    {
      id: "mock",
      label: "Mock Interview",
      subLabel: state.readiness_passed ? "Ready to start" : "Full AI voice interview",
      href: "/mock-interview/live",
      icon: Play,
      locked: false,
      status: state.readiness_passed ? "completed" : "available",
    },
    {
      id: "history",
      label: "History & Reports",
      subLabel:
        state.history_count > 0
          ? `${state.history_count} session${state.history_count > 1 ? "s" : ""}`
          : "No sessions yet",
      href: "/mock-interview/history",
      icon: History,
      locked: false,
      status: "available",
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MockSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stageState } = useMockInterview();
  const stages = buildStages(stageState);
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progressPct = Math.round((completedCount / stages.length) * 100);

  return (
    <aside className="w-64 shrink-0 bg-white min-h-screen hidden lg:flex flex-col border-r border-gray-200">

      {/* Brand header */}
      <div className="px-5 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <Image src="/assets/icons/Logo.png" alt="CareerBot" width={56} height={56} className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-gray-900 text-lg font-bold tracking-tight leading-tight">CareerBot</p>
            <p className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase leading-none">Mock Interview</p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">Preparation Stages</p>
      </div>

      {/* Stage list */}
      <nav className="flex-1 px-3 pb-4">
        {stages.map((stage, i) => {
          const isActive = pathname === stage.href || pathname.startsWith(stage.href + "/");
          const Icon = stage.icon;
          const isCompleted = stage.status === "completed";
          const isInProgress = stage.status === "in_progress";

          return (
            <div key={stage.id} className="relative group mb-0.5">
              {/* Connector line to next item */}
              {i < stages.length - 1 && (
                <div className="absolute left-[22px] top-[44px] w-px h-[calc(100%-32px)] bg-gray-100 z-0" />
              )}

              <button
                onClick={() => { if (!stage.locked) router.push(stage.href); }}
                disabled={stage.locked}
                className={`
                  relative z-10 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                  ${isActive
                    ? "bg-[#2557a7]/[0.06] border border-[#2557a7]/15 shadow-sm"
                    : stage.locked
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100"
                  }
                `}
              >
                {/* Left accent bar for active */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#2557a7] rounded-r-full" />
                )}

                {/* Icon container */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150
                  ${isActive
                    ? "bg-[#2557a7] shadow-md shadow-[#2557a7]/25"
                    : isCompleted
                    ? "bg-[#2557a7]/10 border border-[#2557a7]/15"
                    : stage.locked
                    ? "bg-gray-50 border border-gray-100"
                    : "bg-gray-50 border border-gray-200"
                  }
                `}>
                  {isCompleted && !isActive ? (
                    <CheckCircle2 size={14} className="text-[#2557a7]" />
                  ) : stage.locked ? (
                    <Lock size={12} className="text-gray-300" />
                  ) : (
                    <Icon size={14} className={isActive ? "text-white" : "text-gray-500"} />
                  )}
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-bold tracking-wider ${isActive ? "text-[#2557a7]" : "text-gray-300"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className={`text-xs font-semibold truncate tracking-tight ${
                      isActive ? "text-gray-900" : stage.locked ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                  <p className={`text-[10px] truncate leading-none ${
                    isActive
                      ? "text-[#2557a7]"
                      : isInProgress
                      ? "text-[#2557a7]/70"
                      : isCompleted
                      ? "text-[#2557a7]/50"
                      : "text-gray-400"
                  }`}>
                    {stage.subLabel}
                  </p>
                </div>

                {/* Right indicator */}
                {stage.badge ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#2557a7]/10 text-[#2557a7] rounded-md shrink-0 tabular-nums">
                    {stage.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight size={12} className="text-[#2557a7] shrink-0" />
                ) : isInProgress ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] shrink-0 animate-pulse" />
                ) : null}
              </button>

              {/* Lock tooltip */}
              {stage.locked && stage.lockReason && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden group-hover:block pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                    <Lock size={10} className="inline mr-1.5 opacity-60" />
                    {stage.lockReason}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Progress footer */}
      <div className="px-5 py-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Progress</p>
          <p className="text-[10px] font-bold text-[#2557a7] tabular-nums">
            {completedCount}<span className="text-gray-300">/{stages.length}</span>
          </p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#2557a7] to-[#5b8fd6] rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-2.5 leading-relaxed">
          {stageState.practice_answered > 0
            ? `${stageState.practice_answered}/${stageState.practice_total} questions practiced`
            : "Begin with Interview Notes"}
        </p>
      </div>
    </aside>
  );
}
