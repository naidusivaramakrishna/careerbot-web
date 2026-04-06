// Match-related API calls
import {
  parseResume,
  parseJDFile,
  parseJDText,
  matchResumeAndJD,
  getResume,
  getMatchAnalytics,
} from "@/api/parserApi";

interface MatchResponse {
  data: Record<string, unknown>;
  match_id?: string;
  duplicate?: boolean;
}

/**
 * Get match by resume and JD IDs
 */
export async function getMatchByIds(resume_id: string, jd_id: string): Promise<unknown> {
  const response = await fetch(`/api/v1/matcher/match?resume_id=${resume_id}&jd_id=${jd_id}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
}

/**
 * Process resume and JD match analysis
 * Returns match results with analytics
 */
export async function processMatchAnalysis(
  uploadedFile: File,
  jdFile: File | null,
  jdText: string,
  onStageChange: (stage: "parsing" | "extracting" | "matching" | "scoring" | "generating") => void
) {
  // Step 1: Parse Resume
  onStageChange("parsing");
  const resumeParsed = await parseResume(uploadedFile);
  const resumeData = resumeParsed as unknown as Record<string, unknown>;
  const resume_id =
    (resumeData?.resume_id as string) ??
    (resumeData?.id as string) ??
    null;

  if (!resume_id) {
    throw new Error("Resume parsing failed — no resume_id returned.");
  }

  // Step 2: Get full resume data
  onStageChange("extracting");
  let fullResumeData;
  try {
    fullResumeData = await getResume(resume_id);
  } catch {
    fullResumeData = resumeParsed;
  }

  // Step 3: Parse JD
  onStageChange("matching");
  let jdParsed;
  if (jdFile) {
    jdParsed = await parseJDFile(jdFile);
  } else {
    jdParsed = await parseJDText(jdText);
  }

  const jd_id = jdParsed?.jd_id ?? null;
  if (!jd_id) {
    throw new Error("JD parsing failed — no JD ID returned.");
  }

  // Step 4: Match Resume and JD (with retry logic)
  onStageChange("scoring");
  let matchResp: MatchResponse | null = null;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      matchResp = (await matchResumeAndJD(resume_id, jd_id)) as MatchResponse;
      break; // Success
    } catch (err: unknown) {
      retryCount++;
      if (retryCount <= maxRetries) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
        );
      } else {
        throw err; // Max retries exceeded
      }
    }
  }

  if (!matchResp) {
    throw new Error("Failed to match resume and JD");
  }

  let finalMatchData = matchResp.data as Record<string, unknown>;

  // Handle duplicate matches
  if (matchResp.duplicate) {
    try {
      const existing = await getMatchByIds(resume_id, jd_id);
      if (Array.isArray(existing)) {
        const matched = existing.find(
          (m: Record<string, unknown>) => m.jd_id === jd_id || m.job_description_id === jd_id
        );
        finalMatchData = (matched as Record<string, unknown>) || (existing[0] as Record<string, unknown>);
      } else {
        finalMatchData = existing as Record<string, unknown>;
      }
    } catch {
      finalMatchData = matchResp.data;
    }
  }

  if (!finalMatchData?.match_id && matchResp.match_id) {
    finalMatchData = { ...finalMatchData, match_id: matchResp.match_id };
  }

  // Step 5: Get Analytics
  onStageChange("generating");
  try {
    const analytics = await getMatchAnalytics(resume_id, jd_id);
    if (analytics) {
      finalMatchData = { ...finalMatchData, analytics };
    }
  } catch {
    // Analytics fetch failed, continue without it
  }

  return {
    matchResults: {
      data: finalMatchData,
      match_id: matchResp.match_id || (finalMatchData?.match_id as string),
      jd_id: jd_id,
      duplicate: matchResp.duplicate,
    },
    parsedResumeData: fullResumeData,
    parsedJDData: jdParsed,
  };
}
