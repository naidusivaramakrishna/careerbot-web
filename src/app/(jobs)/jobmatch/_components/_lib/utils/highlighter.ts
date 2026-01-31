import { TOKEN_ALIASES } from "./constants";
import { escapeRegex } from "./helpers";
import { HighlightSpan } from "../_types";

export function expandTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    const variants = TOKEN_ALIASES[t] || [t];
    for (const v of variants) out.push(v);
  }
  return Array.from(
    new Set(out.filter(Boolean).map((s) => s.trim()))
  ).filter((s) => s.length > 0);
}

export function highlightJD(
  jd: string,
  matchedSkills: string[],
  missingSkills: string[]
): HighlightSpan[] {
  if (!jd) return [{ text: "", match: false }];
  
  const expandedMatched = expandTokens(matchedSkills).sort((a, b) => b.length - a.length);
  const expandedMissing = expandTokens(missingSkills).sort((a, b) => b.length - a.length);
  const allExpanded = [...expandedMatched, ...expandedMissing];
  
  if (allExpanded.length === 0) return [{ text: jd, match: false }];
  
  const sources = allExpanded.map((t) => {
    const esc = escapeRegex(t);
    const isSingleWord = !/\s/.test(t);
    return isSingleWord ? `\\b${esc}\\b` : esc;
  });
  
  const re = new RegExp(`(${sources.join("|")})`, "gi");
  const result: HighlightSpan[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  
  while ((m = re.exec(jd)) !== null) {
    const start = m.index;
    const end = re.lastIndex;
    const matchedText = jd.slice(start, end);
    
    if (start > lastIndex) {
      result.push({ text: jd.slice(lastIndex, start), match: false });
    }
    
    const isMatched = expandedMatched.some(
      (skill) => matchedText.toLowerCase() === skill.toLowerCase()
    );
    
    result.push({
      text: matchedText,
      match: true,
      matchType: isMatched ? 'matched' : 'missing'
    });
    
    lastIndex = end;
  }
  
  if (lastIndex < jd.length) {
    result.push({ text: jd.slice(lastIndex), match: false });
  }
  
  return result;
}

export function highlightText(text: string, tokens: string[]): HighlightSpan[] {
  if (!text || !tokens.length) return [{ text: text || "", match: false }];
  
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean))).sort((a, b) => b.length - a.length);
  const sources = uniqueTokens.map((t) => {
    const esc = escapeRegex(t);
    const isSingleWord = !/\s/.test(t);
    return isSingleWord ? `\\b${esc}\\b` : esc;
  });
  
  const re = new RegExp(`(${sources.join("|")})`, "gi");
  const result: HighlightSpan[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = re.lastIndex;
    if (start > lastIndex) result.push({ text: text.slice(lastIndex, start), match: false });
    result.push({ text: text.slice(start, end), match: true });
    lastIndex = end;
  }
  
  if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), match: false });
  return result;
}
