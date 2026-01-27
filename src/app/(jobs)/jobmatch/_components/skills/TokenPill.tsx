"use client";

import React from "react";
import { Plus, Check, X } from "lucide-react";
import { TokenPillProps } from "../_types";

const TokenPill: React.FC<TokenPillProps> = ({
  label,
  matched,
  onToggle,
  onRemove,
}) => (
  <div className="relative inline-flex items-center">
    <button
      type="button"
      onClick={onToggle}
      disabled={matched}
      aria-pressed={matched}
      aria-label={`${matched ? "Added" : "Add"} ${label}`}
      className={[
        "group relative inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all duration-300 transform",
        "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2",
        matched
          ? "bg-white text-blue-700 border-blue-500 pr-9 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer",
      ].join(" ")}
    >
      {matched ? (
        <Check className="w-3 h-3 animate-in zoom-in duration-200" />
      ) : (
        <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
      )}
      <span>{label}</span>
    </button>

    {/* Remove button - only show when matched */}
    {matched && onRemove && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${label}`}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-500 hover:bg-slate-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 shadow-sm hover:shadow-md z-10 cursor-pointer"
        title="Click to remove skill"
      >
        <X className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    )}
  </div>
);

export default TokenPill;
