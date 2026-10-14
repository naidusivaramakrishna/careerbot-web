"use client";

import React from "react";
import TokenPill from "./TokenPill";
import { ListSectionProps } from "../_types";

const ListSection: React.FC<ListSectionProps> = ({
  title,
  titleColor,
  items,
  matchedMap,
  onToggle,
  onRemove,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2.5">
      <div className={`w-1.5 h-5 rounded-full shadow-md ${titleColor ? titleColor.replace('text-', 'bg-') : 'bg-slate-400'}`}></div>
      <h4 className={`text-sm font-bold ${titleColor || 'text-slate-700'}`}>{title}</h4>
      <div className="ml-auto px-3 py-1 rounded-full bg-gradient-to-r from-[#F8FAFC] to-[#F2F4F7] text-body-sm text-[#2557A7] border border-[#B2CCFF]">
        {items.filter((it) => matchedMap[it]).length} / {items.length}
      </div>
    </div>
    <div className="flex flex-wrap gap-2.5">
      {items.map((it) => (
        <TokenPill
          key={it}
          label={it}
          matched={!!matchedMap[it]}
          onToggle={() => onToggle(it)}
          onRemove={onRemove ? () => onRemove(it) : undefined}
        />
      ))}
    </div>
  </div>
);

export default ListSection;
