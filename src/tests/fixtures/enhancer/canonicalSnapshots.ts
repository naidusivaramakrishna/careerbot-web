import type { EnhancedResumeHistoryItem } from "@/types/api.types";

/**
 * Three GET/apply/undo snapshots for one enhanced resume's Education section,
 * used by enhancer-mutation-lifecycle.integration.test.ts and
 * ResumeContext.test.tsx to model a stateful server across a save -> apply ->
 * undo cycle instead of returning unrelated canned responses per call (the
 * canned-response version let a regression through where the UI still showed
 * a duplicate/stale card after a real refresh).
 */

const baseEducationEntry = {
  id: "edu-1",
  school: "State University",
  degree: "BS",
  startDate: "2020",
};

export const pendingEducationSnapshot: EnhancedResumeHistoryItem = {
  id: "enhanced-test-1",
  user_id: "user-1",
  original_resume_id: "resume-1",
  enhancement_type: "full",
  display_name: "Enhanced Test Resume",
  source: "enhanced",
  revision: 1,
  enhanced_data: {
    education: [{ ...baseEducationEntry, endDate: "Present" }],
  } as EnhancedResumeHistoryItem["enhanced_data"],
  original_data: {} as EnhancedResumeHistoryItem["original_data"],
  ats_score: {
    final_score: 60,
    section_breakdown: {
      Education: {
        raw_score: 6,
        max_raw_score: 10,
        percentage: 60,
        weight: 10,
        weighted_contribution: 6,
        deductions: [
          {
            id: "education_issue_0",
            penalty: 4,
            message: "Add an end date to your most recent education entry.",
          },
        ],
      },
    },
  },
  suggestions: [
    { id: "education_issue_0", section: "Education", message: "Add an end date to your most recent education entry.", fix_type: "manual" },
  ],
  applied_fixes: [],
};

export const fixedEducationSnapshot: EnhancedResumeHistoryItem = {
  id: "enhanced-test-1",
  user_id: "user-1",
  original_resume_id: "resume-1",
  enhancement_type: "full",
  display_name: "Enhanced Test Resume",
  source: "enhanced",
  revision: 2,
  enhanced_data: {
    education: [{ ...baseEducationEntry, endDate: "May 2025" }],
  } as EnhancedResumeHistoryItem["enhanced_data"],
  original_data: {} as EnhancedResumeHistoryItem["original_data"],
  ats_score: {
    final_score: 64,
    section_breakdown: {
      Education: {
        raw_score: 10,
        max_raw_score: 10,
        percentage: 100,
        weight: 10,
        weighted_contribution: 10,
        deductions: [],
      },
    },
  },
  suggestions: [],
  applied_fixes: [
    { suggestion_id: "education_issue_0", status: "applied", undo_available: true },
  ],
};

export const undoneEducationSnapshot: EnhancedResumeHistoryItem = {
  id: "enhanced-test-1",
  user_id: "user-1",
  original_resume_id: "resume-1",
  enhancement_type: "full",
  display_name: "Enhanced Test Resume",
  source: "enhanced",
  revision: 3,
  enhanced_data: {
    education: [{ ...baseEducationEntry, endDate: "Present" }],
  } as EnhancedResumeHistoryItem["enhanced_data"],
  original_data: {} as EnhancedResumeHistoryItem["original_data"],
  ats_score: {
    final_score: 60,
    section_breakdown: {
      Education: {
        raw_score: 6,
        max_raw_score: 10,
        percentage: 60,
        weight: 10,
        weighted_contribution: 6,
        deductions: [
          {
            id: "education_issue_0",
            penalty: 4,
            message: "Add an end date to your most recent education entry.",
          },
        ],
      },
    },
  },
  suggestions: [
    { id: "education_issue_0", section: "Education", message: "Add an end date to your most recent education entry.", fix_type: "manual" },
  ],
  applied_fixes: [],
};
