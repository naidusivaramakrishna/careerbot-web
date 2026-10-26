"use client";
import React, { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import { InlineEditorContext } from "./InlineEditorContext";

/**
 * Click bookkeeping depends on what the CALLER's onSelect does:
 *
 * "append" (default; 7 of the 8 call sites) APPENDS another bullet via
 *   appendSuggestionBullet. Picking several is intended; applying the SAME
 *   one twice duplicates its text, so an applied card is retired for good.
 * "single" REPLACES the value (Professional Summary clears the editor
 *   first), so a different card is a replace and re-picking stays available.
 */
export type SuggestionSelectionMode = "append" | "single";

interface Props {
  options: string[];
  onSelect: (s: string) => void;
  onClose: () => void;
  selectionMode?: SuggestionSelectionMode;
  /** Sentence under the title in the modal shown on the builder page. */
  description?: string;
}

const AISuggestions: React.FC<Props> = ({
  options,
  onSelect,
  onClose,
  selectionMode = "append",
  description = "Based on your resume, here are some suggestions. Pick one to add it.",
}) => {
  const isSingleSelect = selectionMode === "single";
  // Inside the inline (accordion) editor there is no side column, so the suggestions open as a
  // centred modal over a blurred page and close as soon as one is picked.
  const inlineContext = useContext(InlineEditorContext);
  const isPopover = inlineContext !== null;
  const host = inlineContext?.overlayHost ?? null;

  useEffect(() => {
    if (!isPopover) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPopover, onClose]);
  // The card shown as chosen: in "single" mode the one in the box, in
  // "append" mode just the most recent pick.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Every index already applied -- "append" mode only. A lone selectedIndex
  // cannot stop a double-append: pick A, pick B, pick A again and A is
  // re-applied, which is what let one Summary pass the 2000-char limit.
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());

  // Regeneration replaces an entry's option array while leaving the popup
  // mounted; switching entries does the same. Those are new suggestion sets,
  // so none of their cards have been applied yet.
  useEffect(() => {
    setSelectedIndex(null);
    setAppliedIndices(new Set());
  }, [options]);

  const isRetired = (i: number) =>
    isSingleSelect ? selectedIndex === i : appliedIndices.has(i);

  const handleSelect = (s: string, i: number) => {
    if (s.startsWith("⚠️")) return;
    if (isRetired(i)) return;
    setSelectedIndex(i);
    if (!isSingleSelect) setAppliedIndices(prev => new Set(prev).add(i));
    onSelect(s);
    // Side-panel mode stays open (only X closes it); the popover closes once a suggestion is used.
    if (isPopover) onClose();
  };

  const panel = (
    <div className="w-full bg-[#faf9f8] border-[#e5e5e5] shadow-lg rounded-lg border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#2d2d2d]">
          AI Suggestions
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close suggestions"
          className="text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          {isPopover ? <X size={18} /> : "×"}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300"></div>

      {/* Suggestions List */}
      <div className="flex flex-col gap-2 max-h-75 overflow-y-auto scrollbar-hide">
        {options.map((s, i) =>
          s.startsWith("⚠️") ? (
            <p key={i} className="px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-md">
              {s}
            </p>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s, i)}
              disabled={isRetired(i)}
              aria-pressed={isRetired(i)}
              className={`text-left px-3 py-3 rounded-md text-sm transition-all duration-200 flex items-start justify-between gap-2 ${
                isRetired(i)
                  ? "bg-green-50 border border-green-300 text-green-900 cursor-default"
                  : "text-[#2d2d2d] bg-white hover:bg-[#e8eff9] hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              <span className="flex-1">{s}</span>
              {isRetired(i) && (
                <Check size={14} className="shrink-0 mt-0.5 text-green-600" />
              )}
            </button>
          )
        )}
      </div>

      {selectedIndex !== null && (
        <p className="text-[11px] text-gray-400 italic text-center">
          {isSingleSelect
            ? "Summary updated · Click × to close, or pick a different suggestion to replace it"
            : `${appliedIndices.size} suggestion${appliedIndices.size > 1 ? "s" : ""} added · Click × to close`}
        </p>
      )}
    </div>
  );

  if (!isPopover) return panel;
  if (typeof document === "undefined") return null;

  // Over the editor panel when there is one (the preview beside it stays clear); otherwise the page.
  return createPortal(
    <div className={`${host ? "absolute" : "fixed"} inset-0 z-[90] flex items-start justify-center p-3 sm:p-4 lg:items-center`}>
      {/* Blurred backdrop: clicking it closes the modal */}
      <div className={`absolute inset-0 bg-slate-900/25 backdrop-blur-[3px] ${host ? "rounded-xl" : ""}`} onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Suggestions"
        className="relative flex max-h-full w-full max-w-[520px] flex-col rounded-2xl bg-white p-5 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#1d4fa8]" fill="currentColor" />
            <h2 className="text-base font-bold text-gray-900">AI Suggestions</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suggestions"
            className="-mr-1 -mt-1 rounded-md p-1 text-gray-700 transition hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-600">{description}</p>

        <div className="mt-4 flex flex-col gap-2.5 overflow-y-auto pr-0.5 scrollbar-hide">
          {options.map((s, i) =>
            s.startsWith("⚠️") ? (
              <p key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {s}
              </p>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s, i)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#d9e3f3] bg-white px-4 py-3 text-left text-[13px] leading-snug text-gray-900 transition-colors hover:border-[#9db9e6] hover:bg-[#eef4fd] focus-visible:border-[#9db9e6] focus-visible:bg-[#eef4fd] focus-visible:outline-none"
              >
                <span className="flex-1">{s}</span>
                <ChevronRight size={18} className="shrink-0 text-gray-900" aria-hidden="true" />
              </button>
            ),
          )}
        </div>
      </div>
    </div>,
    host ?? document.body,
  );
};

export default AISuggestions;
