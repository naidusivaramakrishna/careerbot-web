"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, MoreVertical, PenLine, Trash2 } from "lucide-react";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const STATUS_STYLES: Record<"generated" | "draft", string> = {
  generated: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<"generated" | "draft", string> = {
  generated: "Ready",
  draft: "Draft",
};

export interface CoverLetterListItemProps {
  id: string;
  jobTitle: string;
  company?: string;
  createdAt: Date;
  status: "generated" | "draft";
  wordCount: number;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CoverLetterListItem({
  id,
  jobTitle,
  company,
  createdAt,
  status,
  wordCount,
  isActive,
  onClick,
  onRename,
  onDelete,
}: CoverLetterListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const StatusIcon = status === "generated" ? CheckCircle2 : PenLine;

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
      className={[
        "group relative cursor-pointer select-none rounded-lg border p-3 outline-none transition",
        menuOpen ? "z-50" : "z-0",
        isActive
          ? "border-[#2557a7] bg-blue-50 shadow-sm ring-1 ring-[#2557a7]/20"
          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            isActive ? "bg-white text-[#2557a7]" : "bg-blue-50 text-[#2557a7]",
          ].join(" ")}
        >
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{jobTitle}</p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {company ? `${company} - ` : ""}
                {timeAgo(createdAt)}
              </p>
            </div>
            {(isHovered || menuOpen || isActive) && (
              <div
                className="relative shrink-0"
                ref={menuRef}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="More actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                  className="rounded-lg bg-white p-1.5 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[80] mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1.5 shadow-2xl ring-1 ring-slate-950/5"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onRename(id);
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#2557a7]"
                    >
                      <PenLine className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-slate-400"
                    >
                      Duplicate
                      <span className="text-xs">soon</span>
                    </button>
                    <hr className="my-1.5 border-slate-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(id);
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold",
                STATUS_STYLES[status],
              ].join(" ")}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {STATUS_LABELS[status]}
            </span>
            {wordCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                {wordCount} words
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
