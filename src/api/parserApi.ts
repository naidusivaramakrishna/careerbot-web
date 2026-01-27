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
// PATCH /api/v1/parser/add-skills/{resume_id} - Add missing skills to resume
// Request body: { skills: ["skill1", "skill2", ...] }
// Response: Updated resume data with new skills

export async function parserAddSkills(resume_id: string, skills: string | string[]) {
  const skillArray = Array.isArray(skills) ? skills : [skills];

  if (!resume_id?.trim()) {
    throw new Error(`Invalid resume_id: ${resume_id}`);
  }
  if (!skillArray.length) {
    throw new Error("No skills provided");
  }

  logger.api.request('PATCH', `/parser/add-skills/${resume_id}`, { skills: skillArray });

  try {
    const res = await safePatch(`/parser/add-skills/${resume_id}`, { skills: skillArray });
    logger.debug("Skills added successfully", { count: skillArray.length });
    return res;
  } catch (err: unknown) {
    logger.api.error('PATCH', `/parser/add-skills/${resume_id}`, err);
    throw err;
  }
}

// PATCH /api/v1/parser/remove-skills/{resume_id} - Remove skills from resume
// Request body: { skills: ["skill1", "skill2", ...] }
// Response: Updated resume data with skills removed

export async function parserRemoveSkills(resume_id: string, skills: string | string[]) {
  const skillArray = Array.isArray(skills) ? skills : [skills];

  if (!resume_id?.trim()) {
    throw new Error(`Invalid resume_id: ${resume_id}`);
  }
  if (!skillArray.length) {
    throw new Error("No skills provided");
  }

  logger.api.request('PATCH', `/parser/remove-skills/${resume_id}`, { skills: skillArray });

  try {
    const res = await safePatch(`/parser/remove-skills/${resume_id}`, { skills: skillArray });
    logger.debug("Skills removed successfully", { count: skillArray.length });
    return res;
  } catch (err: unknown) {
    logger.api.error('PATCH', `/parser/remove-skills/${resume_id}`, err);
    throw err;
  }
}

/* ========== JD PARSING ========== */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getRaw(err: unknown): unknown {
  return (err as { __raw?: unknown })?.__raw;
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

export async function parseJDFile(file: File) {
  const form = new FormData();
  form.append("files", file);
  try {
    const res = await safePost<unknown>(`/jd/extract?skip_duplicate_check=false`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      raw: res,
      jd_id: extractJdId(res),
      duplicate: false,
    } as ParseJDResponse;
  } catch (err: unknown) {
    const raw = getRaw(err) as unknown as { detail?: { error?: string; existing_id?: string } } | undefined;
    if (raw?.detail?.error === "duplicate_jd") {
      return {
        raw,
        jd_id: raw.detail.existing_id,
        duplicate: true,
      } as ParseJDResponse;
    }
    throw err;
  }
}

export async function parseJDText(text: string) {
  try {
    const res = await safePost<unknown>(`/jd/parse`, {
      jd_texts: [text],
      skip_duplicate_check: false,
    });
    return {
      raw: res,
      jd_id: extractJdId(res),
      duplicate: false,
    } as ParseJDResponse;
  } catch (err: unknown) {
    const raw = getRaw(err) as unknown as { detail?: { error?: string; existing_id?: string } } | undefined;
    if (raw?.detail?.error === "duplicate_jd") {
      return {
        raw,
        jd_id: raw.detail.existing_id,
        duplicate: true,
      } as ParseJDResponse;
    }
    throw err;
  }
}

export async function parseJDUrl(url: string) {
  try {
    const res = await safePost<unknown>(`/jd/extract-url`, {
      url: url,  // Backend expects singular 'url', not 'urls' array
      skip_duplicate_check: false,
    });
    return {
      raw: res,
      jd_id: extractJdId(res),
      duplicate: false,
    } as ParseJDResponse;
  } catch (err: unknown) {
    const raw = getRaw(err) as unknown as { detail?: { error?: string; existing_id?: string } } | undefined;
    if (raw?.detail?.error === "duplicate_jd") {
      return {
        raw,
        jd_id: raw.detail.existing_id,
        duplicate: true,
      } as ParseJDResponse;
    }
    throw err;
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
// POST /api/v1/matcher/live-update/{match_id}/add-skill - Add skill and update score
// Request body: { "skill": "skill_name" } or { "skill_name": "value" }
// Response: Updated match data with new ATS score

export async function matcherAddSkill(match_id: string, skills: string | string[]) {
  // Extract single skill - matcher endpoint expects singular skill
  const skill = Array.isArray(skills) ? skills[0] : skills;
  if (!skill || !skill.trim()) throw new Error("No skill provided");

  const payload = { skill: skill.trim() };
  logger.api.request('POST', `/matcher/live-update/${match_id}/add-skill`, payload);

  try {
    const resp = await httpClient.post<Record<string, unknown>>(
      `/matcher/live-update/${match_id}/add-skill`,
      payload
    );

    logger.debug("Skill added to matcher", { match_id, skill });

    // Normalize response to ensure consistent structure
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

      if (raw?.error === "skill_exists" || raw?.error?.message?.includes("skill_exists")) {
        logger.warn("Skill already exists in resume", { match_id, skill });
        return { skipped: true, data: null, reason: "skill_exists" };
      }
    }
    logger.api.error('POST', `/matcher/live-update/${match_id}/add-skill`, err);
    throw err;
  }
}

// POST /api/v1/matcher/live-update/{match_id}/remove-skill - Remove skill and update score
// Request body: { "skill": "skill_name" }
// Response: Updated match data with recalculated ATS score

export async function matcherRemoveSkill(match_id: string, skills: string | string[]) {
  // Extract single skill - matcher endpoint expects singular skill
  const skill = Array.isArray(skills) ? skills[0] : skills;
  if (!skill || !skill.trim()) throw new Error("No skill provided");

  const payload = { skill: skill.trim() };
  logger.api.request('POST', `/matcher/live-update/${match_id}/remove-skill`, payload);

  try {
    const resp = await httpClient.post<Record<string, unknown>>(
      `/matcher/live-update/${match_id}/remove-skill`,
      payload
    );

    logger.debug("Skill removed from matcher", { match_id, skill });

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

      if (raw?.error === "skill_not_in_resume" || raw?.error?.message?.includes("skill_not_in_resume")) {
        logger.warn("Skill not found in resume", { match_id, skill });
        return { skipped: true, data: null, reason: "skill_not_in_resume" };
      }
    }
    logger.api.error('POST', `/matcher/live-update/${match_id}/remove-skill`, err);
    throw err;
  }
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
};
export default parserApi;
