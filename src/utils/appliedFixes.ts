/**
 * The fixes a person chose to apply, from a record's `applied_fixes` list.
 *
 * A scan in mode "auto" applies the automatic fixes by itself, and flags each one `auto: true`. Those are not
 * "earlier work" of the user, so they must not trigger "You already improved this resume" or make a fresh scan
 * look like it kept saved fixes.
 */
export function userAppliedFixes(list: unknown): unknown[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => !(item && typeof item === "object" && (item as { auto?: unknown }).auto === true));
}

export const countUserAppliedFixes = (list: unknown): number => userAppliedFixes(list).length;
