/**
 * Style & Layout settings the preview and the export both honour. Each is optional: a missing value leaves
 * the template's own default, and the backend ignores anything it does not recognise.
 */
/** Body text size range in points: what the export renderer allows (it clamps to 8-12) and the preview scales. */
export const MIN_FONT_SIZE_PT = 8;
export const MAX_FONT_SIZE_PT = 12;

/** The size when it is a number inside the supported range, else null (it is then left to the template). */
export function validFontSize(value: unknown): number | null {
  const size = Number(value);
  return value !== "" && value != null && Number.isFinite(size) && size >= MIN_FONT_SIZE_PT && size <= MAX_FONT_SIZE_PT ? size : null;
}

export interface LayoutOptions {
  /** Body text size in points, "8" - "12" */
  fontSize?: string;
  /** "narrow" | "normal" | "wide" */
  pageMargin?: string;
  /** "compact" | "medium" | "relaxed" */
  sectionSpacing?: string;
  /** "left" | "center" | "right": the name, contact line and section headings */
  alignment?: string;
}

/** Adds the settings that are set to a download / preview request's query string. */
export function appendLayoutParams(params: URLSearchParams, layout?: LayoutOptions): void {
  if (!layout) return;
  if (validFontSize(layout.fontSize) !== null) params.append('font_size', String(layout.fontSize));
  if (layout.pageMargin) params.append('page_margin', layout.pageMargin);
  if (layout.sectionSpacing) params.append('section_spacing', layout.sectionSpacing);
  if (layout.alignment) params.append('alignment', layout.alignment);
}
