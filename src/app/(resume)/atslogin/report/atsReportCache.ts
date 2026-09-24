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

export function rememberEnhancedResumeId(enhancedResumeId: string) {
  try {
    localStorage.setItem("current_resume_id", enhancedResumeId);

    let existingIds: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("enhanced_resume_ids") || "[]");
      if (Array.isArray(parsed)) existingIds = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      // corrupted list — start over
    }
    if (!existingIds.includes(enhancedResumeId)) {
      localStorage.setItem("enhanced_resume_ids", JSON.stringify([...existingIds, enhancedResumeId]));
    }
  } catch {
    // non-fatal cache write
  }
}
