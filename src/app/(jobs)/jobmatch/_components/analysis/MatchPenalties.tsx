"use client";

import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp, Plus, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface Penalty {
  suggestion_id: string;
  category: string;
  severity: string;
  fix_type: string;
  penalty: number;
  message: string;
  target?: string;
  is_bulk_parent?: boolean;
}

interface MatchPenaltiesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResult: any;
  onAddSkill: (skill: string, suggestion_id?: string, penalty?: number) => Promise<void> | void;
  onRemoveSkill?: (skill: string, suggestion_id?: string, penalty?: number) => Promise<void> | void;
  /** Hide the Add/Fix All/Improve action buttons and show suggestions as plain read-only text. */
  readOnly?: boolean;
}

const CATEGORY_META: Record<string, { label: string; color: string; lightBg: string; border: string }> = {
  technical_skills: { label: "Technical Skills", color: "#2557a7", lightBg: "#eff6ff", border: "#dbeafe" },
  soft_skills:      { label: "Soft Skills",       color: "#0891b2", lightBg: "#ecfeff", border: "#a5f3fc" },
  star_pattern:     { label: "STAR Bullets",      color: "#7c3aed", lightBg: "#f5f3ff", border: "#ede9fe" },
  capabilities:     { label: "Capabilities",      color: "#d97706", lightBg: "#fffbeb", border: "#fde68a" },
  job_title:        { label: "Job Title",         color: "#dc2626", lightBg: "#fff1f2", border: "#fecdd3" },
  requirements:     { label: "Requirements",      color: "#0d9488", lightBg: "#f0fdfa", border: "#99f6e4" },
  experience:       { label: "Experience",        color: "#4f46e5", lightBg: "#eef2ff", border: "#c7d2fe" },
};

function prettifyCategory(category: string): string {
  return category
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SEVERITY_META: Record<string, { label: string; color: string; bg: string }> = {
  critical:     { label: "critical",     color: "#dc2626", bg: "#fef2f2" },
  important:    { label: "important",    color: "#d97706", bg: "#fffbeb" },
  nice_to_have: { label: "nice to have", color: "#16a34a", bg: "#f0fdf4" },
};

function CategoryGroup({
  category, items, onAddSkill, onRemoveSkill, readOnly,
}: {
  category: string;
  items: Penalty[];
  onAddSkill: (skill: string, suggestion_id?: string, penalty?: number) => Promise<void> | void;
  onRemoveSkill?: (skill: string, suggestion_id?: string, penalty?: number) => Promise<void> | void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const meta = CATEGORY_META[category] ?? { label: prettifyCategory(category), color: "#475569", lightBg: "#f8fafc", border: "#e2e8f0" };
  const bulk = items.find(p => p.is_bulk_parent);
  const individuals = items.filter(p => !p.is_bulk_parent);
  const isSkillActionable = category === "technical_skills" || category === "soft_skills";
  const allAdded = individuals.every(p => addedIds.has(p.suggestion_id));
  const totalPts = Math.abs(bulk?.penalty ?? individuals.reduce((a, p) => a + Math.abs(p.penalty), 0));
  const pending = individuals.length - addedIds.size;

  const handleAdd = async (p: Penalty) => {
    if (!p.target || addedIds.has(p.suggestion_id) || loadingIds.has(p.suggestion_id)) return;
    setLoadingIds(prev => new Set(prev).add(p.suggestion_id));
    try {
      await onAddSkill(p.target, p.suggestion_id, Math.abs(p.penalty));
      setAddedIds(prev => new Set(prev).add(p.suggestion_id));
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
    }
  };

  const handleBulkAdd = async () => {
    if (!isSkillActionable || bulkLoading || allAdded) return;
    setBulkLoading(true);
    try {
      await Promise.all(individuals.filter(p => p.target && !addedIds.has(p.suggestion_id)).map(p => handleAdd(p)));
    } finally { setBulkLoading(false); }
  };

  return (
    <div className="bg-white rounded-lg border border-[#dce8fb] shadow-[0_10px_26px_rgba(37,87,167,0.07)] overflow-hidden">
      {/* Group header — a div, not a button, since it contains the nested "Fix All" button below */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); }
        }}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          {!readOnly && pending > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: meta.color }}>
              {pending}
            </span>
          )}
          {!readOnly && addedIds.size > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
              {addedIds.size} added
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            +{totalPts.toFixed(1)} pts
          </span>
          {!readOnly && !!bulk && isSkillActionable && (
            <button
              onClick={e => { e.stopPropagation(); handleBulkAdd(); }}
              disabled={bulkLoading || allAdded}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3.5 py-1.5 rounded-full transition-all hover:opacity-90 disabled:opacity-70 shadow-sm"
              style={{ background: allAdded ? "#22c55e" : meta.color }}
            >
              {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
               allAdded ? <><CheckCircle2 className="w-3 h-3" /> All Added</> :
               <><Plus className="w-3 h-3" /> Fix All</>}
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Items */}
      {open && (
        <div className="divide-y divide-gray-50">
          {individuals.map(p => {
            const sev = SEVERITY_META[p.severity] ?? SEVERITY_META.important;
            const isAdded = addedIds.has(p.suggestion_id);
            const isLoading = loadingIds.has(p.suggestion_id);
            return (
              <div
                key={p.suggestion_id}
                className="flex items-start gap-4 px-6 py-4 transition-colors duration-300"
                style={{ background: isAdded ? "#f0fdf4" : "#fff" }}
              >
                {/* Dot */}
                <span
                  className="mt-2 shrink-0 w-2 h-2 rounded-full"
                  style={{ background: isAdded ? "#22c55e" : sev.color }}
                />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13.5px] leading-relaxed transition-all duration-300 ${isAdded ? "text-green-700 line-through opacity-60" : "text-gray-700"}`}>
                    {p.message}
                  </p>
                  {category === "star_pattern" && p.target && !isAdded && (
                    <p className="text-[12px] text-red-400 line-through mt-1 leading-snug">{p.target}</p>
                  )}
                  {isAdded && (
                    <p className="text-[12px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added to resume
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col items-end gap-2.5">
                  <div className="flex items-center gap-2">
                    {!isAdded && (
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: sev.color, background: sev.bg }}
                      >
                        {sev.label}
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-green-600 whitespace-nowrap">
                      +{Math.abs(p.penalty).toFixed(1)} pts
                    </span>
                  </div>

                  {!readOnly && isSkillActionable && p.target && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={isAdded || isLoading}
                        className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-full transition-all hover:opacity-90 disabled:opacity-80 shadow-sm"
                        style={{ background: isAdded ? "#22c55e" : meta.color }}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         isAdded ? <><CheckCircle2 className="w-3 h-3" /> Added</> :
                         <><Plus className="w-3 h-3" /> Add</>}
                      </button>
                      {onRemoveSkill && (
                        <button
                          onClick={async () => {
                            await onRemoveSkill(p.target!, p.suggestion_id, Math.abs(p.penalty));
                            setAddedIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
                          }}
                          className={`flex items-center text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-colors ${
                            isAdded
                              ? "text-green-600 border-green-200 hover:bg-green-50"
                              : "text-gray-400 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}

                  {!readOnly && category === "star_pattern" && p.target && !isAdded && (
                    <button
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
                      style={{ color: meta.color, borderColor: meta.border, background: meta.lightBg }}
                    >
                      <ArrowRight className="w-3 h-3" /> Improve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MatchPenalties({ matchResult, onAddSkill, onRemoveSkill, readOnly }: MatchPenaltiesProps) {
  const penalties: Penalty[] = matchResult?.Match_Penalties?.penalties ?? [];
  if (!penalties.length) return null;

  const totalPenalty = Math.abs(matchResult?.Match_Penalties?.total_penalty ?? 0);

  const grouped: Record<string, Penalty[]> = {};
  for (const p of penalties) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  const ORDER = ["technical_skills", "soft_skills", "capabilities", "star_pattern", "job_title"];
  const sortedCategories = [
    ...ORDER.filter(c => grouped[c]),
    ...Object.keys(grouped).filter(c => !ORDER.includes(c)),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Improvement Suggestions</h3>
        </div>
        <span className="text-[12px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
          Recover up to +{totalPenalty.toFixed(1)} pts
        </span>
      </div>

      {sortedCategories.map(cat => (
        <CategoryGroup
          key={cat}
          category={cat}
          items={grouped[cat]}
          onAddSkill={onAddSkill}
          onRemoveSkill={onRemoveSkill}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
