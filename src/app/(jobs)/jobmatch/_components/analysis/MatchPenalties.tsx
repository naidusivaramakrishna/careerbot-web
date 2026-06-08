"use client";

import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp, Plus, ArrowRight } from "lucide-react";

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
  onAddSkill: (skill: string) => void;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  technical_skills: { label: "Technical Skills",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  soft_skills:      { label: "Soft Skills",        color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  star_pattern:     { label: "STAR Bullets",       color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  capabilities:     { label: "Capabilities",       color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  job_title:        { label: "Job Title",          color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4" },
};

const SEVERITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical:     { text: "#dc2626", bg: "#fee2e2" },
  important:    { text: "#d97706", bg: "#fef3c7" },
  nice_to_have: { text: "#059669", bg: "#d1fae5" },
};

function CategoryGroup({
  category,
  items,
  onAddSkill,
}: {
  category: string;
  items: Penalty[];
  onAddSkill: (skill: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const meta = CATEGORY_META[category] ?? { label: category, color: "#374151", bg: "#f9fafb", border: "#e5e7eb" };

  // Separate bulk parent from individual items
  const bulk = items.find((p) => p.is_bulk_parent);
  const individuals = items.filter((p) => !p.is_bulk_parent);

  const totalRecoverable = Math.abs(bulk?.penalty ?? individuals.reduce((acc, p) => acc + Math.abs(p.penalty), 0));
  const isSkillActionable = category === "technical_skills" || category === "soft_skills";
  const hasBulk = !!bulk;

  const handleBulkAdd = () => {
    if (isSkillActionable) {
      individuals.forEach((p) => {
        if (p.target) onAddSkill(p.target);
      });
    } else {
      // For non-skill categories (star_pattern, etc.) just expand/open all
      setOpen(true);
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: meta.border }}>
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: meta.bg }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: meta.color }}>
            {individuals.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
            +{totalRecoverable.toFixed(1)} pts
          </span>
          {hasBulk && (
            <button
              onClick={(e) => { e.stopPropagation(); handleBulkAdd(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: meta.color }}
            >
              <Plus className="w-2.5 h-2.5" /> {isSkillActionable ? "Fix All" : "View All"}
            </button>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {/* Individual items */}
      {open && (
        <div className="divide-y divide-gray-100 bg-white">
          {individuals.map((p) => {
            const sev = SEVERITY_COLORS[p.severity] ?? SEVERITY_COLORS.important;
            return (
              <div key={p.suggestion_id} className="flex items-start gap-3 px-4 py-3">
                {/* Severity dot */}
                <span
                  className="mt-1 shrink-0 w-2 h-2 rounded-full"
                  style={{ background: sev.text }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-700 leading-snug">{p.message}</p>
                  {/* STAR pattern: show improved bullet */}
                  {category === "star_pattern" && p.target && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[11px] text-red-400 line-through leading-snug">{p.target}</p>
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: sev.text, background: sev.bg }}>
                    {p.severity}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">+{Math.abs(p.penalty).toFixed(1)} pts</span>
                  {isSkillActionable && p.target && (
                    <button
                      onClick={() => onAddSkill(p.target!)}
                      className="flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ background: meta.color }}
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                  )}
                  {category === "star_pattern" && p.target && (
                    <button
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors hover:bg-purple-50"
                      style={{ color: meta.color, borderColor: meta.border }}
                    >
                      <ArrowRight className="w-2.5 h-2.5" /> Improve
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

export default function MatchPenalties({ matchResult, onAddSkill }: MatchPenaltiesProps) {
  const penalties: Penalty[] = matchResult?.Match_Penalties?.penalties ?? [];
  if (!penalties.length) return null;

  const totalPenalty = Math.abs(matchResult?.Match_Penalties?.total_penalty ?? 0);

  // Group by category
  const grouped: Record<string, Penalty[]> = {};
  for (const p of penalties) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  // Order: technical_skills → soft_skills → capabilities → star_pattern → job_title → rest
  const ORDER = ["technical_skills", "soft_skills", "capabilities", "star_pattern", "job_title"];
  const sortedCategories = [
    ...ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !ORDER.includes(c)),
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Improvement Suggestions</h3>
        </div>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Recover up to +{totalPenalty.toFixed(1)} pts
        </span>
      </div>

      {sortedCategories.map((cat) => (
        <CategoryGroup
          key={cat}
          category={cat}
          items={grouped[cat]}
          onAddSkill={onAddSkill}
        />
      ))}
    </div>
  );
}
