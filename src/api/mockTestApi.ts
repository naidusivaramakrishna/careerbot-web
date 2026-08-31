import { httpClient } from '@/lib/http';
import { CATEGORY_SUBCATEGORIES } from '@/lib/mockTestConstants';
import { getExcludeQuestionIds } from '@/utils/seenQuestionIds';

export interface MockTestCompany {
  id?: string;
  name?: string;
  company_id?: string;
  company_name?: string;
  rating?: number;
  categories?: string[];
  questions?: number;
  total_questions?: number;
  duration?: number;
  total_duration_minutes?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  attempts?: number;
  description?: string;
  config?: Record<string, any>;
  sections?: MockTestSection[];
}

export interface MockTestSection {
  section_id: string;
  section_name: string;
  duration_minutes: number;
  question_count: number;
}

export interface MockTestSession {
  session_id: string;
  company_name: string | null;
  sections: MockTestSection[];
  expires_at: string;
}

export interface ApiQuestion {
  id: string | number;
  text: string;
  options: string[];
}

export const getMockTestCompanies = async (): Promise<MockTestCompany[]> => {
  try {
    const response = await httpClient.get<any>('/mock-test/companies');


    // Handle different response formats
    let companies: MockTestCompany[] = [];

    if (Array.isArray(response.data)) {
      companies = response.data;
    } else if (Array.isArray(response.data?.data)) {
      companies = response.data.data;
    } else if (response.data?.companies && Array.isArray(response.data.companies)) {
      companies = response.data.companies;
    }


    console.log('[getMockTestCompanies] raw:', JSON.stringify(companies, null, 2));
    return companies;
  } catch (err: any) {
    throw err;
  }
};

export const getMockTestCompanyById = async (companyId: string): Promise<any> => {
  try {
    const response = await httpClient.get<any>(`/mock-test/companies/${companyId}`);


    // Handle different response formats
    let companyData: any;

    if (response.data?.data) {
      companyData = response.data.data;
    } else if (response.data?.company) {
      companyData = response.data.company;
    } else {
      companyData = response.data;
    }

    return companyData;
  } catch (err: any) {
    throw err;
  }
};

// The backend has been observed to reject — or silently cap — count > 10
// on /mock-test/generate. Cap here so the request always sends a value
// known to succeed; the runner can chain multiple generate calls if it
// needs more than this per section.
const MAX_QUESTIONS_PER_GENERATE = 10;

// Backend rejects exclude_question_ids with > 50 items
// ("VALIDATION_ERROR: exclude_question_ids cannot exceed 50 items").
// Belt-and-braces cap: keeps stale localStorage contents from older
// versions (which stored up to 800 IDs) from breaking the request.
const MAX_EXCLUDE_IDS = 50;
const limitExcludeIds = (ids: string[]): string[] =>
  ids.length <= MAX_EXCLUDE_IDS ? ids : ids.slice(-MAX_EXCLUDE_IDS);

export interface MockTestApiError {
  /** Human-readable text that is always safe to render directly in the UI. */
  message: string;
  /** True when the request was rejected for lack of credits (HTTP 402). */
  insufficientCredits: boolean;
  creditsRequired?: number;
  creditsRemaining?: number;
}

/**
 * Normalise an error from any /mock-test endpoint into something renderable.
 *
 * The backend wraps every failure as
 *   { success: false, error: { message, error_code, details } }
 * so the old `data.detail ?? data.message ?? data.error` fallback chain fell
 * through to `data.error` — an OBJECT — and rendered as "[object Object]".
 * That turned a plain out-of-credits 402 into what looked like a generation
 * failure, which is why "custom test is not generating" was reported.
 */
export const parseMockTestError = (err: unknown): MockTestApiError => {
  interface ErrorDetails {
    error?: string;
    message?: string;
    credits_required?: number;
    credits_remaining?: number;
  }
  interface ErrorEnvelope {
    message?: string;
    error_code?: string;
    details?: ErrorDetails;
  }
  interface ErrorBody {
    error?: ErrorEnvelope | string;
    detail?: string;
    message?: string;
  }
  const e = err as { response?: { status?: number; data?: ErrorBody }; message?: string };
  const status = e?.response?.status;
  const data   = e?.response?.data;

  // `error` is the structured envelope on most routes, but a bare string on a few.
  const rawError   = data?.error;
  const structured = rawError && typeof rawError === 'object' ? rawError : null;
  const details    = structured?.details;

  const insufficientCredits =
    status === 402 ||
    structured?.error_code === 'HTTP_402' ||
    details?.error === 'INSUFFICIENT_CREDITS';

  const creditsRequired  = typeof details?.credits_required  === 'number' ? details.credits_required  : undefined;
  const creditsRemaining = typeof details?.credits_remaining === 'number' ? details.credits_remaining : undefined;

  if (insufficientCredits) {
    const balance = creditsRequired != null && creditsRemaining != null
      ? ` This test needs ${creditsRequired} credits and you have ${creditsRemaining}.`
      : '';
    return {
      message: `Not enough credits to start this test.${balance}`,
      insufficientCredits: true,
      creditsRequired,
      creditsRemaining,
    };
  }

  // Only ever accept a STRING as the message — anything else is what produced
  // "[object Object]" before.
  const message =
    (typeof details?.message   === 'string' && details.message)   ||
    (typeof structured?.message === 'string' && structured.message) ||
    (typeof rawError            === 'string' && rawError)           ||
    (typeof data?.detail        === 'string' && data.detail)        ||
    (typeof data?.message       === 'string' && data.message)       ||
    e?.message ||
    'Something went wrong. Please try again.';

  return { message, insufficientCredits: false, creditsRequired, creditsRemaining };
};

/** The only difficulty values the backend accepts (mock_test schemas.py: VALID_DIFFICULTIES). */
export type MockTestDifficulty = 'easy' | 'medium' | 'hard';

export const MOCK_TEST_DIFFICULTIES: MockTestDifficulty[] = ['easy', 'medium', 'hard'];

export const isMockTestDifficulty = (v: unknown): v is MockTestDifficulty =>
  typeof v === 'string' && (MOCK_TEST_DIFFICULTIES as string[]).includes(v);

export const generateMockTest = async (
  companyId: string,
  categories: string[] = ['arithmetic'],
  subcategories: string[] = [],
  // Required: the backend rejects a missing/blank difficulty. It used to be
  // hardcoded to 'medium' here, which silently discarded the user's choice.
  difficulty: MockTestDifficulty,
  parentSessionId?: string,
  timeoutMs: number = 60000,
  count: number = 10,
  timeLimit: number = 20,
  // When true, the session is created with negative marking so the backend deducts
  // marks per wrong answer at scoring time. Company tests leave this false.
  negativeMarking: boolean = false,
): Promise<MockTestSession> => {
  const resolvedSubcategories = subcategories.length > 0 ? subcategories : categories;
  // Send the IDs the user has already seen for this company so the backend
  // doesn't re-serve them on a fresh attempt. Scope by companyId so taking
  // TCS doesn't suppress the Infosys pool. See utils/seenQuestionIds.
  // Capped at MAX_EXCLUDE_IDS to satisfy backend validation.
  // Exclude questions seen in this company AND across all companies (global bucket),
  // so the same question is not re-served under a different company.
  const excludeIds = limitExcludeIds(getExcludeQuestionIds(companyId));
  const cappedCount = Math.min(Math.max(1, count), MAX_QUESTIONS_PER_GENERATE);
  if (cappedCount !== count) {
    console.warn(`[generateMockTest] count ${count} exceeds backend limit; sending ${cappedCount}`);
  }
  const payload: Record<string, any> = {
    count: cappedCount,
    time_limit: timeLimit,
    type: 'mcq',
    company_context: companyId,
    category: categories,
    subcategory: resolvedSubcategories,
    difficulty,
    cross_verify: false,
    exclude_question_ids: excludeIds,
  };

  if (negativeMarking) {
    payload.negative_marking = true;
    payload.negative_marks_per_wrong = 1 / 3; // -1/3 per wrong answer
  }

  if (parentSessionId) {
    payload.parent_session_id = parentSessionId;
  }

  console.log('[generateMockTest] sending payload:', JSON.stringify({ ...payload, exclude_question_ids: `<${excludeIds.length} ids>` }, null, 2));

  try {
    const response = await httpClient.post<any>('/mock-test/generate', payload, { timeout: timeoutMs });
    console.log('[generateMockTest] response:', JSON.stringify(response.data, null, 2));
    const session = response.data?.data ?? response.data;
    return session;
  } catch (err: any) {
    const d = err?.response?.data;
    // Log every diagnostic we can extract — previous version only logged
    // fields under err.response, so a network-level failure (no response)
    // produced an empty `{}` and we couldn't tell what broke.
    console.error('[generateMockTest] FAILED', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      response_data: d,
      error_code: d?.error?.error_code,
      error_message: d?.error?.message,
      error_id: d?.error?.error_id,
      request_id: d?.error?.request_id,
      timestamp: d?.error?.timestamp,
      path: d?.error?.path,
      url: err?.config?.url,
      method: err?.config?.method,
      timeout_ms: err?.config?.timeout,
      payload,
    });
    throw err;
  }
};

/**
 * Generate a custom mock-test session for the Custom Builder.
 * The builder calls this as a reachability probe (validates the AI service,
 * then submits the probe session) before navigating to the custom-test runner,
 * which generates each section via generateMockTest under the same parent.
 * Unlike generateMockTest, the caller-selected difficulty is forwarded.
 */
export const generateCustomTest = async (
  categories: string[],
  difficulty: string = 'medium',
  parentSessionId?: string,
  timeoutMs: number = 60000
): Promise<MockTestSession> => {
  const resolvedCategories = categories.length > 0 ? categories : ['arithmetic'];
  // Backend rejects category names as subcategory values — it expects the
  // specific slugs listed in CATEGORY_SUBCATEGORIES. Pick one valid sub per category.
  const resolvedSubcategories = resolvedCategories.map(cat => {
    const subs = CATEGORY_SUBCATEGORIES[cat];
    return subs && subs.length > 0
      ? subs[Math.floor(Math.random() * subs.length)]
      : cat;
  });
  // Same dedup story as generateMockTest, scoped to the synthetic 'custom-test'
  // bucket so custom-builder attempts don't suppress company tests.
  const excludeIds = limitExcludeIds(getExcludeQuestionIds('custom-test'));
  const payload: Record<string, any> = {
    count: 10,
    time_limit: 20,
    type: 'mcq',
    company_context: 'tcs',
    category: resolvedCategories,
    subcategory: resolvedSubcategories,
    difficulty,
    cross_verify: false,
    exclude_question_ids: excludeIds,
  };

  if (parentSessionId) {
    payload.parent_session_id = parentSessionId;
  }

  console.log('[generateCustomTest] sending payload:', JSON.stringify({ ...payload, exclude_question_ids: `<${excludeIds.length} ids>` }, null, 2));

  try {
    const response = await httpClient.post<any>('/mock-test/generate', payload, { timeout: timeoutMs });
    console.log('[generateCustomTest] response:', JSON.stringify(response.data, null, 2));
    const session = response.data?.data ?? response.data;
    return session;
  } catch (err: any) {
    const d = err?.response?.data;
    console.error('[generateCustomTest] FAILED', {
      status: err?.response?.status,
      error_code: d?.error?.error_code,
      message: d?.error?.message,
      error_id: d?.error?.error_id,
      payload,
    });
    throw err;
  }
};

export const getSectionQuestions = async (sessionId: string, sectionId: string): Promise<ApiQuestion[]> => {

  const url = `/mock-test/${sessionId}/section/${sectionId}`;


  try {
    const response = await httpClient.get<any>(url);


    // Extract questions from response
    const questions = response.data?.questions;

    if (!Array.isArray(questions)) {
      return [];
    }

    return questions;
  } catch (err: any) {
    throw err;
  }
};

export interface AnswerFeedback {
  saved: boolean;
  is_correct: boolean;
  score: number;
  accuracy: number;
  completeness: number;
  clarity: number;
  feedback: string;
  explanation: string;
  solution_steps: string[];
  common_mistakes: string[];
  correct_answer: string;
  model_answer: string;
}

export const submitAnswer = async (
  sessionId: string,
  questionId: string | number,
  answer: string,
  timeTakenSeconds: number = 5
): Promise<AnswerFeedback | null> => {
  try {
    const response = await httpClient.post(`/mock-test/${sessionId}/answer`, {
      question_id: questionId,
      user_answer: answer,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data as AnswerFeedback;
  } catch (err: any) {
    throw err;
  }
};

export const submitSection = async (sessionId: string, sectionId: string, answers?: Array<{question_id: string | number, answer: string}>): Promise<void> => {
  try {
    const payload = answers ? { answers: answers.map(a => ({ question_id: a.question_id, user_answer: a.answer })) } : {};
    await httpClient.post(`/mock-test/${sessionId}/section/${sectionId}/submit`, payload);
  } catch (err: any) {
    throw err;
  }
};

export const submitTest = async (sessionId: string): Promise<void> => {
  try {
    await httpClient.post(`/mock-test/${sessionId}/submit`, {});
  } catch (err: any) {
    throw err;
  }
};

/**
 * Submit the whole test. Idempotent server-side — resubmitting a parent returns
 * the existing report — so retrying after a network failure is safe.
 *
 * The explicit timeout matters: the shared client defaults to 120s, and a stalled
 * submit left the user on a "Scoring your test" spinner for two full minutes with
 * no way out, which reads as a dead button. Aggregation is a DB roll-up that
 * normally answers in well under a second.
 */
export const submitParentSession = async (
  parentSessionId: string,
  timeoutMs: number = 45000,
): Promise<void> => {
  await httpClient.post(`/mock-test/parent/${parentSessionId}/submit`, {}, { timeout: timeoutMs });
};

/**
 * Everything needed to locate a failed report in the backend log, carried on the
 * thrown error. Without this a tester's screenshot said only "Unable to Load
 * Results", and the error_id / request_id that pinpoint the failure server-side
 * were discarded at the point of failure.
 */
export interface ResultErrorDiagnostics {
  parentSessionId: string;
  status?: number | 'network';
  errorCode?: string;
  errorId?: string;
  requestId?: string;
  backendMessage?: string;
  attempts: number;
}

export class MockTestResultError extends Error {
  diagnostics: ResultErrorDiagnostics;
  constructor(message: string, diagnostics: ResultErrorDiagnostics) {
    super(message);
    this.name = 'MockTestResultError';
    this.diagnostics = diagnostics;
  }
}

const buildResultDiagnostics = (
  err: unknown,
  parentSessionId: string,
  attempts: number,
): ResultErrorDiagnostics => {
  const e = err as { response?: { status?: number; data?: { error?: Record<string, unknown> } } };
  const backendError = e?.response?.data?.error;
  const structured = backendError && typeof backendError === 'object' ? backendError : undefined;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return {
    parentSessionId,
    status: e?.response?.status ?? 'network',
    errorCode: str(structured?.error_code),
    errorId: str(structured?.error_id),
    requestId: str(structured?.request_id),
    backendMessage: str(structured?.message),
    attempts,
  };
};

/**
 * Fetch results from the /submit endpoint which returns full data with explanations
 */
export const getParentSessionResultFromSubmit = async (parentSessionId: string): Promise<TestResult> => {
  try {
    console.log('[getParentSessionResultFromSubmit] Calling /submit endpoint...');
    const response = await httpClient.get<any>(`/mock-test/parent/${parentSessionId}/submit`);
    console.log('[getParentSessionResultFromSubmit] Response received:', response.data);
    let rawData = response.data?.data || response.data;
    if (rawData?.tests && Array.isArray(rawData.tests)) rawData = rawData.tests[0];
    return mapRawResult(rawData);
  } catch (err: any) {
    console.error('[getParentSessionResultFromSubmit] Failed:', err?.response?.status, err?.message);
    throw err;
  }
};

export const getParentSessionResult = async (parentSessionId: string): Promise<TestResult> => {
  const MAX_ATTEMPTS = 8;
  const POLL_DELAY_MS = 2500;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Try /result endpoint first (has full data with explanations, solution_steps, common_mistakes)
      let response: any;

      try {
        console.log(`[getParentSessionResult] Attempt ${attempt}/${MAX_ATTEMPTS}: Fetching from /result endpoint...`);
        const resultUrl = `/mock-test/parent/${parentSessionId}/result`;
        console.log(`[getParentSessionResult] URL: ${resultUrl}`);

        response = await retryWithBackoff(
          () => httpClient.get<any>(resultUrl),
          3,
          1000
        );

        console.log('[getParentSessionResult] ✓ /result succeeded');
        console.log('[getParentSessionResult] Response data keys:', Object.keys(response.data || {}));

        if (response.data?.questions) {
          console.log(`[getParentSessionResult] ✓ Found ${response.data.questions.length} questions`);
          if (response.data.questions[0]) {
            const q1 = response.data.questions[0];
            console.log('[getParentSessionResult] Q1 raw keys:', Object.keys(q1));
            console.log('[getParentSessionResult] Q1 explanation:', q1.explanation ? q1.explanation.substring(0, 150) + '...' : 'NOT FOUND');
            console.log('[getParentSessionResult] Q1 solution_steps:', q1.solution_steps ? `${q1.solution_steps.length} steps` : 'NOT FOUND');
            console.log('[getParentSessionResult] Q1 common_mistakes:', q1.common_mistakes ? `${q1.common_mistakes.length} mistakes` : 'NOT FOUND');
          }
        } else {
          console.warn('[getParentSessionResult] ⚠️ No questions in /result response');
        }
      } catch (submitErr: any) {
        const status = submitErr?.response?.status;
        const message = submitErr?.message;
        console.error(`[getParentSessionResult] ✗ /result failed: HTTP ${status} - ${message}`);
        console.log('[getParentSessionResult] Retrying /result endpoint...');

        try {
          const resultUrl = `/mock-test/parent/${parentSessionId}/result`;
          console.log(`[getParentSessionResult] URL: ${resultUrl}`);

          response = await retryWithBackoff(
            () => httpClient.get<any>(resultUrl),
            3,
            1000
          );

          console.log('[getParentSessionResult] ✓ /result succeeded');
          console.log('[getParentSessionResult] Response data keys:', Object.keys(response.data || {}));

          if (response.data?.questions && response.data.questions[0]) {
            const q1 = response.data.questions[0];
            console.log('[getParentSessionResult] Q1 explanation:', q1.explanation ? 'YES' : 'NO');
            console.log('[getParentSessionResult] Q1 solution_steps:', q1.solution_steps ? 'YES' : 'NO');
            console.log('[getParentSessionResult] Q1 common_mistakes:', q1.common_mistakes ? 'YES' : 'NO');
          }
        } catch (resultErr: any) {
          console.error(`[getParentSessionResult] ✗ /result also failed: ${resultErr?.message}`);
          throw resultErr;
        }
      }

      let rawData = response.data?.data || response.data;
      if (rawData?.tests && Array.isArray(rawData.tests)) rawData = rawData.tests[0];

      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid response: expected object');
      }

      if ((!rawData.section_scores || rawData.section_scores.length === 0) && attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
        continue;
      }

      if (!rawData.section_scores) rawData.section_scores = [];

      return mapRawResult(rawData);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || 'Unknown error';
      const diagnostics = buildResultDiagnostics(err, parentSessionId, attempt);

      // Prefer the backend's own message — it names the actual cause (e.g.
      // "No sessions found for parent_session_id '…'") instead of our guess.
      let errorMsg = '';
      if (status === 404) {
        errorMsg = diagnostics.backendMessage
          ?? `No report found for this test yet. It may not have been submitted successfully.`;
      } else if (status === 500) {
        errorMsg = diagnostics.backendMessage ?? 'The server failed while building your report.';
      } else {
        errorMsg = diagnostics.backendMessage ?? `Error (${status ?? 'network'}): ${message}`;
      }

      lastError = new MockTestResultError(errorMsg, diagnostics);

      if (status === 404 && attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error(`Failed to fetch results for parent session ${parentSessionId}`);
};

export interface TestResult {
  total_score: number;
  total_questions: number;
  grade: string;
  time_taken?: number;
  time_remaining?: number;
  not_attempted?: number;
  incorrect?: number;
  sections?: {
    name: string;
    score: number;      // correct answer count
    total: number;      // total question count
    marks: number;      // marks scored
    total_marks: number; // total marks available
    accuracy: number;   // score_percent from backend
    correct: number;
    wrong: number;
    skipped: number;
    time?: string;
    difficulty?: string;
  }[];
  questions?: {
    question_id: string;
    question_text: string;
    options: string[];
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
    solution_steps: string[] | null;
    common_mistakes: string[] | null;
    difficulty?: string;
    time_taken_seconds?: number;
  }[];
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
}

// Helper function to retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      const isRateLimited = status === 429;
      const isLastAttempt = attempt === maxRetries - 1;

      if (!isRateLimited || isLastAttempt) {
        throw err; // Re-throw if not rate limited or if it's the last attempt
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

const mapRawResult = (rawData: any): TestResult => {
  const mappedSections = (rawData.section_scores || []).map((s: any) => {
    const correct = s.correct ?? 0;
    const wrong = s.wrong ?? 0;
    const skipped = s.skipped ?? 0;
    // Prefer the backend's explicit question count (`total`); fall back to the sum
    // of the three states. Never fabricate a denominator — the old `|| 10` invented
    // a count for sections with no activity, making the report disagree with itself.
    const questionCount = s.total ?? s.total_questions ?? (correct + wrong + skipped);

    // Marks come from `total_marks` (1 per question). `s.total` is the QUESTION count,
    // not marks — using it as marks (and defaulting to 100) was wrong.
    const totalMarks = s.total_marks ?? questionCount;
    const marksScored = s.marks ?? correct;

    return {
      name: s.section_name || 'Unknown',
      score: correct,
      total: questionCount,
      marks: marksScored,
      total_marks: totalMarks,
      accuracy: s.score_percent ?? (questionCount > 0 ? Math.round((correct / questionCount) * 100) : 0),
      correct,
      wrong,
      skipped,
      time: s.time_taken_minutes != null ? `${s.time_taken_minutes} min` : s.time_spent,
      difficulty: s.difficulty || undefined,
    };
  });

  const totalCorrect = mappedSections.reduce((sum: number, s: any) => sum + s.score, 0);
  const totalQuestions = mappedSections.reduce((sum: number, s: any) => sum + s.total, 0);

  // Use question counts when sections are available (even if totalCorrect = 0 — all skipped is a valid score of 0).
  // Only fall back to backend marks when section_scores are completely absent.
  const scoreForDisplay = totalQuestions > 0 ? totalCorrect : (rawData.overall_score ?? rawData.overall_marks ?? 0);
  const questionsForDisplay = totalQuestions > 0 ? totalQuestions : (rawData.total_marks ?? 100);

  // Map per-question review data
  const mappedQuestions = Array.isArray(rawData.questions)
    ? rawData.questions.map((q: any, idx: number) => {
        // Capture all explanation-related fields from backend
        const explanation = q.explanation ?? q.detail ?? '';
        const solutionSteps = Array.isArray(q.solution_steps) ? q.solution_steps :
                             Array.isArray(q.steps) ? q.steps : null;
        const commonMistakes = Array.isArray(q.common_mistakes) ? q.common_mistakes :
                              Array.isArray(q.mistakes) ? q.mistakes : null;

        const mapped = {
          question_id: q.question_id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : [],
          user_answer: q.user_answer ?? '',
          correct_answer: q.correct_answer ?? '',
          is_correct: q.is_correct ?? false,
          explanation: explanation,
          solution_steps: solutionSteps,
          common_mistakes: commonMistakes,
          difficulty: q.difficulty,
          time_taken_seconds: q.time_taken_seconds,
        };

        // Detailed logging for all questions
        if (idx < 3) {
          console.log(`[getParentSessionResult] Q${idx + 1} raw backend data:`, {
            raw_q_keys: Object.keys(q),
            explanation: q.explanation,
            solution_steps: q.solution_steps,
            common_mistakes: q.common_mistakes,
            mapped_explanation: mapped.explanation,
            mapped_solution_steps: mapped.solution_steps,
            mapped_common_mistakes: mapped.common_mistakes,
          });
        }

        return mapped;
      })
    : [];

  // Derive strengths/improvements from section data when the backend
  // doesn't return them (it never does — these fields are always absent).
  const derivedStrengths = mappedSections
    .filter((s: any) => s.accuracy >= 70)
    .map((s: any) => `${s.name}: ${s.accuracy}% accuracy`);

  const derivedImprovements = mappedSections
    .filter((s: any) => s.accuracy < 60)
    .map((s: any) => `${s.name}: ${s.accuracy}% accuracy — needs more practice`);

  return {
    total_score: scoreForDisplay,
    total_questions: questionsForDisplay,
    grade: calculateGrade(scoreForDisplay, questionsForDisplay),
    time_taken: rawData.time_taken,
    time_remaining: rawData.time_remaining,
    not_attempted: rawData.not_attempted ?? 0,
    incorrect: rawData.incorrect ?? 0,
    sections: mappedSections,
    questions: mappedQuestions,
    strengths: rawData.strengths?.length ? rawData.strengths : derivedStrengths,
    improvements: rawData.weaknesses?.length ? rawData.weaknesses : derivedImprovements,
    recommendations: rawData.recommendations || [],
  };
};

export const getTestResult = async (sessionId: string): Promise<TestResult> => {
  const MAX_ATTEMPTS = 8;
  const POLL_DELAY_MS = 2500;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await retryWithBackoff(
        () => httpClient.get<any>(`/mock-test/${sessionId}/result`),
        3,
        1000
      );

      let rawData = response.data?.data || response.data;
      if (rawData?.tests && Array.isArray(rawData.tests)) rawData = rawData.tests[0];

      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid response: expected object');
      }

      // If section_scores is empty and we have retries left, wait and try again.
      if ((!rawData.section_scores || rawData.section_scores.length === 0) && attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
        continue;
      }

      if (!rawData.section_scores || rawData.section_scores.length === 0) {
        rawData.section_scores = [];
      }

      return mapRawResult(rawData);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || 'Unknown error';

      let errorMsg = '';
      if (status === 404) {
        errorMsg = `404: Results not found for session ${sessionId}. Results may still be processing.`;
      } else if (status === 500) {
        errorMsg = 'Server error while fetching results.';
      } else if (status === 400) {
        errorMsg = 'Invalid request. Session ID may be malformed.';
      } else {
        errorMsg = `Error (${status ?? 'network'}): ${message}`;
      }

      lastError = new Error(errorMsg);

      // Retry on 404 — backend may still be computing
      if (status === 404 && attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error(`Failed to fetch results for session ${sessionId}`);
};

// Helper function to calculate grade based on score
function calculateGrade(score: number, total: number): string {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

export const reportIssue = async (sessionId: string, questionId: string | number, description: string, issueType: string = 'other'): Promise<void> => {
  try {
    await httpClient.post(`/mock-test/${sessionId}/report-issue`, {
      question_id: questionId,
      issue_type: issueType,
      description,
    });
  } catch (err: any) {
    throw err;
  }
};

// ─── Video (proctoring) evaluation ───────────────────────────────────────────

/** Mirrors VideoEvaluationResponse in mock_test_service/schemas.py. */
export interface VideoEvaluation {
  evaluation_id: string;
  session_id: string;
  filename?: string | null;
  duration_seconds: number;
  /** AI payload, passed through unchanged so new fields arrive without a release. */
  result: Record<string, unknown>;
  created_at?: string | null;
}

/** Matches MOCK_TEST_VIDEO_MAX_BYTES on the backend (default 1 GB). */
export const MOCK_TEST_VIDEO_MAX_BYTES = 1024 * 1024 * 1024;

/** Matches VIDEO_ACCEPTED_FORMATS in mock_interview_service/constants.py. */
export const MOCK_TEST_VIDEO_EXTENSIONS = [
  '.mp4', '.mov', '.webm', '.avi', '.mkv', '.mpeg', '.mpg', '.wmv', '.m4v', '.flv',
];

/**
 * Reject locally what the backend would reject anyway, so an 80-minute recording
 * isn't uploaded just to come back 413. Returns null when the file is acceptable.
 */
export const validateAttemptVideo = (blob: Blob, filename: string): string | null => {
  if (!blob.size) return 'The recording is empty.';
  if (blob.size > MOCK_TEST_VIDEO_MAX_BYTES) {
    const mb = (blob.size / (1024 * 1024)).toFixed(0);
    const limit = (MOCK_TEST_VIDEO_MAX_BYTES / (1024 * 1024)).toFixed(0);
    return `Recording is ${mb} MB — the limit is ${limit} MB.`;
  }
  const dot = filename.lastIndexOf('.');
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  if (!MOCK_TEST_VIDEO_EXTENSIONS.includes(ext)) {
    return `Unsupported video format ${ext || 'unknown'}. Accepted: ${MOCK_TEST_VIDEO_EXTENSIONS.join(', ')}.`;
  }
  return null;
};

/**
 * POST /mock-test/{session_id}/video-evaluation (multipart).
 *
 * `sessionId` may be a child section session OR the parent_session_id — the
 * backend resolves either (see evaluate_video), so the runner can pass the same
 * parent id it already uses for submit and results.
 */
export const uploadSessionVideo = async (
  sessionId: string,
  video: Blob,
  filename: string = 'attempt.webm',
  options: { onProgress?: (percent: number) => void; timeoutMs?: number } = {},
): Promise<VideoEvaluation> => {
  const localError = validateAttemptVideo(video, filename);
  if (localError) throw new Error(localError);

  // Strip the codecs parameter: MediaRecorder produces "video/webm;codecs=vp9",
  // and the AI evaluator matches on the bare container type.
  const cleanType = (video.type || 'video/webm').split(';')[0];
  const cleanBlob = video.type === cleanType ? video : new Blob([video], { type: cleanType });

  const formData = new FormData();
  formData.append('file', cleanBlob, filename);

  try {
    const response = await httpClient.post<VideoEvaluation>(
      `/mock-test/${sessionId}/video-evaluation`,
      formData,
      {
        // Let the browser set the multipart boundary.
        headers: { 'Content-Type': undefined },
        // A long recording is a large upload — the shared 120s default would abort it.
        timeout: options.timeoutMs ?? 15 * 60 * 1000,
        onUploadProgress: options.onProgress
          ? (e) => {
              if (!e.total) return;
              options.onProgress!(Math.min(100, Math.round((e.loaded / e.total) * 100)));
            }
          : undefined,
      },
    );
    return (response.data as { data?: VideoEvaluation })?.data ?? response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const message = (error as { message?: string })?.message || 'Video upload failed';

    if (status === 500) {
      throw new Error('The video evaluation service is currently unavailable. Please try again in a moment.');
    }
    if (status === 413) {
      throw new Error('Video file is too large. Maximum size is 1 GB.');
    }
    if (status === 408 || status === 504) {
      throw new Error('Video upload timed out. Please try with a shorter recording or better internet connection.');
    }
    throw error;
  }
};

/** GET the stored evaluation. Returns null when none exists (404) rather than throwing. */
export const getSessionVideoEvaluation = async (sessionId: string): Promise<VideoEvaluation | null> => {
  try {
    const response = await httpClient.get<VideoEvaluation>(`/mock-test/${sessionId}/video-evaluation`);
    return (response.data as { data?: VideoEvaluation })?.data ?? response.data;
  } catch (err: unknown) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
};

export interface ActiveSession {
  session_id: string;
  company_id: string;
  sections: MockTestSection[];
  status: string;
}

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const response = await httpClient.get<{ data: ActiveSession | null }>('/mock-test/active-session');
    const activeSession = response.data.data;

    if (activeSession) {
    } else {
    }
    return activeSession;
  } catch (err: any) {
    return null;
  }
};

export interface HistoryRecord {
  session_id: string;
  company_id?: string;
  company_name: string;
  score: number;
  total: number;
  accuracy: number;
  grade: string;
  submitted_at: string;
}

export const getMockTestHistory = async (): Promise<HistoryRecord[]> => {
  try {
    // Fetch all history records (limit=100 to get all tests, default is 20)
    const response = await httpClient.get<any>('/mock-test/history?limit=50');

    console.log('[getMockTestHistory] raw response:', JSON.stringify(response.data, null, 2));
    // Backend returns { tests: [...], page, limit, total }
    let history = response.data?.tests || response.data?.data || (Array.isArray(response.data) ? response.data : []);


    // Map backend response to HistoryRecord format
    if (Array.isArray(history)) {
      const mapped = history.map((record: any) => {
        // overall_marks = raw correct answers, overall_score = percentage, total_marks = total questions
        const score = record.score ?? record.overall_marks ?? Math.round(record.overall_score || 0);
        const total = record.total ?? record.total_marks ?? record.question_count ?? 100;
        const accuracy = record.accuracy !== undefined
          ? (typeof record.accuracy === 'number' ? record.accuracy : parseInt(record.accuracy) || 0)
          : record.overall_score !== undefined
            ? Math.round(record.overall_score)
            : (total > 0 ? Math.round((score / total) * 100) : 0);

        let grade = record.grade || 'F';
        if (!record.grade) {
          if (accuracy >= 90) grade = 'A';
          else if (accuracy >= 80) grade = 'B';
          else if (accuracy >= 70) grade = 'C';
          else if (accuracy >= 60) grade = 'D';
        }

        return {
          session_id: record.session_id,
          company_id: record.company_id,
          company_name: record.company_name || record.company_id?.charAt(0).toUpperCase() + record.company_id?.slice(1) || 'Unknown',
          score: score,
          total: total,
          accuracy: accuracy,
          grade: grade,
          submitted_at: record.submitted_at || record.created_at,
        } as HistoryRecord;
      });


      return mapped;
    }

    return [];
  } catch (err: any) {
    throw err;
  }
};

export interface SessionMetadata {
  session_id: string;
  company_id: string;
  company_name?: string;
  status: string;
  sections: MockTestSection[];
  created_at?: string;
  expires_at?: string;
  total_duration_minutes?: number;
  questions_attempted?: number;
  current_section_index?: number;
  progress?: number;
}


export const getSessionById = async (sessionId: string): Promise<SessionMetadata> => {
  try {
    const response = await httpClient.get<{ data: SessionMetadata }>(`/mock-test/${sessionId}`);

    const sessionData = response.data.data || response.data;


    return sessionData;
  } catch (err: any) {
    throw err;
  }
};

export interface ProgressAnalytics {
  total_tests: number;
  average_score: number;
  average_accuracy?: number; // Optional - calculated if not provided
  best_score: number;
  latest_score?: number;
  improvement?: number;
  overall_grade?: string; // Optional - calculated from average_score
  improvement_trend?: 'improving' | 'declining' | 'stable'; // Optional - calculated from improvement
}

export const getProgressAnalytics = async (): Promise<ProgressAnalytics> => {
  try {
    const response = await httpClient.get<any>('/mock-test/analytics/progress');

    console.log('[getProgressAnalytics] raw response:', JSON.stringify(response.data, null, 2));

    let analyticsData: ProgressAnalytics | null = null;

    // Normalise: unwrap common envelope shapes
    // Possible shapes: { summary: {...} }, { data: { summary: {...} } },
    //                  { data: [...], summary: {...} }, or flat object
    const raw: Record<string, any> =
      response.data?.summary && typeof response.data.summary === 'object' && !Array.isArray(response.data.summary)
        ? response.data.summary
        : response.data?.data?.summary && typeof response.data.data.summary === 'object'
          ? response.data.data.summary
          : response.data?.total_tests !== undefined
            ? response.data
            : typeof response.data === 'object' && response.data !== null
              ? response.data
              : null;

    if (!raw) {
      throw new Error('Invalid response: missing analytics data');
    }

    // average_score  — raw marks (e.g. 28 out of 40)
    const average_score: number =
      typeof raw.average_score === 'number' ? raw.average_score :
      typeof raw.avg_score     === 'number' ? raw.avg_score     : 0;

    // average_accuracy — percentage (0-100).
    // Backend may return it directly; if not, derive from average_score
    // (treat scores ≤ 1 as already a fraction, >1 as raw marks out of ~40 questions)
    let average_accuracy: number | undefined =
      typeof raw.average_accuracy === 'number' ? raw.average_accuracy :
      typeof raw.avg_accuracy     === 'number' ? raw.avg_accuracy     :
      undefined;

    if (average_accuracy === undefined && average_score > 0) {
      // If the score looks like a percentage (0-100) keep it; otherwise assume raw/40
      average_accuracy = average_score > 1 && average_score <= 100
        ? average_score          // backend already sent percentage in average_score
        : Math.round((average_score / 40) * 100);
    }

    const best_score: number =
      typeof raw.best_score  === 'number' ? raw.best_score  :
      typeof raw.highest_score === 'number' ? raw.highest_score : 0;

    const total_tests = raw.total_tests ?? raw.tests_taken ?? 0;

    // If the backend has nothing real for this user — no tests taken AND no
    // score AND no best — refuse to synthesize a fake "Grade F / Stable"
    // payload. Throw so the page's .catch hides the card entirely.
    if (total_tests === 0 && average_score === 0 && best_score === 0 && average_accuracy === undefined) {
      throw new Error('No analytics data yet — user has no completed tests');
    }

    // Grade based on accuracy percentage. Only computed when we have at least
    // one real numeric signal above; otherwise we'd have thrown.
    const pct = average_accuracy ?? (average_score > 0 ? average_score : 0);
    let overall_grade = 'F';
    if (pct >= 90) overall_grade = 'A';
    else if (pct >= 80) overall_grade = 'B';
    else if (pct >= 70) overall_grade = 'C';
    else if (pct >= 60) overall_grade = 'D';

    // Trend
    let improvement_trend: 'improving' | 'declining' | 'stable' = 'stable';
    const imp = raw.improvement ?? raw.score_improvement ?? raw.trend;
    if (typeof imp === 'number') {
      if (imp > 5) improvement_trend = 'improving';
      else if (imp < -5) improvement_trend = 'declining';
    } else if (typeof imp === 'string') {
      if (imp === 'improving') improvement_trend = 'improving';
      else if (imp === 'declining') improvement_trend = 'declining';
    }

    analyticsData = {
      total_tests,
      average_score,
      average_accuracy,
      best_score,
      latest_score:      raw.latest_score ?? raw.last_score,
      improvement:       typeof imp === 'number' ? imp : undefined,
      overall_grade,
      improvement_trend,
    };

    console.log('[getProgressAnalytics] mapped:', analyticsData);
    return analyticsData;
  } catch (err: any) {
    throw err;
  }
};

export interface WeakArea {
  topic: string;
  accuracy: number;
  suggestion: string;
}

export interface WeakAreasAnalytics {
  weak_areas: WeakArea[];
  recommendations: string[];
}

export const getWeakAreasAnalytics = async (): Promise<WeakAreasAnalytics> => {
  try {
    const response = await httpClient.get<any>('/mock-test/analytics/weak-areas');
    console.log('[getWeakAreasAnalytics] raw:', JSON.stringify(response.data, null, 2));


    let analyticsData: WeakAreasAnalytics | null = null;

    // Pick the best accuracy value from an item regardless of exact field name.
    // Backend may send 0–1 decimal (e.g. 0.10) or 0–100 percentage (e.g. 10).
    // Read the score from the field the backend actually sends (`score_percent`,
    // already 0-100 and rounded to 1dp), with narrow fallbacks for older shapes.
    //
    // This replaces a scan that fell back to "any non-zero numeric field" — which
    // would happily report an attempts count or a question total as if it were an
    // accuracy percentage. Nothing here guesses: an unrecognised payload reads 0
    // rather than inventing a number.
    const extractAccuracy = (item: any): number => {
      const candidates = [item?.score_percent, item?.accuracy, item?.accuracy_percentage, item?.score];
      const raw = candidates.find(v => typeof v === 'number' && !isNaN(v));
      if (typeof raw !== 'number') return 0;
      // Some older payloads express accuracy as a 0-1 fraction. Only treat a value
      // as a fraction when it is strictly below 1 — 1 itself is far more likely to
      // mean "1%" on a weak-area row than "100%".
      return Math.round(raw > 0 && raw < 1 ? raw * 100 : raw);
    };

    const isWeakItem = (item: any): boolean => {
      const acc = extractAccuracy(item);
      return item.is_weak === true || (item.is_weak !== false && acc < 70);
    };

    // Score-tiered suggestion. Used when the backend doesn't return a
    // per-topic suggestion, or when it returns the same boilerplate for
    // every row. Each band has distinct phrasing so the user gets actionable
    // advice that varies with how weak the topic actually is.
    const suggestionFor = (topic: string, accuracy: number, attempts: number): string => {
      const t = topic || 'this topic';
      const attemptsTail = attempts > 0
        ? ` (based on ${attempts} attempt${attempts === 1 ? '' : 's'})`
        : '';
      if (accuracy < 30) {
        return `Critical gap in ${t} — restart from the fundamentals before attempting more questions${attemptsTail}.`;
      }
      if (accuracy < 45) {
        return `Major weakness in ${t} — block out 30–45 min daily on core concepts and worked examples${attemptsTail}.`;
      }
      if (accuracy < 55) {
        return `${t} needs focused practice — aim for 10 fresh problems a day and review every mistake${attemptsTail}.`;
      }
      if (accuracy < 65) {
        return `${t} is below the cutoff — drill the patterns you keep missing and time yourself${attemptsTail}.`;
      }
      if (accuracy < 75) {
        return `Close to passing on ${t} — tighten accuracy on the trickier sub-types and try mixed sets${attemptsTail}.`;
      }
      if (accuracy < 85) {
        return `${t} is solid — polish the harder questions and work on speed${attemptsTail}.`;
      }
      return `Strong on ${t} — keep momentum with a weekly refresher set${attemptsTail}.`;
    };

    // Humanise a backend slug ("time_and_work") into a label ("Time And Work").
    // Only used as a last resort — the backend normally sends a real `section` name.
    const humanise = (s: string): string =>
      s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

    const toWeakArea = (item: any): WeakArea => {
      // The backend emits TWO kinds of row: a section-level one (subcategory null)
      // whose score is the section's accuracy, and per-subcategory rows scored on
      // that topic alone. Labelling both with just the section name made a topic's
      // score read as the section's score — the reported wrong accuracy.
      // Section rows keep the plain section name; subcategory rows are qualified
      // with the topic, so each number is labelled with what it measures.
      const sectionName = humanise(String(
        item.section ?? item.section_id ?? item.topic ?? item.category ?? item.name ?? 'Unknown'
      ));
      const subcategory = typeof item.subcategory === 'string' ? item.subcategory.trim() : '';
      const topic = subcategory
        ? `${sectionName} · ${humanise(subcategory)}`
        : sectionName;
      const accuracy = extractAccuracy(item);
      const attempts: number = item.attempts ?? item.total_attempts ?? item.count ?? 0;

      // Always compute the suggestion locally from the score band. The
      // backend's suggestion field has been observed to return the same
      // boilerplate text ("Need urgent improvement", "Work on …", etc.) for
      // every row regardless of accuracy, which defeats the purpose. Local
      // tiering guarantees each row reads differently.
      const suggestion = suggestionFor(topic, accuracy, attempts);

      return { topic, accuracy, suggestion };
    };

    const buildResult = (items: any[], backendRecs: unknown): WeakAreasAnalytics => {
      let weakItems = items.filter(isWeakItem);
      if (weakItems.length === 0) weakItems = items; // show all if nothing flagged

      // Section and subcategory rows are now labelled distinctly, so they are no
      // longer duplicates to be collapsed. Collapsing them by section and keeping
      // the LOWEST score is what displayed a subcategory's accuracy under the
      // section's name. Dedupe only on the final label, which can still repeat if
      // the backend sends the same row twice.
      const byLabel = new Map<string, WeakArea>();
      for (const area of weakItems.map(toWeakArea)) {
        if (!byLabel.has(area.topic)) byLabel.set(area.topic, area);
      }
      const weakAreas = [...byLabel.values()].sort((a, b) => a.accuracy - b.accuracy);
      // Only forward recommendations that the backend actually sent. Removed
      // the previous "Focus on: X, Y, Z" / "Practice weak areas regularly"
      // fabrications — those were frontend boilerplate that looked like real
      // backend advice. If the backend has nothing to say, render nothing.
      const recommendations: string[] = Array.isArray(backendRecs)
        ? backendRecs.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
        : [];
      return { weak_areas: weakAreas, recommendations };
    };

    // Map backend response format to frontend WeakAreasAnalytics format
    const backendRecs = response.data?.recommendations;
    if (response.data?.data && Array.isArray(response.data.data)) {
      analyticsData = buildResult(response.data.data, backendRecs);
    } else if (response.data?.weak_areas && Array.isArray(response.data.weak_areas)) {
      // Don't pass through raw — normalise accuracy values
      analyticsData = buildResult(response.data.weak_areas, backendRecs);
    } else if (Array.isArray(response.data)) {
      analyticsData = buildResult(response.data, backendRecs);
    }

    if (!analyticsData) {
      throw new Error('Invalid response: missing weak areas data');
    }


    return analyticsData;
  } catch (err: any) {
    throw err;
  }
};

export interface LeaderboardEntry {
  rank: number;
  user_id?: string;
  /** May be undefined when the backend sends no name for the entry. */
  name?: string;
  is_current_user?: boolean;
  score?: number;
  accuracy?: number;
  tests_completed?: number;
  last_test_date?: string;
  badge?: string;
}

export interface Leaderboard {
  period: string;
  total_participants: number;
  your_rank?: number;
  your_score?: number;
  entries: LeaderboardEntry[];
}

export const getLeaderboard = async (): Promise<Leaderboard> => {
  try {
    const response = await httpClient.get<any>('/mock-test/analytics/leaderboard');
    console.log('[getLeaderboard] raw:', JSON.stringify(response.data, null, 2));


    let leaderboardData: Leaderboard | null = null;

    const raw = response.data;

    // Handle flat response: { total_users, rank, top_10, ... }
    if (raw && typeof raw === 'object') {
      const list: any[] = Array.isArray(raw.top_10) ? raw.top_10
        : Array.isArray(raw.data) ? raw.data
        : Array.isArray(raw.entries) ? raw.entries
        : [];

      // Carry the entry through even when the backend sends no name — an older
      // backend omits the name field entirely, and dropping those entries left
      // the leaderboard with a single row. `is_current_user` is preserved so the
      // UI can label the caller's own row with their real username rather than
      // the placeholder string "You".
      const entries: LeaderboardEntry[] = list
        .map((item: any, idx: number): LeaderboardEntry => {
          const realName: string | undefined =
            item.display_name ?? item.username ?? item.name ?? item.user_name;

          const rawAcc = item.accuracy ?? item.accuracy_pct ?? item.accuracy_percentage;
          const rawTests = item.tests_completed ?? item.total_tests ?? item.tests;
          return {
            rank: item.rank ?? idx + 1,
            name: realName,
            is_current_user: !!item.is_current_user,
            score: (item.score ?? item.total_score ?? item.avg_score) != null
              ? Math.round((item.score ?? item.total_score ?? item.avg_score) * 10) / 10
              : undefined,
            accuracy: rawAcc != null ? Math.round(rawAcc) : undefined,
            tests_completed: rawTests != null ? rawTests : undefined,
            last_test_date: item.last_test_date ?? item.date ?? item.last_attempt,
            badge: item.badge ?? undefined,
          };
        });

      leaderboardData = {
        period: raw.period || 'All Time',
        total_participants: raw.total_participants ?? raw.total_users ?? raw.total_attempts ?? entries.length,
        your_rank: raw.your_rank ?? raw.rank,
        your_score: (raw.your_score ?? raw.your_avg_score ?? raw.avg_score) != null
          ? Math.round((raw.your_score ?? raw.your_avg_score ?? raw.avg_score) * 10) / 10
          : undefined,
        entries,
      };
    }

    if (!leaderboardData) {
      throw new Error('Invalid response: missing leaderboard data');
    }


    return leaderboardData;
  } catch (err: any) {
    throw err;
  }
};

export interface QuestionExplanationRequest {
  question_text: string;
  options: string[];
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
}

export interface QuestionExplanationResponse {
  explanation: string;
  solution_steps: string[];
  common_mistakes: string[];
}


export const generateQuestionExplanation = async (
  request: QuestionExplanationRequest
): Promise<QuestionExplanationResponse> => {
  try {
    const prompt = `Briefly explain why "${request.correct_answer}" is correct.

Q: ${request.question_text}

Options: ${request.options.join(', ')}

Why correct: ${request.correct_answer}
${request.user_answer ? `Student chose: ${request.user_answer}` : 'Not answered'}

Explain: Why this is right and others are wrong.`;

    const aiResponse = await httpClient.post<{ content?: string; description?: string; summary?: string }>(
      '/ai/generate-description',
      { type: 'summary', prompt }
    );

    const explanation = aiResponse.data?.summary || aiResponse.data?.description || aiResponse.data?.content || '';

    return {
      explanation: explanation || '',
      solution_steps: [],
      common_mistakes: [],
    };
  } catch (err: any) {
    console.log('[generateQuestionExplanation] AI unavailable, using fallback');
    // Return fallback explanation instead of throwing
    return {
      explanation: '',
      solution_steps: [],
      common_mistakes: [],
    };
  }
};
