/**
 * What an "Assign students" request actually did, in words.
 *
 * The server skips students already on the faculty member's roster and returns
 * only the assignments it CREATED. The screen used to print "N students
 * assigned" from the number of ticked rows and ignore the response, so ticking
 * the same students twice looked like a second success.
 */
export function assignmentOutcomeMessage(requested: number, created: number): string {
  const plural = (n: number) => (n === 1 ? 'student' : 'students');
  const already = Math.max(0, requested - created);
  if (created === 0) {
    return requested === 1
      ? 'That student was already assigned to this faculty member. Nothing changed.'
      : `All ${requested} students were already assigned to this faculty member. Nothing changed.`;
  }
  if (already === 0) return `${created} ${plural(created)} assigned.`;
  return `${created} ${plural(created)} newly assigned. ${already} already assigned, left as they were.`;
}

/** The label for a faculty member in a picker.
 *
 *  The account id is ALWAYS part of it, never replaced by the name: the name is
 *  typed by whoever added the person and is not verified against the account, so
 *  on its own it is a label anyone able to add staff could choose. A missing
 *  name reads as "Unnamed faculty member" so the row is not just a hex id. */
export function facultyOptionLabel(member: {
  display_name?: string | null;
  account_id: string;
}, departmentLabel: string | null): string {
  return [member.display_name?.trim() || 'Unnamed faculty member', departmentLabel, member.account_id]
    .filter(Boolean)
    .join(' · ');
}
