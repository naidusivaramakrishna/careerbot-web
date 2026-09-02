import type { CodingTestDifficulty, CodingTestLanguage } from './types';

export const DIFFICULTIES: CodingTestDifficulty[] = ['easy', 'medium', 'hard'];

export const LANGUAGES: { value: CodingTestLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

// Monaco language id per backend language key.
export const MONACO_LANGUAGE: Record<CodingTestLanguage, string> = {
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

export const DIFFICULTY_BADGE: Record<CodingTestDifficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  hard: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};

/**
 * Normalize a score to a finite integer in [0, 100], or null if the value is
 * missing/non-finite. Defense-in-depth: the careerbot-api gateway already
 * validates score range, but the UI must never render "140 / 100" if an
 * unexpected value ever slips through.
 */
export function normalizeScore(score: number | null | undefined): number | null {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null;
  return Math.min(100, Math.max(0, Math.round(score)));
}
