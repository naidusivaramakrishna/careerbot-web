// Skills-related TypeScript interfaces

import { MatchedMap } from "./match";

export interface TokenPillProps {
  label: string;
  matched: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}

export interface ListSectionProps {
  title: string;
  titleColor?: string;
  items: string[];
  matchedMap: MatchedMap;
  onToggle: (item: string) => void;
  onRemove?: (item: string) => void;
}

export interface MissingTechnicalSkillsCardProps {
  className?: string;
  criticalSkills: string[];
  importantSkills: string[];
  niceToHaveSkills: string[];
  onAddSkill?: (skill: string) => Promise<void>;
  onRemoveSkill?: (skill: string) => Promise<void>;
}

export interface MissingSoftSkillsCardProps {
  className?: string;
  softSkills: string[];
  onAddSkill?: (skill: string) => Promise<void>;
  onRemoveSkill?: (skill: string) => Promise<void>;
}
