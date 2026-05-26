"use client";

import type { CoverLetterStatus } from "@/types/coverLetter";

/**
 * Status pill — one of three colors mapped to the CL-1.2 status.
 *
 * Renders a small inline-block badge with an accessible label
 * ("Status: Ready to review") so screen readers announce it as
 * a status update rather than just a colored shape.
 *
 * Spec: wireframes §A.2 STATUS PILL COLORING + §11 a11y.
 */
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
    label: "Failed",
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
