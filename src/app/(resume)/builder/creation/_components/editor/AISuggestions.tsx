"use client";
import React, { useState } from "react";
import { Check } from "lucide-react";

interface Props {
  options: string[];
  onSelect: (s: string) => void;
  onClose: () => void;
}

const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleSelect = (s: string, i: number) => {
    if (s.startsWith("⚠️")) return;
    setSelectedIndices(prev => new Set(prev).add(i));
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
              className={`text-left px-3 py-3 rounded-md text-sm transition-all duration-200 flex items-start justify-between gap-2 ${
                selectedIndices.has(i)
                  ? "bg-green-50 border border-green-300 text-green-900 cursor-default"
                  : "text-[#2d2d2d] bg-white hover:bg-[#e8eff9] hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              <span className="flex-1">{s}</span>
              {selectedIndices.has(i) && (
                <Check size={14} className="shrink-0 mt-0.5 text-green-600" />
              )}
            </button>
          )
        )}
      </div>

      {selectedIndices.size > 0 && (
        <p className="text-[11px] text-gray-400 italic text-center">
          {selectedIndices.size} suggestion{selectedIndices.size > 1 ? "s" : ""} added · Click × to close
        </p>
      )}
    </div>
  );
};

export default AISuggestions;
