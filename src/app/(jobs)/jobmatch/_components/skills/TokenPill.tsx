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
      style={matched ? { color: "#067647", background: "#ECFDF3", borderColor: "#ABEFC6" } : undefined}
      aria-pressed={matched}
      aria-label={`${matched ? "Added" : "Add"} ${label}`}
      className={[
        "group relative inline-flex items-center gap-2 px-4 h-9 rounded-full text-label transition-all duration-300 transform",
        "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2",
        matched
          ? "bg-success-50 text-success-700 border-success-200 pr-10 shadow-md hover:shadow-lg"
          : "bg-white text-slate-600 border-[#EAECF0] hover:border-[#2557A7]/40 hover:bg-[#F8FAFC] hover:text-[#2557A7] focus:ring-[#B2CCFF] shadow-md hover:shadow-lg hover:scale-110 active:scale-95 cursor-pointer",
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
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-[#2557A7] to-[#2557A7] hover:from-[#2557A7] hover:to-[#101828] text-white flex items-center justify-center transition-all duration-200 hover:scale-125 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2557A7] focus:ring-offset-1 shadow-md hover:shadow-lg z-10 cursor-pointer text-label"
        title="Click to remove skill"
      >
        <X className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    )}
  </div>
);

export default TokenPill;
