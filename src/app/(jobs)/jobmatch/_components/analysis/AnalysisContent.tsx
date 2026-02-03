"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import TopAnalysisBar from "./TopAnalysisBar";
import MissingTechnicalSkillsCard from "../skills/MissingTechnicalSkillsCard";
import MissingSoftSkillsCard from "../skills/MissingSoftSkillsCard";
import JDHighlighter from "../highlighter/JDHighlighter";
import JDHeader from "../highlighter/JDHeader";
import ResumeHeader from "../resume/ResumeHeader";
import ResumePreview from "../resume/ResumePreview";
import PDFPreviewError from "./PDFPreviewError";
import { useMatchAnalysis } from "../_hooks/useMatchAnalysis";
import { useResumePDF } from "../_hooks/useResumePDF";
import { useSkillUpdate } from "../_hooks/useSkillUpdate";
import { AnalysisContentProps } from "../_types";
import httpClient from "@/lib/http";

const AnalysisContent: React.FC<AnalysisContentProps> = ({
  jdText,
  matchResults: initialMatchResults,
  parsedResumeData,
}) => {
  // Central match state + score
  const {
    matchResults,
    setMatchResults,
    resolveResumeId,
    score,
  } = useMatchAnalysis(initialMatchResults);

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Debug logs
  useEffect(() => {
    // // console.log("🔍 AnalysisContent - parsedResumeData:", parsedResumeData);
    // // console.log("🔍 AnalysisContent - initialMatchResults:", initialMatchResults);

    const id = resolveResumeId(parsedResumeData);
    if (id) {
      setResumeId(id);
      // // console.log("✅ Resume ID set in AnalysisContent:", id);
    } else {
      // // console.error("❌ No resume ID could be resolved!");
    }

    // Extract match ID from matchResults
    const extractedMatchId =
      matchResults?.match_id ||
      matchResults?.data?.match_id ||
      initialMatchResults?.match_id ||
      initialMatchResults?.data?.match_id ||
      null;

    if (extractedMatchId) {
      setMatchId(extractedMatchId);
      // // console.log("✅ Match ID set in AnalysisContent:", extractedMatchId);
    }
  }, [resolveResumeId, parsedResumeData, initialMatchResults, matchResults]);

  // PDF hook (returns blob url + flags) - pass matchId to get JD-matched skills
  const { pdfBlobUrl, pdfError, isLoading, isDocx, docxBlob, refetch } =
    useResumePDF(resumeId, matchId);

  // Skill update hook (handles add/remove skills + re-match)
  const { handleAddSingleSkill, handleRemoveSingleSkill, isUpdating } = useSkillUpdate(
    resumeId,
    matchResults,
    () => resolveResumeId(parsedResumeData),
    setMatchResults,
    refetch  // Pass the refetch callback to trigger PDF reload after skill updates
  );

  // Wrapper functions to pass correct skill type
  const handleAddTechnicalSkill = useCallback(
    async (skill: string) => {
      await handleAddSingleSkill(skill, "technical");
    },
    [handleAddSingleSkill]
  );

  const handleRemoveTechnicalSkill = useCallback(
    async (skill: string) => {
      await handleRemoveSingleSkill(skill, "technical");
    },
    [handleRemoveSingleSkill]
  );

  const handleAddSoftSkill = useCallback(
    async (skill: string) => {
      await handleAddSingleSkill(skill, "soft");
    },
    [handleAddSingleSkill]
  );

  const handleRemoveSoftSkill = useCallback(
    async (skill: string) => {
      await handleRemoveSingleSkill(skill, "soft");
    },
    [handleRemoveSingleSkill]
  );

  /* ===================== SKILL ARRAYS (defensive) ===================== */

  const missingCriticalSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.missing_critical_skills || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const missingImportantSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.missing_important_skills || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const missingNiceToHaveSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.missing_nice_to_have || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const missingSoftSkills: string[] = useMemo(() => {
    const missing =
      matchResults?.data?.match_result?.Soft_Skills?.missing_skills || [];
    if (missing.length > 0 && typeof missing[0] === "string") {
      return missing;
    }
    return missing
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const matchedCriticalSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.matched_critical_skills || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const matchedImportantSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.matched_important_skills || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const matchedNiceToHaveSkills: string[] = useMemo(() => {
    const skills =
      matchResults?.data?.match_result?.Technical_Skills
        ?.matched_nice_to_have || [];
    return skills
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const matchedSoftSkills: string[] = useMemo(() => {
    const matched =
      matchResults?.data?.match_result?.Soft_Skills?.matched_skills || [];
    if (matched.length > 0 && typeof matched[0] === "string") {
      return matched;
    }
    return matched
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: string) => s && s.trim().length > 0);
  }, [matchResults]);

  const allMatchedSkills = useMemo(
    () => [
      ...matchedCriticalSkills,
      ...matchedImportantSkills,
      ...matchedNiceToHaveSkills,
      ...matchedSoftSkills,
    ],
    [
      matchedCriticalSkills,
      matchedImportantSkills,
      matchedNiceToHaveSkills,
      matchedSoftSkills,
    ]
  );

  const allMissingSkills = useMemo(
    () => [
      ...missingCriticalSkills,
      ...missingImportantSkills,
      ...missingNiceToHaveSkills,
      ...missingSoftSkills,
    ],
    [
      missingCriticalSkills,
      missingImportantSkills,
      missingNiceToHaveSkills,
      missingSoftSkills,
    ]
  );

  // Merge parsedResumeData with newly added skills from matchResults
  // Keep technical and soft skills SEPARATE
  const resumeDataWithNewSkills = useMemo(() => {
    const newlyAddedSkills = matchResults?.data?.newly_added_skills || [];
    const newlyAddedSoftSkills = matchResults?.data?.newly_added_soft_skills || [];

    if (newlyAddedSkills.length === 0 && newlyAddedSoftSkills.length === 0) {
      return parsedResumeData;
    }

    return {
      ...parsedResumeData,
      newly_added_skills: newlyAddedSkills,           // Technical skills only
      newly_added_soft_skills: newlyAddedSoftSkills,  // Soft skills only
    };
  }, [
    parsedResumeData,
    matchResults?.data?.newly_added_skills,
    matchResults?.data?.newly_added_soft_skills,
  ]);

  const missingCriticalCount = missingCriticalSkills.length;
  const missingImportantCount = missingImportantSkills.length;
  const missingNiceToHaveCount = missingNiceToHaveSkills.length;
  const missingSoftSkillsCount = missingSoftSkills.length;

  // Download handler - downloads the actual file from backend
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async (format: "pdf" | "docx" = "pdf") => {
    if (!resumeId) {
      // // console.warn("No resume ID available for download");
      alert("Resume ID not available. Please try again.");
      return;
    }

    setIsDownloading(true);
    try {
      // // console.log(`📥 Downloading resume as ${format.toUpperCase()}:`, resumeId);

      // Use the correct download endpoint with format parameter
      const response = await httpClient.get(`/parser/download/${resumeId}?format=${format}`, {
        responseType: "blob",
      });

      const blob = response.data;
      const contentType = response.headers["content-type"] || "";

      // Determine file extension from format parameter or content-type
      let extension = format;
      if (
        format === "docx" ||
        contentType.includes("openxml") ||
        contentType.includes("wordprocessingml") ||
        contentType.includes("msword")
      ) {
        extension = "docx";
      }

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      let filename = `resume_${Date.now()}.${extension}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // // console.log(`✅ Resume downloaded successfully as ${extension.toUpperCase()}`);
    } catch (err) {
      // // console.error("❌ Error downloading resume:", err);
      alert(`Failed to download resume as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  }, [resumeId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Top Analysis Bar with circular gauge */}
        <TopAnalysisBar
          matchScore={score}
          missingCriticalCount={missingCriticalCount}
          missingImportantCount={missingImportantCount}
          missingNiceToHaveCount={missingNiceToHaveCount}
          missingSoftSkillsCount={missingSoftSkillsCount}
        />

        {/* Missing Requirements Cards */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-10 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full shadow-md"></div>
              <h2 className="text-2xl font-black text-slate-800">
                Missing Requirements
              </h2>
            </div>
            <p className="text-sm text-slate-500 ml-5">
              Add these items to improve your match score
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MissingTechnicalSkillsCard
              criticalSkills={missingCriticalSkills}
              importantSkills={missingImportantSkills}
              niceToHaveSkills={missingNiceToHaveSkills}
              onAddSkill={handleAddTechnicalSkill}
              onRemoveSkill={handleRemoveTechnicalSkill}
            />
            <MissingSoftSkillsCard
              softSkills={missingSoftSkills}
              onAddSkill={handleAddSoftSkill}
              onRemoveSkill={handleRemoveSoftSkill}
            />
          </div>
        </div>

        {/* Resume & JD Preview Section */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 xl:grid-cols-2">
            {/* Resume Preview (use ResumeHeader + ResumePreview) */}
            <div className="p-6 bg-gray-50 flex flex-col">
              <div className="bg-white rounded-2xl ring-2 ring-amber-100 shadow-lg overflow-hidden hover:ring-amber-200 transition-all duration-300">
                <ResumeHeader
                  onDownload={handleDownload}
                  isDownloading={isDownloading}
                />
                <div className="relative h-[600px] bg-white">
                  {isUpdating && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2557a7] border-t-transparent" />
                        <p className="text-sm font-semibold text-slate-600">
                          Updating resume...
                        </p>
                      </div>
                    </div>
                  )}

                  {pdfError ? (
                    <div className="h-full flex items-center justify-center">
                      <PDFPreviewError error={pdfError} />
                    </div>
                  ) : (
                    <ResumePreview
                      pdfBlobUrl={pdfBlobUrl}
                      pdfError={pdfError}
                      isLoading={isLoading}
                      isUpdating={isUpdating}
                      isDocx={isDocx}
                      docxBlob={docxBlob}
                      parsedData={resumeDataWithNewSkills}
                      resumeId={resumeId}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Job Description Highlighter */}
            <div className="p-6 bg-gray-50 flex flex-col border-l-2 border-slate-200">
              <div className="bg-white rounded-2xl ring-2 ring-sky-100 shadow-lg overflow-hidden hover:ring-sky-200 transition-all duration-300">
                <JDHeader />
                <div className="p-6 overflow-y-auto h-[600px] bg-white">
                  <JDHighlighter
                    text={jdText}
                    matchedSkills={allMatchedSkills}
                    missingSkills={allMissingSkills}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisContent;
