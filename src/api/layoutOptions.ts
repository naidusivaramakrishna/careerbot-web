/**
 * Style & Layout settings the preview and the export both honour. Each is optional: a missing value leaves
 * the template's own default, and the backend ignores anything it does not recognise.
 */
export interface LayoutOptions {
  /** Body text size in points, "8" - "14" */
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
  if (layout.fontSize) params.append('font_size', layout.fontSize);
  if (layout.pageMargin) params.append('page_margin', layout.pageMargin);
  if (layout.sectionSpacing) params.append('section_spacing', layout.sectionSpacing);
  if (layout.alignment) params.append('alignment', layout.alignment);
}
