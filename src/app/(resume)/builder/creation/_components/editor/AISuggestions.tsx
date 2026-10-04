"use client";
import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

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
}

const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose, selectionMode = "append" }) => {
  const isSingleSelect = selectionMode === "single";
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
    // Popup stays open — only X closes it
  };

  return (
    <div className="w-full bg-[#faf9f8] border-[#e5e5e5] shadow-lg rounded-lg border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#2d2d2d]">
          AI Suggestions
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ×
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
};

export default AISuggestions;
