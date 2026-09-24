/* eslint-disable @typescript-eslint/no-explicit-any */
// Local mirrors of the two ADDITIVE resume writes the backend persists when a
// suggestion is applied (job_matcher.py: _resolve_certification_fix ->
// add_resume_certification, and _resolve_new_bullet -> append_resume_bullet).
// Rewrites of existing text are mirrored by replaceBulletText in
// AnalysisContent; these two add something that was never in the preview, so
// without a mirror the downloaded PDF contains it and the preview does not.
// Each mirrors the backend's dedupe and target-selection rules so the preview
// matches the stored document.

export type ResumeSections = Record<string, any>;
export type MirrorStatus = "added" | "present" | "invalid";

// Same order as BULLET_LIST_KEYS in the API's job_matcher_service/repository.py.
const BULLET_LIST_KEYS = ["achievements", "responsibilities", "impact_metrics", "bullets", "highlights", "details"];
export const BULLET_SECTIONS = ["experience", "internships", "projects"];

// Union of the fields the backend's _certification_name and the preview
// template's own "has a name" filter accept.
const CERT_NAME_KEYS = [
  "name", "full_name", "title", "certification", "course_name", "course",
  "certification_name", "certificate_name", "cert_name",
];

export function certificationName(cert: unknown): string {
  if (typeof cert === "string") return cert.trim();
  if (cert && typeof cert === "object") {
    for (const key of CERT_NAME_KEYS) {
      const value = (cert as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// The preview drops nameless certifications before numbering, so a highlight
// index has to count only the named ones.
export function addCertification(
  sections: ResumeSections,
  name: string
): { sections: ResumeSections; status: MirrorStatus; index: number | null } {
  const trimmed = name.trim();
  if (!trimmed) return { sections, status: "invalid", index: null };
  const existing: unknown[] = Array.isArray(sections.certifications) ? sections.certifications : [];
  const lower = trimmed.toLowerCase();
  if (existing.some((c) => certificationName(c).toLowerCase() === lower)) {
    return { sections, status: "present", index: null };
  }
  const next = [...existing, trimmed];
  return {
    sections: { ...sections, certifications: next },
    status: "added",
    index: next.filter((c) => certificationName(c)).length - 1,
  };
}

// `removed` holds the positions (among named certifications) that were taken
// out, for shiftHighlightsAfterRemoval.
export function removeCertification(
  sections: ResumeSections,
  name: string
): { sections: ResumeSections; removed: number[] } {
  const lower = name.trim().toLowerCase();
  const existing: unknown[] = Array.isArray(sections.certifications) ? sections.certifications : [];
  if (!lower) return { sections, removed: [] };
  const removed: number[] = [];
  let displayed = 0;
  const kept = existing.filter((c) => {
    const n = certificationName(c);
    const isMatch = n !== "" && n.toLowerCase() === lower;
    if (isMatch) removed.push(displayed);
    if (n !== "") displayed++;
    return !isMatch;
  });
  return removed.length
    ? { sections: { ...sections, certifications: kept }, removed }
    : { sections, removed };
}

export function shiftHighlightsAfterRemoval(highlights: string[], removed: number[]): string[] {
  const gone = new Set(removed);
  return highlights.flatMap((h) => {
    const idx = Number(h);
    if (!Number.isInteger(idx)) return [h];
    if (gone.has(idx)) return [];
    return [String(idx - removed.filter((r) => r < idx).length)];
  });
}

// The backend writes into the FIRST entry of the section (the most recent
// role), into the first bullet list that entry already has, creating
// `achievements` when it has none.
export function addBullet(
  sections: ResumeSections,
  section: string,
  text: string
): { sections: ResumeSections; status: MirrorStatus; entryIndex: number | null } {
  const trimmed = text.trim();
  const entries = sections[section];
  if (
    !BULLET_SECTIONS.includes(section) || !trimmed ||
    !Array.isArray(entries) || entries.length === 0 || !isPlainObject(entries[0])
  ) {
    return { sections, status: "invalid", entryIndex: null };
  }
  const entry = entries[0];
  const key = BULLET_LIST_KEYS.find((k) => Array.isArray(entry[k])) ?? BULLET_LIST_KEYS[0];
  const list: unknown[] = Array.isArray(entry[key]) ? entry[key] : [];
  if (list.some((b) => typeof b === "string" && b.trim() === trimmed)) {
    return { sections, status: "present", entryIndex: 0 };
  }
  const nextEntry = { ...entry, [key]: [...list, trimmed] };
  return {
    sections: { ...sections, [section]: [nextEntry, ...entries.slice(1)] },
    status: "added",
    entryIndex: 0,
  };
}

export function removeBullet(
  sections: ResumeSections,
  section: string,
  text: string
): { sections: ResumeSections; entryIndexes: number[] } {
  const target = text.trim();
  const entries = sections[section];
  if (!BULLET_SECTIONS.includes(section) || !target || !Array.isArray(entries)) {
    return { sections, entryIndexes: [] };
  }
  const entryIndexes: number[] = [];
  const nextEntries = entries.map((entry: unknown, idx: number) => {
    if (!isPlainObject(entry)) return entry;
    let changed = false;
    const nextEntry: Record<string, any> = { ...entry };
    for (const key of BULLET_LIST_KEYS) {
      const list = entry[key];
      if (!Array.isArray(list)) continue;
      const kept = list.filter((b: unknown) => !(typeof b === "string" && b.trim() === target));
      if (kept.length !== list.length) {
        nextEntry[key] = kept;
        changed = true;
      }
    }
    if (changed) entryIndexes.push(idx);
    return changed ? nextEntry : entry;
  });
  return entryIndexes.length
    ? { sections: { ...sections, [section]: nextEntries }, entryIndexes }
    : { sections, entryIndexes };
}
