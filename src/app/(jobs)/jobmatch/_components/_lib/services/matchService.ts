// Match analysis business logic and data transformation

/**
 * Validate resume file size and type
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Resume must be under 10MB." };
  }

  const validTypes = [".pdf", ".doc", ".docx", ".txt"];
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

  if (!validTypes.includes(fileExtension)) {
    return { valid: false, error: "Invalid file type. Please upload PDF, DOC, DOCX, or TXT file." };
  }

  return { valid: true };
}

/**
 * Validate job description input
 */
export function validateJDInput(jdFile: File | null, jdText: string): { valid: boolean; error?: string } {
  if (!jdFile && !jdText.trim()) {
    return { valid: false, error: "Please upload a JD file or paste JD text." };
  }

  return { valid: true };
}

/**
 * Extract ATS score from match results
 */
export function extractATSScore(matchResults: any): number {
  if (!matchResults?.data) return 0;

  const data = matchResults.data;

  return (
    data.ats_score?.final_score ??
    data.ats_score?.FinalWeightedScore ??
    data.ats_score?.FinalWeighted?.score ??
    data.match_score ??
    0
  );
}

/**
 * Extract missing skills from match results
 */
export function extractMissingSkills(matchResults: any) {
  if (!matchResults?.data) {
    return {
      critical: [],
      important: [],
      niceToHave: [],
      soft: [],
    };
  }

  const data = matchResults.data;

  return {
    critical: data.missing_critical_skills ?? data.critical_skills ?? [],
    important: data.missing_important_skills ?? data.important_skills ?? [],
    niceToHave: data.missing_nice_to_have_skills ?? data.nice_to_have_skills ?? [],
    soft: data.missing_soft_skills ?? data.soft_skills ?? [],
  };
}

/**
 * Extract matched skills from match results
 */
export function extractMatchedSkills(matchResults: any): string[] {
  if (!matchResults?.data) return [];

  const data = matchResults.data;

  return (
    data.matched_skills ??
    data.technical_skills ??
    data.skills ??
    []
  );
}
