"use client";
import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionIcons } from "../../_utils/sectionsConfig";
import ResumeSide from "../../_components/resumeSidebar/ResumeSide";
import type { SectionStat } from "./hooks";

export type EditorCanvasProps = {
  resumeId: string;
  sections: SectionStat[];
  activeKey: string;
  onPickSection: (key: string) => void;
  onAskAI?: () => void;
  initialEditorTab?: string;
  className?: string;
};

/**
 * EditorCanvas is the center-left form surface. It wraps the existing
 * ResumeSide (which contains the proven section forms + autosave wiring),
 * and adds the v2 chrome around it: section header, completion ring,
 * AI shortcut, prev/next navigation.
 *
 * Phase-2 will swap ResumeSide for a fully rewritten section renderer.
 */
export function EditorCanvas({
  resumeId,
  sections,
  activeKey,
  onPickSection,
  onAskAI,
  initialEditorTab,
  className,
}: EditorCanvasProps) {
  const active = useMemo(
    () =>
      sections.find((s) => s.key === activeKey || s.label === activeKey) ??
      sections[0],
    [sections, activeKey]
  );
  const currentIndex = active ? sections.indexOf(active) : 0;
  const prev = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const next = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  const Icon = active ? sectionIcons[active.label] : null;
  const pct = active ? Math.round(active.completion * 100) : 0;
  const tone = pct >= 80 ? "good" : pct >= 50 ? "warn" : pct > 0 ? "low" : "empty";

  return (
    <section
      aria-label="Resume editor"
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface-muted",
        className
      )}
    >
      {/* Section header */}
      <header className="border-b border-line bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="h-[18px] w-[18px]" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Section {currentIndex + 1} of {sections.length}
            </p>
            <h1 className="text-[16px] font-bold text-ink-900">
              {active?.label ?? "Section"}
            </h1>
          </div>

          <CompletionRing value={pct} tone={tone} />

          {active?.aiAssist ? (
            <button
              type="button"
              onClick={onAskAI}
              className="ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-[12px] font-bold text-brand-700 transition-colors hover:bg-brand-100 bv2-ring-focus"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI suggest</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Body — the proven section forms */}
      <div className="bv2-scroll min-h-0 flex-1 overflow-y-auto">
        <div
          data-v2-editor=""
          className="mx-auto h-full w-full max-w-[860px] px-3 sm:px-5"
        >
          {/* ResumeSide renders the active section form with its own state plumbing.
             Passing isTemplateSidebarOpen=true keeps its internal templates toggle silent. */}
          <ResumeSide
            resumeId={resumeId}
            isTemplateSidebarOpen
            onToggleTemplateSidebar={() => {}}
            initialTab={initialEditorTab}
          />
        </div>
      </div>

      {/* Section nav footer */}
      <footer className="border-t border-line bg-white px-5 py-3">
        <div className="mx-auto flex max-w-[860px] items-center justify-between">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && onPickSection(prev.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all bv2-ring-focus",
              prev
                ? "text-ink-700 hover:bg-surface-sunken"
                : "text-ink-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="flex flex-col items-start text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                Previous
              </span>
              <span className="-mt-0.5">{prev?.label ?? "—"}</span>
            </span>
          </button>

          <p className="hidden text-[11px] text-ink-500 sm:block">
            Changes save automatically
          </p>

          <button
            type="button"
            disabled={!next}
            onClick={() => next && onPickSection(next.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-all bv2-ring-focus",
              next
                ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                : "bg-surface-sunken text-ink-400 cursor-not-allowed"
            )}
          >
            <span className="flex flex-col items-end text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Next
              </span>
              <span className="-mt-0.5">{next?.label ?? "Done"}</span>
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </section>
  );
}

function CompletionRing({
  value,
  tone,
}: {
  value: number;
  tone: "good" | "warn" | "low" | "empty";
}) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  const color = {
    good: "#16a34a",
    warn: "#d97706",
    low: "#dc2626",
    empty: "#d1d5db",
  }[tone];

  return (
    <div className="relative h-9 w-9 shrink-0" aria-label={`${value}% complete`}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e5e5" strokeWidth={3.5} />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .35s ease-out" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-ink-700">
        {value}%
      </span>
    </div>
  );
}
