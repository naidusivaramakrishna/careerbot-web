import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";
import { withoutEmbeddedImages } from "@/api/resumeatsapi";

function hasResumeContent(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return [
    "contact",
    "personal_info",
    "personalInfo",
    "llm_data",
    "work_experience",
    "experience",
    "workExperience",
    "education",
    "technical_skills",
    "categorizedSkills",
  ].some((key) => data[key] != null);
}

// These are best-effort caches for the builder; the enhanced resume is always
// re-fetched from the server. A full or unavailable localStorage must never
// turn a successful ATS scan into a "could not prepare fixes" error.
export function cacheBuilderResume(enhancedResumeId: string, sourceData: unknown, atsScore?: unknown) {
  if (!hasResumeContent(sourceData)) return;

  try {
    const mappedData = mapParserOutputToBuilderData(sourceData);
    localStorage.setItem(
      "cached_resume_data",
      JSON.stringify(withoutEmbeddedImages({
        resumeId: enhancedResumeId,
        data: { ...mappedData, id: enhancedResumeId, ...(atsScore ? { ats_score: atsScore } : {}) },
      }))
    );
  } catch {
    // non-fatal cache write
  }
}

/** Known enhanced-resume IDs; a corrupted or non-array cache value reads as empty. */
export function readEnhancedResumeIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("enhanced_resume_ids") || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return []; // corrupted list — start over
  }
}

/**
 * Best-effort write of an ATS report to both storages. Readers prefer
 * localStorage, so when the localStorage write fails (quota) the old entry is
 * removed after sessionStorage succeeds; otherwise a stale copy would shadow
 * the fresh sessionStorage one.
 */
export function writeReportCache(key: string, payload: unknown) {
  const serialized = JSON.stringify(withoutEmbeddedImages(payload));
  let localStorageOk = false;
  try {
    localStorage.setItem(key, serialized);
    localStorageOk = true;
  } catch {
    // localStorage quota exceeded or unavailable; fall back to sessionStorage
  }

  // If localStorage write succeeded, we're done. If it failed, write to
  // sessionStorage as a fallback, then clear the stale localStorage entry.
  if (!localStorageOk) {
    try {
      sessionStorage.setItem(key, serialized);
      // Only clear after confirming sessionStorage worked, so we don't lose all copies.
      try { localStorage.removeItem(key); } catch { /* non-fatal */ }
    } catch { /* non-fatal cache write — reader still has stale localStorage */ }
  }
}

export function rememberEnhancedResumeId(enhancedResumeId: string) {
  try {
    localStorage.setItem("current_resume_id", enhancedResumeId);

    const existingIds = readEnhancedResumeIds();
    if (!existingIds.includes(enhancedResumeId)) {
      localStorage.setItem("enhanced_resume_ids", JSON.stringify([...existingIds, enhancedResumeId]));
    }
  } catch {
    // non-fatal cache write
  }
}
