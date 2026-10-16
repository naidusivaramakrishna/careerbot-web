"use client";

import React from "react";
import { getScoreBand } from "./resultsSummary";

interface TopAnalysisBarProps {
  matchScore: number;
  totalMissing: number;
  matchedSkills?: number;
  resumeSections?: number;
  onViewMissingSkills?: () => void;
}

const clamp = (x: number) => Math.max(0, Math.min(100, x));

const getScoreColor = (score: number) => ({ ring: getScoreBand(score).text, text: getScoreBand(score).text });
const getLabel = (score: number) => ({ text: getScoreBand(score).label, emoji: ({green: "?", info: "?", warning: "!", rose: "!", neutral: "?"})[getScoreBand(score).tone] });

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
    <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #F2F4F7", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
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
            <span className="text-h2" style={{ color: colors.text }}>{score}%</span>
          </div>
        </div>

        {/* Right: Text + emoji */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-body-lg" style={{ color: getScoreBand(score).text, background: getScoreBand(score).bg }}>{label.text}</p>
            <span className="text-h2">{label.emoji}</span>
          </div>
          <p className="text-body-sm text-gray-600">{getScoreBand(score).description}</p>
        </div>
      </div>

      {/* Bottom: Three stat boxes */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50">
        <div className="flex flex-col items-center text-center">
          <div className="text-h3 text-[#B42318]">{totalMissing}</div>
          <div className="text-body-sm text-gray-600 mt-1">Missing Skills</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-h3 text-success-700">{matchedSkills}</div>
          <div className="text-body-sm text-gray-600 mt-1">Matched Skills</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-h3 text-brand-600">{resumeSections}</div>
          <div className="text-body-sm text-gray-600 mt-1">Sections</div>
        </div>
      </div>
    </div>
  );
};

export default TopAnalysisBar;
