import httpClient from "@/lib/http";
import axios from "axios";
import type { AxiosRequestConfig } from 'axios';
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";
import logger from "@/lib/logger";
import type { ParseResumeResponse, EnhancedResumeHistoryItem, EnhanceResumeResponse, UpdateEnhancedResumeRequest, Improvement } from '@/types/api.types';

// Re-export types that consumers import from this module
export type { EnhancedResumeHistoryItem, EnhanceResumeResponse, Improvement };

/* ========== SAFE HELPERS ========== */
interface ApiErrorWithRaw extends Error {
  __raw: unknown;
}

async function safePost<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    logApiRequest('POST', url, data);
    const typedData = data as Record<string, unknown> | undefined;
    const response = await httpClient.post<T>(url, typedData, config);
    logApiResponse('POST', url, response.status, response.headers['x-trace-id']);
    return response.data;
  } catch (err: unknown) {
    logApiError('POST', url, err);
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data ?? err.message;
      const apiError: ApiErrorWithRaw = new Error(
        typeof raw === 'string' ? raw : JSON.stringify(raw)
      ) as ApiErrorWithRaw;
      apiError.__raw = raw;
      throw apiError;
    }
    throw err;
  }
}

async function safeGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    logApiRequest('GET', url);
    const response = await httpClient.get<T>(url, config);
    logApiResponse('GET', url, response.status, response.headers['x-trace-id']);
    return response.data;
  } catch (err: unknown) {
    logApiError('GET', url, err);
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data ?? err.message;
      const apiError: ApiErrorWithRaw = new Error(typeof raw === 'string' ? raw : JSON.stringify(raw)) as ApiErrorWithRaw;
      apiError.__raw = raw;
      throw apiError;
    }
    throw err;
  }
}


async function safePut<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    logApiRequest('PUT', url, data);
    const typedData = data as Record<string, unknown> | undefined;
    const response = await httpClient.put<T>(url, typedData, config);
    logApiResponse('PUT', url, response.status, response.headers['x-trace-id']);
    return response.data;
  } catch (err: unknown) {
    logApiError('PUT', url, err);
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data ?? err.message;
      const apiError: ApiErrorWithRaw = new Error(typeof raw === 'string' ? raw : JSON.stringify(raw)) as ApiErrorWithRaw;
      apiError.__raw = raw;
      throw apiError;
    }
    throw err;
  }
}

async function safeDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    logApiRequest('DELETE', url);
    const response = await httpClient.delete<T>(url, config);
    logApiResponse('DELETE', url, response.status, response.headers['x-trace-id']);
    return response.data;
  } catch (err: unknown) {
    logApiError('DELETE', url, err);
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data ?? err.message;
      const apiError: ApiErrorWithRaw = new Error(typeof raw === 'string' ? raw : JSON.stringify(raw)) as ApiErrorWithRaw;
      apiError.__raw = raw;
      throw apiError;
    }
    throw err;
  }
}

/* ========== TYPE DEFINITIONS ========== */

export interface EnhanceResumeRequest {
  resume_id?: string;
  ats_breakdown?: string;
  resume?: Record<string, unknown>;
  target_jd?: string | string[];
  job_description?: string;
  region?: string;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/* ========== RESUME ENHANCER API FUNCTIONS ========== */

/**
 * STEP 1: Parse Resume (from parser API)
 * POST /api/v1/parser/parse_resume/
 *
 * This is the first step - parse the uploaded resume file
 */
export async function parseResumeForEnhancer(file: File) {
  const form = new FormData();
  form.append("file", file);

  logger.api.request('POST', '/parser/parse_resume/', { fileName: file.name });

  const response = await safePost<ParseResumeResponse>(`/parser/parse_resume/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  logger.debug("Resume parsed successfully", {
    resume_id: response.resume_id,
    file_name: response.file_name,
  });

  return response;
}

/**
 * STEP 2: Enhance Resume with AI
 * POST /api/v1/resume/enhance
 *
 * Supports two modes:
 * - MODE 1: General Enhancement (no job_description/target_jd)
 * - MODE 2: JD-Based Tailoring (with job_description/target_jd)
 *
 * @param request - Enhancement request with resume_id or resume data
 * @returns Enhanced resume with ATS score and improvements
 */
export async function enhanceResume(request: EnhanceResumeRequest): Promise<EnhanceResumeResponse> {
  logger.api.request('POST', '/resume/enhance', {
    resume_id: request.resume_id,
    has_jd: !!(request.job_description || request.target_jd),
  });

  const response = await safePost<EnhanceResumeResponse>(`/resume/enhance`, request);

  // Normalize any oddly formatted summary variants returned by backend.
  try {
    const enhanced = response?.enhanced_resume as Record<string, unknown> | undefined;
    if (enhanced && Array.isArray(enhanced.summary_variants)) {
      enhanced.summary_variants = (enhanced.summary_variants as unknown[]).map((v: unknown) => {
        const out = { ...(v as Record<string, unknown>) } as Record<string, unknown>;
        const raw = out.summary;
        if (typeof raw === 'string') {
          let s = raw.trim();

          // Remove wrapping quotes if present
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.slice(1, -1).trim();
          }

          // Remove a trailing dot after a JSON object: e.g. '{... }.'
          if (s.endsWith('.') && (s.endsWith('}.') || s.endsWith('".'))) {
            s = s.slice(0, -1).trim();
          }

          // If string contains a JSON object, attempt to extract and parse it
          const jsonMatch = s.match(/(\{[\s\S]*\})/);
          const candidate = jsonMatch ? jsonMatch[1] : s;

          try {
            const parsed = JSON.parse(candidate) as unknown;
            if (isObject(parsed) && typeof (parsed as Record<string, unknown>)['summary'] === 'string') {
              out.summary = ((parsed as Record<string, unknown>)['summary'] as string).trim();
            } else {
              out.summary = String(parsed).trim();
            }
          } catch {
            // Not valid JSON — fall back to cleaned string
            out.summary = s;
          }
        }
        return out;
      });
      // copy back to typed structure
      (enhanced as Record<string, unknown>).summary_variants = enhanced.summary_variants;
    }
  } catch (err) {
    // Don't fail the whole call if normalization fails — log and continue
    logger.warn('Failed to normalize summary_variants', err);
  }

  logger.debug("Resume enhanced successfully", {
    enhanced_id: response.enhanced_resume_id,
    success: response.success,
  });

  return response;
}

/**
 * STEP 3: Get Enhanced Resume by ID
 * GET /api/v1/resume/enhance/{enhanced_id}
 *
 * Retrieve an enhanced resume by its ID
 */
export async function getEnhancedResume(enhanced_id: string): Promise<EnhancedResumeHistoryItem> {
  const response = await safeGet<EnhancedResumeHistoryItem>(`/resume/enhance/${enhanced_id}`);
  return response;
}

/**
 * STEP 4: Update Enhanced Resume (Bulk Update)
 * PATCH /api/v1/resume/enhance/{enhanced_id}
 *
 * Save all user edits to database so user can:
 * - Come back later to continue editing
 * - Export multiple times (PDF, DOCX)
 * - Not lose their work
 *
 * @param enhanced_id - ID of enhanced resume
 * @param request - Updated enhanced sections
 */
export async function updateEnhancedResume(
  enhanced_id: string,
  request: UpdateEnhancedResumeRequest
): Promise<EnhanceResumeResponse> {
  // Backend supports PUT (not PATCH) on this endpoint
  const response = await safePut<EnhanceResumeResponse>(`/resume/enhance/${enhanced_id}`, request);
  return response;
}

/**
 * STEP 5: Delete Enhanced Resume
 * DELETE /api/v1/resume/enhance/{enhanced_id}
 *
 * Delete enhanced resume by ID
 * Only the resume owner can delete it
 */
export async function deleteEnhancedResume(enhanced_id: string): Promise<void> {
  await safeDelete(`/resume/enhance/${enhanced_id}`);
}

/**
 * Get Enhancement History
 * GET /api/v1/resume/enhance/history/list
 *
 * Get list of all enhanced resumes for current user
 *
 * @param limit - Number of results (default: 20, max: 100)
 */
export async function getEnhancementHistory(limit: number = 20): Promise<EnhancedResumeHistoryItem[]> {
  const response = await safeGet<EnhancedResumeHistoryItem[]>(`/resume/enhance/history/list?limit=${limit}`);
  return response;
}

/**
 * Download Enhanced Resume
 * GET /api/v1/resume/enhance/{enhanced_id}/download
 *
 * Download enhanced resume as PDF or DOCX
 *
 * @param enhanced_id - ID of enhanced resume
 * @param format - Export format (pdf or docx)
 * @returns Blob of the file
 */
export async function downloadEnhancedResume(
  enhanced_id: string,
  format: "pdf" | "docx" = "pdf",
  template?: string
): Promise<Blob> {
  try {
    // When a template is selected, set preserve_template=false so backend uses the chosen template
    const preserveTemplate = template ? "false" : "true";
    const params = new URLSearchParams({ format, preserve_template: preserveTemplate });
    if (template) {
      params.set("template_id", template);
    }
    const response = await httpClient.get<Blob>(`/resume/enhance/${enhanced_id}/download?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  } catch (err: unknown) {
    logApiError('GET', `/resume/enhance/${enhanced_id}/download`, err);
    throw err;
  }
}

/**
 * Preview Enhanced Resume with Full Data
 * GET /api/v1/resume/enhance/{enhanced_id} + /preview
 *
 * Fetch both:
 * 1. Full structured resume JSON data (all sections including languages, hobbies, etc)
 * 2. PDF preview blob for visual preview in editor
 *
 * @param enhanced_id - ID of enhanced resume
 * @returns Combined object with resumeData and previewBlob
 */
export async function previewEnhancedResume(enhanced_id: string): Promise<{
  resumeData: EnhancedResumeHistoryItem;
  previewBlob: Blob | null;
}> {
  try {
    // Fetch structured JSON data and PDF preview in parallel
    const [resumeDataResponse, pdfBlob] = await Promise.all([
      safeGet<EnhancedResumeHistoryItem>(`/resume/enhance/${enhanced_id}`),
      (async () => {
        try {
          const response = await httpClient.get<Blob>(`/resume/enhance/${enhanced_id}/preview`, {
            responseType: 'blob',
          });
          return response.data as Blob;
        } catch {
          return null; // Make PDF optional
        }
      })()
    ]);

    return {
      resumeData: resumeDataResponse,
      previewBlob: pdfBlob as Blob | null,
    };
  } catch (err: unknown) {
    logApiError('GET', `/resume/enhance/${enhanced_id}/preview`, err);
    throw err;
  }
}

/**
 * Preview Enhanced Resume (PDF Only - Legacy)
 * GET /api/v1/resume/enhance/{enhanced_id}/preview
 *
 * Get PDF preview only for backwards compatibility
 * For new code, use previewEnhancedResume() which returns full data + PDF
 *
 * @param enhanced_id - ID of enhanced resume
 * @returns Blob of the PDF for inline preview
 * @deprecated Use previewEnhancedResume() instead
 */
export async function previewEnhancedResumePDFOnly(enhanced_id: string): Promise<Blob> {
  try {
    const response = await httpClient.get<Blob>(`/resume/enhance/${enhanced_id}/preview`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  } catch (err: unknown) {
    logApiError('GET', `/resume/enhance/${enhanced_id}/preview`, err);
    throw err;
  }
}

/* ========== APPLY FIX ========== */

export interface ApplyFixRequest {
  enhancer_state: string; // enhanced_resume_id — the backend uses this to look up current state
  suggestion_id: string;
  fix_type?: 'auto' | 'manual' | 'info';
  value?: string; // required for manual fixes (e.g. the phone number / email the user typed)
}

/**
 * Apply a suggestion fix to an enhanced resume.
 * POST /api/v1/resume/enhance/apply
 *
 * @param request - { enhancer_state, suggestion_id, fix_type, value }
 * @returns Updated enhancer response with fix applied and refreshed ATS score
 */
export async function applyFix(request: ApplyFixRequest): Promise<EnhanceResumeResponse> {
  logger.api.request('POST', '/resume/enhance/apply', {
    suggestion_id: request.suggestion_id,
    fix_type: request.fix_type,
  });
  const response = await safePost<EnhanceResumeResponse>('/resume/enhance/apply', request);
  logger.debug('Fix applied', { suggestion_id: request.suggestion_id });
  return response;
}

/* ========== DELETE FIX ========== */

export interface DeleteFixRequest {
  enhancer_state: string; // enhanced_resume_id
  suggestion_id: string;
}

/**
 * Undo a previously applied fix (e.g. user clears an added field).
 * POST /api/v1/resume/enhance/delete-fix
 *
 * @param request - { enhancer_state, suggestion_id }
 * @returns Updated enhancer response with fix removed and refreshed ATS score
 */
export async function deleteFix(request: DeleteFixRequest): Promise<EnhanceResumeResponse> {
  logger.api.request('POST', '/resume/enhance/delete-fix', {
    suggestion_id: request.suggestion_id,
  });
  const response = await safePost<EnhanceResumeResponse>('/resume/enhance/delete-fix', request);
  logger.debug('Fix deleted', { suggestion_id: request.suggestion_id });
  return response;
}

/* ========== COMPLETE WORKFLOW HELPER ========== */

/**
 * Complete Enhancement Workflow
 *
 * Two-step: parse file → POST /api/v1/resume/enhance with resume_id
 * Used by both Resume Enhancer and ATS Scan flows.
 * Normalises the response so downstream code using `enhanced_resume` still works.
 *
 * @param file - Resume file to enhance
 * @param jobDescription - Optional job description for tailoring
 * @param region - Region for ATS standards (default: "india")
 */
export async function processResumeEnhancement(
  file: File,
  jobDescription?: string,
  region: string = "india"
): Promise<{
  parseResult: ParseResumeResponse;
  enhanceResult: EnhanceResumeResponse;
}> {
  // Step 1: Parse Resume
  const parseResult = await parseResumeForEnhancer(file);
  const resumeId = parseResult.resume_id;
  if (!resumeId) {
    throw new Error("Failed to parse resume: No resume_id returned");
  }

  // Step 2: Enhance (also computes ATS breakdown)
  const enhanceRequest: EnhanceResumeRequest = { resume_id: resumeId, region };
  if (jobDescription) enhanceRequest.job_description = jobDescription;

  const enhanceResult = await enhanceResume(enhanceRequest);

  // Normalise new response shape → backward-compat with EnhancerPage
  // enhancer_state.resume replaces the old enhanced_resume field
  const resumeData = enhanceResult.enhancer_state?.resume;
  if (resumeData && !enhanceResult.enhanced_resume) {
    enhanceResult.enhanced_resume = resumeData as import('@/types/api.types').ResumeData;
  }

  // Set parsed_data from enhancer_state.resume if not already present
  if (resumeData && !parseResult.parsed_data) {
    parseResult.parsed_data = resumeData as import('@/types/api.types').ResumeData;
  }

  return { parseResult, enhanceResult };
}

/* ========== EXPORT ========== */
export const enhancerApi = {
  // Core enhancement functions
  parseResumeForEnhancer,
  enhanceResume,
  applyFix,
  deleteFix,
  getEnhancedResume,
  updateEnhancedResume,
  deleteEnhancedResume,
  getEnhancementHistory,
  downloadEnhancedResume,
  previewEnhancedResume,

  // Helper workflow
  processResumeEnhancement,
};

export default enhancerApi;
