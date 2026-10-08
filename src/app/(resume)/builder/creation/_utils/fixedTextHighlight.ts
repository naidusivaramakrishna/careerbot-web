/**
 * Finds the exact resume text an ATS fix changed, and locates that text in the
 * rendered preview so only it can be highlighted (not the whole section).
 * Everything here is UI-only: resume data and exports are never modified.
 */

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
  achievements: "achievements",
  awards: "awards",
  languages: "languages",
  hobbies: "hobbies",
  interests: "interests",
  volunteering: "volunteering",
  publications: "publications",
  references: "references",
};

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
  const before = new Set(collectTextUnits(prev).map((unit) => `${unit.key}\u0000${unit.text}`));
  const seen = new Set<string>();
  return collectTextUnits(next).filter((unit) => {
    const id = `${unit.key}\u0000${unit.text}`;
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
  for (const unit of units) {
    const sectionKey = SECTION_BY_FIELD[unit.key];
    const scopes = sectionKey
      ? Array.from(root.querySelectorAll(`[data-section="${sectionKey}"]`))
      : [];
    const targets: Element[] = scopes.length > 0 ? scopes : [root];
    for (const scope of targets) {
      const mapped = mappedFor(scope);
      const needle = collapse(unit.text);
      let from = 0;
      for (;;) {
        const at = mapped.text.indexOf(needle, from);
        if (at < 0) break;
        from = at + needle.length;
        // Short units (single skills) must match whole words only.
        if (needle.length <= 20
          && (isWordChar(mapped.text[at - 1]) || isWordChar(mapped.text[at + needle.length]))) continue;
        const last = at + needle.length - 1;
        const range = document.createRange();
        range.setStart(mapped.nodes[at], mapped.offsets[at]);
        range.setEnd(mapped.nodes[last], mapped.offsets[last] + 1);
        ranges.push(range);
      }
    }
  }
  return ranges;
}
