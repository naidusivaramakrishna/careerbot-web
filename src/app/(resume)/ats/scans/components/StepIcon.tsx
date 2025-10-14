// src/app/scan/components/StepIcon.tsx

import React from "react";

const StepIcon = ({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
}) => (
  <div className="flex flex-col items-center w-1/3 relative z-10">
    <div
      className={`w-20 h-20 rounded-lg flex items-center justify-center shadow-md transition-all duration-500 ${
        active ? "bg-[#8B5CF6] text-white scale-110" : "bg-white border-2 border-black/30 text-black/40"
      }`}
    >
      <Icon className="w-8 h-8" />
    </div>
    <p
      className={`mt-3 text-sm font-medium transition-colors duration-500 ${
        active ? "text-black" : "text-black/40"
      }`}
    >
      {label}
    </p>
  </div>
);

export default StepIcon;
