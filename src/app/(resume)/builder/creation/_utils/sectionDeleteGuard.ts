/**
 * Delete-vs-autosave guard shared by every section editor's item-delete
 * handler. EditorTab listens for RESUME_ITEM_DELETED_EVENT
 * (handleStaleSectionAutosaveEvent) and only acts when `section` equals the
 * open modal's section name, so callers must pass that exact builder section
 * name (e.g. "Work Experience", "Licenses and Credentials").
 */
export const RESUME_ITEM_DELETED_EVENT = "resume-item-deleted";

/**
 * Call right before the item's DELETE request. Cancels a queued debounced
 * autosave for `section` and, if one has already fired and its PATCH is still
 * awaiting a response, waits for it. Otherwise that pre-delete PATCH can land
 * after the DELETE and the backend (which merges arrays by id) brings the
 * deleted item back.
 */
export async function waitForSectionAutosaveBeforeDelete(section: string, itemId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const awaitInFlight: { promise?: Promise<void> } = {};
  window.dispatchEvent(new CustomEvent(RESUME_ITEM_DELETED_EVENT, {
    detail: { section, itemId, awaitInFlight },
  }));
  if (awaitInFlight.promise) {
    await awaitInFlight.promise;
  }
}

/**
 * Call after a successful DELETE, right before the local state update: skips
 * the one autosave that update would trigger (its snapshot adds nothing the
 * DELETE didn't already persist).
 */
export function suppressNextSectionAutosave(section: string, itemId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RESUME_ITEM_DELETED_EVENT, {
    detail: { section, itemId, suppressNext: true },
  }));
}
