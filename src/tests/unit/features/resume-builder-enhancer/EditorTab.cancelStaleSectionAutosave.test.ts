/**
 * Regression test for the "resume-item-deleted" delete-race guard (P1).
 *
 * A section's delete handler (e.g. Certifications.tsx, in the stacked
 * split2/pr2-ui-sections-templates PR) dispatches "resume-item-deleted"
 * before calling its own DELETE endpoint, expecting EditorTab's listener to
 * cancel a queued autosave and, if one has already fired and is awaiting a
 * response, hand its promise back via `awaitInFlight` so the delete handler
 * can await it -- guaranteeing DELETE always lands last.
 *
 * The listener body previously lived only inline inside a useEffect closure
 * in a large, hard-to-render component, so this contract was never actually
 * exercised: Certifications.deleteRace.test.tsx (in the sibling PR) proves
 * only the dispatch side, using a hand-written stand-in listener instead of
 * this real one. Pulled the listener body out to
 * handleStaleSectionAutosaveEvent so it can be tested directly here.
 */
import { describe, it, expect } from "vitest";
import { handleStaleSectionAutosaveEvent } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

function makeCtx(overrides: Partial<{
  openModalSection: string | null;
  autoSaveTimer: NodeJS.Timeout | null;
  autoSaveInFlight: Promise<void> | null;
}> = {}) {
  const skipNextAutoSaveForSectionRef = { current: null as string | null };
  const autoSaveTimerRef = { current: overrides.autoSaveTimer ?? null };
  const autoSaveInFlightRef = { current: overrides.autoSaveInFlight ?? null };
  return {
    ctx: {
      openModalSection: overrides.openModalSection ?? "Certifications",
      skipNextAutoSaveForSectionRef,
      autoSaveTimerRef,
      autoSaveInFlightRef,
    },
    skipNextAutoSaveForSectionRef,
    autoSaveTimerRef,
    autoSaveInFlightRef,
  };
}

function deleteEvent(detail: {
  section?: unknown;
  suppressNext?: unknown;
  awaitInFlight?: { promise?: Promise<void> };
}): Event {
  return new CustomEvent("resume-item-deleted", { detail });
}

describe("EditorTab's resume-item-deleted listener (delete-race guard, P1 regression)", () => {
  it("hands back the in-flight autosave promise so a delete handler can await it", async () => {
    let resolveAutosave: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => { resolveAutosave = resolve; });
    const { ctx, autoSaveInFlightRef } = makeCtx({ autoSaveInFlight: inFlight });
    autoSaveInFlightRef.current = inFlight;

    const awaitInFlight: { promise?: Promise<void> } = {};
    handleStaleSectionAutosaveEvent(
      deleteEvent({ section: "Certifications", awaitInFlight }),
      ctx,
    );

    expect(awaitInFlight.promise).toBe(inFlight);
    resolveAutosave();
    await awaitInFlight.promise;
  });

  it("clears a queued (not yet fired) autosave timer", () => {
    const timer = setTimeout(() => {}, 10_000);
    const { ctx, autoSaveTimerRef } = makeCtx({ autoSaveTimer: timer });

    handleStaleSectionAutosaveEvent(deleteEvent({ section: "Certifications" }), ctx);

    expect(autoSaveTimerRef.current).toBeNull();
    clearTimeout(timer);
  });

  it("does nothing when the event's section doesn't match the currently open modal section", () => {
    const inFlight = Promise.resolve();
    const { ctx } = makeCtx({ openModalSection: "Education", autoSaveInFlight: inFlight });

    const awaitInFlight: { promise?: Promise<void> } = {};
    handleStaleSectionAutosaveEvent(
      deleteEvent({ section: "Certifications", awaitInFlight }),
      ctx,
    );

    expect(awaitInFlight.promise).toBeUndefined();
  });

  it("leaves awaitInFlight untouched when nothing is currently in flight", () => {
    const { ctx } = makeCtx({ autoSaveInFlight: null });

    const awaitInFlight: { promise?: Promise<void> } = {};
    handleStaleSectionAutosaveEvent(
      deleteEvent({ section: "Certifications", awaitInFlight }),
      ctx,
    );

    expect(awaitInFlight.promise).toBeUndefined();
  });

  it("records suppressNext for the section so the next debounced autosave is skipped", () => {
    const { ctx, skipNextAutoSaveForSectionRef } = makeCtx();

    handleStaleSectionAutosaveEvent(
      deleteEvent({ section: "Certifications", suppressNext: true }),
      ctx,
    );

    expect(skipNextAutoSaveForSectionRef.current).toBe("Certifications");
  });
});
