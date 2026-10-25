/**
 * What a student-import row says about the section.
 *
 * The column holds the section's NAME as shown on the Sections page (civil-A) or its id; the server
 * (bulk onboarding) resolves either inside the student's department. A column headed "section" or
 * "section_name" is read too, since nobody would call a name column "id". The first column that
 * actually has text wins, so an empty `section_id` column does not hide a filled `section_name`.
 */
export function readSectionReference(values: Record<string, string | undefined>): string | null {
  for (const key of ['section_id', 'section', 'section_name']) {
    const text = (values[key] ?? '').trim();
    if (text) return text;
  }
  return null;
}
