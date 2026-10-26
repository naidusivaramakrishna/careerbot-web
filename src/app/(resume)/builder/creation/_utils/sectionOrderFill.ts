import { sectionHasSavedData } from "./sectionPayloadKeys";

/**
 * A section that has content must be in the order the preview and the export are given. A resume whose stored
 * order lacks one (an uploaded resume, an older record) would otherwise lose that section's text, most visibly
 * the summary. Missing sections that have content are added: the summary right after Personal Info, the others
 * at the end, in a fixed order. An empty order is left alone (it means "use the template's own order").
 */
const CORE_SECTIONS: ReadonlyArray<{ name: string; hasContent: (data: Record<string, unknown>) => boolean }> = [
  { name: "Professional Summary", hasContent: (d) => textOf(d.professionalSummary).length > 0 },
  // Skills (a flat list or categories, domain and custom ones included; category metadata alone is not content)
  { name: "Skills", hasContent: (d) => sectionHasSavedData(d, "Skills") },
  { name: "Work Experience", hasContent: (d) => listHas(d.workExperience) },
  { name: "Education", hasContent: (d) => listHas(d.education) },
  { name: "Projects", hasContent: (d) => listHas(d.projects) },
  { name: "Certifications", hasContent: (d) => listHas(d.certifications) },
];

function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const summary = (value as { summary?: unknown }).summary;
    return typeof summary === "string" ? summary.trim() : "";
  }
  return "";
}

function listHas(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => item && typeof item === "object" && Object.values(item as object).some((v) => (typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null && v !== false)));
}

const sameName = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, "") === b.toLowerCase().replace(/[^a-z]/g, "");

export function withFilledCoreSections(order: string[] | undefined, data: unknown): string[] {
  if (!order || order.length === 0 || !data || typeof data !== "object") return order ?? [];
  const resume = data as Record<string, unknown>;
  const missing = CORE_SECTIONS.filter(
    (section) => section.hasContent(resume) && !order.some((name) => sameName(name, section.name)),
  );
  if (missing.length === 0) return order;
  const next = [...order];
  for (const section of missing) {
    if (section.name === "Professional Summary") {
      const afterPersonal = next.findIndex((name) => sameName(name, "Personal Info")) + 1;
      next.splice(afterPersonal, 0, section.name);
    } else {
      next.push(section.name);
    }
  }
  return next;
}
