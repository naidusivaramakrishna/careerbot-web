import { isAuthenticated } from "./authApi";
import { getCorrelationId } from "@/lib/correlationId";
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";
import { enhanceResume } from "./enhancerApi";
import { calculateATS, getResume } from "./parserApi";

const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL || '';

/* ------------------------------------------------------
   STEP 1 — Upload + Parse Resume
------------------------------------------------------ */
export const parseResume = async (file: File) => {
  if (!isAuthenticated()) throw new Error("Not authenticated");

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
   STEP 3 — Calculate ATS Score
   Delegates to parserApi.calculateATS to avoid duplication.
------------------------------------------------------ */
export const fetchAtsScore = (resumeId: string) => calculateATS(resumeId);

/* ------------------------------------------------------
   STEP 4 — Complete Resume → ATS Flow
   Step 1: POST /parser/parse_resume/ → resume_id + parsed_data
   Step 2: POST /resume/enhance       → enhancer_state.ats_breakdown (ATS score)
------------------------------------------------------ */
export const processResumeComplete = async (file: File) => {
  try {
    // Step 1: Parse Resume
    const parsed = await parseResume(file);
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
          localStorage.setItem("atsAnalysisData", cached);
          return { success: true as const, ...cachedPayload };
        } catch { /* corrupted — fall through */ }
      }

      // Fallback: check the legacy "atsAnalysisData" key — if it belongs to
      // this same resume_id, reuse it and migrate it to the new key.
      const legacy = localStorage.getItem("atsAnalysisData");
      if (legacy) {
        try {
          const legacyPayload = JSON.parse(legacy);
          if (legacyPayload.resume_id === resumeId) {
            localStorage.setItem(localKey, legacy); // migrate for future hits
            return { success: true as const, ...legacyPayload };
          }
        } catch { /* fall through to fresh analysis */ }
      }
    }

    // Step 2: Enhance — now also returns the ATS breakdown
    const enhanceResult = await enhanceResume({ resume_id: resumeId });
    const atsBreakdown = enhanceResult.enhancer_state?.ats_breakdown ?? {};
    const atsDisplay = enhanceResult.ats_display;

    // Step 3: Fetch full resume from MongoDB (has all sections after LLM enhancement)
    let resumeData: Record<string, unknown> | null = null;
    try {
      resumeData = await getResume(resumeId) as Record<string, unknown>;
    } catch { /* non-fatal — fallback to parsed_data */ }

    // Prefer ats_display.score (new format), fall back to ats_breakdown fields (legacy)
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
      ats_breakdown_id: null,
      parsed_data: parsedData,
      resume_data: resumeData,        // full MongoDB doc — most complete source
      enhanced_resume: enhanceResult.enhanced_resume || null,
      ats_score: atsBreakdown,
      ats_display: atsDisplay || null,
      finalWeightedScore: finalScore,
      missingFields: [],
      scanned_pdf: false,
    };

    // Store under a resume-specific key so future cache hits can skip enhance
    if (resumeId) {
      localStorage.setItem(`atsAnalysis_${resumeId}`, JSON.stringify(payload));
    }
    localStorage.setItem("atsAnalysisData", JSON.stringify(payload));

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

export const deleteResume = async (resumeId: string) => {
  const response = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error(await response.text());
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