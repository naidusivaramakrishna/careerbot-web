import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

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

// ── English Essentials ─────────────────────────────────────────────────────────

export interface EnglishEssentials {
  phrases: string[];
  filler_replacements: Record<string, string>;
  common_mistakes: { wrong: string; correct: string }[];
  phrasal_verbs: { verb: string; meaning: string }[];
}

// ==================== API FUNCTIONS ====================

/**
 * Generate AI-powered interview prep notes from user's resume
 * POST /api/v1/interview-prep/generate-notes
 * Credit cost: 10 credits
 */
export const generateNotes = async (data: GenerateNotesRequest): Promise<GenerateNotesResponse> => {
  try {
    logger.debug('📝 Generating interview prep notes', data);
    const response = await httpClient.post<GenerateNotesResponse>(
      '/interview-prep/generate-notes',
      data as unknown as Record<string, unknown>,
      { timeout: 180_000 } // 3 min — AI generation takes longer than the default 30s
    );
    logger.info('✅ Notes generated successfully');
    return response.data;
  } catch (error) {
    logger.error('❌ Error generating notes:', error);
    throw error;
  }
};

/**
 * Fetch stored interview prep notes for a resume
 * GET /api/v1/interview-prep/notes/{resume_id}
 */
export const getNotes = async (resumeId: string): Promise<NotesRecord> => {
  const response = await httpClient.get<NotesRecord>(`/interview-prep/notes/${resumeId}`);
  return response.data;
};

/**
 * Partially update interview prep notes (user edits)
 * PUT /api/v1/interview-prep/notes/{resume_id}
 *
 * As of the interview-prep move, PUT is resume-scoped — symmetric with GET
 * above. (Previously this endpoint was user-scoped; that asymmetry is gone.)
 */
export const updateNotes = async (
  resumeId: string,
  notes: Record<string, unknown>
): Promise<UpdateNotesResponse> => {
  const response = await httpClient.put<UpdateNotesResponse>(
    `/interview-prep/notes/${resumeId}`,
    { notes } as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Return interview English phrases and filler replacements
 * GET /api/v1/interview-prep/english-essentials (public)
 */
export const getEnglishEssentials = async (): Promise<EnglishEssentials> => {
  const response = await httpClient.get<EnglishEssentials>('/interview-prep/english-essentials');
  return response.data;
};

/**
 * Start a new practice round with questions
 * POST /api/v1/interview-prep/practice/start
 */
export const startPractice = async (data: StartPracticeRequest): Promise<StartPracticeResponse> => {
  const response = await httpClient.post<StartPracticeResponse>(
    '/interview-prep/practice/start',
    data as unknown as Record<string, unknown>
  );
  return response.data;
};

/**
 * Submit a recorded audio answer for AI scoring
 * POST /api/v1/interview-prep/practice/answer  (multipart/form-data)
 * Credit cost: 5 credits (only if LLM is called; 0 if rule score >= 7.0)
 */
export const submitPracticeAnswer = async (formData: FormData): Promise<SubmitAnswerResponse> => {
  const response = await httpClient.post<SubmitAnswerResponse>(
    '/interview-prep/practice/answer',
    formData as unknown as Record<string, unknown>,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Return progress for an active practice session
 * GET /api/v1/interview-prep/practice/progress?session_id=
 */
export const getPracticeProgress = async (sessionId: string): Promise<PracticeProgress> => {
  const response = await httpClient.get<PracticeProgress>('/interview-prep/practice/progress', {
    params: { session_id: sessionId },
  });
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
 * POST /api/v1/interview-prep/generate-technical-questions
 * Credit cost: 5 credits (MOCK_INTERVIEW_TECH_Q)
 */
export const generateTechnicalQuestions = async (
  data: GenerateTechnicalQuestionsRequest
): Promise<GenerateTechnicalQuestionsResponse> => {
  const response = await httpClient.post<GenerateTechnicalQuestionsResponse>(
    '/interview-prep/generate-technical-questions',
    data as unknown as Record<string, unknown>
  );
  return response.data;
};

// ==================== HR QUESTIONS ====================

export interface HrQuestion {
  id: string;
  text: string;
  category: string;
  key_points: string[];
  time_limit_s: number;
}

export interface GenerateHrQuestionsResponse {
  session_id: string;
  questions: HrQuestion[];
  round_number: number;
}

/**
 * Generate HR interview questions
 * POST /api/v1/interview-prep/generate-hr-questions
 */
export const generateHrQuestions = async (
  numQuestions = 10
): Promise<GenerateHrQuestionsResponse> => {
  const response = await httpClient.post<GenerateHrQuestionsResponse>(
    '/interview-prep/generate-hr-questions',
    { num_questions: numQuestions } as unknown as Record<string, unknown>
  );
  return response.data;
};

// ==================== MR / TR QUESTIONS ====================

export interface MrTrQuestion {
  id: string;
  text: string;
  category: string;
  key_points: string[];
  time_limit_s: number;
}

export interface GenerateMrTrQuestionsRequest {
  mode: 'TR' | 'MR';
  num_questions?: number;
  resume_id?: string;
  target_role?: string;
  experience_level?: string;
  difficulty?: string;
  years_experience?: number;
  industry?: string;
  focus_areas?: string[];
  question_bank_gaps?: string[];
}

export interface GenerateMrTrQuestionsResponse {
  session_id: string;
  questions: MrTrQuestion[];
  round_number: number;
}

/**
 * Generate Technical Role (TR) or Managerial Role (MR) interview questions
 * POST /api/v1/interview-prep/generate-mr-tr-questions
 */
export const generateMrTrQuestions = async (
  data: GenerateMrTrQuestionsRequest
): Promise<GenerateMrTrQuestionsResponse> => {
  const response = await httpClient.post<GenerateMrTrQuestionsResponse>(
    '/interview-prep/generate-mr-tr-questions',
    data as unknown as Record<string, unknown>
  );
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
 * POST /api/v1/interview-prep/feedback/rate
 */
export const rateAnswerFeedback = async (data: RateFeedbackRequest): Promise<RateFeedbackResponse> => {
  const response = await httpClient.post<RateFeedbackResponse>(
    '/interview-prep/feedback/rate',
    data as unknown as Record<string, unknown>
  );
  return response.data;
};
