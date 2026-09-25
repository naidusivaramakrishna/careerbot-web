import { applyCatalogueToResume, applyCatalogueToEnhancedResume } from '@/api/resumeApi';

/**
 * Saves a chosen style catalogue on a resume, shared by the builder's
 * CatalogueTab and the /templates page.
 *
 * - Enhanced resumes live in another collection: the regular catalogue
 *   endpoint answers 404 for their id, so they go through the enhancer API.
 * - One request at a time, so the server applies clicks in click order;
 *   clicks made while one is in flight collapse to the latest (the
 *   enhanced-resume update re-scores the resume on every call).
 */
export function createCataloguePersister(onError: (err: unknown) => void) {
  const state: { inFlight: boolean; pending: { id: string; enhanced: boolean; key: string } | null } = {
    inFlight: false,
    pending: null,
  };

  return (resumeId: string, key: string, enhanced: boolean): void => {
    state.pending = { id: resumeId, enhanced, key };
    if (state.inFlight) return;
    state.inFlight = true;
    void (async () => {
      while (state.pending) {
        const { id, enhanced: isEnhanced, key: nextKey } = state.pending;
        state.pending = null;
        try {
          await (isEnhanced ? applyCatalogueToEnhancedResume(id, nextKey) : applyCatalogueToResume(id, nextKey));
        } catch (err) {
          onError(err);
        }
      }
      state.inFlight = false;
    })();
  };
}
