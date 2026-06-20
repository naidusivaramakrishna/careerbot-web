import type { CodingTestDifficulty, CodingTestLanguage } from './types';

export const DIFFICULTIES: CodingTestDifficulty[] = ['easy', 'medium', 'hard'];

export const LANGUAGES: { value: CodingTestLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

// Monaco language id per backend language key.
export const MONACO_LANGUAGE: Record<CodingTestLanguage, string> = {
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

export const DIFFICULTY_BADGE: Record<CodingTestDifficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  hard: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};
