import { httpClient } from '@/lib/http';

// ── Parse resume from profile ────────────────────────────────────────────────

export interface ParseFromProfileResponse {
  resume_id: string;
  from_cache: boolean;
  source: string;
  must_parse?: boolean; // present on 409 — user must run ATS parse first
}

export const parseResumeFromProfile = async (): Promise<ParseFromProfileResponse> => {
  const response = await httpClient.post<ParseFromProfileResponse>(
    '/parser/parse-from-profile',
    {}
  );
  return response.data;
};

// ── Parse JD by job_id ────────────────────────────────────────────────────────

export interface ParseJdByJobResponse {
  success: boolean;
  from_cache: boolean;
  source: string;
  jd_id: string;
  job_id: string;
}

export const parseJdByJob = async (jobId: string): Promise<ParseJdByJobResponse> => {
  const response = await httpClient.post<ParseJdByJobResponse>(
    `/jd/parse-by-job/${jobId}`,
    {}
  );
  return response.data;
};

// ── Premium Actions ───────────────────────────────────────────────────────────

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
  status: 'pending' | 'refunded' | 'executed' | 'failed';
}

export interface ExecuteActionResponse {
  action_id: string;
  status: string;
  credits_used: number;
  user_credits_remaining: number;
  result: Record<string, unknown> | null;
  error: string | null;
  completed_at: string;
}

export interface ActionStatusResponse {
  action_id: string;
  action_type: string;
  status: 'pending' | 'executed' | 'refunded' | 'failed';
  quoted_credits: number;
  job_id: string;
  created_at: string;
  expires_at: string;
  executed_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
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

export const getPremiumActionStatus = async (
  actionId: string
): Promise<ActionStatusResponse> => {
  const response = await httpClient.get<ActionStatusResponse>(
    `/premium/actions/${actionId}`
  );
  return response.data;
};
