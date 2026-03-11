"use client";

import React, { useMemo } from "react";
import { highlightJD } from "../_lib/utils/highlighter";
import { JDHighlighterProps } from "../_types";

const JDHighlighter: React.FC<JDHighlighterProps> = ({
  text,
  matchedSkills,
  missingSkills,
}) => {
  const spans = useMemo(
    () => highlightJD(text, matchedSkills, missingSkills),
    [text, matchedSkills, missingSkills]
  );
  
  return (
    <div className="text-sm leading-relaxed text-slate-700 space-y-2">
      {spans.map((s, i) =>
        s.match ? (
          <span
            key={i}
            className={[
              "inline-flex items-center px-3 py-1.5 mx-0.5 my-1 rounded-lg font-semibold shadow-md animate-in fade-in duration-300 transition-all hover:shadow-lg",
              s.matchType === 'matched'
                ? "bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] text-[#2557a7] border border-[#bfdbfe] hover:from-[#bfdbfe] hover:to-[#a5cff5]"
                : "bg-gradient-to-r from-[#eff6ff] to-[#e5eef9] text-[#2557a7] border border-[#bfdbfe] opacity-70 hover:opacity-100"
            ].join(" ")}
          >
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </div>
  );
};

export default JDHighlighter;
