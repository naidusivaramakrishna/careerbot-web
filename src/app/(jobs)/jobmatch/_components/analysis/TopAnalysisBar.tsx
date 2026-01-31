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
      bgColor: "bg-red-50",
      borderColor: "border-red-300",
      underlineColor:
        "bg-gradient-to-r from-red-300 via-red-400 to-red-500",
      textColor: "text-slate-700",
    },
    {
      label: "Important Skills",
      count: missingImportantCount,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300",
      underlineColor:
        "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500",
      textColor: "text-slate-700",
    },
    {
      label: "Nice to Have",
      count: missingNiceToHaveCount,
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-300",
      underlineColor:
        "bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500",
      textColor: "text-slate-700",
    },
    {
      label: "Soft Skills",
      count: missingSoftSkillsCount,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      underlineColor:
        "bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500",
      textColor: "text-slate-700",
    },
  ];

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-3 md:gap-4">
        {/* Circle gauge on the left */}
        <div className="relative flex-shrink-0">
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-xl opacity-60" />
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
                stroke="url(#gaugeGreen)"
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
                  id="gaugeGreen"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="50%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600">
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
          <div className="mb-2">
            <h2 className="text-lg md:text-xl font-black text-slate-800 mb-0.5">
              Job Match Analysis
            </h2>
            <p className="text-xs md:text-sm text-slate-600 font-medium">
              {matchScore >= 80
                ? "Excellent Match! Your resume aligns perfectly with the job requirements."
                : matchScore >= 60
                ? "Good Match. Consider adding a few more relevant skills to boost your score."
                : "Needs Improvement. Add more relevant keywords and skills to increase your match score."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {tiles.map((t) => (
              <div
                key={t.label}
                className={[
                  "relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:shadow-md",
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
