"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FileText, BookOpen, Mic, Code2, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useMockInterview, MockStageState } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: React.ElementType;
  locked: boolean;
  status: "completed" | "in_progress" | "available" | "locked";
}

function buildStages(state: MockStageState): Stage[] {
  return [
    {
      id: "generate",
      label: "Interview Notes",
      sublabel: state.notes_generated ? "Completed" : "Generate scripts",
      href: "/notes/generate",
      icon: FileText,
      locked: false,
      status: state.notes_generated ? "completed" : "available",
    },
    {
      id: "english",
      label: "English Essentials",
      sublabel: state.english_read ? "Reviewed" : "Phrases & tone",
      href: "/notes/english",
      icon: BookOpen,
      locked: false,
      status: state.english_read ? "completed" : "available",
    },
    {
      id: "practice",
      label: "Practice Mode",
      sublabel: !state.notes_generated
        ? "Locked"
        : state.practice_answered > 0
        ? `${state.practice_answered}/${state.practice_total} done`
        : "Mock Q&A",
      href: "/notes/practice",
      icon: Mic,
      locked: !state.notes_generated,
      status: !state.notes_generated
        ? "locked"
        : state.practice_answered > 0 && state.practice_answered === state.practice_total
        ? "completed"
        : state.practice_answered > 0
        ? "in_progress"
        : "available",
    },
    {
      id: "technical",
      label: "Technical Practice",
      sublabel: !state.notes_generated ? "Locked" : "Topic-based Q&A",
      href: "/notes/technical",
      icon: Code2,
      locked: !state.notes_generated,
      status: !state.notes_generated ? "locked" : "available",
    },
  ];
}

export default function NotesSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { stageState } = useMockInterview();
  const stages   = buildStages(stageState);
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progressPct    = (completedCount / stages.length) * 100;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">

      {/* 3-px progress band */}
      <div className="h-[3px] bg-gray-100">
        <div
          className="h-full rounded-r-full transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#2557a7,#5b8fd6)" }}
        />
      </div>

      <div className="flex items-center gap-4 px-5 py-2">

        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-gray-100 shadow-sm">
            <Image src="/assets/icons/Logo.png" alt="CareerBot" width={28} height={28} className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[11px] font-black text-gray-900 tracking-tight">Interview Prep</p>
            <p className="text-[8px] font-semibold text-gray-400 tracking-widest uppercase mt-0.5">Notes &amp; Practice</p>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-100 shrink-0 hidden sm:block" />

        {/* ── Stepper ──
            Each step gets a fixed-width column (w-[80px]), centered.
            Connector lines sit between columns with mt-[13px] = half of 28px circle,
            which pins the line exactly to the circle's vertical midpoint.
        */}
        <div className="flex-1 flex items-start justify-center">
          {stages.flatMap((stage, i) => {
            const isActive     = pathname === stage.href || pathname.startsWith(stage.href + "/");
            const isCompleted  = stage.status === "completed";
            const isInProgress = stage.status === "in_progress";
            const Icon = stage.icon;

            const sublabel = isCompleted && !isActive ? "✓ done" : stage.sublabel;

            const stepEl = (
              <button
                key={stage.id}
                onClick={() => { if (!stage.locked) router.push(stage.href); }}
                disabled={stage.locked}
                className="flex flex-col items-center gap-1 group disabled:cursor-not-allowed"
                style={{ width: 80 }}
              >
                {/* Circle */}
                <div
                  className={[
                    "relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-[#2557a7] shadow-md shadow-[#2557a7]/25 ring-[3px] ring-[#2557a7]/15"
                      : isCompleted
                      ? "bg-[#2557a7]"
                      : stage.locked
                      ? "bg-gray-50 border-2 border-gray-200"
                      : "bg-white border-2 border-gray-300 group-hover:border-[#2557a7] group-hover:shadow-sm",
                  ].join(" ")}
                >
                  {isInProgress && !isActive && (
                    <span className="absolute -top-px -right-px w-2 h-2 bg-[#2557a7] rounded-full border border-white animate-pulse" />
                  )}
                  {isCompleted && !isActive ? (
                    <CheckCircle2 size={13} className="text-white" />
                  ) : stage.locked ? (
                    <Lock size={10} className="text-gray-300" />
                  ) : isActive ? (
                    <Icon size={13} className="text-white" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#2557a7]">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Labels — hidden on small screens */}
                <div className="hidden md:flex flex-col items-center text-center w-full">
                  <p
                    className="text-[8.5px] font-bold leading-tight w-full truncate"
                    style={{
                      color: isActive
                        ? "#2557a7"
                        : isCompleted
                        ? "#6b7280"
                        : stage.locked
                        ? "#d1d5db"
                        : "#374151",
                    }}
                  >
                    {stage.label}
                  </p>
                  <p
                    className="text-[7.5px] font-medium mt-px w-full truncate"
                    style={{
                      color: isActive
                        ? "rgba(37,87,167,0.6)"
                        : isCompleted
                        ? "#10b981"
                        : stage.locked
                        ? "#e5e7eb"
                        : "#9ca3af",
                    }}
                  >
                    {sublabel}
                  </p>
                </div>
              </button>
            );

            if (i < stages.length - 1) {
              const connEl = (
                <div
                  key={`conn-${i}`}
                  /* mt-[13px] = half the 28px circle height, aligns line to circle center */
                  className="mt-[13px] shrink-0 h-px rounded-full transition-colors duration-500"
                  style={{
                    width: 40,
                    background: isCompleted ? "#2557a7" : "#e5e7eb",
                  }}
                />
              );
              return [stepEl, connEl];
            }
            return [stepEl];
          })}
        </div>

        <div className="w-px h-6 bg-gray-100 shrink-0 hidden sm:block" />

        {/* CTA */}
        <button
          onClick={() => router.push("/mock-interview/live")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all active:scale-[0.97] hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,#2557a7 0%,#1e40af 100%)",
            boxShadow: "0 2px 8px rgba(37,87,167,0.3)",
          }}
        >
          <span className="hidden sm:inline">Live Interview</span>
          <span className="sm:hidden">Live</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </header>
  );
}
