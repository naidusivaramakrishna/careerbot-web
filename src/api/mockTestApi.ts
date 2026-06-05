import { httpClient } from '@/lib/http';
import { CATEGORY_SUBCATEGORIES } from '@/lib/mockTestConstants';
import { getSeenQuestionIds } from '@/utils/seenQuestionIds';

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

export const generateMockTest = async (
  companyId: string,
  categories: string[] = ['arithmetic'],
  subcategories: string[] = [],
  parentSessionId?: string,
  timeoutMs: number = 60000,
  count: number = 10,
  timeLimit: number = 20,
): Promise<MockTestSession> => {
  const resolvedSubcategories = subcategories.length > 0 ? subcategories : categories;
  // Send the IDs the user has already seen for this company so the backend
  // doesn't re-serve them on a fresh attempt. Scope by companyId so taking
  // TCS doesn't suppress the Infosys pool. See utils/seenQuestionIds.
  // Capped at MAX_EXCLUDE_IDS to satisfy backend validation.
  const excludeIds = limitExcludeIds(getSeenQuestionIds(companyId));
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
    difficulty: 'medium',
    cross_verify: false,
    exclude_question_ids: excludeIds,
  };

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
  const excludeIds = limitExcludeIds(getSeenQuestionIds('custom-test'));
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

export const submitParentSession = async (parentSessionId: string): Promise<void> => {
  try {
    await httpClient.post(`/mock-test/parent/${parentSessionId}/submit`, {});
  } catch (err: any) {
    throw err;
  }
};

export const getParentSessionResult = async (parentSessionId: string): Promise<TestResult> => {
  const MAX_ATTEMPTS = 8;
  const POLL_DELAY_MS = 2500;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await retryWithBackoff(
        () => httpClient.get<any>(`/mock-test/parent/${parentSessionId}/result`),
        3,
        1000
      );

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

      let errorMsg = '';
      if (status === 404) errorMsg = `Results not found for parent session ${parentSessionId}. Still processing.`;
      else if (status === 500) errorMsg = 'Server error while fetching results.';
      else errorMsg = `Error (${status ?? 'network'}): ${message}`;

      lastError = new Error(errorMsg);

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
    const questionCount = correct + wrong + skipped || s.total_questions || 10;

    // s.total is total marks (e.g. 100), not question count
    const totalMarks = s.total ?? 100;
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
    ? rawData.questions.map((q: any) => ({
        question_id: q.question_id,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : [],
        user_answer: q.user_answer ?? '',
        correct_answer: q.correct_answer ?? '',
        is_correct: q.is_correct ?? false,
        explanation: q.explanation ?? '',
        solution_steps: Array.isArray(q.solution_steps) ? q.solution_steps : null,
        common_mistakes: Array.isArray(q.common_mistakes) ? q.common_mistakes : null,
        difficulty: q.difficulty,
        time_taken_seconds: q.time_taken_seconds,
      }))
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

    // Grade based on accuracy percentage
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
      total_tests:       raw.total_tests ?? raw.tests_taken ?? 0,
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
    const extractAccuracy = (item: any): number => {
      // Dynamic scan: prefer any numeric field whose key contains "accuracy", then "score"
      const entries = Object.entries(item as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'number' && !isNaN(v as number))
        .map(([k, v]) => ({ k, v: v as number }));
      const pick = (re: RegExp) => entries.find(e => re.test(e.k) && e.v !== 0);
      const found = pick(/accuracy/i) ?? pick(/score/i) ?? pick(/rate|pct|percent/i) ?? entries.find(e => e.v !== 0);
      const raw = found?.v ?? 0;
      // Normalise: if value is in 0–1 range it's a decimal fraction → multiply by 100
      return Math.round(raw > 0 && raw <= 1 ? raw * 100 : raw);
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

    const toWeakArea = (item: any): WeakArea => {
      const topic: string = item.topic ?? item.category ?? item.subcategory ?? item.section ?? item.name ?? 'Unknown';
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

    const buildResult = (items: any[]): WeakAreasAnalytics => {
      let weakItems = items.filter(isWeakItem);
      if (weakItems.length === 0) weakItems = items; // show all if nothing flagged
      const weakAreas = weakItems.map(toWeakArea).sort((a, b) => a.accuracy - b.accuracy);
      return {
        weak_areas: weakAreas,
        recommendations: weakAreas.length > 0
          ? [`Focus on: ${weakAreas.slice(0, 3).map((w: any) => w.topic).join(', ')}`, 'Practice weak areas regularly', 'Take topic-specific mock tests to improve']
          : ['Keep practicing all sections', 'Take more mock tests'],
      };
    };

    // Map backend response format to frontend WeakAreasAnalytics format
    if (response.data?.data && Array.isArray(response.data.data)) {
      analyticsData = buildResult(response.data.data);
    } else if (response.data?.weak_areas && Array.isArray(response.data.weak_areas)) {
      // Don't pass through raw — normalise accuracy values
      analyticsData = buildResult(response.data.weak_areas);
    } else if (Array.isArray(response.data)) {
      analyticsData = buildResult(response.data);
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
  name: string;
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

      const entries: LeaderboardEntry[] = list.map((item: any, idx: number) => {
        const rawAcc = item.accuracy ?? item.accuracy_pct ?? item.accuracy_percentage;
        const rawTests = item.tests_completed ?? item.total_tests ?? item.tests;
        return {
          rank: item.rank ?? idx + 1,
          name: item.display_name ?? item.username ?? item.name ?? item.user_name
            ?? (item.is_current_user ? 'You' : `Rank ${idx + 1}`),
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
