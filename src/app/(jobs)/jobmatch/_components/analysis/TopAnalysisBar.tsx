"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface TopAnalysisBarProps {
  matchScore: number;
  totalMissing: number;
  matchedSkills?: number;
  resumeSections?: number;
  onViewMissingSkills?: () => void;
}

const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

const getScoreColor = (score: number) => {
  if (score >= 80) return { ring: "#22c55e", text: "#16a34a" };
  if (score >= 60) return { ring: "#f59e0b", text: "#d97706" };
  if (score >= 40) return { ring: "#f97316", text: "#ea580c" };
  return { ring: "#3b82f6", text: "#2557a7" };
};

const getLabel = (score: number) => {
  if (score >= 85) return { text: "Excellent Match!", emoji: "🎉" };
  if (score >= 70) return { text: "Great Match!",     emoji: "🎉" };
  if (score >= 55) return { text: "Good Match",       emoji: "👍" };
  if (score >= 40) return { text: "Fair Match",       emoji: "⚠️" };
  return             { text: "Needs Work",            emoji: "❌" };
};


const TopAnalysisBar: React.FC<TopAnalysisBarProps> = ({
  matchScore, totalMissing, matchedSkills = 0, resumeSections = 0, onViewMissingSkills,
}) => {
  const score  = clamp(matchScore);
  const label  = getLabel(score);
  const colors = getScoreColor(score);

  const r    = 65;
  const sw   = 10;
  const nr   = r - sw / 2;
  const circ = 2 * Math.PI * nr;
  const dash = circ - (score / 100) * circ;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      {/* Main: Circular score (left) + Text (right) */}
      <div className="flex items-center gap-5 px-6 py-5 border-b border-gray-100">
        {/* Left: Circle */}
        <div className="relative shrink-0" style={{ width: r * 1.2, height: r * 1.2 }}>
          <svg width={r * 1.2} height={r * 1.2} className="-rotate-90" style={{ display: "block" }}>
            <defs>
              <linearGradient id="gaugeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.ring} stopOpacity="0.6" />
                <stop offset="100%" stopColor={colors.ring} />
              </linearGradient>
            </defs>
            <circle cx={r * 0.6} cy={r * 0.6} r={nr * 0.6} fill="none" stroke="rgba(37,87,167,0.12)" strokeWidth={sw} />
            <circle cx={r * 0.6} cy={r * 0.6} r={nr * 0.6} fill="none" stroke="url(#gaugeGrad2)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={dash} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-black" style={{ fontSize: 16, color: colors.text }}>{score}%</span>
          </div>
        </div>

        {/* Right: Text + emoji */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[16px] font-bold text-gray-900">{label.text}</p>
            <span className="text-[20px]">{label.emoji}</span>
          </div>
          <p className="text-[12px] text-gray-600">Your resume is a strong match for this position.</p>
        </div>
      </div>

      {/* Bottom: Three stat boxes */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50">
        <div className="flex flex-col items-center text-center">
          <div className="text-[18px] font-bold text-red-600">{totalMissing}</div>
          <div className="text-[11px] font-medium text-gray-600 mt-1">Missing Skills</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-[18px] font-bold text-green-600">{matchedSkills}</div>
          <div className="text-[11px] font-medium text-gray-600 mt-1">Matched Skills</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-[18px] font-bold text-blue-600">{resumeSections}</div>
          <div className="text-[11px] font-medium text-gray-600 mt-1">Sections</div>
        </div>
      </div>
    </div>
  );
};

export default TopAnalysisBar;
