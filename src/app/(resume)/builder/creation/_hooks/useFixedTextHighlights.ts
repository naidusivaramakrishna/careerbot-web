import { useEffect, useMemo } from "react";
import type { EnhancedSuggestion } from "@/types/api.types";
import { collectTextUnits, unitBelongsToSuggestionSection, unitKey, type TextUnit } from "../_utils/fixedTextHighlight";
import { FIXED_TEXT_STORAGE_PREFIX } from "../_utils/fixedSuggestionsStorage";

const NONE: TextUnit[] = [];

const STORAGE_PREFIX = FIXED_TEXT_STORAGE_PREFIX;
const MAX_UNITS_PER_FIX = 80;
const MAX_UNIT_LENGTH = 2000;

interface ResumeBaselines {
  /** Unit keys present when each suggestion was last seen pending. */
  before: Map<string, Set<string>>;
  /** Unit keys each suggestion added, as of the last time it was seen fixed. */
  added: Map<string, Set<string>>;
  /** The text each fix added, kept in the browser so it survives a reload. */
  stored: Map<string, TextUnit[]>;
  fixed: Set<string>;
}

// Kept outside the component so the "before" survives the preview unmounting
// (tab switch, mobile panel) while the resume is still open. Keyed by resume
// because suggestion ids such as "contact_issue_0" repeat across resumes.
const baselinesByResume = new Map<string, ResumeBaselines>();

const isTextUnit = (value: unknown): value is TextUnit =>
  !!value && typeof value === "object"
  && typeof (value as TextUnit).key === "string" && typeof (value as TextUnit).text === "string";

function readStored(resumeKey: string): Map<string, TextUnit[]> {
  const stored = new Map<string, TextUnit[]>();
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_PREFIX + resumeKey) : null;
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    if (parsed && typeof parsed === "object") {
      for (const [id, units] of Object.entries(parsed)) {
        if (Array.isArray(units)) stored.set(id, units.filter(isTextUnit));
      }
    }
  } catch {
    // Storage blocked or corrupt: behave as if nothing was stored.
  }
  return stored;
}

function writeStored(resumeKey: string, stored: Map<string, TextUnit[]>): void {
  try {
    if (typeof window === "undefined") return;
    if (stored.size === 0) window.localStorage.removeItem(STORAGE_PREFIX + resumeKey);
    else window.localStorage.setItem(STORAGE_PREFIX + resumeKey, JSON.stringify(Object.fromEntries(stored)));
  } catch {
    // Quota or blocked storage: highlights just won't survive a reload.
  }
}

const baselinesFor = (resumeKey: string): ResumeBaselines => {
  let entry = baselinesByResume.get(resumeKey);
  if (!entry) {
    entry = { before: new Map(), added: new Map(), stored: readStored(resumeKey), fixed: new Set() };
    baselinesByResume.set(resumeKey, entry);
  }
  return entry;
};

/** Forget the green highlights recorded for one resume (memory and browser). */
export const forgetFixedTextFor = (resumeKey: string): void => {
  baselinesByResume.delete(resumeKey);
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_PREFIX + resumeKey);
  } catch {
    // ignore
  }
};

/** Test hook: forget every recorded "before" (and what was kept in the browser). */
export const resetFixedTextBaselines = (options: { keepStored?: boolean } = {}): void => {
  baselinesByResume.clear();
  if (options.keepStored) return;
  try {
    if (typeof window === "undefined") return;
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};

/**
 * The resume text to highlight green: only what applied fixes added.
 *
 * It is derived, not captured. For each fixed suggestion it is the resume text
 * that was not there when the suggestion was last seen pending, in whatever
 * section the fix wrote it (no per-section list to keep in step with the ATS
 * backend, so every current and future section is covered). Recomputing on
 * every render means it cannot miss a moment, so it holds for every way a fix
 * lands: an Auto Fix or "Add all at once" written by the server, and a Manual
 * Fix typed and autosaved before the card was confirmed.
 *
 * The text each fix added is also kept in the browser, per resume, because the
 * server never returns the pre-fix resume: without it, reloading the page (or
 * reopening the resume) would leave every earlier fix unhighlighted. A fix
 * applied before anything was kept highlights nothing rather than a whole
 * section. Undo removes the text (or the card), and the stored copy with it.
 */
export function useFixedTextHighlights(
  resumeKey: string,
  resumeData: unknown,
  suggestions: EnhancedSuggestion[],
  isIgnored: (suggestion: EnhancedSuggestion) => boolean,
  // False while the resume is still loading. The ATS report mounts the preview before the
  // resume arrives: a "before" taken from the empty placeholder would make every line of
  // the resume count as added by the first fix.
  ready = true,
): TextUnit[] {
  const currentUnits = useMemo(() => collectTextUnits(resumeData), [resumeData]);

  // After render, so a suggestion that flips to fixed in a later render finds
  // the baseline recorded while it was still pending.
  useEffect(() => {
    if (!ready) return;
    const state = baselinesFor(resumeKey);
    const currentKeys = new Set(currentUnits.map(unitKey));
    const fixedNow = new Set<string>();
    let storedChanged = false;
    for (const suggestion of suggestions) {
      if (isIgnored(suggestion)) continue;
      const baseline = state.before.get(suggestion.id);
      if (suggestion.status === "fixed") {
        fixedNow.add(suggestion.id);
        // Freeze what this card added on its first pending -> fixed transition.
        // Recomputing against the old pending snapshot on every fixed render
        // would incorrectly attribute later user edits in the same section to
        // this fix (and persist them as its green highlight after reload).
        // Some API responses mark a card fixed one render before their resume
        // data arrives. Do not freeze an empty set in that transient render;
        // wait until the fix has actually produced text, then keep that set.
        if (!baseline || state.added.has(suggestion.id)) continue;
        const addedUnits = currentUnits.filter(
          (unit) => !baseline.has(unitKey(unit)) && unitBelongsToSuggestionSection(unit, suggestion.section),
        );
        // Keep what this fix added. An empty result is never stored: the card can
        // read fixed a render before the data lands.
        if (addedUnits.length > 0) {
          state.added.set(suggestion.id, new Set(addedUnits.map(unitKey)));
          // Stored whole (a truncated line would never match the resume again).
          const units = addedUnits
            .filter((unit) => unit.text.length <= MAX_UNIT_LENGTH)
            .slice(0, MAX_UNITS_PER_FIX)
            .map((unit) => ({ key: unit.key, text: unit.text }));
          if (JSON.stringify(state.stored.get(suggestion.id)) !== JSON.stringify(units)) {
            state.stored.set(suggestion.id, units);
            storedChanged = true;
          }
        }
        continue;
      }

      // A card reading as pending is only an Undo if the text it added is gone
      // from the resume. The list is rebuilt from server snapshots whenever
      // another fix lands, and a card can read as pending (or lose its status)
      // for a render while its text is still there; resetting anything then
      // would make its own text look old once it is fixed again.
      const stored = state.stored.get(suggestion.id);
      if (stored && stored.some((unit) => !currentKeys.has(unitKey(unit)))) {
        state.stored.delete(suggestion.id);
        // The fix was really undone. Its next application needs a new frozen
        // key set; keeping the old one makes the new text flash once and then
        // disappear on the following render.
        state.added.delete(suggestion.id);
        state.before.set(suggestion.id, currentKeys);
        storedChanged = true;
      }
      if (!baseline) {
        state.before.set(suggestion.id, currentKeys);
        continue;
      }
      if (state.fixed.has(suggestion.id)) {
        const added = state.added.get(suggestion.id);
        if (added && [...added].some((key) => !currentKeys.has(key))) {
          state.before.set(suggestion.id, currentKeys);
          state.added.delete(suggestion.id);
        }
      }
    }
    state.fixed = fixedNow;
    if (storedChanged) writeStored(resumeKey, state.stored);
  }, [resumeKey, suggestions, currentUnits, isIgnored, ready]);

  return useMemo(() => {
    const state = baselinesFor(resumeKey);
    const currentKeys = new Set(currentUnits.map(unitKey));
    const units = new Map<string, TextUnit>();
    for (const suggestion of suggestions) {
      if (suggestion.status !== "fixed" || isIgnored(suggestion)) continue;
      const baseline = state.before.get(suggestion.id);
      const added = state.added.get(suggestion.id);
      if (added && state.fixed.has(suggestion.id)) {
        for (const unit of currentUnits) {
          if (added.has(unitKey(unit))) units.set(unitKey(unit), unit);
        }
      } else if (baseline) {
        // First fixed render: effects have not frozen `added` yet, so paint
        // the transition immediately. Later renders use the frozen key set.
        for (const unit of currentUnits) {
          if (!baseline.has(unitKey(unit)) && unitBelongsToSuggestionSection(unit, suggestion.section)) {
            units.set(unitKey(unit), unit);
          }
        }
      }
      // What the fix added, as kept from before a reload.
      for (const unit of state.stored.get(suggestion.id) ?? []) {
        if (currentKeys.has(unitKey(unit))) units.set(unitKey(unit), unit);
      }
    }
    return units.size > 0 ? Array.from(units.values()) : NONE;
  }, [resumeKey, suggestions, currentUnits, isIgnored]);
}
