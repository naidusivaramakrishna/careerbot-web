import { useEffect, type RefObject } from "react";
import { validFontSize } from "@/api/layoutOptions";

/**
 * The Style & Layout settings (font size, page margin, section spacing, alignment) applied to the on-screen
 * preview, so it matches what the export does (the export applies the same four to the template on the server).
 *
 * The preview templates set most sizes and gaps inline, per template, so the settings are applied to the
 * rendered preview itself: sizes and gaps are scaled from the value each element was rendered with, the page's
 * outer padding is replaced, and the header and section headings are aligned. Setting a value back to "template
 * default" puts everything back. Only the screen is touched; the resume data and the export are not.
 */
export interface PreviewLayoutSettings {
  fontSize?: string;
  pageMargin?: string;
  sectionSpacing?: string;
  alignment?: string;
  /** The active template's body size (resumeStyle.bodyFontSize, e.g. "9px"): the size the font setting replaces. */
  baseFontSize?: string;
}

/** Body size the preview templates are designed for (the "Template default" font size). */
export const BASE_BODY_SIZE_PX = 10;

/** The body size the template rendered with; the design size when it is missing or not a size. */
const baseBodySize = (value?: string): number => {
  const size = value ? parseFloat(value) : NaN;
  return Number.isFinite(size) && size > 0 ? size : BASE_BODY_SIZE_PX;
};
const MARGIN_PADDING_PX: Record<string, number> = { narrow: 18, wide: 56 };
const SPACING_FACTOR: Record<string, number> = { compact: 0.6, relaxed: 1.5 };
const ALIGNMENTS = new Set(["left", "center", "right"]);
const MIN_SPACING_PX = 8; // smaller gaps (line-level nudges) are left alone

const pxOf = (value: string): number | null => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match ? Number(match[1]) : null;
};

/** Scales an inline px style property from its rendered value; restores it when the factor is 1. */
function scaleInlineStyle(el: HTMLElement, property: "fontSize" | "marginBottom", factor: number, minPx = 0): void {
  const key = property === "fontSize" ? "layoutFs" : "layoutMb";
  const appliedKey = `${key}Applied`;
  const current = el.style[property];
  const applied = el.dataset[appliedKey];
  // A value React wrote since our last change is the template's new value: remember it as the original.
  if (el.dataset[key] === undefined || (applied !== undefined && current !== applied)) {
    const px = pxOf(current);
    if (px === null || px < minPx) {
      delete el.dataset[key];
      delete el.dataset[appliedKey];
      return;
    }
    el.dataset[key] = String(px);
  }
  const original = Number(el.dataset[key]);
  const next = factor === 1 ? original : Math.round(original * factor * 100) / 100;
  el.style[property] = `${next}px`;
  el.dataset[appliedKey] = el.style[property];
  if (factor === 1) {
    delete el.dataset[key];
    delete el.dataset[appliedKey];
  }
}

/** Replaces (and restores) the template's own outer padding. */
function applyPagePadding(root: HTMLElement, padding: number | null): void {
  const walker = root.querySelectorAll<HTMLElement>("div");
  for (const el of Array.from(walker).slice(0, 6)) {
    const original = el.dataset.layoutPad !== undefined ? Number(el.dataset.layoutPad) : pxOf(el.style.padding);
    if (original === null || original < 16) continue;
    if (el.dataset.layoutPad === undefined) el.dataset.layoutPad = String(original);
    // One source of truth for the page margin: this hook. "Normal" is the template's own padding (what the
    // export prints), Narrow / Wide replace it. All three are written the same way, !important, so no
    // surrounding class rule can show one of them differently from the others.
    el.style.setProperty("padding", `${padding ?? original}px`, "important");
    if (padding === null) delete el.dataset.layoutPad;
    return; // the template's own root is the first element with that padding
  }
}

function alignElement(el: HTMLElement, alignment: string | null): void {
  if (alignment) {
    if (el.dataset.layoutAlign === undefined) el.dataset.layoutAlign = el.style.textAlign;
    el.style.textAlign = alignment;
  } else if (el.dataset.layoutAlign !== undefined) {
    el.style.textAlign = el.dataset.layoutAlign;
    delete el.dataset.layoutAlign;
  }
}

/** Applies the settings to everything rendered under `root` (exported for tests). */
export function applyPreviewLayout(root: HTMLElement, settings: PreviewLayoutSettings): void {
  const size = validFontSize(settings.fontSize);
  // The export sets the body text to exactly `size` pt, whatever the template's own body size (9px, 10px, 11px)
  const fontFactor = size !== null ? size / baseBodySize(settings.baseFontSize) : 1;
  const spacingFactor = SPACING_FACTOR[settings.sectionSpacing ?? ""] ?? 1;
  const padding = MARGIN_PADDING_PX[settings.pageMargin ?? ""] ?? null;
  const alignment = ALIGNMENTS.has(settings.alignment ?? "") ? (settings.alignment as string) : null;

  applyPagePadding(root, padding);
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.style.fontSize || el.dataset.layoutFs !== undefined) scaleInlineStyle(el, "fontSize", fontFactor);
    if (el.style.marginBottom || el.dataset.layoutMb !== undefined) scaleInlineStyle(el, "marginBottom", spacingFactor, MIN_SPACING_PX);
    // section headings are the bold uppercase titles
    if (el.style.textTransform === "uppercase" && el.tagName !== "H1") alignElement(el, alignment);
  });

  // The header: the name, and the lines around it
  const name = root.querySelector<HTMLElement>("h1");
  const header = name?.parentElement;
  if (name && header && header !== root) {
    alignElement(header, alignment);
    header.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.tagName === "H1" || el.style.textAlign || el.dataset.layoutAlign !== undefined) alignElement(el, alignment);
    });
  }
}

/** Keeps the preview in `rootRef` laid out by the settings, also as the preview re-renders. */
export function usePreviewLayout(
  rootRef: RefObject<HTMLElement | null>,
  settings: PreviewLayoutSettings,
  dependencies: ReadonlyArray<unknown> = [],
): void {
  const { fontSize, pageMargin, sectionSpacing, alignment, baseFontSize } = settings;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      applyPreviewLayout(root, { fontSize, pageMargin, sectionSpacing, alignment, baseFontSize });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    // Only structure changes are watched: the style changes made above never retrigger this.
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, fontSize, pageMargin, sectionSpacing, alignment, baseFontSize, ...dependencies]);
}
