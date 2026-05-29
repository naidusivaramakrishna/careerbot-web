"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import type { CoverLetterListItem } from "@/types/coverLetter";
import CoverLetterStatusPill from "./CoverLetterStatusPill";

/**
 * One row in the cover-letter history list.
 *
 * Renders ONLY the fields the backend CoverLetterListItem returns
 * (Codex wireframes-r1 P1#1): letter_id, created_at, status,
 * role_title, company_name, word_count. NO plain_text preview,
 * NO warning count, NO failed reason — those would require a
 * separate GET per row.
 *
 * Spec: wireframes §A.2 row contract.
 */
export interface CoverLetterListRowProps {
  item: CoverLetterListItem;
  /** Called when the user clicks the ⋯ menu's Delete entry. */
  onDelete: (letterId: string) => void;
}

/** Format a UTC ISO string as a short, locale-aware date. */
function formatGenerated(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString.slice(0, 10);
  }
}

export default function CoverLetterListRow({
  item,
  onDelete,
}: CoverLetterListRowProps) {
  const titleLine =
    item.role_title && item.company_name
      ? `${item.role_title} · ${item.company_name}`
      : item.role_title ?? item.company_name ?? "Untitled cover letter";

  return (
    <div
      className="flex items-start justify-between gap-3 py-4 border-b border-gray-100 last:border-b-0"
    >
      <div className="flex-1 min-w-0">
        <Link
          href={`/cover-letter/${encodeURIComponent(item.letter_id)}`}
          className="block hover:underline focus:outline-none focus:ring-2 focus:ring-[#2557a7] rounded"
        >
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {titleLine}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-gray-500">
          Generated {formatGenerated(item.created_at)}
          {item.word_count > 0 && (
            <> &middot; {item.word_count.toLocaleString()} words</>
          )}
        </p>
        <div className="mt-2">
          <CoverLetterStatusPill status={item.status} />
        </div>
      </div>

      <div className="flex items-start gap-2 shrink-0">
        <Link
          href={`/cover-letter/${encodeURIComponent(item.letter_id)}`}
          className="text-sm font-medium text-[#2557a7] hover:text-[#1e4a94] px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
        >
          Open
        </Link>
        <RowMenu
          letterId={item.letter_id}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

/* ── Row menu (⋯) — V1 has only Delete ─────────────────────── */
import { useEffect, useRef, useState } from "react";

function RowMenu({
  letterId,
  onDelete,
}: {
  letterId: string;
  onDelete: (letterId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside-click and on Escape.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 w-32 rounded-md border border-gray-200 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete(letterId);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
