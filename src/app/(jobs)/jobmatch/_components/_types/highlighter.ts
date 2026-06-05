// Highlighter-related TypeScript interfaces

export interface TokenAliases {
  [key: string]: string[];
}

export interface HighlightSpan {
  text: string;
  match: boolean;
  matchType?: 'matched-tech' | 'missing-tech' | 'matched-soft' | 'missing-soft';
}

export interface JDHighlighterProps {
  text: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchedSoftSkills?: string[];
  missingSoftSkills?: string[];
}
