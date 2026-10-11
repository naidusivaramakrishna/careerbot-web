import React from "react";

/**
 * Maps a template section name to the `data-section` key the preview uses to
 * highlight ATS-fixed sections (see PreviewPanel PREVIEW_SECTION_ALIASES).
 */
const SECTION_KEYS: Record<string, string> = {
  "Personal Info": "personal-info",
  "Professional Summary": "summary",
  "Work Experience": "work-experience",
  "Certificates and Clearances": "certifications",
  "Certifications": "certifications",
};

export function previewSectionKey(sectionName: string): string {
  return SECTION_KEYS[sectionName] ?? sectionName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Wraps a rendered section in a marker element. The wrapper is UI-only: it
 * carries no styling of its own, so layout and export output are unchanged.
 */
export function markPreviewSection(sectionName: string, node: React.ReactNode): React.ReactNode {
  if (node === null || node === undefined || node === false) return node;
  return <div data-section={previewSectionKey(sectionName)}>{node}</div>;
}
