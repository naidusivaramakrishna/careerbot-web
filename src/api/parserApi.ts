import httpClient from "@/lib/http";
import axios from "axios";
import type { AxiosRequestConfig } from 'axios';
import { logApiRequest, logApiResponse, logApiError } from "@/lib/tracing";
import logger from "@/lib/logger";
import type { ParseResumeResponse, ParseJDResponse, ResumeData, ATSScore } from '@/types/api.types';

/* ========== SAFE HELPERS ========== */
interface ApiErrorWithRaw extends Error {
  __raw: unknown;
}

async function safePost<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
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
      const apiError: ApiErrorWithRaw = new Error(typeof raw === 'string' ? raw : JSON.stringify(raw)) as ApiErrorWithRaw;
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

async function safePatch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    logApiRequest('PATCH', url, data);
    const typedData = data as Record<string, unknown> | undefined;
    const response = await httpClient.patch<T>(url, typedData, config);
    logApiResponse('PATCH', url, response.status, response.headers['x-trace-id']);
    return response.data;
  } catch (err: unknown) {
    logApiError('PATCH', url, err);
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

/* ========== PARSER FUNCTIONS ========== */
export async function parseResume(file: File): Promise<ParseResumeResponse> {
  const form = new FormData();
  form.append("file", file);
  return await safePost<ParseResumeResponse>(`/parser/parse_resume/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function getResume(resume_id: string): Promise<ResumeData> {
  return await safeGet<ResumeData>(`/parser/get_resume/?resume_id=${resume_id}`);
}

export async function previewResume(resume_id: string): Promise<ResumeData> {
  return await safeGet<ResumeData>(`/parser/preview/${resume_id}`);
}

export async function downloadResumeJson(resume_id: string): Promise<ResumeData> {
  return await safeGet<ResumeData>(`/parser/download/${resume_id}`);
}

export async function deleteResume(resume_id: string): Promise<void> {
  await safeDelete(`/parser/delete_resume/${resume_id}`);
}

export async function calculateATS(resume_id: string): Promise<ATSScore> {
  return await safePost<ATSScore>(`/parser/calculate_ats_score/${resume_id}`, {
    force_recalculate: true,
    disable_cache: true,
  });
}

export async function enhanceKeywords(resume_id: string): Promise<unknown> {
  return await safePost<unknown>(`/parser/keyword_enhancement/${resume_id}`);
}

/* ========== ADD / REMOVE SKILLS — RESUME DIRECT UPDATE ========== */

async function patchResumeSkills(resume_id: string, skills: string | string[], action: "add" | "remove") {
  const skillArray = Array.isArray(skills) ? skills : [skills];
  if (!resume_id?.trim()) throw new Error(`Invalid resume_id: ${resume_id}`);
  if (!skillArray.length) throw new Error("No skills provided");

  const endpoint = `/parser/${action}-skills/${resume_id}`;
  logger.api.request('PATCH', endpoint, { skills: skillArray });
  try {
    const res = await safePatch(endpoint, { skills: skillArray });
    logger.debug(`Skills ${action}ed successfully`, { count: skillArray.length });
    return res;
  } catch (err: unknown) {
    logger.api.error('PATCH', endpoint, err);
    throw err;
  }
}

export async function parserAddSkills(resume_id: string, skills: string | string[]) {
  return patchResumeSkills(resume_id, skills, "add");
}

export async function parserRemoveSkills(resume_id: string, skills: string | string[]) {
  return patchResumeSkills(resume_id, skills, "remove");
}

/* ========== JD PARSING ========== */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getRaw(err: unknown): unknown {
  return (err as { __raw?: unknown })?.__raw;
}

function handleDuplicateJd(err: unknown): ParseJDResponse {
  const raw = getRaw(err) as { detail?: { error?: string; existing_id?: string } } | undefined;
  if (raw?.detail?.error === "duplicate_jd") {
    return { raw, jd_id: raw.detail?.existing_id, duplicate: true } as ParseJDResponse;
  }
  throw err as Error;
}

function extractJdId(data: unknown): string | null {
  if (!isObject(data)) return null;

  const results = data['results'];
  if (Array.isArray(results) && results.length) {
    const first = results[0] as Record<string, unknown>;
    return (first['id'] || first['existing_id'] || first['jd_id']) as string | null;
  }

  if (typeof data['jd_id'] === 'string') return data['jd_id'] as string;
  if (typeof data['id'] === 'string') return data['id'] as string;

  const inner = data['data'];
  if (isObject(inner)) {
    if (typeof inner['jd_id'] === 'string') return inner['jd_id'] as string;
    if (typeof inner['id'] === 'string') return inner['id'] as string;
  }

  return null;
}

const JD_TEXT_FIELDS = ['text', 'content', 'jd_text', 'extracted_text', 'raw_text', 'full_text', 'description', 'job_description'];

function firstTextField(obj: Record<string, unknown>): string | null {
  for (const key of JD_TEXT_FIELDS) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return null;
}

// Job description bodies run to hundreds of characters — far longer than any id,
// filename, or status field — so once known field names fail, the longest string
// in the payload is almost certainly the extracted text.
const JD_TEXT_MIN_LENGTH = 80;
const JD_TEXT_SKIP_KEYS = new Set([
  'id', 'jd_id', '_id', 'existing_id', 'match_id', 'resume_id', 'user_id',
  'file_name', 'filename', 'url', 'trace_id', 'request_id', 'status', 'error', 'message',
]);

function findLongestString(data: unknown, depth = 0): string | null {
  if (depth > 4) return null;
  if (typeof data === 'string') {
    return data.trim().length >= JD_TEXT_MIN_LENGTH ? data : null;
  }
  if (Array.isArray(data)) {
    let best: string | null = null;
    for (const item of data) {
      const candidate = findLongestString(item, depth + 1);
      if (candidate && (!best || candidate.length > best.length)) best = candidate;
    }
    return best;
  }
  if (isObject(data)) {
    let best: string | null = null;
    for (const [key, val] of Object.entries(data)) {
      if (JD_TEXT_SKIP_KEYS.has(key.toLowerCase())) continue;
      const candidate = findLongestString(val, depth + 1);
      if (candidate && (!best || candidate.length > best.length)) best = candidate;
    }
    return best;
  }
  return null;
}

function extractJdText(data: unknown): string | null {
  if (!isObject(data)) return null;

  const results = data['results'];
  if (Array.isArray(results) && results.length && isObject(results[0])) {
    const fromResults = firstTextField(results[0] as Record<string, unknown>);
    if (fromResults) return fromResults;
  }

  const direct = firstTextField(data);
  if (direct) return direct;

  const inner = data['data'];
  if (isObject(inner)) {
    const fromInner = firstTextField(inner);
    if (fromInner) return fromInner;
  }

  return findLongestString(data);
}

export async function parseJDFile(file: File) {
  const form = new FormData();
  form.append("files", file);
  try {
    const res = await safePost<unknown>(`/jd/extract?skip_duplicate_check=false`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { raw: res, jd_id: extractJdId(res), jd_text: extractJdText(res), duplicate: false } as ParseJDResponse;
  } catch (err: unknown) {
    return handleDuplicateJd(err);
  }
}

export async function parseJDText(text: string, options: { skipAuthRedirect?: boolean } = {}) {
  try {
    const res = await safePost<unknown>(`/jd/parse`, {
      jd_texts: [text],
      skip_duplicate_check: false,
    }, options.skipAuthRedirect ? { headers: { "X-Skip-Auth-Redirect": "true" } } : undefined);
    return { raw: res, jd_id: extractJdId(res), jd_text: extractJdText(res) ?? text, duplicate: false } as ParseJDResponse;
  } catch (err: unknown) {
    return handleDuplicateJd(err);
  }
}

export async function parseJDUrl(url: string) {
  try {
    const res = await safePost<unknown>(`/jd/extract-url`, {
      url: url,
      skip_duplicate_check: false,
    });
    return { raw: res, jd_id: extractJdId(res), jd_text: extractJdText(res), duplicate: false } as ParseJDResponse;
  } catch (err: unknown) {
    return handleDuplicateJd(err);
  }
}

export async function parseJDByJob(jobId: string) {
  try {
    const res = await safePost<unknown>(`/jd/parse-by-job/${encodeURIComponent(jobId)}`);
    return {
      raw: res,
      jd_id: extractJdId(res),
      duplicate: Boolean(isObject(res) && res['from_cache']),
    } as ParseJDResponse;
  } catch (err: unknown) {
    return handleDuplicateJd(err);
  }
}

/* ========== MATCHING ========== */
export async function matchResumeAndJD(resume_id: string, jd_id: string) {
  const data = await safePost(`/matcher/match`, {
    resume_id,
    jd_id,
  });
  return data;
}

export async function getMatchAnalytics(resume_id?: string, jd_id?: string) {
  const qs = new URLSearchParams();
  if (resume_id) qs.append("resume_id", resume_id);
  if (jd_id) qs.append("jd_id", jd_id);
  const url = qs.toString()
    ? `/matcher/analytics?${qs.toString()}`
    : `/matcher/analytics`;
  return await safeGet(url);
}

export async function listAllMatches() {
  return await safeGet(`/matcher/list`);
}

/* ========== SCORE UPDATE — MATCHER LIVE UPDATE ========== */

const MATCHER_SKILL_ERRORS = {
  add:    { key: "duplicate_skill",            msg: "Skill already exists in resume" },
  remove: { key: "cannot_remove_original_skill", msg: "Cannot remove original skill from resume" },
} as const;

async function patchMatcherSkill(match_id: string, skills: string | string[], action: "add" | "remove") {
  const skill = Array.isArray(skills) ? skills[0] : skills;
  if (!skill || !skill.trim()) throw new Error("No skill provided");

  const endpoint = `/matcher/live-update/${match_id}/${action}-skill`;
  const payload = action === "add" ? { skill_to_add: skill.trim() } : { skill_to_remove: skill.trim() };
  const { key: skipError, msg: skipMsg } = MATCHER_SKILL_ERRORS[action];

  logger.api.request('POST', endpoint, payload);
  try {
    const resp = await httpClient.post<Record<string, unknown>>(endpoint, payload);
    logger.debug(`Skill ${action}ed from matcher`, { match_id, skill });
    const data = resp.data as Record<string, unknown>;
    return {
      success: true,
      data,
      ats_scores: (data?.ats_scores as Record<string, unknown>) || { new: data?.new_ats_score },
      updated_technical_skills: data?.updated_technical_skills as string[] | undefined,
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data;
      if (raw?.error === skipError || raw?.detail?.error === skipError) {
        logger.warn(skipMsg, { match_id, skill });
        return { skipped: true, data: null, reason: skipError };
      }
    }
    logger.api.error('POST', endpoint, err);
    throw err;
  }
}

export async function matcherAddSkill(match_id: string, skills: string | string[]) {
  return patchMatcherSkill(match_id, skills, "add");
}

export async function matcherRemoveSkill(match_id: string, skills: string | string[]) {
  return patchMatcherSkill(match_id, skills, "remove");
}

/* ========== ENHANCE APPLY / REMOVE ========== */

export async function matcherUpdateSections(
  match_id: string,
  sections: { sectionName: string; items: ({ title?: string; description?: string } | string)[] }[],
  replace = false
) {
  return await safePut(`/matcher/${match_id}/sections`, { sections, replace });
}

export async function matcherEnhanceApply(match_id: string, suggestion_id: string, fix_type = "auto", value?: string) {
  const resp = await httpClient.post<Record<string, unknown>>(
    `/matcher/enhance/apply/${match_id}`,
    { suggestion_id, fix_type, value: value ?? null, include_resume: true }
  );
  return resp.data;
}

export async function matcherEnhanceRemove(match_id: string, suggestion_id: string) {
  const resp = await httpClient.post<Record<string, unknown>>(
    `/matcher/enhance/remove/${match_id}`,
    { suggestion_id }
  );
  return resp.data;
}

/* ========== RESUME DOWNLOAD ========== */

export async function downloadResumePdf(resume_id: string, filename?: string, match_id?: string): Promise<void> {
  const response = await httpClient.get(`/parser/download/${resume_id}`, {
    params: { format: "pdf", use_original: false, preserve_template: false, ...(match_id ? { match_id } : {}) },
    responseType: "blob",
  });
  const contentDisposition = (response.headers as Record<string, string>)["content-disposition"] ?? "";
  const serverFilename = contentDisposition.match(/filename="?([^"]+)"?/)?.[1];
  const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = serverFilename ?? filename ?? `resume_${resume_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ========== EXPORT ========== */
export const parserApi = {
  parseResume,
  getResume,
  deleteResume,
  calculateATS,
  enhanceKeywords,
  parserAddSkills,
  parserRemoveSkills,
  parseJDFile,
  parseJDText,
  parseJDUrl,
  matchResumeAndJD,
  getMatchAnalytics,
  listAllMatches,
  matcherAddSkill,
  matcherRemoveSkill,
  matcherUpdateSections,
};
export default parserApi;
