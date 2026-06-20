export type CodingTestDifficulty = 'easy' | 'medium' | 'hard';
export type CodingTestLanguage = 'python' | 'java' | 'cpp';

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
