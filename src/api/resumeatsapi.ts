import { getAccessToken, isAuthenticated } from "./authApi";
import { getCorrelationId } from "@/lib/correlationId";
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ------------------------------------------------------
   STEP 1 — Upload + Parse Resume
------------------------------------------------------ */
export const parseResume = async (file: File) => {
  if (!isAuthenticated()) throw new Error("Not authenticated");

  const token = getAccessToken();
  const correlationId = getCorrelationId();
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE}/api/v1/parser/parse_resume/`;
  logApiRequest('POST', url, { fileName: file.name, fileSize: file.size });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
  const token = getAccessToken();

  const response = await fetch(
    `${API_BASE}/api/v1/parser/clear-cache/${resumeId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to clear cache");
  }
};

/* ------------------------------------------------------
   STEP 3 — Calculate ATS Score
   (AUTO PROTECTS AGAINST 0% SCORE BUG)
------------------------------------------------------ */
export const fetchAtsScore = async (resumeId: string) => {
  const token = getAccessToken();
  const correlationId = getCorrelationId();
  const url = `${API_BASE}/api/v1/parser/calculate_ats_score/${resumeId}`;

  logApiRequest('POST', url, { resumeId, force_recalculate: true });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(correlationId && { 'X-Correlation-ID': correlationId }),
      },
      body: JSON.stringify({
        force_recalculate: true,
        disable_cache: true,
      }),
    });

    const traceId = response.headers.get('x-trace-id');
    logApiResponse('POST', url, response.status, traceId || undefined);

    if (!response.ok) throw new Error(await response.text());
    return response.json();
  } catch (error) {
    logApiError('POST', url, error);
    throw error;
  }
};

/* ------------------------------------------------------
   STEP 4 — Complete Resume → ATS Flow
   (WITH FAILSAFE DETECTION FOR SCANNED PDF)
------------------------------------------------------ */
export const processResumeComplete = async (file: File) => {
  try {
    /* -------------------------------
       STEP 1: Parse Resume
    ------------------------------- */
    const parsed = await parseResume(file);
    const resumeId = parsed.resume_id;

    // Detect scanned PDFs or OCR errors
    const parsedData = parsed?.parsed_data ?? {};
    const isScannedPdf =
      parsedData?.ocr_needed === true ||
      parsedData?.error?.includes("no selectable text");

    /* -------------------------------
       STEP 2: ATS Calculation
       Skip ATS if parsed text missing
    ------------------------------- */
    let atsResult = null;
    let finalScore = 0;

    if (isScannedPdf) {
      // Prevent backend ATS crash
      atsResult = {
        ats_score: {
          final_score: 0,
          reason: "Scanned PDF detected - OCR required",
        },
        missing_fields: [],
      };
    } else {
      // Safe ATS scoring
      atsResult = await fetchAtsScore(resumeId);

      // Extract score safely
      // Priority: overall_score (weighted final) -> FinalWeighted.score -> score -> percentage -> TotalScore
      finalScore =
        atsResult?.ats_score?.overall_score ??
        atsResult?.ats_score?.breakdown?.FinalWeighted?.score ??
        atsResult?.ats_score?.score ??
        atsResult?.ats_score?.percentage ??
        atsResult?.ats_score?.TotalScore ??
        0;
    }

    /* -------------------------------
       STEP 3: Save to LocalStorage
    ------------------------------- */
    const payload = {
      resume_id: resumeId,
      parsed_data: parsedData,
      ats_score: atsResult?.ats_score ?? null,
      finalWeightedScore: finalScore,
      missingFields: atsResult?.missing_fields ?? [],
      scanned_pdf: isScannedPdf,
    };

    localStorage.setItem("atsAnalysisData", JSON.stringify(payload));

    return {
      success: true,
      ...payload,
    };
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? String(err);
    return { success: false, error: message };
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
  const token = getAccessToken();

  const response = await fetch(`${API_BASE}/api/v1/resumes/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const deleteResume = async (resumeId: string) => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(await response.text());
};

export const downloadResume = async (
  resumeId: string,
  format: "pdf" | "docx" | "doc" = "pdf"
): Promise<Blob> => {
  const token = getAccessToken();

  // Normalize format: frontend may send 'doc' from UI, backend expects 'docx'
  const requestedFormat = format === "doc" ? "docx" : format;

  // Use parser download endpoint (backend route): /api/v1/parser/download/{resume_id}?format={pdf|docx}
  const response = await fetch(
    `${API_BASE}/api/v1/parser/download/${resumeId}?format=${requestedFormat}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) throw new Error(await response.text());
  return response.blob();
};
