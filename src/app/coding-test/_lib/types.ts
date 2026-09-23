export type CodingTestDifficulty = 'easy' | 'medium' | 'hard';

export interface TopicInfo {
  name: string;
  is_starred: boolean;
}

export interface TopicCategory {
  category: string;
  topics: TopicInfo[];
}
export type CodingTestLanguage = 'python' | 'java' | 'cpp' | 'c';

export interface CodingProblemSummary {
  slug: string;
  title: string;
  difficulty: CodingTestDifficulty;
  tag: string;
}

export interface CodingProblemListResponse {
  problems: CodingProblemSummary[];
  total: number;
}

export interface CodingProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingProblemDetail {
  slug: string;
  title: string;
  difficulty: CodingTestDifficulty;
  tag: string;
  statement: string;
  examples: CodingProblemExample[];
  constraints: string[];
  starter_code: Record<CodingTestLanguage, string>;
  expected_time_complexity: string;
  expected_space_complexity: string;
}

export interface CodingProblemListFilters {
  language?: CodingTestLanguage;
  difficulty?: CodingTestDifficulty;
  tag?: string;
}

// ---- Grading (submit + history) -------------------------------------------
// Shapes mirror careerbot-ai's GradingResult, passed through by the
// careerbot-api gateway (POST /api/v1/coding-test/mock-grade).

export interface GradingCriterion {
  name: string;
  weight: number;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ScoreBreakdown {
  correctness: GradingCriterion;
  efficiency: GradingCriterion;
  code_quality: GradingCriterion;
  edge_cases: GradingCriterion;
}

export interface GradingResult {
  total_score: number;
  breakdown: ScoreBreakdown;
  summary: string;
  suggestions: string[];
  grading_model?: string;
}

export interface SubmitSolutionResponse {
  submission_id: string;
  problem_slug: string;
  language: CodingTestLanguage;
  score: number | null;
  grading_result: GradingResult | null;
  error: string | null;
  submitted_at: string;
}

export interface HistoryEntry {
  submission_id: string;
  problem_slug: string;
  problem_title: string | null;
  language: CodingTestLanguage;
  score: number | null;
  grading_result: GradingResult | null;
  error: string | null;
  submitted_at: string;
}

export interface HistoryResponse {
  entries: HistoryEntry[];
  total: number;
  page: number;
  page_size: number;
}

// Ordered criteria for stable rendering of the breakdown.
export const CRITERION_ORDER: (keyof ScoreBreakdown)[] = [
  'correctness',
  'efficiency',
  'code_quality',
  'edge_cases',
];

// ---- Quota (authenticated) -------------------------------------------------

export interface QuotaResponse {
  credits_remaining: number;
  cost_per_submission: number;
  submissions_remaining: number;
  plan: string;
}

// ---- Annotated problem list (GET /coding-test/problems/annotated) ----------

export type UserProblemStatusAnnotated = 'attempted' | 'accepted';

export interface ProblemWithStatus extends CodingProblemSummary {
  user_status: UserProblemStatusAnnotated | null;
}

// ---- Per-user progress (GET /coding-test/progress) -------------------------

export type UserProblemStatus = 'attempted' | 'accepted';

export interface UserProgressEntry {
  problem_slug: string;
  status: UserProblemStatus;
  attempts: number;
  accepted_at: string | null;
  last_run_at: string;
}

export interface UserProgressSummary {
  problems_attempted: number;
  problems_accepted: number;
}

export interface UserProgressResponse {
  summary: UserProgressSummary;
  entries: UserProgressEntry[];
}

// ---- Judge results (backend /run and /submit) --------------------------------

export type JudgeStatus =
  | 'passed'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded';

export type JudgeVerdict =
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'no_test_cases'
  | 'compile_error'
  | 'time_limit_compile'
  | 'execution_unavailable';

export interface JudgeTestCaseResult {
  index: number;
  passed: boolean;
  status: JudgeStatus;
  stdout: string;
  expected_output: string;
  stderr: string;
  wall_time_ms: number;
}

export interface JudgeResponse {
  verdict: JudgeVerdict;
  passed: number;
  total: number;
  results: JudgeTestCaseResult[];
}

// ---- Async code execution (POST /execute → queue + stream) -----------------

export interface ExecuteJobQueued {
  job_id: string;
  status: 'queued';
  poll_url: string;
  stream_url: string;
}

// ---- Poll result for free-form execute jobs (GET poll_url) ------------------

export type ExecuteJobStatus = 'queued' | 'running' | 'done' | 'error';

export interface ExecuteJobRecord {
  job_id: string;
  status: ExecuteJobStatus;
  exit_code?: number;
  wall_time_ms?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
}

// ---- Code execution (legacy — kept for reference) ---------------------------

export interface RunResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

// ---- Per-test-case execution results (parsed from Python harness output) ---

export interface TestCaseResult {
  index: number;      // 1-based
  input: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'error';
}

export interface ParsedTestResults {
  results: TestCaseResult[];
  passed: number;
  failed: number;
  total: number;
}

// ---- Submission verdict (derived client-side from SubmitSolutionResponse) --

export type SubmitVerdict =
  | 'Accepted'
  | 'Partial'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Compilation Error';

export interface SubmissionResult {
  verdict: SubmitVerdict;
  score: number;
  hiddenPassed: number;
  hiddenTotal: number;
  samplePassed: number;
  sampleTotal: number;
  summary: string;
  suggestions: string[];
  submittedAt: string;
  submissionId: string;
}
