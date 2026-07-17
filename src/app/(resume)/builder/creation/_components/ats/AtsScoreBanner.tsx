"use client";

import React from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronsRight,
  Sparkles,
  Target,
} from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { buildAtsSectionIssues, getEstimatedAtsScore, getAtsScoreValue } from "../../_utils/atsMissing";

interface AtsScoreBannerProps {
  onOpenMissing: () => void;
}

interface ScoreRingProps {
  label: string;
  score: number;
  color: string;
  trackColor: string;
}

function ScoreRing({ label, score, color, trackColor }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center">
      <div className="whitespace-nowrap text-[10px] font-black leading-none text-slate-500">{label}</div>
      <div className="mt-2 flex items-center justify-center">
        <div className="rounded-full bg-white p-1 shadow-[0_5px_14px_rgba(15,23,42,0.08)]">
          <div
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${color} ${clampedScore * 3.6}deg, ${trackColor} 0deg)`,
            }}
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[12px] font-black leading-none tracking-[-0.02em]" style={{ color }}>
              {score}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AtsScoreBanner({ onOpenMissing }: AtsScoreBannerProps) {
  const { resumeData, enhancedAtsScore, enhancedSuggestions } = useResume();
  const issues = buildAtsSectionIssues(enhancedAtsScore, enhancedSuggestions, resumeData);
  const currentScore = getAtsScoreValue(enhancedAtsScore);
  const estimatedScore = getEstimatedAtsScore(currentScore, issues);

  return (
    <div className="mx-4 mt-3 overflow-x-auto rounded-lg border border-blue-100 bg-gradient-to-r from-white via-[#f7fbff] to-white px-5 py-3 shadow-sm">
      <div className="grid min-h-[88px] min-w-[1060px] grid-cols-[minmax(300px,1fr)_330px_350px] items-center gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2557a7] shadow-[0_10px_28px_rgba(37,87,167,0.16)]">
            <Sparkles className="absolute -left-2 top-5 text-amber-300" size={12} />
            <Sparkles className="absolute -right-1 top-2 text-[#3a78f5]" size={15} />
            <Sparkles className="absolute bottom-3 right-0 text-amber-300" size={11} />
            <Target size={44} strokeWidth={2.7} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-black leading-6 text-slate-950">Let&apos;s boost your ATS score!</h2>
            <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-500">
              Complete the missing sections to improve your resume visibility.
            </p>
          </div>
        </div>

        <div className="grid h-[86px] min-w-0 grid-cols-[1fr_30px_1fr] items-center rounded-lg border border-blue-100 bg-white/80 px-4 shadow-sm">
          <ScoreRing label="Current ATS Score" score={currentScore} color="#fb7185" trackColor="#ffe1e7" />
          <ChevronsRight className="mx-auto text-slate-400" size={22} />
          <ScoreRing label="Estimated Score" score={estimatedScore} color="#34b97b" trackColor="#dcfce7" />
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_164px] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 whitespace-nowrap text-xs font-black text-red-600">
              <AlertTriangle size={15} />
              {issues.length} Sections need attention
            </div>
            <div className="mt-2 flex items-center gap-2 whitespace-nowrap text-xs font-bold text-slate-500">
              <BarChart3 size={15} className="text-[#2557a7]" />
              High impact improvements
            </div>
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={onOpenMissing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#2557a7] px-2.5 text-[10px] font-black text-white shadow-sm transition hover:bg-[#1f4e98]"
            >
              Fix All Missing Sections
              <Sparkles size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
