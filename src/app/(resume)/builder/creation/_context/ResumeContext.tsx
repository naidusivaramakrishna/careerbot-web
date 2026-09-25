"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { getResumeById } from "@/api/resumeApi";
import { httpClient } from "@/lib/http";
import { getEnhancedResume, applyFix, deleteFix, addSkillToEnhancedResume } from "@/api/enhancerApi";
import type { ATSScore, ATSSectionScore, ATSSectionDeduction, EnhancedSuggestion, EnhanceResumeResponse } from "@/types/api.types";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";
import { toast } from "sonner";
import { countryCodes } from "../_utils/sectionsConfig";
import { SUGGESTION_SECTION_MAP } from "../_utils/suggestionSection";
import { getEnhancedCurrentScore } from "../_utils/enhancedScore";

/** Accept both the documented `message` field and the AI service's
 * `after_example` wording. Older enhancer records contain the latter only. */
function normalizeEnhancedSuggestions(value: unknown): EnhancedSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): EnhancedSuggestion[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : "";
    const section = typeof raw.section === "string" ? raw.section : "";
    const message = [raw.message, raw.after_example, raw.suggestion, raw.description]
      .find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0)
      ?.trim();
    if (!id || !section || !message) return [];
    const rawFixType = typeof raw.fix_type === "string" ? raw.fix_type.trim().toLowerCase() : "";
    const fix_type = ["auto", "auto_fix", "autofix", "automatic"].includes(rawFixType)
      ? "auto"
      : rawFixType === "info"
        ? "info"
        : "manual";
    const ui_action = typeof raw.ui_action === "string" ? raw.ui_action : undefined;
    return [{
      id,
      section,
      message,
      fix_type,
      ...(ui_action ? { ui_action } : {}),
    }];
  });
}

/**
 * The ATS service exposes its active findings in more than one valid shape.
 * A full rescan commonly puts manual recommendations in
 * `ats_display.action_items`, while apply responses can use
 * `sections[].deductions`. Convert both to the suggestion-card contract used
 * by Score Breakdown so no active manual work is lost during a refresh.
 */
function suggestionsFromAtsDisplay(value: unknown): EnhancedSuggestion[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const display = value as Record<string, unknown>;
  const candidates: unknown[] = [];

  const actionItems = display.action_items;
  if (actionItems && typeof actionItems === "object" && !Array.isArray(actionItems)) {
    for (const [section, items] of Object.entries(actionItems as Record<string, unknown>)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const raw = item as Record<string, unknown>;
        candidates.push({
          ...raw,
          section: typeof raw.section === "string" && raw.section.trim() ? raw.section : section,
        });
      }
    }
  }

  if (Array.isArray(display.sections)) {
    for (const sectionValue of display.sections) {
      if (!sectionValue || typeof sectionValue !== "object" || Array.isArray(sectionValue)) continue;
      const section = sectionValue as Record<string, unknown>;
      const sectionName = typeof section.name === "string"
        ? section.name
        : typeof section.section === "string"
          ? section.section
          : "";
      if (!sectionName || !Array.isArray(section.deductions)) continue;
      for (const deduction of section.deductions) {
        if (!deduction || typeof deduction !== "object" || Array.isArray(deduction)) continue;
        const raw = deduction as Record<string, unknown>;
        candidates.push({
          ...raw,
          section: typeof raw.section === "string" && raw.section.trim() ? raw.section : sectionName,
        });
      }
    }
  }

  return normalizeEnhancedSuggestions(candidates);
}

/** Merge all returned finding sources, retaining each server ID once. */
function mergeEnhancedSuggestions(...sources: unknown[]): EnhancedSuggestion[] {
  const merged: EnhancedSuggestion[] = [];
  const seenIds = new Set<string>();
  for (const source of sources) {
    const normalized = Array.isArray(source)
      ? normalizeEnhancedSuggestions(source)
      : suggestionsFromAtsDisplay(source);
    for (const suggestion of normalized) {
      if (seenIds.has(suggestion.id)) continue;
      seenIds.add(suggestion.id);
      merged.push(suggestion);
    }
  }
  return merged;
}

function hasAtsDisplaySuggestions(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const display = value as Record<string, unknown>;
  if (display.action_items && typeof display.action_items === "object" && !Array.isArray(display.action_items)) {
    if (Object.values(display.action_items as Record<string, unknown>).some(Array.isArray)) return true;
  }
  return Array.isArray(display.sections) && display.sections.some((section) =>
    !!section && typeof section === "object" && !Array.isArray(section)
      && Array.isArray((section as Record<string, unknown>).deductions),
  );
}
/** Keep completed cards visible until the user explicitly undoes that fix.
 * A delayed/stale server response may still contain an old suggestion ID; it
 * must never turn a green card back into a pending card or make it disappear. */
function reconcileServerSuggestions(
  previous: EnhancedSuggestion[],
  serverSuggestions: EnhancedSuggestion[],
  appliedFixes?: Map<string, boolean>,
  hasAppliedFixLedger = false,
  _preservePreviouslyFixed = false,
  // A locally-pending card missing from `serverSuggestions` is kept by
  // default (see the loop below) because most callers here are PARTIAL
  // responses (an apply/delete-fix reply often only echoes the one item
  // that was touched) -- an omission there is not evidence the card was
  // resolved. Only set this true for a genuinely full, authoritative
  // snapshot (the enhancer GET's own suggestions list on load, not an
  // apply_fix/delete_fix response): there, a pending card the server no
  // longer lists really has been resolved, and keeping it forever (even
  // across reloads, since pending cards are persisted to localStorage) is
  // the P2 bug this flag fixes.
  dropMissingPending = false,
  // Suggestion `section` values just saved by the editor (see
  // EnhancedScoreSyncOptions.resolvedSuggestionSections). A pending card in
  // one of these sections missing from `serverSuggestions` is evidence it
  // was resolved by that save -- even though this response is otherwise
  // PARTIAL (dropMissingPending is false) -- so it becomes a green fixed
  // card instead of staying pending or being dropped.
  resolvedSections: Set<string> = new Set(),
): EnhancedSuggestion[] {
  // A suggestion the server list itself already marks "fixed" (see
  // resolveRemovedSkillDeductions) must stay fixed here too -- forcing every
  // entry to "pending" unconditionally discarded that status the moment this
  // same suggestion went through `retained` on a LATER sync (e.g. fixing a
  // second, unrelated skill), reverting an already-fixed card back to
  // pending and also preventing a newly-fixed one from ever showing fixed at
  // all, since both paths route through this map either way. A real backend
  // response never sets `status` (it isn't part of the API contract), so
  // this only ever applies to our own deliberately-marked entries.
  const serverById = new Map(
    serverSuggestions.map(suggestion => [
      suggestion.id,
      { ...suggestion, status: suggestion.status === "fixed" ? "fixed" as const : "pending" as const },
    ]),
  );
  const previousIds = new Set(previous.map(suggestion => suggestion.id));

  // Preserve the original display order. The previous implementation emitted
  // every pending card first and appended fixed cards last, which made a
  // successfully fixed Summary card appear to disappear below the viewport.
  const retained = previous.flatMap(suggestion => {
    const appliedUndoAvailable = appliedFixes?.get(suggestion.id);
    if (appliedUndoAvailable !== undefined) {
      return [{
        ...suggestion,
        status: "fixed" as const,
        undoAvailable: appliedUndoAvailable,
      }];
    }
    const fresh = serverById.get(suggestion.id);
    // A suggestion returned by the server is active again. This is the
    // essential Undo transition; local/session state must not keep it green.
    if (fresh) {
      // Applying one recommendation can return an older pending list for
      // unrelated sections. Keep locally server-confirmed cards fixed during
      // that apply reconciliation; only an explicit Undo may reopen them.
      if (suggestion.status === "fixed" && fresh.status !== "fixed") {
        return [{ ...fresh, status: "fixed" as const, undoAvailable: suggestion.undoAvailable }];
      }
      return [fresh];
    }
    // Apply responses may contain an applied-fixes ledger but only a PARTIAL
    // suggestions list (often just the item that was applied). An omitted
    // pending card is therefore not evidence that it was fixed. Keeping it
    // prevents one Summary auto fix from hiding the remaining manual fixes
    // and incorrectly changing the section progress to 100%.
    //
    // dropMissingPending flips this for a full, authoritative snapshot (see
    // the parameter's own comment): there, an omission genuinely means the
    // server has resolved it, and keeping it would leave a resolved card
    // stuck pending forever -- including across reloads, since pending
    // cards round-trip through localStorage.
    if (suggestion.status === "pending") {
      if (dropMissingPending) return [];
      // The editor just saved this suggestion's own section (see
      // resolvedSections above) and the fresh breakdown no longer lists it --
      // that omission is real evidence within this one section, even though
      // the response is otherwise partial. Show it fixed rather than
      // dropping it (an unrelated section's still-partial suggestions list
      // must not be treated as authoritative) or leaving it stuck pending.
      if (resolvedSections.has(suggestion.section)) {
        // Not backed by an applied-fix ledger entry (this is a section save,
        // not an /enhance/apply call), so there is nothing for an Undo
        // button to call -- explicitly false, not left as whatever the
        // suggestion's previous value happened to be.
        return [{ ...suggestion, status: "fixed" as const, undoAvailable: false }];
      }
      return [suggestion];
    }
    // A fixed card can be removed only by an explicit authoritative ledger
    // response (for example, an Undo). Legacy responses keep it visible.
    return hasAppliedFixLedger ? [] : [{ ...suggestion, status: "fixed" as const }];
  });
  const newlyIntroduced = serverSuggestions
    .filter(suggestion => !previousIds.has(suggestion.id))
    // A suggestion the server list itself already marks "fixed" (see
    // resolveRemovedSkillDeductions) must stay fixed even when it isn't in
    // `previous` yet -- e.g. right after a page reload, or once an earlier
    // bug had already dropped it from state entirely. Forcing "pending"
    // unconditionally here undid that status for exactly this case.
    .map(suggestion => suggestion.status === "fixed" ? suggestion : { ...suggestion, status: "pending" as const });
  return [...retained, ...newlyIntroduced];
}

// Array-of-items sections whose entries carry an optional backend `id`.
// syncEnhancedResumeData uses this list to avoid blindly overwriting a
// section with the server's copy -- see mergeSectionPreservingLocalIdLess.
const ID_KEYED_ARRAY_SECTIONS = [
  "education", "workExperience", "projects", "certifications", "achievements",
  "volunteering", "references", "internships", "awards", "hobbies",
  "interests", "languages", "publications", "patents",
] as const;

/**
 * Every skill/delete/apply broadcast used to spread the server's mapped
 * sections wholesale over local resumeData (`{...previous, ...mapped}`).
 * autosave only sends items that already have a backend id (a brand-new,
 * not-yet-saved entry is id-less and deliberately excluded -- see
 * triggerAutoSave in EditorTab.tsx), so a server response for an UNRELATED
 * mutation (e.g. deleting a Certification) never contains a project the
 * user just added in a different, still-open section. Overwriting that
 * section with the server's array silently discarded it.
 *
 * Keeps every server item (authoritative for anything with an id) and
 * re-appends any purely local id-less items the response doesn't know
 * about, instead of the section-owning caller having to scope every sync
 * to "just this one section" (the response shape varies too much across
 * call sites -- apply_fix, delete_fix, autosave, explicit save, GET -- to
 * do that reliably everywhere).
 */
function mergeSectionPreservingLocalIdLess<T extends { id?: unknown; _id?: unknown }>(
  serverItems: unknown,
  localItems: unknown,
): unknown {
  if (!Array.isArray(serverItems)) return serverItems;
  if (!Array.isArray(localItems)) return serverItems;
  const localIdLess = (localItems as T[]).filter(
    (item) => item && typeof item === "object" && !item.id && !item._id,
  );
  return localIdLess.length > 0 ? [...serverItems, ...localIdLess] : serverItems;
}

function markSuggestionFixed(
  suggestions: EnhancedSuggestion[],
  suggestionId: string,
): EnhancedSuggestion[] {
  return suggestions.map(suggestion =>
    suggestion.id === suggestionId
      ? { ...suggestion, status: "fixed" as const, undoAvailable: true }
      : suggestion,
  );
}

function currentSkillNames(resumeData: ResumeData): Set<string> {
  const names = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim()) names.add(value.trim().toLowerCase());
  };
  (resumeData.skills ?? []).forEach(add);
  const cats = resumeData.categorizedSkills;
  if (cats) {
    (["programming_languages", "frameworks", "soft_skills", "project_management", "marketing_sales"] as const)
      .forEach(key => (cats[key] ?? []).forEach(add));
    (cats.custom_categories ?? []).forEach(custom => (custom.skills ?? []).forEach(add));
  }
  return names;
}

/** Deleting a skill (deleteSkillFromEnhancedResume) persists the removal but
 * the backend never re-runs AI scoring, so any subsequent score/suggestion
 * sync (including the fallback GET after that delete's own broadcast event)
 * still carries the "'X' is listed but not demonstrated" deduction for a
 * skill that no longer exists anywhere in the resume.
 *
 * This must REMAP the matching entry to status "fixed", not drop it from the
 * list: reconcileServerSuggestions treats "server list doesn't have this id"
 * plus an applied_fixes ledger as "explicitly cleared, remove the card
 * entirely" (line ~78, `if (hasAppliedFixLedger) return [];`) -- an earlier
 * version of this function filtered the deduction out instead, which made
 * the fixed HTML/Java cards vanish from the suggestions list completely
 * instead of showing green, since no /enhance/apply call for this suggestion
 * ever populated a ledger entry for it. Marking it "fixed" here makes it
 * flow through reconcileServerSuggestions' `fresh` branch (line 72) with the
 * right status already attached. */
/** Reads current skill names directly out of a raw resume-shaped API payload
 * (technical_skills array and/or the categorized `skills` dict, including
 * nested custom-category groups). Returns null when the payload carries no
 * skills field at all, so the caller can fall back to resumeDataRef. Reading
 * the payload itself -- rather than the resumeData React state/ref -- avoids
 * a same-tick staleness race: syncEnhancedResumeData(latest) schedules a
 * resumeData update but React does not commit/re-render before the very next
 * line calls syncEnhancedScore(latest), so resumeDataRef.current there still
 * reflects the resume from BEFORE the just-fetched skill deletion. */
function extractSkillNamesFromResumePayload(payload: unknown): Set<string> | null {
  if (!payload || typeof payload !== "object") return null;
  const names = new Set<string>();
  let found = false;
  const addFrom = (value: unknown) => {
    if (!Array.isArray(value)) return;
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        names.add(item.trim().toLowerCase());
        found = true;
      } else if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const name = rec.skill ?? rec.name ?? rec.full_name;
        if (typeof name === "string" && name.trim()) {
          names.add(name.trim().toLowerCase());
          found = true;
        }
      }
    }
  };
  const rec = payload as Record<string, unknown>;
  addFrom(rec.technical_skills);
  const skillsDict = rec.skills;
  if (skillsDict && typeof skillsDict === "object" && !Array.isArray(skillsDict)) {
    for (const value of Object.values(skillsDict as Record<string, unknown>)) {
      addFrom(value);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.values(value as Record<string, unknown>).forEach(addFrom);
      }
    }
  }
  return found ? names : null;
}

function resolveRemovedSkillDeductions(
  suggestions: EnhancedSuggestion[],
  currentSkills: Set<string>,
  hasUndoInfo: (suggestionId: string) => boolean,
): EnhancedSuggestion[] {
  return suggestions.map(suggestion => {
    const match = suggestion.message.match(/^['"]([^'"]+)['"]\s+is listed but not demonstrated/i);
    if (!match || currentSkills.has(match[1].trim().toLowerCase())) return suggestion;
    // Undo only actually works when skillUndoInfoRef has this suggestion's
    // {skillName, category, removedDeductions} -- captured solely at the
    // moment Skills.tsx calls resolveSkillRemovedSuggestions. A skill
    // deleted in an earlier session (before this ref existed, or wiped by a
    // page reload) has no recovery data at all: showing Undo anyway made
    // the button lie -- it always fell through to the unrelated deleteFix
    // path, 404'd with "not found in applied history", and permanently
    // disabled itself. Only offer Undo when it can genuinely succeed.
    return { ...suggestion, status: "fixed" as const, undoAvailable: hasUndoInfo(suggestion.id) };
  });
}

/** A confirmed apply must stay fixed even if an older suggestions list repeats its ID. */
function reconcileConfirmedFix(
  previous: EnhancedSuggestion[],
  serverSuggestions: EnhancedSuggestion[] | null,
  suggestionId: string,
  hasExplicitSuggestionList: boolean,
): EnhancedSuggestion[] {
  const reconciled = hasExplicitSuggestionList && serverSuggestions
    ? reconcileServerSuggestions(previous, serverSuggestions, undefined, false, true)
    : previous;
  const fixed = markSuggestionFixed(reconciled, suggestionId);
  if (fixed.some(suggestion => suggestion.id === suggestionId)) return fixed;

  const original = previous.find(suggestion => suggestion.id === suggestionId);
  if (!original) return fixed;
  const insertionIndex = Math.min(Math.max(0, previous.findIndex(suggestion => suggestion.id === suggestionId)), fixed.length);
  return [
    ...fixed.slice(0, insertionIndex),
    { ...original, status: "fixed" as const, undoAvailable: true },
    ...fixed.slice(insertionIndex),
  ];
}
const FIXED_SUGGESTIONS_STORAGE_PREFIX = "careerbot:enhanced-fixed-suggestions:";

function loadFixedSuggestions(resumeId?: string): EnhancedSuggestion[] {
  if (!resumeId || typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(`${FIXED_SUGGESTIONS_STORAGE_PREFIX}${resumeId}`) ?? "[]") as unknown;
    return Array.isArray(stored)
      ? stored.filter((item): item is EnhancedSuggestion =>
        !!item && typeof item === "object"
        && typeof (item as EnhancedSuggestion).id === "string"
        && typeof (item as EnhancedSuggestion).section === "string"
        && typeof (item as EnhancedSuggestion).message === "string"
        && ((item as EnhancedSuggestion).status === "fixed" || (item as EnhancedSuggestion).status === "pending"),
      )
      : [];
  } catch {
    return [];
  }
}
import { getSectionOrder } from "../../../templates/_utils/sectionOrder";
import { getSkillsEditorDomain, resolveAccountEmail } from "../../../templates/_utils/activeTemplateDomain";
import { domainSkillKeyForSlug } from "@/config/domainSkills";
import logger from "@/lib/logger";

// Extract country code from a combined phone string like "+911234567890"
function splitPhone(phone: string): { countryCode: string; phoneNumber: string } {
  if (!phone || !phone.startsWith("+")) return { countryCode: "+91", phoneNumber: phone };
  // Sort by code length descending so longer codes match first (e.g., "+1-647" before "+1")
  const sorted = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (phone.startsWith(cc.code)) {
      return { countryCode: cc.code, phoneNumber: phone.slice(cc.code.length) };
    }
  }
  return { countryCode: "+91", phoneNumber: phone };
}

export interface CustomCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface CategorizedSkills {
  programming_languages: string[];
  frameworks: string[];
  soft_skills: string[];
  project_management: string[];
  marketing_sales: string[];
  custom_categories?: CustomCategory[];
  hidden_predefined_categories?: string[];
  // Maps "CategoryKey:SkillName" → backend skill ID for delete calls
  skill_id_map?: Record<string, string>;
  // Allow domain-specific skill categories (e.g., clinical_skills, penetration_testing, etc.)
  [key: string]: string[] | CustomCategory[] | Record<string, string> | undefined;
}

interface EnhancedScoreSyncOptions {
  /**
   * Section(s) just saved by the editor. A pending card in one of these
   * sections can become fixed only when the canonical returned breakdown no
   * longer contains its deduction. This keeps a resolved Summary card visible
   * instead of dropping it during the ordinary save response reconciliation.
   */
  resolvedSuggestionSections?: string[];
  /**
   * True when `score` is a full, authoritative enhancer snapshot (a GET),
   * not a partial apply/delete-fix response. See reconcileServerSuggestions'
   * dropMissingPending parameter -- only in that case is an omitted pending
   * card real evidence it was resolved.
   */
  isFullSnapshot?: boolean;
}

type BackendSkillItem = { id?: string; name?: string };
type BackendSkills = Record<string, BackendSkillItem[]>;

// Keys the loader's flat `skills` list already covers (or that are not skills).
const FLAT_SKILLS_EXCLUDED_KEYS = new Set([
  'programming_languages', 'frameworks', 'soft_skills', 'project_management', 'marketing_sales',
  'custom_categories', 'hidden_predefined_categories', 'skill_id_map',
]);

const EMPTY_CATEGORIZED_SKILLS: CategorizedSkills = {
  programming_languages: [],
  frameworks: [],
  soft_skills: [],
  project_management: [],
  marketing_sales: [],
};

/**
 * Flattens the backend's `customSkills` transport bucket without mutating it.
 * A null-prototype accumulator keeps user category names such as `constructor`
 * and `__proto__` safe. Flat and nested versions of the same category merge.
 */
export function expandNestedSkillBuckets(backendSkills: unknown): Record<string, unknown> {
  if (!backendSkills || typeof backendSkills !== "object" || Array.isArray(backendSkills)) return {};
  const source = backendSkills as Record<string, unknown>;
  const expanded = Object.create(null) as Record<string, unknown>;
  const append = (key: string, value: unknown) => {
    if (!Array.isArray(value)) {
      expanded[key] = value;
      return;
    }
    const existing = expanded[key];
    expanded[key] = Array.isArray(existing) ? [...existing, ...value] : [...value];
  };

  for (const [key, value] of Object.entries(source)) {
    if (key !== "customSkills" || !value || typeof value !== "object" || Array.isArray(value)) {
      append(key, value);
      continue;
    }
    for (const [category, skills] of Object.entries(value as Record<string, unknown>)) {
      append(category, skills);
    }
  }
  return expanded;
}
/**
 * @param domain Active skills domain (getSkillsEditorDomain). Its predefined
 *   categories are stored by the API under custom_skills[slug(label)]; they are
 *   mapped back to their editor key here so they round-trip. Slugs that are not
 *   a category of this domain stay custom categories, so nothing gets hidden.
 */
export function mapBackendSkillsToCategorized(backendSkills: unknown, domain?: string | null): CategorizedSkills {
  if (!backendSkills || typeof backendSkills !== 'object' || Array.isArray(backendSkills)) {
    return { ...EMPTY_CATEGORIZED_SKILLS };
  }
  const s = expandNestedSkillBuckets(backendSkills) as BackendSkills;
  const extractNames = (arr?: BackendSkillItem[]) =>
    (arr || []).map(i => i.name ?? '').filter(Boolean);

  const idMap: Record<string, string> = {};
  const buildIdMap = (key: string, arr?: BackendSkillItem[]) => {
    (arr || []).forEach(i => { if (i.id && i.name) idMap[`${key}:${i.name}`] = i.id; });
  };

  buildIdMap('programming_languages', s.programmingLanguages);
  buildIdMap('frameworks', s.frameworks);
  buildIdMap('soft_skills', s.softSkills);
  buildIdMap('project_management', s.projectManagement);
  buildIdMap('marketing_sales', s.marketingSales);

  // For custom/unknown category keys, populate skill_id_map using both the raw
  // camelCase key AND a display-name form so Skills.tsx lookup always finds the ID.
  const PREDEFINED = new Set([
    'programmingLanguages', 'frameworks', 'softSkills', 'projectManagement', 'marketingSales',
    'deletedCategories', 'deleted_categories', 'hiddenCategories', 'hidden_categories',
  ]);
  const customCategories: CustomCategory[] = [];
  const fixedCategoryKeys: Record<string, string> = {
    programmingLanguages: "programming_languages",
    programming_languages: "programming_languages",
    frameworks: "frameworks",
    softSkills: "soft_skills",
    soft_skills: "soft_skills",
    projectManagement: "project_management",
    project_management: "project_management",
    marketingSales: "marketing_sales",
    marketing_sales: "marketing_sales",
  };
  const deletedCategoryValues: unknown[] = [
    s.deletedCategories as unknown,
    s.deleted_categories as unknown,
    s.hiddenCategories as unknown,
    s.hidden_categories as unknown,
  ].flatMap(value => Array.isArray(value) ? value : []);
  const hiddenPredefinedCategories = Array.from(new Set(
    deletedCategoryValues
      .filter((value): value is string => typeof value === "string")
      .map(value => fixedCategoryKeys[value])
      .filter((value): value is string => Boolean(value)),
  ));

  // Storage uses slugs for custom categories. Preserve common professional
  // acronyms instead of title-casing them into misleading labels such as
  // "Ci Cd" or "Ai Ml" in the preview and exported resume.
  const categoryDisplayNameOverrides: Record<string, string> = {
    ci_cd: "CI/CD",
    ai_ml: "AI/ML",
  };
  // Convert camelCase or snake_case key to "Human Readable Name"
  const toDisplayName = (key: string) => {
    // Old records may contain a slug, an already-spaced title ("Ci Cd"), or
    // the original label ("CI/CD"). Normalize only for the lookup.
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return categoryDisplayNameOverrides[normalizedKey] ?? key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .replace(/^./, c => c.toUpperCase())
      .trim();
  };

  const domainCategories: Record<string, string[]> = {};

  const addCustomCategory = (key: string, items: BackendSkillItem[]) => {
    const domainKey = domainSkillKeyForSlug(key, domain);
    if (domainKey) {
      buildIdMap(domainKey, items);
      domainCategories[domainKey] = [...(domainCategories[domainKey] || []), ...extractNames(items)];
      return;
    }
    const displayName = toDisplayName(key);
    buildIdMap(key, items);
    buildIdMap(displayName, items);
    customCategories.push({
      id: `custom_backend_${key}`,
      name: displayName,
      skills: extractNames(items),
    });
  };

  Object.entries(s).forEach(([camelKey, items]) => {
    if (PREDEFINED.has(camelKey)) return;
    // Nested container: customSkills: { "dev_ops_tools": [{id, name}] }
    if (!Array.isArray(items) && typeof items === 'object' && items !== null) {
      Object.entries(items as Record<string, BackendSkillItem[]>).forEach(([subKey, subItems]) => {
        if (Array.isArray(subItems)) addCustomCategory(subKey, subItems);
      });
      return;
    }
    if (!Array.isArray(items)) return;
    addCustomCategory(camelKey, items as BackendSkillItem[]);
  });

  return {
    programming_languages: extractNames(s.programmingLanguages),
    frameworks: extractNames(s.frameworks),
    soft_skills: extractNames(s.softSkills),
    project_management: extractNames(s.projectManagement),
    marketing_sales: extractNames(s.marketingSales),
    ...domainCategories,
    ...(customCategories.length > 0 && { custom_categories: customCategories }),
    ...(hiddenPredefinedCategories.length > 0 && { hidden_predefined_categories: hiddenPredefinedCategories }),
    skill_id_map: idMap,
  };
}

export interface CustomField {
  id: string;
  fieldName: string;
  fieldType: "text" | "textarea" | "date" | "url" | "list";
  value: string | string[];
}

export interface CustomSection {
  id: string;
  sectionName: string;
  fields: CustomField[];
}

// Resume data structure
export interface ResumeData {
  resume_id?: string;
  personalInfo: {
    fullname: string;
    email: string;
    countryCode: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    dateOfBirth?: string;
    nationality?: string;
    category?: string;
    languages?: string;
    titlePrefix?: string;
    qualifications?: string;
    // Government Standard — India-specific
    fathersName?: string;
    maritalStatus?: string;
    gender?: string;
    permanentAddress?: string;
    // Healthcare
    specialisation?: string;
    medicalRegNo?: string;
    // Legal
    barEnrollmentNo?: string;
    yearOfEnrollment?: string;
    courtsOfPractise?: string;
    // Marine
    rank?: string;
    cocNumber?: string;
    stcwCertificates?: string;
    vesselTypes?: string;
    // Research Scholar
    orcidId?: string;
    googleScholarUrl?: string;
    hIndex?: string;
  };
  professionalSummary: {
    summary: string;
    targetRole: string;
  };
  education: {
    id?: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    scoreType?: "CGPA" | "Marks" | "GPA" | "Percentage";
    scoreValue?: string;
  }[];
  workExperience: {
    id?: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    location: string;
    technologies: string[];
  }[];
  projects: {
    id?: string;
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    link: string;
  }[];
  skills: string[];
  categorizedSkills?: CategorizedSkills;
  certifications: {
    id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  licenses: {
    id?: string;
    name: string;
    issuedBy: string;
    year: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  certificatesAndClearances: {
    id?: string;
    name: string;
    issuedBy: string;
    year: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  barAdmissionsAndLicenses: {
    id?: string;
    name: string;
    issuedBy: string;
    year: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  serviceRecord: {
    id?: string;
    service: string;
    batch: string;
    serviceNumber: string;
    currentDesignation: string;
    currentPosting: string;
    totalServiceDuration: string;
    careerProgression: string;
    status: string;
  }[];
  vesselsOperated: {
    id?: string;
    vesselType: string;
    vesselSize: string;
    crewSize: string;
    tenure: string;
    positionHeld: string;
  }[];
  portsExperience: {
    id?: string;
    portName: string;
    region: string;
    countryCode: string;
    portCalls: string;
  }[];
  seaServiceRecord: {
    id?: string;
    rankProgression: string;
    totalSeaService: string;
    licenseType: string;
    currentRank: string;
    currentStatus: string;
    verificationDate: string;
  }[];
  maritimeCertifications: {
    id?: string;
    certificateType: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string;
    rankLevel: string;
    verificationNumber: string;
  }[];
  researchGrants: {
    id?: string;
    grantTitle: string;
    fundingAgency: string;
    amount: string;
    startYear: string;
    endYear: string;
    role: string;
    status: string;
  }[];
  editorialActivities: {
    id?: string;
    activityType: string;
    organizationJournal: string;
    startYear: string;
    endYear: string;
    reviewCount: string;
  }[];
  conferencePresentations: {
    id?: string;
    presentationType: string;
    title: string;
    conferenceName: string;
    location: string;
    year: string;
  }[];
  achievements: {
    id?: string;
    title: string;
    date: string;
    description: string;
  }[];
  volunteering: {
    id?: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
  }[];
  references: {
    id?: string;
    name: string;
    relation: string;
    contact: string;
  }[];
  internships: {
    id?: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    location: string;
    technologies: string[];
  }[];
  awards: {
    id?: string;
    title: string;
    issuedBy: string;
    year: string;
  }[];
  hobbies: {
    id?: string;
    name: string;
    description: string;
    proficiencyLevel?: string;
    achievement?: string;
  }[];
  interests: {
    id?: string;
    name: string;
    description: string;
    category?: string;
  }[];
  languages: {
    id?: string;
    name: string;
    proficiency: string;
  }[];
  publications: {
    id?: string;
    title: string;
    authors: string;
    publicationName: string;
    date: string;
    url: string;
    doi?: string;
  }[];
  patents: {
    id?: string;
    title: string;
    patentNumber?: string;
    date?: string;
    description?: string;
    status?: string;
  }[];
  declaration?: string;
  declarationDate?: string;
  declarationPlace?: string;
  customSections?: CustomSection[];
  templateDomain?: string; // Domain from template (healthcare, legal, government, etc.)
}

// Style settings
export interface ResumeStyle {
  fontFamily: string;
  nameFontSize: string;
  headingFontSize: string;
  bodyFontSize: string;
  bold: boolean;
  italic: boolean;
  lineSpacing: string;
  headingColor: string;
  bodyColor: string;
  sectionHeaderBg?: string;
  accentColor?: string;
}

export type EnhancedAtsScore = ATSScore | null;

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  selectedTemplate: string | number | null;
  setSelectedTemplate: (id: string | number | null) => void;
  resumeStyle: ResumeStyle;
  setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
  lastUpdated: Date | null;
  resumeId: string | null;
  resumeSource: string | null;
  enhancedAtsScore: EnhancedAtsScore;
  enhancedSuggestions: EnhancedSuggestion[];
  /** Bumps only after a server-authoritative enhanced-resume mutation. */
  enhancedDataVersion: number;
  /** Bumps after a debounced autosave or explicit Save actually lands on
   * the backend (builder + enhanced). Use this, not resumeData, to trigger
   * anything that re-fetches PERSISTED state (e.g. PreviewPanel's
   * server-rendered /download preview) -- resumeData changes on every
   * keystroke, long before the backend has the new value. */
  resumeSavedVersion: number;
  bumpResumeSavedVersion: () => void;
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  previewCatalogueKey: string | null;
  setPreviewCatalogueKey: React.Dispatch<React.SetStateAction<string | null>>;
  createResume: () => Promise<void>;
  completionStatus: Record<string, boolean>;
  setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  getCompletionPercentage: () => number;
  isLoadingResume: boolean;
  addCustomSection: (section: CustomSection) => void;
  removeCustomSection: (id: string) => void;
  addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
  updateCustomFieldValue: (sectionId: string, fieldId: string, value: string | string[]) => void;
  deleteCustomField: (sectionId: string, fieldId: string) => void;
  applyAutoFix: (suggestionId: string) => Promise<{ beforeScore: number; afterScore: number; scoreConfirmed: boolean }>;
  applyManualFix: (suggestionId: string, value: string, origin?: "autosave") => Promise<void>;
  resolveSkillRemovedSuggestions: (skillName: string, category?: string) => void;
  undoFix: (suggestionId: string) => Promise<void>;
  removeEnhancedScoreSection: (sectionName: string) => void;
  restoreEnhancedScoreSection: (sectionName: string) => void;
  syncEnhancedScore: (score: unknown, options?: EnhancedScoreSyncOptions) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);


interface ResumeProviderProps {
  children: ReactNode;
  resumeId?: string;
  source?: string;
}

export const ResumeProvider = ({ children, resumeId: resumeIdProp, source }: ResumeProviderProps) => {
  const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail');
      const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
      const saved = localStorage.getItem(key);
      return saved || "2";
    }
    return "2";
  });

  const [enhancedAtsScore, setEnhancedAtsScore] = useState<EnhancedAtsScore>(null);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<EnhancedSuggestion[]>(() =>
    loadFixedSuggestions(resumeIdProp),
  );
  useEffect(() => {
    if (!resumeIdProp || typeof window === "undefined") return;
    const storageKey = `${FIXED_SUGGESTIONS_STORAGE_PREFIX}${resumeIdProp}`;
    // Persist the complete known issue list, not only green cards. Some apply
    // responses omit unrelated pending suggestions, and a remount must not
    // lose those manual fixes before the backend sends a complete list again.
    const storedSuggestions = enhancedSuggestions.filter(suggestion =>
      suggestion.status === "pending" || suggestion.status === "fixed",
    );
    if (storedSuggestions.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(storedSuggestions));
  }, [enhancedSuggestions, resumeIdProp]);
  // Guards against out-of-order apply-fix responses: each call bumps this ref;
  // a response whose id no longer matches the latest is dropped, so a slower,
  // older fix can't stomp the resume state written by a newer one.
  const latestFixRequestRef = useRef(0);
  // Background reloads are ordered so an older acknowledgement cannot overwrite a newer mutation snapshot.
  const latestEnhancedRefreshRef = useRef(0);

  const [resumeData, setResumeDataRaw] = useState<ResumeData>(() => {
    // ✅ If resumeId is provided, don't use localStorage (we'll load from backend)
    if (resumeIdProp && resumeIdProp !== 'null' && resumeIdProp !== 'undefined') {
      console.log("🔄 Resume ID provided, will load from backend:", resumeIdProp);
      return getEmptyResumeData(); // Return empty data, will be loaded from backend
    }

    // ✅ Only use localStorage for new resumes (no resumeId)
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('resumeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log("📥 Loaded resume data from localStorage");
          return parsed;
        } catch (error) {
          console.warn("⚠️ Failed to parse localStorage data");
        }
      }
    }

    return getEmptyResumeData();
  });

  const setResumeData = setResumeDataRaw;
  // Dereferenced fresh wherever it's read (unlike a plain closure variable),
  // so syncEnhancedScore -- a useCallback memoized on [enhancedAtsScore], not
  // resumeData -- always sees the latest skills even when called synchronously
  // after a resumeData update within the same event handler chain.
  const resumeDataRef = useRef(resumeData);
  resumeDataRef.current = resumeData;
  // Category key + skill name needed to re-add a skill on Undo, keyed by the
  // "not demonstrated" suggestion id it resolved. Populated only at the
  // moment of deletion (Skills.tsx), since that's the only place both are
  // known together -- the skill name alone (parseable from the suggestion
  // message) isn't enough to call addSkillToEnhancedResume, which requires
  // the category too. In-memory only: lost on reload, in which case undoFix
  // falls back to its existing "no undo record" handling for these ids.
  const skillUndoInfoRef = useRef<Record<string, {
    skillName: string;
    category: string;
    removedDeductions: { section: string; deduction: ATSSectionDeduction }[];
  }>>({});
  // Item editor components deliberately keep local drafts.  This revision lets
  // the active editor remount from the canonical server snapshot after an
  // apply/save/delete response, without remounting on normal typing.
  const [enhancedDataVersion, setEnhancedDataVersion] = useState(0);

  // Bumped by EditorTab right after a debounced autosave or an explicit Save
  // actually lands on the backend (both builder and enhanced flows). The
  // server-rendered builder preview (PreviewPanel's /download?... fetch)
  // reads this instead of resumeData directly: resumeData changes on every
  // keystroke, but /download always renders the PERSISTED resume, not the
  // request body -- keying the fetch on resumeData made it request a
  // pre-edit snapshot 1s after every edit (autosave takes 3s), so the
  // preview stayed permanently one edit behind, and brand-new entries
  // (stripped from autosave payloads until they have a backend id) never
  // appeared until an explicit Save. Keying on this version instead means
  // the preview only re-fetches once the backend actually has new data.
  const [resumeSavedVersion, setResumeSavedVersion] = useState(0);
  const bumpResumeSavedVersion = React.useCallback(() => {
    setResumeSavedVersion((version) => version + 1);
  }, []);

  // Helper function to return empty resume data
  function getEmptyResumeData(): ResumeData {
    return {
      personalInfo: {
        fullname: "",
        email: "",
        countryCode: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        githubUrl: "",
        portfolioUrl: "",
        dateOfBirth: "",
        nationality: "",
        category: "",
        languages: "",
        titlePrefix: "",
        qualifications: ""
      },
      professionalSummary: {
        summary: "",
        targetRole: ""
      },
      education: [],
      workExperience: [],
      projects: [],
      skills: [],
      categorizedSkills: {
        programming_languages: [],
        frameworks: [],
        soft_skills: [],
        project_management: [],
        marketing_sales: [],
      },
      certifications: [],
      licenses: [],
      certificatesAndClearances: [],
      barAdmissionsAndLicenses: [],
      serviceRecord: [],
      vesselsOperated: [],
      portsExperience: [],
      seaServiceRecord: [],
      maritimeCertifications: [],
      researchGrants: [],
      editorialActivities: [],
      conferencePresentations: [],
      achievements: [],
      volunteering: [],
      references: [],
      internships: [],
      awards: [],
      hobbies: [],
      interests: [],
      languages: [],
      publications: [],
      patents: [],
      declaration: "",
      declarationDate: "",
      declarationPlace: "",
      customSections: [],
    };
  }

  // Reads user-saved font prefs from localStorage and applies them on top of current style.
  // Called after template/catalogue defaults so the user's choice always wins.
  const _reapplySavedFontPrefs = (setter: React.Dispatch<React.SetStateAction<ResumeStyle>>) => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!stored) return;
      const saved = JSON.parse(stored) as Partial<ResumeStyle>;
      const overrides: Partial<ResumeStyle> = {};
      if (saved.fontFamily) overrides.fontFamily = saved.fontFamily;
      if (saved.lineSpacing) overrides.lineSpacing = saved.lineSpacing;
      if (Object.keys(overrides).length > 0) {
        setter(prev => ({ ...prev, ...overrides }));
      }
    } catch { /* ignore */ }
  };

  const DEFAULT_RESUME_STYLE: ResumeStyle = {
    fontFamily: "arial",
    nameFontSize: "20px",
    headingFontSize: "14px",
    bodyFontSize: "10px",
    bold: false,
    italic: false,
    lineSpacing: "1.0",
    headingColor: "#1A1A1A",
    bodyColor: "#4b5563",
  };

  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>(() => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) return { ...DEFAULT_RESUME_STYLE, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULT_RESUME_STYLE;
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  // ✅ NEW: Track if initial load is complete
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
    "Personal Info": false,
    "Professional Summary": false,
    "Skills": false,
    "Education": false,
    "Work Experience": false,
    "Projects": false,
    "Certifications": false,
    "Licenses and Credentials": false,
    "Certificates and Clearances": false,
    "Bar Admissions and Licenses": false,
    "Achievements": false,
    "Volunteering": false,
    "Internships": false,
    "Awards": false,
    "Hobbies": false,
    "Interests": false,
    "Languages": false,
    "Publications": false,
    "References": false,
  });

  // ✅ Get career level from localStorage to set initial section order
  const getCareerLevelFromStorage = (): string | undefined => {
    try {
      if (typeof window === 'undefined') return undefined;
      const userEmail = localStorage.getItem('userEmail');
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';

      const careerLevelStorage = localStorage.getItem(careerLevelKey);
      const appliedTemplateId = localStorage.getItem(selectedTemplateKey);

      console.warn("🔍 Getting career level - email:", userEmail, "templateId:", appliedTemplateId);
      console.warn("🔍 careerLevelStorage:", careerLevelStorage);

      if (careerLevelStorage && appliedTemplateId) {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{ id: string; name: string }>;
        const applied = careerLevels.find((t) => String(t.id) === String(appliedTemplateId));
        console.warn("🔍 Applied template found:", applied);
        if (applied?.name) {
          const templateName = applied.name.toLowerCase().trim();
          // Extract career level from template name like "Core Engineering - Fresher"
          let extractedLevel: string | undefined;

          // Canonical precedence: early career → fresher → architect → manager → lead → senior → mid
          if (templateName.includes('early') && templateName.includes('career')) {
            extractedLevel = 'early career';
          } else if (templateName.includes('fresher')) {
            extractedLevel = 'fresher';
          } else if (templateName.includes('architect')) {
            extractedLevel = 'architect';
          } else if (templateName.includes('manager')) {
            extractedLevel = 'manager';
          } else if (templateName.includes('lead')) {
            extractedLevel = 'lead';
          } else if (templateName.includes('senior')) {
            extractedLevel = 'senior-level';
          } else if (templateName.includes('mid')) {
            extractedLevel = 'mid-level';
          }

          console.warn("🔍 Extracted career level:", extractedLevel, "from template name:", applied.name);
          return extractedLevel;
        }
      }
    } catch (err) {
      console.warn("🔍 Error in getCareerLevelFromStorage:", err);
    }
    console.warn("🔍 No career level found, returning undefined");
    return undefined;
  };

  const [previewCatalogueKey, setPreviewCatalogueKey] = useState<string | null>(null);

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      // Try to load sectionOrder directly from localStorage first (set by DomainTemplatesModal)
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(sectionOrderKey) : null;

      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        console.warn("🎯 Loaded sectionOrder from localStorage:", parsed);
        return parsed;
      }
    } catch (err) {
      console.warn("🎯 Error loading sectionOrder from localStorage:", err);
    }

    // Fallback: compute from career level
    const careerLevel = getCareerLevelFromStorage();
    const order = getSectionOrder(careerLevel);
    return order;
  });

  // Persist resumeStyle to localStorage so font/spacing survive page refresh
  useEffect(() => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `resumeStyle_${userEmail}` : 'resumeStyle';
      localStorage.setItem(key, JSON.stringify(resumeStyle));
    } catch { /* ignore */ }
  }, [resumeStyle]);

  // ✅ Update section order when career level changes or template is switched
  useEffect(() => {
    // If user has a saved order in localStorage (e.g. after deleting a section), respect it
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(sectionOrderKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setSectionOrder(parsed);
        return;
      }
    } catch { /* ignore */ }
    // No saved order — compute from career level (first visit or after clearing storage)
    const careerLevel = getCareerLevelFromStorage();
    const newOrder = getSectionOrder(careerLevel);
    setSectionOrder(newOrder);
  }, [resumeIdProp, selectedTemplate]); // Re-check when resumeId or selectedTemplate changes

  // ✅ Monitor localStorage changes for template switches (from other components)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastCheckTime = 0;
    const handleStorageChange = () => {
      const now = Date.now();
      if (now - lastCheckTime < 1000) return; // Only check once per second
      lastCheckTime = now;

      try {
        // Try to load sectionOrder from localStorage first
        const userEmail = localStorage.getItem('userEmail');
        const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
        const stored = localStorage.getItem(sectionOrderKey);

        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          console.warn("📋 Storage check - loaded sectionOrder from localStorage:", parsed);
          setSectionOrder(parsed);
          return;
        }
      } catch (err) {
        console.warn("📋 Error loading sectionOrder from localStorage:", err);
      }

      // Fallback: compute from career level
      const careerLevel = getCareerLevelFromStorage();
      const newOrder = getSectionOrder(careerLevel);
      console.warn("📋 Storage check - careerLevel:", careerLevel, "newOrder:", newOrder);
      setSectionOrder(newOrder);
    };

    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIXED: Only save to localStorage AFTER initial load is complete
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData && resumeData) {
      try {
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
      } catch (error) {
        // Failed to save resume data to localStorage
      }
    }
  }, [resumeData, hasLoadedInitialData]);

  // ✅ NEW: Save data before page unload (backup save)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData) {
      const handleBeforeUnload = () => {
        try {
          localStorage.setItem('resumeData', JSON.stringify(resumeData));
          // // console.log("💾 Resume data backup saved before unload");
        } catch (error) {
          // // console.error("❌ Failed to backup save resume data:", error);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [resumeData, hasLoadedInitialData]);

  // Template persistence
  useEffect(() => {
    if (selectedTemplate !== null) {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
      localStorage.setItem(key, String(selectedTemplate));
    }
  }, [selectedTemplate]);

  const setSelectedTemplate = async (id: string | number | null) => {
    setSelectedTemplateState(id);
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const key = userEmail ? `selected_template_${userEmail}` : 'selected_template';
    if (id !== null) {
      localStorage.setItem(key, String(id));
    } else {
      localStorage.removeItem(key);
    }
  };

  // ✅ Parallelize template initialization and resume loading for better performance
  useEffect(() => {
    const initializeBuilder = async () => {
      // ✅ Use resumeId from prop (URL param) instead of localStorage
      const resumeId = resumeIdProp;

      if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true);
        return;
      }

      try {
        setIsLoadingResume(true);

        // ✅ Check for cached resume data first (for instant loading after creation)
        const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem("cached_resume_data") : null;
        let data;

        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            // Only use cache if it belongs to this exact resumeId
            if (cached?.resumeId === resumeId) {
              data = cached.data;
              localStorage.removeItem("cached_resume_data");
            } else {
              // Stale cache for a different resume — discard and fetch fresh
              localStorage.removeItem("cached_resume_data");
            }
          } catch {
            localStorage.removeItem("cached_resume_data");
          }
        }

        // ✅ Parallelize API calls: fetch template and resume data simultaneously
        // The account email scopes the applied career-level template, i.e. the
        // domain the skills are mapped for (same source as PreviewPanel).
        const [defaultTemplateData, resumeData, accountEmail] = await Promise.all([
          (async () => {
            try {
              const { getDefaultTemplate } = await import("@/api/resumeApi");
              return await getDefaultTemplate();
            } catch (error) {
              console.warn("Failed to fetch default template, will use fallback", error);
              return null;
            }
          })(),
          (async () => {
            // For enhanced resumes, always fetch from API — cached data is flat
            // (no enhanced_data / ats_score) and would break the score tab on first load.
            if (data && source !== "enhanced") return data;
            if (source === "enhanced") {
              return await getEnhancedResume(resumeId);
            } else {
              return await getResumeById(resumeId);
            }
          })(),
          resolveAccountEmail(),
        ]);

        // Process resume data
        let processedData;
        // The persisted enhanced-resume endpoint returns `enhanced_data`, while
        // the ATS apply/enhance flow returns the same resume under
        // `enhancer_state.resume`. Both are valid enhanced-resume snapshots.
        // Treating the latter as an ordinary builder response leaves all mapped
        // fields undefined and produces an empty editor/preview.
        const enhancedResponse = resumeData as unknown as Record<string, unknown> | undefined;
        const enhancerState = enhancedResponse?.enhancer_state as Record<string, unknown> | undefined;
        const enhancedPayload = (
          enhancedResponse?.enhanced_data
          ?? enhancerState?.resume
          ?? enhancedResponse?.enhanced_resume
        ) as Record<string, unknown> | undefined;
        if (source === "enhanced" && enhancedPayload) {
          // The server's top-level enhanced_data is the canonical resume. Do
          // not overlay the old enhanced_sections transport wrapper here: a
          // legacy wrapper can retain a project that was already deleted from
          // the database and make it reappear only in the browser.
          const enhancedDataWithFallback = {
            ...enhancedPayload,
            enhancer_state: enhancerState,
          };
          const mapped = mapParserOutputToBuilderData(enhancedDataWithFallback);
          processedData = {
            ...mapped,
            id: resumeData.id ?? resumeId,
            personalInfo: {
              ...mapped.personalInfo,
              fullname: mapped.personalInfo?.fullname || resumeData.display_name || "",
            },
          };
          // A completed ATS rescan can be cached before the enhanced-resume
          // read model catches up. Use only a cache payload tied to this exact
          // enhanced resume so findings cannot leak between resumes.
          const cachedAtsAnalysis = (() => {
            try {
              const raw = localStorage.getItem("atsAnalysisData");
              if (!raw) return undefined;
              const cached = JSON.parse(raw) as Record<string, unknown>;
              return cached.enhanced_resume_id === resumeIdProp ? cached : undefined;
            } catch { return undefined; }
          })();
          const cachedEnhancerState = cachedAtsAnalysis?.enhancer_state as Record<string, unknown> | undefined;
          const resolvedAtsScore = resumeData.ats_score
            ?? enhancerState?.ats_breakdown
            ?? cachedAtsAnalysis?.ats_score
            ?? cachedEnhancerState?.ats_breakdown
            ?? null;
          const loadedAtsDisplay =
            (resumeData.ats_display as { score?: number; sections?: unknown[] } | undefined) ??
            (enhancerState as { ats_display?: { score?: number; sections?: unknown[] } } | undefined)?.ats_display ??
            (cachedAtsAnalysis?.ats_display as { score?: number; sections?: unknown[] } | undefined) ??
            (cachedEnhancerState?.ats_display as { score?: number; sections?: unknown[] } | undefined);
          let normalizedLoadedScore = loadedAtsDisplay
            ? buildScoreFromAtsDisplay(loadedAtsDisplay, resolvedAtsScore)
            : resolvedAtsScore;
          // Backfill the missing-section deduction for records deleted before
          // reversible section scoring was introduced. Their persisted row is
          // already 0%, but older code stored deductions: [], which left no
          // explanation and no Fix Now action after reload.
          if (normalizedLoadedScore?.section_breakdown) {
            const sectionDataByToken: Record<string, unknown> = {
              projects: mapped.projects,
              certifications: mapped.certifications,
              internships: mapped.internships,
              workexperience: mapped.workExperience,
              experience: mapped.workExperience,
              achievements: mapped.achievements,
              awards: mapped.awards,
              volunteering: mapped.volunteering,
              education: mapped.education,
              languages: mapped.languages,
            };
            const missingMessages: Record<string, string> = {
              projects: "Add at least one project that demonstrates relevant skills and measurable results.",
              certifications: "Add at least one certification relevant to your role.",
              internships: "Add at least one internship or practical experience entry.",
              workexperience: "Add at least one relevant work experience entry.",
              experience: "Add at least one relevant work experience entry.",
              achievements: "Add at least one relevant achievement.",
              awards: "Add at least one relevant award.",
              volunteering: "Add at least one volunteering experience.",
              education: "Add at least one education entry.",
              languages: "Add at least one language and proficiency level.",
            };
            const restoredBreakdown = Object.fromEntries(
              Object.entries(normalizedLoadedScore.section_breakdown).map(([name, section]) => {
                const token = name.toLowerCase().replace(/[^a-z0-9]/g, "");
                const data = sectionDataByToken[token];
                const percentage = section.percentage ?? 0;
                if (percentage > 0 || !Array.isArray(data) || data.length > 0 || section.deductions?.length) {
                  return [name, section];
                }
                const message = missingMessages[token] ?? `Add content to the ${name} section.`;
                return [name, {
                  ...section,
                  deductions: [{
                    id: `section-deleted-${token}`,
                    penalty: Number(section.weight ?? 0),
                    message,
                    after_example: message,
                  }],
                }];
              }),
            );
            normalizedLoadedScore = {
              ...normalizedLoadedScore,
              section_breakdown: restoredBreakdown,
            };
          }
          if (normalizedLoadedScore) {
            // A score snapshot is one atomic value: headline and section rows
            // must come from the same ats_display calculation. Previously only
            // the headline was refreshed, leaving stale 0% section bars.
            setEnhancedAtsScore(normalizedLoadedScore);
          }
          // The enhancer's suggestion list is authoritative: unlike section
          // deductions it carries whether a fix is `auto` or `manual`.
          // Derive cards from deductions only for legacy responses that do
          // not include a suggestions list at all.
          const serverSuggestions = mergeEnhancedSuggestions(
            resumeData.suggestions,
            (enhancerState as { suggestions?: EnhancedSuggestion[] } | undefined)?.suggestions,
            normalizedLoadedScore?.suggestions,
            cachedAtsAnalysis?.suggestions,
            (cachedAtsAnalysis?.ats_breakdown as { suggestions?: EnhancedSuggestion[] } | undefined)?.suggestions,
            cachedEnhancerState?.suggestions,
            (cachedEnhancerState?.ats_breakdown as { suggestions?: EnhancedSuggestion[] } | undefined)?.suggestions,
            loadedAtsDisplay,
          );
          // The stored score/suggestion snapshot is never rescored after a
          // skill delete (see resolveRemovedSkillDeductions), so a fresh
          // load can still surface a "not demonstrated" card for a skill the
          // freshly-fetched resume (mapped) no longer has at all.
          const loadedSkillNames = currentSkillNames(mapped as unknown as ResumeData);
          if (serverSuggestions.length > 0) {
            // This is the full enhancer GET on load -- the one case where a
            // previously-pending card (including one just re-seeded from
            // localStorage) that the server no longer lists really has been
            // resolved. See reconcileServerSuggestions' dropMissingPending
            // parameter.
            setEnhancedSuggestions(previous => reconcileServerSuggestions(
              previous,
              resolveRemovedSkillDeductions(
                serverSuggestions,
                loadedSkillNames,
                id => Boolean(skillUndoInfoRef.current[id]),
              ),
              undefined,
              false,
              false,
              true,
            ));
          } else {
            // A score-only or partial refresh is not evidence that every
            // pending recommendation was resolved. Keep the known server-
            // issued cards so an auto fix cannot erase unrelated manual fixes.
            setEnhancedSuggestions(previous => previous);
          }
        } else {
          processedData = resumeData || data;
        }

        // ✅ Set default template (with fallback to clean_simple)
        const { TEMPLATE_DEFAULT_STYLES, STYLE_CATALOGUES } = await import("../_utils/templateStyles");
        try {
          // The enhanced record owns its initial template. Fall back to the
          // application default only for legacy records that predate it.
          const persistedTemplateId = (resumeData as { template_id?: unknown } | undefined)?.template_id;
          const templateId = String(
            (typeof persistedTemplateId === "string" && persistedTemplateId.trim())
              ? persistedTemplateId
              : (defaultTemplateData?.template_id || defaultTemplateData?.id || "clean_simple"),
          );
          await setSelectedTemplate(templateId);

          // Apply template defaults for styling
          const defaults = TEMPLATE_DEFAULT_STYLES[templateId];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));

          // Apply catalogue color/font overrides on top
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
          // Apply user-picked custom colour (from browse-templates colour picker).
          // Eclipse → sectionHeaderBg; all others → accentColor (section names use accentColor ?? headingColor,
          // so headingColor stays #000000 and role/degree titles remain black).
          if (typeof window !== 'undefined' && selectedCatalogue) {
            if (selectedCatalogue === 'eclipse') {
              const sectionBg = localStorage.getItem('selected_section_bg');
              // Clear accentColor so Eclipse-specific sectionHeaderBg doesn't coexist with a stale accent
              setResumeStyle(prev => ({ ...prev, sectionHeaderBg: sectionBg ?? undefined, accentColor: undefined }));
            } else {
              const accent = localStorage.getItem(`selected_color_${selectedCatalogue}`);
              // Clear sectionHeaderBg so a previous Eclipse session's value doesn't bleed into other catalogues
              setResumeStyle(prev => ({ ...prev, accentColor: accent ?? undefined, sectionHeaderBg: undefined }));
            }
          }
          // Re-apply user's saved font/spacing — must come last so template defaults don't overwrite them
          _reapplySavedFontPrefs(setResumeStyle);
        } catch {
          await setSelectedTemplate("clean_simple");
          const defaults = TEMPLATE_DEFAULT_STYLES["clean_simple"];
          if (defaults) setResumeStyle(prev => ({ ...prev, ...defaults }));

          // Apply catalogue if selected
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
          if (typeof window !== 'undefined' && selectedCatalogue) {
            if (selectedCatalogue === 'eclipse') {
              const sectionBg = localStorage.getItem('selected_section_bg');
              setResumeStyle(prev => ({ ...prev, sectionHeaderBg: sectionBg ?? undefined, accentColor: undefined }));
            } else {
              const accent = localStorage.getItem(`selected_color_${selectedCatalogue}`);
              setResumeStyle(prev => ({ ...prev, accentColor: accent ?? undefined, sectionHeaderBg: undefined }));
            }
          }
          // Re-apply user's saved font/spacing — must come last so template defaults don't overwrite them
          _reapplySavedFontPrefs(setResumeStyle);
        }

        // Continue with resume data processing...
        data = processedData;

        // Split combined phone (e.g. "+911234567890") into countryCode and phone
        const { countryCode: parsedCode, phoneNumber: parsedPhone } = splitPhone(data.personalInfo?.phone || "");

        // Backend may return countryCode as ISO2 ("IN") or as a dialing code ("+91").
        // Only trust the stored value when it's already a dialing code; otherwise use
        // the dialing code extracted from the E.164 phone string by splitPhone.
        const storedCodeInitial = data.personalInfo?.countryCode || "";
        const resolvedCodeInitial = storedCodeInitial.startsWith("+") ? storedCodeInitial : (parsedCode || "+91");

        // Normalize MongoDB's _id to id for all section items
        const normalizeId = <T extends Record<string, unknown>>(items: T[]): T[] =>
          items.map(item => (!item.id && item._id) ? { ...item, id: item._id } : item);

        const loadedData: ResumeData = {
          resume_id: data.id,
          personalInfo: {
            fullname: data.personalInfo?.fullname || data.personalInfo?.name || data.personalInfo?.full_name || "",
            email: data.personalInfo?.email || "",
            countryCode: resolvedCodeInitial,
            phone: parsedPhone || "",
            location: data.personalInfo?.location || "",
            linkedinUrl: data.personalInfo?.linkedinUrl || "",
            githubUrl: data.personalInfo?.githubUrl || "",
            portfolioUrl: (data.personalInfo as Record<string, string>)?.portfolioUrl || data.personalInfo?.portifolioUrl || "",
            dateOfBirth: data.personalInfo?.dateOfBirth || null,
            nationality: data.personalInfo?.nationality || null,
            category: data.personalInfo?.category || null,
            languages: data.personalInfo?.languages || null,
            titlePrefix: data.personalInfo?.titlePrefix || null,
            qualifications: data.personalInfo?.qualifications || null,
            // Domain-specific fields (government / healthcare / legal / marine /
            // research). The API returns them in personalInfo; dropping them here
            // blanked the Personal Info form after every reload.
            fathersName: data.personalInfo?.fathersName || null,
            gender: data.personalInfo?.gender || null,
            maritalStatus: data.personalInfo?.maritalStatus || null,
            permanentAddress: data.personalInfo?.permanentAddress || null,
            specialisation: data.personalInfo?.specialisation || null,
            medicalRegNo: data.personalInfo?.medicalRegNo || null,
            barEnrollmentNo: data.personalInfo?.barEnrollmentNo || null,
            yearOfEnrollment: data.personalInfo?.yearOfEnrollment || null,
            courtsOfPractise: data.personalInfo?.courtsOfPractise || null,
            rank: data.personalInfo?.rank || null,
            cocNumber: data.personalInfo?.cocNumber || null,
            vesselTypes: data.personalInfo?.vesselTypes || null,
            stcwCertificates: data.personalInfo?.stcwCertificates || null,
            orcidId: data.personalInfo?.orcidId || null,
            googleScholarUrl: data.personalInfo?.googleScholarUrl || null,
            hIndex: data.personalInfo?.hIndex || null,
          },
          professionalSummary: typeof data.professionalSummary === 'string'
            ? { summary: data.professionalSummary, targetRole: "" }
            : {
              summary: data.professionalSummary?.summary || "",
              targetRole: data.professionalSummary?.targetRole || (data.professionalSummary as Record<string, string>)?.target_role || "",
            },
          education: normalizeId((data.education || []) as Record<string, unknown>[]) as ResumeData["education"],
          workExperience: normalizeId((data.workExperience || []) as Record<string, unknown>[]) as ResumeData["workExperience"],
          projects: normalizeId((data.projects || []) as Record<string, unknown>[]) as ResumeData["projects"],
          // patents is required on ResumeData and defaulted to [] for a new
          // resume, but was omitted here -- so LOADING a saved resume produced
          // patents: undefined, which the Patents editor then indexed into.
          patents: normalizeId((data.patents || []) as Record<string, unknown>[]) as ResumeData["patents"],
          ...(() => {
            let categorizedSkills: CategorizedSkills;
            if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
              // New backend format: skills is an object with camelCase keys and {id,name} arrays
              categorizedSkills = mapBackendSkillsToCategorized(data.skills, getSkillsEditorDomain(accountEmail));
            } else {
              // Legacy format: categorizedSkills with snake_case string arrays
              categorizedSkills = (data.categorizedSkills as CategorizedSkills) || { ...EMPTY_CATEGORIZED_SKILLS };
            }
            const skills = [
              ...categorizedSkills.programming_languages,
              ...categorizedSkills.frameworks,
              ...categorizedSkills.soft_skills,
              ...(categorizedSkills.project_management || []),
              ...(categorizedSkills.marketing_sales || []),
              // Domain categories mapped back from custom_skills (see mapBackendSkillsToCategorized)
              ...Object.entries(categorizedSkills)
                .filter(([k, v]) => !FLAT_SKILLS_EXCLUDED_KEYS.has(k) && Array.isArray(v) && v.every(x => typeof x === 'string'))
                .flatMap(([, v]) => v as string[]),
              ...(categorizedSkills.custom_categories || []).flatMap(c => c.skills),
            ];
            return { skills, categorizedSkills };
          })(),
          certifications: (data.certifications || []).map((cert: Record<string, string | undefined>) => ({
            id: cert.id || cert._id,
            name: cert.name || "",
            issuer: cert.issuer || cert.issuedBy || cert.issued_by || "",
            issuedBy: cert.issuedBy || cert.issuer || cert.issued_by || "",
            issueDate: cert.issueDate || cert.year || "",
            year: cert.year || cert.issueDate || "",
            expiryDate: cert.expiryDate || cert.expiry_date || "",
            credentialId: cert.credentialId || cert.credential_id || "",
          })),
          licenses: normalizeId((data.licenses || []) as Record<string, unknown>[]) as ResumeData["licenses"],
          certificatesAndClearances: normalizeId((data.certificatesAndClearances || []) as Record<string, unknown>[]) as ResumeData["certificatesAndClearances"],
          barAdmissionsAndLicenses: normalizeId((data.barAdmissionsAndLicenses || []) as Record<string, unknown>[]) as ResumeData["barAdmissionsAndLicenses"],
          achievements: normalizeId((data.achievements || []) as Record<string, unknown>[]) as ResumeData["achievements"],
          volunteering: normalizeId((data.volunteering || []) as Record<string, unknown>[]) as ResumeData["volunteering"],
          references: normalizeId((data.references || []) as Record<string, unknown>[]) as ResumeData["references"],
          internships: normalizeId((data.internships || []) as Record<string, unknown>[]) as ResumeData["internships"],
          awards: normalizeId((data.awards || []) as Record<string, unknown>[]) as ResumeData["awards"],
          hobbies: normalizeId((data.hobbies || []) as Record<string, unknown>[]) as ResumeData["hobbies"],
          interests: normalizeId((data.interests || []) as Record<string, unknown>[]) as ResumeData["interests"],
          languages: normalizeId((data.languages || []) as Record<string, unknown>[]).map(l => ({
            ...l,
            name: (l.name as string) || (l.language as string) || "",
          })) as ResumeData["languages"],
          publications: normalizeId((data.publications || []) as Record<string, unknown>[]) as ResumeData["publications"],
          serviceRecord: normalizeId(((data.service_record || data.serviceRecord) || []) as Record<string, unknown>[]) as ResumeData["serviceRecord"],
          vesselsOperated: normalizeId(((data.vessels_operated || data.vesselsOperated) || []) as Record<string, unknown>[]) as ResumeData["vesselsOperated"],
          portsExperience: normalizeId(((data.ports_experience || data.portsExperience) || []) as Record<string, unknown>[]) as ResumeData["portsExperience"],
          seaServiceRecord: normalizeId(((data.sea_service_record || data.seaServiceRecord) || []) as Record<string, unknown>[]) as ResumeData["seaServiceRecord"],
          maritimeCertifications: normalizeId(((data.maritime_certifications || data.maritimeCertifications) || []) as Record<string, unknown>[]) as ResumeData["maritimeCertifications"],
          researchGrants: normalizeId(((data.research_grants || data.researchGrants) || []) as Record<string, unknown>[]) as ResumeData["researchGrants"],
          editorialActivities: normalizeId(((data.editorial_activities || data.editorialActivities) || []) as Record<string, unknown>[]) as ResumeData["editorialActivities"],
          conferencePresentations: normalizeId(((data.conference_presentations || data.conferencePresentations) || []) as Record<string, unknown>[]) as ResumeData["conferencePresentations"],
          customSections: data.customSections || [],
          // Restore templateDomain from localStorage (set when template was applied)
          templateDomain: typeof window !== 'undefined' ? localStorage.getItem(`templateDomain_${resumeId}`) || undefined : undefined,
        };

        // ✅ Replace data completely (don't merge with previous state)
        // This ensures new resumes start fresh without old data
        setResumeData(loadedData);

        // Reconcile persisted content with the render order. Optional standard
        // sections can be removed from sectionOrder, but when data is later
        // added again the backend correctly contains that data. On reload the
        // old code restored only custom section names, leaving populated
        // Certifications/Awards/Languages/etc. invisible in every template.
        const populatedStandardSections: Array<[string, unknown]> = [
          ["Certifications", loadedData.certifications],
          ["Internships", loadedData.internships],
          ["Achievements", loadedData.achievements],
          ["Awards", loadedData.awards],
          ["Volunteering", loadedData.volunteering],
          ["Publications", loadedData.publications],
          ["Patents", loadedData.patents],
          ["References", loadedData.references],
          ["Hobbies", loadedData.hobbies],
          ["Interests", loadedData.interests],
          ["Languages", loadedData.languages],
        ];
        const restoredSectionNames = populatedStandardSections
          .filter(([, value]) => Array.isArray(value) && value.length > 0)
          .map(([name]) => name);
        restoredSectionNames.push(
          ...(loadedData.customSections || []).map(section => section.sectionName),
        );

        if (restoredSectionNames.length > 0) {
          setSectionOrder(prev => {
            const existing = new Set(prev);
            const toAdd = restoredSectionNames.filter(name => !existing.has(name));
            const restored = [...prev, ...toAdd];
            try {
              const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
              const key = userEmail ? `sectionOrder_${userEmail}` : "sectionOrder";
              localStorage.setItem(key, JSON.stringify(restored));
            } catch { /* storage is optional */ }
            return toAdd.length ? restored : prev;
          });
        }

        // Restore completionStatus entries so custom sections count correctly.
        if (loadedData.customSections && loadedData.customSections.length > 0) {

          setCompletionStatus(prev => {
            const updated = { ...prev };
            loadedData.customSections!.forEach(cs => {
              if (!(cs.sectionName in updated)) {
                // Mark complete only if section has fields and all are filled
                const isComplete = cs.fields.length > 0 && cs.fields.every(field => {
                  if (field.fieldType === 'list') return (field.value as string[]).some(v => v.trim() !== '');
                  return String(field.value).trim() !== '';
                });
                updated[cs.sectionName] = isComplete;
              }
            });
            return updated;
          });
        }

        toast.success("Resume loaded successfully!");

      } catch (error) {
        // // console.error("❌ Failed to load resume:", error);
        toast.error("Failed to load resume data");
      } finally {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true); // ✅ Mark as loaded after backend attempt
      }
    };

    initializeBuilder();
  }, [resumeIdProp, source]); // Re-run when resumeId or source changes

  useEffect(() => {
    setLastUpdated(new Date());
  }, [resumeData]);

  const getCompletionPercentage = (): number => {
    const totalSections = Object.keys(completionStatus).length;
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const addCustomSection = (section: CustomSection) => {
    setResumeData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), section],
    }));
    // Add to completionStatus so it counts in the progress ring
    setCompletionStatus(prev => ({ ...prev, [section.sectionName]: false }));
  };

  const removeCustomSection = (id: string) => {
    const sectionToRemove = resumeData.customSections?.find(s => s.id === id);
    if (sectionToRemove) {
      setCompletionStatus(prev => {
        const next = { ...prev };
        delete next[sectionToRemove.sectionName];
        return next;
      });
    }
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).filter(s => s.id !== id),
    }));
  };

  const addCustomField = (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      fieldName,
      fieldType,
      value: fieldType === "list" ? [] : "",
    };
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
      ),
    }));
  };

  const updateCustomFieldValue = (sectionId: string, fieldId: string, value: string | string[]) => {
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map(f => f.id === fieldId ? { ...f, value } : f) }
          : s
      ),
    }));
  };

  const deleteCustomField = (sectionId: string, fieldId: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s =>
        s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s
      ),
    }));
  };

  // Converts a top-level ats_display block (returned by apply_fix when ats_breakdown is absent)
  // into an ATSScore object compatible with enhancedAtsScore state.
  const buildScoreFromAtsDisplay = (
    atsDisplay: { score?: number; sections?: unknown[] } | undefined,
    current: ATSScore | null,
  ): ATSScore | null => {
    if (!atsDisplay) return current;
    type AtsSection = {
      name?: string; section?: string;
      percentage?: number; score_pct?: number; score?: number;
      raw_score?: number; weighted_pts?: number;
      max_raw_score?: number; max_pts?: number; weight?: number;
      deductions?: Array<{ id: string; penalty_pts?: number; after_example?: string; before_example?: string; fix_type?: string }>;
    };
    const sections = (atsDisplay.sections ?? []) as AtsSection[];
    const sectionBreakdown: Record<string, ATSSectionScore> = {};
    for (const sec of sections) {
      const name = sec.name ?? sec.section;
      if (!name) continue;
      const maxPoints = sec.max_pts ?? sec.max_raw_score ?? sec.weight ?? 0;
      const weightedPoints = sec.weighted_pts ?? sec.raw_score ?? 0;
      const percentage = sec.percentage ?? sec.score_pct ?? sec.score ??
        (maxPoints > 0 ? (weightedPoints / maxPoints) * 100 : 0);
      sectionBreakdown[name] = {
        raw_score: weightedPoints,
        max_raw_score: maxPoints,
        percentage,
        weight: sec.weight ?? maxPoints,
        weighted_contribution: weightedPoints,
        deductions: (sec.deductions ?? []).map(d => ({
          id: d.id,
          penalty: d.penalty_pts ?? 0,
          after_example: d.after_example,
          before_example: d.before_example,
          fix_type: d.fix_type === "auto" ? "auto" : "manual",
        })),
      };
    }
    return {
      ...(current ?? {}),
      final_score: atsDisplay.score,
      Percentage: atsDisplay.score,
      section_breakdown: Object.keys(sectionBreakdown).length > 0 ? sectionBreakdown : current?.section_breakdown,
    };
  };

  /**
   * Use server suggestions when present so fix types and server IDs survive.
   * `ats_display.sections[].deductions` is a backwards-compatible fallback.
   * Returning null means the response did not provide enough information to
   * replace the current list, whereas [] means the server confirmed no cards.
   */
  const suggestionsFromFixResponse = (
    response: EnhanceResumeResponse,
  ): EnhancedSuggestion[] | null => {
    const nestedState = response.enhancer_state as unknown as {
      suggestions?: EnhancedSuggestion[];
      ats_display?: { sections?: unknown[] };
      ats_breakdown?: { suggestions?: EnhancedSuggestion[] };
    } | undefined;
    const topLevelBreakdown = response.ats_breakdown as unknown as
      | { suggestions?: EnhancedSuggestion[] }
      | undefined;
    // The AI service returns suggestions inside ats_breakdown.  Earlier UI
    // code only read the legacy top-level/nested `suggestions` fields, so an
    // Undo response refreshed the score but left the fixed card unchanged.
    const display = response.ats_display ?? nestedState?.ats_display;
    const serverSuggestions = mergeEnhancedSuggestions(
      response.suggestions,
      nestedState?.suggestions,
      topLevelBreakdown?.suggestions,
      nestedState?.ats_breakdown?.suggestions,
      display,
    );
    const hasSuggestionSource = [
      response.suggestions,
      nestedState?.suggestions,
      topLevelBreakdown?.suggestions,
      nestedState?.ats_breakdown?.suggestions,
    ].some(Array.isArray) || hasAtsDisplaySuggestions(display);
    return hasSuggestionSource ? serverSuggestions : null;
  };

  const hasExplicitSuggestionsFromFixResponse = (response: EnhanceResumeResponse): boolean => {
    const nestedState = response.enhancer_state as unknown as {
      suggestions?: unknown;
      ats_breakdown?: { suggestions?: unknown };
    } | undefined;
    const topLevelBreakdown = response.ats_breakdown as unknown as
      | { suggestions?: unknown }
      | undefined;
    const display = response.ats_display ?? nestedState?.ats_display;
    return [
      response.suggestions,
      nestedState?.suggestions,
      topLevelBreakdown?.suggestions,
      nestedState?.ats_breakdown?.suggestions,
    ].some(Array.isArray) || hasAtsDisplaySuggestions(display);
  };

  /**
   * A save only changes the resume.  A suggestion is only completed when the
   * post-apply ATS snapshot confirms that its deduction/suggestion is gone.
   *
   * This prevents the exact Summary failure where the editor saved the text,
   * but the response still contained Summary at 0%, while the UI painted its
   * card green (and subsequently moved it out of view).  `null` deliberately
   * means "the server did not give enough ATS information"; in that case we
   * keep the existing orange card instead of guessing.
   */
  const suggestionResolutionFromFixResponse = (
    response: EnhanceResumeResponse,
    suggestionId: string,
  ): boolean | null => {
    const responseData = response as unknown as Record<string, unknown>;
    // The backend's persisted applied-fix ledger is the strongest completion
    // proof. It avoids inferring success from a partial score response and is
    // exactly the same data that makes the Undo button available after reload.
    if (Array.isArray(responseData.applied_fixes)) {
      const isApplied = responseData.applied_fixes.some(item =>
        !!item && typeof item === "object"
        && (item as { suggestion_id?: unknown }).suggestion_id === suggestionId,
      );
      if (isApplied) return true;
      const operation = responseData.operation as { type?: unknown } | undefined;
      if (operation?.type === "apply_fix") return false;
    }
    const nestedState = responseData.enhancer_state as Record<string, unknown> | undefined;
    const sources = [
      responseData.suggestions,
      nestedState?.suggestions,
      responseData.ats_breakdown,
      nestedState?.ats_breakdown,
    ];

    let suggestionListResolution: boolean | null = null;
    for (const source of sources) {
      const suggestions = source && typeof source === "object"
        ? (source as { suggestions?: unknown }).suggestions
        : source;
      if (!Array.isArray(suggestions)) continue;
      const matching = suggestions.find(item =>
        !!item && typeof item === "object" && (item as { id?: unknown }).id === suggestionId,
      ) as { status?: unknown } | undefined;
      if (!matching) {
        suggestionListResolution = true;
        continue;
      }
      const status = typeof matching.status === "string" ? matching.status.toLowerCase() : "";
      if (!["fixed", "resolved", "applied"].includes(status)) return false;
      suggestionListResolution = true;
    }

    const candidateScores = [
      responseData.ats_score,
      responseData.ats_breakdown,
      nestedState?.ats_score,
      nestedState?.ats_breakdown,
    ];
    for (const candidate of candidateScores) {
      if (!candidate || typeof candidate !== "object") continue;
      const breakdown = (candidate as ATSScore).section_breakdown;
      if (!breakdown || Object.keys(breakdown).length === 0) continue;
      const isStillDeducted = Object.values(breakdown).some(section =>
        (section.deductions ?? []).some(deduction => deduction.id === suggestionId),
      );
      // A canonical score snapshot takes precedence over a suggestions list:
      // the two must agree before a UI card becomes green.
      return !isStillDeducted;
    }
    return suggestionListResolution;
  };

  const scoreStateFromFixResponse = (
    response: EnhanceResumeResponse,
    current: ATSScore | null,
  ): ATSScore | null => {
    const nestedState = response.enhancer_state as unknown as {
      ats_display?: { score?: number; sections?: unknown[] };
      ats_breakdown?: ATSScore;
      ats_score?: ATSScore;
    } | undefined;
    const nestedDisplay = nestedState?.ats_display;
    const atsDisplay = (
      response.ats_display as { score?: number; sections?: unknown[] } | undefined
    ) ?? nestedDisplay;
    const breakdown = response.ats_score
      ?? response.ats_breakdown
      ?? nestedState?.ats_score
      ?? nestedState?.ats_breakdown;
    const hasCanonicalBreakdown = Boolean(
      breakdown?.section_breakdown && Object.keys(breakdown.section_breakdown).length > 0,
    );

    // `ats_score.section_breakdown` is the persisted post-apply snapshot.
    // It must win over ats_display.sections: display rows can be delayed and
    // were overwriting a fresh Summary bar with its prior 0% deduction.
    if (hasCanonicalBreakdown && breakdown) {
      const displayScore = atsDisplay?.score;
      return displayScore != null
        ? { ...breakdown, final_score: displayScore, Percentage: displayScore, current_score: displayScore }
        : breakdown;
    }
    if (atsDisplay?.sections?.length) {
      return buildScoreFromAtsDisplay(atsDisplay, breakdown ?? current);
    }
    if (breakdown) return breakdown;
    return atsDisplay ? buildScoreFromAtsDisplay(atsDisplay, current) : current;
  };

  const removeEnhancedScoreSection = (sectionName: string): void => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const requested = normalize(sectionName);
    const aliases = requested === "workexperience"
      ? new Set(["workexperience", "experience", "professionalexperience"])
      : requested === "certificates"
        ? new Set(["certificates", "certifications"])
        : new Set([requested]);

    setEnhancedAtsScore(previous => {
      if (!previous?.section_breakdown) return previous;
      const missingSectionMessages: Record<string, string> = {
        projects: "Add at least one project that demonstrates relevant skills and measurable results.",
        certifications: "Add at least one certification relevant to your role.",
        internships: "Add at least one internship or practical experience entry.",
        workexperience: "Add at least one relevant work experience entry.",
        achievements: "Add at least one relevant achievement.",
        awards: "Add at least one relevant award.",
        volunteering: "Add at least one volunteering experience.",
        education: "Add at least one education entry.",
        languages: "Add at least one language and proficiency level.",
      };
      let removedPoints = 0;
      const sectionBreakdown = Object.fromEntries(
        Object.entries(previous.section_breakdown).map(([name, section]) => {
          if (!aliases.has(normalize(name))) return [name, section];
          const scoreAliases = section as typeof section & { weighted_pts?: number };
          const earned = section.weighted_contribution ?? section.raw_score ?? scoreAliases.weighted_pts ?? 0;
          removedPoints += typeof earned === "number" ? Math.max(0, earned) : 0;
          const sectionToken = normalize(name);
          const message = missingSectionMessages[sectionToken] ?? `Add content to the ${name} section.`;
          return [name, {
            ...section,
            _pre_delete_percentage: section.percentage,
            _pre_delete_contribution: earned,
            _pre_delete_deductions: section.deductions ?? [],
            percentage: 0,
            raw_score: 0,
            weighted_contribution: 0,
            deductions: [{
              id: `section-deleted-${sectionToken}`,
              penalty: Number(section.weight ?? 0),
              message,
              after_example: message,
            }],
          }];
        }),
      );
      const oldScore = (previous as ATSScore & { current_score?: number }).current_score
        ?? previous.final_score ?? previous.Percentage ?? 0;
      const currentScore = Math.max(0, Number((oldScore - removedPoints).toFixed(2)));
      return {
        ...previous,
        final_score: currentScore,
        Percentage: currentScore,
        current_score: currentScore,
        section_breakdown: sectionBreakdown,
      };
    });
  };

  /** Refresh the builder from the canonical resume returned by the backend. */
  const syncEnhancedResumeData = React.useCallback((payload: unknown): boolean => {
    if (!payload || typeof payload !== "object") return false;
    const response = payload as Record<string, unknown>;
    const state = response.enhancer_state && typeof response.enhancer_state === "object"
      ? response.enhancer_state as Record<string, unknown>
      : undefined;
    const enhanced = response.enhanced_resume && typeof response.enhanced_resume === "object"
      ? response.enhanced_resume as Record<string, unknown>
      : undefined;
    // Persisted enhanced_data wins over enhancer_state.resume. The latter is
    // an execution snapshot and may be older after an item was deleted through
    // the section API; preferring it would put the deleted row back on screen.
    const enhancedResume = enhanced?.enhanced_data
      ?? enhanced?.resume
      ?? (enhanced && ["personalInfo", "personal_info", "contact", "education", "projects", "internships", "work_experience"].some(key => key in enhanced)
        ? enhanced
        : undefined);
    const resume = response.enhanced_data ?? enhancedResume ?? state?.resume ?? response.resume;
    if (!resume || typeof resume !== "object") return false;

    const mapped = mapParserOutputToBuilderData({
      ...(resume as Record<string, unknown>),
      ...(state ? { enhancer_state: state } : {}),
    });
    const { countryCode: parsedCode, phoneNumber: parsedPhone } = splitPhone(
      (mapped.personalInfo?.phone as string) || ""
    );
    const storedCode = (mapped.personalInfo?.countryCode as string) || "";
    const countryCode = storedCode.startsWith("+") ? storedCode : (parsedCode || "+91");
    const rawResume = resume as Record<string, unknown>;
    const asRecord = (value: unknown): Record<string, unknown> | undefined =>
      value && typeof value === "object" ? value as Record<string, unknown> : undefined;
    const personalSources = [
      asRecord(rawResume.personalInfo),
      asRecord(rawResume.contact),
      asRecord(rawResume.personal_info),
    ].filter((value): value is Record<string, unknown> => Boolean(value));
    const socialSource = asRecord(rawResume.social_links);
    const serverField = (aliases: string[], includeSocial = false): { found: boolean; value?: unknown } => {
      for (const source of [...personalSources, ...(includeSocial && socialSource ? [socialSource] : [])]) {
        for (const alias of aliases) {
          if (Object.prototype.hasOwnProperty.call(source, alias)) {
            return { found: true, value: source[alias] };
          }
        }
      }
      return { found: false };
    };
    const serverText = (value: unknown): string => {
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return String(record.url ?? record.value ?? "");
      }
      return String(value ?? "");
    };

    setResumeData(previous => {
      const mappedInfo = mapped.personalInfo ?? {};
      // A delete-fix response is authoritative. In particular `location: null`
      // means the user has undone the location fix; do not use `|| previous`
      // because that silently restores the old value in the browser.
      const useServer = (value: unknown, aliases: string[], previousValue: string, includeSocial = false): string => {
        const direct = serverField(aliases, includeSocial);
        return direct.found
          ? serverText(direct.value)
          : (serverText(value) || previousValue || "");
      };
      const directPhone = serverField(["phone", "phoneNumber", "phone_number"]);
      const serverPhone = directPhone.found;
      const phoneValue = serverPhone ? serverText(directPhone.value) : String(parsedPhone || mappedInfo.phone || "");

      // This response is authoritative only for the section(s) its operation
      // actually touched, but every mapped section gets spread below --
      // preserve any local id-less (not-yet-saved) entry in every OTHER
      // section instead of losing it to that overwrite. See
      // mergeSectionPreservingLocalIdLess and ID_KEYED_ARRAY_SECTIONS.
      const previousRecord = previous as unknown as Record<string, unknown>;
      const mappedRecord = mapped as unknown as Record<string, unknown>;
      const mergedArraySections: Record<string, unknown> = {};
      for (const key of ID_KEYED_ARRAY_SECTIONS) {
        if (key in mapped) {
          mergedArraySections[key] = mergeSectionPreservingLocalIdLess(
            mappedRecord[key],
            previousRecord[key],
          );
        }
      }

      return {
        ...previous,
        ...mapped,
        ...mergedArraySections,
        resume_id: previous.resume_id,
        personalInfo: {
          ...previous.personalInfo,
          ...mappedInfo,
          fullname: useServer(mappedInfo.fullname, ["fullname", "fullName", "full_name", "name"], previous.personalInfo.fullname),
          email: useServer(mappedInfo.email, ["email"], previous.personalInfo.email),
          location: useServer(mappedInfo.location, ["location", "city", "address"], previous.personalInfo.location),
          phone: serverPhone
            ? splitPhone(phoneValue).phoneNumber
            : (phoneValue || previous.personalInfo.phone || ""),
          countryCode,
          linkedinUrl: useServer(mappedInfo.linkedinUrl, ["linkedin", "linkedinUrl", "linkedin_url"], previous.personalInfo.linkedinUrl, true),
          githubUrl: useServer(mappedInfo.githubUrl, ["github", "githubUrl", "github_url"], previous.personalInfo.githubUrl, true),
          portfolioUrl: useServer(mappedInfo.portfolioUrl, ["portfolio", "portfolioUrl", "portfolio_url"], previous.personalInfo.portfolioUrl, true),
        },
      };
    });
    setEnhancedDataVersion(version => version + 1);
    return true;
  }, [setResumeData]);

  const syncEnhancedScore = React.useCallback((
    score: unknown,
    options?: EnhancedScoreSyncOptions,
  ): void => {
    if (!score || typeof score !== "object") return;

    // Update/delete endpoints have historically returned several shapes:
    // { ats_display }, { enhancer_state: { ats_breakdown, suggestions } },
    // or the ATS breakdown itself. Normalize them here so every editor action
    // replaces the score and issue list from one authoritative server snapshot.
    const response = score as Record<string, unknown>;
    const nested = [response.enhancer_state, response.enhanced_resume, response.data]
      .find((value): value is Record<string, unknown> => !!value && typeof value === "object") ?? {};
    // Prefer skills read straight off this payload (see
    // extractSkillNamesFromResumePayload's docstring for why the ref lags).
    const payloadResumeLike = response.enhanced_data ?? nested.resume ?? nested.enhanced_data ?? response.resume;
    const payloadSkillNames = extractSkillNamesFromResumePayload(payloadResumeLike);
    const atsDisplay = (response.ats_display ?? nested.ats_display) as
      | { score?: number; sections?: unknown[] }
      | undefined;
    const topLevelBreakdown = response.ats_breakdown as
      | Record<string, unknown>
      | undefined;
    const nestedBreakdown = nested.ats_breakdown as
      | Record<string, unknown>
      | undefined;
    // Keep suggestion handling aligned with the actual AI apply/delete
    // contract: its canonical list lives in ats_breakdown.suggestions.
    const serverSuggestions = mergeEnhancedSuggestions(
      response.suggestions,
      nested.suggestions,
      topLevelBreakdown?.suggestions,
      nestedBreakdown?.suggestions,
      atsDisplay,
    );
    const hasSuggestionSource = [
      response.suggestions,
      nested.suggestions,
      topLevelBreakdown?.suggestions,
      nestedBreakdown?.suggestions,
    ].some(Array.isArray) || hasAtsDisplaySuggestions(atsDisplay);
    const hasAppliedFixLedger = Array.isArray(response.applied_fixes);
    // GET can race with an apply mutation and return an older empty ledger.
    // An empty ledger therefore clears a locally fixed card only when this is
    // an explicit server mutation snapshot (not an ordinary refresh).
    const operation = response.operation as Record<string, unknown> | undefined;
    const clearsMissingAppliedFixes = hasAppliedFixLedger && (
      operation?.type === "apply_fix"
      || operation?.type === "delete_fix"
      || typeof response.deleted_suggestion_id === "string"
    );
    const appliedFixes = new Map<string, boolean>();
    if (hasAppliedFixLedger) {
      for (const item of response.applied_fixes) {
        if (!item || typeof item !== "object") continue;
        const fix = item as Record<string, unknown>;
        const id = typeof fix.suggestion_id === "string" ? fix.suggestion_id : "";
        if (id) appliedFixes.set(id, fix.undo_available !== false);
      }
    }
    const candidateBreakdown = response.ats_score ?? response.ats_breakdown
      ?? nested.ats_breakdown ?? nested.ats_score
      ?? (response.section_breakdown ? response : undefined);
    const typedScore = candidateBreakdown && typeof candidateBreakdown === "object"
      ? candidateBreakdown as ATSScore
      : undefined;
    const hasCanonicalBreakdown = Boolean(
      typedScore?.section_breakdown && Object.keys(typedScore.section_breakdown).length > 0,
    );
    // See scoreStateFromFixResponse: never let delayed presentation rows
    // replace the persisted per-section scoring snapshot.
    const nextScore = hasCanonicalBreakdown && typedScore
      ? (atsDisplay?.score != null
        ? { ...typedScore, final_score: atsDisplay.score, Percentage: atsDisplay.score, current_score: atsDisplay.score }
        : typedScore)
      : atsDisplay
        ? buildScoreFromAtsDisplay(atsDisplay, typedScore ?? enhancedAtsScore)
        : typedScore;

    if (nextScore) setEnhancedAtsScore(nextScore);

    const liveSkillNames = payloadSkillNames ?? currentSkillNames(resumeDataRef.current);
    const hasSkillUndoInfo = (id: string) => Boolean(skillUndoInfoRef.current[id]);

    if (hasSuggestionSource) {
      const normalizedServerSuggestions = resolveRemovedSkillDeductions(
        serverSuggestions,
        liveSkillNames,
        hasSkillUndoInfo,
      );
      // Expand the saved editor section key(s) (e.g. "Education") into the
      // actual suggestion.section values that key covers (e.g. also
      // "ContentQuality", "Leadership" for WorkExperience) via the same map
      // EditorTab used to route a suggestion to its editor section.
      const resolvedSections = new Set(
        (options?.resolvedSuggestionSections ?? []).flatMap(
          (key) => SUGGESTION_SECTION_MAP[key] ?? [key],
        ),
      );
      setEnhancedSuggestions(previous => reconcileServerSuggestions(
        previous,
        normalizedServerSuggestions,
        appliedFixes,
        clearsMissingAppliedFixes,
        false,
        options?.isFullSnapshot === true,
        resolvedSections,
      ));
      return;
    }
  }, [enhancedAtsScore]);

  // Item editors are shared by the normal builder and the embedded ATS Scan
  // workspace. The enhanced delete API broadcasts its post-delete snapshot so
  // every item type (projects, certificates, education, skills, etc.) refreshes
  // from the same server-owned score and deductions rather than estimating a delta.
  useEffect(() => {
    const onEnhancedResumeSync = (event: Event) => {
      const refreshVersion = ++latestEnhancedRefreshRef.current;
      const detail = (event as CustomEvent<{ enhancedId?: string; payload?: unknown; origin?: string }>).detail;
      // Enhanced resumes are identified by the URL prop. The internal resumeId
      // state is only set after creating a normal builder resume, so it is null
      // on the ATS route and previously discarded every apply/undo broadcast.
      const activeEnhancedId = resumeIdProp ?? resumeId;
      if (detail?.enhancedId !== activeEnhancedId) return;
      const payload = detail.payload as Record<string, unknown> | undefined;
      const hasScoreSnapshot = !!payload && typeof payload === "object" && [
        payload.ats_display,
        payload.ats_breakdown,
        payload.ats_score,
        (payload.enhancer_state as Record<string, unknown> | undefined)?.ats_display,
        (payload.enhancer_state as Record<string, unknown> | undefined)?.ats_breakdown,
      ].some(Boolean);
      // Autosave's own broadcast must NOT replace resumeData: resumeData is a
      // dependency of the editor's autosave-triggering effect, so syncing it
      // here re-arms another autosave the instant this one lands -- forever,
      // for as long as a section modal stays open -- and each round also
      // overwrites anything typed in the 3s window before the PATCH resolved
      // with the pre-edit server snapshot. Score/suggestions still sync from
      // autosave responses (separate state, not an autosave-effect dependency).
      const isAutosaveOrigin = detail?.origin === "autosave";
      const hasResumeSnapshot = isAutosaveOrigin ? false : syncEnhancedResumeData(payload);

      if (hasScoreSnapshot) {
        syncEnhancedScore(payload);
        if (hasResumeSnapshot) return;
      }
      if (isAutosaveOrigin) return;

      // A few deployed delete handlers still return 204/no body. Reload only
      // in that legacy case; it restores the same score/suggestions snapshot
      // without guessing how many points the deleted item was worth.
      if (!activeEnhancedId) return;
      void getEnhancedResume(activeEnhancedId).then((latest) => {
        if (refreshVersion !== latestEnhancedRefreshRef.current) return;
        syncEnhancedResumeData(latest);
        // A full, authoritative GET -- a pending card missing from it really
        // has been resolved. See dropMissingPending.
        syncEnhancedScore(latest, { isFullSnapshot: true });
      }).catch((error) => {
        logger.warn("Unable to refresh enhanced ATS score after deletion", error);
      });
    };
    window.addEventListener("enhanced-resume-score-sync", onEnhancedResumeSync);
    return () => window.removeEventListener("enhanced-resume-score-sync", onEnhancedResumeSync);
  }, [resumeId, resumeIdProp, syncEnhancedScore, syncEnhancedResumeData]);

  const restoreEnhancedScoreSection = (sectionName: string): void => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const requested = normalize(sectionName);
    const aliases = requested === "workexperience"
      ? new Set(["workexperience", "experience", "professionalexperience"])
      : requested === "certificates"
        ? new Set(["certificates", "certifications"])
        : new Set([requested]);

    setEnhancedAtsScore(previous => {
      if (!previous?.section_breakdown) return previous;
      let restoredPoints = 0;
      let changed = false;
      const sectionBreakdown = Object.fromEntries(
        Object.entries(previous.section_breakdown).map(([name, section]) => {
          if (!aliases.has(normalize(name))) return [name, section];
          const extended = section as typeof section & {
            weighted_pts?: number;
            max_pts?: number;
            _pre_delete_percentage?: number;
            _pre_delete_contribution?: number;
            _pre_delete_deductions?: typeof section.deductions;
          };
          const current = section.weighted_contribution ?? section.raw_score ?? extended.weighted_pts ?? 0;
          if (Number(current) > 0 || Number(section.percentage ?? 0) > 0) return [name, section];
          const maxPoints = section.max_raw_score ?? extended.max_pts ?? section.weight ?? 0;
          const contribution = Number(extended._pre_delete_contribution ?? maxPoints);
          const percentage = Number(extended._pre_delete_percentage ?? (contribution > 0 ? 100 : 0));
          if (contribution <= 0) return [name, section];
          restoredPoints += contribution;
          changed = true;
          const restoredDeductions = percentage >= 100
            ? []
            : (extended._pre_delete_deductions ?? section.deductions ?? [])
                .filter(d => !d.id?.startsWith("section-deleted-"));
          const restored = { ...section } as Record<string, unknown>;
          delete restored._pre_delete_percentage;
          delete restored._pre_delete_contribution;
          delete restored._pre_delete_deductions;
          return [name, {
            ...restored,
            percentage,
            raw_score: contribution,
            weighted_contribution: contribution,
            weighted_pts: contribution,
            deductions: restoredDeductions,
          }];
        }),
      );
      if (!changed) return previous;
      const oldScore = (previous as ATSScore & { current_score?: number }).current_score
        ?? previous.final_score ?? previous.Percentage ?? 0;
      const currentScore = Math.min(100, Number((Number(oldScore) + restoredPoints).toFixed(2)));
      return {
        ...previous,
        final_score: currentScore,
        Percentage: currentScore,
        current_score: currentScore,
        section_breakdown: sectionBreakdown,
      };
    });
  };

  const applyAutoFix = async (suggestionId: string): Promise<{ beforeScore: number; afterScore: number; scoreConfirmed: boolean }> => {
    if (!resumeIdProp) throw new Error("Enhanced resume is not ready. Please refresh and try again.");
    const beforeScore = getEnhancedCurrentScore(enhancedAtsScore);
    const requestId = ++latestFixRequestRef.current;
    const response = await applyFix({
      enhancer_state: resumeIdProp,
      suggestion_id: suggestionId,
      fix_type: "auto",
    });
    // Drop a response superseded by a newer apply-fix click (out-of-order guard).
    if (requestId !== latestFixRequestRef.current) {
      return { beforeScore, afterScore: beforeScore, scoreConfirmed: false };
    }

    // A 200 response can still mean the AI service rejected the requested
    // change (for example, an unsupported auto-fix payload). Do not mutate
    // the preview, score, or *any* cards in that case. Previously an empty
    // suggestions array from that failure response hid every pending card.
    const applyResult = response as unknown as Record<string, unknown>;
    // Repeating an already-applied suggestion is intentionally idempotent:
    // backend returns `was_applied: false, already_applied: true` and the
    // existing server snapshot. That is a completed request, not an error.
    if ((applyResult.was_applied === false && applyResult.already_applied !== true) || applyResult.success === false) {
      const reason = [applyResult.correction_applied, applyResult.error, applyResult.detail]
        .find((value): value is string => typeof value === "string" && value.trim().length > 0)
        ?? "The server could not apply this automatic fix.";
      throw new Error(reason);
    }
    // Apply and Undo must consume the same canonical resume shape.  The old
    // auto-fix-only mapper read enhancer_state.resume and could retain stale
    // values when the API also supplied enhanced_data.
    syncEnhancedResumeData(response);
    const nextScore = scoreStateFromFixResponse(response, enhancedAtsScore);
    setEnhancedAtsScore(prev => scoreStateFromFixResponse(response, prev));
    // Replace all cards only when the server explicitly sends its suggestion
    // collection. A partial ats_display is enough to refresh score rows, but
    // it is not enough evidence that unrelated suggestions are resolved.
    const hasExplicitSuggestionList = hasExplicitSuggestionsFromFixResponse(response);
    const freshSuggestions = suggestionsFromFixResponse(response);
    const resolutionConfirmed = suggestionResolutionFromFixResponse(response, suggestionId);
    setEnhancedSuggestions(previous => {
      if (resolutionConfirmed !== true) {
        // Retain the original card and its order until the server confirms it.
        // This is important when an older endpoint returns a new headline score
        // but stale/missing section deductions.
        return resolutionConfirmed === false && hasExplicitSuggestionList && freshSuggestions
          ? reconcileServerSuggestions(previous, freshSuggestions, undefined, false, true)
          : previous;
      }
      return reconcileConfirmedFix(
        previous,
        freshSuggestions,
        suggestionId,
        hasExplicitSuggestionList,
      );
    });
    const responseData = response as unknown as Record<string, unknown>;
    const responseState = responseData.enhancer_state as Record<string, unknown> | undefined;
    const scoreConfirmed = Boolean(
      responseData.ats_display || responseData.ats_breakdown || responseData.ats_score
      || responseState?.ats_display || responseState?.ats_breakdown || responseState?.ats_score,
    );
    return {
      beforeScore,
      afterScore: getEnhancedCurrentScore(nextScore),
      scoreConfirmed,
    };
  };

  const applyManualFix = async (suggestionId: string, value: string, origin?: "autosave"): Promise<void> => {
    // Missing-section suggestions are generated by our own delete/reload
    // reconciliation, not by the AI service. Sending their synthetic IDs to
    // /enhance/apply can only return 404/422. The section save/autosave has
    // already persisted and rescored the populated section, so completion here
    // is a local projection cleanup only.
    const suggestion = enhancedSuggestions.find(item => item.id === suggestionId);
    const suggestionMessage = suggestion?.message.toLowerCase() ?? "";
    // Only locally-created deletion deductions have no backend suggestion id.
    // Real ATS presence/count suggestions must go through /enhance/apply so the
    // backend removes the deduction, recalculates the section, persists the
    // overall score, and returns one authoritative state. Previously all
    // presence suggestions returned here after a UI-only removal, so the card
    // disappeared while the score remained unchanged and returned on reload.
    if (suggestionId.startsWith("section-deleted-")) {
      if (!value.trim()) throw new Error("Add section content before marking this suggestion as done.");
      if (suggestion?.section.toLowerCase() === "projects") {
        const requiredMatch = suggestionMessage.match(/add(?:ing)?\s+(\d+)\s+projects?/i);
        const requiredCount = requiredMatch ? Number(requiredMatch[1]) : 1;
        if ((resumeData.projects ?? []).length < requiredCount) {
          throw new Error(`Add ${requiredCount} projects before marking this suggestion as done.`);
        }
      }
      setEnhancedSuggestions(previous => markSuggestionFixed(previous, suggestionId));
      setEnhancedAtsScore(previous => {
        if (!previous?.section_breakdown) return previous;
        return {
          ...previous,
          section_breakdown: Object.fromEntries(
            Object.entries(previous.section_breakdown).map(([name, section]) => [
              name,
              {
                ...section,
                deductions: (section.deductions ?? []).filter(d => d.id !== suggestionId),
              },
            ]),
          ),
        };
      });
      return;
    }
    if (!resumeIdProp) return;
    const requestId = ++latestFixRequestRef.current;
    const response = await applyFix({
      enhancer_state: resumeIdProp,
      suggestion_id: suggestionId,
      fix_type: "manual",
      value,
    });
    // Drop a response superseded by a newer apply-fix click (out-of-order guard).
    if (requestId !== latestFixRequestRef.current) return;
    const applyResult = response as unknown as Record<string, unknown>;
    // See applyAutoFix: an idempotent repeat must retain its fixed card and
    // canonical snapshot rather than showing a false failure.
    if ((applyResult.was_applied === false && applyResult.already_applied !== true) || applyResult.success === false) {
      const reason = [applyResult.correction_applied, applyResult.error, applyResult.detail]
        .find((item): item is string => typeof item === "string" && item.trim().length > 0)
        ?? "The server could not apply this fix.";
      throw new Error(reason);
    }
    // Manual and automatic fixes must refresh the same canonical resume.
    // Previously only automatic fixes did this, leaving Project/Education
    // editors to render stale local arrays after a successful manual save.
    // Skip it for a fix confirmed right after an autosave PATCH (see
    // EditorTab's confirmSavedManualFixes): the section modal that just
    // autosaved is still open, so replacing resumeData here would overwrite
    // whatever the user typed in the few seconds since that PATCH was sent --
    // the exact overwrite the "autosave" origin tag on the sync event already
    // prevents for the autosave response itself. Score/suggestions still
    // sync below; only the resumeData replacement is skipped.
    if (origin !== "autosave") syncEnhancedResumeData(response);
    {
      setEnhancedAtsScore(prev => scoreStateFromFixResponse(response, prev));
      const freshSuggestions = suggestionsFromFixResponse(response);
      const hasExplicitSuggestionList = hasExplicitSuggestionsFromFixResponse(response);
      const resolutionConfirmed = suggestionResolutionFromFixResponse(response, suggestionId);
      setEnhancedSuggestions(previous => {
        if (resolutionConfirmed !== true) {
          return resolutionConfirmed === false && hasExplicitSuggestionList && freshSuggestions
            ? reconcileServerSuggestions(previous, freshSuggestions, undefined, false, true)
            : previous;
        }
        return reconcileConfirmedFix(
        previous,
        freshSuggestions,
        suggestionId,
        hasExplicitSuggestionList,
      );
      });
    }
  };

  // Skill deletion (deleteSkillFromEnhancedResume) is a lightweight endpoint
  // that only returns the updated technical_skills array -- no ats_display/
  // ats_breakdown snapshot -- so the "enhanced-resume-score-sync" listener's
  // fallback GET refresh brings back resume data but not a freshly recomputed
  // score (the backend never re-runs the AI scorer on delete). A "'X' is
  // listed but not demonstrated" suggestion is trivially resolved once X no
  // longer exists in Skills at all, so resolve it locally here instead of
  // waiting on a rescore that never happens, mirroring the existing
  // "section-deleted-" local-resolution branch in applyManualFix above.
  const resolveSkillRemovedSuggestions = (skillName: string, category?: string): void => {
    const escaped = skillName.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escaped) return;
    const pattern = new RegExp(`^['"]${escaped}['"]\\s+is listed but not demonstrated`, "i");
    const matchingIds = enhancedSuggestions
      .filter(s => s.status !== "fixed" && s.section.toLowerCase() === "skills" && pattern.test(s.message))
      .map(s => s.id);
    if (matchingIds.length === 0) return;
    setEnhancedSuggestions(previous =>
      matchingIds.reduce((acc, id) => markSuggestionFixed(acc, id), previous));
    setEnhancedAtsScore(previous => {
      if (!previous?.section_breakdown) return previous;
      // Capture exactly what's removed (section name + full deduction
      // object) so undoSkillRemoval can put it back verbatim on Undo,
      // instead of the suggestion permanently losing its home in
      // section_breakdown -- a later background sync has no way to
      // "rediscover" a deduction that no longer exists anywhere, so an
      // earlier version of this function made Undo's local "back to
      // pending" status get silently dropped by the next sync.
      const removedBySection: { section: string; deduction: ATSSectionDeduction }[] = [];
      const sectionBreakdown = Object.fromEntries(
        Object.entries(previous.section_breakdown).map(([name, section]) => {
          const kept: ATSSectionDeduction[] = [];
          for (const d of section.deductions ?? []) {
            if (matchingIds.includes(d.id)) removedBySection.push({ section: name, deduction: d });
            else kept.push(d);
          }
          return [name, { ...section, deductions: kept }];
        }),
      );
      if (category) {
        for (const id of matchingIds) {
          skillUndoInfoRef.current[id] = {
            skillName,
            category,
            removedDeductions: removedBySection.filter(({ deduction }) => deduction.id === id),
          };
        }
      }
      return { ...previous, section_breakdown: sectionBreakdown };
    });
  };

  // Restores a deleted skill for a "'X' is listed but not demonstrated"
  // card resolved via Skills deletion. Not a real /enhance/apply fix, so it
  // can't go through deleteFix/state_history -- it just re-adds the skill
  // (the same endpoint the Skills editor's own "add" uses) and flips the
  // card back to pending. Maps the api category string back to the
  // frontend's categorizedSkills bucket the same way Skills.tsx's own
  // CATEGORY_KEY_MAP does, just inverted.
  const PREDEFINED_CATEGORY_REVERSE: Record<string, string> = {
    programmingLanguages: "programming_languages",
    frameworks: "frameworks",
    softSkills: "soft_skills",
    projectManagement: "project_management",
    marketingSales: "marketing_sales",
  };
  const undoSkillRemoval = async (
    suggestionId: string,
    skillName: string,
    category: string,
    removedDeductions: { section: string; deduction: ATSSectionDeduction }[],
  ): Promise<void> => {
    if (!resumeIdProp) return;
    const { id: newSkillId } = await addSkillToEnhancedResume(resumeIdProp, category, skillName);
    delete skillUndoInfoRef.current[suggestionId];
    setResumeData(previous => {
      const cats = previous.categorizedSkills ?? {
        programming_languages: [], frameworks: [], soft_skills: [],
        project_management: [], marketing_sales: [],
      };
      const predefinedKey = PREDEFINED_CATEGORY_REVERSE[category];
      const skillIdMap = { ...(cats.skill_id_map ?? {}) };
      if (predefinedKey) {
        const existing = (cats as unknown as Record<string, string[]>)[predefinedKey] ?? [];
        if (existing.includes(skillName)) return previous;
        if (newSkillId) skillIdMap[`${predefinedKey}:${skillName}`] = newSkillId;
        return {
          ...previous,
          categorizedSkills: { ...cats, [predefinedKey]: [...existing, skillName], skill_id_map: skillIdMap },
          skills: Array.from(new Set([...(previous.skills ?? []), skillName])),
        };
      }
      const customCategories = cats.custom_categories ?? [];
      const targetIdx = customCategories.findIndex(c => c.name === category);
      if (newSkillId) skillIdMap[`${category}:${skillName}`] = newSkillId;
      // The custom category can be genuinely gone by now: if this was the
      // LAST skill in it, a background resync after the delete may have
      // rebuilt categorizedSkills from a backend response that no longer
      // has this category at all (mapBackendSkillsToCategorized only
      // creates a custom_categories entry for categories the backend
      // actually returns). Recreate it instead of silently no-op'ing --
      // that silent failure is exactly why the skill "didn't come back".
      if (targetIdx === -1) {
        const newCategory: CustomCategory = { id: `custom_backend_${category}`, name: category, skills: [skillName] };
        return {
          ...previous,
          categorizedSkills: { ...cats, custom_categories: [...customCategories, newCategory], skill_id_map: skillIdMap },
          skills: Array.from(new Set([...(previous.skills ?? []), skillName])),
        };
      }
      if (customCategories[targetIdx].skills.includes(skillName)) return previous;
      const updatedCustom = customCategories.map((c, i) =>
        i === targetIdx ? { ...c, skills: [...c.skills, skillName] } : c
      );
      return {
        ...previous,
        categorizedSkills: { ...cats, custom_categories: updatedCustom, skill_id_map: skillIdMap },
        skills: Array.from(new Set([...(previous.skills ?? []), skillName])),
      };
    });
    setEnhancedSuggestions(previous => previous.map(s =>
      s.id === suggestionId ? { ...s, status: "pending" as const, undoAvailable: undefined } : s
    ));
    // Put the deduction(s) back exactly where resolveSkillRemovedSuggestions
    // removed them from, so the card survives the next background sync
    // instead of vanishing (nothing in section_breakdown to reconcile
    // against otherwise -- see resolveSkillRemovedSuggestions' comment).
    if (removedDeductions.length > 0) {
      setEnhancedAtsScore(previous => {
        if (!previous?.section_breakdown) return previous;
        const sectionBreakdown = { ...previous.section_breakdown };
        for (const { section, deduction } of removedDeductions) {
          const target = sectionBreakdown[section];
          if (!target) continue;
          if ((target.deductions ?? []).some(d => d.id === deduction.id)) continue;
          sectionBreakdown[section] = { ...target, deductions: [...(target.deductions ?? []), deduction] };
        }
        return { ...previous, section_breakdown: sectionBreakdown };
      });
    }
    toast.success(`'${skillName}' restored to Skills.`);
  };

  const undoFix = async (suggestionId: string): Promise<void> => {
    const skillUndoInfo = skillUndoInfoRef.current[suggestionId];
    if (skillUndoInfo) {
      await undoSkillRemoval(
        suggestionId,
        skillUndoInfo.skillName,
        skillUndoInfo.category,
        skillUndoInfo.removedDeductions,
      );
      return;
    }
    if (!resumeIdProp) return;
    const requestId = ++latestFixRequestRef.current;
    let response: EnhanceResumeResponse;
    try {
      response = await deleteFix({
        enhancer_state: resumeIdProp,
        suggestion_id: suggestionId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // The screenshot's HTTP 404 is a definitive backend response: this card
      // exists in the client, but its suggestion ID has no applied-history
      // record. Do not show a misleading red "Failed" button forever or keep
      // retrying the identical request. The saved resume is left untouched.
      if (/not found in applied history/i.test(message)) {
        if (requestId !== latestFixRequestRef.current) return;
        setEnhancedSuggestions(previous => previous.map(suggestion =>
          suggestion.id === suggestionId
            ? { ...suggestion, status: "fixed" as const, undoAvailable: false }
            : suggestion,
        ));
        toast.info("This saved fix has no undo record on the server. Edit the section to change it.");
        return;
      }
      throw error;
    }
    if (requestId !== latestFixRequestRef.current) return;
    const responseData = response as unknown as Record<string, unknown>;
    // Older deployed delete-fix handlers return a valid 200 payload with
    // `deleted_suggestion_id`, but no `success` flag. Treat that documented
    // response as an Undo success instead of showing the card's red Failed
    // state. New handlers return both fields.
    const didUndo = response.success === true
      || responseData.deleted_suggestion_id === suggestionId;
    if (!didUndo) {
      const reason = [responseData.message, responseData.error, responseData.detail]
        .find((item): item is string => typeof item === "string" && item.trim().length > 0)
        ?? "The server could not undo this fix.";
      throw new Error(reason);
    }
    if (didUndo) {
      // Undo returns a complete server snapshot. Use the same canonical mapper
      // as apply/delete so an old enhancer_state cannot restore a deleted item.
      syncEnhancedResumeData(response);
      setEnhancedAtsScore(prev => scoreStateFromFixResponse(response, prev));
      // Rebuild suggestions — the deleted fix's suggestion should reappear in the fresh list
      const freshSuggestions = suggestionsFromFixResponse(response);
      setEnhancedSuggestions(previous => freshSuggestions
        ? reconcileServerSuggestions(
            previous.filter(suggestion => suggestion.id !== suggestionId),
            freshSuggestions,
          )
        : previous.map(suggestion => suggestion.id === suggestionId
          ? { ...suggestion, status: "pending" as const }
          : suggestion));
    }
  };

  const createResume = async () => {
    try {
      const result = await httpClient.post<{ id: string }>('/resumes/', resumeData);
      setResumeId(result.data.id);
    } catch {
      // createResume failure is silent — caller handles fallback
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        selectedTemplate,
        setSelectedTemplate,
        resumeStyle,
        setResumeStyle,
        lastUpdated,
        resumeId: resumeIdProp ?? null, // ✅ Use resume ID from URL param instead of state
        createResume,
        sectionOrder,
        setSectionOrder,
        previewCatalogueKey,
        setPreviewCatalogueKey,
        completionStatus,
        setCompletionStatus,
        getCompletionPercentage,
        isLoadingResume,
        resumeSource: source ?? null,
        enhancedAtsScore,
        enhancedSuggestions,
        enhancedDataVersion,
        resumeSavedVersion,
        bumpResumeSavedVersion,
        addCustomSection,
        removeCustomSection,
        addCustomField,
        updateCustomFieldValue,
        deleteCustomField,
        applyAutoFix,
        applyManualFix,
        resolveSkillRemovedSuggestions,
        undoFix,
        removeEnhancedScoreSection,
        restoreEnhancedScoreSection,
        syncEnhancedScore,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};


export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("useResume must be used inside ResumeProvider");
  return context;
};
