"use client";

import React from "react";

const JDHeader: React.FC = () => (
  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
    <div className="h-12 px-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-1.5 h-6 bg-linear-to-b from-[#2557a7] to-[#1a4a8f] rounded-full" />
        <div>
          <h3 className="text-sm font-bold text-gray-800">Job Description</h3>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-semibold">
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
          Matched
        </span>
        <span className="flex items-center gap-1.5 text-orange-600">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-200" />
          Missing
        </span>
      </div>
    </div>
  </div>
);

export default JDHeader;
