"use client";
import React from "react";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  totalSections?: number; // ✅ Add prop for total sections count
  completedSections?: number; // ✅ Add prop for completed sections count
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 56,
  strokeWidth = 4,
  totalSections = 16, // ✅ Default to 16 for backward compatibility
  completedSections: completedSectionsProp
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // ✅ Use provided completedSections or calculate from percentage
  const completedSections = completedSectionsProp ?? Math.round((percentage / 100) * totalSections);

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2557a7"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Centered text */}
      <div className="absolute flex items-center justify-center flex-col">
        <span className="text-[14px] font-bold text-gray-700">
          {completedSections}/{totalSections}
        </span>
      </div>
    </div>
  );
};

export default CircularProgress;
