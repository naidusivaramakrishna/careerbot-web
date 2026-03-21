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
              "inline-flex items-center px-2.5 py-1 mx-0.5 my-0.5 rounded-md text-xs font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default",
              s.matchType === "matched"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                : "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200",
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
