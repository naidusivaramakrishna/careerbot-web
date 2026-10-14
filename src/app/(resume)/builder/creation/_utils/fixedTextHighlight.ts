/**
 * Finds the exact resume text an ATS fix changed, and locates that text in the
 * rendered preview so only it can be highlighted (not the whole section).
 * Everything here is UI-only: resume data and exports are never modified.
 */

import { SUGGESTION_SECTION_MAP } from "./suggestionSection";

export type TextUnit = { key: string; text: string };

const SKIP_KEYS = new Set([
  "id", "_id", "userId", "user_id", "resumeId", "resume_id",
  "createdAt", "updatedAt", "created_at", "updated_at",
]);

// Top-level resume field -> the `data-section` key the templates emit.
const SECTION_BY_FIELD: Record<string, string> = {
  personalInfo: "personal-info",
  professionalSummary: "summary",
  summary: "summary",
  skills: "skills",
  categorizedSkills: "skills",
  technicalSkills: "skills",
  workExperience: "work-experience",
  projects: "projects",
  internships: "internships",
  education: "education",
  certifications: "certifications",
  licenses: "certifications",
  certificatesAndClearances: "certifications",
  achievements: "achievements",
  awards: "awards",
  languages: "languages",
  hobbies: "hobbies",
  interests: "interests",
  volunteering: "volunteering",
  publications: "publications",
  references: "references",
};

// Editor section key (see SUGGESTION_SECTION_MAP) -> the `data-section` the preview emits for it.
const PREVIEW_SECTION_BY_EDITOR: Record<string, string> = {
  PersonalInfo: "personal-info",
  ProfessionalSummary: "summary",
  Skills: "skills",
  Education: "education",
  WorkExperience: "work-experience",
  Projects: "projects",
  Internships: "internships",
  Certifications: "certifications",
  Achievements: "achievements",
  Volunteering: "volunteering",
  Awards: "awards",
  Hobbies: "hobbies",
  Interests: "interests",
  Languages: "languages",
  Publications: "publications",
  References: "references",
};

/**
 * Can a fix card of this suggestion `section` have written this text? A hand edit
 * somewhere else (say a Summary sentence, while an unrelated Skills card is fixed)
 * is not that card's output and must not be painted green. A text whose field, or a
 * card whose section, is not in the maps is never filtered out: an unknown section
 * keeps the old behaviour rather than hiding a highlight we cannot place.
 */
export function unitBelongsToSuggestionSection(unit: TextUnit, section: string): boolean {
  const unitSection = SECTION_BY_FIELD[unit.key];
  if (!unitSection) return true;
  const wanted = section.trim().toLowerCase();
  const allowed = new Set<string>();
  for (const [editorKey, suggestionSections] of Object.entries(SUGGESTION_SECTION_MAP)) {
    if (suggestionSections.some((name) => name.toLowerCase() === wanted)) {
      const preview = PREVIEW_SECTION_BY_EDITOR[editorKey];
      if (preview) allowed.add(preview);
    }
  }
  return allowed.size === 0 || allowed.has(unitSection);
}

/** Stable identity of a unit, used to tell "already there" from "newly written". */
export const unitKey = (unit: TextUnit): string => `${unit.key}\u0000${unit.text}`;

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

const collapse = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Splits a (possibly HTML) field into trimmed plain-text lines / bullets. */
export function toPlainLines(value: string): string[] {
  return value
    .replace(/<\/(li|p|div|h[1-6]|ul|ol)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .split("\n")
    .map((line) => collapse(line.replace(/^[\s•\-*·]+/, "")))
    .filter((line) => line.length >= 2);
}

export function collectTextUnits(data: unknown): TextUnit[] {
  const units: TextUnit[] = [];
  const walk = (value: unknown, key: string, depth: number) => {
    if (depth > 8 || value === null || value === undefined) return;
    if (typeof value === "string") {
      for (const text of toPlainLines(value)) units.push({ key, text });
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, key, depth + 1);
      return;
    }
    if (typeof value === "object") {
      for (const [field, child] of Object.entries(value as Record<string, unknown>)) {
        if (SKIP_KEYS.has(field)) continue;
        walk(child, key, depth + 1);
      }
    }
  };
  if (data && typeof data === "object") {
    for (const [field, child] of Object.entries(data as Record<string, unknown>)) {
      if (SKIP_KEYS.has(field)) continue;
      walk(child, field, 0);
    }
  }
  return units;
}

/** Units present in `next` that were not in `prev` (the text a fix wrote). */
export function diffTextUnits(prev: unknown, next: unknown): TextUnit[] {
  const before = new Set(collectTextUnits(prev).map(unitKey));
  const seen = new Set<string>();
  return collectTextUnits(next).filter((unit) => {
    const id = unitKey(unit);
    if (before.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

type Mapped = { text: string; nodes: Text[]; starts: number[]; offsets: number[] };

/** Whitespace-collapsed text of `root` with a map from each char to its node. */
function mapText(root: Element): Mapped {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const chars: string[] = [];
  const nodes: Text[] = [];
  const starts: number[] = [];
  const offsets: number[] = [];
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const raw = node.data;
    for (let i = 0; i < raw.length; i += 1) {
      const isSpace = /\s/.test(raw[i]);
      if (isSpace && (chars.length === 0 || chars[chars.length - 1] === " ")) continue;
      chars.push(isSpace ? " " : raw[i]);
      nodes.push(node);
      offsets.push(i);
    }
    starts.push(chars.length);
    // Separate adjacent blocks so a unit can never match across two of them.
    if (chars.length && chars[chars.length - 1] !== " ") {
      chars.push(" ");
      nodes.push(node);
      offsets.push(raw.length);
    }
  }
  return { text: chars.join(""), nodes, starts, offsets };
}

const isWordChar = (char: string | undefined): boolean => Boolean(char && /[A-Za-z0-9]/.test(char));

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Other ways the preview can show a stored value. The templates reformat some
 * fields, so searching only for the stored text finds nothing and the fix
 * would go unhighlighted:
 *   - dates are stored as "2018-08" but shown as "Aug 18" (builder templates)
 *     or "Aug 2018" (classic templates)
 *   - profile links are stored as URLs but shown only as a "LinkedIn" /
 *     "GitHub" / "Portfolio" label
 */
export function displayVariants(text: string): string[] {
  const value = collapse(text);

  const date = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (date) {
    const [, year, month, day] = date;
    const index = Number(month) - 1;
    if (index < 0 || index > 11) return [];
    const variants = [
      `${MONTH_SHORT[index]} ${year}`,
      `${MONTH_SHORT[index]} ${year.slice(2)}`,
      `${MONTH_LONG[index]} ${year}`,
      `${month}/${year}`,
    ];
    if (day) {
      variants.push(`${MONTH_SHORT[index]} ${Number(day)}, ${year}`, `${day}/${month}/${year}`);
    }
    return variants;
  }

  if (/^(https?:\/\/|www\.)/i.test(value)) {
    const host = value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
    const lower = host.toLowerCase();
    const label = lower.includes("linkedin.") ? "LinkedIn" : lower.includes("github.") ? "GitHub" : "Portfolio";
    return [label, host];
  }

  return [];
}

// Phone-style numbers are printed straight after the country code ("+919876543210"),
// so the whole-word rule below must not apply to them.
const isNumberLike = (value: string): boolean => /^[\d\s()+\-.]{7,}$/.test(value);

/**
 * Ranges covering each unit's text in the preview. Units are searched inside
 * the `data-section` area for their field when it exists (so a skill named
 * "AWS" never lights up a bullet elsewhere), otherwise in the whole preview.
 */
export function findHighlightRanges(root: HTMLElement, units: TextUnit[]): Range[] {
  const ranges: Range[] = [];
  const cache = new Map<Element, Mapped>();
  const mappedFor = (scope: Element): Mapped => {
    let mapped = cache.get(scope);
    if (!mapped) { mapped = mapText(scope); cache.set(scope, mapped); }
    return mapped;
  };
  const addMatches = (mapped: Mapped, needle: string) => {
    let from = 0;
    for (;;) {
      const at = mapped.text.indexOf(needle, from);
      if (at < 0) break;
      from = at + needle.length;
      // Short units (single skills) must match whole words only.
      if (needle.length <= 20 && !isNumberLike(needle)
        && (isWordChar(mapped.text[at - 1]) || isWordChar(mapped.text[at + needle.length]))) continue;
      // "Tools: Docker" -- a match followed by ":" is the line's label, not
      // the value that was added, so leave it unhighlighted.
      // The ":" may sit in its own text node, so look past any whitespace.
      let after = at + needle.length;
      while (mapped.text[after] === " ") after += 1;
      if (mapped.text[after] === ":") continue;
      const last = at + needle.length - 1;
      const range = document.createRange();
      range.setStart(mapped.nodes[at], mapped.offsets[at]);
      range.setEnd(mapped.nodes[last], mapped.offsets[last] + 1);
      ranges.push(range);
    }
  };
  for (const unit of units) {
    const sectionKey = SECTION_BY_FIELD[unit.key];
    const scopes = sectionKey
      ? Array.from(root.querySelectorAll(`[data-section="${sectionKey}"]`))
      : [];
    // A profile link is printed as a bare label ("LinkedIn", "Portfolio"): look for it in
    // the contact block only, not anywhere in the preview.
    const isLink = /^(https?:\/\/|www\.)/i.test(collapse(unit.text));
    const contactScopes = isLink && !sectionKey
      ? Array.from(root.querySelectorAll('[data-section="personal-info"]'))
      : [];
    const targets: Element[] = scopes.length > 0 ? scopes : contactScopes.length > 0 ? contactScopes : [root];
    // The stored text, plus any other form the preview shows it in.
    const needles = new Set([collapse(unit.text), ...displayVariants(unit.text)]);
    for (const scope of targets) {
      const mapped = mappedFor(scope);
      for (const needle of needles) addMatches(mapped, needle);
    }
  }
  return ranges;
}
