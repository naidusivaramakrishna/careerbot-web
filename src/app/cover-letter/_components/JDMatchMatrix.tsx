"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  SearchX,
} from "lucide-react";
import type {
  JdMatchMatrixEntry,
  JdMatchStatus,
} from "@/types/coverLetter";

export interface JDMatchMatrixProps {
  entries: JdMatchMatrixEntry[];
  defaultOpen?: boolean;
}

const STATUS_PILL: Record<JdMatchStatus, { label: string; bg: string; text: string }> = {
  met: { label: "Matched", bg: "bg-emerald-50", text: "text-emerald-700" },
  partial: { label: "Partial", bg: "bg-amber-50", text: "text-amber-700" },
  not_found: { label: "Missing", bg: "bg-slate-50", text: "text-slate-600" },
  not_addressed: { label: "Not used", bg: "bg-slate-50", text: "text-slate-600" },
};

export default function JDMatchMatrix({
  entries,
  defaultOpen = false,
}: JDMatchMatrixProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (entries.length === 0) return null;

  const metCount = entries.filter((entry) => entry.status === "met").length;
  const partialCount = entries.filter((entry) => entry.status === "partial").length;
  const missingCount = entries.length - metCount - partialCount;
  const usedCount = entries.filter((entry) => entry.used_in_letter).length;
  const matchPercent = Math.round((metCount / entries.length) * 100);
  const summaryTone =
    matchPercent >= 70
      ? "Strong JD alignment"
      : matchPercent >= 35
        ? "Moderate JD alignment"
        : "Low JD alignment";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-slate-900">JD match</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {metCount}/{entries.length} matched
            </span>
          </span>
          <span className="mt-1 block text-sm text-slate-500">
            {summaryTone}. {usedCount} requirement{usedCount === 1 ? "" : "s"} were used in the draft.
          </span>
          <span className="mt-3 block h-2 overflow-hidden rounded-full bg-slate-100">
            <span
              className={[
                "block h-full rounded-full",
                matchPercent >= 70
                  ? "bg-emerald-500"
                  : matchPercent >= 35
                    ? "bg-amber-500"
                    : "bg-red-400",
              ].join(" ")}
              style={{ width: `${Math.max(matchPercent, 4)}%` }}
            />
          </span>
        </span>
        {open ? (
          <ChevronUp className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
      </button>

      <div className="grid grid-cols-3 border-t border-slate-100 px-5 py-3 text-center">
        <SummaryStat icon="matched" label="Matched" value={metCount} tone="emerald" />
        <SummaryStat icon="partial" label="Partial" value={partialCount} tone="amber" />
        <SummaryStat icon="missing" label="Missing" value={missingCount} tone="slate" />
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-2">
          <ul role="list" className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
            {entries.map((entry, index) => (
              <li
                key={`${entry.requirement}-${index}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm text-slate-800">
                  {entry.requirement}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={entry.status} />
                  {entry.used_in_letter ? (
                    <span
                      aria-label="Used in letter"
                      className="text-xs font-medium text-emerald-600"
                    >
                      Used
                    </span>
                  ) : (
                    <span aria-hidden="true" className="text-xs text-slate-300">
                      -
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: "matched" | "partial" | "missing";
  label: string;
  value: number;
  tone: "emerald" | "amber" | "slate";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-500";
  const Icon =
    icon === "matched"
      ? CheckCircle2
      : icon === "partial"
        ? CircleDashed
        : SearchX;

  return (
    <div className="flex items-center justify-center gap-2">
      <Icon className={["h-4 w-4", color].join(" ")} aria-hidden="true" />
      <span className="text-sm font-semibold text-slate-900">{value}</span>
      <span className="hidden text-xs text-slate-500 sm:inline">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: JdMatchStatus }) {
  const style = STATUS_PILL[status];
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5",
        "text-[10px] font-medium uppercase",
        style.bg,
        style.text,
      ].join(" ")}
    >
      {style.label}
    </span>
  );
}
