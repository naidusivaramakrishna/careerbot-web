"use client";
import React from "react";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label }) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-medium text-gray-700">{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
