"use client";

import React from "react";

interface TopAnalysisBarProps {
  matchScore: number;
  missingCriticalCount: number;
  missingImportantCount: number;
  missingNiceToHaveCount: number;
  missingSoftSkillsCount: number;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(100, x));

const getScoreLabel = (score: number) => {
  if (score >= 80) return { text: "Excellent Match", color: "text-emerald-600" };
  if (score >= 60) return { text: "Good Match", color: "text-amber-600" };
  if (score >= 40) return { text: "Fair Match", color: "text-orange-600" };
  return { text: "Needs Improvement", color: "text-red-500" };
};

const TopAnalysisBar: React.FC<TopAnalysisBarProps> = ({
  matchScore,
  missingCriticalCount,
  missingImportantCount,
  missingNiceToHaveCount,
  missingSoftSkillsCount,
}) => {
  const r = 80;
  const stroke = 11;
  const normalizedRadius = r - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (clamp01(matchScore) / 100) * circumference;

  const scoreLabel = getScoreLabel(matchScore);

  const tiles = [
    {
      label: "Critical Skills",
      count: missingCriticalCount,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      underlineColor: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      label: "Important Skills",
      count: missingImportantCount,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      underlineColor: "bg-amber-500",
      textColor: "text-amber-600",
    },
    {
      label: "Nice to Have",
      count: missingNiceToHaveCount,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      underlineColor: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      label: "Soft Skills",
      count: missingSoftSkillsCount,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      underlineColor: "bg-purple-500",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Circle gauge */}
        <div className="relative shrink-0">
          <div className="relative flex items-center justify-center" style={{ width: r * 2, height: r * 2 }}>
            <div className="absolute inset-0 bg-blue-50/60 rounded-full blur-xl opacity-60" />
            <svg
              height={r * 2}
              width={r * 2}
              className="transform -rotate-90 relative z-10"
            >
              <circle
                stroke="#E5E7EB"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={r}
                cy={r}
              />
              <circle
                stroke="url(#gaugeBlue)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{
                  strokeDashoffset,
                  transition: "stroke-dashoffset 1s ease-out",
                }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={r}
                cy={r}
              />
              <defs>
                <linearGradient id="gaugeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5b8dd9" />
                  <stop offset="50%" stopColor="#2557a7" />
                  <stop offset="100%" stopColor="#1a4a8f" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-br from-[#2557a7] to-[#1a4a8f] leading-none">
                {clamp01(matchScore)}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 tracking-wide uppercase">
                Match Score
              </span>
              <span className={`text-[10px] font-bold mt-0.5 ${scoreLabel.color}`}>
                {scoreLabel.text}
              </span>
            </div>
          </div>
        </div>

        {/* Text + tiles */}
        <div className="flex-1 w-full">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">Job Match Analysis</h2>
            <p className="text-sm text-gray-500">
              {matchScore >= 80
                ? "Excellent! Your resume aligns perfectly with the job requirements."
                : matchScore >= 60
                ? "Good match. Add a few more relevant skills to boost your score."
                : "Add more relevant keywords and skills to increase your match score."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map((t) => (
              <div
                key={t.label}
                className={`relative overflow-hidden rounded-xl p-4 border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${t.bgColor} ${t.borderColor}`}
              >
                <div className="flex flex-col items-center justify-center text-center gap-0.5">
                  <div className={`text-4xl font-black leading-none ${t.textColor}`}>
                    {t.count}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">
                    {t.label}
                  </div>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${t.underlineColor}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopAnalysisBar;
