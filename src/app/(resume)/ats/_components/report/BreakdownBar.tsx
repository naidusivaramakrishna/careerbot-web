import React from "react";

const BreakdownBar = ({
  label,
  scoreValue,
}: {
  label: string;
  scoreValue: number;
}) => {
  const barColor = () => {
    if (scoreValue >= 90) return "bg-green-500";
    if (scoreValue >= 70) return "bg-blue-500";
    return "bg-orange-500";
  };
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        <span>{scoreValue}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor()}`}
          style={{ width: `${scoreValue}%` }}
        ></div>
      </div>
    </div>
  );
};

export default BreakdownBar;
