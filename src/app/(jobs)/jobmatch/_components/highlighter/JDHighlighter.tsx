"use client";

import React, { useMemo } from "react";
import { highlightJD } from "../_lib/utils/highlighter";
import { JDHighlighterProps } from "../_types";

const HIGHLIGHT_COLORS: Record<string, string> = {
  'matched-tech':  '#DCFCE7',
  'missing-tech':  '#FEE2E2',
  'matched-soft':  '#DBEAFE',
  'missing-soft':  '#FEF9C3',
};

const JDHighlighter: React.FC<JDHighlighterProps> = ({
  text,
  matchedSkills,
  missingSkills,
  matchedSoftSkills = [],
  missingSoftSkills = [],
}) => {
  const spans = useMemo(
    () => highlightJD(text, matchedSkills, missingSkills, matchedSoftSkills, missingSoftSkills),
    [text, matchedSkills, missingSkills, matchedSoftSkills, missingSoftSkills]
  );

  return (
    <p className="w-full text-[13px] leading-normal text-gray-900 whitespace-pre-wrap wrap-break-word">
      {spans.map((s, i) =>
        s.match ? (
          <mark
            key={i}
            style={{
              background: HIGHLIGHT_COLORS[s.matchType ?? 'missing-tech'],
              color: "inherit",
              padding: "1px 3px",
              borderRadius: "3px",
            }}
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
};

export default JDHighlighter;
