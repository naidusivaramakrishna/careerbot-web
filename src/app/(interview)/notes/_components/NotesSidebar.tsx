"use client";

import { usePathname, useRouter } from "next/navigation";
import { FileText, BookOpen, Mic, Code2, Users, Lock, Check, ArrowRight } from "lucide-react";
import { useMockInterview, MockStageState } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";

interface Stage {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ElementType;
  locked: boolean;
  status: "completed" | "in_progress" | "available" | "locked";
  badge?: string;
}

function buildStages(state: MockStageState): Stage[] {
  return [
    {
      id: "generate",
      label: "Interview Notes",
      shortLabel: "Notes",
      href: "/notes/generate",
      icon: FileText,
      locked: false,
      status: state.notes_generated ? "completed" : "available",
    },
    {
      id: "english",
      label: "English Essentials",
      shortLabel: "English",
      href: "/notes/english",
      icon: BookOpen,
      locked: false,
      status: state.english_read ? "completed" : "available",
    },
    {
      id: "practice",
      label: "Practice Mode",
      shortLabel: "Practice",
      href: "/notes/managerial",
      icon: Mic,
      locked: !state.notes_generated,
      status: !state.notes_generated
        ? "locked"
        : state.practice_answered > 0 && state.practice_answered === state.practice_total
        ? "completed"
        : state.practice_answered > 0
        ? "in_progress"
        : "available",
      badge:
        state.notes_generated && state.practice_answered > 0
          ? `${state.practice_answered}/${state.practice_total}`
          : undefined,
    },
    {
      id: "technical",
      label: "Technical Practice",
      shortLabel: "Technical",
      href: "/notes/technical",
      icon: Code2,
      locked: !state.notes_generated,
      status: !state.notes_generated ? "locked" : "available",
    },
    {
      id: "hr",
      label: "HR Practice",
      shortLabel: "HR",
      href: "/notes/hr",
      icon: Users,
      locked: !state.notes_generated,
      status: !state.notes_generated ? "locked" : "available",
    },
  ];
}

export default function NotesSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stageState } = useMockInterview();
  const stages = buildStages(stageState);
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progressPct = (completedCount / stages.length) * 100;

  return (
    <div className="sticky top-14 z-20 bg-white border-b border-gray-200"
      style={{ boxShadow: "0 1px 0 0 #e5e7eb, 0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-gray-100">
        <div
          className="h-full rounded-r-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #2557a7 0%, #5b8fd6 100%)",
          }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-2.5 gap-4">

        {/* Left: context label */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
            Interview Prep
          </span>
          <span className="text-gray-200 text-xs">·</span>
          <span className="text-[10px] font-semibold text-gray-400">
            {completedCount}/{stages.length} done
          </span>
        </div>

        <div className="hidden lg:block w-px h-4 bg-gray-150 shrink-0" />

        {/* Steps */}
        <div className="flex-1 flex items-center justify-center gap-0">
          {stages.flatMap((stage, i) => {
            const isActive =
              pathname === stage.href || pathname.startsWith(stage.href + "/");
            const isCompleted = stage.status === "completed";
            const isInProgress = stage.status === "in_progress";
            const isLocked = stage.locked;
            const Icon = stage.icon;

            const pill = (
              <button
                key={stage.id}
                onClick={() => !isLocked && router.push(stage.href)}
                disabled={isLocked}
                title={isLocked ? `Complete Interview Notes first` : stage.label}
                className={[
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap",
                  isActive
                    ? "text-white shadow-sm"
                    : isCompleted
                    ? "text-[#2557a7] hover:bg-[#2557a7]/10"
                    : isLocked
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-[#2557a7] hover:bg-[#2557a7]/5",
                ].join(" ")}
                style={
                  isActive
                    ? { background: "#2557a7", boxShadow: "0 2px 8px rgba(37,87,167,0.28)" }
                    : isCompleted
                    ? { background: "rgba(37,87,167,0.07)" }
                    : {}
                }
              >
                {/* In-progress pulse dot */}
                {isInProgress && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white animate-pulse"
                    style={{ background: "#2557a7" }}
                  />
                )}

                {/* Icon */}
                <span className="shrink-0">
                  {isCompleted && !isActive ? (
                    <Check size={11} strokeWidth={2.5} />
                  ) : isLocked ? (
                    <Lock size={11} strokeWidth={2} />
                  ) : (
                    <Icon size={11} strokeWidth={2} />
                  )}
                </span>

                {/* Label — full on md+, short on sm */}
                <span className="hidden sm:inline">{stage.label}</span>
                <span className="sm:hidden">{stage.shortLabel}</span>

                {/* Badge (e.g. "3/6") */}
                {stage.badge && !isActive && (
                  <span className={[
                    "ml-0.5 px-1.5 py-px rounded-full text-[9px] font-bold leading-none",
                    isCompleted
                      ? "bg-[#2557a7]/15 text-[#2557a7]"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}>
                    {stage.badge}
                  </span>
                )}
              </button>
            );

            if (i < stages.length - 1) {
              const prevDone = stage.status === "completed";
              const connector = (
                <div
                  key={`conn-${i}`}
                  className="shrink-0 mx-1"
                  style={{
                    width: 20,
                    height: 1,
                    borderRadius: 1,
                    background: prevDone ? "#2557a7" : "#e5e7eb",
                    opacity: prevDone ? 0.6 : 1,
                    transition: "background 0.4s",
                  }}
                />
              );
              return [pill, connector];
            }
            return [pill];
          })}
        </div>

        <div className="hidden lg:block w-px h-4 bg-gray-150 shrink-0" />

        {/* Right: Live Interview CTA */}
        <button
          onClick={() => router.push("/mock-interview/live")}
          className="shrink-0 flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #2557a7 0%, #1e40af 100%)",
            boxShadow: "0 2px 10px rgba(37,87,167,0.3)",
          }}
        >
          <span className="hidden sm:inline">Live Interview</span>
          <span className="sm:hidden">Live</span>
          <ArrowRight size={12} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}
