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
    <div className="text-sm leading-relaxed text-slate-700 space-y-1">
      {spans.map((s, i) =>
        s.match ? (
          <span
            key={i}
            className={[
              "inline-flex items-center px-2 py-1 mx-0.5 my-0.5 rounded-md font-semibold shadow-sm animate-in fade-in duration-300",
              s.matchType === 'matched'
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-300"
                : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-300"
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
