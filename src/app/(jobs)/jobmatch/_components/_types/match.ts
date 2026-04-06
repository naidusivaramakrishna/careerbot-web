// Match-related TypeScript interfaces

export interface AnalysisContentProps {
  jdText: string;
  matchResults: any;
  parsedResumeData?: any;
  onBackToUpload?: () => void;
}

export interface MatchedMap {
  [key: string]: boolean;
}

export interface TopAnalysisBarProps {
  matchScore?: number;
  missingCriticalCount: number;
  missingImportantCount: number;
  missingNiceToHaveCount: number;
  missingSoftSkillsCount: number;
}
