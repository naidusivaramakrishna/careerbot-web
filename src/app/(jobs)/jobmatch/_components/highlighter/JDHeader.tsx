"use client";

import React from "react";

const JDHeader: React.FC = () => (
  <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-cyan-100 to-sky-100 shadow-sm">
    <div className="h-12 px-5 flex items-center">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-8 bg-white rounded-full shadow-md"></div>
        <div>
          <h3 className="text-base font-bold text-slate-700">Job Description</h3>
          <p className="text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              Matched
            </span>
            {" • "}
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              Missing
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default JDHeader;
