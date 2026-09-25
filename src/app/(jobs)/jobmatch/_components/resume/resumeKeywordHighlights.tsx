import React from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export const matchedKeywordStyle: React.CSSProperties = { backgroundColor: "#d8fae9", color: "#087a52", borderRadius: 3, padding: "0 2px" };
// Single source of truth for every "missing" indicator in the resume preview —
// skill/soft-skill chips (AnimatedSkillChip), inline keyword highlights below,
// and the pending-field style in JobMatchTemplateThree.tsx all reuse this same
// light rose so "missing" reads as one consistent color across every section
// instead of each surface picking its own shade.
export const missingKeywordStyle: React.CSSProperties = { backgroundColor: "#fdf0f2", color: "#c2456a", borderRadius: 3, padding: "0 2px" };
export const missingKeywordBorderColor = "#f3c7d3";

export function highlightResumeKeywords(text: string, matched: string[], missing: string[]): React.ReactNode {
  const matchedSet = new Set(matched.filter(Boolean).map(value => value.trim().toLowerCase()));
  const terms = [...new Set([...matched, ...missing].filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))].sort((a, b) => b.length - a.length);
  if (!terms.length) return text;
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  const parts: React.ReactNode[] = [];
  let end = 0;
  for (const match of text.matchAll(regex)) {
    const start = match.index!;
    parts.push(text.slice(end, start));
    const status = matchedSet.has(match[0].toLowerCase()) ? "matched" : "missing";
    parts.push(<mark key={start} data-resume-keyword={status} style={status === "matched" ? matchedKeywordStyle : missingKeywordStyle} title={status === "matched" ? "Present in resume and job description" : "Reported missing by the job match analysis"}>{match[0]}</mark>);
    end = start + match[0].length;
  }
  parts.push(text.slice(end));
  return <>{parts}</>;
}

/** Retain sanitized rich-text formatting; highlight only text, never attributes. */
export function ResumeKeywordHtml({ content, matched, missing }: { content: string; matched: string[]; missing: string[] }) {
  if (typeof window === "undefined") return <div className="ats-desc">{highlightResumeKeywords(content, matched, missing)}</div>;
  const document = new DOMParser().parseFromString(sanitizeHtml(content), "text/html");
  const render = (node: Node, key: number): React.ReactNode => {
    if (node.nodeType === 3) return <React.Fragment key={key}>{highlightResumeKeywords(node.textContent ?? "", matched, missing)}</React.Fragment>;
    if (node.nodeType !== 1) return null;
    const element = node as Element;
    return React.createElement(element.tagName.toLowerCase(), { key }, ...Array.from(element.childNodes).map(render));
  };
  return <div className="ats-desc">{Array.from(document.body.childNodes).map(render)}</div>;
}
