"use client";

import React from "react";

const JDHeader: React.FC = () => (
  <div className="sticky top-0 z-10 bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] shadow-md border-b border-[#bfdbfe]">
    <div className="h-14 px-6 flex items-center">
      <div className="flex items-center gap-3">
        <div className="w-2 h-7 bg-gradient-to-b from-[#2557a7] to-[#1a4a8f] rounded-full shadow-md"></div>
        <div>
          <h3 className="text-sm font-bold text-[#2557a7]">Job Description</h3>
          <p className="text-xs text-[#2557a7]/75">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2557a7] shadow-sm"></span>
              Matched
            </span>
            {" • "}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2557a7]/40"></span>
              Missing
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default JDHeader;
