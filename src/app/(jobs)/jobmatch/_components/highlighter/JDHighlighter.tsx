"use client";

import React, { useMemo } from "react";
import { highlightJD } from "../_lib/utils/highlighter";
import { JDHighlighterProps } from "../_types";

const HIGHLIGHT_COLORS: Record<string, string> = {
  'matched-tech':  '#DCFCE7',
  'missing-tech':  '#FEE2E2',
  'matched-soft':  '#DBEAFE',
  'missing-soft':  '#FEF9C3',
  'matched-cap':   '#EDE9FE',
};

const JDHighlighter: React.FC<JDHighlighterProps> = ({
  text,
  matchedSkills,
  missingSkills,
  matchedSoftSkills = [],
  missingSoftSkills = [],
  matchedCapabilities = [],
  onMissingSkillClick,
}) => {
  const spans = useMemo(
    () => highlightJD(text, matchedSkills, missingSkills, matchedSoftSkills, missingSoftSkills, matchedCapabilities),
    [text, matchedSkills, missingSkills, matchedSoftSkills, missingSoftSkills, matchedCapabilities]
  );

  const isMissing = (matchType?: string) =>
    matchType === 'missing-tech' || matchType === 'missing-soft';

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
              cursor: isMissing(s.matchType) && onMissingSkillClick ? "pointer" : "default",
            }}
            title={isMissing(s.matchType) ? "Click to add to resume" : undefined}
            onClick={
              isMissing(s.matchType) && onMissingSkillClick
                ? () => onMissingSkillClick(s.text)
                : undefined
            }
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
