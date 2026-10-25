/**
 * Turn the ids on a student row into the names a person can read.
 *
 * A student row carries department_id and section_id. The section id is a
 * 32-character generated string and the department id is a short code, so
 * showing them as-is put "4c64d439..." in the Section column. The college area
 * already loads the departments and sections lists; this resolves against them.
 */
export interface Named {
  id: string;
  name: string;
}

/** id -> name, or null when the id is blank or not in the list. */
export function nameLookup(
  items: readonly Named[] | null | undefined,
): (id: string | null | undefined) => string | null {
  const byId = new Map<string, string>();
  for (const item of items ?? []) {
    if (item?.id && typeof item.name === 'string' && item.name.trim()) {
      byId.set(item.id, item.name.trim());
    }
  }
  return (id) => (id ? (byId.get(id) ?? null) : null);
}
