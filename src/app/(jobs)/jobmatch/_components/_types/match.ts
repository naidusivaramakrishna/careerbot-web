// Match-related TypeScript interfaces

export interface AnalysisContentProps {
  readonly jdText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly matchResults: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly parsedResumeData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly parsedJDData?: any;
  readonly onBackToUpload?: () => void;
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
