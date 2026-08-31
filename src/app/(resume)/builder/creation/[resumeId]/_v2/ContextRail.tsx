"use client";
import React, { useEffect, useState } from "react";
import {
  Bot,
  Briefcase,
  ChevronRight,
  Gauge,
  LayoutTemplate,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedTabs } from "./_ui";

export type ContextTab = "templates" | "score" | "ai" | "jobs";

export type ContextRailProps = {
  open: boolean;
  onClose: () => void;
  tab: ContextTab;
  onTabChange: (t: ContextTab) => void;

  // data — provided by parent (pulls from ResumeContext)
  atsScore: number | null;
  atsBreakdown?: { label: string; value: number }[];
  topFixes?: { id: string; severity: "warn" | "bad"; text: string; targetSection?: string }[];
  onJumpToSection?: (key: string) => void;
  onApplyFix?: (id: string) => void;

  templates?: { id: string; name: string; tag?: string; thumb?: React.ReactNode }[];
  activeTemplateId?: string;
  onPickTemplate?: (id: string) => void;
};

export function ContextRail(props: ContextRailProps) {
  const { open, onClose, tab, onTabChange } = props;

  // Lock body scroll when overlay-style on tablet
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Tablet/mobile scrim */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-[1px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        aria-label="Context panel"
        className={cn(
          "fixed right-0 top-0 z-40 h-full w-full max-w-[380px] border-l border-line bg-white",
          "transition-transform duration-200 ease-out",
          // desktop: in-flow within shell using sticky parent; absolute on smaller
          "lg:static lg:z-0 lg:h-auto lg:max-w-none lg:w-[360px]",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-l-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <SegmentedTabs
              value={tab}
              onChange={onTabChange}
              items={[
                {
                  value: "templates",
                  label: "Templates",
                  icon: <LayoutTemplate className="h-3.5 w-3.5" />,
                },
                {
                  value: "score",
                  label: "Score",
                  icon: <Gauge className="h-3.5 w-3.5" />,
                  badge: props.topFixes?.length,
                },
                {
                  value: "ai",
                  label: "AI",
                  icon: <Sparkles className="h-3.5 w-3.5" />,
                },
                {
                  value: "jobs",
                  label: "Jobs",
                  icon: <Briefcase className="h-3.5 w-3.5" />,
                },
              ]}
            />
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-800 lg:hidden bv2-ring-focus"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Panels */}
          <div className="bv2-scroll min-h-0 flex-1 overflow-y-auto">
            {tab === "templates" ? (
              <TemplatesPanel
                templates={props.templates ?? DEFAULT_TEMPLATES}
                activeId={props.activeTemplateId}
                onPick={props.onPickTemplate}
              />
            ) : null}

            {tab === "score" ? (
              <ScorePanel
                score={props.atsScore}
                breakdown={props.atsBreakdown ?? []}
                fixes={props.topFixes ?? []}
                onJump={props.onJumpToSection}
                onApply={props.onApplyFix}
              />
            ) : null}

            {tab === "ai" ? <AIPanel /> : null}
            {tab === "jobs" ? <JobsPanel /> : null}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Templates Panel
   ────────────────────────────────────────────────────────────────────────────── */

const DEFAULT_TEMPLATES: NonNullable<ContextRailProps["templates"]> = [
  { id: "1", name: "Modern Two-Col", tag: "Popular" },
  { id: "2", name: "Classic", tag: "ATS-Safe" },
  { id: "3", name: "Compact", tag: "1-page" },
  { id: "4", name: "Design Forward" },
  { id: "5", name: "Minimal" },
];

function TemplatesPanel({
  templates,
  activeId,
  onPick,
}: {
  templates: NonNullable<ContextRailProps["templates"]>;
  activeId?: string;
  onPick?: (id: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-ink-800">Choose a layout</h3>
        <span className="text-[11px] text-ink-500">{templates.length} designs</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", "Fresher", "Mid-level", "Senior", "ATS-safe"].map((chip, i) => (
          <button
            key={chip}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              i === 0
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-line bg-white text-ink-600 hover:border-line-strong hover:text-ink-800"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {templates.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => onPick?.(t.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-surface-muted text-left transition-all bv2-ring-focus",
                active
                  ? "border-brand-500 ring-2 ring-brand-200"
                  : "border-line hover:border-brand-300 hover:shadow-md"
              )}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
                {t.thumb ?? <TemplateMiniPreview variant={Number(t.id) || 1} />}
                {active ? (
                  <div className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className={cn("text-[12px] font-semibold", active ? "text-brand-700" : "text-ink-800")}>
                  {t.name}
                </span>
                {t.tag ? (
                  <span className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-500">
                    {t.tag}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2 text-[12px] font-semibold text-ink-700 transition-colors hover:bg-surface-sunken">
        <Wand2 className="h-3.5 w-3.5" />
        Customize colors &amp; fonts
      </button>
    </div>
  );
}

/** Cheap CSS-only mini layout that hints at the template style — replace later with real data-driven preview. */
function TemplateMiniPreview({ variant }: { variant: number }) {
  const bars = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div key={i} className="h-1 rounded-full bg-ink-900/15" style={{ width: `${80 - i * 8}%` }} />
    ));
  if (variant === 1) {
    return (
      <div className="flex h-full gap-1.5 p-2">
        <div className="flex w-1/3 flex-col gap-1.5 rounded-sm bg-brand-50 p-1.5">
          <div className="h-6 w-6 rounded-full bg-brand-500/80" />
          <div className="h-1 w-full rounded-full bg-brand-500/40" />
          <div className="h-1 w-3/4 rounded-full bg-brand-500/30" />
          <div className="mt-1 h-1 w-full rounded-full bg-brand-500/20" />
          <div className="h-1 w-2/3 rounded-full bg-brand-500/20" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-1">
          <div className="h-1.5 w-3/4 rounded-full bg-brand-700/80" />
          <div className="h-1 w-1/2 rounded-full bg-ink-900/30" />
          <div className="mt-1 h-px w-full bg-line" />
          {bars(5)}
        </div>
      </div>
    );
  }
  if (variant === 2) {
    return (
      <div className="flex h-full flex-col gap-1 p-2">
        <div className="h-1.5 w-1/2 rounded-full bg-ink-900/80" />
        <div className="h-1 w-1/3 rounded-full bg-ink-900/40" />
        <div className="my-1 h-px w-full bg-ink-900/40" />
        <div className="h-1 w-2/3 rounded-full bg-ink-900/60" />
        {bars(6)}
      </div>
    );
  }
  if (variant === 3) {
    return (
      <div className="flex h-full flex-col gap-1 p-2">
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-1/2 rounded-full bg-ink-900/80" />
          <div className="h-1 w-1/4 rounded-full bg-ink-900/40" />
        </div>
        <div className="my-1 h-px w-full bg-line" />
        {bars(8)}
      </div>
    );
  }
  if (variant === 4) {
    return (
      <div className="grid h-full grid-cols-3 gap-1 p-2">
        <div className="col-span-1 rounded-sm bg-gradient-to-b from-brand-500 to-brand-700" />
        <div className="col-span-2 flex flex-col gap-1">{bars(7)}</div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 p-2">
      <div className="h-2 w-2/3 rounded-full bg-ink-900/70" />
      <div className="h-1 w-1/2 rounded-full bg-ink-900/30" />
      <div className="my-1 h-px w-3/4 bg-line" />
      {bars(4)}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Score Panel
   ────────────────────────────────────────────────────────────────────────────── */

function ScorePanel({
  score,
  breakdown,
  fixes,
  onJump,
  onApply,
}: {
  score: number | null;
  breakdown: { label: string; value: number }[];
  fixes: NonNullable<ContextRailProps["topFixes"]>;
  onJump?: (key: string) => void;
  onApply?: (id: string) => void;
}) {
  const value = typeof score === "number" ? Math.round(score) : null;
  const tone =
    value == null ? "muted" : value >= 80 ? "good" : value >= 60 ? "warn" : "bad";

  return (
    <div className="p-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4",
          tone === "good" && "border-emerald-200 bg-emerald-50",
          tone === "warn" && "border-amber-200 bg-amber-50",
          tone === "bad" && "border-red-200 bg-red-50",
          tone === "muted" && "border-line bg-surface-muted"
        )}
      >
        <div className="flex items-center gap-4">
          <ScoreRing value={value} tone={tone} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              ATS Compatibility
            </p>
            <p className="text-3xl font-black tabular-nums text-ink-900">
              {value ?? "—"}
              <span className="text-base font-bold text-ink-400">/100</span>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              Recalculated on save
            </p>
          </div>
        </div>
      </div>

      {breakdown.length > 0 ? (
        <div className="mt-4 space-y-2.5">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-[11px] font-medium text-ink-600">
                <span>{b.label}</span>
                <span className="tabular-nums text-ink-800">{Math.round(b.value)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    b.value >= 80 ? "bg-emerald-500" : b.value >= 60 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, b.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-ink-800">
            Top fixes
            {fixes.length > 0 ? (
              <span className="ml-2 text-[11px] font-semibold text-ink-400">{fixes.length}</span>
            ) : null}
          </h4>
        </div>
        {fixes.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-5 w-5 text-ink-400" />}
            title="No improvements right now"
            note="Add more detail and save — we will surface fixes here."
          />
        ) : (
          <ul className="space-y-2">
            {fixes.map((f) => (
              <li
                key={f.id}
                className={cn(
                  "group rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand-300"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                      f.severity === "bad"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                    aria-label={f.severity === "bad" ? "Critical" : "Improve"}
                  >
                    !
                  </span>
                  <p className="flex-1 text-[12px] leading-relaxed text-ink-700">{f.text}</p>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {f.targetSection ? (
                    <button
                      onClick={() => onJump?.(f.targetSection!)}
                      className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-line"
                    >
                      Jump
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => onApply?.(f.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-brand-600"
                  >
                    <Sparkles className="h-3 w-3" />
                    Apply AI
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ScoreRing({
  value,
  tone,
}: {
  value: number | null;
  tone: "good" | "warn" | "bad" | "muted";
}) {
  const v = value ?? 0;
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  const color = {
    good: "#16a34a",
    warn: "#d97706",
    bad: "#dc2626",
    muted: "#9ca3af",
  }[tone];

  return (
    <svg width={80} height={80} viewBox="0 0 80 80" className="shrink-0">
      <circle cx={40} cy={40} r={r} fill="none" stroke="#ffffff" strokeWidth={8} />
      <circle
        cx={40}
        cy={40}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset .35s ease-out" }}
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   AI Panel — single chat surface, also exposes "improve current section" shortcut
   ────────────────────────────────────────────────────────────────────────────── */

function AIPanel() {
  const [draft, setDraft] = useState("");
  const prompts = [
    "Rewrite my summary to highlight TypeScript & system design",
    "Quantify bullet points in Work Experience",
    "Suggest skills missing for a Senior Backend role",
    "Tighten the Projects section to one line each",
  ];
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 rounded-xl border border-line bg-gradient-to-br from-brand-50 to-white p-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
          <Bot className="h-3.5 w-3.5" /> Resume Assistant
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-700">
          Ask anything. The assistant has full context of your current resume and can rewrite sections inline.
        </p>
      </div>

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
        Try one of these
      </p>
      <div className="space-y-1.5">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => setDraft(p)}
            className="flex w-full items-start gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-[12px] text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50/40"
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-3">
        <div className="rounded-xl border border-line bg-white p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the assistant…"
            className="block max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent p-1.5 text-[13px] text-ink-800 outline-none placeholder:text-ink-400"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-ink-400">
              Press <kbd className="rounded border border-line px-1 font-mono text-[10px]">⌘↵</kbd> to send
            </span>
            <button
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-2.5 py-1 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Jobs Panel — paste a JD, get match score & gaps
   ────────────────────────────────────────────────────────────────────────────── */

function JobsPanel() {
  const [jd, setJd] = useState("");
  return (
    <div className="p-4">
      <h4 className="text-[13px] font-bold text-ink-800">Match a job description</h4>
      <p className="mt-1 text-[12px] text-ink-500">
        Paste a JD to see how well your resume aligns and which keywords are missing.
      </p>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the job description here…"
        className="mt-3 block h-40 w-full rounded-xl border border-line bg-white p-3 text-[12px] leading-relaxed text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      <button
        disabled={jd.trim().length < 40}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        <Briefcase className="h-3.5 w-3.5" /> Analyse match
      </button>
      <EmptyState
        className="mt-5"
        icon={<Briefcase className="h-5 w-5 text-ink-400" />}
        title="No match yet"
        note="Run analysis to see overlap, missing keywords, and rewrite suggestions."
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  note,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted/60 p-5 text-center",
        className
      )}
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </div>
      <p className="text-[12px] font-bold text-ink-700">{title}</p>
      <p className="mt-0.5 max-w-[26ch] text-[11px] text-ink-500">{note}</p>
    </div>
  );
}
