"use client";

import React, { useMemo } from "react";
import { highlightJD } from "../_lib/utils/highlighter";
import { JDHighlighterProps } from "../_types";

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
      {spans.map((s, i) => {
        // Spans have no unique id — they're plain text fragments (values can
        // repeat) freshly rebuilt as a whole in order from `text` on every
        // change (useMemo above), never reordered/filtered/sorted after the
        // fact — so a composite of the fragment's own text plus its index is
        // a safe, stable key (typescript:S6479).
        const key = `${s.text}-${i}`;
        if (!s.match) {
          return <span key={key}>{s.text}</span>;
        }
        const clickable = isMissing(s.matchType) && !!onMissingSkillClick;
        return (
          <mark
            key={key}
            style={{
              background: isMissing(s.matchType) ? "#fff3f5" : "#d8fae9",
              color: isMissing(s.matchType) ? "#ed2346" : "#087a52",
              padding: "1px 3px",
              borderRadius: "3px",
              cursor: clickable ? "pointer" : "default",
            }}
            title={isMissing(s.matchType) ? "Click to add to resume" : undefined}
            onClick={
              isMissing(s.matchType) && onMissingSkillClick
                ? () => onMissingSkillClick(s.text)
                : undefined
            }
            // Keyboard equivalent for the click above, added only for spans
            // that are actually clickable (typescript:S1082/S6847/S6848) —
            // non-clickable marks are unchanged.
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              isMissing(s.matchType) && onMissingSkillClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onMissingSkillClick(s.text);
                    }
                  }
                : undefined
            }
          >
            {s.text}
          </mark>
        );
      })}
    </p>
  );
};

export default JDHighlighter;
