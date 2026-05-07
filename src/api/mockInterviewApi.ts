import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

// ── Consent ────────────────────────────────────────────────────────────────────

export interface ConsentResponse {
  consent_recorded: boolean;
  timestamp: string;
}

// ── Generate Notes ─────────────────────────────────────────────────────────────

export interface GenerateNotesRequest {
  resume_id: string;
  target_role?: string;
  experience_level?: 'fresher' | 'mid' | 'senior';
}

export interface HRAnswer {
  question_id: string;
  question_text: string;
  why_asked: string;
  answer_script: string;
  practice_tip: string;
  common_mistake: string;
  experience_level: 'fresher' | 'experienced' | 'both';
}

export interface ProjectNote {
  project_name: string;
  overview: string;
  your_role: string;
  tech_stack: string;
  how_it_works: string;
  challenges: string;
  results: string;
  follow_up_questions: { q: string; hint: string }[];
}

export interface GenerateNotesResponse {
  notes: {
    self_introduction?: string;
    project_explanations?: ProjectNote[];
    hr_answers?: HRAnswer[];
    additional_notes?: {
      hobbies: string[];
      hobbies_custom: string;
      career_goals_short: string;
      career_goals_long: string;
      why_this_field: string;
      teamwork_example: string;
      handling_gaps: string;
      learning_attitude: string;
    };
    unfilled_count?: number;
    [key: string]: unknown;
  };
  cached: boolean;
}

// ── Get / Update Notes ─────────────────────────────────────────────────────────

export interface NotesRecord {
  resume_id: string;
  target_role: string;
  notes: GenerateNotesResponse['notes'];
  updated_at: string;
  source: 'ai' | 'manual' | 'hybrid';
}

export interface UpdateNotesResponse {
  updated: boolean;
  notes: GenerateNotesResponse['notes'];
}

// ── Practice ───────────────────────────────────────────────────────────────────

export interface PracticeQuestion {
  id: string;
  text: string;
  category: string;
  key_points: string[];
  time_limit_s: number;
}

export interface StartPracticeRequest {
  round_number: number;
  category?: string;
  target_role?: string;
}

export interface StartPracticeResponse {
  session_id: string;
  questions: PracticeQuestion[];
  round_number: number;
}

export interface SubmitAnswerResponse {
  transcript: string;
  rule_based: boolean;
  scores: {
    content_score: number;
    clarity_score: number;
    structure_score: number;
    length_score: number;
    weighted_score: number;
  };
  feedback: {
    good_points: string[];
    improvements: string[];
    improved_answer: string;
    encouragement: string;
  };
  rule_scores: {
    filler_count: number;
    key_points_hit: string[];
    key_points_missed: string[];
    fillers_detected: string[];
    rule_score: number;
  };
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
  model?: string;
  processing_time_ms?: number;
}

export interface PracticeProgress {
  session_id: string;
  total_questions: number;
  answered: number;
  avg_score: number;
  round_number: number;
  scores: { question_id: string; score: number }[];
}

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

// ── English Essentials ─────────────────────────────────────────────────────────

export interface EnglishEssentials {
  phrases: string[];
  filler_replacements: Record<string, string>;
  common_mistakes: { wrong: string; correct: string }[];
  phrasal_verbs: { verb: string; meaning: string }[];
}

// ==================== API FUNCTIONS ====================

/**
 * Record user consent for AI processing (DPDP compliance)
 * POST /api/v1/mock-interview/consent
 */
export const recordConsent = async (consent_given: boolean): Promise<ConsentResponse> => {
  const response = await httpClient.post<ConsentResponse>(
    '/mock-interview/consent',
    { consent_given } as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Generate AI-powered interview prep notes from user's resume
 * POST /api/v1/mock-interview/generate-notes
 * Credit cost: 10 credits
 */
export const generateNotes = async (data: GenerateNotesRequest): Promise<GenerateNotesResponse> => {
  try {
    logger.debug('📝 Generating mock interview notes', data);
    const response = await httpClient.post<GenerateNotesResponse>(
      '/mock-interview/generate-notes',
      data as unknown as Record<string, unknown>
    );
    logger.info('✅ Notes generated successfully');
    return response.data;
  } catch (error) {
    logger.error('❌ Error generating notes:', error);
    throw error;
  }
};

/**
 * Fetch stored interview prep notes for a user
 * GET /api/v1/mock-interview/notes/{user_id}
 */
export const getNotes = async (userId: string): Promise<NotesRecord> => {
  const response = await httpClient.get<NotesRecord>(`/mock-interview/notes/${userId}`);
  return response.data;
};

/**
 * Partially update interview prep notes (user edits)
 * PUT /api/v1/mock-interview/notes/{user_id}
 */
export const updateNotes = async (
  userId: string,
  notes: Record<string, unknown>
): Promise<UpdateNotesResponse> => {
  const response = await httpClient.put<UpdateNotesResponse>(
    `/mock-interview/notes/${userId}`,
    { notes } as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Return interview English phrases and filler replacements
 * GET /api/v1/mock-interview/english-essentials (public)
 */
export const getEnglishEssentials = async (): Promise<EnglishEssentials> => {
  const response = await httpClient.get<EnglishEssentials>('/mock-interview/english-essentials');
  return response.data;
};

/**
 * Start a new practice round with questions
 * POST /api/v1/mock-interview/practice/start
 */
export const startPractice = async (data: StartPracticeRequest): Promise<StartPracticeResponse> => {
  const response = await httpClient.post<StartPracticeResponse>(
    '/mock-interview/practice/start',
    data as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Submit a recorded audio answer for AI scoring
 * POST /api/v1/mock-interview/practice/answer  (multipart/form-data)
 * Credit cost: 5 credits (only if LLM is called; 0 if rule score >= 7.0)
 */
export const submitPracticeAnswer = async (formData: FormData): Promise<SubmitAnswerResponse> => {
  const response = await httpClient.post<SubmitAnswerResponse>(
    '/mock-interview/practice/answer',
    formData as unknown as Record<string, unknown>,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Return progress for an active practice session
 * GET /api/v1/mock-interview/practice/progress?session_id=
 */
export const getPracticeProgress = async (sessionId: string): Promise<PracticeProgress> => {
  const response = await httpClient.get<PracticeProgress>('/mock-interview/practice/progress', {
    params: { session_id: sessionId },
  });
  return response.data;
};

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

// ==================== FEEDBACK RATING ====================

export interface RateFeedbackRequest {
  answer_id: string;
  helpful: boolean;
  comment?: string;
}

export interface RateFeedbackResponse {
  recorded: boolean;
}

/**
 * Submit thumbs up/down rating on an AI feedback response
 * POST /api/v1/mock-interview/feedback/rate
 */
export const rateAnswerFeedback = async (data: RateFeedbackRequest): Promise<RateFeedbackResponse> => {
  const response = await httpClient.post<RateFeedbackResponse>(
    '/mock-interview/feedback/rate',
    data as unknown as Record<string, unknown>
  );
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

// ==================== TECHNICAL QUESTIONS ====================

export interface TechnicalQuestion {
  question_id: string;
  question_text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  key_points: string[];
  skills_tested: string[];
}

export interface GenerateTechnicalQuestionsRequest {
  skills?: string[];
  experience_level?: 'fresher' | 'mid' | 'senior';
  target_role?: string;
  question_bank_gaps?: string[];
  num_questions?: number; // 1-20, default 9
}

export interface GenerateTechnicalQuestionsResponse {
  questions: TechnicalQuestion[];
}

/**
 * Generate AI-powered technical interview questions
 * POST /api/v1/mock-interview/generate-technical-questions
 * Credit cost: 5 credits (MOCK_INTERVIEW_TECH_Q)
 */
export const generateTechnicalQuestions = async (
  data: GenerateTechnicalQuestionsRequest
): Promise<GenerateTechnicalQuestionsResponse> => {
  const response = await httpClient.post<GenerateTechnicalQuestionsResponse>(
    '/mock-interview/generate-technical-questions',
    data as unknown as Record<string, unknown>
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
  session_type: 'hr' | 'technical' | 'mixed';
  resume_id?: string;
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
}

// ── WS Message types (client → server) ──
export type WsClientMessage =
  | { type: 'audio_chunk'; data: string; sequence: number }
  | { type: 'submit_answer'; text: string }
  | { type: 'end_answer'; text?: string }
  | { type: 'skip_question' }
  | { type: 'end_interview' }
  | { type: 'ping' };

// ── WS Message types (server → client) ──
export type WsServerMessage =
  | { type: 'session_ready'; session_id: string; total_questions: number; estimated_duration_m: number }
  | { type: 'session_resumed'; session_id: string; questions_asked: number; total_questions: number; current_question: string }
  | { type: 'question_audio'; question_number: number; text: string; audio: string | null; time_limit_s: number; is_follow_up?: boolean }
  | { type: 'partial_transcript'; text: string }
  | { type: 'transcript_final'; text: string; is_final: true }
  | { type: 'answer_scored'; question_number: number; score: number; feedback?: string; key_points_hit?: number; key_points_total?: number }
  | { type: 'follow_up'; text: string; audio: string | null }
  | { type: 'question_skipped'; skipped_question_number: number }
  | { type: 'interview_complete'; report_id: string; overall_score: number }
  | { type: 'session_paused'; reason: string; reconnect_token: string | null }
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
