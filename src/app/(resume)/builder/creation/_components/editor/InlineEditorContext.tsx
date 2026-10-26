"use client";
import { createContext } from "react";

/**
 * Provided by EditorTab while a section form is shown inline (accordion) instead of in the
 * modal. `anchorRef` holds the last button the user clicked inside the form. `overlayHost` is the
 * (positioned) panel the AI suggestions modal should cover; without one it covers the whole page.
 */
export const InlineEditorContext = createContext<{
  anchorRef: { current: HTMLElement | null };
  overlayHost?: HTMLElement | null;
} | null>(null);
