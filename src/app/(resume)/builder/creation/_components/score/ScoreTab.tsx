"use client";
import React, { useEffect, useState, useRef } from "react";
import { triggerScoreCalculation, getBuilderScore } from "@/api/resumeApi";
import PreviewScoreCard from "./PreviewScoreCard";
import FullAtsScoreCard from "./FullAtsScoreCard";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";
import { useResumeScorePreview } from "../../_hooks/useResumeScorePreview";

function EnhancedScorePanel() {
  const { enhancedAtsScore } = useResume();

  if (!enhancedAtsScore) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        Score data not available.
      </div>
    );
  }

  const score = Math.round(enhancedAtsScore.final_score ?? enhancedAtsScore.Percentage ?? 0);
  const profile = enhancedAtsScore.profile;
  const breakdown = enhancedAtsScore.section_breakdown ?? {};
  const penalties = enhancedAtsScore.intelligence_penalties ?? [];

  const scoreColor = score >= 70 ? "#16a34a" : score >= 40 ? "#2557a7" : "#dc2626";

  const sections = Object.entries(breakdown).filter(([, sec]) => sec.weight > 0);

  return (
    <div className="space-y-4 p-4">
      {/* Score circle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col items-center">
        <MultiColorCircularScore value={score} />
        <p className="mt-2 text-sm font-semibold" style={{ color: scoreColor }}>
          ATS Score
        </p>
        {profile && (
          <span className="mt-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2557a7] font-medium">
            {profile}
          </span>
        )}
      </div>

      {/* Section breakdown */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Section Breakdown
          </h3>
          <div className="space-y-3">
            {sections.map(([name, sec]) => {
              const pct = Math.round(sec.percentage);
              const barColor = pct >= 70 ? "#16a34a" : pct >= 40 ? "#2557a7" : "#dc2626";
              return (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">{name}</span>
                    <span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  {sec.deductions?.slice(0, 1).map((d, i) => (
                    <p key={i} className="text-[10px] text-amber-700 mt-0.5 leading-tight">
                      {d.after_example || d.message}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intelligence penalties */}
      {penalties.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Improvement Tips
          </h3>
          <div className="space-y-2">
            {penalties.map((p, i) => (
              <div key={i} className="text-xs rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-amber-800">
                {p.after_example || p.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ATSScorePanel() {
  const { resumeData, resumeSource } = useResume();
  const {
    canonicalScore,
    canonicalStatus,
    scoreStale,
    lastCalculatedAt,
    setCanonicalScore,
    setCanonicalStatus,
    markScoreStale,
  } = useScore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Cast: ResumeData is structurally compatible for preview score computation
  const previewScore = useResumeScorePreview(resumeData as unknown as import("@/api/resumeApi").ResumeResponse);

  const isEnhanced = resumeSource === "enhanced";

  // Mark score stale when resume data changes — builder resumes only
  useEffect(() => {
    if (!isEnhanced && canonicalScore !== null && canonicalStatus === "ready") {
      markScoreStale();
    }
  }, [resumeData, canonicalScore, canonicalStatus, markScoreStale, isEnhanced]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // For enhanced resumes, render the dedicated enhanced score panel
  if (isEnhanced) {
    return <EnhancedScorePanel />;
  }

  const handleCalculateScore = async () => {
    const resumeId = localStorage.getItem("current_resume_id");

    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      toast.error("No resume found. Please create a resume first.");
      return;
    }

    try {
      isMountedRef.current = true;
      setIsCalculating(true);
      setError(null);
      setCanonicalStatus("calculating");

      await triggerScoreCalculation(resumeId);

      const maxAttempts = 10;
      const pollInterval = 2000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        if (!isMountedRef.current) return;

        try {
          const builderScore = await getBuilderScore(resumeId);

          if (builderScore.score > 0) {
            if (isMountedRef.current) {
              setCanonicalScore(builderScore.score, new Date().toLocaleString());
              toast.success("Score calculated successfully!");
            }
            return;
          }
        } catch {
          // Continue polling
        }
      }

      if (isMountedRef.current) {
        setError("Score calculation timeout. Please try again.");
        setCanonicalStatus("error");
        toast.error("Score calculation timeout.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to calculate score";

      if (isMountedRef.current) {
        setError(errorMessage);
        setCanonicalStatus("error");
        toast.error(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsCalculating(false);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PreviewScoreCard previewScore={previewScore} />
      <FullAtsScoreCard
        score={canonicalScore}
        status={canonicalStatus}
        isStale={scoreStale}
        lastCalculatedAt={lastCalculatedAt}
        onCalculate={handleCalculateScore}
        isLoading={isCalculating}
        error={error}
      />
    </div>
  );
}
