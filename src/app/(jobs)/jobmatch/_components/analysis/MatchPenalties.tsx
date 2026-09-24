"use client";

import React, { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown, ChevronUp, Plus, CheckCircle2, Loader2, RotateCcw, Pencil,
  Briefcase, Code2, FileText, GraduationCap, Award, UsersRound, Target, ListChecks, Tag, Zap, FileCheck2,
  CircleAlert, Sparkles, Settings, Lightbulb, FileText as RecommendationIcon, Circle,
} from "lucide-react";
import { toast } from "sonner";
import { resultScore } from "./resultsSummary";
import recommendationStyles from "./Recommendations.module.css";

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

// The backend also emits pure informational notes into this same
// Match_Penalties.penalties array (e.g. "why your skills score may stay
// below 100%") that carry only category/message/label — no suggestion_id,
// severity, fix_type or penalty, despite the Penalty type above claiming
// those are always present (the array is cast from `any`, so TS can't catch
// this at compile time). True for a real, actionable/countable suggestion —
// false for one of those notes. Use this (not just !is_bulk_parent) anywhere
// we count "N suggestions" or sum recoverable points, so a note doesn't
// inflate a pending count or (via Math.abs(undefined) === NaN) silently
// corrupt a points total.
function isRealSuggestion(p: Penalty): boolean {
  return !!p.suggestion_id;
}

interface MatchPenaltiesProps {
  readonly recommendations?: boolean;
  readonly compact?: boolean;
  readonly expandAll?: boolean;
  readonly applyAllRef?: React.Ref<ApplyAllHandle>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly matchResult: any;
  /** Returns whether the skill was actually persisted server-side (not just applied to local state). */
  readonly onAddSkill: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  readonly onRemoveSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  /** Apply a non-skill fix (job title / summary / bullet rewrite). Returns whether it actually changed anything. */
  readonly onApplyFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  /** Undo a previously-applied non-skill fix. Returns whether it actually succeeded. */
  readonly onRemoveFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  /** Open the resume section editor (manual-fix suggestions with no auto-resolver route here). */
  readonly onOpenSection?: (sectionKey: string) => void;
  /** Hide the Add/Fix All/Improve action buttons and show suggestions as plain read-only text. */
  readonly readOnly?: boolean;
  /** suggestion_ids already applied in a previous session — seeds the "Added" state so it survives navigating away and back instead of resetting to "Apply fix". */
  readonly appliedSuggestionIds?: string[];
  /** Reports a suggestion_id's applied state changing (add or Undo) so the caller can persist it. */
  readonly onSuggestionApplied?: (suggestionId: string, applied: boolean) => void;
  /** suggestion_ids applied via a BULK parent in a previous session. Undo is not offered for these: the backend recorded only the parent id, so removing by a child id 404s. */
  readonly bulkAppliedSuggestionIds?: string[];
  /** Reports suggestion_ids that were just applied via a bulk parent, so the caller can persist their provenance. */
  readonly onBulkApplied?: (suggestionIds: string[]) => void;
  /** Which impact tier to show — controlled by the caller's own tab bar. Omit (or pass "all") to show every category unfiltered, e.g. for a read-only summary view with no tab bar of its own. */
  readonly impactFilter?: "all" | "high" | "medium" | "low";
}

export interface ApplyAllHandle {
  applyAll: () => Promise<boolean>;
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

// Categories with a bulk resolver on the backend (job_matcher.py's
// _BULK_TEXT_SUGGESTION_IDS: star_pattern/requirements/capabilities/
// certifications/leadership/experience — soft_skills has its own bulk id too
// but goes through the separate onAddSkill path below, not onApplyFix).
// Gates the per-category "Fix All" bulk button. Individual-row applyability
// is decided by isPenaltyApplyable below, which trusts the backend's own
// fix_type rather than re-deriving it from category — keep this list in sync
// with the backend set above for the bulk button, but it is not the source
// of truth for whether a single suggestion can be applied.
const TEXT_ACTIONABLE_CATEGORIES = new Set(["job_title", "summary", "requirements", "experience", "star_pattern", "certifications", "capabilities", "leadership"]);

// /enhance/apply always calls the AI layer for ANY suggestion_id, even when
// the deterministic resolver (_resolve_text_edit_ops in job_matcher.py) finds
// no before/after pair to rewrite — a bare "Demonstrate capability: X" with
// only a `target` and no example text still resolves through that AI call.
// So fix_type:"auto" from the backend IS the authoritative signal for "this
// suggestion_id can be applied", not any category list the frontend
// maintains — a hardcoded category whitelist drifts out of sync every time
// the backend adds a new resolvable category (this already happened twice:
// certifications, then capabilities). The category/before-after checks below
// stay only as a fallback for suggestions from before fix_type was reliably
// set.
function isPenaltyApplyable(p: Penalty): boolean {
  // A suggestion_id-less informational note (see isRealSuggestion) has
  // nothing for onApplyFix to resolve — never treat it as applyable, even if
  // it happens to land in a category/fix_type the checks below would
  // otherwise trust.
  if (!p.suggestion_id) return false;
  if (p.fix_type === "auto") return true;
  if (TEXT_ACTIONABLE_CATEGORIES.has(p.category)) return true;
  return !!(p.before_example && p.after_example && p.before_example !== p.after_example);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasAutomaticFixes(matchResult: any, appliedIds: string[]): boolean {
  return ((matchResult?.Match_Penalties?.penalties ?? []) as Penalty[]).some(item =>
    !item.is_bulk_parent && item.fix_type !== "manual" && !appliedIds.includes(item.suggestion_id) &&
    ((["technical_skills", "soft_skills"].includes(item.category) && !!item.target) || isPenaltyApplyable(item))
  );
}

// Same category set ScoreBreakdown.tsx uses (Hard Skills/Soft Skills/etc.) —
// same icons reused here so the two tabs read as one consistent system.
const CATEGORY_META: Record<string, { label: string; color: string; lightBg: string; border: string; icon: LucideIcon }> = {
  technical_skills: { label: "Technical Fixes", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Code2 },
  soft_skills:      { label: "Soft Skills", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: UsersRound },
  star_pattern:     { label: "STAR Bullets", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: ListChecks },
  capabilities:     { label: "Capabilities", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Target },
  job_title:        { label: "Job Title", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Tag },
  requirements:     { label: "Action Verbs", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Zap },
  experience:       { label: "Experience", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Briefcase },
  summary:          { label: "Summary", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: FileText },
  education:        { label: "Education", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: GraduationCap },
  certifications:   { label: "Certifications", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: Award },
  formatting:       { label: "ATS Formatting", color: "#2257A7", lightBg: "#EEF3FB", border: "#DCE3EB", icon: FileCheck2 },
};

function prettifyCategory(category: string): string {
  return category
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SEVERITY_META: Record<string, { label: string; color: string; bg: string }> = {
  critical:     { label: "critical",     color: "#B42318", bg: "#fef2f2" },
  important:    { label: "important",    color: "#92400E", bg: "#fffbeb" },
  nice_to_have: { label: "nice to have", color: "#167044", bg: "#f0fdf4" },
};

// Severity, reframed as the "Impact" filter/badge the reference design uses
// instead of the raw backend severity vocabulary. Same three tiers, just a
// friendlier label — no new information invented.
const IMPACT_META: Record<string, { label: string; filter: "high" | "medium" | "low"; color: string; bg: string }> = {
  critical:     { label: "High Impact",   filter: "high",   color: "#B42318", bg: "#FEF3F2" },
  important:    { label: "Medium Impact", filter: "medium", color: "#92400E", bg: "#FFFBEB" },
  nice_to_have: { label: "Low Impact",    filter: "low",    color: "#2257A7", bg: "#EEF3FB" },
};
const SEVERITY_RANK: Record<string, number> = { critical: 3, important: 2, nice_to_have: 1 };

// A category's overall severity/impact = the highest-severity individual
// item it still has outstanding — matches how the reference's per-category
// badge reads (one badge per category, not one per fix).
function dominantSeverity(items: Penalty[]): string {
  let best = "nice_to_have";
  let bestRank = 0;
  for (const p of items) {
    const rank = SEVERITY_RANK[p.severity] ?? 1;
    if (rank > bestRank) { bestRank = rank; best = p.severity; }
  }
  return best;
}

// Counts follow the category-level impact used by the visible filters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFixImpactCounts(matchResult: any) {
  const grouped: Record<string, Penalty[]> = {};
  for (const item of (matchResult?.Match_Penalties?.penalties ?? []) as Penalty[]) {
    if (!item.is_bulk_parent && isRealSuggestion(item)) (grouped[item.category] ??= []).push(item);
  }
  if (matchResult?.Formatting_Check?.missing_fields?.includes("technical_skills") &&
      !grouped.formatting?.some(item => item.target === "technical_skills")) {
    (grouped.formatting ??= []).push({ suggestion_id: "suggest_add_technical_skills_section", category: "formatting", severity: "nice_to_have", fix_type: "manual", penalty: 0, message: "", target: "technical_skills" });
  }
  const counts = { all: 0, high: 0, medium: 0, low: 0 };
  for (const items of Object.values(grouped)) {
    const impact = IMPACT_META[dominantSeverity(items)]?.filter ?? "low";
    counts[impact] += items.length;
    counts.all += items.length;
  }
  return counts;
}

// Table-row text derivation — our data doesn't carry separate "gap" vs
// "suggested improvement" fields the way the reference mockup assumes, so
// these compose the clearest honest phrasing from what a penalty actually
// has: a resolved before/after pair when one exists, the missing skill name
// for skill suggestions, or the backend's own message as a last resort.
function issueGapText(p: Penalty, isSkillActionable: boolean): string {
  if (isSkillActionable && p.target) return `${p.target} not mentioned`;
  if (p.before_example) return p.before_example;
  return p.message;
}
function suggestedImprovementText(p: Penalty, isSkillActionable: boolean): string {
  if (isSkillActionable && p.target) return `Add "${p.target}" to your skills section.`;
  if (p.after_example && p.after_example !== p.before_example) return p.after_example;
  return p.message;
}

// Shared bulk-action button content — used by both the single-parent header
// button and each per-subgroup button, which render identically.
function bulkButtonContent(isLoading: boolean, allAdded: boolean, label: string) {
  if (isLoading) return <Loader2 className="w-3 h-3 animate-spin" />;
  if (allAdded) return <><CheckCircle2 className="w-3 h-3" /> All Added</>;
  return <><Plus className="w-3 h-3" /> {label}</>;
}

// Per-item "Add skill" / "Apply fix" button content.
function actionButtonContent(isLoading: boolean, isAdded: boolean, isBulkUnverified: boolean, isManual: boolean) {
  if (isLoading) return <Loader2 className="w-3 h-3 animate-spin" />;
  if (isAdded) return <><CheckCircle2 className="w-3 h-3" /> {isBulkUnverified ? "Applied" : "Added"}</>;
  return <><Plus className="w-3 h-3" /> {isManual ? "Edit" : "Apply"}</>;
}

// One penalty as a table row — extracted from CategoryGroup's sg.items.map
// callback, same as before, just laid out as <tr>/<td> cells (Issue/Gap |
// Suggested Improvement | Est. Points | Action) instead of a stacked card.
function PenaltyRow({
  p, meta, isSkillActionable, isAdded, isBulkUnverified, isLoading, isRemoving,
  canApplyTextFix, readOnly, canRemoveSkill, canRemoveTextFix, onOpenSection,
  onAdd, onRemoveSkillClick, onRemoveTextFix, compact, recommendationIndex,
}: {
  p: Penalty;
  recommendationIndex?: number;
  compact?: boolean;
  meta: { label: string; color: string; lightBg: string; border: string };
  isSkillActionable: boolean;
  isAdded: boolean;
  isBulkUnverified: boolean;
  isLoading: boolean;
  isRemoving: boolean;
  canApplyTextFix: boolean;
  readOnly?: boolean;
  canRemoveSkill: boolean;
  canRemoveTextFix: boolean;
  onOpenSection?: (sectionKey: string) => void;
  onAdd: () => void;
  onRemoveSkillClick: () => void;
  onRemoveTextFix: () => void;
}) {
  let suggestionType: "skill" | "fix" | "manual";
  if (isSkillActionable) suggestionType = "skill";
  else if (canApplyTextFix) suggestionType = "fix";
  else suggestionType = "manual";

  const manualSectionKey = suggestionType === "manual" ? categoryToSectionKey(p.category, p.target) : undefined;
  const canPrimaryAction = isSkillActionable ? !!p.target : canApplyTextFix;
  const canUndo = (isSkillActionable && canRemoveSkill) || (!isSkillActionable && canRemoveTextFix && !isBulkUnverified);
  // Some penalties are informational-only (e.g. a partial-credit note with no
  // single fixable target) — no `target`/before-after pair to act on, and no
  // real point value either. Math.abs(undefined).toFixed(1) rendered "+NaN"
  // for these instead of just admitting there's no estimate.
  const hasAction = (suggestionType === "manual" && !!manualSectionKey && !!onOpenSection) || canPrimaryAction;
  const points = Number.isFinite(p.penalty) ? Math.abs(p.penalty) : null;

  return (
    <tr data-applied={isAdded}>
      {recommendationIndex !== undefined ? <>
        <td>{recommendationIndex}</td>
        <td>{suggestedImprovementText(p, isSkillActionable)}</td>
        <td><span className={recommendationStyles.priority} data-level={p.severity === "critical" ? "high" : p.severity === "important" ? "medium" : "low"}>{p.severity === "critical" ? "High" : p.severity === "important" ? "Medium" : "Low"}</span></td>
        <td className={recommendationStyles.impact}>{points === null ? "Not provided" : `+${points} pts`}</td>
      </> : <>
      {compact && <td className="font-semibold">{p.target || meta.label}</td>}
      <td className="min-w-[140px] px-4 py-3 align-top text-[14px] leading-snug text-slate-700">
        {issueGapText(p, isSkillActionable)}
      </td>
      <td className="min-w-[160px] px-4 py-3 align-top text-[14px] leading-snug text-[#526174]">
        {suggestedImprovementText(p, isSkillActionable)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-[14px] font-bold text-green-700">
        {points !== null ? compact ? `+${points} pts` : `+${points.toFixed(1)}` : <span className="font-normal text-slate-300">—</span>}
      </td>
      </>}
      <td className="px-4 py-3 align-top">
        {!hasAction ? (
          <span className="text-[12px] text-slate-300">—</span>
        ) : readOnly ? (
          isAdded && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Added</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {suggestionType === "manual" && manualSectionKey && onOpenSection ? (
              <button
                type="button"
                onClick={() => onOpenSection(manualSectionKey)}
                className="flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition-all hover:opacity-90"
                style={{ background: meta.color }}
              >
                <Pencil className="w-3 h-3" /> Edit {prettifySectionKey(manualSectionKey)}
              </button>
            ) : (
              canPrimaryAction && (
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={isAdded || isLoading}
                  className="flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-80"
                  style={{ background: isAdded ? "#167044" : meta.color }}
                >
                  {(compact || recommendationIndex !== undefined) && !isLoading && !isAdded ? "Apply Fix" : actionButtonContent(isLoading, isAdded, isBulkUnverified, false)}
                </button>
              )
            )}
            {isAdded && canUndo && (
              <button
                type="button"
                disabled={isRemoving}
                aria-label="Undo applied fix"
                onClick={isSkillActionable ? onRemoveSkillClick : onRemoveTextFix}
                className="flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-[#526174] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="h-3 w-3" aria-hidden="true" />}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function CategoryGroup({
  category, items, onAddSkill, onRemoveSkill, onApplyFix, onRemoveFix, onOpenSection, readOnly, appliedSuggestionIds, onSuggestionApplied, bulkAppliedSuggestionIds, onBulkApplied, defaultOpen, applyAllRef, compact, expandAll, sectionScore, recommendationIndexes,
}: {
  readonly compact?: boolean;
  readonly expandAll?: boolean;
  readonly sectionScore?: number | null;
  readonly recommendationIndexes?: Map<string, number>;
  readonly applyAllRef?: React.Ref<ApplyAllHandle>;
  readonly category: string;
  readonly items: Penalty[];
  readonly onAddSkill: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  readonly onRemoveSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  readonly onApplyFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  readonly onRemoveFix?: (suggestion_id: string, category: string) => Promise<boolean>;
  readonly onOpenSection?: (sectionKey: string) => void;
  readonly readOnly?: boolean;
  readonly appliedSuggestionIds?: string[];
  readonly onSuggestionApplied?: (suggestionId: string, applied: boolean) => void;
  readonly bulkAppliedSuggestionIds?: string[];
  readonly onBulkApplied?: (suggestionIds: string[]) => void;
  readonly defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (expandAll !== undefined) setOpen(expandAll); }, [expandAll]);
  // Seeded from the persisted appliedSuggestionIds so a suggestion applied in
  // a previous mount (before navigating away and back) still shows "Added"
  // instead of resetting to "Apply fix" — see onSuggestionApplied below.
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set(appliedSuggestionIds));
  // A skill can now also be added from the compact chip controls in
  // ScoreBreakdown's Suggestion card (same onAddSkill/onSuggestionApplied
  // handlers, different UI surface) — without this, addedIds stays frozen at
  // its mount-time seed and this row keeps showing "Add skill" even after the
  // chip control already added it, since the two controls share no state of
  // their own. One-directional merge (union, never remove) is enough: this
  // component's own adds already flow the other way via onSuggestionApplied.
  useEffect(() => {
    setAddedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of appliedSuggestionIds ?? []) {
        if (!next.has(id)) { next.add(id); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [appliedSuggestionIds]);
  // A bulk-parent apply rewrites all of a group's bullets server-side from
  // one call, but the frontend can only ever mirror a before/after pair keyed
  // to that SAME parent id into the live preview — it has no way to know
  // which (if any) specific child bullet that corresponds to. These ids are
  // still added to addedIds (so the button disables and it isn't re-applied),
  // but tracked separately so their row can say "applied, not yet confirmed
  // in preview" honestly instead of claiming the same verified "Added" state
  // an individually-applied fix gets.
  // Seeded from persisted provenance so a restored draft still knows which
  // children came from a bulk parent -- otherwise they render an Undo that
  // sends the child id the backend never recorded, and always 404s.
  const [bulkAppliedIds, setBulkAppliedIds] = useState<Set<string>>(() => new Set(bulkAppliedSuggestionIds));
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [bulkLoadingKey, setBulkLoadingKey] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const meta = CATEGORY_META[category] ?? { label: prettifyCategory(category), color: "#475569", lightBg: "#f8fafc", border: "#e2e8f0", icon: CircleAlert };
  // A category can carry MORE THAN ONE bulk parent — e.g. technical_skills
  // ships "suggest_add_critical_all_skills" AND "suggest_add_nice_to_have_all_skills"
  // side by side. Each bulk parent's `severity` matches the severity of the
  // individual items it summarizes, so pair them up instead of grabbing just
  // the first one (which used to leave the second "all" fix stranded, unlabeled,
  // among the plain individual rows).
  const bulkParents = items.filter(p => p.is_bulk_parent);
  // Kept separate from `individuals` on purpose: informational notes (no
  // suggestion_id) still render as a row below, but must not count toward
  // "N suggestions" or the recoverable-points total.
  const individuals = items.filter(p => !p.is_bulk_parent);
  const countableIndividuals = individuals.filter(isRealSuggestion);
  const isSkillActionable = category === "technical_skills" || category === "soft_skills";
  // Group-level: gates the "Fix All" bulk button, which calls the bulk
  // suggestion's own id — only meaningful for categories the backend's
  // _BULK_TEXT_SUGGESTION_IDS actually maps (star_pattern/requirements/experience).
  const categoryBulkActionable = !!onApplyFix && TEXT_ACTIONABLE_CATEGORIES.has(category);
  const canAct = isSkillActionable || categoryBulkActionable;
  const totalPts = Math.abs(countableIndividuals.reduce((a, p) => a + Math.abs(p.penalty ?? 0), 0))
    || Math.abs(bulkParents.reduce((a, p) => a + Math.abs(p.penalty ?? 0), 0));
  const pending = countableIndividuals.length - addedIds.size;
  const bulkActionLabel = isSkillActionable ? "Add all skills" : "Apply all fixes";
  const impact = IMPACT_META[dominantSeverity(individuals)] ?? IMPACT_META.important;

  const consumed = new Set<string>();
  const subgroups: { parent?: Penalty; items: Penalty[] }[] = bulkParents.map(bp => {
    const groupItems = individuals.filter(p => p.severity === bp.severity && !consumed.has(p.suggestion_id));
    groupItems.forEach(p => consumed.add(p.suggestion_id));
    return { parent: bp, items: groupItems };
  });
  const leftover = individuals.filter(p => !consumed.has(p.suggestion_id));
  if (leftover.length || subgroups.length === 0) subgroups.push({ items: leftover });
  const multiBulk = bulkParents.length > 1;

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

  // Undo an individually-applied skill add. Mirrors handleRemoveFix above,
  // extracted verbatim from the inline onClick it used to live in so the
  // per-item row can stay a small presentational component.
  const handleRemoveSkillClick = async (p: Penalty) => {
    if (!onRemoveSkill || removingIds.has(p.suggestion_id)) return;
    setRemovingIds(prev => new Set(prev).add(p.suggestion_id));
    try {
      const ok = await onRemoveSkill(p.target!, p.suggestion_id);
      if (ok) {
        setAddedIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
        onSuggestionApplied?.(p.suggestion_id, false);
      } else {
        toast.error("Couldn't remove this skill. Please try again.");
      }
    } finally {
      setRemovingIds(prev => { const n = new Set(prev); n.delete(p.suggestion_id); return n; });
    }
  };

  // The two branches handleGroupBulkAdd used to inline — split out so each
  // stays independently readable and the dispatcher's own complexity drops.
  const applyBulkTextFix = async (parent: Penalty, groupItems: Penalty[]) => {
    const applied = await onApplyFix!(parent.suggestion_id, category);
    if (!applied) {
      // onApplyFix already toasts the specific reason (rate limit, needs a
      // number, etc.) when it fails outright — but a cancelled fill-in-the-
      // blank prompt resolves `false` with no toast of its own, and this
      // button would otherwise just go quiet with nothing "pending" or
      // "added" changing, looking like a dead click.
      toast.error("This fix wasn't applied.");
      return;
    }
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
    onBulkApplied?.(groupItems.map(p => p.suggestion_id));
  };

  const applyBulkSkills = async (groupItems: Penalty[]) => {
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
        await applyBulkTextFix(parent, groupItems);
      } else {
        await applyBulkSkills(groupItems);
      }
    } finally { setBulkLoadingKey(null); }
  };

  React.useImperativeHandle(applyAllRef, () => ({
    async applyAll() {
      if (readOnly || bulkLoadingKey || loadingIds.size > 0) return false;
      // Reuse individual apply handlers, including persistence and manual-input checks.
      for (const item of individuals) {
        if (addedIds.has(item.suggestion_id) || item.fix_type === "manual") continue;
        if (!isSkillActionable && !isPenaltyApplyable(item)) continue;
        if (!(await handleAdd(item, { silent: true }))) return false;
      }
      return true;
    },
  }));

  if (individuals.length === 0) return null;

  if (recommendationIndexes) {
    return <>{individuals.filter(p => recommendationIndexes.has(p.suggestion_id)).map(p => <PenaltyRow
      key={p.suggestion_id}
      p={p}
      recommendationIndex={recommendationIndexes.get(p.suggestion_id)}
      meta={meta}
      isSkillActionable={isSkillActionable}
      isAdded={addedIds.has(p.suggestion_id)}
      isBulkUnverified={addedIds.has(p.suggestion_id) && bulkAppliedIds.has(p.suggestion_id)}
      isLoading={loadingIds.has(p.suggestion_id)}
      isRemoving={removingIds.has(p.suggestion_id)}
      canApplyTextFix={!!onApplyFix && isPenaltyApplyable(p)}
      readOnly={readOnly}
      canRemoveSkill={!!onRemoveSkill}
      canRemoveTextFix={!!onRemoveFix}
      onOpenSection={onOpenSection}
      onAdd={() => handleAdd(p)}
      onRemoveSkillClick={() => handleRemoveSkillClick(p)}
      onRemoveTextFix={() => handleRemoveFix(p)}
    />)}</>;
  }

  const Icon = compact && category === "technical_skills" ? Settings : meta.icon;

  return (
    <div data-fix-group data-compact={compact} className="overflow-hidden rounded-md border border-[#DCE3EB] bg-white">
      {/* Compact row header — icon, label, suggestion count, impact badge,
          total recoverable points, chevron. Matches ScoreBreakdown's row
          style so the two tabs read as one system. */}
      <div
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); }
        }}
        className="flex min-h-16 w-full cursor-pointer items-center gap-2.5 bg-[#f7fafc] px-3 py-2.5 hover:bg-[#eef4fa]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: meta.lightBg }}>
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div data-fix-title><p className="text-[14px] font-semibold leading-tight text-[#182230]">{compact ? category === "technical_skills" ? "Technical Skills" : category === "soft_skills" ? "Soft Skills" : prettifyCategory(category) : meta.label}</p>
          {compact && <span data-priority style={{color: impact.filter === "low" ? "#008453" : impact.color, background: impact.filter === "low" ? "#d9fae9" : impact.bg}}>{impact.label.replace("Impact", "Priority")}</span>}</div>
          <p className="mt-0.5 text-[12px] text-[#526174]">
            {pending > 0 ? `${pending} suggestion${pending === 1 ? "" : "s"}` : "All applied"}
          </p>
        </div>
        {!compact && <span
          className="hidden shrink-0 rounded px-2 py-1 text-[12px] font-semibold sm:inline-block"
          style={{ color: impact.color, background: impact.bg }}
        >
          {impact.label}
        </span>}
        <span className="shrink-0 text-[17px] font-extrabold text-green-700" style={compact ? {color: sectionScore == null ? "#74819c" : sectionScore >= 70 ? "#00ad7c" : sectionScore >= 60 ? "#ffb000" : "#f00043"} : undefined}>{compact ? sectionScore == null ? "N/A" : `${sectionScore}%` : `+${totalPts.toFixed(1)}`}</span>
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-400">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </div>

      {open && (
        <div className="border-t border-slate-100">
          {/* Bulk "Fix all" actions — one per severity subgroup that has a
              bulk parent, same handleGroupBulkAdd logic as before, just
              placed as compact buttons above the table instead of their own
              bordered cards. */}
          {!readOnly && canAct && subgroups.some(sg => sg.parent && sg.items.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              {subgroups.map((sg) => {
                if (!sg.parent || sg.items.length === 0) return null;
                const groupAllAdded = sg.items.every(p => addedIds.has(p.suggestion_id));
                const isGroupLoading = bulkLoadingKey === sg.parent.suggestion_id;
                const sevMeta = SEVERITY_META[sg.parent.severity] ?? SEVERITY_META.important;
                return (
                  <button
                    key={sg.parent.suggestion_id}
                    type="button"
                    onClick={() => handleGroupBulkAdd(sg.items, sg.parent)}
                    disabled={isGroupLoading || groupAllAdded}
                    className="flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-80"
                    style={{ background: groupAllAdded ? "#167044" : meta.color }}
                  >
                    {bulkButtonContent(isGroupLoading, groupAllAdded, multiBulk ? `${bulkActionLabel} (${sevMeta.label})` : bulkActionLabel)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f1f5f9] text-left text-[12px] font-semibold text-[#526174]">
                  {compact && <th scope="col">Skill / Issue</th>}
                  <th className="px-4 py-2 font-bold">{compact ? "Issue" : "Issue / Gap"}</th>
                  <th className="px-4 py-2 font-bold">Suggested Improvement</th>
                  <th className="px-4 py-2 font-bold">Est. Points</th>
                  <th className="px-4 py-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subgroups.flatMap(sg => sg.items).map(p => {
                  const isAdded = !!p.suggestion_id && addedIds.has(p.suggestion_id);
                  return (
                    <PenaltyRow
                      key={p.suggestion_id ?? `note-${category}-${p.message}`}
                      p={p}
                      compact={compact}
                      meta={meta}
                      isSkillActionable={isSkillActionable}
                      isAdded={isAdded}
                      isBulkUnverified={isAdded && bulkAppliedIds.has(p.suggestion_id)}
                      isLoading={loadingIds.has(p.suggestion_id)}
                      isRemoving={removingIds.has(p.suggestion_id)}
                      canApplyTextFix={!!onApplyFix && isPenaltyApplyable(p)}
                      readOnly={readOnly}
                      canRemoveSkill={!!onRemoveSkill}
                      canRemoveTextFix={!!onRemoveFix}
                      onOpenSection={onOpenSection}
                      onAdd={() => handleAdd(p)}
                      onRemoveSkillClick={() => handleRemoveSkillClick(p)}
                      onRemoveTextFix={() => handleRemoveFix(p)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchPenalties({ recommendations, compact, expandAll, matchResult, impactFilter, onAddSkill, onRemoveSkill, onApplyFix, onRemoveFix, onOpenSection, readOnly, appliedSuggestionIds, onSuggestionApplied, bulkAppliedSuggestionIds, onBulkApplied, applyAllRef }: MatchPenaltiesProps) {
  const groups = React.useRef(new Map<string, ApplyAllHandle>());
  const [recommendationFilter, setRecommendationFilter] = useState<"all" | "high" | "medium" | "low">("all");
  React.useImperativeHandle(applyAllRef, () => ({
    async applyAll() {
      for (const group of Array.from(groups.current.values())) {
        if (!(await group.applyAll())) return false;
      }
      return true;
    },
  }));
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

  if (!penalties.length && !recommendations) return null;

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

  // Visible categories — a category's impact is its highest-severity
  // outstanding individual item (mirrors dominantSeverity inside
  // CategoryGroup), filtered to whichever tier the caller's own tab bar
  // currently has selected.
  const individualsByCategory = sortedCategories.map(cat => grouped[cat].filter(p => !p.is_bulk_parent));
  const visibleCategories = sortedCategories.filter((_cat, idx) => {
    const items = individualsByCategory[idx];
    if (items.length === 0) return false;
    if (!impactFilter || impactFilter === "all") return true;
    return IMPACT_META[dominantSeverity(items)]?.filter === impactFilter;
  });

  if (recommendations) {
    const tier = (p: Penalty) => p.severity === "critical" ? "high" : p.severity === "important" ? "medium" : "low";
    // Informational notes (no suggestion_id) aren't a recommendation — they'd
    // otherwise show up here as a fake row with "Not provided" impact.
    const individualRows = sortedCategories.flatMap(cat => grouped[cat].filter(p => !p.is_bulk_parent && isRealSuggestion(p)));
    const isAutomatic = (p: Penalty) =>
      p.category === "technical_skills" || p.category === "soft_skills" ||
      (!!onApplyFix && isPenaltyApplyable(p));
    const orderedRows = [...individualRows].sort((a, b) => Number(isAutomatic(b)) - Number(isAutomatic(a)));
    const filteredRows = orderedRows.filter(p => recommendationFilter === "all" || tier(p) === recommendationFilter);
    const indexes = new Map(filteredRows.map((p, index) => [p.suggestion_id, index + 1]));
    const cards = [
      { level: "high", label: "High Impact Fixes", description: "Can significantly improve your score", Icon: Lightbulb },
      { level: "medium", label: "Medium Impact Fixes", description: "Good to have improvements", Icon: RecommendationIcon },
      { level: "low", label: "Additional Suggestions", description: "To make your resume stronger", Icon: Circle },
    ];
    return <section className={recommendationStyles.panel} aria-labelledby="recommendations-title">
      <header className={recommendationStyles.header}><div><h2 id="recommendations-title">Recommendations</h2><p>Actionable suggestions to improve your resume and increase your match score.</p></div><div className={recommendationStyles.filter}><select aria-label="Filter recommendations" value={recommendationFilter} onChange={event => setRecommendationFilter(event.target.value as typeof recommendationFilter)}><option value="all">All Recommendations</option><option value="high">High Impact Fixes</option><option value="medium">Medium Impact Fixes</option><option value="low">Additional Suggestions</option></select><ChevronDown size={16} aria-hidden="true"/></div></header>
      <div className={recommendationStyles.cards}>{cards.map(({level, label, description, Icon}) => <article key={level} data-level={level}><Icon aria-hidden="true"/><div><strong>{individualRows.filter(p => tier(p) === level).length}</strong><h3>{label}</h3><p>{description}</p></div></article>)}</div>
      <div className={recommendationStyles.tableScroll}><table className={recommendationStyles.table}><thead><tr><th scope="col">#</th><th scope="col">Recommendation</th><th scope="col">Priority</th><th scope="col" title="Estimated score points returned by the analysis">Est. Impact</th><th scope="col">Action</th></tr></thead><tbody>
        {orderedRows.map(p => <CategoryGroup key={p.suggestion_id} category={p.category} items={[p]} recommendationIndexes={indexes} applyAllRef={handle => { if (handle) groups.current.set(p.suggestion_id, handle); else groups.current.delete(p.suggestion_id); }} onAddSkill={onAddSkill} onRemoveSkill={onRemoveSkill} onApplyFix={onApplyFix} onRemoveFix={onRemoveFix} onOpenSection={onOpenSection} readOnly={readOnly} appliedSuggestionIds={appliedSuggestionIds} bulkAppliedSuggestionIds={bulkAppliedSuggestionIds} onBulkApplied={onBulkApplied} onSuggestionApplied={onSuggestionApplied}/>)}
      </tbody></table>{filteredRows.length === 0 && <p className={recommendationStyles.empty} role="status">{individualRows.length ? "No recommendations at this priority." : "No recommendations were returned for this analysis."}</p>}</div>
    </section>;
  }

  return (
    <section data-compact={compact} className="space-y-4" aria-label="Actionable resume fixes">
      {/* Header */}
      {!compact && <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="flex items-center gap-1.5 text-[17px] font-extrabold text-[#182230]">
            <Sparkles className="h-4 w-4 text-[#3A4F7A]" /> Actionable fixes
          </h3>
          <p className="mt-0.5 text-[12.5px] text-[#526174]">Apply the highest-impact changes directly to your resume.</p>
        </div>
        <span className="text-[12px] font-bold text-green-700 bg-[#f1fbf5] border border-[#ccebd8] px-3 py-1 rounded-full">
          Recover up to +{totalPenalty.toFixed(1)} pts
        </span>
      </div>}

      <div className="space-y-2">
        {visibleCategories.map((cat, idx) => (
          <CategoryGroup
            key={cat}
            applyAllRef={(handle) => { if (handle) groups.current.set(cat, handle); else groups.current.delete(cat); }}
            compact={compact}
            expandAll={expandAll}
            sectionScore={(() => {
              const keys: Record<string, string> = {technical_skills: "Technical_Skills_Check", soft_skills: "Soft_Skills_Check", experience: "Experience_Check", education: "Education_Check", certifications: "Certifications_Check", capabilities: "Capabilities_Check", summary: "Summary_Check", job_title: "Job_Title_Check", requirements: "Requirements_Check", star_pattern: "STAR_Pattern_Check", formatting: "Formatting_Check"};
              const section = matchResult?.[keys[cat]] ?? matchResult?.[cat === "technical_skills" ? "Technical_Skills" : cat === "soft_skills" ? "Soft_Skills" : ""];
              return section?.execution_failed ? null : resultScore(section?.match_score);
            })()}
            category={cat}
            items={grouped[cat]}
            defaultOpen={idx === 0}
            onAddSkill={onAddSkill}
            onRemoveSkill={onRemoveSkill}
            onApplyFix={onApplyFix}
            onRemoveFix={onRemoveFix}
            onOpenSection={onOpenSection}
            readOnly={readOnly}
            appliedSuggestionIds={appliedSuggestionIds}
            bulkAppliedSuggestionIds={bulkAppliedSuggestionIds}
            onBulkApplied={onBulkApplied}
            onSuggestionApplied={onSuggestionApplied}
          />
        ))}
        {visibleCategories.length === 0 && (
          <p className="px-1 py-6 text-center text-[14px] text-slate-400">No suggestions at this impact level.</p>
        )}
      </div>
    </section>
  );
}
