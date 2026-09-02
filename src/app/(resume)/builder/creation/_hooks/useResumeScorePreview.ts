"use client";
import { useMemo } from "react";
import type { ResumeResponse } from "@/api/resumeApi";
import { computePreviewScore, type PreviewScoreResult } from "../_lib/computePreviewScore";

export const useResumeScorePreview = (resumeData: ResumeResponse): PreviewScoreResult => {
  return useMemo(() => {
    return computePreviewScore(resumeData);
  }, [resumeData]);
};
