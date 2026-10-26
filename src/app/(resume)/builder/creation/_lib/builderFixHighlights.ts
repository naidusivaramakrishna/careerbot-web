import { useSyncExternalStore } from "react";
import type { TextUnit } from "../_utils/fixedTextHighlight";

/**
 * The text each fix added to a resume built from scratch, so the preview can paint it green (the same
 * highlight uploaded resumes get). The score tab publishes it when a suggestion is fixed and clears it on Undo;
 * the preview reads it. It lives only in memory: a page reload starts clean.
 */
const unitsByFix = new Map<string, TextUnit[]>();
const listeners = new Set<() => void>();
const EMPTY: TextUnit[] = [];
let snapshot: TextUnit[] = EMPTY;

function publish(): void {
  const all: TextUnit[] = [];
  const seen = new Set<string>();
  unitsByFix.forEach((units) => {
    for (const unit of units) {
      const key = `${unit.key}\u0000${unit.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        all.push(unit);
      }
    }
  });
  snapshot = all.length > 0 ? all : EMPTY;
  listeners.forEach((listener) => listener());
}

/** Records (or, with no units, clears) the text a fix added. */
export function setBuilderFixUnits(fixId: string, units: TextUnit[] | null): void {
  if (units && units.length > 0) unitsByFix.set(fixId, units);
  else if (!unitsByFix.delete(fixId)) return;
  publish();
}

export function clearBuilderFixUnits(): void {
  if (unitsByFix.size === 0) return;
  unitsByFix.clear();
  publish();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** The text fixes added to a from-scratch resume, for the preview to highlight. */
export function useBuilderFixHighlightUnits(): TextUnit[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
