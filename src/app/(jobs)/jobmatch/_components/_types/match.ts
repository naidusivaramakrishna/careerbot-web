// Match-related TypeScript interfaces

export interface AnalysisContentProps {
  jdText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResults: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
