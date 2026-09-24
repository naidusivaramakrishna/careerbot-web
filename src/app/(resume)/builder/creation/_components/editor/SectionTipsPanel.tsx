"use client";
import React from "react";

interface SectionTipsPanelProps {
  /** Retained for callers that provide a section-specific static help block. */
  sectionKey: string;
  /** Static editor help, unrelated to the ATS Enhancer report. */
  staticTips: React.ReactNode;
  entryContent?: string[];
}

/**
 * The Resume Enhancer report has one source of truth: ScoreTab's Section
 * Breakdown. Keeping ATS cards here as well made the same issue appear in an
 * editor panel and under an unrelated section. This component now renders only
 * the caller's non-ATS editing guidance.
 */
const SectionTipsPanel: React.FC<SectionTipsPanelProps> = ({ staticTips }) => <>{staticTips}</>;

export default SectionTipsPanel;