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

const TopAnalysisBar: React.FC<TopAnalysisBarProps> = ({
  matchScore,
  missingCriticalCount,
  missingImportantCount,
  missingNiceToHaveCount,
  missingSoftSkillsCount,
}) => {
  const r = 70;
  const stroke = 12;
  const normalizedRadius = r - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (clamp01(matchScore) / 100) * circumference;

  const tiles = [
    {
      label: "Critical Skills",
      count: missingCriticalCount,
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-[#bfdbfe]",
      underlineColor: "bg-[#2557a7]",
      textColor: "text-[#1d4ed8]",
    },
    {
      label: "Important Skills",
      count: missingImportantCount,
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-[#bfdbfe]",
      underlineColor: "bg-[#2557a7]",
      textColor: "text-[#1e3a8a]",
    },
    {
      label: "Nice to Have",
      count: missingNiceToHaveCount,
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-[#bfdbfe]",
      underlineColor: "bg-[#2557a7]",
      textColor: "text-[#3b82f6]",
    },
    {
      label: "Soft Skills",
      count: missingSoftSkillsCount,
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-[#bfdbfe]",
      underlineColor: "bg-[#2557a7]",
      textColor: "text-[#2557a7]",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-[#f8fbff] border border-[#e0eaf5] rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6">
        {/* Circle gauge on the left */}
        <div className="relative flex-shrink-0">
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8eff9] to-[#dce8f5] rounded-full blur-xl opacity-60" />
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
                <linearGradient
                  id="gaugeBlue"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#5b8dd9" />
                  <stop offset="50%" stopColor="#2557a7" />
                  <stop offset="100%" stopColor="#1a4a8f" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#2557a7] to-[#1a4a8f]">
                {clamp01(matchScore)}%
              </span>
              <span className="text-xs text-slate-500 font-semibold mt-0.5 tracking-wide">
                Match Score
              </span>
            </div>
          </div>
        </div>

        {/* Text + tiles on the right */}
        <div className="flex-1 w-full">
          <div className="mb-3">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
              Job Match Analysis
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {matchScore >= 80
                ? "Excellent Match! Your resume aligns perfectly with the job requirements."
                : matchScore >= 60
                ? "Good Match. Consider adding a few more relevant skills to boost your score."
                : "Needs Improvement. Add more relevant keywords and skills to increase your match score."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {tiles.map((t) => (
              <div
                key={t.label}
                className={[
                  "relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-[#2557a7]/60",
                  t.bgColor,
                  "border-2",
                  t.borderColor,
                ].join(" ")}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-0.5">
                  <div
                    className={[
                      "text-4xl md:text-5xl font-black leading-none",
                      t.textColor,
                    ].join(" ")}
                  >
                    {t.count}
                  </div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {t.label}
                  </div>
                </div>
                <div
                  className={[
                    "absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg",
                    t.underlineColor,
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopAnalysisBar;
