import { isAuthenticated } from "./authApi";
import { getCorrelationId } from "@/lib/correlationId";
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";
import { enhanceResume } from "./enhancerApi";
import { getResume } from "./parserApi";

const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL || '';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Parser responses can contain an extracted profile picture as a data URL or
// a large base64 string. The ATS report uses the authenticated preview endpoint
// for rendering, so binary image data must not be duplicated into browser
// storage (doing so can exceed the ~5 MB localStorage quota after a successful
// backend/AI response and incorrectly surface as a parsing failure).
export function withoutEmbeddedImages(value: unknown, key = ""): unknown {
  const imageKey = /(?:^|_)(?:profile_?)?(?:picture|photo|image|avatar|thumbnail)(?:_|$)|base64|binary/i.test(key);
  if (typeof value === "string") {
    if (
      value.startsWith("data:image/") ||
      (imageKey && value.length > 2048) ||
      value.length > 128 * 1024
    ) return undefined;
    return value;
  }
  if (Array.isArray(value)) {
    if (imageKey && value.length > 256 && value.every(item => typeof item === "number")) return undefined;
    return value.map(item => withoutEmbeddedImages(item)).filter(item => item !== undefined);
  }
  if (!isObject(value)) return value;

  const cleaned: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    const normalized = withoutEmbeddedImages(childValue, childKey);
    if (normalized !== undefined) cleaned[childKey] = normalized;
  }
  return cleaned;
}

function storeAtsAnalysis(key: string, payload: unknown): void {
  const serialized = JSON.stringify(withoutEmbeddedImages(payload));
  try {
    localStorage.setItem(key, serialized);
  } catch {
    // Storage availability/quota is a cache concern and must never turn a
    // successful parse + ATS analysis into a frontend processing failure.
    try { sessionStorage.setItem(key, serialized); } catch { /* non-fatal */ }
  }
}

function hasScoreProjectionContract(value: unknown): boolean {
  if (!isObject(value)) return false;
  const candidates = [value, value.ats_score, value.ats_breakdown, value.ats_display, value.enhancer_state];
  return candidates.some((candidate) => isObject(candidate) && (
    Object.prototype.hasOwnProperty.call(candidate, "score_status") ||
    Object.prototype.hasOwnProperty.call(candidate, "estimated_score_after_fixes")
  ));
}
const SERVER_ERROR_PATTERN = /internal server error|status code 500|http 500/i;
const PARSE_SERVER_ERROR_MESSAGE =
  "We could not read your resume right now. Please try again in a moment. If the problem continues, contact support with the time of this attempt.";
const ENHANCE_SERVER_ERROR_MESSAGE =
  "ATS analysis could not be completed after your resume was parsed. Please try again in a moment. If the problem continues, contact support with the time of this attempt.";
const SCANNED_RESUME_MESSAGE =
  "This appears to be a scanned or image-based resume. Please upload a PDF or DOCX with selectable text.";

function parserFailureMessage(parsed: unknown): string | null {
  if (!isObject(parsed)) return "The resume parser returned an invalid response. Please upload the file again.";

  const parsedData = isObject(parsed.parsed_data) ? parsed.parsed_data : null;
  const needsOcr = parsed.ocr_needed === true || parsedData?.ocr_needed === true;
  // Only error fields count as details. `message` on a response without an
  // error is usually a success note ("Resume parsed successfully").
  const details = [parsedData?.error, parsed.error]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (needsOcr) {
    // The backend text is diagnostic (e.g. raw JSON); users get the friendly copy.
    if (details) logApiError("POST", "parse_resume", new Error(details));
    return SCANNED_RESUME_MESSAGE;
  }

  const resumeId = parsed.resume_id;
  if (typeof resumeId !== "string" || !resumeId.trim()) {
    return details ?? "Your resume could not be prepared for ATS analysis because the parser did not return a resume ID. Please upload the file again.";
  }

  return null;
}

/* ------------------------------------------------------
   STEP 1 — Upload + Parse Resume
------------------------------------------------------ */
export const parseResume = async (file: File) => {
  if (!(await isAuthenticated())) throw new Error("Not authenticated");

  const correlationId = getCorrelationId();
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE}/api/v1/parser/parse_resume/`;
  logApiRequest('POST', url, { fileName: file.name, fileSize: file.size });

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(correlationId && { 'X-Correlation-ID': correlationId }),
      },
      body: formData,
    });

    const traceId = response.headers.get('x-trace-id');
    logApiResponse('POST', url, response.status, traceId || undefined);

    if (!response.ok) {
      const text = await response.text();
      try {
        const body = JSON.parse(text);

        // Detect common backend parser responses that indicate an image/scanned PDF
        const backendMessage =
          body?.error?.message || body?.message || JSON.stringify(body);

        const lower = String(backendMessage).toLowerCase();

        if (
          lower.includes("image") ||
          lower.includes("scann") ||
          lower.includes("ocr") ||
          lower.includes("large images") ||
          (body?.error && body?.error?.code === "UNPROCESSABLEABLE_ENTITY")
        ) {
          // Return a normalized parsed response indicating OCR is needed.
          return {
            parsed_data: { ocr_needed: true, error: backendMessage },
          };
        }
      } catch {
        // ignore JSON parse errors and fall through to throwing raw text
      }

      throw new Error(text);
    }
    return response.json();
  } catch (error) {
    logApiError('POST', url, error);
    throw error;
  }
};

/* ------------------------------------------------------
   STEP 2 — Clear Cache for a Resume
------------------------------------------------------ */
export const clearCacheForResume = async (resumeId: string) => {
  const response = await fetch(
    `${API_BASE}/api/v1/parser/clear-cache/${resumeId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to clear cache");
  }
};

/* ------------------------------------------------------
   STEP 3 — Complete Resume → ATS Flow
   Step 1: POST /parser/parse_resume/ → resume_id + parsed_data
   Step 2: POST /resume/enhance       → enhancer_state.ats_breakdown (ATS score)
------------------------------------------------------ */
export const processResumeComplete = async (file: File) => {
  try {
    // Step 1: Parse Resume
    let parsed;
    try {
      parsed = await parseResume(file);
    } catch (parseErr) {
      const parseMessage = (parseErr as { message?: string })?.message ?? String(parseErr);
      throw new Error(SERVER_ERROR_PATTERN.test(parseMessage) ? PARSE_SERVER_ERROR_MESSAGE : parseMessage);
    }
    const parserError = parserFailureMessage(parsed);
    if (parserError) throw new Error(parserError);

    const resumeId = parsed.resume_id;
    const parsedData = parsed?.parsed_data ?? {};

    // If the parser served this file from cache, check whether we already
    // have the full enhancement result stored locally — if so, skip the
    // enhance + getResume calls entirely (no credits charged).
    if (parsed.cache_hit && resumeId) {
      const localKey = `atsAnalysis_${resumeId}`;

      // Check resume-specific key first
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          const cachedPayload = JSON.parse(cached);
          // Old local payloads do not contain the backend projection contract.
          // Force one fresh enhancement after the backend rollout.
          if (hasScoreProjectionContract(cachedPayload)) {
            try { localStorage.setItem("atsAnalysisData", cached); } catch { /* non-fatal: still a valid cache hit */ }
            return { success: true as const, ...cachedPayload };
          }
        } catch { /* corrupted — fall through */ }
      }

      // Fallback: check the legacy "atsAnalysisData" key — if it belongs to
      // this same resume_id, reuse it and migrate it to the new key.
      const legacy = localStorage.getItem("atsAnalysisData");
      if (legacy) {
        try {
          const legacyPayload = JSON.parse(legacy);
          if (legacyPayload.resume_id === resumeId && hasScoreProjectionContract(legacyPayload)) {
            try { localStorage.setItem(localKey, legacy); } catch { /* non-fatal migration */ }
            return { success: true as const, ...legacyPayload };
          }
        } catch { /* fall through to fresh analysis */ }
      }
    }

    // Step 2: Enhance — now also returns the ATS breakdown
    let enhanceResult;
    try {
      enhanceResult = await enhanceResume({ resume_id: resumeId });
    } catch (enhanceErr) {
      const enhanceMessage = (enhanceErr as { message?: string })?.message ?? String(enhanceErr);
      throw new Error(SERVER_ERROR_PATTERN.test(enhanceMessage) ? ENHANCE_SERVER_ERROR_MESSAGE : enhanceMessage);
    }
    if (!enhanceResult || enhanceResult.success === false) {
      throw new Error("ATS analysis could not be completed after your resume was parsed. Please try again.");
    }
    const atsBreakdown = enhanceResult.enhancer_state?.ats_breakdown ?? {};
    const atsDisplay = enhanceResult.ats_display;
    const enhancedResumeId = enhanceResult.enhanced_resume_id ?? null;
    const enhancedResume =
      enhanceResult.enhanced_resume ||
      enhanceResult.enhancer_state?.resume ||
      null;

    // Step 3: Fetch full resume from MongoDB (has all sections after LLM enhancement)
    let resumeData: Record<string, unknown> | null = null;
    try {
      resumeData = await getResume(resumeId) as Record<string, unknown>;
    } catch { /* non-fatal — fallback to parsed_data */ }

    // Prefer ats_display.score (new format), fall back to ats_breakdown fields (legacy)
    const atsBreakdownRec = atsBreakdown as Record<string, unknown>;
    const atsDisplayRec = (atsDisplay ?? {}) as Record<string, unknown>;
    const enhanceResultRec = enhanceResult as unknown as Record<string, unknown>;
    const scoreProjection = Object.fromEntries(
      [
        "current_score",
        "estimated_score_after_fixes",
        "points_possible",
        "issues_count",
        "sections_with_issues",
        "score_status",
        "score_source",
      ]
        .filter((key) => Object.prototype.hasOwnProperty.call(enhanceResultRec, key))
        .map((key) => [key, enhanceResultRec[key]])
    );
    const finalScore: number = Number(
      atsDisplay?.score ??
      atsBreakdownRec.FinalScore ??
      atsBreakdownRec.Percentage ??
      atsBreakdownRec.overall_score ??
      atsBreakdownRec.final_score ??
      atsBreakdownRec.percentage ??
      atsBreakdownRec.score ??
      atsBreakdownRec.TotalScore ??
      0
    );
    const estimatedScore = [
      enhanceResultRec.estimated_score_after_fixes,
      enhanceResultRec.estimated_after_fixes,
      enhanceResultRec.projected_score,
      enhanceResultRec.potential_score,
      enhanceResultRec.score_after_fixes,
      enhanceResultRec.post_fix_score,
      atsDisplayRec.estimated_score_after_fixes,
      atsDisplayRec.estimated_after_fixes,
      atsDisplayRec.projected_score,
      atsBreakdownRec.estimated_score_after_fixes,
    ]
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value >= finalScore && value <= 100);

    const payload = {
      resume_id: resumeId,
      enhanced_resume_id: enhancedResumeId,
      ats_breakdown_id: null,
      parsed_data: parsedData,
      resume_data: resumeData,        // full MongoDB doc — most complete source
      enhanced_resume: enhancedResume,
      ats_score: atsBreakdown,
      ats_display: atsDisplay || null,
      finalWeightedScore: finalScore,
      missingFields: [],
      scanned_pdf: false,
    };

    // Store under a resume-specific key so future cache hits can skip enhance
    if (resumeId) {
      storeAtsAnalysis(`atsAnalysis_${resumeId}`, payload);
    }
    storeAtsAnalysis("atsAnalysisData", payload);

    return { success: true as const, ...payload };
  } catch (err: unknown) {
    let message = (err as { message?: string })?.message ?? String(err);

    // Detect and normalize credit/quota errors
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("credit") ||
        lowerMsg.includes("quota") ||
        lowerMsg.includes("insufficient") ||
        lowerMsg.includes("limit exceeded") ||
        lowerMsg.includes("payment required") ||
        lowerMsg.includes("402")) {
      message = "You don't have enough credits to analyze this resume. Please upgrade your plan or purchase credits.";
    }

    return { success: false as const, error: message };
  }
};

/* ------------------------------------------------------
   Dashboard ATS step — enhance only (resume already parsed in step 1)
   Returns the final ATS score as a number and caches the result so
   /atslogin/report can reuse it without a second enhance call.
------------------------------------------------------ */
export const runAtsScan = async (resumeId: string): Promise<number> => {
  const enhanceResult = await enhanceResume({ resume_id: resumeId });
  const atsBreakdown = enhanceResult.enhancer_state?.ats_breakdown ?? {};
  const atsDisplay = enhanceResult.ats_display;
  const atsBreakdownRec = atsBreakdown as Record<string, unknown>;

  const finalScore: number = Number(
    atsDisplay?.score ??
    atsBreakdownRec.FinalScore ??
    atsBreakdownRec.Percentage ??
    atsBreakdownRec.overall_score ??
    atsBreakdownRec.final_score ??
    atsBreakdownRec.percentage ??
    atsBreakdownRec.score ??
    atsBreakdownRec.TotalScore ??
    0
  );

  const payload = {
    resume_id: resumeId,
    enhanced_resume_id: enhanceResult.enhanced_resume_id ?? null,
    ats_breakdown_id: null,
    parsed_data: {},
    resume_data: null,
    enhanced_resume: enhanceResult.enhanced_resume || enhanceResult.enhancer_state?.resume || null,
    ats_score: atsBreakdown,
    ats_display: atsDisplay || null,
    finalWeightedScore: finalScore,
    missingFields: [],
    scanned_pdf: false,
  };

  storeAtsAnalysis(`atsAnalysis_${resumeId}`, payload);
  storeAtsAnalysis("atsAnalysisData", payload);

  return finalScore;
};

/* ------------------------------------------------------
   Additional resume utilities used by dashboard and preview
------------------------------------------------------ */
export interface ResumeResponse {
  id: string;
  personalInfo?: { name?: string } | null;
  work_experience?: Array<{ role?: string }> | null;
  builder_score?: { score?: number } | null;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export const getAllResumes = async (): Promise<ResumeResponse[]> => {
  const response = await fetch(`${API_BASE}/api/v1/resumes/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const downloadResume = async (
  resumeId: string,
  format: "pdf" | "docx" | "doc" = "pdf"
): Promise<Blob> => {
  // Normalize format: frontend may send 'doc' from UI, backend expects 'docx'
  const requestedFormat = format === "doc" ? "docx" : format;

  // Use parser download endpoint (backend route): /api/v1/parser/download/{resume_id}?format={pdf|docx}
  const response = await fetch(
    `${API_BASE}/api/v1/parser/download/${resumeId}?format=${requestedFormat}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) throw new Error(await response.text());
  return response.blob();
};
