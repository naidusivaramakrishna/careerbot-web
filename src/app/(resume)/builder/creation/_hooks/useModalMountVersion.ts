import { useState } from "react";

/**
 * The data version to key EditorTab's open section editor on
 * (`key={`${openModalSection}-${version}`}`), so the editor remounts with
 * fresh data every time a section is opened -- but never while it stays open.
 *
 * It must NOT track the live `enhancedDataVersion`: that counter also bumps
 * whenever this same section's own debounced auto-save round-trips, seconds
 * after any edit, and a remount resets the section's local edit state (e.g.
 * which entry is being edited).
 *
 * The snapshot is taken DURING the render in which `openModalSection`
 * changes (React's "store information from previous renders" pattern). It
 * used to be written into a ref by an effect, i.e. after the first render of
 * the newly opened modal, so that render still used the previous open's
 * version and the next re-render (a keystroke, the auto-save indicator, a
 * sync) changed the key and remounted the editor mid-edit (#83 review P1-3).
 */
export function useModalMountVersion(openModalSection: string | null, enhancedDataVersion: number): number {
  const [snapshot, setSnapshot] = useState({ section: openModalSection, version: enhancedDataVersion });
  if (snapshot.section !== openModalSection) {
    setSnapshot({ section: openModalSection, version: enhancedDataVersion });
    return enhancedDataVersion;
  }
  return snapshot.version;
}
