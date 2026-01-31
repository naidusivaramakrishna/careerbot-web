"use client";

import React from "react";
import TokenPill from "./TokenPill";
import { ListSectionProps } from "../_types";

const ListSection: React.FC<ListSectionProps> = ({
  title,
  items,
  matchedMap,
  onToggle,
  onRemove,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full shadow-sm"></div>
      <h4 className="text-sm font-bold text-slate-700">{title}</h4>
      <div className="ml-auto px-2 py-0.5 rounded-full bg-slate-50 text-xs font-semibold text-slate-500">
        {items.filter((it) => matchedMap[it]).length} / {items.length}
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
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
