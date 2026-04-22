import { httpClient } from '@/lib/http';

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

export const generateMockTest = async (
  companyId: string,
  categories: string[] = ['arithmetic'],
  subcategories: string[] = [],
  parentSessionId?: string,
  timeoutMs: number = 60000
): Promise<MockTestSession> => {
  const resolvedSubcategories = subcategories.length > 0 ? subcategories : categories;
  const payload: Record<string, any> = {
    count: 10,
    time_limit: 20,
    type: 'mcq',
    company_context: companyId,
    category: categories.length === 1 ? categories[0] : categories,
    subcategory: resolvedSubcategories.length === 1 ? resolvedSubcategories[0] : resolvedSubcategories,
    difficulty: 'medium',
    cross_verify: true,
    exclude_question_ids: [],
  };

  if (parentSessionId) {
    payload.parent_session_id = parentSessionId;
  }

  console.log('[generateMockTest] sending payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await httpClient.post<any>('/mock-test/generate', payload, { timeout: timeoutMs });
    console.log('[generateMockTest] response:', JSON.stringify(response.data, null, 2));
    const session = response.data?.data ?? response.data;
    return session;
  } catch (err: any) {
    console.error('[generateMockTest] error status:', err?.response?.status);
    console.error('[generateMockTest] error body:', JSON.stringify(err?.response?.data));
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

export const reportIssue = async (sessionId: string, questionId: string | number, reason: string): Promise<void> => {
  try {
    await httpClient.post(`/mock-test/${sessionId}/report-issue`, {
      question_id: questionId,
      reason
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

    // Map backend response format to frontend WeakAreasAnalytics format
    if (response.data?.data && Array.isArray(response.data.data)) {

      // Transform backend format { category, average_score, attempts, is_weak }
      // to frontend format { topic, accuracy, suggestion }
      const weakAreas = response.data.data
        .filter((item: any) => {
          const isWeak = item.is_weak === true;
          return isWeak;
        })
        .map((item: any) => ({
          topic: item.category || 'Unknown',
          accuracy: Math.round(item.average_score) || 0,
          suggestion: `Improve your ${item.category} skills. You scored ${typeof item.average_score === 'number' ? item.average_score.toFixed(1) : item.average_score}% on average across ${item.attempts || 0} attempts.`
        }));

      const recommendations = weakAreas.length > 0
        ? [
            `Focus on ${weakAreas.map((w: any) => w.topic).join(', ')}`,
            'Practice weak areas regularly',
            'Take topic-specific mock tests to improve'
          ]
        : ['Keep practicing all sections', 'Take more mock tests'];

      analyticsData = {
        weak_areas: weakAreas,
        recommendations: recommendations
      };

    } else if (response.data?.weak_areas && Array.isArray(response.data.weak_areas)) {
      analyticsData = response.data;
    } else if (Array.isArray(response.data)) {
      // Handle case where response is directly an array
      const weakAreas = response.data
        .filter((item: any) => item.is_weak === true)
        .map((item: any) => ({
          topic: item.category || 'Unknown',
          accuracy: Math.round(item.average_score) || 0,
          suggestion: `Improve your ${item.category} skills. You scored ${typeof item.average_score === 'number' ? item.average_score.toFixed(1) : item.average_score}% on average across ${item.attempts || 0} attempts.`
        }));

      const recommendations = weakAreas.length > 0
        ? [
            `Focus on ${weakAreas.map((w: any) => w.topic).join(', ')}`,
            'Practice weak areas regularly',
            'Take topic-specific mock tests to improve'
          ]
        : ['Keep practicing all sections', 'Take more mock tests'];

      analyticsData = {
        weak_areas: weakAreas,
        recommendations: recommendations
      };
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
  score: number;
  accuracy: number;
  tests_completed: number;
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

      const entries: LeaderboardEntry[] = list.map((item: any, idx: number) => ({
        rank: item.rank || idx + 1,
        name: item.display_name || (item.is_current_user ? 'You' : `Rank ${idx + 1}`),
        score: Math.round((item.score ?? 0) * 10) / 10,
        accuracy: 0,
        tests_completed: 0,
        last_test_date: item.date,
      }));

      leaderboardData = {
        period: raw.period || 'All Time',
        total_participants: raw.total_attempts ?? raw.total_users ?? raw.total_participants ?? entries.length,
        your_rank: raw.rank,
        your_score: raw.avg_score,
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
