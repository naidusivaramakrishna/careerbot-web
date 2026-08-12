"use client";
import React from "react";
import { Plus, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./_ui";
import { sectionIcons } from "../../_utils/sectionsConfig";
import type { SectionStat } from "./hooks";

type Density = "comfortable" | "compact" | "icons";

export type SectionRailProps = {
  sections: SectionStat[];
  activeKey: string;
  onPick: (key: string) => void;
  onAddSection: () => void;
  overallCompletion: number;
  atsScore: number | null;
  /** Visual density. Auto: comfortable on desktop, icons on tablet via parent. */
  density?: Density;
  className?: string;
};

const PrimaryDot = ({ value }: { value: number }) => {
  const tone =
    value >= 0.9 ? "complete" : value >= 0.5 ? "started" : value > 0 ? "low" : "empty";
  const styles = {
    complete: "bg-emerald-500",
    started: "bg-brand-400",
    low: "bg-amber-400",
    empty: "bg-line-strong",
  }[tone];
  const ring = {
    complete: "ring-emerald-100",
    started: "ring-brand-100",
    low: "ring-amber-100",
    empty: "ring-line-soft",
  }[tone];
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-4",
        styles,
        ring
      )}
    >
      {tone === "complete" ? (
        <Check className="absolute inset-0 m-auto h-2 w-2 text-white" />
      ) : null}
    </span>
  );
};

export function SectionRail({
  sections,
  activeKey,
  onPick,
  onAddSection,
  overallCompletion,
  atsScore,
  density = "comfortable",
  className,
}: SectionRailProps) {
  const isIconOnly = density === "icons";
  return (
    <aside
      aria-label="Resume sections"
      className={cn(
        "flex h-full flex-col border-r border-line bg-white",
        isIconOnly ? "w-[64px]" : "w-[240px]",
        className
      )}
    >
      {!isIconOnly ? (
        <div className="px-4 pb-2 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
            Sections
          </p>
        </div>
      ) : (
        <div className="h-3" />
      )}

      <nav className="bv2-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ul className="flex flex-col gap-0.5">
          {sections.map((s) => (
            <SectionItem
              key={s.key}
              section={s}
              active={s.key === activeKey || activeKey === s.label}
              onClick={() => onPick(s.key)}
              iconOnly={isIconOnly}
            />
          ))}

          <li className="mt-2 px-1">
            <button
              type="button"
              onClick={onAddSection}
              className={cn(
                "group flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-[12px] font-semibold text-ink-500 transition-all bv2-ring-focus",
                "hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600",
                isIconOnly && "justify-center px-0"
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!isIconOnly && <span>Add section</span>}
            </button>
          </li>
        </ul>
      </nav>

      <RailFooter
        overallCompletion={overallCompletion}
        atsScore={atsScore}
        iconOnly={isIconOnly}
      />
    </aside>
  );
}

function SectionItem({
  section,
  active,
  onClick,
  iconOnly,
}: {
  section: SectionStat;
  active: boolean;
  onClick: () => void;
  iconOnly: boolean;
}) {
  const Icon = sectionIcons[section.label];
  const pct = Math.round(section.completion * 100);

  const inner = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-all bv2-ring-focus",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-700 hover:bg-surface-sunken hover:text-ink-900",
        iconOnly && "justify-center px-0"
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
        />
      ) : null}

      <PrimaryDot value={section.completion} />

      {!iconOnly && Icon ? (
        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-brand-600" : "text-ink-400")} />
      ) : null}

      {!iconOnly ? (
        <>
          <span className="min-w-0 flex-1 truncate">{section.label}</span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-semibold tabular-nums",
              active ? "text-brand-600" : "text-ink-400"
            )}
          >
            {pct}%
          </span>
          <GripVertical
            className="h-3.5 w-3.5 shrink-0 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </>
      ) : Icon ? (
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-600" : "text-ink-500")} />
      ) : null}
    </button>
  );

  if (iconOnly) {
    return (
      <li>
        <Tooltip
          side="right"
          content={
            <span className="inline-flex items-center gap-2">
              <span>{section.label}</span>
              <span className="opacity-60">{pct}%</span>
            </span>
          }
        >
          {inner}
        </Tooltip>
      </li>
    );
  }
  return <li>{inner}</li>;
}

function RailFooter({
  overallCompletion,
  atsScore,
  iconOnly,
}: {
  overallCompletion: number;
  atsScore: number | null;
  iconOnly: boolean;
}) {
  const pct = Math.round(overallCompletion * 100);
  const tone =
    pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
  const fill = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-red-500",
  }[tone];

  if (iconOnly) {
    return (
      <div className="border-t border-line p-3">
        <Tooltip
          side="right"
          content={
            <span className="inline-flex items-center gap-2">
              Profile {pct}%{atsScore != null ? ` · ATS ${Math.round(atsScore)}` : ""}
            </span>
          }
        >
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-surface-sunken text-[10px] font-bold text-ink-700">
            {pct}%
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-surface-muted/60 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Profile complete
        </span>
        <span className="text-[12px] font-bold tabular-nums text-ink-800">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atsScore != null ? (
        <p className="mt-2 text-[11px] text-ink-500">
          ATS score{" "}
          <span className="font-semibold text-ink-700">{Math.round(atsScore)}</span> · updates on
          save
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-ink-500">
          Score will calculate once you save.
        </p>
      )}
    </div>
  );
}
