// Shared API client for all coding-test surfaces (R1 standalone + R2 mock interview).
// R2's CodingStep imports from here so it has no dependency on route-local _lib paths.
export { fetchProblems, fetchProblem, CodingTestApiError } from '@/app/coding-test/_lib/api';
export { mockGrade, fetchProgress, GradingApiError } from '@/app/coding-test/_lib/gradingApi';
export { runCode, submitCode, RunApiError } from '@/app/coding-test/_lib/runApi';
