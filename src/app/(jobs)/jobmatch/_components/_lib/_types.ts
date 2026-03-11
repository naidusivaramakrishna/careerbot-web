// Type definitions for job matching components

export type TokenAliases = Record<string, string[]>;

export interface HighlightSpan {
  text: string;
  match: boolean;
  matchType?: 'matched' | 'missing';
}

export interface SkillMatch {
  skill: string;
  matched: boolean;
  aliases?: string[];
}

export interface MatchResult {
  score: number;
  matchedSkills: SkillMatch[];
  missingSkills: SkillMatch[];
}
