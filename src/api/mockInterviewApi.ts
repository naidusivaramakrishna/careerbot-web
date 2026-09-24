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
  // The live realtime backend sends a short `note` per answer; older payloads
  // sent `feedback`. Read both.
  feedback?: string;
  note?: string;
  question_id?: string;
  // Per-competency scores for this answer (live realtime backend, 0-100).
  competency_scores?: Record<string, number>;
  performance_level?: string;
  key_points_hit?: number;
  key_points_total?: number;
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
  // Older payloads use overall/hr/communication/confidence on a 0-10 scale;
  // the live realtime backend sends hr_score/communication_score/
  // confidence_score on a 0-100 scale.
  scores: {
    overall?: number;
    hr?: number;
    communication?: number;
    confidence?: number;
    technical?: number;
    hr_score?: number;
    communication_score?: number;
    confidence_score?: number;
    technical_score?: number;
    [key: string]: number | undefined;
  };
  answers: ReportAnswer[];
  duration_seconds?: number;
  // Live realtime backend fields.
  not_scored?: boolean;
  performance_level?: string;
  end_reason?: string;
  time_limit_seconds?: number;
  // Overall competency scores (0-10 scale on the current backend).
  competency_scores?: Record<string, number>;
  interview_readiness?: {
    ready_for_interview?: boolean;
    recommended_practice_areas?: string[];
  };
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
  // Only these three are accepted — "mixed" (and the old "technical_coding")
  // are rejected (422). There is no separate coding-round flag: this backend
  // release has no live-interview coding round at all.
  session_type: 'hr' | 'technical' | 'managerial';
  target_role?: string;
  experience_level?: string;
  focus_areas?: string[];
  resume_id?: string;
}

// interview-avatar.txt section 3. `null` is the normal/default case — feature
// off, concurrency cap reached, or LiveAvatar refused/timed out. Never an error.
export interface LiveAvatarSession {
  livekit_url: string;
  livekit_client_token: string;
  avatar_id: string;
  provider_session_id: string;
  mode: string; // always "LITE" in Phase 1
}

export interface LiveCreateResponse {
  session_id: string;
  ticket_id: string;
  ticket_expires_at: string;
  ws_url: string;
  time_limit_seconds: number;
  time_limit_minutes: number;
  live_provider: string;
  audio_input_format: string;
  audio_output_format: string;
  supports_audio_delta: boolean;
  supports_interruption: boolean;
  supports_transcript_delta: boolean;
  avatar: LiveAvatarSession | null;
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

// ── WS message types ──
// Rewritten for the realtime-voice protocol (backend PR #204). Every server
// frame also carries session_id, event_id (dedup'd generically at the parse
// site) and sometimes timestamp_ms/version — omitted here since nothing reads
// them per-variant.
//
// coding_answer / coding_round_start are NOT part of this backend release's
// documented protocol (live-interview.txt has no coding-round section at
// all) — kept here only so the existing coding-round UI keeps compiling
// as inert, unused code until that feature ships server-side again.

export interface AnswerEvaluation {
  weighted_score: number;
  confidence?: number;
  score_source?: string;
  scoring_skipped?: boolean;
  excluded_from_scoring?: boolean;
  one_line_observation?: string;
}

export type WsClientMessage =
  | { type: 'audio_chunk'; data: string }
  | { type: 'end_interview' }
  | { type: 'skip_question' }
  | { type: 'ping' }
  | { type: 'coding_answer'; submission_id: string | null; score: number | null; problem_slug: string };

export type WsServerMessage =
  | { type: 'session_ready' }
  | { type: 'session_resumed'; questions_asked: number; current_question?: string; resumed_from_event_id?: number; pending_answer?: boolean }
  | { type: 'interviewer_audio_delta'; audio_base64: string; mime_type: string }
  | { type: 'interviewer_transcript_delta'; text: string }
  | { type: 'interviewer_transcript_final'; text: string }
  | { type: 'interviewer_generation_complete' }
  | { type: 'turn_complete' }
  | { type: 'interviewer_interrupted' }
  // Doc: "question text in question_text, text or question.question_text" — all three optional, checked in that order.
  | { type: 'question_next'; question_text?: string; text?: string; question?: { question_text?: string } }
  | { type: 'candidate_turn_open' }
  | { type: 'candidate_turn_closed' }
  // item_id groups the partials of one spoken item; a transcript_final replaces them.
  | { type: 'transcript_partial'; text: string; item_id?: string }
  | { type: 'transcript_final'; text: string; item_id?: string }
  | { type: 'transcription_error'; message?: string }
  // Never shown as captions — ignored on purpose.
  | { type: 'transcript_partial_ignored' }
  | { type: 'transcript_late' }
  | { type: 'candidate_turn_late' }
  | { type: 'turn_timeout' }
  | { type: 'answer_scored'; question_id: string; evaluation: AnswerEvaluation }
  | { type: 'session_closing' }
  | { type: 'interview_complete'; report_id: string; overall_score: number }
  | { type: 'session_paused'; reason: string; reconnect_token: string | null }
  | { type: 'heartbeat'; ts_ms?: number }
  | { type: 'error'; code: string; message: string; recoverable?: boolean }
  | { type: 'pong' }
  | { type: 'coding_round_start'; problem_slug: string; problem_title: string; time_limit_s: number }
  // interview-avatar.txt section 6. Purely presentational (safe to ignore) —
  // "listening" is driven by the AI detecting candidate speech.
  | { type: 'avatar_state'; state: 'idle' | 'listening' | 'talking' }
  // reason: connect_failed (avatar never came up) or stream_lost (dropped
  // mid-interview, including LiveAvatar's own session time limit). The
  // avatar never returns in the same session — fall back to audio deltas.
  | { type: 'avatar_unavailable'; reason: 'connect_failed' | 'stream_lost' | string };

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
