import { getEnhancedResume } from "@/api/enhancerApi";
import { countUserAppliedFixes } from "@/utils/appliedFixes";

type RefreshResult = {
  enhanced_resume_id: string;
  applied_fixes?: unknown;
};

/**
 * Whether a successful force-refresh response is known to have removed fixes.
 * `applied_fixes` is optional on the stored-record shape; an omitted field is
 * therefore equivalent to an empty list, not a failed verification. A failed
 * GET remains unknown so callers can avoid reviving stale browser-only state.
 */
export type FreshEnhancementVerification = "cleared" | "retained" | "unknown";

export async function verifyFreshEnhancement(
  result: RefreshResult,
): Promise<FreshEnhancementVerification> {
  if (Array.isArray(result.applied_fixes)) {
    // Fixes the scan applied by itself (mode "auto") are not saved work that was retained.
    return countUserAppliedFixes(result.applied_fixes) === 0 ? "cleared" : "retained";
  }

  try {
    const record = await getEnhancedResume(result.enhanced_resume_id);
    return countUserAppliedFixes(record?.applied_fixes) > 0 ? "retained" : "cleared";
  } catch {
    return "unknown";
  }
}
