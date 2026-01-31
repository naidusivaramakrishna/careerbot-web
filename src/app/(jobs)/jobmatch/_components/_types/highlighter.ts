// Highlighter-related TypeScript interfaces

export interface TokenAliases {
  [key: string]: string[];
}

export interface HighlightSpan {
  text: string;
  match: boolean;
  matchType?: 'matched' | 'missing';
}

export interface JDHighlighterProps {
  text: string;
  matchedSkills: string[];
  missingSkills: string[];
}
