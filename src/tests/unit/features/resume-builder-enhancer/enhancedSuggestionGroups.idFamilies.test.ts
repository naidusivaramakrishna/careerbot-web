/**
 * "Apply all 3 leadership bullet improvements at once" fixed the three bullets
 * but their individual cards stayed on screen: the link between a bulk card and
 * its children was only made through quoted keywords, and these messages are
 * plain sentences. The server names the families by id; these are the real ones.
 */
import { describe, it, expect } from "vitest";
import type { EnhancedSuggestion } from "@/types/api.types";
import {
  bulkChildren,
  suggestionProgressWeight,
  withoutPendingChildrenOfFixedBulkSuggestions,
} from "@/app/(resume)/builder/creation/_utils/enhancedSuggestionGroups";

const card = (id: string, section: string, message: string, status: "pending" | "fixed" = "pending",
  fix_type: EnhancedSuggestion["fix_type"] = "auto"): EnhancedSuggestion =>
  ({ id, section, message, fix_type, status });

const FAMILIES = [
  {
    name: "Leadership", section: "Leadership",
    unrelated: card("leadership_score_gap", "Leadership", "Leadership scored 15/100", "pending", "manual"),
    kids: ["leadership_bullet_suggestion_0", "leadership_bullet_suggestion_1", "leadership_bullet_suggestion_2"],
    bulkId: "leadership_bullets_apply_all", bulkMessage: "Apply all 3 leadership bullet improvements at once",
  },
  {
    name: "Experience", section: "content",
    unrelated: card("grammar_correction_0", "content", "Fix grammar", "pending", "auto"),
    kids: ["experience_bullet_0", "experience_bullet_1", "experience_bullet_2"],
    bulkId: "experience_bullets_apply_all", bulkMessage: "Apply all 3 experience bullet improvements at once",
  },
];

describe.each(FAMILIES)("$name bulk card", (f) => {
  const children = f.kids.map((id, i) => card(id, f.section, `Rewrite sentence number ${i} of the section`));
  const bulk = (status: "pending" | "fixed") => card(f.bulkId, f.section, f.bulkMessage, status);

  it("links its children by id and nothing else", () => {
    expect(bulkChildren(bulk("fixed"), [...children, f.unrelated, bulk("fixed")]).map(c => c.id)).toEqual(f.kids);
  });

  it("hides the pending children once it is fixed, keeping unrelated cards", () => {
    const shown = withoutPendingChildrenOfFixedBulkSuggestions([f.unrelated, ...children, bulk("fixed")]);
    expect(shown.map(c => c.id)).toEqual([f.unrelated.id, f.bulkId]);
  });

  it("shows the children again when it is undone (pending)", () => {
    const shown = withoutPendingChildrenOfFixedBulkSuggestions([f.unrelated, ...children, bulk("pending")]);
    expect(shown).toHaveLength(5);
  });

  it("keeps a child the user fixed on its own (it owns an Undo)", () => {
    const own = { ...children[0], status: "fixed" as const };
    const shown = withoutPendingChildrenOfFixedBulkSuggestions([own, children[1], children[2], bulk("fixed")]);
    expect(shown.map(c => c.id)).toEqual([own.id, f.bulkId]);
  });

  it("counts as the 3 improvements it fixed when the children are hidden", () => {
    const shown = withoutPendingChildrenOfFixedBulkSuggestions([f.unrelated, ...children, bulk("fixed")]);
    expect(suggestionProgressWeight(bulk("fixed"), shown)).toBe(3);
  });

  it("adds nothing on top of children that are still listed", () => {
    expect(suggestionProgressWeight(bulk("pending"), [...children, bulk("pending")])).toBe(0);
  });
});

it("does not touch the keyword family that already worked", () => {
  const kids = [card("keyword_suggestion_0", "Keywords", "Add 'Docker' to Skills"), card("keyword_suggestion_1", "Keywords", "Add 'AWS' to Skills")];
  const bulk = card("keyword_suggestions_apply_all", "Keywords", "Add all at once: 'Docker', 'AWS'", "fixed");
  expect(withoutPendingChildrenOfFixedBulkSuggestions([...kids, bulk]).map(c => c.id)).toEqual([bulk.id]);
  expect(suggestionProgressWeight(bulk, [bulk])).toBe(2);
});

it("a section's cards with a similar id prefix in another section are not swallowed", () => {
  const other = card("leadership_bullet_suggestion_9", "Projects", "Rewrite this project line");
  const bulk = card("leadership_bullets_apply_all", "Leadership", "Apply all 3 leadership bullet improvements at once", "fixed");
  expect(withoutPendingChildrenOfFixedBulkSuggestions([other, bulk]).map(c => c.id)).toEqual([other.id, bulk.id]);
});
