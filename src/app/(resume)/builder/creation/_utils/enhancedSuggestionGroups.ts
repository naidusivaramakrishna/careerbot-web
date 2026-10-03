import type { EnhancedSuggestion } from "@/types/api.types";

/** Section names only. Dropping punctuation is right here -- it is the same
 * token ScoreTab's normalizedSectionToken builds, so "Technical Skills" and
 * "technical-skills" group together. */
const normalizeSection = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Quoted skill/keyword terms. Case and whitespace are collapsed, punctuation
 * is NOT: dropping it maps distinct skills onto one token -- "C++" and "C#"
 * both become "c", ".NET" and "Net" both become "net" -- and the terms decide
 * whether a pending card is HIDDEN. Over-matching loses a recommendation the
 * user can no longer apply; under-matching only leaves a redundant card on
 * screen, so this errs toward showing the card. */
const normalizeTerm = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const isBulkAutoFixSuggestion = (suggestion: EnhancedSuggestion): boolean =>
  suggestion.fix_type === "auto"
  && /^(?:apply|add)\s+all(?:\s+at\s+once)?\b/i.test(suggestion.message.trim());

const quotedTerms = (message: string): string[] =>
  Array.from(message.matchAll(/["'\u2018\u2019\u201c\u201d]([^"'\u2018\u2019\u201c\u201d]+)["'\u2018\u2019\u201c\u201d]/g))
    .map(match => normalizeTerm(match[1]))
    .filter(Boolean);

/**
 * A confirmed bulk fix replaces its still-pending child cards in the UI.
 * Fixed children remain visible because they own independent Undo actions.
 * When the bulk fix is undone its status becomes pending, coverage disappears,
 * and all child cards naturally return.
 */
export function withoutPendingChildrenOfFixedBulkSuggestions(
  suggestions: EnhancedSuggestion[],
): EnhancedSuggestion[] {
  const coverageBySection = new Map<string, Set<string>>();

  for (const suggestion of suggestions) {
    if (suggestion.status !== "fixed" || !isBulkAutoFixSuggestion(suggestion)) continue;
    const section = normalizeSection(suggestion.section);
    const covered = coverageBySection.get(section) ?? new Set<string>();
    quotedTerms(suggestion.message).forEach(term => covered.add(term));
    if (covered.size > 0) coverageBySection.set(section, covered);
  }

  return suggestions.filter(suggestion => {
    if (
      suggestion.status !== "pending"
      || suggestion.fix_type !== "auto"
      || isBulkAutoFixSuggestion(suggestion)
    ) return true;

    const covered = coverageBySection.get(normalizeSection(suggestion.section));
    if (!covered) return true;
    const terms = quotedTerms(suggestion.message);
    return terms.length === 0 || !terms.every(term => covered.has(term));
  });
}
