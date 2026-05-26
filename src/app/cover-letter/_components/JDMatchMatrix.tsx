"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type {
  JdMatchMatrixEntry,
  JdMatchStatus,
} from "@/types/coverLetter";

/**
 * JD match matrix table (Screen C/D middle section).
 *
 * Default-expanded for ready_to_review (the user wants to see how
 * the JD covers); default-collapsed for needs_review (warnings
 * take priority). Caller passes `defaultOpen` accordingly.
 *
 * Spec: wireframes §5 (Screen C "JD Match Matrix" panel).
 */
export interface JDMatchMatrixProps {
  entries: JdMatchMatrixEntry[];
  defaultOpen?: boolean;
}

const STATUS_PILL: Record<JdMatchStatus, { label: string; bg: string; text: string }> = {
  met:           { label: "Met",          bg: "bg-emerald-50", text: "text-emerald-700" },
  partial:       { label: "Partial",      bg: "bg-amber-50",   text: "text-amber-700"   },
  not_found:     { label: "Not found",    bg: "bg-gray-50",    text: "text-gray-600"    },
  not_addressed: { label: "Not addressed",bg: "bg-gray-50",    text: "text-gray-600"    },
};

export default function JDMatchMatrix({
  entries,
  defaultOpen = false,
}: JDMatchMatrixProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (entries.length === 0) return null;

  const metCount = entries.filter((e) => e.status === "met").length;

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-[#2257a7] rounded-lg"
      >
        <span className="text-sm font-semibold text-gray-700">
          JD Match Matrix
          <span className="text-gray-400 font-normal">
            {" "}
            ({metCount}/{entries.length} met)
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ul role="list" className="divide-y divide-gray-100">
            {entries.map((e, i) => (
              <li
                key={`${e.requirement}-${i}`}
                className="flex items-center justify-between py-2 gap-3"
              >
                <span className="text-sm text-gray-900 truncate">
                  {e.requirement}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusPill status={e.status} />
                  {e.used_in_letter ? (
                    <span
                      aria-label="Used in letter"
                      className="text-xs text-emerald-600"
                    >
                      ✓ used
                    </span>
                  ) : (
                    <span aria-hidden="true" className="text-xs text-gray-300">
                      —
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

function StatusPill({ status }: { status: JdMatchStatus }) {
  const s = STATUS_PILL[status];
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "text-[10px] font-medium uppercase tracking-wide",
        s.bg,
        s.text,
      ].join(" ")}
    >
      {s.label}
    </span>
  );
}
