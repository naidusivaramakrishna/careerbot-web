import { slugifySkillCategory } from "@/config/domainSkills";

// The five categories the skills API stores as fixed fields. It routes any name
// that slugifies to one of these (or its singular/plural) to that field instead
// of creating a custom category, and refuses to rename them.
const BUILT_IN_SLUGS = new Set([
  "programming_languages",
  "frameworks",
  "soft_skills",
  "project_management",
  "marketing_sales",
]);

/** True when the skills API would treat `name` as one of the built-in categories. */
export function isBuiltInCategoryName(name: string): boolean {
  const slug = slugifySkillCategory(name.trim());
  return (
    BUILT_IN_SLUGS.has(slug) ||
    BUILT_IN_SLUGS.has(`${slug}s`) ||
    (slug.endsWith("s") && BUILT_IN_SLUGS.has(slug.slice(0, -1)))
  );
}

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: { error?: { message?: string }; detail?: unknown };
  };
};

/**
 * User-facing text for a failed category rename. The API explains why a name is
 * refused (e.g. "...is not a recognized professional skill category. Use a
 * meaningful name like 'DevOps Tools'..."); show that, minus its technical
 * "Validation error on field '...':" prefix, instead of a generic message.
 */
export function renameCategoryErrorMessage(err: unknown, newName: string): string {
  const { response } = (err ?? {}) as ApiErrorShape;
  if (response?.status === 409) return `"${newName}" category already exists`;
  // 400: the API refused the name; 422: request validation (e.g. over 50 characters).
  if (response?.status === 400 || response?.status === 422) {
    const detail = response.data?.detail;
    const raw =
      response.data?.error?.message ??
      (typeof detail === "string" ? detail : (detail as { message?: string } | undefined)?.message);
    const reason = raw?.replace(/^Validation error on field '[^']*':\s*/i, "").trim();
    if (reason) return reason;
    return `"${newName}" is not an allowed category name.`;
  }
  return "Failed to rename category. Please try again.";
}
