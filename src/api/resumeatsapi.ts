import { httpClient } from "@/lib/http";
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";

/* ------------------------------------------------------
   STEP 1 — Upload + Parse Resume
------------------------------------------------------ */
export const parseResume = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const url = `/parser/parse_resume/`;
  logApiRequest('POST', url, { fileName: file.name, fileSize: file.size });

  try {
    const response = await httpClient.post<any>(url, formData as any, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    logApiResponse('POST', url, response.status, response.headers['x-trace-id']);

    const body = response.data as any;

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

    return response.data;
  } catch (error) {
    logApiError('POST', url, error);
    throw error;
  }
};

/* ------------------------------------------------------
   STEP 2 — Clear Cache for a Resume
------------------------------------------------------ */
export const clearCacheForResume = async (resumeId: string) => {
  await httpClient.delete(`/parser/clear-cache/${resumeId}`);
};

/* ------------------------------------------------------
   STEP 3 — Calculate ATS Score
   (AUTO PROTECTS AGAINST 0% SCORE BUG)
------------------------------------------------------ */
export const fetchAtsScore = async (resumeId: string) => {
  const url = `/parser/calculate_ats_score/${resumeId}`;

  logApiRequest('POST', url, { resumeId, force_recalculate: true });

  try {
    const response = await httpClient.post<any>(url, {
      force_recalculate: true,
      disable_cache: true,
    });

    logApiResponse('POST', url, response.status, response.headers['x-trace-id']);

    return response.data;
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
    const parsed = await parseResume(file) as any;
    const resumeId = parsed?.resume_id;

    // Detect scanned PDFs or OCR errors
    const parsedData = parsed?.parsed_data ?? {};
    const isScannedPdf =
      parsedData?.ocr_needed === true ||
      (typeof parsedData?.error === 'string' && parsedData?.error?.includes("no selectable text"));

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
  const response = await httpClient.get<ResumeResponse[]>(`/resumes/`);
  return response.data;
};

export const deleteResume = async (resumeId: string) => {
  await httpClient.delete(`/resumes/${resumeId}`);
};

export const downloadResume = async (
  resumeId: string,
  format: "pdf" | "docx" | "doc" = "pdf"
): Promise<Blob> => {
  // Normalize format: frontend may send 'doc' from UI, backend expects 'docx'
  const requestedFormat = format === "doc" ? "docx" : format;

  // Use parser download endpoint (backend route): /api/v1/parser/download/{resume_id}?format={pdf|docx}
  const response = await httpClient.get<Blob>(
    `/parser/download/${resumeId}?format=${requestedFormat}`,
    { responseType: "blob" }
  );

  return response.data;
};
