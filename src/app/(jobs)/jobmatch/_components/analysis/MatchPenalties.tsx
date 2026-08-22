"use client";

import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp, Plus, CheckCircle2, Loader2, ArrowRight, RotateCcw, Lightbulb, Wrench, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Penalty {
  suggestion_id: string;
  category: string;
  severity: string;
  fix_type: string;
  penalty: number;
  message: string;
  target?: string;
  before_example?: string;
  after_example?: string;
  is_bulk_parent?: boolean;
}

interface MatchPenaltiesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResult: any;
  /** Returns whether the skill was actually persisted server-side (not just applied to local state). */
  onAddSkill: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  onRemoveSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  /** Apply a non-skill fix (job title / summary / bullet rewrite). Returns whether it actually changed anything. */
  onApplyFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  /** Undo a previously-applied non-skill fix. Returns whether it actually succeeded. */
  onRemoveFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  /** Open the resume section editor (manual-fix suggestions with no auto-resolver route here). */
  onOpenSection?: (sectionKey: string) => void;
  /** Hide the Add/Fix All/Improve action buttons and show suggestions as plain read-only text. */
  readOnly?: boolean;
  /** suggestion_ids already applied in a previous session — seeds the "Added" state so it survives navigating away and back instead of resetting to "Apply fix". */
  appliedSuggestionIds?: string[];
  /** Reports a suggestion_id's applied state changing (add or Undo) so the caller can persist it. */
  onSuggestionApplied?: (suggestionId: string, applied: boolean) => void;
}

// Resume section ids the manual-editor popup understands — mirrors ALL_SECTIONS
// in AnalysisContent.tsx / the `case` list in JobMatchSectionEditor.tsx.
const KNOWN_SECTION_IDS = new Set([
  "contact", "summary", "education", "skills", "softSkills", "experience",
  "internships", "projects", "certifications", "achievements", "languages",
  "hobbies", "references",
]);

// A penalty's category matches a section id by name for most cases (e.g.
// "education"); the rest are aliased to the closest editable section.
const CATEGORY_SECTION_ALIASES: Record<string, string> = {
  technical_skills: "skills",
  soft_skills: "softSkills",
  job_title: "contact",
  capabilities: "certifications",
  requirements: "experience",
  star_pattern: "experience",
  formatting: "contact",
};

export function categoryToSectionKey(category: string, target?: string): string | undefined {
  // "formatting" bundles fields that live in different resume sections — email/phone/
  // location are contact fields, but e.g. a missing "experience" field belongs in
  // Experience. When the target names a real section id directly, prefer that over
  // the blanket "contact" alias below.
  if (category === "formatting" && target && KNOWN_SECTION_IDS.has(target)) return target;
  // "technical_skills" isn't itself a section id (the resume section is "skills").
  if (category === "formatting" && target === "technical_skills") return "skills";
  if (KNOWN_SECTION_IDS.has(category)) return category;
  return CATEGORY_SECTION_ALIASES[category];
}

function prettifySectionKey(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Categories the backend can deterministically rewrite in the resume from a
// suggestion_id alone (see job_matcher.py:_resolve_one_text_edit).
const TEXT_ACTIONABLE_CATEGORIES = new Set(["job_title", "summary", "requirements", "experience", "star_pattern"]);

// Mirrors _resolve_one_text_edit's resolution order: job_title/summary/the three
// rewrite categories always have a resolver, but ANY other category (e.g.
// capabilities, when the AI's bullet-consolidation step merges it into an
// existing bullet) is still applyable via the backend's catch-all — it only
// needs before_example/after_example on the penalty itself, regardless of
// category. Without this, a merged suggestion like `bullet_fix_0` under
// category "capabilities" would wrongly show as read-only.
function isPenaltyApplyable(p: Penalty): boolean {
  if (TEXT_ACTIONABLE_CATEGORIES.has(p.category)) return true;
  return !!(p.before_example && p.after_example && p.before_example !== p.after_example);
}

const CATEGORY_META: Record<string, { label: string; color: string; lightBg: string; border: string }> = {
  technical_skills: { label: "Technical Skills Fixes", color: "#2557a7", lightBg: "#eff6ff", border: "#dbeafe" },
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

const SUGGESTION_TYPE_META = {
  skill: { label: "Add skill", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  fix: { label: "Text fix", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  manual: { label: "Suggestion", color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
};

function CategoryGroup({
  category, items, onAddSkill, onRemoveSkill, onApplyFix, onRemoveFix, onOpenSection, readOnly, appliedSuggestionIds, onSuggestionApplied,
}: {
  category: string;
  items: Penalty[];
  onAddSkill: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  onRemoveSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  onApplyFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  onRemoveFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  onOpenSection?: (sectionKey: string) => void;
  readOnly?: boolean;
  appliedSuggestionIds?: string[];
  onSuggestionApplied?: (suggestionId: string, applied: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  // Seeded from the persisted appliedSuggestionIds so a suggestion applied in
  // a previous mount (before navigating away and back) still shows "Added"
  // instead of resetting to "Apply fix" — see onSuggestionApplied below.
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set(appliedSuggestionIds));
  // A bulk-parent apply rewrites all of a group's bullets server-side from
  // one call, but the frontend can only ever mirror a before/after pair keyed
  // to that SAME parent id into the live preview — it has no way to know
  // which (if any) specific child bullet that corresponds to. These ids are
  // still added to addedIds (so the button disables and it isn't re-applied),
  // but tracked separately so their row can say "applied, not yet confirmed
  // in preview" honestly instead of claiming the same verified "Added" state
  // an individually-applied fix gets.
  const [bulkAppliedIds, setBulkAppliedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [bulkLoadingKey, setBulkLoadingKey] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const meta = CATEGORY_META[category] ?? { label: prettifyCategory(category), color: "#475569", lightBg: "#f8fafc", border: "#e2e8f0" };
  // A category can carry MORE THAN ONE bulk parent — e.g. technical_skills
  // ships "suggest_add_critical_all_skills" AND "suggest_add_nice_to_have_all_skills"
  // side by side. Each bulk parent's `severity` matches the severity of the
  // individual items it summarizes, so pair them up instead of grabbing just
  // the first one (which used to leave the second "all" fix stranded, unlabeled,
  // among the plain individual rows).
  const bulkParents = items.filter(p => p.is_bulk_parent);
  const individuals = items.filter(p => !p.is_bulk_parent);
  const isSkillActionable = category === "technical_skills" || category === "soft_skills";
  // Group-level: gates the "Fix All" bulk button, which calls the bulk
  // suggestion's own id — only meaningful for categories the backend's
  // _BULK_TEXT_SUGGESTION_IDS actually maps (star_pattern/requirements/experience).
  const categoryBulkActionable = !!onApplyFix && TEXT_ACTIONABLE_CATEGORIES.has(category);
  const canAct = isSkillActionable || categoryBulkActionable;
  const hideGroupHeader = category === "all";
  const totalPts = Math.abs(individuals.reduce((a, p) => a + Math.abs(p.penalty), 0))
    || Math.abs(bulkParents.reduce((a, p) => a + Math.abs(p.penalty), 0));
  const pending = individuals.length - addedIds.size;
  const bulkActionLabel = isSkillActionable ? "Add all skills" : "Apply all fixes";

  const consumed = new Set<string>();
  const subgroups: { parent?: Penalty; items: Penalty[] }[] = bulkParents.map(bp => {
    const groupItems = individuals.filter(p => p.severity === bp.severity && !consumed.has(p.suggestion_id));
    groupItems.forEach(p => consumed.add(p.suggestion_id));
    return { parent: bp, items: groupItems };
  });
  const leftover = individuals.filter(p => !consumed.has(p.suggestion_id));
  if (leftover.length || subgroups.length === 0) subgroups.push({ items: leftover });
  const multiBulk = bulkParents.length > 1;
  // What the single-bulk-parent header button actually applies (subgroup 0).
  // It used to be gated on every individual in the category regardless of
  // severity, which left it enabled after its own subgroup was already done —
  // the next click then no-op'd inside handleGroupBulkAdd, a dead click.
  const headerGroupAllAdded =
    subgroups[0]?.items.length > 0 && subgroups[0].items.every(p => addedIds.has(p.suggestion_id));

  // `silent` skips the per-item error toast — used during "Fix All" so a run
  // of rate-limited calls doesn't spam one toast per skill; the bulk loop
  // shows a single summary toast instead.
  const handleAdd = async (p: Penalty, opts?: { silent?: boolean }): Promise<boolean> => {
    // Already applied — genuinely a success, nothing left to do.
    if (addedIds.has(p.suggestion_id)) return true;
    // Already in flight from another click: the outcome is unknown, so don't
    // report success. The bulk loop counts a true return toward its "Added N
    // of M" toast, and this item's own request may still fail.
    if (loadingIds.has(p.suggestion_id)) return false;
    if (isSkillActionable && !p.target) return false;
    if (!isSkillActionable && !(onApplyFix && isPenaltyApplyable(p))) return false;
    setLoadingIds(prev => new Set(prev).add(p.suggestion_id));
    let applied = true;
    try {
      if (isSkillActionable) {
        applied = await onAddSkill(p.target!, p.suggestion_id);
      } else {
        applied = await onApplyFix!(p.suggestion_id, p.category);
      }
      if (applied) {
        setAddedIds(prev => new Set(prev).add(p.suggestion_id));
        onSuggestionApplied?.(p.suggestion_id, true);
      } else if (isSkillActionable && !opts?.silent) {
        toast.error("Couldn't add this skill. Please try again.");
      }
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
    }
    return applied;
  };

  // Undo an individually-applied (non-bulk) text fix. Bulk-applied items are
  // excluded: the backend only recorded the bulk PARENT's suggestion_id in
  // its apply bookkeeping, so removing by a child's own id would 404 —
  // reverting a bulk fix would need to target the parent, which isn't wired
  // up here yet.
  const handleRemoveFix = async (p: Penalty) => {
    if (!onRemoveFix || !addedIds.has(p.suggestion_id) || removingIds.has(p.suggestion_id)) return;
    setRemovingIds(prev => new Set(prev).add(p.suggestion_id));
    try {
      const ok = await onRemoveFix(p.suggestion_id, p.category);
      if (ok) {
        setAddedIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
        onSuggestionApplied?.(p.suggestion_id, false);
      } else {
        toast.error("Couldn't undo this fix. Please try again.");
      }
    } finally {
      setRemovingIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
    }
  };

  // Applies one subgroup (a bulk parent + the individuals it summarizes), or
  // the whole category when called with all individuals and no parent.
  const handleGroupBulkAdd = async (groupItems: Penalty[], parent?: Penalty) => {
    const key = parent?.suggestion_id ?? "__all__";
    const groupAllAdded = groupItems.length > 0 && groupItems.every(p => addedIds.has(p.suggestion_id));
    if (!canAct || bulkLoadingKey || groupAllAdded) return;
    setBulkLoadingKey(key);
    try {
      if (categoryBulkActionable && parent) {
        const applied = await onApplyFix!(parent.suggestion_id, category);
        if (applied) {
          setAddedIds(prev => {
            const n = new Set(prev);
            groupItems.forEach(p => n.add(p.suggestion_id));
            return n;
          });
          groupItems.forEach(p => onSuggestionApplied?.(p.suggestion_id, true));
          setBulkAppliedIds(prev => {
            const n = new Set(prev);
            groupItems.forEach(p => n.add(p.suggestion_id));
            return n;
          });
        } else {
          // onApplyFix already toasts the specific reason (rate limit, needs a
          // number, etc.) when it fails outright — but a cancelled fill-in-the-
          // blank prompt resolves `false` with no toast of its own, and this
          // button would otherwise just go quiet with nothing "pending" or
          // "added" changing, looking like a dead click.
          toast.error("This fix wasn't applied.");
        }
      } else {
        // Sequential, not Promise.all: firing every skill at once both blows
        // through the backend's per-minute rate limit and races concurrent
        // writes to the same resume document (last write wins, silently
        // dropping most of the added skills). One at a time, and stop as
        // soon as one fails instead of continuing to hammer a limit we've
        // already hit.
        const targets = groupItems.filter(p => p.target && !addedIds.has(p.suggestion_id));
        let succeeded = 0;
        for (const p of targets) {
          const ok = await handleAdd(p, { silent: true });
          if (!ok) break;
          succeeded++;
        }
        if (succeeded < targets.length) {
          toast.error(
            succeeded > 0
              ? `Added ${succeeded} of ${targets.length} skills — hit the request limit. Wait a minute and click "Fix All" again for the rest.`
              : `Couldn't add skills right now — please wait a minute and try again.`
          );
        }
      }
    } finally { setBulkLoadingKey(null); }
  };

  if (hideGroupHeader && individuals.length === 0) return null;

  return (
    <div className={hideGroupHeader ? "" : "overflow-hidden rounded-xl border border-[#dce8fb] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(37,87,167,0.10)]"}>
      {/* Group header — omitted for the generic "all" bucket. */}
      {!hideGroupHeader && <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          {!readOnly && pending > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: meta.color }}>
              {pending} pending
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
          {!readOnly && bulkParents.length === 1 && canAct && (
            <button
              // subgroups[0].items, not individuals — individuals spans every
              // severity in this category, but the single bulk parent above
              // only resolves its own severity's items server-side (mirrors
              // the per-subgroup button below). Passing all individuals marked
              // mismatched-severity rows as "Applied" even though only the
              // matching-severity ones were actually sent to the backend.
              onClick={e => { e.stopPropagation(); handleGroupBulkAdd(subgroups[0].items, bulkParents[0]); }}
              disabled={bulkLoadingKey !== null || headerGroupAllAdded}
              className="flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-70"
              style={{ background: headerGroupAllAdded ? "#22c55e" : meta.color }}
            >
              {bulkLoadingKey === bulkParents[0].suggestion_id ? <Loader2 className="w-3 h-3 animate-spin" /> :
               headerGroupAllAdded ? <><CheckCircle2 className="w-3 h-3" /> All Added</> :
               <><Plus className="w-3 h-3" /> {bulkActionLabel}</>}
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>}

      {/* Subgroups — a category can carry more than one bulk parent (e.g. a
          "critical" all-fix and a separate "nice to have" all-fix). Each
          renders as its own labeled block so they never blur together. */}
      {(hideGroupHeader || open) && subgroups.map((sg, idx) => {
        const groupKey = sg.parent?.suggestion_id ?? `__leftover_${idx}`;
        const groupAllAdded = sg.items.length > 0 && sg.items.every(p => addedIds.has(p.suggestion_id));
        const isGroupLoading = bulkLoadingKey === groupKey;
        const sevMeta = sg.parent ? (SEVERITY_META[sg.parent.severity] ?? SEVERITY_META.important) : null;
        return (
          <div key={groupKey} className={idx > 0 ? "border-t-2 border-dashed border-slate-200" : ""}>
            {sg.parent && (
              <div className="bg-slate-50/60 p-3">
                <div
                  className="flex items-start gap-4 rounded-xl border-2 px-4 py-3 transition-all duration-300"
                  style={{
                    background: groupAllAdded ? "#f0fdf4" : "#fef9f3",
                    borderColor: groupAllAdded ? "#22c55e" : meta.color,
                  }}
                >
                  <span
                    className="mt-2 shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ background: groupAllAdded ? "#22c55e" : meta.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold" style={{ color: meta.color, background: meta.lightBg, borderColor: meta.border }}>
                        <Zap className="h-3.5 w-3.5" /> {multiBulk && sevMeta ? `${sevMeta.label} — Bulk Fix` : "Bulk Fix"}
                      </span>
                    </div>
                    <p className={`text-[14px] font-semibold leading-relaxed transition-all duration-300 ${groupAllAdded ? "text-green-700" : "text-gray-800"}`}>
                      {sg.parent.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                        Recover <span className="font-bold text-green-700">+{Math.abs(sg.parent.penalty).toFixed(1)} pts</span>
                      </span>
                    </div>
                    {/* sg.items.length > 0: subgroups pair a bulk parent with
                        individuals of the SAME severity, so a parent whose
                        severity matches nothing gets an empty item list. Its
                        button would render enabled (groupAllAdded is false on
                        an empty array) and then do nothing when clicked — no
                        request, no toast. Don't offer the action at all. */}
                    {!readOnly && canAct && sg.items.length > 0 && (
                      <button
                        onClick={() => handleGroupBulkAdd(sg.items, sg.parent)}
                        disabled={isGroupLoading || groupAllAdded}
                        className="flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-80"
                        style={{ background: groupAllAdded ? "#22c55e" : meta.color }}
                      >
                        {isGroupLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         groupAllAdded ? <><CheckCircle2 className="w-3 h-3" /> All Added</> :
                         <><Plus className="w-3 h-3" /> {bulkActionLabel}</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Individual items for this subgroup */}
            {sg.items.length > 0 && (
              <div className={`space-y-3 bg-slate-50/60 p-3 ${sg.parent ? "border-t-2 border-dashed border-slate-200 pt-4" : "border-t border-slate-100"}`}>
                {sg.items.map(p => {
                  const sev = SEVERITY_META[p.severity] ?? SEVERITY_META.important;
                  const isAdded = addedIds.has(p.suggestion_id);
                  const isBulkUnverified = isAdded && bulkAppliedIds.has(p.suggestion_id);
                  // Missing skills always preview red regardless of severity tier —
                  // "nice to have" used sev.color (#16a34a, green) even before being
                  // added, which read as already-done next to the real added=green state.
                  const isMissingSkill = isSkillActionable && !isAdded;
                  const isLoading = loadingIds.has(p.suggestion_id);
                  const canApplyTextFix = !!onApplyFix && isPenaltyApplyable(p);
                  const suggestionType = isSkillActionable ? "skill" : canApplyTextFix ? "fix" : "manual";
                  const manualSectionKey = suggestionType === "manual" ? categoryToSectionKey(p.category, p.target) : undefined;
                  const typeMeta = SUGGESTION_TYPE_META[suggestionType];
                  const TypeIcon = suggestionType === "manual" ? Lightbulb : suggestionType === "fix" ? Wrench : Plus;
                  return (
                    <div
                      key={p.suggestion_id}
                      className="flex items-start gap-4 rounded-xl border px-4 py-4 transition-all duration-300"
                      style={{
                        background: isAdded ? "#f0fdf4" : isMissingSkill ? "#fef2f2" : "#fff",
                        borderColor: isAdded ? "#bbf7d0" : isMissingSkill ? "#fecaca" : "#e2e8f0",
                      }}
                    >
                      {/* Dot */}
                      <span
                        className="mt-2 shrink-0 w-2 h-2 rounded-full"
                        style={{ background: isAdded ? "#22c55e" : isMissingSkill ? "#ef4444" : sev.color }}
                      />

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold"
                            style={{ color: typeMeta.color, background: typeMeta.bg, borderColor: typeMeta.border }}
                          >
                            <TypeIcon className="h-3 w-3" aria-hidden="true" />
                            {typeMeta.label}
                          </span>
                          {!isAdded && (
                            <span className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: sev.color, background: sev.bg }}>
                              {sev.label}
                            </span>
                          )}
                        </div>
                        <p className={`text-[13.5px] leading-relaxed transition-all duration-300 ${isAdded ? "text-green-700 line-through opacity-60" : "text-gray-700"}`}>
                          {p.message}
                        </p>
                        {p.before_example && p.after_example && p.before_example !== p.after_example && !isAdded && (
                          <div className="mt-3 grid gap-2">
                            <div className="rounded-lg border border-red-100 bg-red-50/70 p-3">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-500">Current text</p>
                              <p className="text-[12px] leading-relaxed text-red-700 line-through">{p.before_example}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                <ArrowRight className="h-3 w-3" /> Suggested text
                              </p>
                              <p className="text-[12px] leading-relaxed text-emerald-800">{p.after_example}</p>
                            </div>
                          </div>
                        )}
                        {isAdded && (
                          <p className={`text-[12px] font-semibold mt-1 flex items-center gap-1 ${isBulkUnverified ? "text-amber-600" : "text-green-600"}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isBulkUnverified ? "Applied — refresh to confirm in preview" : "Added to resume"}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        {p.penalty !== 0 && (
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                              Estimated <span className="font-bold text-green-700">+{Math.abs(p.penalty).toFixed(1)} pts</span>
                            </span>
                          </div>
                        )}

                        {!readOnly && (isSkillActionable ? !!p.target : canApplyTextFix) && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAdd(p)}
                              disabled={isAdded || isLoading}
                              className="flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-80"
                              style={{ background: isAdded ? "#22c55e" : meta.color }}
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                               isAdded ? <><CheckCircle2 className="w-3 h-3" /> {isBulkUnverified ? "Applied" : "Added"}</> :
                               <><Plus className="w-3 h-3" /> {suggestionType === "skill" ? "Add skill" : "Apply fix"}</>}
                            </button>
                            {isSkillActionable && onRemoveSkill && isAdded && (
                              <button
                                onClick={async () => {
                                  const ok = await onRemoveSkill(p.target!, p.suggestion_id);
                                  if (ok) {
                                    setAddedIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
                                    onSuggestionApplied?.(p.suggestion_id, false);
                                  } else toast.error("Couldn't remove this skill. Please try again.");
                                }}
                                className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
                              >
                                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Undo
                              </button>
                            )}
                            {/* Bulk-applied fixes excluded — see handleRemoveFix. */}
                            {!isSkillActionable && onRemoveFix && isAdded && !isBulkUnverified && (
                              <button
                                onClick={() => handleRemoveFix(p)}
                                disabled={removingIds.has(p.suggestion_id)}
                                className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {removingIds.has(p.suggestion_id)
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <RotateCcw className="h-3 w-3" aria-hidden="true" />}
                                Undo
                              </button>
                            )}
                          </div>
                        )}
                        {!readOnly && suggestionType === "manual" && manualSectionKey && onOpenSection && (
                          <button
                            onClick={() => onOpenSection(manualSectionKey)}
                            className="flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90"
                            style={{ background: meta.color }}
                          >
                            <Pencil className="w-3 h-3" /> Edit {prettifySectionKey(manualSectionKey)}
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
      })}
    </div>
  );
}

export default function MatchPenalties({ matchResult, onAddSkill, onRemoveSkill, onApplyFix, onRemoveFix, onOpenSection, readOnly, appliedSuggestionIds, onSuggestionApplied }: MatchPenaltiesProps) {
  const backendPenalties: Penalty[] = matchResult?.Match_Penalties?.penalties ?? [];

  // The backend flags a missing "technical_skills" field in Formatting_Check but,
  // unlike email/phone/location, never ships a suggest_add_contact_technical_skills
  // penalty for it. Synthesize one so it gets the same actionable "Edit Skills" card
  // as the other formatting gaps instead of sitting unfixable in Score Breakdown's reason text.
  const missingFormattingFields: string[] = matchResult?.Formatting_Check?.missing_fields ?? [];
  const hasTechnicalSkillsFix = backendPenalties.some(
    (p) => p.category === "formatting" && p.target === "technical_skills"
  );
  const penalties: Penalty[] = missingFormattingFields.includes("technical_skills") && !hasTechnicalSkillsFix
    ? [
        ...backendPenalties,
        {
          suggestion_id: "suggest_add_technical_skills_section",
          category: "formatting",
          severity: "nice_to_have",
          fix_type: "manual",
          penalty: 0,
          message: "Your resume is missing a dedicated Technical Skills section — add one so ATS parsers and recruiters can find your skills.",
          target: "technical_skills",
        },
      ]
    : backendPenalties;

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
    <section className="space-y-4 border-t border-[#e2e7ef] pt-1" aria-label="Actionable resume fixes">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-3">
        <div>
          <h3 className="text-[17px] font-extrabold text-[#1f2937]">Actionable fixes</h3>
          <p className="mt-0.5 text-[12.5px] text-slate-500">Apply the highest-impact changes directly to your resume.</p>
        </div>
        <span className="text-[12px] font-bold text-green-700 bg-[#f1fbf5] border border-[#ccebd8] px-3 py-1 rounded-full">
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
          onApplyFix={onApplyFix}
          onRemoveFix={onRemoveFix}
          onOpenSection={onOpenSection}
          readOnly={readOnly}
          appliedSuggestionIds={appliedSuggestionIds}
          onSuggestionApplied={onSuggestionApplied}
        />
      ))}
    </section>
  );
}
