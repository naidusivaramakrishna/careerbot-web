import { httpClient } from '@/lib/http';

// ==================== INTERFACES ====================

// ── Readiness ──────────────────────────────────────────────────────────────────

export interface ReadinessResponse {
  ready: boolean;
  criteria: {
    min_practice_rounds: number;
    avg_score_threshold: number;
    rounds_completed: number;
    current_avg: number;
  };
  recommendation: string;
}

// ── Session Recover ────────────────────────────────────────────────────────────

export interface ActiveSession {
  session_id: string;
  type: string;
  status: string;
  last_activity: string;
  questions_remaining: number;
}

export interface RecoverSessionResponse {
  active_session: ActiveSession | null;
}

// ── User Progress ──────────────────────────────────────────────────────────────

export interface UserProgress {
  total_sessions: number;
  practice_rounds: number;
  live_sessions: number;
  avg_score: number;
  score_trend: number[]; // array of score values, newest last (spec: [6.0, 6.5, 7.0, ...])
  last_activity: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Check if user meets criteria to start a live interview
 * GET /api/v1/mock-interview/readiness
 */
export const getReadiness = async (category?: string): Promise<ReadinessResponse> => {
  const response = await httpClient.get<ReadinessResponse>('/mock-interview/readiness', {
    params: category ? { category } : undefined,
  });
  return response.data;
};

/**
 * Return the user's active session for crash recovery
 * GET /api/v1/mock-interview/session/recover
 */
export const recoverSession = async (): Promise<RecoverSessionResponse> => {
  const response = await httpClient.get<RecoverSessionResponse>('/mock-interview/session/recover');
  return response.data;
};

/**
 * Fetch overall user progress and analytics
 * GET /api/v1/mock-interview/user-progress
 */
export const getUserProgress = async (): Promise<UserProgress> => {
  const response = await httpClient.get<UserProgress>('/mock-interview/user-progress');
  return response.data;
};

// ==================== DPDP COMPLIANCE ====================

export interface DeleteUserDataResponse {
  deleted: boolean;
  collections_cleared: string[];
}

export interface DeleteAudioResponse {
  deleted: boolean;
  files_removed: number;
}

export interface ExportUserDataResponse {
  user_id: string;
  sessions: unknown[];
  reports: unknown[];
  notes: Record<string, unknown>;
  feedback: unknown[];
  exported_at: string;
}

/**
 * Delete ALL mock interview data for the current user (DPDP right to erasure)
 * DELETE /api/v1/mock-interview/data/{user_id}
 */
export const deleteUserData = async (userId: string): Promise<DeleteUserDataResponse> => {
  const response = await httpClient.delete<DeleteUserDataResponse>(
    `/mock-interview/data/${userId}`
  );
  return response.data;
};

/**
 * Delete raw audio files for a session (DPDP compliance)
 * DELETE /api/v1/mock-interview/audio/{session_id}
 */
export const deleteSessionAudio = async (sessionId: string): Promise<DeleteAudioResponse> => {
  const response = await httpClient.delete<DeleteAudioResponse>(
    `/mock-interview/audio/${sessionId}`
  );
  return response.data;
};

/**
 * Export all mock interview data as JSON (DPDP data portability)
 * GET /api/v1/mock-interview/data-export/{user_id}
 */
export const exportUserData = async (userId: string): Promise<ExportUserDataResponse> => {
  const response = await httpClient.get<ExportUserDataResponse>(
    `/mock-interview/data-export/${userId}`
  );
  return response.data;
};

// ==================== LIVE SESSIONS LIST ====================

/**
 * List all live mock interview sessions for the current user
 * GET /api/v1/mock-interview/live-sessions
 * NOTE: Different from GET /live/history — flat endpoint, not nested under /live/
 */
export const getLiveSessions = async (): Promise<{ sessions: LiveSession[] }> => {
  const response = await httpClient.get<{ sessions: LiveSession[] }>(
    '/mock-interview/live-sessions'
  );
  return response.data;
};

// ==================== PHASE 2 — REPORT INTERFACES ====================

export interface ReportAnswer {
  question_text: string;
  score: number;
  feedback: string;
  key_points_hit: number;
  key_points_total: number;
  transcript?: string;
  duration_s?: number;
  filler_count?: number;
}

export interface ReportResponse {
  report_id: string;
  session_id: string;
  user_id: string;
  type: string;
  overall_score: number;
  scores: {
    overall: number;
    hr?: number;
    communication?: number;
    confidence?: number;
    technical?: number;
    [key: string]: number | undefined;
  };
  answers: ReportAnswer[];
  recommendations?: string[];
  pressure_tag: 'pressure_affected' | null;
  grade?: string;
  performance_summary?: string;
  strengths?: string[];
  improvement_areas?: string[];
  created_at: string;
  // Coding round data (live_technical sessions only)
  coding_performance?: {
    score: number;
    // Backend sends nested criterion objects, not bare numbers. See
    // careerbot-api tests/coding_test/test_interview_coding.py (_STEP_RESPONSE.grade.criteria).
    criteria?: Record<string, { score: number; weight: number; feedback?: string }>;
    // Backend field is ai_feedback_summary; `summary` is kept only as a
    // tolerated legacy alias.
    ai_feedback_summary?: string;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
    follow_ups_completed?: number;
    average_followup_score?: number;
    [key: string]: unknown;
  };
  // Computed fields used by UI (may come from backend or derived)
  duration_min?: number;
  question_count?: number;
  practice_avg?: number;
  mock_avg?: number;
  improvement_pct?: number;
  radar?: { dimension: string; score: number }[];
  action_plan?: string[];
  suggested_reattempt?: string;
  interviewer_perspective?: string;
  hinglish_phrases?: { original: string; english: string }[];
  redo_questions?: { num: number; text: string; score: number; issue: string }[];
}

export interface ShareReportResponse {
  share_url: string;
  token: string;
  expires_at: string;
}

// ==================== PHASE 2 — REPORT FUNCTIONS ====================

/**
 * Fetch full report for a completed session
 * GET /api/v1/mock-interview/report/{session_id}
 */
export const getReport = async (sessionId: string): Promise<ReportResponse> => {
  const response = await httpClient.get<ReportResponse>(`/mock-interview/report/${sessionId}`);
  return response.data;
};

/**
 * View a PII-stripped report by public share token (no auth required)
 * GET /api/v1/mock-interview/shared-report/{token}
 */
export const getSharedReport = async (token: string): Promise<ReportResponse> => {
  const response = await httpClient.get<ReportResponse>(
    `/mock-interview/shared-report/${token}`
  );
  return response.data;
};

/**
 * Generate a public share link for a report (7-day TTL)
 * POST /api/v1/mock-interview/report/{session_id}/share
 */
export const shareReport = async (sessionId: string): Promise<ShareReportResponse> => {
  const response = await httpClient.post<ShareReportResponse>(
    `/mock-interview/report/${sessionId}/share`,
    {} as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Download session report as PDF (returns blob URL)
 * GET /api/v1/mock-interview/report/{session_id}/pdf
 */
export const downloadReportPdf = async (sessionId: string): Promise<void> => {
  const response = await httpClient.get(`/mock-interview/report/${sessionId}/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${sessionId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// ==================== PHASE 3 — LIVE INTERVIEW INTERFACES ====================

export interface LiveCreateRequest {
  session_type: 'hr' | 'technical' | 'managerial' | 'technical_coding';
  resume_id?: string;
  target_role?: string;
  enable_streaming_stt?: boolean;
  voice?: string;
  use_orchestrator?: boolean;
}

export interface LiveCreateResponse {
  session_id: string;
  ticket_id: string;
  ticket_expires_at: string;
  ws_url: string;
}

export interface LiveSessionState {
  session_id: string;
  status: 'active' | 'completed' | 'abandoned' | 'expired' | 'recovering';
  current_question: number;
  questions_asked: number;
  time_elapsed_s: number;
  can_reconnect: boolean;
  reconnect_token?: string;
}

export interface LiveSession {
  session_id: string;
  type: string;
  status: string;
  created_at: string;
  score?: number;
  duration_s?: number;
  question_count?: number;
  pressure_tag?: 'pressure_affected' | null;
}

// ── WS Message types (client → server) ──

export interface LipSyncWord {
  word: string;
  start_ms: number;
  end_ms: number;
  confidence?: number;
}

export interface LipSyncViseme {
  viseme_id?: string;
  provider_viseme_id?: string | number;
  start_ms: number;
  end_ms: number;
  intensity?: number;
}

export interface LipSyncPayload {
  schema_version: string;
  sync_source: 'provider_viseme' | 'forced_alignment' | 'unavailable' | string;
  provider?: 'azure_speech' | 'rhubarb' | string;
  sync_provider?: 'azure_speech' | 'rhubarb' | string;
  timebase?: 'audio_start_ms' | string;
  audio_start_offset_ms?: number;
  words?: LipSyncWord[];
  visemes?: LipSyncViseme[];
}
export type WsClientMessage =
  | { type: 'audio_chunk'; data: string; sequence: number }
  | { type: 'submit_answer'; text: string }
  | { type: 'end_answer'; text?: string }
  | { type: 'skip_question' }
  | { type: 'end_interview' }
  | { type: 'coding_answer'; submission_id: string | null; score: number | null; problem_slug: string }
  | { type: 'ping' };

// ── WS Message types (server → client) ──
export type WsServerMessage =
  | { type: 'session_ready'; session_id: string; total_questions: number; estimated_duration_m: number }
  | { type: 'session_resumed'; session_id: string; questions_asked: number; total_questions: number; current_question: string; pending_answer?: boolean; resumed_from_event_id?: number }
  | { type: 'question_audio'; question_number: number; text: string; audio: string | null; time_limit_s: number; is_follow_up?: boolean; audio_format?: string; sample_rate?: number; duration_ms?: number; lip_sync?: LipSyncPayload | null }
  | { type: 'transcript_partial'; text: string; new_word?: string; word_index?: number; timestamp_ms?: number; is_final?: boolean }
  | { type: 'transcript_final'; text: string; is_final: true }
  | { type: 'answer_scored'; question_number: number; score: number; feedback?: string; key_points_hit?: number; key_points_total?: number }
  | { type: 'follow_up'; text: string; audio: string | null; audio_format?: string; sample_rate?: number; duration_ms?: number; time_limit_s?: number; lip_sync?: LipSyncPayload | null }
  | { type: 'question_skipped'; skipped_question_number: number }
  | { type: 'interview_complete'; report_id: string; overall_score: number }
  | { type: 'session_paused'; reason: string; reconnect_token: string | null }
  | { type: 'coding_round_start'; problem_slug: string; problem_title: string; time_limit_s: number }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' };

// ==================== PHASE 3 — LIVE INTERVIEW FUNCTIONS ====================

/**
 * Create a new live interview session and get a one-time WS ticket
 * POST /api/v1/mock-interview/live/create
 * Credit cost: 20 credits
 */
export const createLiveSession = async (data: LiveCreateRequest): Promise<LiveCreateResponse> => {
  const response = await httpClient.post<LiveCreateResponse>(
    '/mock-interview/live/create',
    data as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Submit the proctoring video for a completed live session.
 * POST /api/v1/mock-interview/evaluate-video  (multipart/form-data)
 * Fields: session_id, file
 */
export const evaluateLiveSessionVideo = async (
  sessionId: string,
  video: Blob,
): Promise<void> => {
  const cleanType = (video.type || 'video/mp4').split(';')[0];
  const cleanBlob = video.type === cleanType ? video : new Blob([video], { type: cleanType });
  const ext = cleanType.includes('mp4') ? 'mp4' : 'webm';

  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('file', cleanBlob, `session-${sessionId}.${ext}`);

  await httpClient.post(
    '/mock-interview/evaluate-video',
    formData,
    {
      headers: { 'Content-Type': undefined as unknown as string },
      timeout: 15 * 60 * 1000,
    },
  );
};

/**
 * Get current state of a live session (for recovery/polling)
 * GET /api/v1/mock-interview/live/{session_id}/state
 */
export const getLiveSessionState = async (sessionId: string): Promise<LiveSessionState> => {
  const response = await httpClient.get<LiveSessionState>(`/mock-interview/live/${sessionId}/state`);
  return response.data;
};

/**
 * List current user's live interview sessions
 * GET /api/v1/mock-interview/live/history
 */
export const getLiveHistory = async (limit = 20): Promise<{ sessions: LiveSession[] }> => {
  const response = await httpClient.get<{ sessions: LiveSession[] }>('/mock-interview/live/history', {
    params: { limit },
  });
  return response.data;
};

/**
 * Build the full WebSocket URL for a live session.
 * Next.js HTTP rewrites do NOT proxy WebSocket upgrades, so we connect
 * directly to the backend host, not through window.location.host.
 */
export function buildWsUrl(wsPath: string): string {
  // Already a full WS URL — use as-is
  if (wsPath.startsWith('ws://') || wsPath.startsWith('wss://')) {
    return wsPath;
  }

  // Production: derive backend WS origin from NEXT_PUBLIC_BASE_URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
    const wsBase = baseUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
      .replace(/\/api\/v1\/?$/, '');
    return `${wsBase}${wsPath}`;
  }

  // Development: backend is at port 8000 (Next.js on 3000 cannot proxy WS)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const backendHost = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8000';
  return `${proto}://${backendHost}${wsPath}`;
}
