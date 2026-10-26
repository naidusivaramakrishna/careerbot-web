/**
 * The browser keeps each resume's recommendation cards (green "fixed" ones too) in
 * localStorage. When the saved record was replaced on the server (a fresh scan of
 * the original file) the old green cards were reloaded and the page claimed
 * "8 of 14 addressed" for a resume with no applied fixes.
 */
import { describe, it, expect } from "vitest";
import type { EnhancedSuggestion } from "@/types/api.types";
import { autoFixedCardsFromLedger, reconcileServerSuggestions } from "@/app/(resume)/builder/creation/_context/ResumeContext";

const card = (id: string, status: "pending" | "fixed" = "pending"): EnhancedSuggestion =>
  ({ id, section: "Summary", message: `card ${id}`, fix_type: "auto", status, undoAvailable: status === "fixed" });

const onLoad = (previous: EnhancedSuggestion[], server: EnhancedSuggestion[], ledger: string[] | undefined) =>
  reconcileServerSuggestions(
    previous, server,
    ledger ? new Map(ledger.map(id => [id, true] as [string, boolean])) : undefined,
    false, false, true, new Set(), undefined, ledger !== undefined,
  );

describe("initial load reconciles the browser's green cards with the server's ledger", () => {
  const stale = [card("a", "fixed"), card("b", "fixed"), card("c", "pending")];
  const server = [card("a"), card("b"), card("c")];

  it("reopens a green card the ledger does not list and the server lists as pending", () => {
    const next = onLoad(stale, server, []);
    expect(next.map(c => [c.id, c.status])).toEqual([["a", "pending"], ["b", "pending"], ["c", "pending"]]);
  });

  it("keeps a green card the ledger confirms, and reopens the others", () => {
    const next = onLoad(stale, server, ["a"]);
    expect(next.find(c => c.id === "a")?.status).toBe("fixed");
    expect(next.find(c => c.id === "b")?.status).toBe("pending");
  });

  it("changes nothing when the server sent no ledger (legacy response)", () => {
    const next = onLoad(stale, server, undefined);
    expect(next.filter(c => c.status === "fixed").map(c => c.id)).toEqual(["a", "b"]);
  });

  it("still protects a green card from an older pending list during an apply (not an initial load)", () => {
    const next = reconcileServerSuggestions(stale, server, undefined, false, false, false);
    expect(next.filter(c => c.status === "fixed").map(c => c.id)).toEqual(["a", "b"]);
  });

  it("leaves a card fixed by a section save (not listed by the server) alone", () => {
    // A section save marks its card fixed with undoAvailable: false (no ledger entry exists).
    const next = onLoad([{ ...card("s", "fixed"), undoAvailable: false }], [card("c")], []);
    expect(next.find(c => c.id === "s")?.status).toBe("fixed");
  });

  it("drops an Undo-able green card that neither the ledger nor the server list has", () => {
    const next = onLoad([card("contact_issue_3", "fixed"), card("c", "pending")], [card("c")], []);
    expect(next.map(c => [c.id, c.status])).toEqual([["c", "pending"]]);
  });

  it("keeps an unlisted Undo-able green card the ledger confirms", () => {
    const next = onLoad([card("contact_issue_3", "fixed")], [card("c")], ["contact_issue_3"]);
    expect(next.find(c => c.id === "contact_issue_3")?.status).toBe("fixed");
  });

  it("keeps a re-filled deleted-section card: it is local-only and never in the ledger", () => {
    const next = onLoad([card("section-deleted-projects", "fixed")], [card("c")], []);
    expect(next.find(c => c.id === "section-deleted-projects")?.status).toBe("fixed");
  });

  it("keeps an unlisted green card when the server sent no ledger (legacy response)", () => {
    const next = onLoad([card("contact_issue_3", "fixed")], [card("c")], undefined);
    expect(next.find(c => c.id === "contact_issue_3")?.status).toBe("fixed");
  });
});


describe("fixes the scan applied for the user (mode auto)", () => {
  const ledger = [
    { suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true,
      suggestion: { id: "suggested_summary_0", section: "Summary", fix_type: "auto", before_example: "Hard working student.",
                    after_example: "Backend developer building Python APIs.", message: "Rewrite your summary" } },
    { suggestion_id: "contact_issue_0", status: "applied", undo_available: true },            // applied by hand: the browser has it
    { suggestion_id: "gone", status: "applied", undo_available: false, auto: true,
      suggestion: { id: "gone", section: "Skills", fix_type: "auto", message: "Remove duplicates" } },
  ];

  it("become completed cards with Undo, only for the automatic ones", () => {
    const cards = autoFixedCardsFromLedger(ledger);
    expect(cards.map((c) => c.id)).toEqual(["suggested_summary_0", "gone"]);
    expect(cards[0]).toMatchObject({ section: "Summary", fix_type: "auto", status: "fixed", undoAvailable: true });
    expect(cards[1].undoAvailable).toBe(false);          // the server said it cannot be undone any more
  });

  it("is empty for a record with no list or no automatic fix", () => {
    expect(autoFixedCardsFromLedger(undefined)).toEqual([]);
    expect(autoFixedCardsFromLedger([{ suggestion_id: "a", status: "applied", undo_available: true }])).toEqual([]);
    expect(autoFixedCardsFromLedger([{ suggestion_id: "a", auto: true }])).toEqual([]);     // no suggestion recorded
  });

  it("stay completed next to the pending manual cards when the editor loads", () => {
    const fixed = autoFixedCardsFromLedger(ledger);
    const manual: EnhancedSuggestion = { id: "contact_issue_0", section: "Contact", message: "Add LinkedIn", fix_type: "manual" };
    const applied = new Map(ledger.map((l) => [l.suggestion_id, l.undo_available] as [string, boolean]));

    const result = reconcileServerSuggestions(fixed, [manual], applied, true, false, true);

    const byId = Object.fromEntries(result.map((c) => [c.id, c]));
    expect(byId["suggested_summary_0"]).toMatchObject({ status: "fixed", undoAvailable: true });
    expect(byId["contact_issue_0"].status).toBe("pending");
  });
});
