/**
 * Regression test for the explicit-Save/debounced-autosave race that
 * duplicated (or reverted) multi-entry section rows -- e.g. an Education
 * entry whose CGPA/Percentage edit was saved via the Save button just
 * before the 3s autosave debounce fired.
 *
 * Explicit Save (handleSaveForm) sends the full section array through a
 * full-replace endpoint; autosave sends only id-carrying items through an
 * id-merge PATCH. Nothing previously stopped a queued or in-flight autosave
 * -- armed by the same edit -- from landing after Save's own write.
 * awaitPendingSectionAutosave closes that gap, mirroring the existing
 * "resume-item-deleted" delete-race guard (see
 * EditorTab.cancelStaleSectionAutosave.test.ts).
 */
import { describe, it, expect, vi } from "vitest";
import { awaitPendingSectionAutosave } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

function makeRefs(overrides: Partial<{
  autoSaveTimer: NodeJS.Timeout | null;
  autoSaveInFlight: Promise<void> | null;
}> = {}) {
  return {
    autoSaveTimerRef: { current: overrides.autoSaveTimer ?? null },
    autoSaveInFlightRef: { current: overrides.autoSaveInFlight ?? null },
  };
}

describe("awaitPendingSectionAutosave (explicit-Save/autosave race guard)", () => {
  it("clears a queued (not yet fired) autosave timer", async () => {
    const timer = setTimeout(() => {}, 10_000);
    const refs = makeRefs({ autoSaveTimer: timer });

    await awaitPendingSectionAutosave(refs);

    expect(refs.autoSaveTimerRef.current).toBeNull();
    clearTimeout(timer);
  });

  it("awaits an autosave PATCH already in flight before returning", async () => {
    let resolveAutosave: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => { resolveAutosave = resolve; });
    const refs = makeRefs({ autoSaveInFlight: inFlight });

    const order: string[] = [];
    const savePromise = awaitPendingSectionAutosave(refs).then(() => {
      order.push("autosave-awaited");
    });

    // Give the microtask queue a turn -- the guard should still be waiting.
    await Promise.resolve();
    expect(order).toEqual([]);

    order.push("resolving-autosave");
    resolveAutosave();
    await savePromise;

    expect(order).toEqual(["resolving-autosave", "autosave-awaited"]);
  });

  it("resolves immediately when nothing is queued or in flight", async () => {
    const refs = makeRefs();
    await expect(awaitPendingSectionAutosave(refs)).resolves.toBeUndefined();
  });

  it("does not resolve while the in-flight autosave is still pending, so an explicit Save can't race ahead of it", async () => {
    const inFlight = new Promise<void>(() => {}); // never resolves in this test
    const refs = makeRefs({ autoSaveInFlight: inFlight });

    const onSettled = vi.fn();
    awaitPendingSectionAutosave(refs).then(onSettled);

    await Promise.resolve();
    await Promise.resolve();
    expect(onSettled).not.toHaveBeenCalled();
  });
});
