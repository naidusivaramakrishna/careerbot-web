import { httpClient } from '@/lib/http';
import { getAllResumes } from './resumeatsapi';

// ── JD Parse ─────────────────────────────────────────────

export interface ParsedJDItem {
  id?: string;
  jd_id?: string;
  job_id?: string;
  [key: string]: unknown;
}

export const parseJobDescriptionForId = async (
  jobId: string,
  text: string
): Promise<string> => {
  try {
    const response = await httpClient.post<ParsedJDItem[] | ParsedJDItem>(
      '/jd/parse',
      [{ job_id: jobId, text }]
    );
    const data = response.data;
    const item: ParsedJDItem = Array.isArray(data) ? data[0] : data;
    const id = item?.jd_id ?? item?.id ?? item?.job_id;
    if (id) return String(id);
  } catch {
    // JD parse failed — fall back to job_id as jd_id (per API example)
  }
  return jobId;
};

// ── Resume ID from parsed resumes (GET /api/v1/resumes/) ──

export const getActiveResumeId = async (): Promise<string> => {
  const resumes = await getAllResumes();
  if (!resumes || resumes.length === 0)
    throw new Error('No analyzed resume found. Please complete an ATS scan first.');
  const sorted = [...resumes].sort((a, b) => {
    const da = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const db = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return db - da;
  });
  const id = sorted[0].id;
  if (!id) throw new Error('Could not determine resume ID. Please re-upload your resume.');
  return id;
};

// ── Premium Actions ───────────────────────────────────────

export interface PremiumActionPayload {
  action_type: string;
  job_id: string;
  idempotency_key: string;
  options: Record<string, unknown>;
}

export interface PendingActionResponse {
  action_id: string;
  action_type: string;
  quoted_credits: number;
  user_credits_remaining: number;
  expires_at: string;
  status: 'pending';
}

export interface ExecuteActionResponse {
  action_id: string;
  status: string;
  result?: Record<string, unknown>;
}

export const createPremiumAction = async (
  payload: PremiumActionPayload
): Promise<PendingActionResponse> => {
  const response = await httpClient.post<PendingActionResponse>('/premium/actions', payload);
  return response.data;
};

export const executePremiumAction = async (
  actionId: string
): Promise<ExecuteActionResponse> => {
  const response = await httpClient.post<ExecuteActionResponse>(
    `/premium/actions/${actionId}/execute`,
    {}
  );
  return response.data;
};
