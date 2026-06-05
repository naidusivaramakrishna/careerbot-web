"use client";

import type { CoverLetterStatus } from "@/types/coverLetter";

export interface CoverLetterStatusPillProps {
  status: CoverLetterStatus;
  className?: string;
}

const STATUS_STYLE: Record<
  CoverLetterStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  ready_to_review: {
    label: "Ready to review",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  needs_review: {
    label: "Needs review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  failed: {
    label: "No draft",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export default function CoverLetterStatusPill({
  status,
  className,
}: CoverLetterStatusPillProps) {
  const s = STATUS_STYLE[status];

  return (
    <span
      role="status"
      aria-label={`Status: ${s.label}`}
      className={[
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 rounded-full",
        "text-xs font-medium",
        s.bg,
        s.text,
        className ?? "",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["h-1.5 w-1.5 rounded-full", s.dot].join(" ")}
      />
      {s.label}
    </span>
  );
}
