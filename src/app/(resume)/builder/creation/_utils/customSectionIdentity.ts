import type { CustomSection } from "../_context/ResumeContext";

export const normalizeCustomSectionName = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export function findCustomSectionByName(
  sections: readonly CustomSection[] | undefined,
  name: string | null | undefined,
): CustomSection | undefined {
  if (!name) return undefined;
  const target = normalizeCustomSectionName(name);
  return sections?.find(
    section => normalizeCustomSectionName(section.sectionName) === target,
  );
}
// value is typed string | string[] but arrives from the API, so a null or
// number can reach here and a bare .trim() would throw during render.
const hasText = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).trim().length > 0;

/**
 * True when a field carries a value worth printing -- the render test the
 * five templates use. `fields.length > 0` was not enough: an all-blank
 * section passes it, every field is then suppressed by the template's own
 * `if (!hasValue) return null`, and the heading prints empty.
 */
export function hasRenderableCustomSectionContent(section: CustomSection): boolean {
  return section.fields.some(field =>
    Array.isArray(field.value) ? field.value.some(hasText) : hasText(field.value),
  );
}

/**
 * A custom section with exactly one field named the same as the section
 * itself (e.g. the backend's Strengths backfill: sectionName "Strengths",
 * its only field also "Strengths") renders that name twice -- once as the
 * section heading, once as the field's own label -- if every template
 * prints `{field.fieldName}:` unconditionally. True when this field's own
 * label would be that redundant repeat.
 */
export function isRedundantCustomSectionFieldLabel(
  section: Pick<CustomSection, "sectionName" | "fields">,
  field: CustomSection["fields"][number],
): boolean {
  return (
    section.fields.length === 1 &&
    normalizeCustomSectionName(field.fieldName) === normalizeCustomSectionName(section.sectionName)
  );
}

/**
 * Pulls the section named `name` (e.g. "Core Competencies") out of the
 * custom-sections list so a template can render it separately — positioned
 * and styled on its own — instead of through the generic trailing
 * custom-sections block every template also renders. Returns the remaining
 * sections so the generic block doesn't render the pulled-out one twice.
 */
export function extractNamedCustomSection(
  sections: readonly CustomSection[] | undefined,
  name: string,
): { match: CustomSection | undefined; rest: CustomSection[] } {
  const match = findCustomSectionByName(sections, name);
  const rest = sections ? sections.filter((section) => section !== match) : [];
  return { match, rest };
}

/**
 * True when the period at `index` ends a single-capital-letter abbreviation
 * ("U.S.", "J. Smith") rather than a sentence. resumeMappers splits Core
 * Competencies points with this rule and the templates bold each point's
 * "Label." lead-in with it, so both must use this one definition.
 */
export function isAbbreviationPeriod(text: string, index: number): boolean {
  return /\p{Lu}/u.test(text[index - 1] ?? "") && (index < 2 || /[\s.]/.test(text[index - 2]));
}

/**
 * Splits a Core Competencies point into its bold "Label." lead-in and the
 * rest. The label ends at the first period followed by whitespace or the end
 * of the point, so "Node.js" or "3.5x" never end it, and an abbreviation
 * ("U.S.") is skipped. Null when the point has no such period.
 */
export function splitCompetencyLabel(point: string): { label: string; rest: string } | null {
  const boundary = /\.(?=\s|$)/g;
  for (let match = boundary.exec(point); match; match = boundary.exec(point)) {
    if (isAbbreviationPeriod(point, match.index)) continue;
    return { label: point.slice(0, match.index + 1), rest: point.slice(match.index + 1).trim() };
  }
  return null;
}
