/**
 * ai-review on #144 @ edf69375:
 *  P2 the Save-vs-autosave guard did not keep autosave from landing after Save
 *     (an in-flight autosave's own state update re-arms a timer while Save waits);
 *  P2 Save could be submitted twice while the guard was waiting;
 *  P2 explicit Save of a custom section on an ENHANCED resume sent the raw
 *     payload and read the synced ids from the old response keys.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/api/enhancerApi", () => ({ autoSaveEnhancedResume: vi.fn(), updateEnhancedResume: vi.fn() }));

import * as editor from "@/app/(resume)/builder/creation/_components/editor/EditorTab";
import { transformCustomSectionsForBackend } from "@/api/resumeApi";

const refs = () => ({
  autoSaveTimerRef: { current: null as NodeJS.Timeout | null },
  autoSaveInFlightRef: { current: null as Promise<void> | null },
});

describe("awaitPendingSectionAutosave: nothing armed or in flight when it returns", () => {
  it("clears a timer that the in-flight autosave re-armed while Save was waiting", async () => {
    const r = refs();
    let reArmed: NodeJS.Timeout | null = null;
    // The in-flight autosave settles and, as EditorTab's effect does after its
    // setResumeData, arms a fresh debounce timer.
    r.autoSaveInFlightRef.current = Promise.resolve().then(() => {
      reArmed = setTimeout(() => {}, 3_000);
      r.autoSaveTimerRef.current = reArmed;
      r.autoSaveInFlightRef.current = null;
    });
    await editor.awaitPendingSectionAutosave(r);
    expect(r.autoSaveTimerRef.current).toBeNull();
    if (reArmed) clearTimeout(reArmed);
  });

  it("control: with nothing pending it returns immediately and leaves nothing armed", async () => {
    const r = refs();
    await editor.awaitPendingSectionAutosave(r);
    expect(r.autoSaveTimerRef.current).toBeNull();
    expect(r.autoSaveInFlightRef.current).toBeNull();
  });
});

describe("explicit Save lock (double submit, autosave during Save)", () => {
  it("takes the lock and sets the saving state synchronously; a second Save is refused", () => {
    const lock = { current: false };
    const setIsSaving = vi.fn();
    expect(editor.beginExplicitSave({ explicitSaveInProgressRef: lock, setIsSaving })).toBe(true);
    expect(setIsSaving).toHaveBeenCalledWith(true);       // before any await: Save/Cancel disable at once
    expect(editor.beginExplicitSave({ explicitSaveInProgressRef: lock, setIsSaving })).toBe(false);
    editor.endExplicitSave({ explicitSaveInProgressRef: lock, setIsSaving });
    expect(lock.current).toBe(false);
    expect(editor.beginExplicitSave({ explicitSaveInProgressRef: lock, setIsSaving })).toBe(true); // usable again
  });

  it("autosave may not arm while an explicit Save holds the lock", () => {
    expect(editor.canArmSectionAutosave({ current: true })).toBe(false);
    expect(editor.canArmSectionAutosave({ current: false })).toBe(true); // control
  });
});

describe("explicit Save of a custom section", () => {
  const client = [{ id: "custom_abc", sectionName: "Volunteer", fields: [{ id: "f1", label: "Org", value: "Red Cross" }] }];

  it("sends the backend shape for an ENHANCED resume (same as persistEnhancedCustomSections)", () => {
    expect(editor.buildCustomSectionsSavePayload(client as never, true))
      .toEqual({ customSections: transformCustomSectionsForBackend(client as never) });
  });

  it("control: a BUILDER resume sends the sections as-is (updateResume transforms them itself)", () => {
    expect(editor.buildCustomSectionsSavePayload(client as never, false)).toEqual({ customSections: client });
  });

  it("reads the synced sections from enhanced_data.customSections (and custom_sections)", () => {
    const server = [{ id: "server-1", sectionName: "Volunteer", fields: [] }];
    expect(editor.readSyncedCustomSections({ enhanced_resume: { enhanced_data: { customSections: server } } }, true)).toEqual(server);
    expect(editor.readSyncedCustomSections({ enhanced_data: { custom_sections: server } }, true)).toEqual(server);
    expect(editor.readSyncedCustomSections({ customSections: server }, false)).toEqual(server); // builder
  });
});

describe("restoreCancelledAutosave (Save that does not complete)", () => {
  it("re-arms the autosave a FAILED Save (request error) cancelled, so the last edits still persist", () => {
    const triggerAutoSave = vi.fn();
    expect(editor.restoreCancelledAutosave({ cancelledQueuedAutosave: true, saveSucceeded: false, blockedByValidation: false, section: "Education", triggerAutoSave })).toBe(true);
    expect(triggerAutoSave).toHaveBeenCalledWith("Education");
  });

  it("control: a successful Save does not re-arm (it already wrote everything)", () => {
    const triggerAutoSave = vi.fn();
    expect(editor.restoreCancelledAutosave({ cancelledQueuedAutosave: true, saveSucceeded: true, blockedByValidation: false, section: "Education", triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });

  it("opposite state: nothing was queued, so nothing is re-armed even if Save failed", () => {
    const triggerAutoSave = vi.fn();
    expect(editor.restoreCancelledAutosave({ cancelledQueuedAutosave: false, saveSucceeded: false, blockedByValidation: false, section: "Education", triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });
});

describe("restoreCancelledAutosave: validation-blocked Save", () => {
  it("does NOT re-arm when client validation blocked the Save (that data must not be written by any path)", () => {
    const triggerAutoSave = vi.fn();
    expect(editor.restoreCancelledAutosave({ cancelledQueuedAutosave: true, saveSucceeded: false, blockedByValidation: true, section: "Education", triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });
});

describe("mergeBackendItemIds (autosave id write-back shared by state and the live ref)", () => {
  it("gives id-less items the backend id at the same index and keeps existing ids", () => {
    const merged = editor.mergeBackendItemIds(
      [{ id: "keep", school: "A" }, { school: "B" }, { _id: "legacy", school: "C" }],
      [{ id: "srv-0" }, { id: "srv-1" }, { id: "srv-2" }],
    );
    expect(merged).toEqual([{ id: "keep", school: "A" }, { id: "srv-1", school: "B" }, { _id: "legacy", school: "C" }]);
  });

  it("control: leaves an item alone when the backend returned no id for it", () => {
    expect(editor.mergeBackendItemIds([{ school: "B" }], [{}])).toEqual([{ school: "B" }]);
  });
});

/**
 * #166 (follow-up to #144), P2: a Save the SERVER rejected for validation
 * re-armed the autosave it had cancelled, so the lenient autosave endpoint
 * wrote the data explicit Save was refused for. Both transports are covered:
 * updateResume rethrows the axios error; updateEnhancedResume (safePatch)
 * throws an Error carrying the response body as `__raw` and no status.
 */
describe("restoreCancelledAutosave: Save rejected by server-side validation", () => {
  const base = { cancelledQueuedAutosave: true, saveSucceeded: false, blockedByValidation: false, section: "Education" };
  const validationBody = {
    success: false,
    error: { message: "Validation failed.", error_code: "VALIDATION_ERROR", details: { validation_errors: [{ field: "education → 0 → score_value", message: "out of range" }] } },
  };

  it("does NOT re-arm after a builder Save's axios 422", () => {
    const triggerAutoSave = vi.fn();
    const saveError = Object.assign(new Error("Request failed with status code 422"), { response: { status: 422, data: validationBody } });
    expect(editor.restoreCancelledAutosave({ ...base, saveError, triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });

  it("does NOT re-arm after an enhanced Save's validation rejection (safePatch error: body in __raw, no status)", () => {
    const triggerAutoSave = vi.fn();
    const saveError = Object.assign(new Error("Validation failed."), { __raw: validationBody });
    expect(editor.restoreCancelledAutosave({ ...base, saveError, triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });

  it("does NOT re-arm after a 400 VALIDATION_ERROR (the API's ValidationException, e.g. a rejected email edit)", () => {
    const triggerAutoSave = vi.fn();
    const saveError = Object.assign(new Error("Bad Request"), {
      response: { status: 400, data: { success: false, error: { message: "Validation error on field 'email'", error_code: "VALIDATION_ERROR", details: { field: "email" } } } },
    });
    expect(editor.restoreCancelledAutosave({ ...base, saveError, triggerAutoSave })).toBe(false);
    expect(triggerAutoSave).not.toHaveBeenCalled();
  });

  it("control: a transport/server failure (500, network) still re-arms, so the edits are not lost", () => {
    for (const saveError of [
      Object.assign(new Error("Request failed with status code 500"), { response: { status: 500, data: { success: false, error: { message: "boom", error_code: "INTERNAL_ERROR" } } } }),
      Object.assign(new Error("Network Error"), { __raw: "Network Error" }),
      new Error("Network Error"),
    ]) {
      const triggerAutoSave = vi.fn();
      expect(editor.restoreCancelledAutosave({ ...base, saveError, triggerAutoSave })).toBe(true);
      expect(triggerAutoSave).toHaveBeenCalledWith("Education");
    }
  });
});
