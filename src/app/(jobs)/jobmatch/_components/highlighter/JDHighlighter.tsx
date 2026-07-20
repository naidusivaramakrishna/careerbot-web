"use client";

import React, { useMemo } from "react";
import { highlightJD } from "../_lib/utils/highlighter";
import { JDHighlighterProps } from "../_types";

const HIGHLIGHT_COLORS: Record<string, string> = {
  'matched-tech':  '#DCFCE7',
  'missing-tech':  '#FEE2E2',
  'matched-soft':  '#DCFCE7',
  'missing-soft':  '#FEE2E2',
  'matched-cap':   '#DBEAFE',
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
    <p className="w-full whitespace-pre-wrap wrap-break-word text-[14px] leading-[1.65] text-slate-800">
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
            role={isMissing(s.matchType) && onMissingSkillClick ? "button" : undefined}
            tabIndex={isMissing(s.matchType) && onMissingSkillClick ? 0 : undefined}
            aria-label={isMissing(s.matchType) && onMissingSkillClick ? `Add ${s.text} to resume` : undefined}
            onClick={
              isMissing(s.matchType) && onMissingSkillClick
                ? () => onMissingSkillClick(s.text)
                : undefined
            }
            onKeyDown={
              isMissing(s.matchType) && onMissingSkillClick
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onMissingSkillClick(s.text);
                    }
                  }
                : undefined
            }
            className="outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
