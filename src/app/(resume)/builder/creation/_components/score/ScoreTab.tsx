"use client";
import React, { useEffect, useState, useRef } from "react";
import { triggerScoreCalculation, getBuilderScore } from "@/api/resumeApi";
import PreviewScoreCard from "./PreviewScoreCard";
import FullAtsScoreCard from "./FullAtsScoreCard";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";
import { useResumeScorePreview } from "../../_hooks/useResumeScorePreview";
import { getAtsScoreValue, getAtsSectionBreakdown } from "../../_utils/atsMissing";
import { CheckCircle2, Info, Lightbulb, TrendingUp } from "lucide-react";

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Good",
      color: "#059669",
      soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
      text: "Your resume is well-optimized. Fix remaining sections to reach 100%.",
    };
  }

  if (score >= 60) {
    return {
      label: "Needs Work",
      color: "#d97706",
      soft: "bg-amber-50 text-amber-700 border-amber-100",
      text: "Your resume has a solid base. Focus on the lower-scoring sections first.",
    };
  }

  return {
    label: "Needs Attention",
    color: "#dc2626",
    soft: "bg-red-50 text-red-700 border-red-100",
    text: "Several important ATS signals are missing. Start with high-impact fixes.",
  };
}

function ScoreDonut({ score }: { score: number }) {
  const tone = getScoreTone(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="relative flex h-[118px] w-[118px] shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${tone.color} ${clampedScore * 3.6}deg, #eef2f7 0deg)`,
        }}
      />
      <div className="absolute inset-[12px] rounded-full bg-white shadow-inner" />
      <div className="relative text-center">
        <div className="text-[30px] font-black leading-none tracking-normal text-slate-950">
          {score}%
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          ATS
        </div>
      </div>
    </div>
  );
}

function EnhancedScorePanel() {
  const { enhancedAtsScore } = useResume();

  if (!enhancedAtsScore) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-sm font-medium text-slate-400">
        Score data not available.
      </div>
    );
  }

  const score = getAtsScoreValue(enhancedAtsScore);
  const profile = enhancedAtsScore.profile;
  const breakdown = getAtsSectionBreakdown(enhancedAtsScore);
  const penalties = enhancedAtsScore.intelligence_penalties ?? [];
  const tone = getScoreTone(score);
  const sections = Object.entries(breakdown)
    .filter(([, sec]) => sec.weight > 0)
    .sort(([, a], [, b]) => a.percentage - b.percentage);
  const visibleSections = sections.slice(0, 7);
  const topPenalty = penalties[0];

  return (
    <div className="space-y-4 px-3 pb-4 pt-1">
      <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-black leading-5 text-slate-950">
              ATS Score Breakdown
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Live score from your enhanced resume.
            </p>
          </div>
          <button
            type="button"
            aria-label="Score information"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-[#2557a7]"
          >
            <Info size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <ScoreDonut score={score} />
          <div className="min-w-0 flex-1">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${tone.soft}`}>
              <CheckCircle2 size={14} />
              {tone.label}
            </div>
            <p className="mt-3 text-sm font-medium leading-5 text-slate-600">
              {tone.text}
            </p>
            {profile && (
              <div className="mt-3 inline-flex max-w-full items-center rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#2557a7]">
                <span className="truncate">{profile}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {visibleSections.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-black text-slate-900">
              Section Performance
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
              Lowest first
            </span>
          </div>

          <div className="space-y-3.5">
            {visibleSections.map(([name, sec]) => {
              const pct = Math.round(sec.percentage);
              const barColor = pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626";
              return (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs font-bold text-slate-700">{name}</span>
                    <span className="shrink-0 text-xs font-black" style={{ color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  {sec.deductions?.slice(0, 1).map((d, i) => (
                    <p key={i} className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">
                      {d.after_example || d.message}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topPenalty && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-[#173b72]">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2557a7] shadow-sm">
              <Lightbulb size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-black text-[#173b72]">
                <TrendingUp size={15} />
                Tip
              </div>
              <p className="mt-1 line-clamp-3 text-xs font-medium leading-5 text-slate-600">
                {topPenalty.after_example || topPenalty.message}
              </p>
            </div>
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
    <div className="grid grid-cols-1 gap-4 px-3 pb-4 pt-1">
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
