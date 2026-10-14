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

/**
 * The individual cards an "Apply all" card stands for, found by id.
 *
 * The server names a family by id: `leadership_bullets_apply_all` covers
 * `leadership_bullet_suggestion_N`, `experience_bullets_apply_all` covers
 * `experience_bullet_N`, `keyword_suggestions_apply_all` covers
 * `keyword_suggestion_N`. Their messages are whole sentences with no quoted
 * keyword, so the keyword matching below can never link them -- the three
 * leadership cards stayed on screen after "Apply all 3 leadership bullet
 * improvements" had fixed them. Same section only, so an unrelated card whose
 * id merely starts alike is never swallowed.
 */
const BULK_ID_SUFFIX = "_apply_all";

export function bulkChildren(
  bulk: EnhancedSuggestion,
  all: EnhancedSuggestion[],
): EnhancedSuggestion[] {
  if (!bulk.id.endsWith(BULK_ID_SUFFIX)) return [];
  const childPrefix = `${bulk.id.slice(0, -BULK_ID_SUFFIX.length).replace(/s$/, "")}_`;
  const section = normalizeSection(bulk.section);
  return all.filter(item =>
    item.id !== bulk.id
    && !item.id.endsWith(BULK_ID_SUFFIX)
    && item.id.startsWith(childPrefix)
    && normalizeSection(item.section) === section,
  );
}

const quotedTerms = (message: string): string[] =>
  Array.from(message.matchAll(/["'\u2018\u2019\u201c\u201d]([^"'\u2018\u2019\u201c\u201d]+)["'\u2018\u2019\u201c\u201d]/g))
    .map(match => normalizeTerm(match[1]))
    .filter(Boolean);

/**
 * How many recommendations a card stands for in progress counts.
 *
 * An ordinary card is one. An "Add all at once" card is a shortcut for the
 * individual keyword cards it names, so it stands for the keywords that no
 * other card in `peers` already represents: a fixed bulk fix whose child
 * cards are hidden counts as all of its keywords, while a pending one that
 * still sits next to its visible children adds nothing on top of them.
 */
export function suggestionProgressWeight(
  suggestion: EnhancedSuggestion,
  peers: EnhancedSuggestion[],
): number {
  if (!isBulkAutoFixSuggestion(suggestion)) return 1;

  const terms = Array.from(new Set(quotedTerms(suggestion.message)));
  if (terms.length === 0) {
    // "Apply all 3 leadership bullet improvements": it stands for the 3 cards
    // it fixes, less any of them still shown on their own.
    const count = Number(suggestion.message.match(/\ball\s+(\d+)\b/i)?.[1]);
    if (!Number.isFinite(count) || count < 1) return 1;
    const shown = bulkChildren(suggestion, peers).length;
    return Math.max(count - shown, 0);
  }

  const section = normalizeSection(suggestion.section);
  const represented = new Set<string>();
  for (const peer of peers) {
    if (peer.id === suggestion.id || isBulkAutoFixSuggestion(peer)) continue;
    if (normalizeSection(peer.section) !== section) continue;
    quotedTerms(peer.message).forEach(term => represented.add(term));
  }
  return terms.filter(term => !represented.has(term)).length;
}

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
  const coveredIds = new Set<string>();

  for (const suggestion of suggestions) {
    if (suggestion.status !== "fixed" || !isBulkAutoFixSuggestion(suggestion)) continue;
    const section = normalizeSection(suggestion.section);
    const covered = coverageBySection.get(section) ?? new Set<string>();
    quotedTerms(suggestion.message).forEach(term => covered.add(term));
    if (covered.size > 0) coverageBySection.set(section, covered);
    bulkChildren(suggestion, suggestions).forEach(child => coveredIds.add(child.id));
  }

  return suggestions.filter(suggestion => {
    if (
      suggestion.status !== "pending"
      || suggestion.fix_type !== "auto"
      || isBulkAutoFixSuggestion(suggestion)
    ) return true;

    if (coveredIds.has(suggestion.id)) return false;
    const covered = coverageBySection.get(normalizeSection(suggestion.section));
    if (!covered) return true;
    const terms = quotedTerms(suggestion.message);
    return terms.length === 0 || !terms.every(term => covered.has(term));
  });
}
