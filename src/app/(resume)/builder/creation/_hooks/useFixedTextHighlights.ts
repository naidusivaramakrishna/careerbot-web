import { useEffect, useMemo, useRef, useState } from "react";
import type { EnhancedSuggestion } from "@/types/api.types";
import { diffTextUnits, type TextUnit } from "../_utils/fixedTextHighlight";

const RECENT_SYNC_MS = 10_000;

/**
 * Remembers which resume text each applied ATS fix wrote, so the preview can
 * highlight just that text. A fix response replaces resumeData (bumping
 * `enhancedDataVersion`) in the same tick the card flips to "fixed"; the text
 * that is new in that replacement belongs to that fix. Undo drops it again.
 * Fixes that were already applied when the preview mounted have no known
 * "before" text, so they are not highlighted.
 */
export function useFixedTextHighlights(
  resumeData: unknown,
  suggestions: EnhancedSuggestion[],
  enhancedDataVersion: number,
  isIgnored: (suggestion: EnhancedSuggestion) => boolean,
): TextUnit[] {
  const previousDataRef = useRef(resumeData);
  const previousVersionRef = useRef(enhancedDataVersion);
  const previousFixedRef = useRef<Set<string>>(
    new Set(suggestions.filter((item) => item.status === "fixed").map((item) => item.id)),
  );
  const recentRef = useRef<{ at: number; units: TextUnit[] }[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, TextUnit[]>>({});

  useEffect(() => {
    const now = Date.now();
    recentRef.current = recentRef.current.filter((entry) => now - entry.at < RECENT_SYNC_MS);
    if (resumeData !== previousDataRef.current && enhancedDataVersion !== previousVersionRef.current) {
      const changed = diffTextUnits(previousDataRef.current, resumeData);
      if (changed.length > 0) recentRef.current.push({ at: now, units: changed });
    }
    previousDataRef.current = resumeData;
    previousVersionRef.current = enhancedDataVersion;

    const fixedNow = new Set(
      suggestions.filter((item) => item.status === "fixed" && !isIgnored(item)).map((item) => item.id),
    );
    const added = Array.from(fixedNow).filter((id) => !previousFixedRef.current.has(id));
    const removed = Array.from(previousFixedRef.current).filter((id) => !fixedNow.has(id));
    previousFixedRef.current = fixedNow;
    if (added.length === 0 && removed.length === 0) return;

    const written = recentRef.current.flatMap((entry) => entry.units);
    recentRef.current = [];
    setUnitsById((current) => {
      const next = { ...current };
      for (const id of removed) delete next[id];
      if (written.length > 0) for (const id of added) next[id] = written;
      return next;
    });
  }, [resumeData, suggestions, enhancedDataVersion, isIgnored]);

  return useMemo(() => Object.values(unitsById).flat(), [unitsById]);
}
