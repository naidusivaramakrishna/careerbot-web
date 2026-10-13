/**
 * The browser keeps each resume's recommendation cards (green "fixed" ones too) in
 * localStorage. When the saved record was replaced on the server (a fresh scan of
 * the original file) the old green cards were reloaded and the page claimed
 * "8 of 14 addressed" for a resume with no applied fixes.
 */
import { describe, it, expect } from "vitest";
import type { EnhancedSuggestion } from "@/types/api.types";
import { reconcileServerSuggestions } from "@/app/(resume)/builder/creation/_context/ResumeContext";

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
    const next = onLoad([card("s", "fixed")], [card("c")], []);
    expect(next.find(c => c.id === "s")?.status).toBe("fixed");
  });
});
